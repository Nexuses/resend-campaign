import { NextResponse } from "next/server";
import { Resend } from "resend";
import { connectDB } from "@/lib/mongodb";
import { getSettings } from "@/models/Settings";
import { Campaign } from "@/models/Campaign";
import { personalizeHtml, personalizeSubject } from "@/lib/personalize";

type Params = { params: Promise<{ id: string }> };

export const maxDuration = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();

    const settings = await getSettings();
    if (!settings?.resendApiKey || !settings.fromEmail) {
      return NextResponse.json(
        { error: "Configure Resend API key and from email in Settings first" },
        { status: 400 }
      );
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "sending") {
      return NextResponse.json(
        { error: "Campaign is already sending" },
        { status: 409 }
      );
    }

    if (campaign.status === "completed") {
      return NextResponse.json(
        { error: "Campaign already completed" },
        { status: 400 }
      );
    }

    const resend = new Resend(settings.resendApiKey);
    const from = settings.fromName
      ? `${settings.fromName} <${settings.fromEmail}>`
      : settings.fromEmail;

    campaign.status = "sending";
    campaign.startedAt = new Date();
    await campaign.save();

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < campaign.contacts.length; i++) {
      const contact = campaign.contacts[i];
      if (contact.status === "sent") {
        sent += 1;
        continue;
      }

      try {
        const html = personalizeHtml(campaign.html, contact);
        const subject = personalizeSubject(campaign.subject, contact);

        const result = await resend.emails.send({
          from,
          to: contact.email,
          subject,
          html,
        });

        if (result.error) {
          contact.status = "failed";
          contact.error = result.error.message;
          failed += 1;
        } else {
          contact.status = "sent";
          contact.resendId = result.data?.id;
          contact.sentAt = new Date();
          contact.error = undefined;
          sent += 1;
        }
      } catch (err) {
        contact.status = "failed";
        contact.error = err instanceof Error ? err.message : "Send failed";
        failed += 1;
      }

      // Light pacing to stay under Resend rate limits
      if (i < campaign.contacts.length - 1) {
        await sleep(120);
      }

      // Persist periodically so history stays useful mid-blast
      if (i % 10 === 0 || i === campaign.contacts.length - 1) {
        campaign.stats = {
          total: campaign.contacts.length,
          sent,
          failed,
          pending: campaign.contacts.length - sent - failed,
        };
        await campaign.save();
      }
    }

    campaign.stats = {
      total: campaign.contacts.length,
      sent,
      failed,
      pending: campaign.contacts.length - sent - failed,
    };
    campaign.status = failed === campaign.contacts.length ? "failed" : "completed";
    campaign.completedAt = new Date();
    await campaign.save();

    return NextResponse.json({
      ok: true,
      stats: campaign.stats,
      status: campaign.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

type Params = { params: Promise<{ id: string }> };

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const campaign = await Campaign.findById(id).lean();

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const header = [
      "firstname",
      "lastname",
      "company",
      "email",
      "status",
      "resendId",
      "error",
      "sentAt",
    ];

    const lines = [header.join(",")];

    for (const c of campaign.contacts) {
      lines.push(
        [
          csvEscape(c.firstname || ""),
          csvEscape(c.lastname || ""),
          csvEscape(c.company || ""),
          csvEscape(c.email || ""),
          csvEscape(c.status || ""),
          csvEscape(c.resendId || ""),
          csvEscape(c.error || ""),
          csvEscape(c.sentAt ? new Date(c.sentAt).toISOString() : ""),
        ].join(",")
      );
    }

    const filename = `${campaign.name.replace(/[^a-z0-9-_]+/gi, "_")}_stats.csv`;

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export CSV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

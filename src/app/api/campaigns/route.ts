import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Campaign, type IContact, type IColumnMapping } from "@/models/Campaign";

export async function GET() {
  try {
    await connectDB();
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .select("name subject status stats createdAt completedAt startedAt")
      .lean();

    return NextResponse.json({ campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list campaigns";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, subject, html, mapping, rows } = body as {
      name?: string;
      subject?: string;
      html?: string;
      mapping?: IColumnMapping;
      rows?: Record<string, string>[];
    };

    if (!name?.trim() || !subject?.trim() || !html?.trim()) {
      return NextResponse.json(
        { error: "Name, subject, and HTML are required" },
        { status: 400 }
      );
    }

    if (!mapping?.email) {
      return NextResponse.json(
        { error: "Email column mapping is required" },
        { status: 400 }
      );
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "At least one contact is required" },
        { status: 400 }
      );
    }

    const contacts: IContact[] = [];
    const seen = new Set<string>();

    for (const row of rows) {
      const email = (row[mapping.email] || "").trim().toLowerCase();
      if (!email || !email.includes("@") || seen.has(email)) continue;
      seen.add(email);

      contacts.push({
        firstname: mapping.firstname ? (row[mapping.firstname] || "").trim() : "",
        lastname: mapping.lastname ? (row[mapping.lastname] || "").trim() : "",
        company: mapping.company ? (row[mapping.company] || "").trim() : "",
        email,
        status: "pending",
      });
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses found after mapping" },
        { status: 400 }
      );
    }

    await connectDB();
    const campaign = await Campaign.create({
      name: name.trim(),
      subject: subject.trim(),
      html,
      status: "draft",
      mapping,
      contacts,
      stats: {
        total: contacts.length,
        sent: 0,
        failed: 0,
        pending: contacts.length,
      },
    });

    return NextResponse.json({
      id: campaign._id.toString(),
      total: contacts.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

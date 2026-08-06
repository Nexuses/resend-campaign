import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Campaign } from "@/models/Campaign";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const campaign = await Campaign.findById(id).lean();

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await Campaign.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

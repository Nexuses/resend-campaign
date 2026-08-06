import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSettings, Settings } from "@/models/Settings";

export async function GET() {
  try {
    await connectDB();
    const settings = await getSettings();

    if (!settings) {
      return NextResponse.json({
        configured: false,
        fromEmail: "",
        fromName: "",
        hasApiKey: false,
      });
    }

    return NextResponse.json({
      configured: true,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName || "",
      hasApiKey: Boolean(settings.resendApiKey),
      // Masked preview of API key for UI
      apiKeyPreview: settings.resendApiKey
        ? `${settings.resendApiKey.slice(0, 6)}…${settings.resendApiKey.slice(-4)}`
        : "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { resendApiKey, fromEmail, fromName } = body as {
      resendApiKey?: string;
      fromEmail?: string;
      fromName?: string;
    };

    if (!fromEmail || typeof fromEmail !== "string") {
      return NextResponse.json(
        { error: "From email is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const existing = await Settings.findOne();

    const nextKey =
      resendApiKey && resendApiKey.trim().length > 0
        ? resendApiKey.trim()
        : existing?.resendApiKey;

    if (!nextKey) {
      return NextResponse.json(
        { error: "Resend API key is required" },
        { status: 400 }
      );
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      {
        resendApiKey: nextKey,
        fromEmail: fromEmail.trim(),
        fromName: (fromName || "").trim(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      ok: true,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName || "",
      hasApiKey: true,
      apiKeyPreview: `${settings.resendApiKey.slice(0, 6)}…${settings.resendApiKey.slice(-4)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

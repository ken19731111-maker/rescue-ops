import { NextResponse } from "next/server";
import webPush from "web-push";

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "dummy_public_key",
  process.env.VAPID_PRIVATE_KEY || "dummy_private_key"
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, title, message } = body;
    const payload = JSON.stringify({ title, body: message });
    await webPush.sendNotification(subscription, payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
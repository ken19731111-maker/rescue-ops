import { NextResponse } from "next/server";
import webPush from "web-push";

// ❌ export const dynamic = "force-dynamic"; は削除する

const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "dummy_public_key";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "dummy_private_key";

try {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (error) {
  console.error("Failed to set VAPID details:", error);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, title, message } = body;

    if (!subscription) {
      return NextResponse.json({ error: "Subscription is required" }, { status: 400 });
    }

    const payload = JSON.stringify({ title, body: message });

    await webPush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
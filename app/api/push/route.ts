import { NextResponse } from "next/server";
import webPush from "web-push";

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const vapidSubject = process.env.VAPID_SUBJECT;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (vapidSubject && vapidPublicKey && vapidPrivateKey && vapidPublicKey !== "dummy_public_key") {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }

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
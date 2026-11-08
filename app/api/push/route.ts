import { NextResponse } from "next/server";
import webPush from "web-push";

// Cloudflare PagesのランタイムでNode.js互換機能を確実に活かすための設定
export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const vapidSubject = process.env.VAPID_SUBJECT;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    // VAPIDキーが正しく設定されている場合のみセット
    if (
      vapidSubject &&
      vapidPublicKey &&
      vapidPrivateKey &&
      vapidPublicKey !== "dummy_public_key"
    ) {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } else {
      console.warn("VAPID keys are not properly configured.");
      return NextResponse.json(
        { error: "Push notification service is not configured on the server." },
        { status: 500 }
      );
    }

    // リクエストボディの安全なパース
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { subscription, title, message } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Valid push subscription is required" },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: title || "RescueOps Notification",
      body: message || "",
    });

    // プッシュ通知の送信実行
    await webPush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Push notification error details:", error);
    return NextResponse.json(
      { 
        error: "Failed to send notification", 
        details: error?.message || String(error) 
      }, 
      { status: 500 }
    );
  }
}
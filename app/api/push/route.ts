// app/api/push/route.ts
import { NextResponse } from "next/server";
import webPush from "web-push";
import { createClient } from "@supabase/supabase-js";

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT || "ken.c.1173.surf@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BPz5mEADmHOl0FEQX-wisNmAGhZGhkyjdQPFnUU9MlcDRzfmyBehtUsaNDszmwQnZBe6N2E6ta2vl6uq99nMkcQ",
  process.env.VAPID_PRIVATE_KEY || "IpGvZuzSKPFZNpxMkfQO_xfXzy_nD9P48T0JnHK_9mM"
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("subscription");

    if (error || !subscriptions) {
      return NextResponse.json({ error: "通知先の取得に失敗しました" }, { status: 500 });
    }

    const payload = JSON.stringify({ title, body, url: "/" });

    const notifications = subscriptions.map((item) =>
      webPush.sendNotification(item.subscription, payload).catch((err) => {
        console.error("通知送信エラー:", err);
      })
    );

    await Promise.all(notifications);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
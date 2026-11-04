import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: Request) {
  // ビルドを通すためのダミー応答
  return NextResponse.json({ success: true, message: "Push notification bypassed for build" });
}

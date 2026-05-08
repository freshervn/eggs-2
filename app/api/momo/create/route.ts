import { NextRequest, NextResponse } from "next/server";
import { createMoMoPayment } from "@/_lib/momo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { orderId, amount, orderInfo, redirectUrl, ipnUrl, userInfo } = body;

    if (!orderId || !amount || !orderInfo || !redirectUrl || !ipnUrl) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["orderId", "amount", "orderInfo", "redirectUrl", "ipnUrl"],
        },
        { status: 400 }
      );
    }

    const nuoiMeoEnabled = (process.env.NUOI_MEO_ENABLED || "true").trim() !== "false";
    if (!nuoiMeoEnabled && String(orderId).startsWith("donate-")) {
      return NextResponse.json(
        { error: "Nuoi Meo donations are disabled" },
        { status: 403 }
      );
    }

    const amountNum = typeof amount === "string" ? parseInt(amount, 10) : amount;
    if (isNaN(amountNum) || amountNum < 1000 || amountNum > 50_000_000) {
      return NextResponse.json(
        { error: "Amount must be between 1,000 and 50,000,000 VND" },
        { status: 400 }
      );
    }

    const result = await createMoMoPayment({
      orderId: String(orderId),
      amount: amountNum,
      orderInfo: String(orderInfo),
      redirectUrl: String(redirectUrl),
      ipnUrl: String(ipnUrl),
      userInfo,
      lang: body.lang || "vi",
    });

    if (result.resultCode !== 0) {
      return NextResponse.json(
        { error: result.message || "MoMo payment creation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payUrl: result.payUrl,
      shortLink: result.shortLink,
      orderId: result.orderId,
      message: result.message,
    });
  } catch (error) {
    console.error("MoMo create error:", error);
    return NextResponse.json(
      {
        error: "Failed to create MoMo payment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

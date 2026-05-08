import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { realtimeAdminDB } from "@/_lib/firebase/Admin";

const SECRET_KEY = process.env.MOMO_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body;

    const accessKey = process.env.MOMO_ACCESS_KEY || "";
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData || ""}&message=${message || ""}&orderId=${orderId}&orderInfo=${orderInfo || ""}&orderType=${orderType || ""}&partnerCode=${partnerCode}&payType=${payType || ""}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(rawSignature)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ resultCode: 97, message: "Invalid signature" }, { status: 400 });
    }

    if (resultCode === 0) {
      if (orderId.startsWith("donate-")) {
        const nuoiMeoEnabled = (process.env.NUOI_MEO_ENABLED || "true").trim() !== "false";
        if (!nuoiMeoEnabled) {
          return NextResponse.json({ resultCode: 0, message: "Success" });
        }

        const donationRef = realtimeAdminDB.ref("donations").push();
        await donationRef.set({
          name: "Khách",
          amount: amount,
          message: "Quyên góp qua MoMo",
          createdAt: Date.now(),
          momoTransId: transId,
        });
      } else {
        const orderRef = realtimeAdminDB.ref(`orders/${orderId}`);
        await orderRef.update({
          status: "NOT_DELIVERED",
          momoTransId: transId,
          paidAt: Date.now(),
        });
      }
    }

    return NextResponse.json({ resultCode: 0, message: "Success" });
  } catch (error) {
    console.error("MoMo IPN error:", error);
    return NextResponse.json(
      { resultCode: 99, message: "Unknown error" },
      { status: 500 }
    );
  }
}

"use client";

import axios from "axios";

export interface CreateMoMoPaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  userInfo?: {
    name?: string;
    phoneNumber?: string;
    email?: string;
  };
}

export async function createMoMoPayment(
  params: CreateMoMoPaymentParams
): Promise<{ payUrl: string; shortLink?: string }> {
  const response = await axios.post("/api/momo/create", params, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.data.payUrl) {
    throw new Error(response.data.error || "Failed to create MoMo payment");
  }

  return {
    payUrl: response.data.payUrl,
    shortLink: response.data.shortLink,
  };
}

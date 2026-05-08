import crypto from "crypto";

const MOMO_BASE_URL =
  (process.env.MOMO_BASE_URL || "https://test-payment.momo.vn").trim();
const PARTNER_CODE = (process.env.MOMO_PARTNER_CODE || "").trim();
const ACCESS_KEY = (process.env.MOMO_ACCESS_KEY || "").trim();
const SECRET_KEY = (process.env.MOMO_SECRET_KEY || "").trim();
const STORE_ID = (process.env.MOMO_STORE_ID || "eggs-store").trim();
const PARTNER_NAME = (process.env.MOMO_PARTNER_NAME || "Eggs").trim();

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
  userInfo?: {
    name?: string;
    phoneNumber?: string;
    email?: string;
  };
  lang?: "vi" | "en";
}

export interface CreatePaymentResponse {
  resultCode: number;
  message: string;
  payUrl?: string;
  shortLink?: string;
  requestId?: string;
  orderId?: string;
  amount?: number;
  responseTime?: number;
  partnerCode?: string;
}

function createSignature(params: Record<string, string | number>): string {
  const sortedKeys = Object.keys(params).sort();
  const rawSignature = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto
    .createHmac("sha256", SECRET_KEY)
    .update(rawSignature)
    .digest("hex");
}

export async function createMoMoPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResponse> {
  const requestId = `${params.orderId}_${Date.now()}`;

  const body: Record<string, string | number | object> = {
    partnerCode: PARTNER_CODE,
    partnerName: PARTNER_NAME,
    storeId: STORE_ID,
    requestType: "payWithMethod",
    requestId,
    orderId: params.orderId,
    amount: params.amount,
    orderInfo: params.orderInfo,
    redirectUrl: params.redirectUrl,
    ipnUrl: params.ipnUrl,
    extraData: params.extraData || "",
    lang: params.lang || "vi",
  };

  if (params.userInfo) {
    body.userInfo = params.userInfo;
  }

  const signatureParams: Record<string, string | number> = {
    accessKey: ACCESS_KEY,
    amount: params.amount,
    extraData: params.extraData || "",
    ipnUrl: params.ipnUrl,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    partnerCode: PARTNER_CODE,
    redirectUrl: params.redirectUrl,
    requestId,
    requestType: "payWithMethod",
  };

  const signature = createSignature(signatureParams);
  body.signature = signature;

  const logPayload = {
    url: `${MOMO_BASE_URL}/v2/gateway/api/create`,
    partnerCode: PARTNER_CODE,
    storeId: STORE_ID,
    requestType: "payWithMethod",
    requestId,
    orderId: params.orderId,
    amount: params.amount,
    orderInfo: params.orderInfo,
    redirectUrl: params.redirectUrl,
    ipnUrl: params.ipnUrl,
    accessKey: ACCESS_KEY ? `${ACCESS_KEY.slice(0, 4)}***` : "(empty)",
    rawSignature: Object.keys(signatureParams)
      .sort()
      .map((k) => `${k}=${k === "accessKey" ? "***" : signatureParams[k]}`)
      .join("&"),
  };
  console.log("[MoMo] Request:", JSON.stringify(logPayload, null, 2));

  const response = await fetch(`${MOMO_BASE_URL}/v2/gateway/api/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as CreatePaymentResponse & {
    resultCode?: number;
    responseTime?: number;
    signature?: string;
    partnerCode?: string;
  };

  console.log("[MoMo] Response:", {
    status: response.status,
    resultCode: data.resultCode,
    message: data.message,
  });

  if (!response.ok) {
    throw new Error(data.message || "MoMo API request failed");
  }

  if (data.resultCode !== undefined && data.resultCode !== 0) {
    throw new Error(data.message || "MoMo API request failed");
  }

  if (data.signature && data.resultCode === 0) {
    const responseSignatureParams: Record<string, string | number> = {
      accessKey: ACCESS_KEY,
      amount: data.amount ?? params.amount,
      orderId: data.orderId ?? params.orderId,
      partnerCode: data.partnerCode ?? PARTNER_CODE,
      payUrl: data.payUrl ?? "",
      requestId: data.requestId ?? "",
      responseTime: data.responseTime ?? 0,
      resultCode: data.resultCode ?? 0,
    };
    const expectedSig = createSignature(responseSignatureParams);
    if (data.signature !== expectedSig) {
      console.warn("[MoMo] Response signature mismatch - verify manually");
    }
  }

  return data;
}

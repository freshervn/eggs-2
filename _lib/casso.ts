export const CASSO_PUBLIC_EMBED_ID =
  process.env.NEXT_PUBLIC_CASSO_PUBLIC_EMBED_ID ??
  process.env.CASSO_PUBLIC_EMBED_ID ??
  "422a8cb8-f53d-41ff-b346-60c7aca60133";

export const CASSO_PUBLIC_URL = `https://public.casso.vn/${CASSO_PUBLIC_EMBED_ID}`;

/** Only Casso rows whose description contains this text are stored. */
export const CASSO_SAVE_CONTENT_PREFIX = "nuoimeo";

export type CassoTransaction = {
  cassoId?: number;
  tid?: string;
  description: string;
  amount: number;
  balance?: number;
  when?: string;
  accountNumber?: string;
  bankName?: string;
  source: "webhook" | "manual" | "sync";
  createdAt: number;
};

type CassoWebhookV1Transaction = {
  id?: number;
  tid?: string;
  description?: string;
  amount?: number;
  cusum_balance?: number;
  when?: string;
  bank_sub_acc_id?: string;
  subAccId?: string;
  bankName?: string;
};

type CassoWebhookV2Transaction = {
  id?: number;
  reference?: string;
  description?: string;
  amount?: number;
  runningBalance?: number;
  transactionDateTime?: string;
  accountNumber?: string;
  bankName?: string;
};

export function verifyCassoSecureToken(headerToken: string | null): boolean {
  const expected = process.env.CASSO_SECURE_TOKEN?.trim();
  if (!expected) return true;
  return headerToken === expected;
}

export function normalizeWebhookTransactions(body: {
  error?: number;
  data?: unknown;
}): CassoWebhookV1Transaction[] {
  if (body.error !== 0 || !body.data) return [];

  if (Array.isArray(body.data)) {
    return body.data as CassoWebhookV1Transaction[];
  }

  const tx = body.data as CassoWebhookV2Transaction;
  return [
    {
      id: tx.id,
      tid: tx.reference,
      description: tx.description,
      amount: tx.amount,
      cusum_balance: tx.runningBalance,
      when: tx.transactionDateTime,
      bank_sub_acc_id: tx.accountNumber,
      subAccId: tx.accountNumber,
      bankName: tx.bankName,
    },
  ];
}

export function parseSenderFromDescription(description: string): string {
  const trimmed = description.trim();
  const withoutPrefix = trimmed.replace(
    new RegExp(`^${CASSO_SAVE_CONTENT_PREFIX}\\s+`, "i"),
    ""
  );
  const match = withoutPrefix.match(/^(.+?)\s+(chuyen|chuyển|ck|transfer)/i);
  if (match) return match[1].trim();
  return withoutPrefix;
}

export function parseCassoWhen(when?: string): number {
  if (!when) return 0;
  const parsed = Date.parse(when);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function shouldSaveCassoDescription(description: string): boolean {
  return description
    .trim()
    .toLowerCase()
    .includes(CASSO_SAVE_CONTENT_PREFIX);
}

export function cassoDedupKey(tx: CassoTransaction & { id?: string }): string {
  if (tx.cassoId != null) return `id:${tx.cassoId}`;
  if (tx.tid) return `tid:${tx.tid}`;
  return `raw:${tx.description}|${tx.amount}|${tx.when ?? ""}`;
}

export function toStoredTransaction(
  tx: CassoWebhookV1Transaction,
  source: "webhook" | "manual"
): CassoTransaction {
  return {
    cassoId: tx.id,
    tid: tx.tid,
    description: tx.description ?? "",
    amount: tx.amount ?? 0,
    balance: tx.cusum_balance,
    when: tx.when,
    accountNumber: tx.bank_sub_acc_id ?? tx.subAccId,
    bankName: tx.bankName,
    source,
    createdAt: Date.now(),
  };
}

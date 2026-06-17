import {
  CASSO_PUBLIC_EMBED_ID,
  CASSO_PUBLIC_URL,
  parseCassoWhen,
  shouldSaveCassoDescription,
  type CassoTransaction,
} from "@/_lib/casso";
import { realtimeAdminDB } from "@/_lib/firebase/Admin";

type PublicEmbedTransaction = {
  id: number;
  when: string;
  tid: string;
  description: string;
  amount: string | number;
  bank_sub_acc_id?: string;
};

type ApiTransaction = {
  id?: number;
  tid?: string;
  description?: string;
  amount?: number;
  cusum_balance?: number;
  cusumBalance?: number;
  when?: string;
  bank_sub_acc_id?: string;
  bankSubAccId?: string;
};

export type CassoSyncResult = {
  fetched: number;
  stored: number;
  incoming: number;
  outgoing: number;
};

async function getLastSyncWhen(): Promise<number> {
  const snap = await realtimeAdminDB.ref("casso/sync/lastWhen").once("value");
  const value = snap.val();
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function selectTransactionsAfter<T extends { when?: string }>(
  transactions: T[],
  lastWhen: number
): { items: T[]; maxWhen: number } {
  let maxWhen = lastWhen;
  const items: T[] = [];

  for (const tx of transactions) {
    const whenMs = parseCassoWhen(tx.when);
    if (whenMs <= lastWhen) continue;
    items.push(tx);
    if (whenMs > maxWhen) maxWhen = whenMs;
  }

  return { items, maxWhen };
}

export async function fetchPublicEmbedTransactions(): Promise<
  PublicEmbedTransaction[]
> {
  const res = await fetch(CASSO_PUBLIC_URL, {
    headers: { "User-Agent": "eggs-casso-sync/1.0" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Casso public page returned ${res.status}`);
  }

  const html = await res.text();
  const match = html.match(/var transaction = (\[[\s\S]*?\]);/);
  if (!match) return [];

  return JSON.parse(match[1]) as PublicEmbedTransaction[];
}

function toStoredFromPublic(tx: PublicEmbedTransaction): CassoTransaction {
  const amount =
    typeof tx.amount === "string" ? Number(tx.amount) : tx.amount;

  return {
    cassoId: tx.id,
    tid: tx.tid,
    description: tx.description,
    amount: Number.isFinite(amount) ? amount : 0,
    when: tx.when,
    accountNumber: tx.bank_sub_acc_id,
    source: "sync",
    createdAt: parseCassoWhen(tx.when) || Date.now(),
  };
}

function toStoredFromApi(tx: ApiTransaction): CassoTransaction | null {
  if (tx.id == null) return null;

  const amount = typeof tx.amount === "number" ? tx.amount : 0;

  return {
    cassoId: tx.id,
    tid: tx.tid,
    description: tx.description ?? "",
    amount,
    balance: tx.cusum_balance ?? tx.cusumBalance,
    when: tx.when,
    accountNumber: tx.bank_sub_acc_id ?? tx.bankSubAccId,
    source: "sync",
    createdAt: parseCassoWhen(tx.when) || Date.now(),
  };
}

async function persistSyncBatch(
  updates: Record<string, unknown>,
  maxWhen: number,
  fetched: number,
  stored: number,
  incoming: number,
  outgoing: number
): Promise<CassoSyncResult> {
  updates["casso/sync/lastAt"] = Date.now();
  updates["casso/sync/lastCount"] = fetched;
  if (maxWhen > 0) {
    updates["casso/sync/lastWhen"] = maxWhen;
  }

  if (Object.keys(updates).length > 0) {
    await realtimeAdminDB.ref().update(updates);
  }

  return { fetched, stored, incoming, outgoing };
}

export async function syncCassoFromPublicEmbed(): Promise<CassoSyncResult> {
  const [transactions, lastWhen] = await Promise.all([
    fetchPublicEmbedTransactions(),
    getLastSyncWhen(),
  ]);

  if (transactions.length === 0) {
    return { fetched: 0, stored: 0, incoming: 0, outgoing: 0 };
  }

  const { items: newTransactions, maxWhen } = selectTransactionsAfter(
    transactions,
    lastWhen
  );

  const updates: Record<string, unknown> = {
    "casso/account/publicEmbedId": CASSO_PUBLIC_EMBED_ID,
    "casso/account/updatedAt": Date.now(),
  };

  let stored = 0;
  let incoming = 0;
  let outgoing = 0;

  for (const tx of newTransactions) {
    if (!shouldSaveCassoDescription(tx.description)) continue;

    const record = toStoredFromPublic(tx);
    if (record.amount > 0) incoming += 1;
    else outgoing += 1;
    updates[`casso/transactions/${tx.id}`] = record;
    stored += 1;
  }

  return persistSyncBatch(
    updates,
    maxWhen,
    newTransactions.length,
    stored,
    incoming,
    outgoing
  );
}

/** Pull from Casso OAuth API when CASSO_API_KEY is set. */
export async function syncCassoFromApi(): Promise<CassoSyncResult | null> {
  const apiKey = process.env.CASSO_API_KEY?.trim();
  if (!apiKey) return null;

  const lastWhen = await getLastSyncWhen();
  const fromDate = new Date(lastWhen > 0 ? lastWhen : Date.now() - 30 * 86_400_000);

  const url = new URL("https://oauth.casso.vn/v2/transactions");
  url.searchParams.set("fromDate", fromDate.toISOString().slice(0, 10));
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("sort", "DESC");

  const res = await fetch(url, {
    headers: { Authorization: `Apikey ${apiKey}` },
    cache: "no-store",
  });

  const body = await res.json();
  if (!res.ok || body.error !== 0) {
    throw new Error(body.message || "Casso API sync failed");
  }

  const records = (body.data?.records ?? []) as ApiTransaction[];
  const { items: newTransactions, maxWhen } = selectTransactionsAfter(
    records,
    lastWhen
  );

  const updates: Record<string, unknown> = {};
  let stored = 0;
  let incoming = 0;
  let outgoing = 0;

  for (const tx of newTransactions) {
    const description = tx.description ?? "";
    if (!shouldSaveCassoDescription(description)) continue;

    const record = toStoredFromApi(tx);
    if (!record) continue;

    if (record.amount > 0) incoming += 1;
    else outgoing += 1;
    updates[`casso/transactions/${tx.id}`] = record;
    stored += 1;
  }

  return persistSyncBatch(
    updates,
    maxWhen,
    newTransactions.length,
    stored,
    incoming,
    outgoing
  );
}

export async function syncCassoTransactions(): Promise<CassoSyncResult> {
  const apiResult = await syncCassoFromApi();
  if (apiResult) return apiResult;
  return syncCassoFromPublicEmbed();
}

import { realtimeDB } from "@/_lib/firebase/client";
import { cassoDedupKey, type CassoTransaction } from "@/_lib/casso";
import type { MoneyInEntry } from "@/app/api/thu-tien/route";
import { ref, onValue } from "firebase/database";

export type StoredCassoTransaction = CassoTransaction & { id: string };
export type StoredMoneyInEntry = MoneyInEntry & { id: string };

function dedupeCassoTransactions(
  list: StoredCassoTransaction[]
): StoredCassoTransaction[] {
  const seen = new Set<string>();
  const result: StoredCassoTransaction[] = [];

  for (const tx of list) {
    const key = cassoDedupKey(tx);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tx);
  }

  return result;
}

export function subscribeCassoTransactions(
  callback: (transactions: StoredCassoTransaction[]) => void
) {
  const txRef = ref(realtimeDB, "casso/transactions");

  return onValue(txRef, (snapshot) => {
    const data = snapshot.val();
    const list = data
      ? Object.entries(data)
          .map(([id, item]) => ({ id, ...(item as CassoTransaction) }))
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      : [];
    callback(dedupeCassoTransactions(list));
  });
}

export function subscribeMoneyIn(
  callback: (entries: StoredMoneyInEntry[]) => void
) {
  const entriesRef = ref(realtimeDB, "money-in");

  return onValue(entriesRef, (snapshot) => {
    const data = snapshot.val();
    const list = data
      ? Object.entries(data)
          .map(([id, item]) => ({ id, ...(item as MoneyInEntry) }))
          .sort((a, b) => b.createdAt - a.createdAt)
      : [];
    callback(list);
  });
}

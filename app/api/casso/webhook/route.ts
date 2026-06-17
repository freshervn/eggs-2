import { NextRequest, NextResponse } from "next/server";
import { realtimeAdminDB } from "@/_lib/firebase/Admin";
import {
  normalizeWebhookTransactions,
  parseCassoWhen,
  shouldSaveCassoDescription,
  toStoredTransaction,
  verifyCassoSecureToken,
} from "@/_lib/casso";

export async function POST(request: NextRequest) {
  try {
    const secureToken = request.headers.get("secure-token");
    if (!verifyCassoSecureToken(secureToken)) {
      return NextResponse.json({ error: "Invalid secure token" }, { status: 401 });
    }

    const body = await request.json();
    const incoming = normalizeWebhookTransactions(body);

    if (incoming.length === 0) {
      return NextResponse.json({ success: true, stored: 0 });
    }

    const updates: Record<string, unknown> = {};
    let stored = 0;
    let latestBalance: number | undefined;
    let latestWhen = 0;

    for (const tx of incoming) {
      const whenMs = parseCassoWhen(tx.when);
      if (whenMs > latestWhen) latestWhen = whenMs;

      if (!shouldSaveCassoDescription(tx.description ?? "")) continue;

      const record = toStoredTransaction(tx, "webhook");
      const key =
        tx.id != null ? String(tx.id) : realtimeAdminDB.ref("casso/transactions").push().key;

      if (!key) continue;

      updates[`casso/transactions/${key}`] = record;
      stored += 1;

      if (typeof tx.cusum_balance === "number") {
        latestBalance = tx.cusum_balance;
      }
    }

    if (latestBalance != null) {
      updates["casso/account/balance"] = latestBalance;
      updates["casso/account/updatedAt"] = Date.now();
    }

    if (latestWhen > 0) {
      const lastWhenSnap = await realtimeAdminDB
        .ref("casso/sync/lastWhen")
        .once("value");
      const lastWhen =
        typeof lastWhenSnap.val() === "number" ? lastWhenSnap.val() : 0;
      if (latestWhen > lastWhen) {
        updates["casso/sync/lastWhen"] = latestWhen;
      }
    }

    if (Object.keys(updates).length > 0) {
      await realtimeAdminDB.ref().update(updates);
    }

    return NextResponse.json({ success: true, stored });
  } catch (error) {
    console.error("Casso webhook error:", error);
    return NextResponse.json(
      {
        error: "Failed to process Casso webhook",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

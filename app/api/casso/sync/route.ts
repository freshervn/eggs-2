import { NextResponse } from "next/server";
import { syncCassoTransactions } from "@/_lib/casso/sync";

export async function POST() {
  try {
    const result = await syncCassoTransactions();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Casso sync error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync Casso",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

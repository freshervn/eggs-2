import { NextRequest, NextResponse } from "next/server";
import { realtimeAdminDB } from "@/_lib/firebase/Admin";

// POST /api/donate - Create a new donation (in Realtime Database)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation (optional, but helpful)
    if (
      !body ||
      typeof body.amount !== "number" ||
      body.amount <= 0 ||
      !body.name ||
      typeof body.name !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid donation data" },
        { status: 400 }
      );
    }

    // Prepare donation object
    const donation = {
      name: body.name,
      amount: body.amount,
      message: typeof body.message === "string" ? body.message : "",
      createdAt: Date.now(),
    };

    // Push to donations collection
    const ref = realtimeAdminDB.ref("donations").push();
    await ref.set(donation);

    return NextResponse.json(
      { success: true, donationId: ref.key, message: "Donation received" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to record donation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/donate - Get total amount donated (sum all 'amount' in "donations")
export async function GET() {
  try {
    const snapshot = await realtimeAdminDB.ref("donations").once("value");
    const data = snapshot.val();

    // Calculate total
    let total = 0;
    if (data) {
      total = (Object.values(data) as any[]).reduce((sum, donation) => {
        const amt = typeof donation.amount === "number" ? donation.amount : 0;
        return sum + amt;
      }, 0);
    }

    return NextResponse.json(
      { success: true, total, message: "Fetched donation total" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get donation total",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

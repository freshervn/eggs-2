import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/_lib/firebase/Admin";

const db = admin.firestore();

// API endpoint to add people who can get notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Add new document or update existing with the same id
    await db.collection("Notification_ID").add({ id });

    return NextResponse.json(
      { success: true, message: "Notification recipient added", id },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to add notification recipient",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


// GET list of all notification recipients
export async function GET() {
  try {
    const snapshot = await db.collection("Notification_ID").get();
    const recipients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ recipients });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch notification recipients",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

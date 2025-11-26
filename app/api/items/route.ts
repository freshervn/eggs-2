import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { admin } = await import("@/_lib/firebase/Admin");
    const db = admin.firestore();
    const snapshot = await db.collection("Items").get();
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error || "Failed to fetch items from database" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, img, price } = body;

    if (!name || !img || typeof price !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Lazy import firebase admin to avoid Next.js issues
    try {
      const { admin } = await import("@/_lib/firebase/Admin");
      const db = admin.firestore();

      const docRef = await db.collection("items").add({
        name,
        img,
        price,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const newItemSnap = await docRef.get();
      const newItem = {
        id: docRef.id,
        ...newItemSnap.data(),
      };

      return NextResponse.json({ item: newItem }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: error || "Failed to create item in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error || "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, img, price } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing item id" },
        { status: 400 }
      );
    }

    // Lazy import firebase admin to avoid Next.js issues
    try {
      const { admin } = await import("@/_lib/firebase/Admin");
      const db = admin.firestore();

      const docRef = db.collection("items").doc(id);

      const updateData: Record<string, unknown> = {};
      if (typeof name === "string") updateData.name = name;
      if (typeof img === "string") updateData.img = img;
      if (typeof price === "number") updateData.price = price;
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      await docRef.update(updateData);
      const updatedSnap = await docRef.get();

      if (!updatedSnap.exists) {
        return NextResponse.json(
          { error: "Item not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          item: {
            id: updatedSnap.id,
            ...updatedSnap.data(),
          }
        },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { error: error || "Failed to update item in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error || "Invalid request body" },
      { status: 400 }
    );
  }
}

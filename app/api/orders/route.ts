import { NextRequest, NextResponse } from "next/server";
import {
  getDocuments,
  queryHelpers,
  FirestoreDocument,
} from "@/_lib/firebase/firestore";
import { admin } from "@/_lib/firebase";
import { sendMessage } from "../facebook/message/route";

const db = admin.firestore();

export interface OrderData extends FirestoreDocument {
  items: Array<{
    id: string | number;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: "pending" | "completed" | "cancelled";
  paymentMethod?: string;
  paymentUrl?: string;
  deliveryAddress?: {
    name: string;
    phone: string;
    address: string;
  };
}
// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Items are required and must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!body.total || typeof body.total !== "number") {
      return NextResponse.json(
        { error: "Total is required and must be a number" },
        { status: 400 }
      );
    }

    // Add order to Firestore
    const orderId = await db
      .collection("orders")
      .add(body as Omit<OrderData, "id">);

    // Retrieve all documents from the "Notification_ID" collection
    const notificationSnapshot = await db.collection("Notification_ID").get();
    const notificationIds = notificationSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    notificationIds.map(async (doc) => {
      await sendMessage(
        doc.id,
        `Bạn có một đơn hàng mới: 
        Khách hàng: ${body.deliveryAddress?.name}
        Điện thoại: ${body.deliveryAddress?.phone}
        Địa chỉ:${body.deliveryAddress.address}
        ${body.items
          .map(
            (item: { name: string; quantity: number }) =>
              `${item.name} x${item.quantity}`
          )
          .join(", ")}
        `
      );
    });

    return NextResponse.json(
      {
        success: true,
        orderId,
        message: "Order created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/orders - Get all orders or filter by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limitParam = searchParams.get("limit");

    const constraints = [];

    if (status) {
      constraints.push(queryHelpers.where("status", "==", status));
    }

    constraints.push(queryHelpers.orderBy("createdAt", "desc"));

    if (limitParam) {
      const limitValue = parseInt(limitParam, 10);
      if (!isNaN(limitValue) && limitValue > 0) {
        constraints.push(queryHelpers.limit(limitValue));
      }
    }

    const orders = await getDocuments<OrderData>("orders", constraints);

    return NextResponse.json(
      {
        success: true,
        orders,
        count: orders.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get orders",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

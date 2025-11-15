import { NextRequest, NextResponse } from "next/server";
import {
  addDocument,
  getDocuments,
  queryHelpers,
  FirestoreDocument,
} from "@/_lib/firebase/firestore";

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

    // Create order data - only include fields that have values (Firestore doesn't accept undefined)
    const orderData: Partial<OrderData> = {
      items: body.items,
      total: body.total,
      status: "pending",
    };

    // Only add optional fields if they exist
    if (body.paymentMethod) {
      orderData.paymentMethod = body.paymentMethod;
    }
    if (body.paymentUrl) {
      orderData.paymentUrl = body.paymentUrl;
    }
    if (body.deliveryAddress) {
      orderData.deliveryAddress = body.deliveryAddress;
    }

    // Add order to Firestore
    const orderId = await addDocument(
      "orders",
      orderData as Omit<OrderData, "id">
    );

    return NextResponse.json(
      {
        success: true,
        orderId,
        message: "Order created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
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
    console.error("Error getting orders:", error);
    return NextResponse.json(
      {
        error: "Failed to get orders",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

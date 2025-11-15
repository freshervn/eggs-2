import { NextRequest, NextResponse } from "next/server";
import {
  getDocument,
  updateDocument,
  deleteDocument,
} from "@/_lib/firebase/firestore";
import { OrderData } from "../route";

// GET /api/orders/[orderId] - Get a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await getDocument<OrderData>("orders", orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        order,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting order:", error);
    return NextResponse.json(
      {
        error: "Failed to get order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[orderId] - Update an order
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const body = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (
      body.status &&
      !["pending", "completed", "cancelled"].includes(body.status)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be 'pending', 'completed', or 'cancelled'",
        },
        { status: 400 }
      );
    }

    // Prepare update data (only allow updating specific fields)
    const updateData: Partial<OrderData> = {};

    if (body.status) updateData.status = body.status;
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod;
    if (body.paymentUrl) updateData.paymentUrl = body.paymentUrl;

    await updateDocument("orders", orderId, updateData);

    return NextResponse.json(
      {
        success: true,
        message: "Order updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      {
        error: "Failed to update order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[orderId] - Delete an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    await deleteDocument("orders", orderId);

    return NextResponse.json(
      {
        success: true,
        message: "Order deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      {
        error: "Failed to delete order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { realtimeAdminDB } from "@/_lib/firebase/Admin";

export async function PATCH(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const pathSegments = pathname.split("/");
    const orderId = pathSegments[pathSegments.length - 1];
    console.log(orderId);
    if (!orderId) {
      return NextResponse.json(
        { error: "orderID is required" },
        { status: 400 }
      );
    }
    const updates = await request.json();
    const orderRef = realtimeAdminDB.ref(`orders/${orderId}`);
    await orderRef.update(updates);

    return NextResponse.json({ success: true, message: "Order updated" });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update order",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { orderID: string } }
// ) {
//   try {
//     const orderId = params.orderID;
//     if (!orderId) {
//       return NextResponse.json(
//         { error: "orderID is required" },
//         { status: 400 }
//       );
//     }
//     const orderRef = realtimeAdminDB.ref(`orders/${orderId}`);
//     const snapshot = await orderRef.once("value");
//     if (!snapshot.exists()) {
//       return NextResponse.json({ error: "Order not found" }, { status: 404 });
//     }
//     const data = snapshot.val();
//     return NextResponse.json({ order: { id: orderId, ...data } });
//   } catch (error) {
//     return NextResponse.json(
//       {
//         error: "Failed to get order",
//         message: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }

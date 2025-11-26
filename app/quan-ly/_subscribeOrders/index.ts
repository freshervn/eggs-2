import { realtimeDB } from "@/_lib/firebase/client";
import { OrderData } from "@/app/api/orders/route";
import { ref, onValue } from "firebase/database";
export function subscribeOrders(callback: (orders: OrderData[]) => void) {
  const ordersRef = ref(realtimeDB, "orders");

  const unsubscribe = onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    const list = data
      ? Object.entries(data).map(([id, item]) => ({
          id,
          ...(item as OrderData),
        }))
      : [];
    callback(list);
  });

  return unsubscribe; // call this to stop listening
}

export function getOrdersByStatus(
  status: string,
  callback: (orders: OrderData[]) => void
) {
  const ordersRef = ref(realtimeDB, "orders");

  const unsubscribe = onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    const list = data
      ? Object.entries(data)
          .map(([id, item]) => ({
            id,
            ...(item as OrderData),
          }))
          .filter((order) => order.status === status)
      : [];
    callback(list);
  });

  return unsubscribe;
}

"use client";
import { useEffect, useState } from "react";
import { OrderData } from "../api/orders/route";
import classNames from "classnames";
import { updateOrder } from "@/_lib/api/orders";
import { subscribeOrders } from "./_subscribeOrders";
export default function Home() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  useEffect(() => {
    const unsubscribe = subscribeOrders((orders) => {
      setOrders(orders as OrderData[]);
    });

    return () => {
      // unsubscribe could be a function or the return value from onValue
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);
  const OderDilivered = (order: OrderData) => {
    updateOrder(String(order.id), { ...order, status: "UNPAID" });
  };
  const finshed = (order: OrderData) => {
    updateOrder(String(order.id), { ...order, status: "FINISHED" });
  };

  return (
    <div className="text-black py-4">
      <h2 className="text-center text-3xl mb-8 mt-4">Đơn hàng</h2>
      {orders.length === 0 && <p>Chưa có đơn nào</p>}
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={classNames("p-4 rounded-md", {
              "bg-yellow-300": order?.status === "NOT_DELIVERED",
              "bg-red-300": order?.status === "UNPAID",
              "bg-gray-500": order?.status === "FINISHED",
            })}
          >
            <div className="grid grid-cols-2">
              <aside>
                {order.items && Array.isArray(order.items) ? (
                  <>
                    <div>
                      {order.items.map(
                        (
                          item: {
                            id: string | number;
                            name: string;
                            price: number;
                            quantity: number;
                          },
                          idx: number
                        ) => (
                          <div key={idx}>
                            <strong>{item.name}</strong> : {item.price} x{" "}
                            {item.quantity}
                          </div>
                        )
                      )}
                    </div>
                    <div>
                      <strong>Total:</strong> {order.total}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      {order.status === "UNPAID"
                        ? "còn nợ"
                        : order.status === "NOT_DELIVERED"
                        ? "chờ giao"
                        : "hoàn thành"}
                    </div>
                  </>
                ) : (
                  "Invalid order data"
                )}
              </aside>
              <aside className="flex flex-col gap-4">
                {order.status !== "FINISHED" && (
                  <>
                    {order?.status === "NOT_DELIVERED" && (
                      <button
                        className="bg-green-500 rounded-2xl p-2 text-white"
                        onClick={() => OderDilivered(order)}
                      >
                        Đã giao
                      </button>
                    )}
                    {order?.status === "UNPAID" && (
                      <button
                        className="bg-blue-500 rounded-2xl p-2 text-white"
                        onClick={() => {
                          finshed(order);
                        }}
                      >
                        Đã thanh toán
                      </button>
                    )}
                  </>
                )}
              </aside>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

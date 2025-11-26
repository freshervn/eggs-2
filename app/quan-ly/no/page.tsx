"use client";
import { useEffect, useState } from "react";

// Define the type for an Order. You can update according to your schema.
type Order = {
  id: string;
  customerName?: string;
  total?: number;
  status?: string;
  // ...other fields
};

export default function UnpaidOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUnpaidOrders() {
      setLoading(true);
      setError(null);
      try {
        // You should have an API route like /api/orders?status=UNPAID
        // Adjust if your API uses something different.
        const res = await fetch("/api/orders?status=UNPAID");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error || "Failed to fetch orders");
        }
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Có lỗi xảy ra khi lấy danh sách đơn hàng."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchUnpaidOrders();
  }, []);

  return (
    <div className="pt-4">
      <h1 className="text-3xl text-center text-black mb-8">
        Đơn hàng chưa thanh toán
      </h1>
      {loading && <div className="text-center text-blue-500">Đang tải...</div>}
      {error && <div className="text-center text-red-500 mb-4">{error}</div>}
      <div className="grid gap-4">
        {orders.length === 0 && !loading && (
          <div className="text-center text-gray-500">
            Không có đơn hàng nào chưa thanh toán.
          </div>
        )}
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-yellow-200 rounded-xl p-4 shadow flex flex-col gap-2"
          >
            <div>
              <span className="font-semibold">Mã đơn hàng:</span> {order.id}
            </div>
            {order.customerName && (
              <div>
                <span className="font-semibold">Khách hàng:</span>{" "}
                {order.customerName}
              </div>
            )}
            {order.total != null && (
              <div>
                <span className="font-semibold">Tổng:</span>{" "}
                {order.total.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </div>
            )}
            <div>
              <span className="font-semibold">Trạng thái:</span>{" "}
              {order.status || "Không xác định"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

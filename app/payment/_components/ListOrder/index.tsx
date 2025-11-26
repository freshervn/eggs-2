// "use client";
// import { useEffect, useState } from "react";

// type Order = {
//   id: string;
//   items: Array<{
//     id: string | number;
//     name: string;
//     price: number;
//     quantity: number;
//   }>;
//   total: number;
//   status: string;
//   paymentMethod?: string;
//   paymentUrl?: string;
//   deliveryAddress?: {
//     name: string;
//     phone: string;
//     address: string;
//   };
// };

// const ListOrder = () => {
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
//   const [searching, setSearching] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch all orders once phone number is entered
//   const fetchOrders = async () => {
//     setSearching(true);
//     setError(null);
//     setOrders([]);
//     setFilteredOrders([]);
//     try {
//       const res = await fetch("/api/orders");
//       if (!res.ok) {
//         throw new Error("Không thể lấy danh sách đơn hàng");
//       }
//       const data = await res.json();
//       setOrders(data.orders || []);
//       // Filter here so if user changes phone number, already-fetched orders are filtered fast
//     } catch (err) {
//       setError(
//         err instanceof Error ? err.message : "Lỗi không xác định khi tải đơn hàng."
//       );
//     } finally {
//       setSearching(false);
//     }
//   };

//   // Filter orders when phoneNumber or orders changes
//   useEffect(() => {
//     if (!phoneNumber) {
//       setFilteredOrders([]);
//       return;
//     }
//     const filtered =
//       orders.filter(
//         (order) => order.deliveryAddress?.phone === phoneNumber
//       ) || [];
//     setFilteredOrders(filtered);
//   }, [orders, phoneNumber]);

//   const handleSearch = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!phoneNumber.trim()) {
//       setFilteredOrders([]);
//       return;
//     }
//     await fetchOrders();
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6 mb-6 max-w-2xl mx-auto">
//       <h2 className="text-2xl font-bold mb-4 text-black">
//         Tra cứu đơn hàng
//       </h2>
//       <form
//         onSubmit={handleSearch}
//         className="flex flex-col md:flex-row gap-3 mb-4"
//       >
//         <input
//           type="tel"
//           value={phoneNumber}
//           onChange={(e) => setPhoneNumber(e.target.value.trim())}
//           placeholder="Nhập số điện thoại"
//           className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none text-black"
//         />
//         <button
//           type="submit"
//           className="bg-blue-500 px-6 py-2 rounded-lg shadow font-semibold text-white hover:bg-blue-600 disabled:bg-gray-400"
//           disabled={searching || !phoneNumber}
//         >
//           {searching ? "Đang tìm..." : "Tìm đơn hàng"}
//         </button>
//       </form>
//       {error && <div className="text-red-600 mb-2">{error}</div>}

//       {phoneNumber && !searching && (
//         <>
//           {filteredOrders.length === 0 ? (
//             <div className="text-gray-500">
//               Không tìm thấy đơn hàng nào cho số điện thoại này.
//             </div>
//           ) : (
//             <div className="space-y-6">
//               {filteredOrders.map((order, idx) => (
//                 <div
//                   key={order.id || idx}
//                   className="border rounded-lg p-4 bg-gray-50"
//                 >
//                   <div className="mb-2">
//                     <span className="font-semibold text-black">Mã đơn hàng:</span>{" "}
//                     <span className="text-blue-700">{order.id}</span>
//                   </div>
//                   <div className="mb-2">
//                     <span className="font-semibold text-black">Trạng thái:</span>{" "}
//                     {order.status === "UNPAID" && (
//                       <span className="text-red-500">Chưa thanh toán</span>
//                     )}
//                     {order.status === "NOT_DELIVERED" && (
//                       <span className="text-yellow-600">Chờ giao</span>
//                     )}
//                     {order.status === "FINISHED" && (
//                       <span className="text-green-600">Đã hoàn thành</span>
//                     )}
//                   </div>
//                   <div className="mb-2">
//                     <span className="font-semibold text-black">Tổng tiền:</span>{" "}
//                     <span className="text-blue-700">
//                       {order.total.toLocaleString("vi-VN", {
//                         style: "currency",
//                         currency: "VND",
//                       })}
//                     </span>
//                   </div>
//                   <div className="mb-2">
//                     <span className="font-semibold text-black">Địa chỉ giao:</span>{" "}
//                     <span>
//                       {order.deliveryAddress?.name} | {order.deliveryAddress?.phone}
//                       <br />
//                       {order.deliveryAddress?.address}
//                     </span>
//                   </div>
//                   <div>
//                     <span className="font-semibold text-black">Sản phẩm:</span>
//                     <ul className="list-disc pl-5 mt-1 text-gray-800">
//                       {order.items.map((item) => (
//                         <li key={item.id}>
//                           {item.name} x{item.quantity} -{" "}
//                           {(item.price * item.quantity).toLocaleString("vi-VN", {
//                             style: "currency",
//                             currency: "VND",
//                           })}
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default ListOrder;

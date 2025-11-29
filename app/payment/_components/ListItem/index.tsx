"use client";
import { useCartStore } from "@/_lib/store/cartStore";

const ListItem = () => {
  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const clearCart = useCartStore((state) => state.clearCart);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-black">Giỏ hàng</h2>
        <p className="text-gray-500">Giỏ hàng của bạn đang trống</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold mb-4 text-black">Giỏ hàng</h2>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 text-sm font-semibold"
          >
            Xóa tất cả
          </button>
        </div>
        <div className="space-y-4 mb-4">
          {items.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg">
              <div className="">
                <h3 className="font-semibold text-lg text-black">
                  {item.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {(item.price * 10).toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })}{" "}
                  / 10 quả
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 10)}
                    className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded transition-colors"
                  >
                    -
                  </button>
                  <span className="font-semibold min-w-12 text-center text-black">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 10)}
                    className="bg-green-400 hover:bg-green-500 text-white px-3 py-1 rounded transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="text-right min-w-12">
                  <p className="font-semibold text-black">
                    {(item.price * item.quantity).toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:text-red-700 font-semibold ml-2"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Tổng số lượng:</span>
            <span className="font-semibold text-black">
              {getTotalItems()} quả
            </span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-black">Tổng tiền:</span>
            <span className="text-blue-600">
              {getTotalPrice().toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListItem;

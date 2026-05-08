"use client";
import { useState } from "react";
import {
  useCartStore,
  type DeliveryAddress as DeliveryAddressType,
} from "@/_lib/store/cartStore";
import { createOrder } from "@/_lib/api/orders";
import { createMoMoPayment } from "@/_lib/api/momo";

type DeliveryAddressProps = {
  onAddressSubmit?: (orderId?: string, payUrl?: string) => void;
};

const DeliveryAddress = ({ onAddressSubmit }: DeliveryAddressProps) => {
  const deliveryAddress = useCartStore((state) => state.deliveryAddress);
  const setDeliveryAddress = useCartStore((state) => state.setDeliveryAddress);
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  // Initialize form with saved address if available
  const [form, setForm] = useState<DeliveryAddressType>(
    deliveryAddress || {
      name: "",
      phone: "",
      address: "",
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Save address to store
      setDeliveryAddress(form);

      // Validate cart has items
      if (items.length === 0) {
        throw new Error("Giỏ hàng của bạn đang trống");
      }
      const total = getTotalPrice();

      // Create order with cart items, total, and delivery address
      const orderId = await createOrder({
        items,
        total,
        deliveryAddress: form,
        paymentMethod: "qr_code",
      });

      // Clear cart after successful order creation
      clearCart();

      // Create MoMo payment link
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const { payUrl } = await createMoMoPayment({
        orderId,
        amount: total,
        orderInfo: `Đơn hàng #${orderId} - ${items.map((i) => i.name).join(", ")}`,
        redirectUrl: `${baseUrl}/payment?success=1&orderId=${orderId}`,
        ipnUrl: `${baseUrl}/api/momo/ipn`,
        userInfo: {
          name: form.name,
          phoneNumber: form.phone,
        },
      });

      // Call the callback to show QR code after a short delay
      if (onAddressSubmit) {
        setTimeout(() => {
          onAddressSubmit(orderId, payUrl);
        }, 500);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Không thể tạo đơn hàng";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mb-8"
    >
      <h2 className="text-2xl font-bold mb-4 text-black">Địa chỉ nhận hàng</h2>

      <div className="mb-4">
        <label
          htmlFor="name"
          className="block text-gray-700 font-semibold mb-1"
        >
          Tên người nhận
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 text-black"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="phone"
          className="block text-gray-700 font-semibold mb-1"
        >
          Số điện thoại
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 text-black"
          value={form.phone}
          onChange={handleChange}
          required
          placeholder="VD: 0912345678"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="address"
          className="block text-gray-700 font-semibold mb-1"
        >
          Địa chỉ
        </label>
        <textarea
          id="address"
          name="address"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 text-black"
          value={form.address}
          onChange={handleChange}
          required
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-black font-semibold py-2 rounded-lg transition-colors"
      >
        {loading ? "Đang tạo đơn hàng..." : "Lưu thông tin giao hàng"}
      </button>

      {error && <div className="mt-4 text-red-600 font-semibold">{error}</div>}
    </form>
  );
};

export default DeliveryAddress;

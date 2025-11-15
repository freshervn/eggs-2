"use client";

import { useState } from "react";
import { addDocument, getDocument, FirestoreDocument } from "./firestore";

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

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (orderData: Omit<OrderData, "status">) => {
    setLoading(true);
    setError(null);

    try {
      // Filter out undefined values (Firestore doesn't accept undefined)
      const cleanOrderData = Object.fromEntries(
        Object.entries({
          ...orderData,
          status: "pending",
        }).filter(([, value]) => value !== undefined)
      ) as Omit<OrderData, "id">;

      const orderId = await addDocument("orders", cleanOrderData);
      return orderId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create order";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const order = await getDocument<OrderData>("orders", orderId);
      return order;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get order";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrder,
    getOrder,
    loading,
    error,
  };
};

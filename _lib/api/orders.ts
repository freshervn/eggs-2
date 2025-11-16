"use client";

import axios from "axios";
// import { OrderData } from "../firebase/usePayment";

const API_BASE_URL = "/api/orders";

/**
 * Create a new order via API
 */
export const createOrder = async (orderData: {
  items: Array<{
    id: string | number;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  paymentMethod?: string;
  paymentUrl?: string;
  deliveryAddress?: {
    name: string;
    phone: string;
    address: string;
  };
}): Promise<string> => {
  try {
    const response = await axios.post(API_BASE_URL, orderData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data.orderId;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to create order"
      );
    }
    throw new Error("Failed to create order");
  }
};

/**
 * Get all orders
 */
// export const getOrders = async (options?: {
//   status?: "pending" | "completed" | "cancelled";
//   limit?: number;
// }): Promise<OrderData[]> => {
//   try {
//     const params: Record<string, string | number> = {};
//     if (options?.status) params.status = options.status;
//     if (options?.limit) params.limit = options.limit;

//     const response = await axios.get(API_BASE_URL, {
//       params,
//     });
//     return response.data.orders;
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       throw new Error(error.response?.data?.message || "Failed to get orders");
//     }
//     throw new Error("Failed to get orders");
//   }
// };

/**
 * Get a specific order by ID
 */
// export const getOrder = async (orderId: string): Promise<OrderData | null> => {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/${orderId}`);
//     return response.data.order;
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       if (error.response && error.response.status === 404) {
//         return null;
//       }
//       throw new Error(error.response?.data?.message || "Failed to get order");
//     }
//     throw new Error("Failed to get order");
//   }
// };

/**
 * Update an order
 */
export const updateOrder = async (
  orderId: string,
  updates: {
    status?: "pending" | "completed" | "cancelled";
    paymentMethod?: string;
    paymentUrl?: string;
  }
): Promise<void> => {
  try {
    await axios.patch(`${API_BASE_URL}/${orderId}`, updates, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to update order"
      );
    }
    throw new Error("Failed to update order");
  }
};

/**
 * Delete an order
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${orderId}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to delete order"
      );
    }
    throw new Error("Failed to delete order");
  }
};

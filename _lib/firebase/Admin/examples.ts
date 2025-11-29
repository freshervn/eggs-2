/**
 * Firebase Usage Examples
 *
 * This file contains examples of how to use Firebase in your application
 */

import {
  getDocument,
  getDocuments,
  addDocument,
  updateDocument,
  queryHelpers,
} from "./firestore";
import { signIn, signUp, onAuthChange } from "./auth";

// ============================================
// FIRESTORE EXAMPLES
// ============================================

// Example: Save an order to Firestore
export const saveOrder = async (orderData: {
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  status: string;
}) => {
  try {
    const orderId = await addDocument("orders", orderData);
    console.log("Order saved with ID:", orderId);
    return orderId;
  } catch (error) {
    console.error("Failed to save order:", error);
    throw error;
  }
};

// Example: Get all orders
export const getAllOrders = async () => {
  try {
    const orders = await getDocuments("orders", [
      queryHelpers.orderBy("createdAt", "desc"),
      queryHelpers.limit(10),
    ]);
    return orders;
  } catch (error) {
    console.error("Failed to get orders:", error);
    throw error;
  }
};

// Example: Get orders by status
export const getOrdersByStatus = async (status: string) => {
  try {
    const orders = await getDocuments("orders", [
      queryHelpers.where("status", "==", status),
      queryHelpers.orderBy("createdAt", "desc"),
    ]);
    return orders;
  } catch (error) {
    console.error("Failed to get orders by status:", error);
    throw error;
  }
};

// Example: Update order status
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    await updateDocument("orders", orderId, { status });
    console.log("Order status updated");
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw error;
  }
};

// Example: Get a single order
export const getOrder = async (orderId: string) => {
  try {
    const order = await getDocument("orders", orderId);
    return order;
  } catch (error) {
    console.error("Failed to get order:", error);
    throw error;
  }
};

// ============================================
// AUTHENTICATION EXAMPLES
// ============================================

// Example: Sign up a new user
export const registerUser = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    const user = await signUp(email, password, displayName);
    console.log("User registered:", user);
    return user;
  } catch (error) {
    console.error("Failed to register user:", error);
    throw error;
  }
};

// Example: Sign in existing user
export const loginUser = async (email: string, password: string) => {
  try {
    const user = await signIn(email, password);
    console.log("User signed in:", user);
    return user;
  } catch (error) {
    console.error("Failed to sign in:", error);
    throw error;
  }
};

// Example: Listen to auth state changes
export const setupAuthListener = (callback: (user: unknown) => void) => {
  return onAuthChange((user) => {
    if (user) {
      console.log("User is signed in:", user);
    } else {
      console.log("User is signed out");
    }
    callback(user);
  });
};

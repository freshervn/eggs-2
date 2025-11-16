"use client";

import axios from "axios";

const API_BASE_URL = "/api/facebook/message";

export interface SendMessageResponse {
  success: boolean;
  message: string;
  messageId?: string;
  messengerLink?: string;
  webMessengerLink?: string;
  recipientId?: string;
  note?: string;
}

export interface MessengerLinkResponse {
  success: boolean;
  recipientId: string;
  messengerLink: string;
  webMessengerLink: string;
  profileUrl: string;
}

/**
 * Send a message to Facebook profile
 */
export const sendFacebookMessage = async (data: {
  message: string;
  recipientId?: string;
}): Promise<SendMessageResponse> => {
  try {
    const response = await axios.post<SendMessageResponse>(
      API_BASE_URL,
      {
        message: data.message,
        recipientId: data.recipientId,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to send Facebook message"
      );
    }
    throw new Error("Failed to send Facebook message");
  }
};

/**
 * Get messenger link for a Facebook profile
 */
export const getMessengerLink = async (options?: {
  recipientId?: string;
  message?: string;
}): Promise<MessengerLinkResponse> => {
  try {
    const params: Record<string, string> = {};
    if (options?.recipientId) params.recipientId = options.recipientId;
    if (options?.message) params.message = options.message;

    const response = await axios.get<MessengerLinkResponse>(API_BASE_URL, {
      params,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to get messenger link"
      );
    }
    throw new Error("Failed to get messenger link");
  }
};

/**
 * Open messenger link in a new window/tab
 */
export const openMessenger = async (message?: string, recipientId?: string) => {
  try {
    const linkData = await getMessengerLink({ message, recipientId });
    window.open(linkData.messengerLink, "_blank");
    return linkData;
  } catch (error) {
    console.error("Error opening messenger:", error);
    throw error;
  }
};

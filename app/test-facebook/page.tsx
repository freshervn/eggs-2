"use client";

import { useState } from "react";
import {
  sendFacebookMessage,
  getMessengerLink,
  openMessenger,
  SendMessageResponse,
  MessengerLinkResponse,
} from "@/_lib/api/facebook";

export default function TestFacebookPage() {
  const [message, setMessage] = useState(
    "Hello! This is a test message from the Eggs app."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    SendMessageResponse | MessengerLinkResponse | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await sendFacebookMessage({
        message,
        // recipientId: "61583914557523",        
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGetLink = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await getMessengerLink({ message });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMessenger = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await openMessenger(message);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Facebook Message API Test
          </h1>

          <div className="mb-6">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Enter your message here..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending..." : "Send Message (POST)"}
            </button>

            <button
              onClick={handleGetLink}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading..." : "Get Link (GET)"}
            </button>

            <button
              onClick={handleOpenMessenger}
              disabled={loading || !message.trim()}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Opening..." : "Open Messenger"}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-gray-800 font-medium mb-2">Response:</p>
              <pre className="text-sm text-gray-600 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
              {"messengerLink" in result && result.messengerLink && (
                <div className="mt-4">
                  <a
                    href={result.messengerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Open Messenger Link
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              API Endpoints
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>POST</strong> /api/facebook/message
              </p>
              <p>
                <strong>GET</strong> /api/facebook/message?message=Hello
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

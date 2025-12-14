"use client";
import React, { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function TestDonatePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [donationId, setDonationId] = useState<string>("");

  const handleDonate = async () => {
    setStatus("loading");
    setErrorMsg("");
    setDonationId("");

    try {
      const response = await fetch("/api/donate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Donor",
          amount: 10000,
          message: "Test donation from test page",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to donate");
      }

      setDonationId(data.donationId || "");
      setStatus("success");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Unknown error");
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 py-20">
      <h1 className="text-3xl font-bold mb-6 text-amber-700">
        Test Donate 10,000đ
      </h1>
      <button
        onClick={handleDonate}
        disabled={status === "loading"}
        className="px-8 py-4 bg-green-500 text-white text-xl rounded-lg font-semibold mb-4 hover:bg-green-600 transition disabled:opacity-60"
      >
        {status === "loading" ? "Đang xử lý..." : "Quyên góp 10,000đ"}
      </button>
      {status === "success" && (
        <div className="text-green-700 font-semibold mb-1">
          Đã quyên góp thành công 10,000đ!
          {donationId && <div className="text-sm mt-2">ID: {donationId}</div>}
        </div>
      )}
      {status === "error" && (
        <div className="text-red-600 font-semibold mb-1">Lỗi: {errorMsg}</div>
      )}
      <div className="text-sm text-gray-500 mt-6">
        Trang này chỉ dùng để test quyên góp 10,000đ vào Realtime Database.
      </div>
    </div>
  );
}

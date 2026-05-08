"use client";
import { useEffect, useState } from "react";
import { realtimeDB } from "@/_lib/firebase/client";
import Donors from "./Donors";
import QRCode from "@/app/_components/QRCode";
import { ref } from "firebase/database";

export default function NuoiMeoLanding() {
  const nuoiMeoEnabled = process.env.NEXT_PUBLIC_NUOI_MEO_ENABLED !== "false";
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [donateUrl, setDonateUrl] = useState("");
  const [momoPayUrl, setMomoPayUrl] = useState<string | null>(null);
  const [showMomoQR, setShowMomoQR] = useState(false);
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateError, setDonateError] = useState<string | null>(null);
  const [donors, setDonors] = useState<
    { name: string; amount: number; message?: string; createdAt?: number }[]
  >([]);
  useEffect(() => {
    setDonateUrl(
      typeof window !== "undefined" ? `${window.location.origin}/test-donate` : ""
    );
  }, []);

  const handleDonate10k = async () => {
    if (!nuoiMeoEnabled) return;
    setDonateError(null);
    setDonateLoading(true);
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const orderId = `donate-${Date.now()}`;
      const res = await fetch("/api/momo/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: 10000,
          orderInfo: "Quyen gop Nuoi Meo 10000 VND",
          redirectUrl: `${baseUrl}/nuoi-meo`,
          ipnUrl: `${baseUrl}/api/momo/ipn`,
          lang: "vi",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tạo thanh toán MoMo");
      if (data.payUrl) {
        setMomoPayUrl(data.payUrl);
        setShowMomoQR(false);
      }
    } catch (err) {
      setDonateError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setDonateLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const donorsRef = ref(realtimeDB, "donations");

    const handleSnapshot = (snapshot: any) => {
      const data = snapshot.val();
      let list =
        data && typeof data === "object"
          ? Object.values(data)
              .filter(
                (d: any) =>
                  typeof d.name === "string" && typeof d.amount === "number"
              )
              .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
          : [];

      setDonors(list as any);
      setTotal(
        list.reduce(
          (sum: number, donor: any) =>
            sum + (typeof donor.amount === "number" ? donor.amount : 0),
          0
        )
      );
      setLoading(false);
    };

    let unsub: (() => void) | null = null;
    import("firebase/database").then((mod) => {
      const onValue = mod.onValue;
      const unsubscribe = onValue(donorsRef, handleSnapshot, (err: any) => {
        setDonors([]);
        setLoading(false);
      });
      unsub = unsubscribe;
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 py-20">
        <div className="animate-pulse text-3xl text-amber-700 font-bold mb-4">
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 py-20">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-amber-700">
        Nuôi Mèo
      </h1>
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-green-700 drop-shadow-lg mb-4">
          {total === null ? (
            <span className="animate-pulse text-gray-400">...</span>
          ) : (
            total.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            })
          )}
        </div>
        <p className="mt-2 text-xl text-gray-600 text-center">
          Đây là tổng số tiền mọi người đã quyên góp để chăm mèo!
        </p>
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border-2 border-amber-200">
          <p className="text-center text-amber-700 font-semibold mb-3">
            Quét mã QR để quyên góp
          </p>
          <div className="flex justify-center p-4 bg-white rounded-lg min-h-[232px] items-center">
            {donateUrl ? (
              <QRCode
                value={donateUrl}
                size={200}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#1a1a1a"
              />
            ) : (
              <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse rounded" />
            )}
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            Mở camera và quét mã để chuyển đến trang quyên góp
          </p>
          {!nuoiMeoEnabled ? (
            <div className="mt-4 w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
              Tạm thời đóng tính năng quyên góp qua MoMo.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDonate10k}
                disabled={donateLoading}
                className="mt-4 w-full py-3 px-6 bg-[#A50064] hover:bg-[#8B0052] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {donateLoading ? "Đang tạo..." : "Quyên góp 10.000₫ qua MoMo"}
              </button>
              {momoPayUrl && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowMomoQR((v) => !v)}
                    className="text-sm text-amber-700 hover:underline"
                  >
                    {showMomoQR ? "Ẩn mã QR" : "Hiện mã QR thanh toán MoMo"}
                  </button>
                  {showMomoQR && (
                    <div className="mt-3 p-4 bg-white rounded-lg border border-amber-200">
                      <p className="text-center text-sm text-gray-600 mb-2">
                        Quét mã qua ứng dụng MoMo
                      </p>
                      <div className="flex justify-center">
                        <QRCode
                          value={momoPayUrl}
                          size={180}
                          level="H"
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                        />
                      </div>
                      <a
                        href={momoPayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block text-center text-sm text-[#A50064] hover:underline"
                      >
                        Mở MoMo để thanh toán
                      </a>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {donateError && (
            <p className="mt-2 text-sm text-red-600 text-center">{donateError}</p>
          )}
        </div>
      </div>
      <div className="mt-10 w-full max-w-md bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-amber-700 mb-4">
          Danh sách những người đã quyên góp
        </h2>
        <Donors donors={donors} />
      </div>
    </div>
  );
}

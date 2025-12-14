"use client";
import { useEffect, useState } from "react";
import { realtimeDB } from "@/_lib/firebase/client";
import Donors from "./Donors";
import { ref } from "firebase/database";

export default function NuoiMeoLanding() {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [donors, setDonors] = useState<
    { name: string; amount: number; message?: string; createdAt?: number }[]
  >([]);
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

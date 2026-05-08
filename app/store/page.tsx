"use client";

import EggList from "../_components/EggList";
import Link from "next/link";
import { getItems, Item } from "@/_lib/api/items";
import { useEffect, useState } from "react";

export default function StorePage() {
  const [data, setData] = useState<Item[]>([]);

  useEffect(() => {
    getItems().then(setData);
  }, []);

  return (
    <div className="h-dvh w-100dvw scroll-auto overflow-auto pb-20 pt-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          ← Home
        </Link>
      </div>
      <EggList data={data} />
      <div className="absolute bottom-0 left-0 flex h-16 w-full justify-center bg-yellow-500">
        <Link href="/payment" className="flex items-center">
          <span className="relative inline-block rounded-full bg-red-400 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white drop-shadow-lg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.72A1 1 0 0 0 6.53 17h10.94a1 1 0 0 0 .88-1.45L17 13M7 13V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7"
              />
              <circle cx="7.5" cy="20.5" r="1.5" />
              <circle cx="16.5" cy="20.5" r="1.5" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}

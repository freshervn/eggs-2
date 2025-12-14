"use client";
export interface Donor {
  name: string;
  amount: number;
  message?: string;
  createdAt?: number;
}

interface DonorsProps {
  donors: Donor[];
}

export default function Donors({ donors }: DonorsProps) {
  return (
    <ul className="divide-y divide-gray-200">
      {donors.map((d, i) => (
        <li key={i} className="py-2 flex flex-col">
          <div className="font-semibold text-green-700 flex items-baseline">
            {d.name}
            <span className="ml-2 text-sm text-gray-500 font-normal">
              {d.createdAt
                ? new Date(d.createdAt).toLocaleDateString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })
                : ""}
            </span>
          </div>
          <div className="text-amber-800">
            {d.amount.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            })}
            {d.message && (
              <span className="ml-2 text-sm italic text-gray-600">
                “{d.message}”
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

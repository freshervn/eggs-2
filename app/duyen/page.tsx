import type { Metadata } from "next";
import DuyenApp from "./_components/DuyenApp";

export const metadata: Metadata = {
  title: "Duyên — Tìm người ấy",
  description:
    "Kết nối những trái tim cùng nhịp. Tìm người ấy một cách chân thành.",
};

export default function DuyenPage() {
  return <DuyenApp />;
}

import type { Metadata, Viewport } from "next";
import NinhBinhCheckin from "./_components/NinhBinhCheckin";

export const metadata: Metadata = {
  title: "Ninh Bình · Check-in",
  description:
    "Lộ trình xe máy Tràng An – Hoa Lư – Tuyệt Tịnh Cốc. Check-in và đăng ảnh từng điểm.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#efe6d4",
};

export default function NinhBinhPage() {
  return <NinhBinhCheckin />;
}

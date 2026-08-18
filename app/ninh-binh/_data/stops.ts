export type NinhBinhStopId = "trang-an" | "hoa-lu" | "tuyet-tinh-coc";

export type NinhBinhStop = {
  id: NinhBinhStopId;
  order: number;
  name: string;
  shortName: string;
  hint: string;
  detail: string;
  duration: string;
  ticket: string;
  photo: string;
  mapsUrl: string;
  departAt: string;
  departNote: string;
  gallery: string[];
};

export const NINH_BINH_STOPS: NinhBinhStop[] = [
  {
    id: "trang-an",
    order: 1,
    name: "Tràng An",
    shortName: "Bến thuyền",
    hint: "Ngồi thuyền xuyên hang · đi buổi sáng",
    detail:
      "Di sản UNESCO. Mua vé tại quầy hoặc muave.disantrangan.vn, chọn tuyến 2 nếu đi trong ngày (2–2,5 giờ). Hang thấp, quần áo có thể ướt.",
    duration: "2–3,5 giờ",
    ticket: "300.000đ người lớn",
    photo: "/ninh-binh/trang-an.png",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=B%E1%BA%BFn+thuy%E1%BB%81n+Tr%C3%A0ng+An%2C+Ninh+B%C3%ACnh",
    departAt: "08:30",
    departNote: "Xuất phát Hà Nội 05:30–06:00 · tới bến thuyền",
    gallery: [
      "/ninh-binh/gallery/trang-an/01.jpg",
      "/ninh-binh/gallery/trang-an/02.jpg",
      "/ninh-binh/gallery/trang-an/03.jpg",
      "/ninh-binh/gallery/trang-an/04.jpg",
    ],
  },
  {
    id: "hoa-lu",
    order: 2,
    name: "Hoa Lư",
    shortName: "Đền Đinh · Đền Lê",
    hint: "Cố đô · cách Tràng An ~4 km xe máy",
    detail:
      "Đền Vua Đinh, đền Vua Lê, chùa Nhất Trụ. Tham quan gọn 45–75 phút. Ăn dê núi ngay cổng đền rồi đi bộ sang Tuyệt Tịnh Cốc.",
    duration: "45–75 phút",
    ticket: "20.000đ người lớn",
    photo: "/ninh-binh/hoa-lu.png",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=C%E1%BB%91+%C4%91%C3%B4+Hoa+L%C6%B0%2C+Ninh+B%C3%ACnh",
    departAt: "13:00",
    departNote: "Sau ăn trưa · chạy ~10 phút từ Tràng An",
    gallery: [
      "/ninh-binh/gallery/hoa-lu/01.jpg",
      "/ninh-binh/gallery/hoa-lu/02.jpg",
      "/ninh-binh/gallery/hoa-lu/03.jpg",
      "/ninh-binh/gallery/hoa-lu/04.jpg",
    ],
  },
  {
    id: "tuyet-tinh-coc",
    order: 3,
    name: "Tuyệt Tịnh Cốc",
    shortName: "Động Am Tiên",
    hint: "Ao xanh · 200 bậc đá · đi bộ 300–400 m",
    detail:
      "Cách đền Vua Đinh 300–400 m. Giày bám, tránh leo khi mưa hoặc trời tối. Góc ảnh đẹp nhất cụm này vào chiều nắng xiên.",
    duration: "1,5–2 giờ",
    ticket: "20.000–50.000đ",
    photo: "/ninh-binh/tuyet-tinh-coc.png",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=%C4%90%E1%BB%99ng+Am+Ti%C3%AAn%2C+Tuy%E1%BB%87t+T%E1%BB%8Bnh+C%E1%BB%91c%2C+Ninh+B%C3%ACnh",
    departAt: "14:00",
    departNote: "Đi bộ 300–400 m từ đền Vua Đinh",
    gallery: [
      "/ninh-binh/gallery/tuyet-tinh-coc/01.jpg",
      "/ninh-binh/gallery/tuyet-tinh-coc/02.jpg",
      "/ninh-binh/gallery/tuyet-tinh-coc/03.jpg",
      "/ninh-binh/gallery/tuyet-tinh-coc/04.jpg",
    ],
  },
];

export const CHECKIN_STORAGE_KEY = "ninh-binh-checkins-v1";

export type DuyenProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  interests: string[];
  lookingFor: string;
  accent: string;
};

export const CITIES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Huế",
  "Cần Thơ",
  "Đà Lạt",
] as const;

export const MOCK_PROFILES: DuyenProfile[] = [
  {
    id: "1",
    name: "Minh Anh",
    age: 26,
    city: "Hà Nội",
    bio: "Thích cà phê sáng sớm và những buổi tối đi bộ quanh hồ. Đang tìm người nói chuyện được về mọi thứ.",
    interests: ["Cà phê", "Đọc sách", "Du lịch"],
    lookingFor: "Người chân thành, biết lắng nghe",
    accent: "#c45c3e",
  },
  {
    id: "2",
    name: "Quốc Huy",
    age: 29,
    city: "TP. Hồ Chí Minh",
    bio: "Làm thiết kế, cuối tuần hay đi chụp ảnh đường phố. Muốn gặp ai đó vui và dễ gần.",
    interests: ["Nhiếp ảnh", "Âm nhạc", "Ẩm thực"],
    lookingFor: "Một mối duyên tự nhiên, không gượng",
    accent: "#2a6f6f",
  },
  {
    id: "3",
    name: "Thu Hà",
    age: 24,
    city: "Đà Nẵng",
    bio: "Sống chậm gần biển. Thích nấu ăn và xem phim đêm mưa.",
    interests: ["Nấu ăn", "Phim", "Biển"],
    lookingFor: "Người tử tế, có trách nhiệm",
    accent: "#3d5a80",
  },
  {
    id: "4",
    name: "Đức Anh",
    age: 31,
    city: "Hà Nội",
    bio: "Hay chạy bộ sáng, thích trà hơn cà phê. Muốn tìm người cùng xây một góc bình yên.",
    interests: ["Chạy bộ", "Trà", "Nhạc jazz"],
    lookingFor: "Sự đồng điệu lâu dài",
    accent: "#6b4f3a",
  },
  {
    id: "5",
    name: "Ngọc Mai",
    age: 27,
    city: "Huế",
    bio: "Yêu những con phố cũ và tiếng mưa trên mái ngói. Viết nhật ký mỗi tối.",
    interests: ["Viết lách", "Lịch sử", "Hoa"],
    lookingFor: "Người dịu dàng, sâu sắc",
    accent: "#8b4557",
  },
  {
    id: "6",
    name: "Tuấn Kiệt",
    age: 25,
    city: "Đà Lạt",
    bio: "Sống giữa sương và rừng thông. Thích picnic và những cuộc trò chuyện dài.",
    interests: ["Dã ngoại", "Cà phê", "Xe máy"],
    lookingFor: "Bạn đồng hành khám phá",
    accent: "#4a7c59",
  },
  {
    id: "7",
    name: "Lan Phương",
    age: 28,
    city: "TP. Hồ Chí Minh",
    bio: "Làm marketing, ngoài giờ thích yoga và thử quán mới. Cười nhiều, sống thật.",
    interests: ["Yoga", "Ẩm thực", "Podcast"],
    lookingFor: "Người vui tính, trung thực",
    accent: "#b85c38",
  },
  {
    id: "8",
    name: "Hoàng Nam",
    age: 30,
    city: "Cần Thơ",
    bio: "Con người miền Tây — chậm rãi, chân chất. Thích chợ nổi và đờn ca tài tử.",
    interests: ["Âm nhạc", "Sông nước", "Gia đình"],
    lookingFor: "Người để về nhà cùng",
    accent: "#1f6b5c",
  },
];

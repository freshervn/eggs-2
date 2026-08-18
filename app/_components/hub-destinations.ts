export type HubLink = {
  href: string;
  label: string;
  description: string;
  accentClass: string;
};

const localOnlyDestinations: HubLink[] = [
  {
    href: "/jira",
    label: "Jira",
    description: "Your Jira tasks via jira-cli",
    accentClass: "border-l-[#0052CC]",
  },
];

const sharedDestinations: HubLink[] = [
  {
    href: "/me",
    label: "About me",
    description: "Profile and contact",
    accentClass: "border-l-slate-400",
  },
  {
    href: "/chat",
    label: "Chat",
    description: "Open the chat room",
    accentClass: "border-l-sky-500",
  },
  {
    href: "/gitlab",
    label: "GitLab SRS",
    description: "Browse SRS docs · read .docx from GitLab",
    accentClass: "border-l-[#FC6D26]",
  },
  {
    href: "/store",
    label: "My store",
    description: "Browse items and checkout",
    accentClass: "border-l-amber-500",
  },
  {
    href: "/nuoimeo",
    label: "Nuôi em",
    description: "Log money in and out · Casso sync",
    accentClass: "border-l-teal-500",
  },
  {
    href: "/tinh-diem",
    label: "Tính điểm",
    description: "Score bars · save games · invite friends to a room",
    accentClass: "border-l-red-500",
  },
  {
    href: "/piano",
    label: "Piano game",
    description: "Play music using your keyboard",
    accentClass: "border-l-violet-500",
  },
  {
    href: "/sam",
    label: "Sâm",
    description: "Play a quick card match (vs bot)",
    accentClass: "border-l-fuchsia-500",
  },
  {
    href: "/werewolf",
    label: "Ma Sói",
    description: "Werewolf online — create a room and play with friends",
    accentClass: "border-l-rose-700",
  },
  {
    href: "/duyen",
    label: "Duyên",
    description: "Tìm người ấy — kết nối chân thành",
    accentClass: "border-l-[#2f6b5a]",
  },
  {
    href: "/ninh-binh",
    label: "Ninh Bình",
    description: "Lộ trình xe máy · check-in Tràng An, Hoa Lư, Tuyệt Tịnh Cốc",
    accentClass: "border-l-[#1f3d28]",
  },
  {
    href: "/3d",
    label: "3D demo",
    description: "Three.js first-person playground (WASD + mouse)",
    accentClass: "border-l-emerald-500",
  },
  {
    href: "/test",
    label: "Test",
    description: "Blank test screen",
    accentClass: "border-l-slate-500",
  },
];

export function getHubDestinations(): HubLink[] {
  if (process.env.LOCAL_HUB_MENU !== "1") {
    return sharedDestinations;
  }

  const chatIndex = sharedDestinations.findIndex((item) => item.href === "/chat");
  if (chatIndex === -1) {
    return [...localOnlyDestinations, ...sharedDestinations];
  }

  return [
    ...sharedDestinations.slice(0, chatIndex + 1),
    ...localOnlyDestinations,
    ...sharedDestinations.slice(chatIndex + 1),
  ];
}

export const WEREWOLF_AVATAR_PRESETS = [
  { id: "wolf", symbol: "🐺", label: "Sói Mũ Trùm", image: "/werewolf/avatars/01.webp" },
  { id: "lantern", symbol: "🏮", label: "Cô Gái Đèn", image: "/werewolf/avatars/02.webp" },
  { id: "sorceress", symbol: "🔮", label: "Pháp Sư", image: "/werewolf/avatars/03.webp" },
  { id: "fox", symbol: "🦊", label: "Cáo Săn", image: "/werewolf/avatars/04.webp" },
  { id: "bear", symbol: "🐻", label: "Gấu", image: "/werewolf/avatars/05.webp" },
  { id: "owl", symbol: "🦉", label: "Cú Tiên Tri", image: "/werewolf/avatars/06.webp" },
  { id: "farmer", symbol: "🌻", label: "Nông Dân", image: "/werewolf/avatars/07.webp" },
  { id: "hunter", symbol: "🏹", label: "Thợ Săn", image: "/werewolf/avatars/08.webp" },
  { id: "cat", symbol: "🐱", label: "Mèo Đêm", image: "/werewolf/avatars/09.webp" },
  { id: "moon", symbol: "🌙", label: "Tư Tế Trăng", image: "/werewolf/avatars/10.webp" },
  { id: "blacksmith", symbol: "🔨", label: "Thợ Rèn", image: "/werewolf/avatars/11.webp" },
  { id: "chef", symbol: "👨‍🍳", label: "Đầu Bếp", image: "/werewolf/avatars/12.webp" },
  { id: "elder", symbol: "🧙", label: "Trưởng Lão", image: "/werewolf/avatars/13.webp" },
  { id: "boy", symbol: "🪀", label: "Cậu Bé Ná", image: "/werewolf/avatars/14.webp" },
  { id: "tavern", symbol: "🍺", label: "Chủ Quán", image: "/werewolf/avatars/15.webp" },
  { id: "raven", symbol: "🐦‍⬛", label: "Quạ Đưa Tin", image: "/werewolf/avatars/16.webp" },
  { id: "deer", symbol: "🦌", label: "Hươu", image: "/werewolf/avatars/17.webp" },
  { id: "rabbit", symbol: "🐰", label: "Thỏ", image: "/werewolf/avatars/18.webp" },
  { id: "boar", symbol: "🐗", label: "Lợn Rừng", image: "/werewolf/avatars/19.webp" },
  { id: "whitewolf", symbol: "❄️", label: "Sói Trắng", image: "/werewolf/avatars/20.webp" },
  { id: "witch", symbol: "🧪", label: "Phù Thủy", image: "/werewolf/avatars/21.webp" },
  { id: "knight", symbol: "🛡️", label: "Hiệp Sĩ", image: "/werewolf/avatars/22.webp" },
  { id: "fisher", symbol: "🎣", label: "Ngư Dân", image: "/werewolf/avatars/23.webp" },
  { id: "bard", symbol: "🎻", label: "Hát Rong", image: "/werewolf/avatars/24.webp" },
  { id: "reaper", symbol: "💀", label: "Tử Thần", image: "/werewolf/avatars/25.webp" },
  { id: "monk", symbol: "🙏", label: "Nhà Sư", image: "/werewolf/avatars/26.webp" },
  { id: "gravedigger", symbol: "⛏️", label: "Đào Mộ", image: "/werewolf/avatars/27.webp" },
  { id: "ghost", symbol: "👻", label: "Bé Ma", image: "/werewolf/avatars/28.webp" },
  { id: "forager", symbol: "🍄", label: "Hái Nấm", image: "/werewolf/avatars/29.webp" },
  { id: "mayor", symbol: "🎩", label: "Thị Trưởng", image: "/werewolf/avatars/30.webp" },
] as const;

export const CUSTOM_WEREWOLF_AVATAR_ID = "custom" as const;

export type WerewolfPresetAvatarId = (typeof WEREWOLF_AVATAR_PRESETS)[number]["id"];
export type WerewolfAvatarId = WerewolfPresetAvatarId | typeof CUSTOM_WEREWOLF_AVATAR_ID;
export type WerewolfAvatarPreset = (typeof WEREWOLF_AVATAR_PRESETS)[number];

export const DEFAULT_WEREWOLF_AVATAR_ID: WerewolfAvatarId = "wolf";

/** Max data-URL length (~36KB binary). Keeps room docs under Firestore limits. */
export const WEREWOLF_AVATAR_URL_MAX_LENGTH = 48_000;
export const WEREWOLF_AVATAR_UPLOAD_SIZE = 192;

export function isValidWerewolfAvatarId(value: string): value is WerewolfAvatarId {
  if (value === CUSTOM_WEREWOLF_AVATAR_ID) return true;
  return WEREWOLF_AVATAR_PRESETS.some((avatar) => avatar.id === value);
}

export function isPresetWerewolfAvatarId(value: string): value is WerewolfPresetAvatarId {
  return WEREWOLF_AVATAR_PRESETS.some((avatar) => avatar.id === value);
}

export function normalizeWerewolfAvatarId(value: unknown): WerewolfAvatarId {
  const id = String(value ?? "").trim();
  return isValidWerewolfAvatarId(id) ? id : DEFAULT_WEREWOLF_AVATAR_ID;
}

export function normalizeWerewolfAvatarUrl(value: unknown): string | null {
  const url = String(value ?? "").trim();
  if (!url) return null;
  if (url.length > WEREWOLF_AVATAR_URL_MAX_LENGTH) return null;
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(url)) {
    return null;
  }
  return url;
}

export function getWerewolfAvatarPreset(avatarId: unknown): WerewolfAvatarPreset {
  const id = normalizeWerewolfAvatarId(avatarId);
  if (id === CUSTOM_WEREWOLF_AVATAR_ID) {
    return WEREWOLF_AVATAR_PRESETS[0];
  }
  return (
    WEREWOLF_AVATAR_PRESETS.find((avatar) => avatar.id === id) ??
    WEREWOLF_AVATAR_PRESETS[0]
  );
}

export function getWerewolfAvatarDisplay(
  avatarId: unknown,
  avatarUrl?: unknown
): { id: WerewolfAvatarId; label: string; image: string; isCustom: boolean } {
  const customUrl = normalizeWerewolfAvatarUrl(avatarUrl);
  if (customUrl) {
    return {
      id: CUSTOM_WEREWOLF_AVATAR_ID,
      label: "Ảnh của bạn",
      image: customUrl,
      isCustom: true,
    };
  }

  const preset = getWerewolfAvatarPreset(avatarId);
  return {
    id: preset.id,
    label: preset.label,
    image: preset.image,
    isCustom: false,
  };
}

export function getDefaultWerewolfAvatarForUsername(username: string) {
  if (!username) return DEFAULT_WEREWOLF_AVATAR_ID;
  let hash = 0;
  for (let index = 0; index < username.length; index++) {
    hash = (hash << 5) - hash + username.charCodeAt(index);
    hash |= 0;
  }
  return WEREWOLF_AVATAR_PRESETS[Math.abs(hash) % WEREWOLF_AVATAR_PRESETS.length].id;
}

/** Browser-only: square-crop + JPEG compress a picked photo. */
export async function compressWerewolfAvatarFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Chỉ nhận file ảnh.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Ảnh quá lớn (tối đa 8MB).");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(objectUrl);
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    if (!side) throw new Error("Không đọc được ảnh.");

    const sx = (image.naturalWidth - side) / 2;
    const sy = (image.naturalHeight - side) / 2;
    const size = WEREWOLF_AVATAR_UPLOAD_SIZE;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Không xử lý được ảnh.");

    ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);

    let quality = 0.82;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > WEREWOLF_AVATAR_URL_MAX_LENGTH && quality > 0.4) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    if (dataUrl.length > WEREWOLF_AVATAR_URL_MAX_LENGTH) {
      throw new Error("Ảnh vẫn quá lớn sau khi nén. Thử ảnh khác.");
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không đọc được ảnh."));
    image.src = src;
  });
}

import {
  CUSTOM_WEREWOLF_AVATAR_ID,
  getDefaultWerewolfAvatarForUsername,
  normalizeWerewolfAvatarId,
  normalizeWerewolfAvatarUrl,
} from "@/_lib/werewolf/avatars";

export function resolveWerewolfAvatarFromBody(
  body: Record<string, unknown> | null | undefined,
  username: string
) {
  const avatarUrl = normalizeWerewolfAvatarUrl(body?.avatarUrl);
  if (avatarUrl) {
    return {
      avatarId: CUSTOM_WEREWOLF_AVATAR_ID,
      avatarUrl,
    };
  }

  return {
    avatarId: normalizeWerewolfAvatarId(
      body?.avatarId ?? getDefaultWerewolfAvatarForUsername(username)
    ),
    avatarUrl: null as string | null,
  };
}

"use client";

import Image from "next/image";

interface WerewolfAvatarImageProps {
  src: string;
  alt: string;
  size: number;
  className?: string;
}

/** Presets use next/image; custom data-URLs use a plain img. */
export default function WerewolfAvatarImage({
  src,
  alt,
  size,
  className,
}: WerewolfAvatarImageProps) {
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={className}
        draggable={false}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

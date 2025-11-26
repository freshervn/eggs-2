"use client";

import { QRCodeSVG } from "qrcode.react";

type QRCodeProps = {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;
};

const QRCode = ({
  value,
  size = 256,
  level = "M",
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  includeMargin = true,
}: QRCodeProps) => {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level={level}
      bgColor={bgColor}
      fgColor={fgColor}
      includeMargin={includeMargin}
    />
  );
};

export default QRCode;


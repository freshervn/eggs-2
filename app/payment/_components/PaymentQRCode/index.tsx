"use client";

import dynamic from "next/dynamic";

const QRCode = dynamic(
  () => import("@/app/_components/QRCode").then((mod) => mod.default),
  { ssr: false }
);

type PaymentQRCodeProps = {
  paymentUrl?: string;
  size?: number;
  title?: string;
  description?: string;
};

const PaymentQRCode = ({
  paymentUrl,
  size = 200,
  title = "Quét mã QR để thanh toán",
  description = "Quét mã qua ứng dụng MoMo",
}: PaymentQRCodeProps) => {
  return (
    <div className="flex flex-col items-center justify-center mt-8 mb-4">
      <h1 className="text-3xl text-black text-center">
        Chúc mừng, bạn đã đặt hàng thành công
      </h1>
      {paymentUrl ? (
        <>
          <h2 className="text-xl font-semibold mb-4 text-black mt-4">{title}</h2>
          <div className="p-4 bg-white rounded-lg shadow-lg border border-amber-200">
            <QRCode
              value={paymentUrl}
              size={size}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{description}</p>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 px-6 py-3 bg-[#A50064] hover:bg-[#8B0052] text-white font-semibold rounded-full shadow transition-all duration-200"
          >
            Thanh toán bằng MoMo
          </a>
        </>
      ) : (
        <p className="text-gray-600 mt-4">Đang tạo link thanh toán...</p>
      )}
    </div>
  );
};

export default PaymentQRCode;

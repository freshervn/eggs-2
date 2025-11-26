"use client";

// import QRCode from "../../../components/QRCode";

type PaymentQRCodeProps = {
  paymentUrl?: string;
  size?: number;
  title?: string;
  description?: string;
};

const PaymentQRCode = ({}: // paymentUrl = "https://example.com/payment/12345",
// size = 200,
// title = "Quét mã QR để thanh toán",
// description = "Hoặc quét mã QR ở trên",
PaymentQRCodeProps) => {
  return (
    <div className="flex flex-col items-center justify-center mt-8 mb-4">
      <h1>Chúc mừng, bạn đã đặt hàng thành công</h1>
      {/* <h2 className="text-xl font-semibold mb-4 text-black">{title}</h2>
      <div className="p-4 bg-white rounded-lg shadow-lg border border-pink-500">
        <QRCode
          value={paymentUrl}
          size={size}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
      <h3 className="text-black mt-2">Hoặc</h3>
      <button className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow transition-all duration-200">
        Thanh toán bằng tiền mặt
      </button> */}
    </div>
  );
};

export default PaymentQRCode;

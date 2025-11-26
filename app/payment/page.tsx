"use client";

import { useState } from "react";
import ListItem from "./_components/ListItem";
import PaymentQRCode from "./_components/PaymentQRCode";
import Modal from "../_components/Modal";
import DeliveryAddress from "./_components/DeliveryAddress";

const Payment = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [orderId, setOrderId] = useState<string | undefined>();

  // Generate payment URL with order ID if available
  const paymentUrl = orderId
    ? `https://example.com/payment/${orderId}`
    : "https://example.com/payment/12345";

  const handleOpenModal = () => {
    setIsOpen(true);
    setShowQRCode(false);
    setOrderId(undefined);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setShowQRCode(false);
    setOrderId(undefined);
  };

  const handleAddressSubmit = (createdOrderId?: string) => {
    if (createdOrderId) {
      setOrderId(createdOrderId);
    }
    setShowQRCode(true);
  };

  return (
    <>
      <ListItem />

      <div className=" justify-center flex mt-4 w-full">
        <button
          type="button"
          className="bg-yellow-400  text-white py-3 px-8 rounded-full font-semibold shadow-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 active:scale-95"
          onClick={handleOpenModal}
        >
          Thanh toán
        </button>
      </div>
      <Modal isOpen={isOpen} onRequestClose={handleCloseModal}>
        {showQRCode ? (
          <PaymentQRCode
            paymentUrl={paymentUrl}
            description="Quét mã qua ứng dụng momo"
          />
        ) : (
          <DeliveryAddress onAddressSubmit={handleAddressSubmit} />
        )}
      </Modal>
    </>
  );
};

export default Payment;

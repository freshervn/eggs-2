"use client";
import Image from "next/image";
import Modal from "../Modal";
import { useState } from "react";
import classNames from "classnames";
import { useCartStore } from "@/_lib/store/cartStore";

type Egg = {
  id: string | number;
  name: string;
  price: number;
};

type EggListProps = {
  data: Egg[];
};
const amounts = [10, 20, 30, 40, 50];

const EggList = ({ data }: EggListProps) => {
  const addToCart = useCartStore((state) => state.addToCart);

  const [isopenModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Egg | null>(null);

  const openModal = (item: Egg) => {
    setSelectedItem(item);
    setOpenModal(true);
  };
  const closeModal = () => {
    setOpenModal(false);
    setSelectedItem(null);
  };
  const [amount, setAmount] = useState(10);
  const quickSetAmount = (amount: number) => {
    setAmount(amount);
    bounce();
  };
  const handleSetAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const getnumber = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;
    setAmount(Number(getnumber(value)));
    bounce();
  };
  const increase = () => {
    setAmount((prev) => prev + 10);
    bounce();
  };
  const decrease = () => {
    setAmount((prev) => (prev - 10 > 0 ? prev - 10 : 0));
    bounce();
  };
  const [isBounce, setBounce] = useState(false);
  const bounce = () => {
    setBounce(true);
    setTimeout(() => {
      setBounce(false);
    }, 300);
  };

  const handleAddToCart = () => {
    if (selectedItem && amount > 0) {
      addToCart({
        id: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.price,
        quantity: amount,
      });
      closeModal();
      setAmount(10);
    }
  };

  return (
    <>
      <div className="w-full grid grid-rows-3 gap-4 h-full">
        {data.map((item) => (
          <div
            className="w-full bg-green-500 p-4 grid grid-cols-2 rounded-md"
            key={item.id}
            onClick={() => openModal(item)}
          >
            <aside className="overflow-hidden">
              <Image
                src="/chiken%20eggs.jpg"
                width={100}
                height={100}
                alt={item.name}
                className="w-full object-cover bg-white"
              />
            </aside>
            <aside className="px-3">
              <h1 className="font-semibold text-2xl mb-2">{item.name}</h1>
              <h2>
                {(item.price * 10).toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}{" "}
                / 10 quả
              </h2>
            </aside>
          </div>
        ))}
      </div>
      <Modal isOpen={isopenModal} onRequestClose={closeModal}>
        <div className="text-black">
          <h3 className="text-center text-3xl mb-4 ">Chọn số Lượng mua</h3>
          <h6 className="mb-2">Chọn nhanh</h6>
          <div className="grid grid-cols-5 gap-4">
            {amounts.map((amount, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center p-4 font-semibold text-1xl rounded-md bg-yellow-400"
                onClick={() => quickSetAmount(amount)}
              >
                {amount}
              </div>
            ))}
          </div>
          <div className="mb-12 mt-8">
            <label
              htmlFor="custom-quantity"
              className="text-sm text-gray-600 mb-4 block"
            >
              Hoặc Nhập số lượng:
            </label>
            <div className="flex justify-center gap-2">
              <button
                className="bg-red-400 px-4 py-1 rounded-md"
                onClick={decrease}
              >
                {" "}
                -{" "}
              </button>
              <input
                id="custom-quantity"
                type="text"
                min={1}
                step={10}
                value={amount}
                onChange={handleSetAmount}
                className="border rounded px-2 py-1 w-20"
                placeholder="Nhập số"
              />
              <button
                className="bg-green-400 px-4 py-1 rounded-md"
                onClick={increase}
              >
                {" "}
                +{" "}
              </button>
            </div>
          </div>
          <p className="mb-12">
            Số lượng bạn đặt:{" "}
            <span
              className={classNames(
                { "animate-bounce text-blue-500": isBounce },
                "text-2xl inline-block"
              )}
            >
              {amount}
            </span>
          </p>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors font-semibold"
            >
              Thanh toán
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors font-semibold"
            >
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
export default EggList;

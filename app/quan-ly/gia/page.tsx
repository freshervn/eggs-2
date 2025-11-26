"use client";
import Modal from "@/app/_components/Modal";
import { useEffect, useState } from "react";
import { UpdateItemForm } from "./_components";
import { getItems, Item } from "@/_lib/api/items";

export default function Home() {
  const [isopenModal, setOpenModal] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [item, setItem] = useState<Item>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getItems()
      .then((items) => {
        setItems(items);
      })
      .catch((e) => setError(e.message));
  }, []);

  const closeModal = () => {
    setOpenModal(false);
    setItem(undefined);
  };

  // Handle saving updated item
  const handleUpdateItem = async (updatedItem: Item) => {
    setLoading(true);
    setError(null);
    try {
      // updateItem comes from your api module
      const { updateItem } = await import("@/_lib/api/items");
      const returnedItem = await updateItem(updatedItem);
      setItems((prev) =>
        prev.map((i) => (i.id === returnedItem.id ? returnedItem : i))
      );
      setOpenModal(false);
      setItem(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="pt-4">
        <div className="w-full">
          <h1 className="text-3xl text-black text-center mb-8">Cập nhật giá</h1>
          {error && (
            <div className="text-red-500 text-center mb-4">{error}</div>
          )}
          <div className="grid grid-rows-3 gap-3 text-black">
            {items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="w-full bg-blue-300 p-6 rounded-2xl cursor-pointer"
                  onClick={() => {
                    setItem(item);
                    setOpenModal(true);
                  }}
                >
                  <h1>{item.name}</h1>
                  <div className="text-lg mt-2">
                    {item?.price?.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}{" "}
                    / 10 quả
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Modal isOpen={isopenModal} onRequestClose={closeModal}>
        {item && (
          <div>
            <UpdateItemForm
              onSave={handleUpdateItem}
              onCancel={closeModal}
              item={item}
            />
            {loading && (
              <div className="mt-4 text-center text-blue-600">
                Đang cập nhật...
              </div>
            )}
            {error && (
              <div className="mt-4 text-center text-red-500">{error}</div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

"use client";
import { Item } from "@/_lib/api/items";
import { useState } from "react";

type UpdateFormProps = {
  item: Item;
  onSave: (updatedItem: Item) => void;
  onCancel?: () => void;
};

export function UpdateItemForm({ item, onSave, onCancel }: UpdateFormProps) {
  const [formState, setFormState] = useState<Item>({ ...item });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.name && formState.price > 0) {
      onSave(formState);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-black">
      <div>
        <label className="block mb-1" htmlFor="name">
          Tên mặt hàng
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formState.name}
          onChange={handleChange}
          className="w-full px-2 py-1 border rounded"
          required
        />
      </div>
      <div>
        <label className="block mb-1" htmlFor="price">
          Giá (VND/10 quả)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min={1}
          value={formState.price}
          onChange={handleChange}
          className="w-full px-2 py-1 border rounded"
          required
        />
      </div>
      <div>
        <label className="block mb-1" htmlFor="img">
          Ảnh (URL)
        </label>
        <input
          id="img"
          name="img"
          type="text"
          value={formState.img || ""}
          onChange={handleChange}
          className="w-full px-2 py-1 border rounded"
          placeholder="URL ảnh..."
        />
      </div>
      <div className="flex gap-4 justify-end">
        <button
          type="submit"
          className="bg-green-500 px-4 py-2 rounded text-white font-semibold"
        >
          Cập nhật
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 px-4 py-2 rounded text-white"
          >
            Huỷ
          </button>
        )}
      </div>
    </form>
  );
}

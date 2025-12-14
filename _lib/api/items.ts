export type Item = {
  id: string | number;
  name: string;
  price: number;
  img?: string;
};

export async function getItems() {
  const res = await fetch("/api/items");
  if (!res.ok) {    
    throw new Error("Failed to fetch items");
  }
  const data = await res.json();
  return data.items;
}
export async function updateItem(item: Item) {
  const res = await fetch("/api/items", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update item");
  }
  const data = await res.json();
  return data.item;
}


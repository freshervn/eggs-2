import EggList from "./_components/EggList";
import Link from "next/link";
const data = [
  {
    id: 1,
    img: "/chiken eggs.png",
    price: 3000,
    name: "Trứng gà",
  },
  {
    id: 2,
    img: "/chiken eggs.png",
    price: 2600,
    name: "Trứng vịt",
  },
  {
    id: 3,
    img: "/chiken eggs.png",
    price: 4500,
    name: "Trứng vịt lộn",
  },
];
export default function Home() {
  return (
    <>
      <div className="h-dvh w-100dvw scroll-auto overflow-auto pb-20 pt-4">
        <EggList data={data} />
        <div className="bottom-0 left-0 w-full flex justify-center bg-yellow-500 absolute h-16">
          <div className="">
            <Link href="/payment" className="flex items-center h-full">
              <button className="relative inline-block rounded-full bg-red-400 p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 text-white drop-shadow-lg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.72A1 1 0 0 0 6.53 17h10.94a1 1 0 0 0 .88-1.45L17 13M7 13V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7"
                  />
                  <circle cx="7.5" cy="20.5" r="1.5" />
                  <circle cx="16.5" cy="20.5" r="1.5" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

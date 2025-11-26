import Link from "next/link";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <div className="bottom-0 left-0 w-full flex bg-green-500 absolute h-16 justify-between px-16 text-white">
        <div className="">
          <Link href="/gia" className="flex items-center h-full">
            <button className="relative inline-block rounded-full bg-blue-500 p-2">
              <span>Giá</span>
            </button>
          </Link>
        </div>
        <div className="">
          <Link href="/quan-ly" className="flex items-center h-full">
            <button className="relative inline-block rounded-full bg-yellow-500 p-2">
              <span>Đơn</span>
            </button>
          </Link>
        </div>
        <div>
          <Link href="/no" className="flex items-center h-full">
            <button className="relative inline-block rounded-full bg-red-500 p-2">
              <span>Nợ</span>
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}

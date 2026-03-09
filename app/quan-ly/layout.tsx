import { readSession } from "@/_lib/auth/session";
import LogoutButton from "../_components/LogoutButton";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await readSession();

  if (!session) {
    redirect("/login?next=/quan-ly");
  }

  return (
    <>
      <div className="h-dvh w-100dvw scroll-auto overflow-auto pb-20 pt-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="font-semibold text-slate-900">
              {session.displayName} (@{session.username})
            </p>
          </div>
          <LogoutButton nextPath="/quan-ly" />
        </div>
        {children}
        <div className="bottom-0 left-0 w-full flex bg-green-500 absolute h-16 justify-between px-16 text-white">
          <div className="">
            <Link
              href="/quan-ly/gia"
              className="flex items-center h-full text-xl"
            >
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
            <Link href="/quan-ly/no" className="flex items-center h-full">
              <button className="relative inline-block rounded-full bg-red-500 p-2">
                <span>Nợ</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

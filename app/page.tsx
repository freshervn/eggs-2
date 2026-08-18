import Link from "next/link";
import { readSession } from "@/_lib/auth/session";
import HomeAuthCorner from "./_components/HomeAuthCorner";
import { getHubDestinations } from "./_components/hub-destinations";

export default async function Home() {
  const session = await readSession();
  const destinations = getHubDestinations();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/80 px-4 py-12 pt-20">
      <HomeAuthCorner
        session={
          session
            ? { displayName: session.displayName }
            : null
        }
      />

      <div className="w-full max-w-md">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Eggs
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Where do you want to go?
          </p>
        </header>

        <nav
          className="mt-10 flex flex-col gap-3"
          aria-label="Main navigation"
        >
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col rounded-2xl border border-slate-200 border-l-4 bg-white py-4 pl-4 pr-5 shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${item.accentClass}`}
            >
              <span className="text-lg font-semibold text-slate-900">
                {item.label}
              </span>
              <span className="mt-1 text-sm leading-snug text-slate-600">
                {item.description}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

import Link from "next/link";
import ThreeDemo from "./_components/ThreeDemo";

export default function ThreeDPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-3 py-8 text-slate-100 sm:px-4 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            ← Home
          </Link>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              3D Demo
            </div>
            <div className="text-sm text-slate-300">
              Click the view to lock mouse. WASD to move, mouse to look.
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/30 shadow-2xl shadow-black/40">
          <ThreeDemo />
        </div>
      </div>
    </div>
  );
}


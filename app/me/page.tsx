import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dayton Bui — About me",
  description: "Dayton Bui (Bùi Thành Đạt) — developer & freelancer.",
};

/** Edit this object to update what appears on /me */
const profile = {
  name: "Dayton Bui",
  legalName: "Bùi Thành Đạt",
  tagline: "Full-stack developer · Available for freelance work",
  bio: [
    "I build web apps with a focus on clear UX, solid architecture, and shipping on time.",
    "Comfortable across the stack: React/Next.js, APIs, databases, and deployment.",
  ],
  skills: [
    "TypeScript & React",
    "Next.js & Node",
    "APIs & integrations",
    "Firebase / realtime features",
  ],
  links: [
    { label: "daytonbui0201@gmail.com", href: "mailto:daytonbui0201@gmail.com" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/dayton-bui-093b58275/",
    },
  ],
};

export default function MePage() {
  return (
    <div className="min-h-dvh bg-slate-100 py-12 text-slate-900">
      <div className="mx-auto max-w-2xl px-4">
        <Link
          href="/"
          className="mb-8 inline-block text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          ← Home
        </Link>

        <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <header className="border-b border-slate-100 pb-8">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Profile
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {profile.name}
            </h1>
            <p className="mt-1 text-lg text-slate-500">{profile.legalName}</p>
            <p className="mt-3 text-lg text-slate-600">{profile.tagline}</p>
          </header>

          <section className="mt-8 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              About
            </h2>
            {profile.bio.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Skills
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Contact
            </h2>
            <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
              {profile.links.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="font-medium text-sky-700 underline-offset-4 hover:text-sky-900 hover:underline"
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}

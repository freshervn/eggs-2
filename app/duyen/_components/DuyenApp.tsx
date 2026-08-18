"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Be_Vietnam_Pro, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import {
  CITIES,
  MOCK_PROFILES,
  type DuyenProfile,
} from "../_data/profiles";

const display = Source_Serif_4({
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-duyen-display",
});

const sans = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-duyen-sans",
});

type View = "home" | "browse" | "create";

export default function DuyenApp() {
  const [view, setView] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Tất cả");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return profiles.filter((p) => {
      const matchCity = city === "Tất cả" || p.city === city;
      if (!matchCity) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.interests.some((i) => i.toLowerCase().includes(q)) ||
        p.lookingFor.toLowerCase().includes(q)
      );
    });
  }, [profiles, deferredQuery, city]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  function toggleLike(id: string, name: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast(`Đã bỏ thích ${name}`);
      } else {
        next.add(id);
        showToast(`Đã gửi duyên tới ${name}`);
      }
      return next;
    });
  }

  function goBrowse() {
    startTransition(() => setView("browse"));
    requestAnimationFrame(() => {
      document.getElementById("duyen-browse")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <div
      className={`${display.variable} ${sans.variable} duyen-root min-h-dvh`}
    >
      {view === "home" ? (
        <Hero
          onBrowse={goBrowse}
          onCreate={() => startTransition(() => setView("create"))}
        />
      ) : null}

      {view === "browse" || view === "home" ? (
        <BrowseSection
          visible={view === "browse"}
          query={query}
          city={city}
          filtered={filtered}
          liked={liked}
          isPending={isPending}
          onQuery={setQuery}
          onCity={setCity}
          onLike={toggleLike}
          onBack={() => startTransition(() => setView("home"))}
          onCreate={() => startTransition(() => setView("create"))}
        />
      ) : null}

      {view === "create" ? (
        <CreateProfile
          onBack={() => startTransition(() => setView("browse"))}
          onSubmit={(profile) => {
            setProfiles((prev) => [profile, ...prev]);
            startTransition(() => setView("browse"));
            showToast("Hồ sơ của bạn đã lên Duyên");
          }}
        />
      ) : null}

      {toast ? (
        <div className="duyen-toast" role="status">
          {toast}
        </div>
      ) : null}

      <style jsx global>{`
        .duyen-root {
          --duyen-ink: #1c2421;
          --duyen-mist: #e8f0ec;
          --duyen-fog: #d2e3db;
          --duyen-leaf: #2f6b5a;
          --duyen-leaf-deep: #1f4d42;
          --duyen-coral: #d4674a;
          --duyen-sand: #f3ebe2;
          --duyen-cream: #f7f4ef;
          --font-display: var(--font-duyen-display), "Source Serif 4", serif;
          --font-body: var(--font-duyen-sans), "Be Vietnam Pro", sans-serif;
          color: var(--duyen-ink);
          font-family: var(--font-body);
          background:
            radial-gradient(
              120% 80% at 10% -10%,
              #dfece6 0%,
              transparent 55%
            ),
            radial-gradient(
              90% 60% at 100% 0%,
              #f0e6dc 0%,
              transparent 50%
            ),
            linear-gradient(180deg, #eef5f1 0%, var(--duyen-cream) 42%, #ebe4da 100%);
        }

        .duyen-hero {
          position: relative;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
          padding: 1.5rem 1.25rem 3rem;
        }

        .duyen-hero-bg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              180deg,
              rgba(28, 36, 33, 0.15) 0%,
              rgba(28, 36, 33, 0.55) 55%,
              rgba(28, 36, 33, 0.82) 100%
            ),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%237aa89a'/%3E%3Cstop offset='45%25' stop-color='%23c4a882'/%3E%3Cstop offset='100%25' stop-color='%23d4674a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='800' fill='url(%23sky)'/%3E%3Ccircle cx='920' cy='160' r='70' fill='%23f5e6c8' opacity='0.85'/%3E%3Cpath d='M0 520 C200 460 320 580 500 540 C680 500 780 420 1200 480 L1200 800 L0 800 Z' fill='%231f4d42' opacity='0.55'/%3E%3Cpath d='M0 580 C180 540 340 620 520 590 C720 555 900 500 1200 560 L1200 800 L0 800 Z' fill='%231c2421' opacity='0.45'/%3E%3C/svg%3E");
          background-size: cover;
          background-position: center;
          animation: duyen-dawn 14s ease-in-out infinite alternate;
        }

        .duyen-hero-glow {
          position: absolute;
          width: 42vw;
          max-width: 420px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(244, 210, 160, 0.35) 0%,
            transparent 70%
          );
          top: 8%;
          right: 8%;
          animation: duyen-breathe 6s ease-in-out infinite;
          pointer-events: none;
        }

        .duyen-hero-content {
          position: relative;
          z-index: 1;
          max-width: 36rem;
          color: #f7f4ef;
          animation: duyen-rise 0.9s ease-out both;
        }

        .duyen-brand {
          font-family: var(--font-display);
          font-size: clamp(3.5rem, 14vw, 6.5rem);
          font-weight: 600;
          line-height: 0.95;
          letter-spacing: -0.03em;
        }

        .duyen-headline {
          margin-top: 1.25rem;
          font-family: var(--font-display);
          font-size: clamp(1.35rem, 4.2vw, 1.85rem);
          font-weight: 500;
          line-height: 1.35;
          max-width: 18ch;
        }

        .duyen-sub {
          margin-top: 0.85rem;
          font-size: 1rem;
          line-height: 1.55;
          color: rgba(247, 244, 239, 0.82);
          max-width: 32ch;
        }

        .duyen-cta-row {
          margin-top: 1.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
        }

        .duyen-btn {
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          padding: 0.85rem 1.35rem;
          border-radius: 0.65rem;
          transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .duyen-btn:active {
          transform: scale(0.98);
        }

        .duyen-btn-primary {
          background: var(--duyen-coral);
          color: #fff;
        }

        .duyen-btn-primary:hover {
          background: #c2553c;
        }

        .duyen-btn-ghost {
          background: transparent;
          color: #f7f4ef;
          border: 1.5px solid rgba(247, 244, 239, 0.45);
        }

        .duyen-btn-ghost:hover {
          border-color: rgba(247, 244, 239, 0.8);
          background: rgba(247, 244, 239, 0.08);
        }

        .duyen-home-link {
          position: absolute;
          top: 1.25rem;
          left: 1.25rem;
          z-index: 2;
          color: rgba(247, 244, 239, 0.75);
          font-size: 0.875rem;
          text-decoration: none;
        }

        .duyen-home-link:hover {
          color: #f7f4ef;
        }

        .duyen-browse {
          min-height: 100dvh;
          padding: 1.5rem 1.25rem 4rem;
          max-width: 72rem;
          margin: 0 auto;
        }

        .duyen-browse-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.75rem;
          animation: duyen-rise 0.55s ease-out both;
        }

        .duyen-browse-title {
          font-family: var(--font-display);
          font-size: clamp(1.75rem, 5vw, 2.35rem);
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .duyen-browse-desc {
          margin-top: 0.35rem;
          color: rgba(28, 36, 33, 0.65);
          font-size: 0.95rem;
        }

        .duyen-filters {
          display: grid;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          animation: duyen-rise 0.65s ease-out 0.08s both;
        }

        @media (min-width: 640px) {
          .duyen-filters {
            grid-template-columns: 1fr auto;
            align-items: center;
          }
        }

        .duyen-input,
        .duyen-select,
        .duyen-textarea {
          width: 100%;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--duyen-ink);
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(28, 36, 33, 0.12);
          border-radius: 0.65rem;
          padding: 0.8rem 1rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .duyen-input:focus,
        .duyen-select:focus,
        .duyen-textarea:focus {
          border-color: var(--duyen-leaf);
          box-shadow: 0 0 0 3px rgba(47, 107, 90, 0.15);
        }

        .duyen-select {
          min-width: 11rem;
        }

        .duyen-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 640px) {
          .duyen-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .duyen-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .duyen-card {
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(28, 36, 33, 0.08);
          border-radius: 1rem;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          animation: duyen-rise 0.5s ease-out both;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }

        .duyen-card:hover {
          transform: translateY(-2px);
          border-color: rgba(47, 107, 90, 0.28);
        }

        .duyen-avatar {
          width: 3.25rem;
          height: 3.25rem;
          border-radius: 0.85rem;
          display: grid;
          place-items: center;
          color: #fff;
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .duyen-card-top {
          display: flex;
          gap: 0.85rem;
          align-items: flex-start;
        }

        .duyen-name {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 600;
          line-height: 1.2;
        }

        .duyen-meta {
          margin-top: 0.2rem;
          font-size: 0.85rem;
          color: rgba(28, 36, 33, 0.58);
        }

        .duyen-bio {
          font-size: 0.92rem;
          line-height: 1.55;
          color: rgba(28, 36, 33, 0.82);
          flex: 1;
        }

        .duyen-looking {
          font-size: 0.85rem;
          color: var(--duyen-leaf-deep);
          line-height: 1.4;
        }

        .duyen-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .duyen-tag {
          font-size: 0.75rem;
          padding: 0.28rem 0.55rem;
          border-radius: 0.4rem;
          background: var(--duyen-mist);
          color: var(--duyen-leaf-deep);
        }

        .duyen-like {
          align-self: flex-start;
          margin-top: 0.25rem;
          background: transparent;
          border: 1.5px solid var(--duyen-leaf);
          color: var(--duyen-leaf-deep);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.55rem 0.95rem;
          border-radius: 0.55rem;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .duyen-like:hover {
          background: rgba(47, 107, 90, 0.08);
        }

        .duyen-like.is-liked {
          background: var(--duyen-leaf);
          color: #fff;
          border-color: var(--duyen-leaf);
        }

        .duyen-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: rgba(28, 36, 33, 0.55);
        }

        .duyen-create {
          min-height: 100dvh;
          max-width: 32rem;
          margin: 0 auto;
          padding: 1.5rem 1.25rem 4rem;
          animation: duyen-rise 0.55s ease-out both;
        }

        .duyen-form {
          display: grid;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .duyen-label {
          display: grid;
          gap: 0.4rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(28, 36, 33, 0.75);
        }

        .duyen-toast {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          background: var(--duyen-ink);
          color: #f7f4ef;
          padding: 0.75rem 1.15rem;
          border-radius: 0.65rem;
          font-size: 0.9rem;
          animation: duyen-toast-in 0.3s ease-out;
          max-width: calc(100vw - 2rem);
          text-align: center;
        }

        .duyen-nav-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .duyen-btn-secondary {
          background: var(--duyen-leaf);
          color: #fff;
        }

        .duyen-btn-secondary:hover {
          background: var(--duyen-leaf-deep);
        }

        .duyen-btn-text {
          background: transparent;
          color: var(--duyen-leaf-deep);
          padding: 0.85rem 0.75rem;
        }

        .duyen-root .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @keyframes duyen-rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes duyen-breathe {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }

        @keyframes duyen-dawn {
          from {
            filter: saturate(1) brightness(1);
          }
          to {
            filter: saturate(1.08) brightness(1.05);
          }
        }

        @keyframes duyen-toast-in {
          from {
            opacity: 0;
            transform: translate(-50%, 8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .duyen-hero-bg,
          .duyen-hero-glow,
          .duyen-hero-content,
          .duyen-browse-head,
          .duyen-filters,
          .duyen-card,
          .duyen-create,
          .duyen-toast {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Hero({
  onBrowse,
  onCreate,
}: {
  onBrowse: () => void;
  onCreate: () => void;
}) {
  return (
    <section className="duyen-hero" aria-label="Trang chủ Duyên">
      <div className="duyen-hero-bg" aria-hidden />
      <div className="duyen-hero-glow" aria-hidden />
      <Link href="/" className="duyen-home-link">
        ← Eggs
      </Link>
      <div className="duyen-hero-content">
        <p className="duyen-brand">Duyên</p>
        <h1 className="duyen-headline">Tìm người ấy giữa dòng đời.</h1>
        <p className="duyen-sub">
          Kết nối những trái tim cùng nhịp — chân thành, chậm rãi, đúng duyên.
        </p>
        <div className="duyen-cta-row">
          <button type="button" className="duyen-btn duyen-btn-primary" onClick={onBrowse}>
            Tìm người ấy
          </button>
          <button type="button" className="duyen-btn duyen-btn-ghost" onClick={onCreate}>
            Tạo hồ sơ
          </button>
        </div>
      </div>
    </section>
  );
}

function BrowseSection({
  visible,
  query,
  city,
  filtered,
  liked,
  isPending,
  onQuery,
  onCity,
  onLike,
  onBack,
  onCreate,
}: {
  visible: boolean;
  query: string;
  city: string;
  filtered: DuyenProfile[];
  liked: Set<string>;
  isPending: boolean;
  onQuery: (v: string) => void;
  onCity: (v: string) => void;
  onLike: (id: string, name: string) => void;
  onBack: () => void;
  onCreate: () => void;
}) {
  if (!visible) return null;

  return (
    <section id="duyen-browse" className="duyen-browse" aria-label="Tìm kiếm">
      <div className="duyen-browse-head">
        <div>
          <button type="button" className="duyen-btn duyen-btn-text" onClick={onBack}>
            ← Về Duyên
          </button>
          <h2 className="duyen-browse-title">Ai đang chờ duyên?</h2>
          <p className="duyen-browse-desc">
            Tìm theo tên, sở thích hoặc thành phố.
          </p>
        </div>
        <div className="duyen-nav-actions">
          <button
            type="button"
            className="duyen-btn duyen-btn-secondary"
            onClick={onCreate}
          >
            Tạo hồ sơ
          </button>
        </div>
      </div>

      <div className="duyen-filters">
        <label className="sr-only" htmlFor="duyen-search">
          Tìm kiếm
        </label>
        <input
          id="duyen-search"
          className="duyen-input"
          type="search"
          placeholder="Tìm tên, sở thích, điều mong muốn…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        <label className="sr-only" htmlFor="duyen-city">
          Thành phố
        </label>
        <select
          id="duyen-city"
          className="duyen-select"
          value={city}
          onChange={(e) => onCity(e.target.value)}
        >
          <option value="Tất cả">Tất cả thành phố</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="duyen-empty">Không tìm thấy ai phù hợp. Thử từ khóa khác nhé.</p>
      ) : (
        <div
          className="duyen-grid"
          style={{ opacity: isPending ? 0.72 : 1, transition: "opacity 0.2s" }}
        >
          {filtered.map((profile, index) => (
            <article
              key={profile.id}
              className="duyen-card"
              style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
            >
              <div className="duyen-card-top">
                <div
                  className="duyen-avatar"
                  style={{ background: profile.accent }}
                  aria-hidden
                >
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="duyen-name">{profile.name}</h3>
                  <p className="duyen-meta">
                    {profile.age} tuổi · {profile.city}
                  </p>
                </div>
              </div>
              <p className="duyen-bio">{profile.bio}</p>
              <p className="duyen-looking">
                Đang tìm: {profile.lookingFor}
              </p>
              <div className="duyen-tags">
                {profile.interests.map((tag) => (
                  <span key={tag} className="duyen-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className={`duyen-like${liked.has(profile.id) ? " is-liked" : ""}`}
                onClick={() => onLike(profile.id, profile.name)}
                aria-pressed={liked.has(profile.id)}
              >
                {liked.has(profile.id) ? "Đã gửi duyên" : "Gửi duyên"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CreateProfile({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (profile: DuyenProfile) => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("25");
  const [city, setCity] = useState<string>(CITIES[0]);
  const [bio, setBio] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [interests, setInterests] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !bio.trim()) return;

    onSubmit({
      id: `me-${Date.now()}`,
      name: trimmedName,
      age: Math.min(99, Math.max(18, Number(age) || 25)),
      city,
      bio: bio.trim(),
      lookingFor: lookingFor.trim() || "Người chân thành",
      interests: interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5),
      accent: "#2f6b5a",
    });
  }

  return (
    <section className="duyen-create" aria-label="Tạo hồ sơ">
      <button type="button" className="duyen-btn duyen-btn-text" onClick={onBack}>
        ← Quay lại
      </button>
      <h2 className="duyen-browse-title">Tạo hồ sơ của bạn</h2>
      <p className="duyen-browse-desc">
        Viết vài dòng thật — duyên đến từ sự chân thành.
      </p>

      <form className="duyen-form" onSubmit={handleSubmit}>
        <label className="duyen-label">
          Tên
          <input
            className="duyen-input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên bạn muốn hiện"
          />
        </label>
        <label className="duyen-label">
          Tuổi
          <input
            className="duyen-input"
            type="number"
            min={18}
            max={99}
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </label>
        <label className="duyen-label">
          Thành phố
          <select
            className="duyen-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="duyen-label">
          Giới thiệu
          <textarea
            className="duyen-textarea"
            required
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bạn là ai, thích gì, sống thế nào…"
          />
        </label>
        <label className="duyen-label">
          Đang tìm
          <input
            className="duyen-input"
            value={lookingFor}
            onChange={(e) => setLookingFor(e.target.value)}
            placeholder="Người chân thành, vui tính…"
          />
        </label>
        <label className="duyen-label">
          Sở thích (cách nhau bằng dấu phẩy)
          <input
            className="duyen-input"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="Cà phê, Du lịch, Âm nhạc"
          />
        </label>
        <button type="submit" className="duyen-btn duyen-btn-primary">
          Đăng hồ sơ
        </button>
      </form>
    </section>
  );
}

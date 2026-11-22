"use client";

import { useRef, useState } from "react";

export function ProductHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);

  function toggleMute() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPaused(false);
    } else {
      el.pause();
      setPaused(true);
    }
  }

  return (
    <section
      aria-label="Présentation vidéo LumiaSculpt™ Paris"
      className="relative w-full overflow-hidden border-b border-[#EFE1DA] bg-[#161012]"
    >
      {/* Mobile: clean unobstructed cinema frame on top melting into espresso editorial block below.
          Desktop (md+): full-bleed 78vh cinema hero with left-to-right scrim. */}
      <div className="relative flex flex-col md:block md:h-[78vh] md:min-h-[600px] md:max-h-[820px] w-full">
        {/* Video Stage */}
        <div className="relative aspect-[16/10] w-full overflow-hidden md:absolute md:inset-0 md:aspect-auto md:h-full">
          <video
            ref={videoRef}
            src="/videos/rituel-soiree.mp4"
            poster="/images/rituel-soiree-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover object-[58%_24%] md:object-[62%_28%]"
          />

          {/* Mobile: subtle bottom melt into the dark editorial section below (face & wand 100% uncovered!) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#161012] via-[#161012]/45 to-transparent md:hidden"
          />

          {/* Desktop: editorial left-to-right readability scrim */}
          <div
            aria-hidden="true"
            className="pointer-events-none hidden md:block absolute inset-0 bg-gradient-to-r from-[#161012]/82 via-[#161012]/42 to-transparent"
          />

          {/* Discreet Cinema Controls (Top-Right) */}
          <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={paused ? "Lire la vidéo" : "Mettre en pause"}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-[#161012]/50 px-2.5 sm:px-3 text-[11px] font-medium text-[#FFF8F5] backdrop-blur-md transition hover:bg-[#161012]/75"
            >
              <span>{paused ? "▶" : "❚❚"}</span>
              <span className="hidden sm:inline">{paused ? "Lire" : "Pause"}</span>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Activer le son" : "Couper le son"}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-[#161012]/50 px-2.5 sm:px-3 text-[11px] font-medium text-[#FFF8F5] backdrop-blur-md transition hover:bg-[#161012]/75"
            >
              <span>{muted ? "🔇" : "🔊"}</span>
              <span className="hidden sm:inline">{muted ? "Son coupé" : "Son actif"}</span>
            </button>
          </div>
        </div>

        {/* Editorial Content: sits cleanly below video on mobile (zero overlap!), overlaid left on desktop */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-4 pt-3 pb-7 sm:px-6 md:h-full md:py-0">
          <div className="max-w-lg space-y-3.5 md:space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-[#FFF5EF] backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#FF6B81]" />
                Institut LumiaSculpt™ • Paris
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF5EF]/15 px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-[#FFE2BA] backdrop-blur-md">
                ★★★★★ 4,9/5
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-serif)] text-[31px] font-bold leading-[1.06] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-5xl md:text-[56px]">
              Le soin cabine expert,{" "}
              <span className="italic text-[#FFAEBA]">dans votre rituel du soir.</span>
            </h1>

            <p className="max-w-md text-[13px] leading-relaxed text-[#F5EAE6]/90 sm:text-base">
              5 minutes devant la télé pour raffermir l&apos;ovale, lisser le cou et illuminer le
              teint grâce aux micro-courants EMS, aux LED 3 spectres et à la chaleur douce à 45 °C.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-0.5">
              <a
                href="#commander"
                className="rounded-full bg-gradient-to-r from-[#C8465A] via-[#BA3C51] to-[#A22E44] px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-[0_14px_32px_-8px_rgba(200,70,90,0.68)] transition hover:brightness-110"
              >
                Commander — 49,90 €
              </a>
              <a
                href="#technologie"
                className="rounded-full border border-white/28 bg-white/10 px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Action 3D sous la peau →
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 pt-0.5 text-[11px] font-medium text-[#EADBD5]/88">
              <span>✓ Livraison offerte</span>
              <span className="text-white/30">·</span>
              <span>✓ Essai 60 jours</span>
              <span className="text-white/30">·</span>
              <span>✓ Sans fil USB-C</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

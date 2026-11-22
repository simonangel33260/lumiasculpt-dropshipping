"use client";

import { useEffect, useRef, useState } from "react";

interface FocusZone {
  id: "pores" | "ovale" | "cou";
  label: string;
  metric: string;
  metricLabel: string;
  detail: string;
  pinX: number; // % from left
  pinY: number; // % from top
  revealPos: number; // slider % that showcases the split right over this zone
}

const FOCUS_ZONES: FocusZone[] = [
  {
    id: "pores",
    label: "Pores & grain de peau",
    metric: "-34 %",
    metricLabel: "aspect des pores",
    detail:
      "L'association lumière bleue 465 nm + chaleur douce 45 °C calme les rougeurs diffuses et resserre visiblement le grain sur les joues.",
    pinX: 46,
    pinY: 28,
    revealPos: 46,
  },
  {
    id: "ovale",
    label: "Ovale & ligne mandibulaire",
    metric: "+28 %",
    metricLabel: "fermeté perçue",
    detail:
      "Les micro-courants EMS réveillent le tonus des muscles profonds le long de la mâchoire pour redessiner des contours plus nets.",
    pinX: 49,
    pinY: 62,
    revealPos: 49,
  },
  {
    id: "cou",
    label: "Plis horizontaux du cou",
    metric: "-31 %",
    metricLabel: "stries du cou",
    detail:
      "La photobiomodulation rouge 630 nm stimule les fibres de collagène pour lisser les anneaux du cou et redonner de la souplesse.",
    pinX: 67,
    pinY: 80,
    revealPos: 65,
  },
];

export function BeforeAfterComparator() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [smoothSlide, setSmoothSlide] = useState(false);
  const [activeZone, setActiveZone] = useState<FocusZone["id"] | null>(null);
  const hasInteractedRef = useRef(false);

  // Subtle one-time demo sweep when entering viewport so users immediately notice the live wipe
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || hasInteractedRef.current) return;
        io.disconnect();

        setSmoothSlide(true);
        timers.push(
          window.setTimeout(() => {
            if (!hasInteractedRef.current) setSliderPos(24);
          }, 220),
          window.setTimeout(() => {
            if (!hasInteractedRef.current) setSliderPos(74);
          }, 1050),
          window.setTimeout(() => {
            if (!hasInteractedRef.current) setSliderPos(50);
          }, 1880)
        );
      },
      { threshold: 0.45 }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function updateFromClientX(clientX: number) {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(4, Math.min(96, pct)));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Allow clicking pins without hijacking
    if ((e.target as HTMLElement).closest("button")) return;
    hasInteractedRef.current = true;
    setSmoothSlide(false);
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    updateFromClientX(e.clientX);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function jumpTo(pos: number, zoneId: FocusZone["id"] | null = null) {
    hasInteractedRef.current = true;
    setSmoothSlide(true);
    setActiveZone(zoneId);
    setSliderPos(pos);
  }

  return (
    <div className="mt-10 grid gap-8 lg:gap-12 lg:grid-cols-12 lg:items-center">
      {/* Left: Interactive Clinic-Grade Macro Comparator */}
      <div className="lg:col-span-7 space-y-4">
        <div
          ref={stageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="slider"
          tabIndex={0}
          aria-label="Comparer la peau nue avant et après 28 jours"
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={Math.round(sliderPos)}
          onKeyDown={(e) => {
            hasInteractedRef.current = true;
            setSmoothSlide(false);
            if (e.key === "ArrowLeft") setSliderPos((p) => Math.max(4, p - 4));
            if (e.key === "ArrowRight") setSliderPos((p) => Math.min(96, p + 4));
          }}
          className="group relative aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-[#ECE3DA] shadow-[0_28px_68px_-28px_rgba(48,30,22,0.34)] ring-1 ring-[#E9DAD2] select-none touch-none cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-[#C8465A]"
        >
          {/* Base Layer: AFTER (28 jours) */}
          <img
            src="/images/skin-after.jpg"
            alt="Peau nue de très près après 28 jours avec LumiaSculpt"
            width={1200}
            height={896}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />

          {/* Clipped Top Layer: BEFORE (Jour 1) */}
          <div
            className={`pointer-events-none absolute inset-0 overflow-hidden ${
              smoothSlide ? "transition-[clip-path] duration-700 ease-out" : ""
            }`}
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src="/images/skin-before.jpg"
              alt="Peau nue de très près avant utilisation (Jour 1)"
              width={1200}
              height={896}
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Interactive Anatomical Zone Focus Pins */}
          {FOCUS_ZONES.map((zone) => {
            const isSelected = activeZone === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => jumpTo(zone.revealPos, isSelected ? null : zone.id)}
                aria-label={`Observer la zone : ${zone.label}`}
                style={{ left: `${zone.pinX}%`, top: `${zone.pinY}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group/pin"
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <span
                    className={`absolute inset-0 rounded-full transition-transform ${
                      isSelected
                        ? "bg-[#C8465A]/35 scale-125 animate-ping"
                        : "bg-white/55 group-hover/pin:scale-125"
                    }`}
                  />
                  <span
                    className={`relative h-2.5 w-2.5 rounded-full border-2 border-white shadow-md transition-colors ${
                      isSelected ? "bg-[#C8465A]" : "bg-[#181312]/80 group-hover/pin:bg-[#C8465A]"
                    }`}
                  />
                </span>
                {isSelected && (
                  <span className="pointer-events-none hidden sm:inline-block absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#181312]/85 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md">
                    {zone.label} · {zone.metric}
                  </span>
                )}
              </button>
            );
          })}

          {/* Corner Status Pills (auto-fade softly if slider passes right underneath) */}
          <span
            className={`pointer-events-none absolute top-3.5 left-3.5 z-10 rounded-full bg-[#181312]/72 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-[#FFF8F5] backdrop-blur-md transition-opacity ${
              sliderPos < 18 ? "opacity-25" : "opacity-100"
            }`}
          >
            Avant · Jour 1
          </span>
          <span
            className={`pointer-events-none absolute top-3.5 right-3.5 z-10 rounded-full bg-white/92 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-[#C8465A] shadow-xs backdrop-blur-md transition-opacity ${
              sliderPos > 82 ? "opacity-25" : "opacity-100"
            }`}
          >
            Après · 28 jours
          </span>

          {/* Crisp Luxury Divider Line & Floating Glass Handle */}
          <div
            className={`pointer-events-none absolute inset-y-0 z-10 w-[1.5px] bg-white/95 shadow-[0_0_16px_rgba(24,19,18,0.4)] ${
              smoothSlide ? "transition-[left] duration-700 ease-out" : ""
            }`}
            style={{ left: `${sliderPos}%` }}
          >
            <div
              className={`absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/90 bg-white/95 text-[#181312] shadow-[0_10px_28px_-4px_rgba(24,19,18,0.42)] ring-4 ring-white/25 backdrop-blur-md transition-transform ${
                isDragging ? "scale-110 bg-[#C8465A] text-white border-[#C8465A]" : ""
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 7l-5 5 5 5" />
                <path d="M15 7l5 5-5 5" />
              </svg>
            </div>
          </div>

          {/* Subtle Bottom Caption Pill */}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
            <span className="rounded-full bg-[#181312]/55 px-3 py-1 text-[10px] font-medium tracking-wide text-[#FFF8F5]/95 backdrop-blur-md">
              Peau nue sans filtre ni maquillage · Glissez pour comparer
            </span>
          </div>
        </div>

        {/* One-Tap Quick Compare Presets (great for mobile thumbs & effortless inspection) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div className="inline-flex items-center rounded-full border border-[#EFE1DA] bg-white p-1 shadow-2xs">
            {[
              { label: "Avant (J1)", pos: 92 },
              { label: "50 / 50", pos: 50 },
              { label: "Après (J28)", pos: 8 },
            ].map((preset) => {
              const isCurrent = Math.abs(sliderPos - preset.pos) < 8;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => jumpTo(preset.pos, null)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                    isCurrent
                      ? "bg-[#181312] text-white shadow-2xs"
                      : "text-[#6B5C57] hover:text-[#181312]"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-[#8B7670]">
            Étude d&apos;usage 28 jours · 5 min/jour
          </span>
        </div>
      </div>

      {/* Right: Interactive Clinical Observation Cards synced with the photo zones */}
      <div className="lg:col-span-5 space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B7670] px-1">
          Cliquez une zone pour centrer le curseur
        </p>

        {FOCUS_ZONES.map((zone) => {
          const isSelected = activeZone === zone.id;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => jumpTo(zone.revealPos, isSelected ? null : zone.id)}
              className={`w-full text-left rounded-2xl p-4 sm:p-5 transition-all ${
                isSelected
                  ? "bg-white border border-[#F0D8DD] shadow-[0_14px_34px_-16px_rgba(200,70,90,0.22)]"
                  : "border border-transparent border-b-[#EFE1DA] rounded-none hover:bg-white/65"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#C8465A]">
                  ✦ {zone.label}
                </p>
                <span className="shrink-0 font-[family-name:var(--font-serif)] text-xl font-bold text-[#181312]">
                  {zone.metric}
                  <span className="ml-1.5 font-[family-name:var(--font-sans)] text-[10px] font-medium uppercase tracking-wider text-[#8B7670]">
                    {zone.metricLabel}
                  </span>
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[#574A46]">{zone.detail}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

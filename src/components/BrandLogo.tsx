import { useId } from "react";

interface BrandLogoProps {
  /** Compact mode hides the subtitle on small viewports; "mark" renders only the emblem */
  variant?: "full" | "compact" | "mark";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrandLogo({
  variant = "compact",
  size = "md",
  className = "",
}: BrandLogoProps) {
  const uid = useId().replace(/:/g, "");
  const bgId = `ls-bg-${uid}`;
  const goldId = `ls-gold-${uid}`;
  const sparkId = `ls-spark-${uid}`;

  const iconClass =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-9 w-9 sm:h-10 sm:w-10";

  const wordmarkClass =
    size === "sm"
      ? "text-lg"
      : size === "lg"
      ? "text-2xl sm:text-3xl"
      : "text-[20px] sm:text-[22px]";

  const emblem = (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={`${iconClass} shrink-0 drop-shadow-[0_4px_10px_rgba(24,18,20,0.22)]`}
    >
      <defs>
        <linearGradient id={bgId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2A1D20" />
          <stop offset="55%" stopColor="#181214" />
          <stop offset="100%" stopColor="#100C0D" />
        </linearGradient>
        <linearGradient id={goldId} x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8E6C8" />
          <stop offset="48%" stopColor="#DFB885" />
          <stop offset="100%" stopColor="#B88754" />
        </linearGradient>
        <linearGradient id={sparkId} x1="39" y1="13" x2="49" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE6EB" />
          <stop offset="55%" stopColor="#F29BAA" />
          <stop offset="100%" stopColor="#C8465A" />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32" r="31" fill={`url(#${bgId})`} />
      <circle
        cx="32"
        cy="32"
        r="28.6"
        stroke={`url(#${goldId})`}
        strokeWidth="0.95"
        strokeOpacity="0.86"
      />
      <circle
        cx="32"
        cy="32"
        r="25.8"
        stroke={`url(#${goldId})`}
        strokeWidth="0.45"
        strokeOpacity="0.34"
      />

      {/* Sculpted Didone "L" */}
      <path
        d="M20.5 18.5 V43.2 C20.5 44.8 21.4 45.6 23.2 45.6 H35.2 C37.2 45.6 38.6 44.7 39.4 42.9"
        stroke={`url(#${goldId})`}
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.8 18.5 H23.2"
        stroke={`url(#${goldId})`}
        strokeWidth="1.35"
        strokeLinecap="round"
      />

      {/* Flowing Facial-Contour "S" Ribbon */}
      <path
        d="M42.8 28.4 C42.6 25.4 39.8 23.7 36.2 23.9 C32.3 24.1 29.8 26.3 29.9 29.1 C30.0 32.1 33.1 33.3 36.8 34.4 C40.6 35.5 43.4 37.0 43.2 40.4 C43.0 43.8 39.6 46.1 35.1 46.0"
        stroke={`url(#${goldId})`}
        strokeWidth="1.85"
        strokeLinecap="round"
      />

      {/* Subtle Lifting Arc */}
      <path
        d="M25.6 40.6 C29.8 39.8 33.8 37.5 37.2 33.9"
        stroke={`url(#${goldId})`}
        strokeWidth="0.75"
        strokeOpacity="0.55"
        strokeLinecap="round"
      />

      {/* 4-Point Lumia Radiance Star */}
      <path
        d="M44.2 13.8 C44.5 17.5 45.6 18.6 49.3 18.9 C45.6 19.2 44.5 20.3 44.2 24.0 C43.9 20.3 42.8 19.2 39.1 18.9 C42.8 18.6 43.9 17.5 44.2 13.8 Z"
        fill={`url(#${sparkId})`}
      />
    </svg>
  );

  if (variant === "mark") {
    return <span className={`inline-flex items-center ${className}`}>{emblem}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {emblem}
      <span className="flex flex-col leading-none">
        <span
          className={`font-[family-name:var(--font-serif)] ${wordmarkClass} font-bold tracking-tight text-[#181312]`}
        >
          Lumia
          <span className="italic text-[#C8465A]">Sculpt</span>
          <sup className="ml-0.5 text-[9px] font-semibold not-italic text-[#8A756E]">™</sup>
        </span>
        <span
          className={`mt-1 items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.26em] text-[#8B7670] ${
            variant === "compact" ? "hidden sm:inline-flex" : "inline-flex"
          }`}
        >
          <span className="h-[1px] w-3 bg-[#C8465A]/60" />
          Paris
        </span>
      </span>
    </span>
  );
}

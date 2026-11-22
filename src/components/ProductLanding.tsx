"use client";

import Link from "next/link";
import { ProductHeroVideo } from "./ProductHeroVideo";
import { SkinAction3D, type SynergyModeId } from "./SkinAction3D";
import { useState } from "react";
import {
  CONDUCTIVE_SERUM_ADDON,
  PACK_OPTIONS,
  calculatePackTotalEur,
  type PackOption,
  type SupplierStockSnapshot,
} from "@/lib/supplier";

interface Props {
  initialStock: SupplierStockSnapshot;
}

const CLINICAL_METRICS = [
  { value: "92 %", label: "Peau perçue plus ferme dès 21 jours" },
  { value: "5 min", label: "Rituel quotidien sans contrainte" },
  { value: "45 °C", label: "Chaleur douce qui décuple vos sérums" },
  { value: "60 jours", label: "Essai complet satisfait ou remboursé" },
];

const LED_MODES = [
  {
    id: 0 as SynergyModeId,
    code: "630 nm",
    eyebrow: "Lumière Rouge",
    orbBg: "from-[#FBE4E7] to-[#F5C6CE]",
    orbRing: "border-[#EAB0BA]",
    orbText: "text-[#A63446]",
    dot: "bg-[#C83E52]",
    benefit: "Collagène & ovale raffermi",
    title: "Fermeté & Anti-Relâchement",
    desc: "Pénètre jusqu'au derme pour stimuler les fibres de collagène, lisser le cou et redessiner l'ovale.",
  },
  {
    id: 1 as SynergyModeId,
    code: "520 nm",
    eyebrow: "Lumière Verte & Sonique",
    orbBg: "from-[#E3F3EB] to-[#C6E6D6]",
    orbRing: "border-[#A7D7C0]",
    orbText: "text-[#1E7552]",
    dot: "bg-[#229466]",
    benefit: "Drainage & éclat matinal",
    title: "Drainage & Teint Lumineux",
    desc: "Les vibrations à 7 000 tr/min décongestionnent les traits au réveil et stimulent la microcirculation.",
  },
  {
    id: 2 as SynergyModeId,
    code: "465 nm",
    eyebrow: "Spectre Bleu Purifiant",
    orbBg: "from-[#E4F0FB] to-[#C8E0F7]",
    orbRing: "border-[#AACDF0]",
    orbText: "text-[#2563A6]",
    dot: "bg-[#3178C6]",
    benefit: "Pores resserrés & peau apaisée",
    title: "Pureté & Grain de Peau",
    desc: "Cible l'épiderme en surface pour apaiser les rougeurs diffuses et affiner visiblement le grain de peau.",
  },
  {
    id: 3 as SynergyModeId,
    code: "EMS 45°",
    eyebrow: "Micro-Courants & Thermie",
    orbBg: "from-[#FBF0E1] to-[#F3DAC0]",
    orbRing: "border-[#E3BF99]",
    orbText: "text-[#9A5840]",
    dot: "bg-[#C46A34]",
    benefit: "Tonification musculaire & lift",
    title: "Effet Lift & Chaleur 45 °C",
    desc: "Des impulsions EMS douces tonifient les muscles profonds pendant que la chaleur 45 °C détend les traits.",
  },
];

function SynergyIcon({ id }: { id: SynergyModeId }) {
  if (id === 0) {
    // 630nm deep radiant light waves
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 1) {
    // 520nm sonic drainage ripples
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
        <path d="M3 8c2.5-2 5.5-2 8 0s5.5 2 8 0M3 13c2.5-2 5.5-2 8 0s5.5 2 8 0M3 18c2.5-2 5.5-2 8 0s5.5 2 8 0" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 2) {
    // 465nm pure skin sparkle
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" strokeLinejoin="round" />
        <path d="M18.5 16l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" strokeLinejoin="round" />
      </svg>
    );
  }
  // EMS + 45°C micro-current lift pulse
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" strokeLinejoin="round" />
    </svg>
  );
}

const TIMELINE_RESULTS = [
  {
    phase: "Dès le 1er soir",
    title: "Traits défatigués & drainage immédiat",
    desc: "La chaleur à 45 °C détend la mâchoire et aide votre crème de nuit à pénétrer deux fois plus vite sans film gras.",
  },
  {
    phase: "Semaine 2",
    title: "Grain de peau lissé & teint lumineux",
    desc: "Les poches matinales diminuent, la peau du cou paraît plus souple et mieux hydratée au toucher.",
  },
  {
    phase: "Semaine 4",
    title: "Ovale plus net & peau visiblement tonifiée",
    desc: "L'effet cumulatif des micro-courants EMS et de la lumière rouge 630 nm redonne du maintien à la ligne mandibulaire.",
  },
];

const COMPARISON_ROWS = [
  {
    criteria: "Technologies combinées",
    lumia: "EMS + LED 3 spectres + Chaleur 45 °C + Sonique",
    institut: "Appareils pros (120 € / séance)",
    guasha: "Pierre passive sans énergie",
  },
  {
    criteria: "Temps nécessaire",
    lumia: "5 minutes chez vous, devant votre miroir",
    institut: "1h30 avec trajet & rendez-vous",
    guasha: "10 à 15 min de geste manuel",
  },
  {
    criteria: "Action sur l'absorption du sérum",
    lumia: "Optimisée par la tête chauffante 45 °C",
    institut: "Oui (en cabine uniquement)",
    guasha: "Aucune action thermique",
  },
  {
    criteria: "Tête de soin & ergonomie",
    lumia: "Tête annulaire chauffante + écran LCD + socle inclus",
    institut: "Variable selon le praticien",
    guasha: "Bord plat rigide",
  },
  {
    criteria: "Coût sur 6 mois",
    lumia: "49,90 € une seule fois",
    institut: "720 €+ (6 séances)",
    guasha: "25 € (sans LED ni EMS)",
  },
];

const REVIEWS = [
  {
    name: "Élodie V.",
    profile: "Blanc Pur • 36 ans",
    title: "Mon ovale est nettement plus net en 3 semaines",
    quote:
      "Je l'utilise 5 minutes chaque soir avec mon sérum à l'acide hyaluronique. La chaleur à 45 °C est un pur bonheur et mon cou est beaucoup plus lisse.",
  },
  {
    name: "Clara M.",
    profile: "Rose Poudré • Pack Duo",
    title: "Tellement plus agréable qu'un Gua Sha classique",
    quote:
      "On sent vraiment les micro-impulsions EMS sur la mâchoire et le mode vert le matin dégonfle instantanément le bas du visage.",
  },
  {
    name: "Sabrina K.",
    profile: "Lavande • 42 ans",
    title: "Le socle de charge est super pratique dans la salle de bain",
    quote:
      "L'écran digital est super lisible, la batterie USB-C tient plusieurs semaines, et zéro prise de tête : un seul bouton pour changer de mode.",
  },
  {
    name: "Aurélie D.",
    profile: "Blanc Pur • 29 ans",
    title: "Adopté contre les plis du cou dus au téléphone",
    quote:
      "Je travaille sur ordinateur toute la journée et je commençais à avoir des stries sur le cou. En mode rouge 630 nm le soir, la différence est bluffante.",
  },
  {
    name: "Nadia B.",
    profile: "Coffret Partage x3",
    title: "Offert à ma mère et ma sœur, elles l'adorent",
    quote:
      "Livré rapidement avec suivi, packaging soigné. Le pack x3 revient à 36 € pièce, c'est imbattable comparé aux marques à 250 €.",
  },
  {
    name: "Julie T.",
    profile: "Blanc Pur • 34 ans",
    title: "Ma crème de nuit pénètre enfin vraiment",
    quote:
      "Même sans mettre l'intensité EMS au maximum, la tête tiède et la vibration transforment ma routine du soir en moment spa.",
  },
];

const FAQS = [
  {
    q: "Est-ce que les micro-courants EMS sont douloureux ?",
    a: "Non, jamais. Vous ressentez un léger picotement ou une contraction musculaire douce et agréable. LumiaSculpt™ dispose de 3 niveaux d'intensité pour s'adapter à toutes les sensibilités, à utiliser obligatoirement avec un sérum ou une crème hydratante pour conduire le courant.",
  },
  {
    q: "Avec quels soins puis-je l'utiliser ?",
    a: "Avec votre sérum habituel (acide hyaluronique, gel conducteur, crème hydratante ou huile légère). Évitez simplement les acides exfoliants forts juste avant la séance EMS.",
  },
  {
    q: "Combien de temps dure la batterie et comment le recharger ?",
    a: "Une charge complète via le câble USB-C fourni offre jusqu'à 3 semaines d'utilisation quotidienne (à raison de 5 minutes par jour).",
  },
  {
    q: "Quels sont les délais de livraison et la garantie ?",
    a: "Chaque commande est transmise automatiquement à notre centre logistique dès validation. L'expédition se fait sous 24 à 48h ouvrées avec livraison suivie offerte (6 à 10 jours ouvrés) et 60 jours d'essai satisfait ou remboursé.",
  },
];

function formatEur(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}

export function ProductLanding({ initialStock }: Props) {
  const [stockData, setStockData] = useState<SupplierStockSnapshot>(initialStock);
  const [selectedId, setSelectedId] = useState<string>(
    initialStock.variants[0]?.variantId ?? ""
  );
  const [showLifestyleInHero, setShowLifestyleInHero] = useState(false);
  const [ritualVideo, setRitualVideo] = useState<"soiree" | "demo">("demo");
  const [activeSynergy, setActiveSynergy] = useState<SynergyModeId>(0);
  const [sliderPos, setSliderPos] = useState(52);
  const [selectedPackQty, setSelectedPackQty] = useState<PackOption["quantity"]>(1);
  const [includeSerum, setIncludeSerum] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demoConfirmation, setDemoConfirmation] = useState<{
    orderId: string;
    supplierOrderId?: string;
    trackingNumber?: string;
  } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    line1: "",
    city: "",
    postalCode: "",
    country: "FR",
  });

  const selectedVariant =
    stockData.variants.find((v) => v.variantId === selectedId) ??
    stockData.variants[0];

  const availableStock = selectedVariant?.stock ?? 0;
  const isOutOfStock = availableStock <= 0;
  const activePack =
    PACK_OPTIONS.find((p) => p.quantity === selectedPackQty) ?? PACK_OPTIONS[0];
  const totalEur = calculatePackTotalEur(
    selectedVariant?.retailPriceEur ?? 49.9,
    selectedPackQty,
    includeSerum
  );
  const insufficientForPack = availableStock < selectedPackQty;

  const activeHeroImage = showLifestyleInHero
    ? "/images/lifestyle-usage.jpg"
    : selectedVariant?.image ?? "/images/cj-white.jpg";

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVariant || isOutOfStock || insufficientForPack) return;

    setSubmitting(true);
    setErrorMsg(null);
    setDemoConfirmation(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariant.variantId,
          quantity: selectedPackQty,
          includeConductiveSerum: includeSerum,
          shippingAddress: form,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de finaliser la commande.");
      }

      if (data.mode === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.mode === "demo" && data.order) {
        setDemoConfirmation({
          orderId: data.order.id,
          supplierOrderId: data.order.supplierOrderId,
          trackingNumber: data.order.trackingNumber,
        });
        const refreshed = await fetch("/api/stock");
        if (refreshed.ok) {
          setStockData(await refreshed.json());
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#FFFDFB] text-[#181312] font-[family-name:var(--font-sans)] pb-24 md:pb-16 overflow-x-clip">
      {/* Radiant Sunlit Rose-Champagne Ambient Glows for Freshness & Luminosity */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(58% 46% at 88% 18%, rgba(255,214,220,0.28) 0%, rgba(255,235,222,0.14) 50%, transparent 100%), radial-gradient(52% 48% at 12% 72%, rgba(255,228,205,0.32) 0%, rgba(255,244,235,0.12) 55%, transparent 100%)",
        }}
      />

      {/* Soft Blended Editorial Face Portraits in Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.22] bg-cover bg-right-top bg-no-repeat"
        style={{
          backgroundImage: `url('/images/bg-face-right.jpg')`,
          maskImage:
            "radial-gradient(65% 70% at 88% 32%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(65% 70% at 88% 32%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.18] bg-cover bg-left-bottom bg-no-repeat"
        style={{
          backgroundImage: `url('/images/bg-face-left.jpg')`,
          maskImage:
            "radial-gradient(62% 68% at 10% 78%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(62% 68% at 10% 78%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)",
        }}
      />

      <div className="relative z-10">
      {/* 1. Top Announcement Bar */}
      <div className="bg-gradient-to-r from-[#24171A] via-[#3A1E26] to-[#24171A] px-4 py-2 text-center text-[11px] sm:text-xs font-medium tracking-wide text-[#FFF6F2]">
        ✦ OFFRE LANCEMENT : Jusqu&apos;à <span className="font-bold text-[#FFD59E]">-48 %</span> sur les Coffrets Cadeaux + Livraison Suivie Offerte • 60
        Jours d&apos;Essai
      </div>

      {/* 2. Luxury Editorial Header */}
      <header className="sticky top-0 z-30 border-b border-[#EFE3DC]/90 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <a href="#commander" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#111114] text-xs font-semibold tracking-widest text-[#E5C896]">
              LS
            </span>
            <div className="leading-tight">
              <span className="font-[family-name:var(--font-serif)] text-xl font-bold tracking-tight">
                LumiaSculpt™
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] uppercase tracking-widest text-stone-500 border-l border-stone-300 pl-2">
                Paris
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-700">
            <a href="#rituel" className="hover:text-[#111114] transition">
              Le Rituel 5 min
            </a>
            <a href="#technologie" className="hover:text-[#111114] transition">
              EMS &amp; LED
            </a>
            <a href="#resultats" className="hover:text-[#111114] transition">
              Résultats
            </a>
            <a href="#avis" className="hover:text-[#111114] transition">
              Avis (4,9/5)
            </a>
            <a href="#faq" className="hover:text-[#111114] transition">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-medium text-emerald-900">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Stock live : {availableStock} u.
            </span>
            <Link
              href="/admin"
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-600 hover:bg-stone-100 transition"
            >
              Fournisseur ({stockData.provider})
            </Link>
          </div>
        </div>
      </header>

      <main>
        <ProductHeroVideo />

        {/* 3. Hero Split Showcase & Conversion Buy Box */}
        <section
          id="commander"
          className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:pt-10 sm:pb-16"
        >
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Left Column: High-Resolution Studio & Lifestyle Gallery */}
            <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-3">
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_22px_50px_-24px_rgba(62,42,28,0.22)]">
                <img
                  src={activeHeroImage}
                  alt={`Sculpteur LumiaSculpt™ EMS & LED — ${selectedVariant?.name ?? ""}`}
                  width={1024}
                  height={1024}
                  className="aspect-square w-full object-cover"
                />
                <div className="pointer-events-none absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#111114]/80 backdrop-blur-md px-3.5 py-1 text-[11px] font-medium tracking-wide text-[#FAF7F2]">
                    EMS + LED 630nm + Chaleur 45°C
                  </span>
                </div>
              </div>

              {/* 4-Photo Gallery Strip */}
              <div className="grid grid-cols-4 gap-2.5">
                {stockData.variants.map((variant) => {
                  const isActive =
                    !showLifestyleInHero &&
                    variant.variantId === selectedVariant?.variantId;
                  return (
                    <button
                      key={variant.variantId}
                      type="button"
                      onClick={() => {
                        setSelectedId(variant.variantId);
                        setShowLifestyleInHero(false);
                      }}
                      className={`group overflow-hidden rounded-2xl border bg-white text-left transition ${
                        isActive
                          ? "border-[#111114] ring-2 ring-[#111114]"
                          : "border-stone-200 opacity-85 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={variant.image}
                        alt={variant.name}
                        width={240}
                        height={240}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setShowLifestyleInHero(true);
                  }}
                  className={`group relative overflow-hidden rounded-2xl border bg-white text-left transition ${
                    showLifestyleInHero
                      ? "border-[#111114] ring-2 ring-[#111114]"
                      : "border-stone-200 opacity-85 hover:opacity-100"
                  }`}
                >
                  <img
                    src="/images/lifestyle-usage.jpg"
                    alt="Utilisation en rituel visage et cou"
                    width={240}
                    height={240}
                    className="aspect-square w-full object-cover"
                  />
                  <span className="absolute inset-x-1 bottom-1 rounded-lg bg-[#111114]/75 py-0.5 text-center text-[10px] font-medium text-white">
                    En action
                  </span>
                </button>
              </div>

              {/* Minimal Editorial Trust Strip (no heavy boxes) */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-[#E4D6C8]/80 pt-3.5 text-[11px] font-medium text-[#6B5B50]">
                <span>Normes CE &amp; RoHS</span>
                <span className="text-[#D2C0AE]">·</span>
                <span>Sans fil USB-C</span>
                <span className="text-[#D2C0AE]">·</span>
                <span>Garantie 2 ans incluse</span>
              </div>
            </div>

            {/* Right Column: Luxury Buy Box */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-950">
                  ★★★★★ 4,9/5 • 2 840+ clientes en France
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium border ${
                    isOutOfStock
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-emerald-50 text-emerald-900 border-emerald-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isOutOfStock ? "bg-red-600" : "bg-emerald-600"
                    }`}
                  />
                  {isOutOfStock
                    ? "Rupture de stock fournisseur"
                    : `Expédié sous 24h • ${availableStock} en stock (${selectedVariant?.name})`}
                </span>
              </div>

              <div>
                <h2 className="font-[family-name:var(--font-serif)] text-3xl sm:text-5xl font-bold leading-[1.06] tracking-tight text-[#181312]">
                  Redessinez l&apos;ovale du visage et{" "}
                  <span className="italic text-[#C8465A]">lissez votre cou en 5 min/jour.</span>
                </h2>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-stone-600">
                  Le sculpteur <strong>LumiaSculpt™ 7-en-1</strong> combine micro-courants{" "}
                  <strong>EMS</strong>, chaleur apaisante à <strong>45 °C</strong> et{" "}
                  <strong>luminothérapie LED 3 spectres</strong> pour tonifier les traits, drainer
                  et booster l&apos;absorption de vos sérums.
                </p>
              </div>

              <ul className="space-y-2 text-sm text-stone-700">
                {[
                  "Raffermit la ligne mandibulaire et atténue les plis du cou",
                  "Dégonfle et draine le visage dès le réveil (7 000 vibrations/min)",
                  "Multiplie l'efficacité de vos crèmes et sérums grâce à la thermie 45 °C",
                ].map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111114] text-[10px] font-bold text-[#E5C896]">
                      ✓
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              {/* Buy Box Form */}
              <form
                onSubmit={handleCheckout}
                className="space-y-5 rounded-3xl border border-[#F0E3DC] bg-white/95 p-5 sm:p-6 shadow-[0_20px_50px_-24px_rgba(180,82,98,0.16)] backdrop-blur-md"
              >
                {/* 1. Finish / Color Selector */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <span>1. Finition souhaitée</span>
                    <span className="text-[#111114] normal-case font-medium">
                      {selectedVariant?.name}
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {stockData.variants.map((variant) => {
                      const active = variant.variantId === selectedVariant?.variantId;
                      return (
                        <button
                          key={variant.variantId}
                          type="button"
                          onClick={() => {
                            setSelectedId(variant.variantId);
                            setShowLifestyleInHero(false);
                          }}
                          className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                            active
                              ? "border-[#111114] bg-stone-50 ring-1 ring-[#111114]"
                              : "border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-stone-300"
                              style={{ backgroundColor: variant.colorHex }}
                            />
                            <span className="text-xs font-semibold truncate">{variant.name}</span>
                          </div>
                          <span className="mt-1 text-[11px] text-stone-500">
                            {variant.stock > 0 ? `${variant.stock} en stock` : "Épuisé"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Pack Selector */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <span>2. Choisissez votre coffret</span>
                    <span className="text-[#8C6239] normal-case font-semibold">
                      Livraison suivie offerte
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-2.5">
                    {PACK_OPTIONS.map((pack) => {
                      const active = selectedPackQty === pack.quantity;
                      const disabledByStock = availableStock < pack.quantity;
                      return (
                        <button
                          key={pack.quantity}
                          type="button"
                          disabled={disabledByStock}
                          onClick={() => setSelectedPackQty(pack.quantity)}
                          className={`relative w-full rounded-2xl border p-3.5 text-left transition ${
                            active
                              ? "border-[#111114] bg-[#FAF7F2] ring-1 ring-[#111114]"
                              : "border-stone-200 bg-white hover:border-stone-400"
                          } ${disabledByStock ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {pack.badge && (
                            <span className="absolute -top-2.5 right-3 rounded-full bg-[#111114] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#E5C896]">
                              {pack.badge}
                            </span>
                          )}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                  active ? "border-[#111114]" : "border-stone-400"
                                }`}
                              >
                                {active && (
                                  <span className="h-2 w-2 rounded-full bg-[#111114]" />
                                )}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-[#111114]">
                                  {pack.label}
                                </p>
                                <p className="text-xs text-stone-500">{pack.sublabel}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-base font-bold text-[#111114]">
                                {formatEur(pack.priceEur)}
                              </p>
                              <p className="text-xs text-stone-400 line-through">
                                {formatEur(pack.compareAtEur)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Conductive Gel-Serum Order Bump */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={includeSerum}
                    onClick={() => setIncludeSerum((v) => !v)}
                    className={`mt-3 w-full rounded-2xl border p-3.5 text-left transition ${
                      includeSerum
                        ? "border-[#C8465A] bg-[#FFF8F6] ring-1 ring-[#C8465A]/30"
                        : "border-dashed border-[#DFC7BF] bg-[#FFFCFA] hover:border-[#C8465A]/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                            includeSerum
                              ? "border-[#C8465A] bg-[#C8465A] text-white"
                              : "border-stone-300 bg-white text-transparent"
                          }`}
                        >
                          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <path d="M3.5 8.2 6.5 11.2 12.5 5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-semibold text-[#181312]">
                              {CONDUCTIVE_SERUM_ADDON.name}
                            </p>
                            <span className="rounded-full bg-[#FDF0F2] px-2 py-0.5 text-[9.5px] font-bold tracking-wide text-[#C8465A]">
                              {CONDUCTIVE_SERUM_ADDON.badge}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs leading-snug text-[#6B5C57]">
                            {CONDUCTIVE_SERUM_ADDON.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-[#C8465A]">
                          +{formatEur(CONDUCTIVE_SERUM_ADDON.priceEur)}
                        </p>
                        <p className="text-[11px] text-stone-400 line-through">
                          {formatEur(CONDUCTIVE_SERUM_ADDON.compareAtEur)}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* 3. Shipping Details */}
                <div className="space-y-2.5 pt-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    3. Coordonnées de livraison
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <input
                      required
                      type="text"
                      placeholder="Nom complet"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#111114]"
                    />
                    <input
                      required
                      type="email"
                      placeholder="E-mail (pour le suivi)"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#111114]"
                    />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Adresse postale complète"
                    value={form.line1}
                    onChange={(e) => setForm({ ...form, line1: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#111114]"
                  />
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <input
                      required
                      type="text"
                      placeholder="Code postal"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#111114]"
                    />
                    <input
                      required
                      type="text"
                      placeholder="Ville"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#111114]"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-700 border border-red-200">
                    {errorMsg}
                  </p>
                )}

                {demoConfirmation && (
                  <div className="rounded-xl bg-emerald-50 p-4 text-xs text-emerald-950 border border-emerald-200 space-y-1">
                    <p className="font-semibold text-sm">
                      Commande {demoConfirmation.orderId} transmise au fournisseur !
                    </p>
                    <p>
                      Référence fournisseur :{" "}
                      <span className="font-mono font-semibold">
                        {demoConfirmation.supplierOrderId}
                      </span>
                    </p>
                    {demoConfirmation.trackingNumber && (
                      <p>
                        Suivi généré :{" "}
                        <span className="font-mono font-semibold">
                          {demoConfirmation.trackingNumber}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isOutOfStock || insufficientForPack || submitting}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#C8465A] via-[#B83B50] to-[#9E2E43] px-6 py-4 text-sm sm:text-base font-bold text-white shadow-[0_14px_30px_-10px_rgba(200,70,90,0.52)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-stone-400 disabled:to-stone-400 disabled:shadow-none"
                >
                  {submitting
                    ? "Validation & transmission en cours..."
                    : isOutOfStock
                    ? "Rupture de stock fournisseur"
                    : insufficientForPack
                    ? `Stock insuffisant pour ce pack (${availableStock} disponibles)`
                    : `Commander — ${formatEur(totalEur)}`}
                </button>

                <p className="text-center text-[11px] sm:text-xs text-stone-500">
                  60 jours d&apos;essai satisfait ou remboursé • Paiement sécurisé Stripe •
                  Expédition 24h
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* 4. Clinical Metrics Strip (open editorial hairlines with luminous rose-coral metrics) */}
        <section className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-6 border-y border-[#EFE1DA] py-9 md:grid-cols-4 md:divide-x md:divide-[#EFE1DA]">
            {CLINICAL_METRICS.map((m) => (
              <div key={m.value} className="text-center md:px-6 md:first:pl-0 md:text-left">
                <p className="font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold text-[#C8465A]">
                  {m.value}
                </p>
                <p className="mt-1.5 text-xs sm:text-sm text-[#574A46]">{m.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Lifestyle Ritual Section (featured evening sofa 10s video + editorial hairline steps) */}
        <section id="rituel" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6 space-y-3">
              <div className="relative overflow-hidden rounded-2xl bg-[#181312] shadow-[0_24px_60px_-24px_rgba(48,32,22,0.32)]">
                <video
                  key={ritualVideo}
                  src={
                    ritualVideo === "soiree"
                      ? "/videos/rituel-soiree.mp4"
                      : "/videos/product-demo.mp4"
                  }
                  poster={
                    ritualVideo === "soiree"
                      ? "/images/rituel-soiree-poster.jpg"
                      : "/images/lifestyle-usage.jpg"
                  }
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="aspect-video w-full object-cover"
                />
                {ritualVideo === "soiree" && (
                  <span className="pointer-events-none absolute top-3.5 left-3.5 rounded-full bg-[#181312]/70 px-3 py-1 text-[10px] font-medium tracking-wide text-[#FFF8F5] backdrop-blur-md">
                    ✦ 5 min le soir devant la télé
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between px-1 text-[11px]">
                <div className="inline-flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setRitualVideo("soiree")}
                    className={`border-b-2 pb-1 font-semibold transition ${
                      ritualVideo === "soiree"
                        ? "border-[#C8465A] text-[#181312]"
                        : "border-transparent text-[#8B7670] hover:text-[#181312]"
                    }`}
                  >
                    Rituel du soir (10 s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRitualVideo("demo")}
                    className={`border-b-2 pb-1 font-semibold transition ${
                      ritualVideo === "demo"
                        ? "border-[#C8465A] text-[#181312]"
                        : "border-transparent text-[#8B7670] hover:text-[#181312]"
                    }`}
                  >
                    Démonstration complète
                  </button>
                </div>
                <span className="text-[10px] text-[#8B7670]">5 min/jour • Sans contrainte</span>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C8465A]">
                  Un geste simple, des résultats visibles
                </span>
                <h2 className="mt-2 font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold leading-tight text-[#181312]">
                  Votre soin institut en 3 gestes de 5 minutes chez vous
                </h2>
              </div>

              <div className="divide-y divide-[#EFE1DA] border-t border-[#EFE1DA]">
                {[
                  {
                    step: "01",
                    title: "Appliquez votre sérum ou crème habituelle",
                    desc: "Une noisette suffit sur peau propre. L'appareil glisse sans tirer la peau et facilite la conductivité des micro-courants.",
                  },
                  {
                    step: "02",
                    title: "Sélectionnez votre lumière LED ciblée",
                    desc: "Rouge 630nm pour la fermeté, Vert 520nm pour décongestionner le matin, Bleu 465nm pour purifier le grain de peau.",
                  },
                  {
                    step: "03",
                    title: "Lissez de bas en haut pendant 5 minutes",
                    desc: "La tête annulaire chauffante glisse en douceur sur la mâchoire, le cou et les pommettes pour un effet lift immédiat.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-5 py-4 sm:py-5">
                    <span className="font-[family-name:var(--font-serif)] text-lg italic font-semibold text-[#C8465A]">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#181312]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#574A46]">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. 4 Synergies Institut — Frameless Floating 3D Relief + Luminous Active Mode Highlight */}
        <section
          id="technologie"
          className="relative overflow-x-clip py-16 sm:py-24 text-[#181312]"
        >
          {/* Soft blended right facial portrait melting into the section */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.22] bg-cover bg-right bg-no-repeat"
            style={{
              backgroundImage: `url('/images/bg-face-right.jpg')`,
              maskImage:
                "linear-gradient(270deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 45%, transparent 80%)",
              WebkitMaskImage:
                "linear-gradient(270deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 45%, transparent 80%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8465A]">
                Action Profonde · Simulation 3D Interactive
              </span>
              <h2 className="mt-3 font-[family-name:var(--font-serif)] text-3xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-[#181312]">
                Comment LumiaSculpt™ agit{" "}
                <span className="italic text-[#C8465A]">sous la surface de la peau.</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#574A46]">
                Zoomez dans l&apos;épiderme et sélectionnez l&apos;un des 4 modes pour observer en
                3D la profondeur d&apos;action des LED, des vibrations soniques et de l&apos;EMS.
              </p>
            </div>

            <div className="mt-10 sm:mt-14 grid gap-8 lg:gap-12 lg:grid-cols-12 lg:items-center">
              {/* Frameless Floating 3D Biological Skin Cutaway — stays sticky on mobile while switching modes */}
              <div className="sticky top-[62px] z-20 lg:static lg:col-span-7">
                <SkinAction3D activeMode={activeSynergy} onSelectMode={setActiveSynergy} />
              </div>

              {/* 4 Interactive Synergies: clean open editorial rows with a luminous crisp white card on the active mode */}
              <div className="lg:col-span-5 space-y-2">
                {LED_MODES.map((mode) => {
                  const isActive = activeSynergy === mode.id;
                  return (
                    <button
                      key={mode.code}
                      type="button"
                      onClick={() => setActiveSynergy(mode.id)}
                      className={`w-full text-left flex items-start gap-4 rounded-2xl p-4 sm:p-5 transition-all ${
                        isActive
                          ? "bg-white border border-[#F0D8DD] shadow-[0_14px_34px_-16px_rgba(200,70,90,0.22)]"
                          : "border border-transparent border-b-[#EFE1DA] rounded-none hover:bg-white/60"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${mode.orbBg} ${mode.orbText} transition-transform ${
                          isActive ? "scale-105 shadow-xs" : "opacity-85"
                        }`}
                      >
                        <SynergyIcon id={mode.id} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7D6862]">
                            <span className={`h-1.5 w-1.5 rounded-full ${mode.dot}`} />
                            {mode.eyebrow}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                              isActive
                                ? "bg-[#C8465A] text-white"
                                : "bg-[#F7ECE8] text-[#7A635E]"
                            }`}
                          >
                            {mode.code}
                          </span>
                        </div>
                        <h3 className="mt-1 font-[family-name:var(--font-serif)] text-xl font-bold text-[#181312]">
                          {mode.title}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#574A46]">
                          {mode.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 7. Macro Before / After Skin Comparison + Luminous Curated Timeline Cards */}
        <section id="resultats" className="relative overflow-hidden py-16 sm:py-24">
          {/* Soft blended left facial portrait melting into the results section */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.22] bg-cover bg-left bg-no-repeat"
            style={{
              backgroundImage: `url('/images/bg-face-left.jpg')`,
              maskImage:
                "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.22) 45%, transparent 78%)",
              WebkitMaskImage:
                "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.22) 45%, transparent 78%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4">
            <div className="max-w-3xl">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8465A]">
                Résultats Visibles de Très Près
              </span>
              <h2 className="mt-2.5 font-[family-name:var(--font-serif)] text-3xl sm:text-5xl font-bold leading-tight text-[#181312]">
                Avant / Après sur le grain de peau,{" "}
                <span className="italic text-[#C8465A]">l&apos;ovale et le cou.</span>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#574A46]">
                Faites glisser le curseur pour comparer l&apos;aspect de la peau nue avant et après
                28 jours de rituel quotidien (5 min/jour).
              </p>
            </div>

            {/* Interactive Macro Before / After Comparator */}
            <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#EFE4D8] shadow-[0_24px_60px_-24px_rgba(48,32,22,0.28)] select-none">
                  {/* Base Layer: AFTER (28 jours) */}
                  <img
                    src="/images/skin-after.jpg"
                    alt="Peau nue de très près après 28 jours avec LumiaSculpt"
                    width={1024}
                    height={768}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {/* Clipped Top Layer: BEFORE (Jour 1) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  >
                    <img
                      src="/images/skin-before.jpg"
                      alt="Peau nue de très près avant utilisation (Jour 1)"
                      width={1024}
                      height={768}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Labels */}
                  <span className="pointer-events-none absolute top-4 left-4 rounded-full bg-[#181312]/75 px-3.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    Avant • Jour 1
                  </span>
                  <span className="pointer-events-none absolute top-4 right-4 rounded-full bg-white/95 px-3.5 py-1 text-[11px] font-semibold text-[#C8465A] shadow-xs backdrop-blur-md">
                    Après • 28 jours
                  </span>

                  {/* Vertical Divider & Draggable Handle */}
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white/95 shadow-[0_0_12px_rgba(0,0,0,0.35)]"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#C8465A] text-sm font-bold text-white shadow-lg">
                      ↔
                    </div>
                  </div>

                  {/* Native accessible range overlay for smooth mouse & mobile finger dragging */}
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    aria-label="Comparer la peau avant et après 28 jours"
                    className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
                  />
                </div>
                <p className="mt-3 text-center text-[11px] text-[#7A6862]">
                  ↔ Glissez de gauche à droite • Peau nue sans crème ni sérum — aperçu visuel à 28
                  jours
                </p>
              </div>

              {/* Open Editorial Close-Up Observations */}
              <div className="lg:col-span-5 divide-y divide-[#EFE1DA] border-y border-[#EFE1DA]">
                {[
                  {
                    metric: "Pores & grain de peau",
                    detail:
                      "L'association lumière bleue 465 nm + chaleur douce resserre visiblement l'apparence des pores sur les joues.",
                  },
                  {
                    metric: "Plis horizontaux du cou",
                    detail:
                      "La photobiomodulation rouge 630 nm lisse les stries du cou et redonne de la souplesse au derme.",
                  },
                  {
                    metric: "Ovale & fermeté",
                    detail:
                      "Les micro-courants EMS réveillent le tonus musculaire le long de la mâchoire pour des contours plus nets.",
                  },
                ].map((obs) => (
                  <div key={obs.metric} className="py-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C8465A]">
                      ✦ {obs.metric}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#574A46]">{obs.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Curated Luminous White Timeline Anchor Cards */}
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {TIMELINE_RESULTS.map((r) => (
                <div
                  key={r.phase}
                  className="rounded-2xl border border-[#F0E3DC] bg-white/95 p-6 shadow-[0_14px_34px_-20px_rgba(180,82,98,0.16)]"
                >
                  <span className="inline-block rounded-full bg-[#FDF0F2] px-3 py-1 text-[11px] font-bold text-[#C8465A]">
                    {r.phase}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-serif)] text-xl font-bold text-[#181312]">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#574A46]">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Open Editorial Comparison Table */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold text-[#181312]">
              Pourquoi payer 120 € par séance en institut ?
            </h2>
            <p className="mt-2 text-sm text-[#574A46]">
              LumiaSculpt™ réunit l&apos;action musculaire de l&apos;EMS et la photobiomodulation
              LED pour le prix d&apos;une seule crème visage.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto border-y border-[#EFE1DA]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#EFE1DA] text-[11px] uppercase tracking-wider text-[#7A6862]">
                <tr>
                  <th className="py-4 pr-4 font-semibold">Critère</th>
                  <th className="px-5 py-4 bg-[#C8465A] text-white font-semibold">
                    LumiaSculpt™ 7-en-1
                  </th>
                  <th className="px-4 py-4 font-semibold">Soin Institut</th>
                  <th className="px-4 py-4 font-semibold">Gua Sha Classique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE1DA]">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.criteria}>
                    <td className="py-4 pr-4 font-medium text-[#181312]">{row.criteria}</td>
                    <td className="px-5 py-4 bg-[#FFF6F7] font-semibold text-[#181312]">
                      <span className="text-[#C8465A]">✓</span> {row.lumia}
                    </td>
                    <td className="px-4 py-4 text-[#6B5B56]">{row.institut}</td>
                    <td className="px-4 py-4 text-[#8E7B75]">✕ {row.guasha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 9. Verified Reviews (luminous crisp white anchor cards for visual peps & cadence) */}
        <section id="avis" className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8465A]">
                Avis clients vérifiés
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold text-[#181312]">
                4,9 / 5 sur 2 840 utilisatrices en France
              </h2>
            </div>
            <a
              href="#commander"
              className="inline-flex items-center justify-center rounded-full bg-[#C8465A] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_10px_24px_-10px_rgba(200,70,90,0.55)] hover:bg-[#B2384C] transition"
            >
              Profiter de l&apos;offre (-59 %) →
            </a>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((review) => (
              <article
                key={review.name}
                className="flex flex-col justify-between rounded-2xl border border-[#F0E3DC] bg-white/95 p-6 shadow-[0_14px_34px_-22px_rgba(60,36,28,0.16)]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#E09128] tracking-wider">★★★★★</span>
                    <span className="text-[11px] text-[#8E7B75]">Achat vérifié</span>
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-serif)] text-lg font-bold text-[#181312]">
                    {review.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#574A46]">
                    « {review.quote} »
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F4EAE4]">
                  <p className="text-xs font-semibold text-[#181312]">{review.name}</p>
                  <p className="text-[11px] text-[#8E7B75]">{review.profile}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 10. Editorial Hairline FAQ Accordion */}
        <section id="faq" className="mx-auto max-w-4xl px-4 pb-20 pt-6">
          <h2 className="font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold text-center text-[#181312]">
            Questions fréquentes
          </h2>
          <div className="mt-10 divide-y divide-[#EFE1DA] border-y border-[#EFE1DA]">
            {FAQS.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between text-sm sm:text-base font-semibold text-[#181312] list-none">
                  <span>{item.q}</span>
                  <span className="ml-4 text-lg font-light text-[#C8465A] group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-sm leading-relaxed text-[#574A46]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#EFE1DA] py-8 text-center text-xs text-[#7A6862]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} LumiaSculpt™ Paris. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <span>Essai 60 jours</span>
            <span>Paiement sécurisé Stripe</span>
            <Link href="/admin" className="underline hover:text-[#181312]">
              Console Fournisseur (CJ #{stockData.productId})
            </Link>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Conversion Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-[#EFE1DA] bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs sm:text-sm font-bold text-[#181312]">
              LumiaSculpt™ 7-en-1 — {selectedVariant?.name}
            </p>
            <p className="text-[11px] sm:text-xs text-[#C8465A] font-semibold">
              {activePack.label.split(" — ")[0]}
              {includeSerum ? " + Gel-Sérum" : ""} : {formatEur(totalEur)} • Livraison offerte
            </p>
          </div>
          <a
            href="#commander"
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#C8465A] to-[#A83247] px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(200,70,90,0.5)] hover:brightness-105 transition"
          >
            Commander — {formatEur(totalEur)}
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ProductHero3D } from "./ProductHero3D";
import { useState } from "react";
import {
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
    code: "630 nm",
    eyebrow: "Photobiomodulation Rouge",
    orbBg: "from-[#FBE4E7] to-[#F5C6CE]",
    orbRing: "border-[#EAB0BA]",
    orbText: "text-[#A63446]",
    dot: "bg-[#C83E52]",
    benefit: "Stimulation du collagène & ovale raffermi",
    title: "Fermeté & Anti-Relâchement",
    desc: "Pénètre délicatement le derme pour relancer l'élasticité naturelle, lisser les plis horizontaux du cou et redessiner la ligne mandibulaire.",
  },
  {
    code: "520 nm",
    eyebrow: "Lumière Verte & Sonique",
    orbBg: "from-[#E3F3EB] to-[#C6E6D6]",
    orbRing: "border-[#A7D7C0]",
    orbText: "text-[#1E7552]",
    dot: "bg-[#229466]",
    benefit: "Drainage lymphatique & coup d'éclat matinal",
    title: "Drainage & Teint Lumineux",
    desc: "Associée aux micro-vibrations à 7 000 tr/min, elle décongestionne les traits au réveil, atténue les signes de fatigue et ravive l'éclat.",
  },
  {
    code: "465 nm",
    eyebrow: "Spectre Bleu Apaisant",
    orbBg: "from-[#E4F0FB] to-[#C8E0F7]",
    orbRing: "border-[#AACDF0]",
    orbText: "text-[#2563A6]",
    dot: "bg-[#3178C6]",
    benefit: "Grain de peau affiné & pores resserrés",
    title: "Pureté & Peau Apaisée",
    desc: "Purifie la surface cutanée en douceur, calme les rougeurs diffuses et aide à lisser visiblement les irrégularités du grain de peau.",
  },
  {
    code: "45 °C",
    eyebrow: "Micro-Courants EMS & Thermie",
    orbBg: "from-[#FBF0E1] to-[#F3DAC0]",
    orbRing: "border-[#E3BF99]",
    orbText: "text-[#9A5840]",
    dot: "bg-[#C46A34]",
    benefit: "Tonification douce & absorption des sérums ×2",
    title: "Effet Lift & Infusion de Soin",
    desc: "La chaleur constante à 45 °C ouvre les pores pour décupler vos sérums tandis que de fines impulsions EMS réveillent le tonus du visage et du cou.",
  },
];

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
  const [selectedPackQty, setSelectedPackQty] = useState<PackOption["quantity"]>(2);
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
    selectedPackQty
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#111114] font-[family-name:var(--font-sans)] pb-24 md:pb-16">
      {/* 1. Top Announcement Bar */}
      <div className="bg-[#111114] px-4 py-2 text-center text-[11px] sm:text-xs font-medium tracking-wide text-[#FAF7F2]">
        ✦ OFFRE LANCEMENT : Jusqu&apos;à -59 % sur les Coffrets + Livraison Suivie Offerte • 60
        Jours d&apos;Essai
      </div>

      {/* 2. Luxury Editorial Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#FAF7F2]/90 backdrop-blur-md">
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
        <ProductHero3D />

        {/* 3. Hero Split Showcase & Conversion Buy Box */}
        <section
          id="commander"
          className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:pt-10 sm:pb-16"
        >
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Left Column: High-Resolution Studio & Lifestyle Gallery */}
            <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-3">
              <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-md">
                <img
                  src={activeHeroImage}
                  alt={`Sculpteur LumiaSculpt™ EMS & LED — ${selectedVariant?.name ?? ""}`}
                  width={1024}
                  height={1024}
                  className="aspect-square w-full object-cover"
                />
                <div className="pointer-events-none absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#111114]/85 backdrop-blur-xs px-3.5 py-1 text-[11px] font-semibold tracking-wide text-[#FAF7F2]">
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

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px] font-medium text-stone-700">
                <div className="rounded-xl border border-stone-200 bg-white px-2.5 py-2">
                  Normes CE &amp; RoHS
                </div>
                <div className="rounded-xl border border-stone-200 bg-white px-2.5 py-2">
                  Sans fil • USB-C
                </div>
                <div className="rounded-xl border border-stone-200 bg-white px-2.5 py-2">
                  Garantie 2 ans incluse
                </div>
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
                <h2 className="font-[family-name:var(--font-serif)] text-3xl sm:text-5xl font-bold leading-[1.06] tracking-tight text-[#111114]">
                  Redessinez l&apos;ovale du visage et{" "}
                  <span className="italic text-[#8C6239]">lissez votre cou en 5 min/jour.</span>
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
                className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm"
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
                  className="w-full rounded-2xl bg-[#111114] px-6 py-4 text-sm sm:text-base font-bold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
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

        {/* 4. Clinical Metrics Strip */}
        <section className="border-y border-stone-200 bg-white py-8">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
            {CLINICAL_METRICS.map((m) => (
              <div key={m.value} className="text-center md:text-left">
                <p className="font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold text-[#8C6239]">
                  {m.value}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-stone-600">{m.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Full-Bleed Lifestyle Ritual Section */}
        <section id="rituel" className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6 overflow-hidden rounded-3xl border border-stone-200 bg-black shadow-sm">
              <video
                src="/videos/product-demo.mp4"
                poster="/images/lifestyle-usage.jpg"
                controls
                autoPlay
                muted
                loop
                playsInline
                className="aspect-video w-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8C6239]">
                  Un geste simple, des résultats visibles
                </span>
                <h2 className="mt-2 font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold leading-tight">
                  Votre soin institut en 3 gestes de 5 minutes chez vous
                </h2>
              </div>

              <div className="space-y-4">
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
                  <div
                    key={item.step}
                    className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4"
                  >
                    <span className="font-mono text-sm font-bold text-[#8C6239]">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold">{item.title}</h3>
                      <p className="mt-1 text-xs sm:text-sm text-stone-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. 4 Synergies Institut — Luminous Editorial Showcase */}
        <section
          id="technologie"
          className="relative overflow-hidden border-y border-[#E8DDD2] bg-gradient-to-b from-[#F5ECE3] via-[#FBF7F2] to-[#F5ECE3] py-16 sm:py-24 text-[#1E1916]"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 45% at 50% 0%, rgba(255, 255, 255, 0.85) 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#DFD0C1] bg-white/80 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C6239]">
                Savoir-Faire Institut • Lumière &amp; Micro-Courants
              </span>
              <h2 className="mt-4 font-[family-name:var(--font-serif)] text-3xl sm:text-5xl font-bold leading-[1.08] tracking-tight text-[#1E1916]">
                4 synergies de soin cabine,{" "}
                <span className="italic text-[#9A5840]">réunies en un seul geste.</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5C524B]">
                Chaque mode associe une longueur d&apos;onde LED ciblée à la douceur thermique pour
                s&apos;adapter aux besoins de votre peau, matin et soir.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {LED_MODES.map((mode, idx) => (
                <article
                  key={mode.code}
                  className="group relative flex flex-col justify-between rounded-3xl border border-[#E7DACD] bg-white/90 p-7 sm:p-8 shadow-xs backdrop-blur-sm transition hover:border-[#D6C2AF] hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-inner ${mode.orbBg} ${mode.orbRing}`}
                        >
                          <span className={`text-xs font-bold tracking-tight ${mode.orbText}`}>
                            {mode.code}
                          </span>
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7D6A5C]">
                            <span className={`h-1.5 w-1.5 rounded-full ${mode.dot}`} />
                            {mode.eyebrow}
                          </p>
                          <h3 className="mt-0.5 font-[family-name:var(--font-serif)] text-2xl font-bold text-[#1E1916]">
                            {mode.title}
                          </h3>
                        </div>
                      </div>
                      <span className="font-[family-name:var(--font-serif)] text-2xl italic text-[#D4C3B4]">
                        0{idx + 1}
                      </span>
                    </div>

                    <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-[#574D46]">
                      {mode.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#F0E6DC] pt-4 text-xs">
                    <span className="font-medium text-[#7D5A44]">{mode.benefit}</span>
                    <span className="rounded-full bg-[#FAF6F1] border border-[#E8DDD2] px-2.5 py-0.5 font-semibold text-[#5C524B]">
                      {mode.code}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Timeline Results */}
        <section id="resultats" className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C6239]">
              Progression observée
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold">
              Ce que vous observez semaine après semaine
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {TIMELINE_RESULTS.map((r) => (
              <div
                key={r.phase}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs"
              >
                <span className="inline-block rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-[#8C6239]">
                  {r.phase}
                </span>
                <h3 className="mt-3 text-lg font-bold">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Comparison Table */}
        <section className="bg-white border-y border-stone-200 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold">
                Pourquoi payer 120 € par séance en institut ?
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                LumiaSculpt™ réunit l&apos;action musculaire de l&apos;EMS et la photobiomodulation
                LED pour le prix d&apos;une seule crème visage.
              </p>
            </div>

            <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase text-stone-600">
                  <tr>
                    <th className="p-4">Critère</th>
                    <th className="p-4 bg-[#111114] text-[#E5C896]">LumiaSculpt™ 7-en-1</th>
                    <th className="p-4">Soin Institut</th>
                    <th className="p-4">Gua Sha Classique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.criteria}>
                      <td className="p-4 font-semibold">{row.criteria}</td>
                      <td className="p-4 bg-amber-50/40 font-semibold text-[#111114]">
                        ✓ {row.lumia}
                      </td>
                      <td className="p-4 text-stone-500">{row.institut}</td>
                      <td className="p-4 text-stone-500">✕ {row.guasha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 9. Verified Reviews */}
        <section id="avis" className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8C6239]">
                Avis clients vérifiés
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold">
                4,9 / 5 sur 2 840 utilisatrices en France
              </h2>
            </div>
            <a
              href="#commander"
              className="inline-flex items-center justify-center rounded-full bg-[#111114] px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition"
            >
              Profiter de l&apos;offre (-59 %) →
            </a>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((review) => (
              <article
                key={review.name}
                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-500 font-bold">★★★★★</span>
                    <span className="text-stone-400">Achat vérifié</span>
                  </div>
                  <h3 className="mt-2.5 font-bold">{review.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    « {review.quote} »
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <p className="text-xs font-semibold">{review.name}</p>
                  <p className="text-[11px] text-stone-500">{review.profile}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 10. FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-4 pb-16">
          <h2 className="font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-bold text-center">
            Questions fréquentes
          </h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-stone-200 bg-white p-5"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm sm:text-base font-semibold list-none">
                  <span>{item.q}</span>
                  <span className="ml-4 text-lg text-stone-400 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white py-8 text-center text-xs text-stone-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} LumiaSculpt™ Paris. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <span>Essai 60 jours</span>
            <span>Paiement sécurisé Stripe</span>
            <Link href="/admin" className="underline hover:text-[#111114]">
              Console Fournisseur (CJ #{stockData.productId})
            </Link>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Conversion Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs sm:text-sm font-bold">
              LumiaSculpt™ 7-en-1 — {selectedVariant?.name}
            </p>
            <p className="text-[11px] sm:text-xs text-[#8C6239] font-medium">
              {activePack.label.split(" — ")[0]} : {formatEur(totalEur)} • Livraison offerte
            </p>
          </div>
          <a
            href="#commander"
            className="shrink-0 rounded-xl bg-[#111114] px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-stone-800 transition"
          >
            Commander — {formatEur(totalEur)}
          </a>
        </div>
      </div>
    </div>
  );
}

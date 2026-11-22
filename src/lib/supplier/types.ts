export type SupplierProvider = "mock" | "cjdropshipping" | "aliexpress";

export interface SupplierVariantStock {
  variantId: string;
  supplierSku: string;
  name: string;
  colorHex: string;
  image: string;
  stock: number;
  supplierCostEur: number;
  retailPriceEur: number;
}

export interface SupplierStockSnapshot {
  provider: SupplierProvider;
  productId: string;
  syncedAt: string;
  variants: SupplierVariantStock[];
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string; // ISO 2-letter code, e.g. "FR"
  phone?: string;
}

export interface SupplierOrderRequest {
  localOrderId: string;
  variantId: string;
  supplierSku: string;
  quantity: number;
  shippingAddress: ShippingAddress;
}

export interface SupplierOrderResult {
  success: boolean;
  provider: SupplierProvider;
  supplierOrderId?: string;
  trackingNumber?: string;
  error?: string;
}

export interface SupplierAdapter {
  readonly provider: SupplierProvider;
  fetchStock(productId: string): Promise<SupplierStockSnapshot>;
  createOrder(order: SupplierOrderRequest): Promise<SupplierOrderResult>;
}

export interface PackOption {
  quantity: 1 | 2 | 3;
  label: string;
  sublabel: string;
  priceEur: number;
  compareAtEur: number;
  badge?: string;
}

export const CONDUCTIVE_SERUM_ADDON = {
  id: "gel-serum-conducteur",
  name: "Gel-Sérum Conducteur EMS (100 ml)",
  subtitle:
    "Acide hyaluronique & peptides de collagène — optimise la glisse et amplifie les micro-courants",
  priceEur: 14.9,
  compareAtEur: 24.9,
  badge: "CONSEILLÉ AVEC L'EMS",
} as const;

export const PACK_OPTIONS: PackOption[] = [
  {
    quantity: 1,
    label: "1 × Sculpteur LumiaSculpt™",
    sublabel: "Livré avec câble USB-C & pochette velours",
    priceEur: 49.9,
    compareAtEur: 69.9,
  },
  {
    quantity: 2,
    label: "2 × Sculpteurs — Pack Duo",
    sublabel: "Soit 39,95 € / unité • Économisez 59,90 €",
    priceEur: 79.9,
    compareAtEur: 139.8,
    badge: "LE PLUS POPULAIRE • -43 %",
  },
  {
    quantity: 3,
    label: "3 × Sculpteurs — Coffret Partage",
    sublabel: "Soit 36,63 € / unité • Économisez 99,80 €",
    priceEur: 109.9,
    compareAtEur: 209.7,
    badge: "MEILLEURE OFFRE • -48 %",
  },
];

export function calculatePackTotalEur(
  unitPriceEur: number,
  quantity: number,
  includeConductiveSerum = false
): number {
  let baseTotal: number;
  if (quantity === 1) baseTotal = 49.9;
  else if (quantity === 2) baseTotal = 79.9;
  else if (quantity === 3) baseTotal = 109.9;
  else baseTotal = unitPriceEur * quantity;

  const serumTotal = includeConductiveSerum ? CONDUCTIVE_SERUM_ADDON.priceEur : 0;
  return Number((baseTotal + serumTotal).toFixed(2));
}

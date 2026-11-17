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

export const PACK_OPTIONS: PackOption[] = [
  {
    quantity: 1,
    label: "1 × Sculpteur LumiaSculpt™",
    sublabel: "Livré avec câble USB-C & pochette velours",
    priceEur: 49.9,
    compareAtEur: 89.9,
  },
  {
    quantity: 2,
    label: "2 × Sculpteurs — Pack Duo",
    sublabel: "Soit 39,95 € / unité • Économisez 99,90 €",
    priceEur: 79.9,
    compareAtEur: 179.8,
    badge: "LE PLUS POPULAIRE • -55 %",
  },
  {
    quantity: 3,
    label: "3 × Sculpteurs — Coffret Partage",
    sublabel: "Soit 36,63 € / unité • Économisez 159,80 €",
    priceEur: 109.9,
    compareAtEur: 269.7,
    badge: "MEILLEURE OFFRE • -59 %",
  },
];

export function calculatePackTotalEur(unitPriceEur: number, quantity: number): number {
  if (quantity === 1) return 49.9;
  if (quantity === 2) return 79.9;
  if (quantity === 3) return 109.9;
  return Number((unitPriceEur * quantity).toFixed(2));
}

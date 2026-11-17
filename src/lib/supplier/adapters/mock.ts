import type {
  SupplierAdapter,
  SupplierOrderRequest,
  SupplierOrderResult,
  SupplierStockSnapshot,
} from "../types";

/**
 * Supplier catalog synced from real CJdropshipping listing PID 1406822350284001280
 * (SPU CJCC1183823 — PREMIUMGOODS Global Limited).
 */
export class MockSupplierAdapter implements SupplierAdapter {
  readonly provider = "mock" as const;

  async fetchStock(productId: string): Promise<SupplierStockSnapshot> {
    const minuteJitter = new Date().getMinutes() % 5;

    return {
      provider: this.provider,
      productId,
      syncedAt: new Date().toISOString(),
      variants: [
        {
          variantId: "white",
          supplierSku: "CJCC118382301AZ",
          name: "Blanc Pur",
          colorHex: "#F5F5F4",
          image: "/images/cj-white.jpg",
          stock: Math.max(0, 28 - minuteJitter),
          supplierCostEur: 9.5,
          retailPriceEur: 49.9,
        },
        {
          variantId: "pink",
          supplierSku: "CJCC118382302BY",
          name: "Rose Poudré",
          colorHex: "#F3C6CF",
          image: "/images/cj-pink.jpg",
          stock: Math.max(0, 19 - minuteJitter),
          supplierCostEur: 9.25,
          retailPriceEur: 49.9,
        },
        {
          variantId: "purple",
          supplierSku: "CJCC118382303CX",
          name: "Lavande",
          colorHex: "#C4B5FD",
          image: "/images/cj-purple.jpg",
          stock: Math.max(0, 14 - minuteJitter),
          supplierCostEur: 9.1,
          retailPriceEur: 49.9,
        },
      ],
    };
  }

  async createOrder(order: SupplierOrderRequest): Promise<SupplierOrderResult> {
    const suffix = order.localOrderId.slice(-6).toUpperCase();
    return {
      success: true,
      provider: this.provider,
      supplierOrderId: `CJ-DEMO-${suffix}`,
      trackingNumber: `CJP${Date.now().toString().slice(-9)}FR`,
    };
  }
}

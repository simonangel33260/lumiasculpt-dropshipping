import type {
  SupplierAdapter,
  SupplierOrderRequest,
  SupplierOrderResult,
  SupplierStockSnapshot,
} from "../types";

const CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

/**
 * CJdropshipping REST API v2 adapter.
 * Requires CJ_API_KEY and CJ_EMAIL environment variables.
 */
export class CJDropshippingAdapter implements SupplierAdapter {
  readonly provider = "cjdropshipping" as const;

  private getApiKey(): string {
    const key = process.env.CJ_API_KEY;
    if (!key) {
      throw new Error("CJ_API_KEY manquante dans les variables d'environnement.");
    }
    return key;
  }

  private async getAccessToken(): Promise<string> {
    const email = process.env.CJ_EMAIL;
    const apiKey = this.getApiKey();
    if (!email) {
      throw new Error("CJ_EMAIL manquante dans les variables d'environnement.");
    }

    const res = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, apiKey }),
      cache: "no-store",
    });

    const json = await res.json();
    if (!res.ok || !json?.data?.accessToken) {
      throw new Error(json?.message ?? "Échec d'authentification CJdropshipping.");
    }
    return json.data.accessToken as string;
  }

  async fetchStock(productId: string): Promise<SupplierStockSnapshot> {
    const token = await this.getAccessToken();
    const res = await fetch(
      `${CJ_BASE_URL}/product/query?pid=${encodeURIComponent(productId)}`,
      {
        headers: { "CJ-Access-Token": token },
        cache: "no-store",
      }
    );

    const json = await res.json();
    if (!res.ok || !json?.result) {
      throw new Error(json?.message ?? "Impossible de récupérer le stock CJdropshipping.");
    }

    const variants = (json.data?.variants ?? []).map(
      (v: { vid: string; variantSku: string; variantNameEn?: string; variantSellPrice?: number }, idx: number) => ({
        variantId: v.vid,
        supplierSku: v.variantSku,
        name: v.variantNameEn ?? `Variante ${idx + 1}`,
        colorHex: "#E5DEC9",
        image: "/images/sculpt-pearl.jpg",
        stock: Number((v as { stockNum?: number }).stockNum ?? 0),
        supplierCostEur: Number(v.variantSellPrice ?? 9.5),
        retailPriceEur: 49.9,
      })
    );

    return {
      provider: this.provider,
      productId,
      syncedAt: new Date().toISOString(),
      variants,
    };
  }

  async createOrder(order: SupplierOrderRequest): Promise<SupplierOrderResult> {
    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${CJ_BASE_URL}/shopping/order/createOrderV2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CJ-Access-Token": token,
        },
        body: JSON.stringify({
          orderNumber: order.localOrderId,
          shippingZip: order.shippingAddress.postalCode,
          shippingCountryCode: order.shippingAddress.country,
          shippingProvince: order.shippingAddress.city,
          shippingCity: order.shippingAddress.city,
          shippingAddress: order.shippingAddress.line1,
          shippingCustomerName: order.shippingAddress.fullName,
          shippingPhone: order.shippingAddress.phone ?? "0000000000",
          products: [
            {
              vid: order.variantId,
              quantity: order.quantity,
            },
          ],
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.result) {
        return {
          success: false,
          provider: this.provider,
          error: json?.message ?? "Erreur création commande CJdropshipping",
        };
      }

      return {
        success: true,
        provider: this.provider,
        supplierOrderId: String(json.data?.orderId ?? order.localOrderId),
      };
    } catch (err) {
      return {
        success: false,
        provider: this.provider,
        error: err instanceof Error ? err.message : "Erreur inconnue CJdropshipping",
      };
    }
  }
}

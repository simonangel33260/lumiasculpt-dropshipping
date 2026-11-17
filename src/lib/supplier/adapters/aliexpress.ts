import crypto from "node:crypto";
import type {
  SupplierAdapter,
  SupplierOrderRequest,
  SupplierOrderResult,
  SupplierStockSnapshot,
} from "../types";

const ALIEXPRESS_GATEWAY = "https://api-sg.aliexpress.com/sync";

/**
 * AliExpress Open Platform Dropshipping API adapter.
 * Requires ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, and ALIEXPRESS_ACCESS_TOKEN.
 */
export class AliExpressAdapter implements SupplierAdapter {
  readonly provider = "aliexpress" as const;

  private getCredentials() {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;
    const accessToken = process.env.ALIEXPRESS_ACCESS_TOKEN;

    if (!appKey || !appSecret || !accessToken) {
      throw new Error(
        "Variables ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET et ALIEXPRESS_ACCESS_TOKEN requises."
      );
    }
    return { appKey, appSecret, accessToken };
  }

  private signParams(params: Record<string, string>, secret: string): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");
    return crypto
      .createHmac("sha256", secret)
      .update(sorted)
      .digest("hex")
      .toUpperCase();
  }

  private async callMethod(
    method: string,
    payload: Record<string, string>
  ): Promise<Record<string, unknown>> {
    const { appKey, appSecret, accessToken } = this.getCredentials();
    const baseParams: Record<string, string> = {
      app_key: appKey,
      method,
      session: accessToken,
      sign_method: "sha256",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      ...payload,
    };

    const sign = this.signParams(baseParams, appSecret);
    const body = new URLSearchParams({ ...baseParams, sign });

    const res = await fetch(ALIEXPRESS_GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`AliExpress API HTTP ${res.status}`);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  async fetchStock(productId: string): Promise<SupplierStockSnapshot> {
    const data = await this.callMethod("aliexpress.ds.product.get", {
      product_id: productId,
      ship_to_country: "FR",
      target_currency: "EUR",
      target_language: "fr",
    });

    const result = (data as { aliexpress_ds_product_get_response?: { result?: unknown } })
      ?.aliexpress_ds_product_get_response?.result as
      | {
          ae_item_sku_info_dtos?: {
            ae_item_sku_info_d_t_o?: Array<{
              sku_id: string;
              sku_attr?: string;
              sku_available_stock?: number;
              offer_sale_price?: string;
            }>;
          };
        }
      | undefined;

    const skus = result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ?? [];

    return {
      provider: this.provider,
      productId,
      syncedAt: new Date().toISOString(),
      variants: skus.map((sku, idx) => ({
        variantId: String(sku.sku_id),
        supplierSku: String(sku.sku_id),
        name: sku.sku_attr ?? `Option ${idx + 1}`,
        colorHex: "#E5DEC9",
        image: "/images/sculpt-pearl.jpg",
        stock: Number(sku.sku_available_stock ?? 0),
        supplierCostEur: Number(sku.offer_sale_price ?? 9.5),
        retailPriceEur: 49.9,
      })),
    };
  }

  async createOrder(order: SupplierOrderRequest): Promise<SupplierOrderResult> {
    try {
      const response = await this.callMethod("aliexpress.ds.order.create", {
        param_place_order_request4_open_api_d_t_o: JSON.stringify({
          logistics_address: {
            address: order.shippingAddress.line1,
            city: order.shippingAddress.city,
            country: order.shippingAddress.country,
            full_name: order.shippingAddress.fullName,
            zip: order.shippingAddress.postalCode,
            phone_country: "+33",
            mobile_no: order.shippingAddress.phone ?? "0600000000",
          },
          product_items: [
            {
              product_id: process.env.SUPPLIER_PRODUCT_ID ?? "",
              sku_attr: order.supplierSku,
              product_count: order.quantity,
            },
          ],
        }),
      });

      const orderResult = (
        response as {
          aliexpress_ds_order_create_response?: {
            result?: { is_success?: boolean; order_list?: { number?: string[] }; error_msg?: string };
          };
        }
      )?.aliexpress_ds_order_create_response?.result;

      if (!orderResult?.is_success) {
        return {
          success: false,
          provider: this.provider,
          error: orderResult?.error_msg ?? "Échec de création de commande AliExpress.",
        };
      }

      return {
        success: true,
        provider: this.provider,
        supplierOrderId: orderResult.order_list?.number?.[0] ?? order.localOrderId,
      };
    } catch (err) {
      return {
        success: false,
        provider: this.provider,
        error: err instanceof Error ? err.message : "Erreur inconnue AliExpress",
      };
    }
  }
}

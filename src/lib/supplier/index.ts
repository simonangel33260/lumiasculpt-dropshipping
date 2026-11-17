import { AliExpressAdapter } from "./adapters/aliexpress";
import { CJDropshippingAdapter } from "./adapters/cjdropshipping";
import { MockSupplierAdapter } from "./adapters/mock";
import type { SupplierAdapter, SupplierProvider } from "./types";

export * from "./types";

export function getConfiguredProvider(): SupplierProvider {
  const raw = process.env.SUPPLIER_PROVIDER?.toLowerCase();
  if (raw === "cjdropshipping" || raw === "aliexpress") {
    return raw;
  }
  return "mock";
}

export function getSupplierAdapter(): SupplierAdapter {
  const provider = getConfiguredProvider();
  switch (provider) {
    case "cjdropshipping":
      return new CJDropshippingAdapter();
    case "aliexpress":
      return new AliExpressAdapter();
    default:
      return new MockSupplierAdapter();
  }
}

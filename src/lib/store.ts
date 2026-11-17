import fs from "node:fs/promises";
import path from "node:path";
import {
  calculatePackTotalEur,
  getSupplierAdapter,
  type ShippingAddress,
  type SupplierProvider,
  type SupplierStockSnapshot,
} from "./supplier";

export { calculatePackTotalEur };

export interface LocalOrder {
  id: string;
  createdAt: string;
  variantId: string;
  variantName: string;
  supplierSku: string;
  quantity: number;
  totalEur: number;
  paymentStatus: "paid" | "pending";
  supplierStatus: "forwarded" | "pending" | "failed";
  supplierProvider: SupplierProvider;
  supplierOrderId?: string;
  trackingNumber?: string;
  supplierError?: string;
  shippingAddress: ShippingAddress;
}

export interface StoreState {
  stock: SupplierStockSnapshot;
  orders: LocalOrder[];
}

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "lumiasculpt-data")
  : path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "store-state.json");

function getProductId(): string {
  return process.env.SUPPLIER_PRODUCT_ID ?? "1406822350284001280";
}

export async function readStoreState(): Promise<StoreState> {
  const expectedProductId = getProductId();
  const adapter = getSupplierAdapter();

  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as StoreState;
    if (
      parsed.stock?.productId === expectedProductId &&
      parsed.stock?.provider === adapter.provider
    ) {
      return parsed;
    }
    const freshStock = await adapter.fetchStock(expectedProductId);
    const updated: StoreState = { stock: freshStock, orders: parsed.orders ?? [] };
    await writeStoreState(updated);
    return updated;
  } catch {
    const initialStock = await adapter.fetchStock(expectedProductId);
    const initialState: StoreState = {
      stock: initialStock,
      orders: [],
    };
    await writeStoreState(initialState);
    return initialState;
  }
}

export async function writeStoreState(state: StoreState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function syncSupplierStock(): Promise<SupplierStockSnapshot> {
  const adapter = getSupplierAdapter();
  const snapshot = await adapter.fetchStock(getProductId());
  const state = await readStoreState();
  state.stock = snapshot;
  await writeStoreState(state);
  return snapshot;
}

export async function recordAndForwardOrder(params: {
  orderId: string;
  variantId: string;
  quantity: number;
  shippingAddress: ShippingAddress;
}): Promise<LocalOrder> {
  const state = await readStoreState();
  const variant = state.stock.variants.find((v) => v.variantId === params.variantId);
  if (!variant) {
    throw new Error(`Variante introuvable : ${params.variantId}`);
  }

  // Deduct local stock immediately to prevent overselling
  variant.stock = Math.max(0, variant.stock - params.quantity);

  const adapter = getSupplierAdapter();
  const supplierRes = await adapter.createOrder({
    localOrderId: params.orderId,
    variantId: variant.variantId,
    supplierSku: variant.supplierSku,
    quantity: params.quantity,
    shippingAddress: params.shippingAddress,
  });

  const order: LocalOrder = {
    id: params.orderId,
    createdAt: new Date().toISOString(),
    variantId: variant.variantId,
    variantName: variant.name,
    supplierSku: variant.supplierSku,
    quantity: params.quantity,
    totalEur: calculatePackTotalEur(variant.retailPriceEur, params.quantity),
    paymentStatus: "paid",
    supplierStatus: supplierRes.success ? "forwarded" : "failed",
    supplierProvider: supplierRes.provider,
    supplierOrderId: supplierRes.supplierOrderId,
    trackingNumber: supplierRes.trackingNumber,
    supplierError: supplierRes.error,
    shippingAddress: params.shippingAddress,
  };

  state.orders.unshift(order);
  await writeStoreState(state);
  return order;
}

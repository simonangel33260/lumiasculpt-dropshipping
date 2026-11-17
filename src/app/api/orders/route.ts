import { NextResponse } from "next/server";
import { readStoreState } from "@/lib/store";

export async function GET() {
  const state = await readStoreState();
  return NextResponse.json({
    provider: state.stock.provider,
    syncedAt: state.stock.syncedAt,
    orders: state.orders,
  });
}

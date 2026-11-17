import { NextResponse } from "next/server";
import { readStoreState } from "@/lib/store";

export async function GET() {
  const state = await readStoreState();
  return NextResponse.json(state.stock);
}

import { Suspense } from "react";
import { connection } from "next/server";
import { ProductLanding } from "@/components/ProductLanding";
import { readStoreState } from "@/lib/store";

async function StorefrontWithLiveStock() {
  await connection();
  const state = await readStoreState();
  return <ProductLanding initialStock={state.stock} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-stone-500">
          Chargement de la boutique...
        </div>
      }
    >
      <StorefrontWithLiveStock />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LocalOrder } from "@/lib/store";
import type { SupplierStockSnapshot } from "@/lib/supplier";

export default function AdminSyncPage() {
  const [stock, setStock] = useState<SupplierStockSnapshot | null>(null);
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  async function loadAll() {
    const [stockRes, ordersRes] = await Promise.all([
      fetch("/api/stock"),
      fetch("/api/orders"),
    ]);
    if (stockRes.ok) {
      setStock(await stockRes.json());
    }
    if (ordersRes.ok) {
      const data = await ordersRes.json();
      setOrders(data.orders ?? []);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleManualSync() {
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/cron/sync-stock", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Échec de synchronisation");
      }
      setStock(data.snapshot);
      setStatusMsg("Stock synchronisé avec le fournisseur.");
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Erreur de synchronisation");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">Synchronisation Fournisseur &amp; Commandes</h1>
            <p className="text-xs text-stone-500">
              Adaptateur actif :{" "}
              <span className="font-mono font-semibold text-stone-800">
                {stock?.provider ?? "..."}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:bg-stone-400"
            >
              {syncing ? "Synchronisation..." : "Synchroniser le stock"}
            </button>
            <Link
              href="/"
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
            >
              Voir la boutique
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {statusMsg && (
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {statusMsg}
          </div>
        )}

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Stocks &amp; SKU Fournisseur</h2>
            <span className="text-xs text-stone-500">
              Dernière synchro :{" "}
              {stock?.syncedAt ? new Date(stock.syncedAt).toLocaleString("fr-FR") : "—"}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <tr>
                  <th className="py-2 pr-4">Variante</th>
                  <th className="py-2 pr-4">SKU Fournisseur</th>
                  <th className="py-2 pr-4">Stock</th>
                  <th className="py-2 pr-4">Coût fournisseur</th>
                  <th className="py-2">Prix boutique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(stock?.variants ?? []).map((v) => (
                  <tr key={v.variantId}>
                    <td className="py-3 pr-4 font-medium">{v.name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-stone-600">{v.supplierSku}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          v.stock > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {v.stock}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{v.supplierCostEur.toFixed(2)} €</td>
                    <td className="py-3 font-medium">{v.retailPriceEur.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <h2 className="font-semibold">Commandes transmises au fournisseur</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">
              Aucune commande enregistrée pour le moment. Passez une commande test sur la boutique.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <tr>
                    <th className="py-2 pr-4">Commande</th>
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Variante</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Statut fournisseur</th>
                    <th className="py-2">Réf. / Suivi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 pr-4 font-mono text-xs">{order.id}</td>
                      <td className="py-3 pr-4">{order.shippingAddress.fullName}</td>
                      <td className="py-3 pr-4">
                        {order.variantName} × {order.quantity}
                      </td>
                      <td className="py-3 pr-4">{order.totalEur.toFixed(2)} €</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            order.supplierStatus === "forwarded"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {order.supplierStatus}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs text-stone-600">
                        {order.supplierOrderId ?? order.supplierError ?? "—"}
                        {order.trackingNumber ? ` (${order.trackingNumber})` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

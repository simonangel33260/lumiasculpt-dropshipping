import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  calculatePackTotalEur,
  readStoreState,
  recordAndForwardOrder,
} from "@/lib/store";
import {
  CONDUCTIVE_SERUM_ADDON,
  type ShippingAddress,
} from "@/lib/supplier";

interface CheckoutBody {
  variantId: string;
  quantity: number;
  includeConductiveSerum?: boolean;
  shippingAddress: ShippingAddress;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;
    const quantity = Math.max(1, Math.min(10, Number(body.quantity || 1)));
    const includeConductiveSerum = Boolean(body.includeConductiveSerum);

    const state = await readStoreState();
    const variant = state.stock.variants.find((v) => v.variantId === body.variantId);

    if (!variant) {
      return NextResponse.json({ error: "Variante introuvable." }, { status: 404 });
    }
    if (variant.stock < quantity) {
      return NextResponse.json(
        { error: `Stock insuffisant (${variant.stock} restant(s)).` },
        { status: 409 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // If Stripe is configured, create a real Stripe Checkout Session
    if (stripeKey) {
      const stripe = new Stripe(stripeKey);
      const packTotalEur = calculatePackTotalEur(variant.retailPriceEur, quantity, false);
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(packTotalEur * 100),
            product_data: {
              name: `Sculpteur EMS & LED LumiaSculpt™ (Pack x${quantity}) — ${variant.name}`,
              metadata: {
                variantId: variant.variantId,
                supplierSku: variant.supplierSku,
              },
            },
          },
          quantity: 1,
        },
      ];

      if (includeConductiveSerum) {
        lineItems.push({
          price_data: {
            currency: "eur",
            unit_amount: Math.round(CONDUCTIVE_SERUM_ADDON.priceEur * 100),
            product_data: {
              name: CONDUCTIVE_SERUM_ADDON.name,
              description: CONDUCTIVE_SERUM_ADDON.subtitle,
            },
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: body.shippingAddress.email,
        line_items: lineItems,
        metadata: {
          variantId: variant.variantId,
          quantity: String(quantity),
          includeConductiveSerum: String(includeConductiveSerum),
          shippingFullName: body.shippingAddress.fullName,
          shippingEmail: body.shippingAddress.email,
          shippingLine1: body.shippingAddress.line1,
          shippingCity: body.shippingAddress.city,
          shippingPostalCode: body.shippingAddress.postalCode,
          shippingCountry: body.shippingAddress.country || "FR",
        },
        success_url: `${siteUrl}/?order=success`,
        cancel_url: `${siteUrl}/?order=cancelled`,
      });

      return NextResponse.json({ mode: "stripe", checkoutUrl: session.url });
    }

    // Demo/local mode without Stripe key: record & forward directly to the supplier adapter
    const localOrderId = `CMD-${Date.now().toString(36).toUpperCase()}`;
    const order = await recordAndForwardOrder({
      orderId: localOrderId,
      variantId: variant.variantId,
      quantity,
      includeConductiveSerum,
      shippingAddress: body.shippingAddress,
    });

    return NextResponse.json({ mode: "demo", order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur lors du paiement." },
      { status: 500 }
    );
  }
}

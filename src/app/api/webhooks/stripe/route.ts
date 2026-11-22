import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { recordAndForwardOrder } from "@/lib/store";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET manquante." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeKey);
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature Stripe manquante." }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Signature invalide" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    if (meta.variantId) {
      await recordAndForwardOrder({
        orderId: session.id,
        variantId: meta.variantId,
        quantity: Number(meta.quantity ?? 1),
        includeConductiveSerum: meta.includeConductiveSerum === "true",
        shippingAddress: {
          fullName: meta.shippingFullName ?? "Client",
          email: meta.shippingEmail ?? session.customer_email ?? "",
          line1: meta.shippingLine1 ?? "",
          city: meta.shippingCity ?? "",
          postalCode: meta.shippingPostalCode ?? "",
          country: meta.shippingCountry ?? "FR",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

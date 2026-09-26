// server/routes/payments/card.ts
//
// Credit/debit cards are handled via Stripe Checkout (a Stripe-hosted
// redirect page), NOT a card-number form on our own site. This is a
// deliberate security choice: collecting raw PAN/CVV on your own server —
// which the previous version's UI did, even though nothing actually sent it
// anywhere — puts you in PCI-DSS scope (SAQ-D territory) with real
// compliance obligations. Redirecting to Stripe Checkout keeps your
// server out of card-data scope entirely (SAQ-A) because your code never
// sees a card number.
import { RequestHandler } from "express";
import Stripe from "stripe";
import { z } from "zod";
import {
  assertQuoteAndAmount,
  recordPendingPayment,
  markPaymentCompleted,
  markPaymentFailed,
  PaymentValidationError,
} from "../../lib/paymentGuard";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

const createSessionSchema = z.object({
  quoteId: z.string().min(1),
  amount: z.number().positive(), // in KES
});

export const createCardCheckoutSession: RequestHandler = async (req, res) => {
  try {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }
    const { quoteId, amount } = parsed.data;

    // Server-side authority check: quoteId must exist and amount must not
    // exceed the real outstanding balance stored in the database.
    const quote = await assertQuoteAndAmount(quoteId, amount);

    const siteUrl = process.env.SITE_URL || "https://almarktechsolutions.co.ke";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: quote.customerEmail,
      line_items: [
        {
          price_data: {
            currency: "kes",
            product_data: { name: `Almark Tech Solutions — Quote ${quoteId}` },
            unit_amount: Math.round(amount * 100), // Stripe expects the smallest currency unit
          },
          quantity: 1,
        },
      ],
      metadata: { quoteId },
      success_url: `${siteUrl}/quote?payment=card-success`,
      cancel_url: `${siteUrl}/quote?payment=card-cancelled`,
    });

    await recordPendingPayment({
      quoteId: quote.id,
      method: "creditcard",
      amount,
      currency: "KES",
      providerRef: session.id,
    });

    res.json({ success: true, data: { checkoutUrl: session.url } });
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Stripe checkout session error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to start card payment",
    });
  }
};

// Stripe webhook — signature-verified against the raw request body (mounted
// with express.raw() in server/index.ts, ahead of the global JSON parser,
// since Stripe's signature check requires the exact unparsed bytes).
export const handleStripeWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) {
    return res.status(400).json({ success: false });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.warn("Stripe webhook signature verification failed:", err);
    return res.status(400).json({ success: false });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        await markPaymentCompleted(session.id, session as any);
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await markPaymentFailed(session.id, session as any);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling error:", error);
    res.status(500).json({ success: false });
  }
};

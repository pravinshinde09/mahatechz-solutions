"use client";

import { CreditCard, FlaskConical, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CheckoutOrder } from "@/lib/contracts/commerce";
import { createOrderAction, simulatePaymentAction, verifyPaymentAction, type CheckoutResponse } from "../actions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open(): void; on(event: string, cb: (e: unknown) => void): void };
  }
}

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

/** Loaded on demand. Under the nonce CSP's 'strict-dynamic', scripts added by our own bundle are trusted. */
function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    document.head.appendChild(script);
  });
}

type Phase = { name: "idle" } | { name: "working"; label: string } | { name: "simulating"; order: CheckoutOrder } | { name: "error"; message: string };

export function PayOnline({ courseId, amountLabel }: { courseId: string; amountLabel: string }) {
  const router = useRouter();
  // One key per visit: double clicks or retries reuse the same order (spec §13.7).
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [accepted, setAccepted] = useState(false);
  const [phase, setPhase] = useState<Phase>({ name: "idle" });

  async function finish(orderId: string, response: CheckoutResponse) {
    setPhase({ name: "working", label: "Confirming your payment…" });
    const verified = await verifyPaymentAction(orderId, response);
    // Whatever happened, the order page shows the server's view (it polls if still processing).
    if (!verified.ok && verified.code !== "PAYMENT_VERIFICATION_FAILED") return setPhase({ name: "error", message: verified.message });
    router.push(`/checkout/orders/${orderId}`);
  }

  async function start() {
    setPhase({ name: "working", label: "Preparing secure checkout…" });
    const created = await createOrderAction(courseId, idempotencyKey);
    if (!created.ok) return setPhase({ name: "error", message: created.message });
    const order = created.order;
    if (order.provider === "simulated") return setPhase({ name: "simulating", order });

    try {
      await loadRazorpay();
    } catch (err) {
      return setPhase({ name: "error", message: (err as Error).message });
    }
    const rzp = new window.Razorpay!({
      key: order.razorpayKeyId,
      amount: order.amount.amountPaise,
      currency: order.amount.currency,
      order_id: order.razorpayOrderId,
      name: "Mahatecz Learning",
      description: order.courseTitle,
      prefill: { name: order.prefill.name, email: order.prefill.email, ...(order.prefill.contact ? { contact: order.prefill.contact } : {}) },
      notes: { orderId: order.orderId },
      theme: { color: "#2563eb" },
      handler: (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) =>
        void finish(order.orderId, { razorpayPaymentId: r.razorpay_payment_id, razorpayOrderId: r.razorpay_order_id, razorpaySignature: r.razorpay_signature }),
      modal: { ondismiss: () => setPhase({ name: "idle" }) },
    });
    rzp.on("payment.failed", () => router.push(`/checkout/orders/${order.orderId}`));
    setPhase({ name: "idle" });
    rzp.open();
  }

  async function simulate(order: CheckoutOrder, outcome: "captured" | "failed") {
    setPhase({ name: "working", label: "Processing test payment…" });
    const r = await simulatePaymentAction(order.orderId, outcome);
    if (!r.ok) return setPhase({ name: "error", message: r.message });
    await finish(order.orderId, r.response);
  }

  if (phase.name === "simulating") {
    return (
      <div className="grid gap-4 rounded-md border border-warning/40 bg-warning/10 p-4" role="dialog" aria-label="Test payment">
        <p className="flex items-center gap-2 font-medium text-warning">
          <FlaskConical className="size-4" aria-hidden="true" /> Test mode — no real money moves
        </p>
        <p className="text-sm">
          Razorpay isn&apos;t connected yet, so this simulates the payment window for {phase.order.courseTitle} ({amountLabel}). The rest of the flow — signature
          check, payment verification and enrolment — runs exactly as in production.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void simulate(phase.order, "captured")}>Simulate successful payment</Button>
          <Button variant="outline" onClick={() => void simulate(phase.order, "failed")}>
            Simulate declined payment
          </Button>
          <Button variant="ghost" onClick={() => setPhase({ name: "idle" })}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const busy = phase.name === "working";
  return (
    <div className="grid gap-4">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
        <span className="text-muted-foreground">
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="text-primary underline">
            Terms of use
          </Link>{" "}
          and{" "}
          <Link href="/refund-policy" target="_blank" className="text-primary underline">
            Refund policy
          </Link>
          .
        </span>
      </label>
      <Button size="lg" disabled={!accepted || busy} aria-disabled={!accepted || busy} onClick={() => void start()} className="w-full">
        {busy ? <Loader2 className="motion-safe:animate-spin" /> : <CreditCard />}
        {busy ? phase.label : `Pay ${amountLabel} online`}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" aria-hidden="true" /> UPI, cards and netbanking via Razorpay. We never see your card details.
      </p>
      {phase.name === "error" ? (
        <p role="alert" className="text-sm text-danger">
          {phase.message}
        </p>
      ) : null}
    </div>
  );
}

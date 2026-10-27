"use client";

import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { OrderState } from "@/lib/contracts/commerce";
import { orderStateAction } from "../../actions";

const MAX_POLLS = 40; // ~2 minutes; after that reconciliation takes over server-side

export function OrderStatus({ initial }: { initial: OrderState }) {
  const [state, setState] = useState(initial);
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    if (!state.pollAfterMs || polls >= MAX_POLLS) return;
    const t = setTimeout(async () => {
      const next = await orderStateAction(state.orderId);
      if (next) setState(next);
      setPolls((n) => n + 1);
    }, state.pollAfterMs);
    return () => clearTimeout(t);
  }, [state, polls]);

  const active = state.enrollment?.status === "ACTIVE" && ["PAID", "CREATED"].includes(state.orderStatus);
  return (
    <div className="rounded-lg border border-border bg-surface p-8 text-center" aria-live="polite">
      {active ? (
        <>
          <CircleCheck className="mx-auto size-12 text-success" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">You&apos;re enrolled!</h1>
          <p className="mt-2 text-muted-foreground">Payment received for {state.courseTitle}. A confirmation email is on its way.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/app/courses">Start learning</Link>
          </Button>
        </>
      ) : state.paymentStatus === "FAILED" && state.orderStatus === "CREATED" ? (
        <>
          <CircleX className="mx-auto size-12 text-danger" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">Payment didn&apos;t go through</h1>
          <p className="mt-2 text-muted-foreground">{state.failureReason ?? "The payment was declined."} No money was taken — if it was, it will be refunded automatically.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href={`/courses/${state.courseSlug}`}>Try again</Link>
          </Button>
        </>
      ) : state.pollAfterMs && polls < MAX_POLLS ? (
        <>
          <Loader2 className="mx-auto size-12 text-cyan motion-safe:animate-spin" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">Confirming your payment…</h1>
          <p className="mt-2 text-muted-foreground">This usually takes a few seconds. You can safely leave this page — we&apos;ll email you when it&apos;s done.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">We&apos;re still confirming this payment</h1>
          <p className="mt-2 text-muted-foreground">
            If money left your account, your access will open automatically within about 15 minutes, or the amount will be refunded. Check{" "}
            <Link href="/app/payments" className="text-primary underline">
              Payments
            </Link>{" "}
            for updates.
          </p>
        </>
      )}
    </div>
  );
}

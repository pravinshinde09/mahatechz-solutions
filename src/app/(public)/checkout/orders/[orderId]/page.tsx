import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authedRequest } from "@/lib/api/server";
import { requireUser } from "@/lib/auth/session";
import type { OrderState } from "@/lib/contracts/commerce";
import { OrderStatus } from "./order-status";

export const metadata: Metadata = { title: "Order status", robots: { index: false } };

/** Spec §22.1 order result: status comes from the API (never from query parameters) and is polled. */
export default async function OrderPage(props: PageProps<"/checkout/orders/[orderId]">) {
  await requireUser();
  const { orderId } = await props.params;
  const res = await authedRequest<OrderState>(`/checkout/orders/${encodeURIComponent(orderId)}`);
  if (!res.ok) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 md:px-6">
      <OrderStatus initial={res.data} />
    </div>
  );
}

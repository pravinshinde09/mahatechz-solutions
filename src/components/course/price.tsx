import { cn } from "cn";
import { formatDate, formatPaise } from "@/lib/format";

interface PriceView {
  listPaise: number;
  effectivePaise: number;
  promoEndsAt: string | null;
  isFree: boolean;
}

/** Price with strike-through when an offer is active (spec §21.6). Numerals in mono. */
export function Price({ price, size = "md" }: { price: PriceView; size?: "md" | "lg" }) {
  if (price.isFree) return <span className={cn("font-mono font-semibold text-success", size === "lg" ? "text-3xl" : "text-lg")}>Free</span>;
  const discounted = price.effectivePaise < price.listPaise;
  return (
    <div>
      <span className={cn("font-mono font-semibold tabular", size === "lg" ? "text-3xl" : "text-lg")}>{formatPaise(price.effectivePaise)}</span>
      {discounted ? (
        <>
          <span className="ml-2 font-mono text-sm text-muted-foreground line-through tabular">
            <span className="sr-only">Regular price </span>
            {formatPaise(price.listPaise)}
          </span>
          {price.promoEndsAt ? <p className="mt-1 text-xs text-warning">Offer ends {formatDate(price.promoEndsAt)}</p> : null}
        </>
      ) : null}
    </div>
  );
}

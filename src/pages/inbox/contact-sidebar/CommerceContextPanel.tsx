import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Package,
  ReceiptText,
  ShoppingCart,
  Store,
} from "@/components/ui/icons";
import {
  contactsApi,
  type CommerceCartSummary,
  type CommerceCustomerSummary,
  type CommerceOrderSummary,
  type ContactCommerceContext,
} from "../../../lib/contactApi";
import { getIntegrationMetadata } from "../../../config/integrationMetadata";
import { Tooltip } from "../../../components/ui/Tooltip";
import { TruncatedText } from "../../../components/ui/TruncatedText";

interface CommerceContextPanelProps {
  contactId?: number | string | null;
}

function formatMoney(value?: number | null, currency?: string | null) {
  if (value == null) return "-";
  const normalizedCurrency = currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch {
    return `${normalizedCurrency} ${(value / 100).toFixed(2)}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: parsed.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function sourceMeta(provider?: string | null) {
  const metadata = getIntegrationMetadata(provider);
  return {
    name: metadata?.name ?? provider ?? "Commerce",
    icon: metadata?.simpleIconUrl ?? null,
  };
}

function statusClassName(status?: string | null) {
  const normalized = status?.toLowerCase();
  if (normalized === "paid" || normalized === "fulfilled" || normalized === "recovered") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (normalized === "abandoned" || normalized === "cancelled") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }
  return "border-slate-100 bg-slate-50 text-slate-600";
}

function StatusPill({ status }: { status?: string | null }) {
  if (!status) return null;
  return (
    <span className={`inline-flex max-w-[96px] items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClassName(status)}`}>
      <span className="truncate">{status.replace(/_/g, " ")}</span>
    </span>
  );
}

function SourceIcon({ provider }: { provider?: string | null }) {
  const meta = sourceMeta(provider);
  return (
    <Tooltip content={meta.name}>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm">
        {meta.icon ? (
          <img src={meta.icon} alt={meta.name} className="h-3.5 w-3.5 object-contain" />
        ) : (
          <Store size={13} className="text-slate-500" />
        )}
      </span>
    </Tooltip>
  );
}

function LineItemPreview({ items }: { items?: Array<{ title: string; quantity?: number | null }> }) {
  const visible = items?.slice(0, 2) ?? [];
  if (visible.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {visible.map((item, index) => (
        <div key={`${item.title}-${index}`} className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
          <Package size={10} className="shrink-0 text-slate-400" />
          <TruncatedText
            text={`${item.quantity ?? 1} x ${item.title}`}
            maxLines={1}
            maxLength={34}
            className="min-w-0"
          />
        </div>
      ))}
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
      <p className="truncate text-[10px] font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function LatestOrderCard({ order }: { order: CommerceOrderSummary }) {
  const date = formatDate(order.placedAt ?? order.paidAt);
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-start gap-2">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[var(--color-primary)]">
          <ReceiptText size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <TruncatedText
              text={order.orderNumber || "Order"}
              maxLines={1}
              maxLength={22}
              className="min-w-0 text-[12px] font-semibold text-slate-900"
            />
            <StatusPill status={order.status} />
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {formatMoney(order.totalAmount, order.currency)}
            {date ? ` · ${date}` : ""}
          </p>
          <LineItemPreview items={order.lineItems} />
        </div>
      </div>
    </div>
  );
}

function LatestCartCard({ cart }: { cart: CommerceCartSummary }) {
  const date = formatDate(cart.abandonedAt ?? cart.providerUpdatedAt);
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-start gap-2">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <ShoppingCart size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="min-w-0 truncate text-[12px] font-semibold text-slate-900">
              {cart.status === "abandoned" ? "Abandoned cart" : "Cart"}
            </p>
            <StatusPill status={cart.status} />
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {formatMoney(cart.totalAmount, cart.currency)}
            {cart.itemCount != null ? ` · ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}` : ""}
            {date ? ` · ${date}` : ""}
          </p>
          <LineItemPreview items={cart.lineItems} />
        </div>
      </div>
    </div>
  );
}

function chooseCustomer(customers: CommerceCustomerSummary[]) {
  return customers[0] ?? null;
}

function chooseOrder(orders: CommerceOrderSummary[]) {
  return orders[0] ?? null;
}

function chooseCart(carts: CommerceCartSummary[]) {
  return carts[0] ?? null;
}

export function CommerceContextPanel({ contactId }: CommerceContextPanelProps) {
  const [context, setContext] = useState<ContactCommerceContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCommerceContext() {
      if (!contactId) {
        setContext(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await contactsApi.getCommerceContext(contactId);
        if (!cancelled) {
          setContext({
            customers: Array.isArray(response.customers) ? response.customers : [],
            orders: Array.isArray(response.orders) ? response.orders : [],
            carts: Array.isArray(response.carts) ? response.carts : [],
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setContext(null);
          setError(loadError instanceof Error ? loadError.message : "Commerce context unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCommerceContext();
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  const customer = useMemo(() => chooseCustomer(context?.customers ?? []), [context?.customers]);
  const latestOrder = useMemo(() => chooseOrder(context?.orders ?? []), [context?.orders]);
  const latestCart = useMemo(() => chooseCart(context?.carts ?? []), [context?.carts]);
  const hasCommerce = Boolean(customer || latestOrder || latestCart);

  if (!contactId) return null;

  return (
    <>
      <div className="mx-5 border-t border-[#f0f2f8]" />
      <section className="px-5 py-3.5">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-[#8b95a5]"><Store size={11} /></span>
            <span className="text-[10px] font-semibold uppercase text-[#5f6b7a]">Commerce</span>
          </div>
          {customer ? <SourceIcon provider={customer.provider} /> : null}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-[12px] text-slate-500">
            <Loader2 size={13} className="animate-spin text-[var(--color-primary)]" />
            Loading commerce context
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : !hasCommerce ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-[12px] text-slate-400">
            No commerce activity yet
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <SummaryMetric
                label="Total spent"
                value={formatMoney(customer?.totalSpentAmount, customer?.currency ?? latestOrder?.currency ?? latestCart?.currency)}
              />
              <SummaryMetric
                label="Orders"
                value={String(customer?.totalOrders ?? context?.orders.length ?? 0)}
              />
            </div>
            {latestOrder ? <LatestOrderCard order={latestOrder} /> : null}
            {latestCart ? <LatestCartCard cart={latestCart} /> : null}
          </div>
        )}
      </section>
    </>
  );
}

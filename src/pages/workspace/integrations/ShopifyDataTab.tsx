import { RefreshCw } from "@/components/ui/icons";

import { Button } from "../../../components/ui/Button";
import { DataTable, type DataTableColumn } from "../../../components/ui/DataTable";
import { ListPagination } from "../../../components/ui/ListPagination";
import { Tag } from "../../../components/ui/Tag";
import type { IntegrationCommerceResourceType } from "../../../lib/workspaceApi";
import { formatDateTime, formatLogLabel } from "./integrationUi";

export type CommercePagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type CommerceCustomerRef = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
};

type CommerceLineItemSummary = {
  id: string;
  title: string;
  sku?: string | null;
  quantity?: number | null;
  totalAmount?: number | null;
};

type ShopifyCustomerRow = {
  id: string;
  provider: string;
  externalCustomerId: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  status?: string | null;
  marketingOptIn?: boolean | null;
  totalOrders?: number | null;
  totalSpentAmount?: number | null;
  currency?: string | null;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type ShopifyOrderRow = {
  id: string;
  provider: string;
  externalOrderId: string;
  orderNumber?: string | null;
  status?: string | null;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  currency?: string | null;
  subtotalAmount?: number | null;
  totalAmount?: number | null;
  email?: string | null;
  phone?: string | null;
  placedAt?: string | null;
  paidAt?: string | null;
  fulfilledAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  commerceCustomer?: CommerceCustomerRef | null;
  lineItems?: CommerceLineItemSummary[];
  _count?: { lineItems?: number };
};

type ShopifyProductRow = {
  id: string;
  provider: string;
  externalKey: string;
  externalProductId: string;
  externalVariantId?: string | null;
  title: string;
  sku?: string | null;
  handle?: string | null;
  productType?: string | null;
  vendor?: string | null;
  status?: string | null;
  imageUrl?: string | null;
  priceAmount?: number | null;
  currency?: string | null;
  inventoryQuantity?: number | null;
  createdAt: string;
  updatedAt?: string;
};

type ShopifyCartRow = {
  id: string;
  provider: string;
  externalCartId: string;
  externalCheckoutId?: string | null;
  status?: string | null;
  currency?: string | null;
  subtotalAmount?: number | null;
  totalAmount?: number | null;
  itemCount?: number | null;
  checkoutUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  providerCreatedAt?: string | null;
  providerUpdatedAt?: string | null;
  abandonedAt?: string | null;
  recoveredAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  commerceCustomer?: CommerceCustomerRef | null;
  lineItems?: CommerceLineItemSummary[];
  _count?: { lineItems?: number };
};

export type ShopifyCommerceRow =
  | ShopifyCustomerRow
  | ShopifyOrderRow
  | ShopifyProductRow
  | ShopifyCartRow;

export type ShopifyCommerceResponse = {
  items?: ShopifyCommerceRow[];
  pagination?: CommercePagination;
};

export type ShopifyDataTabId = IntegrationCommerceResourceType;

export const SHOPIFY_DATA_TABS: Array<{
  id: ShopifyDataTabId;
  label: string;
  itemLabel: string;
}> = [
  { id: "customers", label: "Customers", itemLabel: "customers" },
  { id: "orders", label: "Orders", itemLabel: "orders" },
  { id: "products", label: "Products", itemLabel: "products" },
  { id: "carts", label: "Carts", itemLabel: "carts" },
  { id: "checkouts", label: "Checkouts", itemLabel: "checkouts" },
];

export const DEFAULT_SHOPIFY_ROWS_PAGINATION: CommercePagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export function isShopifyDataTab(tabId: string): tabId is ShopifyDataTabId {
  return SHOPIFY_DATA_TABS.some((tab) => tab.id === tabId);
}

function hasKey<T extends string>(value: ShopifyCommerceRow, key: T) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isCustomerRow(row: ShopifyCommerceRow): row is ShopifyCustomerRow {
  return hasKey(row, "externalCustomerId");
}

function isOrderRow(row: ShopifyCommerceRow): row is ShopifyOrderRow {
  return hasKey(row, "externalOrderId");
}

function isProductRow(row: ShopifyCommerceRow): row is ShopifyProductRow {
  return hasKey(row, "externalProductId") && hasKey(row, "title");
}

function isCartRow(row: ShopifyCommerceRow): row is ShopifyCartRow {
  return hasKey(row, "externalCartId");
}

function formatShopifyMoney(value?: number | null, currency?: string | null) {
  if (value == null) return null;
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

function numberLabel(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "-";
}

function commerceCustomerLabel(customer?: CommerceCustomerRef | null) {
  if (!customer) return null;
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
  return name || customer.email || customer.phone || null;
}

function commerceRowCustomerLabel(row: {
  commerceCustomer?: CommerceCustomerRef | null;
  email?: string | null;
  phone?: string | null;
}) {
  return commerceCustomerLabel(row.commerceCustomer) ?? row.email ?? row.phone ?? "-";
}

function shopifyCustomerName(row: ShopifyCustomerRow) {
  return (
    [row.firstName, row.lastName].filter(Boolean).join(" ").trim() ||
    row.email ||
    row.phone ||
    "Shopify customer"
  );
}

function shopifyLineItemPreview(items?: CommerceLineItemSummary[]) {
  if (!items || items.length === 0) return "-";
  return items
    .slice(0, 2)
    .map((item) => `${item.title}${item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ""}`)
    .join(", ");
}

function commerceStatusColor(status?: string | null) {
  const normalized = status?.toLowerCase();
  if (!normalized) return "tag-grey";
  if (["active", "paid", "fulfilled", "recovered", "completed"].includes(normalized)) {
    return "tag-green";
  }
  if (["abandoned", "cancelled", "expired"].includes(normalized)) {
    return "tag-orange";
  }
  if (["pending", "created", "open"].includes(normalized)) {
    return "tag-blue";
  }
  return "tag-grey";
}

function CommerceStatusTag({ status }: { status?: string | null }) {
  if (!status) return <span className="text-gray-400">-</span>;
  return (
    <Tag
      label={formatLogLabel(status)}
      bgColor={commerceStatusColor(status)}
      size="sm"
    />
  );
}

export function ShopifyDataTab({
  tabId,
  rows,
  loading,
  mobileLoadingMore,
  error,
  pagination,
  onReload,
  onPageChange,
  onLoadNextMobilePage,
}: {
  tabId: ShopifyDataTabId;
  rows: ShopifyCommerceRow[];
  loading: boolean;
  mobileLoadingMore: boolean;
  error: string | null;
  pagination: CommercePagination;
  onReload: () => void;
  onPageChange: (page: number) => void;
  onLoadNextMobilePage: () => void;
}) {
  const tab = SHOPIFY_DATA_TABS.find((item) => item.id === tabId) ?? SHOPIFY_DATA_TABS[0];

  const renderTable = <T extends ShopifyCommerceRow,>(
    typedRows: T[],
    columns: Array<DataTableColumn<T>>,
    emptyTitle: string,
    minTableWidth = 860,
  ) => (
    <DataTable
      className="h-full"
      rows={typedRows}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      loadingLabel={`Loading ${tab.itemLabel}...`}
      emptyTitle={emptyTitle}
      minTableWidth={minTableWidth}
      density="compact"
      mobileLoadMore={{
        hasMore: pagination.hasNextPage,
        loading: mobileLoadingMore,
        onLoadMore: onLoadNextMobilePage,
        loadingLabel: `Loading more ${tab.itemLabel}...`,
      }}
      footer={
        !loading ? (
          <ListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            itemLabel={tab.itemLabel}
            onPageChange={onPageChange}
          />
        ) : null
      }
    />
  );

  const customerColumns: Array<DataTableColumn<ShopifyCustomerRow>> = [
    {
      id: "customer",
      header: "Customer",
      mobile: "primary",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{shopifyCustomerName(row)}</p>
          <p className="truncate text-xs text-gray-500">{row.email ?? row.phone ?? row.externalCustomerId}</p>
        </div>
      ),
    },
    {
      id: "orders",
      header: "Orders",
      align: "right",
      mobile: "detail",
      cell: (row) => numberLabel(row.totalOrders),
    },
    {
      id: "spent",
      header: "Total spent",
      align: "right",
      mobile: "detail",
      cell: (row) => formatShopifyMoney(row.totalSpentAmount, row.currency) ?? "-",
    },
    {
      id: "status",
      header: "Status",
      mobile: "secondary",
      cell: (row) => <CommerceStatusTag status={row.status} />,
    },
    {
      id: "lastSeen",
      header: "Last seen",
      mobile: "detail",
      cell: (row) => formatDateTime(row.lastSeenAt ?? row.updatedAt ?? row.createdAt),
    },
  ];

  const orderColumns: Array<DataTableColumn<ShopifyOrderRow>> = [
    {
      id: "order",
      header: "Order",
      mobile: "primary",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{row.orderNumber ?? row.externalOrderId}</p>
          <p className="truncate text-xs text-gray-500">{shopifyLineItemPreview(row.lineItems)}</p>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      mobile: "secondary",
      cell: (row) => <span className="truncate">{commerceRowCustomerLabel(row)}</span>,
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      mobile: "detail",
      cell: (row) => formatShopifyMoney(row.totalAmount, row.currency) ?? "-",
    },
    {
      id: "payment",
      header: "Payment",
      mobile: "detail",
      cell: (row) => <CommerceStatusTag status={row.financialStatus ?? row.status} />,
    },
    {
      id: "fulfillment",
      header: "Fulfillment",
      mobile: "detail",
      cell: (row) => <CommerceStatusTag status={row.fulfillmentStatus ?? row.status} />,
    },
    {
      id: "placed",
      header: "Placed",
      mobile: "detail",
      cell: (row) => formatDateTime(row.placedAt ?? row.createdAt),
    },
  ];

  const productColumns: Array<DataTableColumn<ShopifyProductRow>> = [
    {
      id: "product",
      header: "Product",
      mobile: "primary",
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt=""
              className="h-9 w-9 flex-shrink-0 rounded-md border border-gray-100 object-cover"
            />
          ) : (
            <span className="h-9 w-9 flex-shrink-0 rounded-md border border-gray-100 bg-gray-50" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{row.title}</p>
            <p className="truncate text-xs text-gray-500">{row.sku ?? row.handle ?? row.externalProductId}</p>
          </div>
        </div>
      ),
    },
    {
      id: "vendor",
      header: "Vendor",
      mobile: "secondary",
      cell: (row) => row.vendor ?? "-",
    },
    {
      id: "type",
      header: "Type",
      mobile: "detail",
      cell: (row) => row.productType ?? "-",
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      mobile: "detail",
      cell: (row) => formatShopifyMoney(row.priceAmount, row.currency) ?? "-",
    },
    {
      id: "inventory",
      header: "Inventory",
      align: "right",
      mobile: "detail",
      cell: (row) => numberLabel(row.inventoryQuantity),
    },
    {
      id: "status",
      header: "Status",
      mobile: "detail",
      cell: (row) => <CommerceStatusTag status={row.status} />,
    },
  ];

  const cartColumns: Array<DataTableColumn<ShopifyCartRow>> = [
    {
      id: "cart",
      header: tabId === "checkouts" ? "Checkout" : "Cart",
      mobile: "primary",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">
            {tabId === "checkouts"
              ? row.externalCheckoutId ?? row.externalCartId
              : row.externalCartId}
          </p>
          <p className="truncate text-xs text-gray-500">{shopifyLineItemPreview(row.lineItems)}</p>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      mobile: "secondary",
      cell: (row) => <span className="truncate">{commerceRowCustomerLabel(row)}</span>,
    },
    {
      id: "items",
      header: "Items",
      align: "right",
      mobile: "detail",
      cell: (row) => numberLabel(row.itemCount),
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      mobile: "detail",
      cell: (row) => formatShopifyMoney(row.totalAmount, row.currency) ?? "-",
    },
    {
      id: "status",
      header: "Status",
      mobile: "detail",
      cell: (row) => <CommerceStatusTag status={row.status} />,
    },
    {
      id: "updated",
      header: tabId === "checkouts" ? "Checkout time" : "Updated",
      mobile: "detail",
      cell: (row) =>
        formatDateTime(
          tabId === "checkouts"
            ? row.abandonedAt ?? row.providerCreatedAt ?? row.createdAt
            : row.providerUpdatedAt ?? row.updatedAt ?? row.createdAt,
        ),
    },
  ];

  const table =
    tabId === "customers"
      ? renderTable(rows.filter(isCustomerRow), customerColumns, "No Shopify customers found", 900)
      : tabId === "orders"
        ? renderTable(rows.filter(isOrderRow), orderColumns, "No Shopify orders found", 980)
        : tabId === "products"
          ? renderTable(rows.filter(isProductRow), productColumns, "No Shopify products found", 980)
          : renderTable(
              rows.filter(isCartRow),
              cartColumns,
              tabId === "checkouts" ? "No Shopify checkouts found" : "No Shopify carts found",
              960,
            );

  return (
    <div className="flex min-h-[520px] flex-col">
      <section className="settings-data-panel">
        <div className="settings-data-header">
          <div className="settings-page-intro">
            <p className="settings-page-intro__copy">{pagination.total.toLocaleString()} {tab.itemLabel}</p>
            <div className="settings-page-actions">
              <Button
                onClick={onReload}
                variant="secondary"
                size="sm"
                loading={loading}
                loadingMode="inline"
                loadingLabel="Refreshing..."
                leftIcon={<RefreshCw size={14} />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <p className="mx-4 mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </p>
        ) : null}

        <div className="min-h-[420px] min-w-0 flex-1 overflow-hidden">
          {table}
        </div>
      </section>
    </div>
  );
}

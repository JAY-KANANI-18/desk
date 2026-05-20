export type IntegrationProviderId =
  | "meta_ads"
  | "tiktok_ads"
  | "shopify"
  | "woocommerce"
  | "bigcommerce"
  | "magento"
  | "stripe"
  | "razorpay"
  | "google_sheets"
  | "hubspot"
  | "salesforce";

export type IntegrationCategory =
  | "Advertising"
  | "Commerce"
  | "Payments"
  | "Productivity"
  | "CRM";

export type IntegrationAvailability = "available" | "planned";

export type IntegrationConnectMode =
  | "oauth_popup"
  | "oauth_redirect"
  | "api_key"
  | "coming_soon";

export type IntegrationAuthType = "oauth" | "api_key" | "webhook" | "private_app";

export type IntegrationTabId =
  | "overview"
  | "ads"
  | "commerce"
  | "customers"
  | "orders"
  | "products"
  | "carts"
  | "checkouts"
  | "payments"
  | "mapping"
  | "webhooks"
  | "activity"
  | "settings";

export interface IntegrationTabDefinition {
  id: IntegrationTabId;
  label: string;
}

export interface IntegrationMetadata {
  id: IntegrationProviderId;
  name: string;
  desc: string;
  simpleIconSlug: string;
  simpleIconColor: string;
  simpleIconUrl: string;
  category: IntegrationCategory;
  providerCategory: string;
  availability: IntegrationAvailability;
  connectMode: IntegrationConnectMode;
  authType: IntegrationAuthType;
  capabilities: string[];
  plannedDomains: string[];
  tabs: IntegrationTabDefinition[];
}

const simpleIconUrl = (slug: string, color: string) =>
  `https://cdn.simpleicons.org/${slug}/${color}`;

const tabs = (...items: IntegrationTabDefinition[]) => items;

const overviewTab: IntegrationTabDefinition = { id: "overview", label: "Overview" };
const activityTab: IntegrationTabDefinition = { id: "activity", label: "Activity" };
const settingsTab: IntegrationTabDefinition = { id: "settings", label: "Settings" };
const webhooksTab: IntegrationTabDefinition = { id: "webhooks", label: "Live Updates" };

export const INTEGRATION_METADATA: IntegrationMetadata[] = [
  {
    id: "meta_ads",
    name: "Meta Ads",
    desc: "Capture ad leads and click events, enrich contacts, and trigger workflows from Meta campaigns.",
    simpleIconSlug: "meta",
    simpleIconColor: "0467DF",
    simpleIconUrl: simpleIconUrl("meta", "0467DF"),
    category: "Advertising",
    providerCategory: "ads",
    availability: "available",
    connectMode: "oauth_popup",
    authType: "oauth",
    capabilities: ["lead_capture", "campaign_health", "workflow_trigger", "contact_enrichment"],
    plannedDomains: ["ads", "automation"],
    tabs: tabs(
      overviewTab,
      { id: "ads", label: "Lead Sources" },
      activityTab,
      settingsTab,
    ),
  },
  // {
  //   id: "tiktok_ads",
  //   name: "TikTok Ads",
  //   desc: "Sync lead forms, campaigns, and paid social audiences into AxoDesk automation.",
  //   simpleIconSlug: "tiktok",
  //   simpleIconColor: "111111",
  //   simpleIconUrl: simpleIconUrl("tiktok", "111111"),
  //   category: "Advertising",
  //   providerCategory: "ads",
  //   availability: "planned",
  //   connectMode: "coming_soon",
  //   authType: "oauth",
  //   capabilities: ["lead_capture", "campaign_health", "workflow_trigger"],
  //   plannedDomains: ["ads", "automation"],
  //   tabs: tabs(overviewTab, { id: "ads", label: "Ad Sources" }, activityTab, settingsTab),
  // },
  {
    id: "shopify",
    name: "Shopify",
    desc: "Use customers, orders, products, and abandoned carts for support context and broadcasts.",
    simpleIconSlug: "shopify",
    simpleIconColor: "7AB55C",
    simpleIconUrl: simpleIconUrl("shopify", "7AB55C"),
    category: "Commerce",
    providerCategory: "commerce",
    availability: "available",
    connectMode: "oauth_popup",
    authType: "oauth",
    capabilities: ["customers", "orders", "carts", "products", "broadcast_audience", "workflow_trigger"],
    plannedDomains: ["commerce", "automation"],
    tabs: tabs(
      overviewTab,
      { id: "customers", label: "Customers" },
      { id: "orders", label: "Orders" },
      { id: "products", label: "Products" },
      { id: "carts", label: "Carts" },
      { id: "checkouts", label: "Checkouts" },
      webhooksTab,
      activityTab,
      settingsTab,
    ),
  },
  // {
  //   id: "woocommerce",
  //   name: "WooCommerce",
  //   desc: "Bring WooCommerce customers, orders, and carts into normalized commerce workflows.",
  //   simpleIconSlug: "woocommerce",
  //   simpleIconColor: "96588A",
  //   simpleIconUrl: simpleIconUrl("woocommerce", "96588A"),
  //   category: "Commerce",
  //   providerCategory: "commerce",
  //   availability: "planned",
  //   connectMode: "coming_soon",
  //   authType: "api_key",
  //   capabilities: ["customers", "orders", "carts", "products", "broadcast_audience"],
  //   plannedDomains: ["commerce"],
  //   tabs: tabs(overviewTab, { id: "commerce", label: "Commerce" }, webhooksTab, settingsTab),
  // },
  // {
  //   id: "bigcommerce",
  //   name: "BigCommerce",
  //   desc: "Connect store customers, carts, products, and order lifecycle events.",
  //   simpleIconSlug: "bigcommerce",
  //   simpleIconColor: "121118",
  //   simpleIconUrl: simpleIconUrl("bigcommerce", "121118"),
  //   category: "Commerce",
  //   providerCategory: "commerce",
  //   availability: "planned",
  //   connectMode: "coming_soon",
  //   authType: "oauth",
  //   capabilities: ["customers", "orders", "carts", "products"],
  //   plannedDomains: ["commerce"],
  //   tabs: tabs(overviewTab, { id: "commerce", label: "Commerce" }, webhooksTab, settingsTab),
  // },
  // {
  //   id: "magento",
  //   name: "Magento",
  //   desc: "Sync enterprise commerce customers, carts, and orders from Adobe Commerce.",
  //   simpleIconSlug: "magento",
  //   simpleIconColor: "EE672F",
  //   simpleIconUrl: simpleIconUrl("magento", "EE672F"),
  //   category: "Commerce",
  //   providerCategory: "commerce",
  //   availability: "planned",
  //   connectMode: "coming_soon",
  //   authType: "api_key",
  //   capabilities: ["customers", "orders", "carts", "products"],
  //   plannedDomains: ["commerce"],
  //   tabs: tabs(overviewTab, { id: "commerce", label: "Commerce" }, webhooksTab, settingsTab),
  // },
  // {
  //   id: "stripe",
  //   name: "Stripe",
  //   desc: "Create customer payment links and react to payment status changes.",
  //   simpleIconSlug: "stripe",
  //   simpleIconColor: "635BFF",
  //   simpleIconUrl: simpleIconUrl("stripe", "635BFF"),
  //   category: "Payments",
  //   providerCategory: "payments",
  //   availability: "planned",
  //   connectMode: "coming_soon",
  //   authType: "oauth",
  //   capabilities: ["payment_links", "payments", "refunds", "workflow_trigger"],
  //   plannedDomains: ["payments"],
  //   tabs: tabs(overviewTab, { id: "payments", label: "Payments" }, webhooksTab, activityTab, settingsTab),
  // },
  // {
  //   id: "razorpay",
  //   name: "Razorpay",
  //   desc: "Generate customer payment links and track Indian payment gateway events.",
  //   simpleIconSlug: "razorpay",
  //   simpleIconColor: "0C2451",
  //   simpleIconUrl: simpleIconUrl("razorpay", "0C2451"),
  //   category: "Payments",
  //   providerCategory: "payments",
  //   availability: "planned",
  //   connectMode: "coming_soon",
  //   authType: "api_key",
  //   capabilities: ["payment_links", "payments", "refunds", "workflow_trigger"],
  //   plannedDomains: ["payments"],
  //   tabs: tabs(overviewTab, { id: "payments", label: "Payments" }, webhooksTab, activityTab, settingsTab),
  // },
  // {
  //   id: "google_sheets",
  //   name: "Google Sheets",
  //   desc: "Export, sync, and automate workspace data with spreadsheets.",
  //   simpleIconSlug: "googlesheets",
  //   simpleIconColor: "34A853",
  //   simpleIconUrl: simpleIconUrl("googlesheets", "34A853"),
  //   category: "Productivity",
  //   providerCategory: "productivity",
  //   availability: "planned",
  //   connectMode: "coming_soon",
  //   authType: "oauth",
  //   capabilities: ["export", "row_sync", "workflow_action"],
  //   plannedDomains: ["productivity", "automation"],
  //   tabs: tabs(overviewTab, { id: "mapping", label: "Mapping" }, activityTab, settingsTab),
  // },
  // {
  //   id: "hubspot",
  //   name: "HubSpot",
  //   desc: "Sync CRM contacts, companies, deals, lifecycle stages, and owner context.",
  //   simpleIconSlug: "hubspot",
  //   simpleIconColor: "FF7A59",
  //   simpleIconUrl: simpleIconUrl("hubspot", "FF7A59"),
  //   category: "CRM",
  //   providerCategory: "crm",
  //   availability: "planned",
  //   connectMode: "coming_soon",
  //   authType: "oauth",
  //   capabilities: ["contacts", "companies", "deals", "workflow_trigger"],
  //   plannedDomains: ["crm"],
  //   tabs: tabs(overviewTab, { id: "mapping", label: "CRM Mapping" }, activityTab, settingsTab),
  // },
  // {
  //   id: "salesforce",
  //   name: "Salesforce",
  //   desc: "Connect enterprise CRM leads, contacts, accounts, opportunities, and tasks.",
  //   simpleIconSlug: "salesforce",
  //   simpleIconColor: "00A1E0",
  //   simpleIconUrl: simpleIconUrl("salesforce", "00A1E0"),
  //   category: "CRM",
  //   providerCategory: "crm",
  //   availability: "planned",
  //   connectMode: "coming_soon",
  //   authType: "oauth",
  //   capabilities: ["leads", "contacts", "accounts", "opportunities", "workflow_trigger"],
  //   plannedDomains: ["crm"],
  //   tabs: tabs(overviewTab, { id: "mapping", label: "CRM Mapping" }, activityTab, settingsTab),
  // },
];

export const INTEGRATION_METADATA_BY_ID = Object.fromEntries(
  INTEGRATION_METADATA.map((integration) => [integration.id, integration]),
) as Record<IntegrationProviderId, IntegrationMetadata>;

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  "Advertising",
  "Commerce",
  "Payments",
  "Productivity",
  "CRM",
];

export function getIntegrationMetadata(providerId?: string | null) {
  if (!providerId) return null;
  return INTEGRATION_METADATA.find((integration) => integration.id === providerId) ?? null;
}

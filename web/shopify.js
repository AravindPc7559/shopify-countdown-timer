import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const DB_PATH = `${process.cwd()}/database.sqlite`;

// Get environment variables
const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  HOST,
} = process.env;

// Validate required environment variables
if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
  throw new Error(
    "Missing required Shopify environment variables: SHOPIFY_API_KEY and/or SHOPIFY_API_SECRET"
  );
}

// Validate HOST in production
if (process.env.NODE_ENV === "production" && !HOST) {
  throw new Error(
    "HOST environment variable is required in production"
  );
}

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

// Parse scopes from environment variable (comma-separated string to array)
const scopes = SHOPIFY_SCOPES
  ? SHOPIFY_SCOPES.split(",").map((scope) => scope.trim()).filter(Boolean)
  : [];

// Clean host name (remove protocol if present)
// Default to localhost for local development if HOST is not provided
const hostName = HOST 
  ? HOST.replace(/^https?:\/\//, "") 
  : "localhost";

const shopify = shopifyApp({
  api: {
    apiKey: SHOPIFY_API_KEY,
    apiSecretKey: SHOPIFY_API_SECRET,
    scopes: scopes.length > 0 ? scopes : undefined,
    hostName: hostName,
    apiVersion: LATEST_API_VERSION,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new SQLiteSessionStorage(DB_PATH),
});

export default shopify;

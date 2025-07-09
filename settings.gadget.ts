import type { GadgetSettings } from "gadget-server";

export const settings: GadgetSettings = {
  type: "gadget/settings/v1",
  frameworkVersion: "v1.4.0",
  plugins: {
    connections: {
      shopify: {
        apiVersion: "2025-07",
        enabledModels: [],
        type: "partner",
        scopes: [
          "write_checkouts",
          "read_checkouts",
          "write_customers",
          "read_customers",
          "write_orders",
          "read_orders",
          "write_products",
          "read_products",
          "write_metaobjects",
          "read_metaobjects",
          "write_online_store_navigation",
          "read_online_store_navigation",
          "read_online_store_pages",
          "write_themes",
          "read_themes",
        ],
      },
    },
  },
};

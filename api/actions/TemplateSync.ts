import { TemplateSyncManager } from "../services/templatesyncmanager";
import { ActionOptions } from "gadget-server";
import { getAvailableShops } from "../services/shopifyConfig";

export const params = {
  action: { type: "string" },
  shopDomain: { type: "string" },
  themeId: { type: "string" },
  sourceShopDomain: { type: "string" },
  sourceThemeId: { type: "string" },
  templateKeys: { 
    type: "object",
    properties: {},
    additionalProperties: true
  },
  targetShopDomains: { 
    type: "object",
    properties: {},
    additionalProperties: true
  },
};

export const run: ActionRun = async ({ params, logger }) => {
  const { action, shopDomain, themeId, sourceShopDomain, sourceThemeId, templateKeys, targetShopDomains } = params as {
    action?: string;
    shopDomain?: string;
    themeId?: string;
    sourceShopDomain?: string;
    sourceThemeId?: string;
    templateKeys?: string[];
    targetShopDomains?: string[];
  };

  try {
    const templateSyncManager = new TemplateSyncManager();

    switch (action) {
      case "getShops":
        const shops = getAvailableShops();
        const transformedShops = shops.map(shop => ({
          id: shop.shop,
          myshopifyDomain: `${shop.shop}.myshopify.com`,
          name: shop.title,
        }));
        return { success: true, data: transformedShops };

      case "getThemes": {
        if (!shopDomain) {
          throw new Error("Shop domain is required");
        }
        const shopifyClient = templateSyncManager.createShopifyClient(shopDomain);
        const themes = await templateSyncManager.getThemes(shopDomain, shopifyClient);
        return { success: true, data: themes };
      }

      case "getTemplates": {
        if (!shopDomain || !themeId) {
          throw new Error("Shop domain and theme ID are required");
        }
        const shopifyClient = templateSyncManager.createShopifyClient(shopDomain);
        const assets = await templateSyncManager.getAssets(parseInt(themeId), shopifyClient);
        const templates = templateSyncManager.getTemplates(assets);
        return { success: true, data: templates };
      }

      case "sync":
        if (!sourceShopDomain || !sourceThemeId || !templateKeys || !targetShopDomains) {
          throw new Error("sourceShopDomain, sourceThemeId, templateKeys, and targetShopDomains are required");
        }

        const result = await templateSyncManager.syncTemplates({
          sourceShopDomain,
          sourceThemeId: parseInt(sourceThemeId),
          templateKeys,
          targetShopDomains,
          logger
        });

        return result;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    logger.error(`TemplateSync action failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const options: ActionOptions = {
  actionType: "custom"
};
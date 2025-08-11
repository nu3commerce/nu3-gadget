import { Logger } from "gadget-server";
import { createShopifyClient } from "./shopifyConfig"

export class TemplateSyncManager {
  /**
   * Creates a Shopify API client for a shop
   * @param shopId - The ID of the Shopify shop
   * @returns Shopify API client
   */
  createShopifyClient(shopId: string) {
    return createShopifyClient(shopId);
  }
  /**
   * Fetches themes from a Shopify store
   * @param shopId - The ID of the Shopify shop
   * @param shopifyApi - The Shopify API client
   * @returns List of themes
   */
  async getThemes(shopId: string, shopifyApi: any) {
    try {
      const themes = await shopifyApi.theme.list();
      return themes.filter((t: any) => t.role !== "unpublished");
    } catch (error: any) {
      console.error(`Error fetching themes for shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a specific theme from a Shopify store
   * @param themeId - The ID of the theme
   * @param shopifyApi - The Shopify API client
   * @returns Theme details
   */
  async getTheme(themeId: number, shopifyApi: any) {
    try {
      return await shopifyApi.theme.get(themeId);
    } catch (error: any) {
      console.error(`Error fetching theme ${themeId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches assets from a theme
   * @param themeId - The ID of the theme
   * @param shopifyApi - The Shopify API client
   * @returns List of assets
   */
  async getAssets(themeId: number, shopifyApi: any) {
    try {
      return await shopifyApi.asset.list(themeId);
    } catch (error: any) {
      console.error(`Error fetching assets for theme ${themeId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a specific asset from a theme
   * @param themeId - The ID of the theme
   * @param key - The asset key
   * @param shopifyApi - The Shopify API client
   * @returns Asset details
   */
  async getAsset(themeId: number, key: string, shopifyApi: any) {
    try {
      return await shopifyApi.asset.get(themeId, { "asset[key]": key });
    } catch (error: any) {
      console.error(`Error fetching asset ${key} for theme ${themeId}:`, error);
      throw error;
    }
  }

  /**
   * Filters assets to get only templates
   * @param assets - List of assets
   * @returns List of template assets
   */
  getTemplates(assets: any[]) {
    return assets?.filter((t: any) => RegExp('templates\/.*\.json', 'g').test(t.key)) || [];
  }

  /**
   * Syncs templates between shops
   * @param sourceShopId - The ID of the source shop
   * @param sourceThemeId - The ID of the source theme
   * @param templateKeys - Array of template keys to sync
   * @param targetShopIds - Array of target shop IDs
   * @param logger - Logger instance
   * @returns Result message
   */
  async syncTemplates({ sourceShopDomain, sourceThemeId, templateKeys, targetShopDomains, logger }: { sourceShopDomain: string, sourceThemeId: number, templateKeys: string[], targetShopDomains: string[], logger: Logger }) {
    try {
      const sourceShopifyApi = createShopifyClient(sourceShopDomain);
      const sourceTheme = await this.getTheme(sourceThemeId, sourceShopifyApi);

      let syncErrors = [];

      for (const targetShopId of targetShopDomains) {
        try {
          const targetShopifyApi = createShopifyClient(targetShopId);
          
          // Get the main theme of the target shop
          const themes = await targetShopifyApi.theme.list();
          const targetThemes = themes.filter((t: any) => t.role === "main");
          if (!targetThemes || targetThemes.length === 0) {
            throw new Error(`No main theme found for shop ${targetShopId}`);
          }
          
          const targetTheme = targetThemes[0];

          for (const templateKey of templateKeys) {
            try {
              // Get the template from the source shop
              const asset = await this.getAsset(sourceThemeId, templateKey, sourceShopifyApi);

              // Process sections in the template
              if (asset.value) {
                const templateData = JSON.parse(asset.value);

                // Ensure all required sections exist in the target theme
                for (const [sectionId, sectionData] of Object.entries(templateData.sections)) {
                  const sectionType = (sectionData as any).type;
                  const sectionKey = `sections/${sectionType}.liquid`;

                  try {
                    // Check if section exists in target theme
                    await targetShopifyApi.asset.get(targetTheme.id, { "asset[key]": sectionKey });
                  } catch (sectionError: any) {
                    // Section doesn't exist in target, try to get it from source and create it
                    try {
                      const sectionFile = await sourceShopifyApi.asset.get(sourceTheme.id, { "asset[key]": sectionKey });
                      await targetShopifyApi.asset.create(targetTheme.id, {
                        key: sectionKey,
                        value: sectionFile.value
                      });
                    } catch (createSectionError: any) {
                      // Log but continue if section file not found in source theme
                      logger.warn(`Section file ${sectionKey} not found in source theme, skipping`);
                    }
                  }
                }

                // Handle images in the template
                const matches = JSON.stringify(templateData).matchAll(/"shopify:\/\/shop_images\/(.*?)"/gm);
                if (matches) {
                  const imageMatches = Array.from(matches);
                  if (imageMatches.length > 0) {
                    const imageQuery = imageMatches.map(match => match[1]).join(' OR ');
                    const query = `query {files (first: 100, query: "${imageQuery}") {edges {node {preview {image {src altText}}}}}}`;
                    const imagesResponse = await sourceShopifyApi.graphql(query);

                    if (imagesResponse.files && imagesResponse.files.edges && imagesResponse.files.edges.length > 0) {
                      const images = imagesResponse.files.edges.map((edge: any) => {
                        return {
                          src: edge.node.preview.image.src,
                          altText: edge.node.preview.image.altText
                        };
                      });

                      const uploadQuery = `mutation fileCreate($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { fileStatus } userErrors { field message } } }`;
                      await targetShopifyApi.graphql(uploadQuery, {
                        files: images.map((image: any) => ({
                          alt: image.altText,
                          contentType: "IMAGE",
                          originalSource: image.src
                        }))
                      });
                    }
                  }
                }
              }

              // Create the template in the target theme
              await targetShopifyApi.asset.create(targetTheme.id, {
                key: asset.key,
                value: asset.value
              });

              logger.info(`Successfully synced template ${templateKey} to shop ${targetShopId}`);
            } catch (templateError: any) {
              const errorMessage = `Error syncing template ${templateKey} to shop ${targetShopId}: ${templateError.message}`;
              logger.error(errorMessage);
              syncErrors.push(errorMessage);
            }
          }
        } catch (shopError: any) {
          const errorMessage = `Error processing target shop ${targetShopId}: ${shopError.message}`;
          logger.error(errorMessage);
          syncErrors.push(errorMessage);
        }
      }

      if (syncErrors.length > 0) {
        return {
          success: false,
          message: `Sync completed with ${syncErrors.length} errors. Check logs for details.`,
          errors: syncErrors
        };
      }

      return {
        success: true,
        message: `${templateKeys.length} template(s) synced with ${targetShopDomains.length} target(s)!`
      };
    } catch (error: any) {
      logger.error(`Template sync failed: ${error.message}`);
      throw error;
    }
  }
}
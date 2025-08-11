import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ShopConfig {
  shop: string;
  title: string;
  access_token: string;
}

export interface ShopifyConfig {
  api_version: string;
  scopes: string[];
  shops: ShopConfig[];
}

/**
 * Parse Shopify configuration from environment variables
 */
export function getShopifyConfig(): ShopifyConfig {
  const shopifyConfigStr = process.env.SHOPIFY;
  if (!shopifyConfigStr) {
    throw new Error('SHOPIFY configuration not found in environment variables');
  }

  try {
    return JSON.parse(shopifyConfigStr);
  } catch (error) {
    throw new Error('Invalid SHOPIFY configuration format in environment variables');
  }
}

/**
 * Get all available shops from configuration
 */
export function getAvailableShops(): ShopConfig[] {
  const config = getShopifyConfig();
  return config.shops;
}

/**
 * Get shop configuration by shop domain
 */
export function getShopConfig(shopDomain: string): ShopConfig | null {
  const shops = getAvailableShops();
  return shops.find(shop => shop.shop === shopDomain) || null;
}

/**
 * Create Shopify API client for a specific shop
 */
export function createShopifyClient(shopDomain: string) {
  const shopConfig = getShopConfig(shopDomain);
  if (!shopConfig) {
    throw new Error(`Shop configuration not found for: ${shopDomain}`);
  }

  const config = getShopifyConfig();
  const baseUrl = `https://${shopConfig.shop}.myshopify.com/admin/api/${config.api_version}`;

  return {
    baseUrl,
    accessToken: shopConfig.access_token,
    
    // Theme API methods
    theme: {
      list: async () => {
        const response = await fetch(`${baseUrl}/themes.json`, {
          headers: {
            'X-Shopify-Access-Token': shopConfig.access_token,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch themes: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.themes;
      },
      
      get: async (themeId: number) => {
        const response = await fetch(`${baseUrl}/themes/${themeId}.json`, {
          headers: {
            'X-Shopify-Access-Token': shopConfig.access_token,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch theme: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.theme;
      },
    },
    
    // Asset API methods
    asset: {
      list: async (themeId: number) => {
        const response = await fetch(`${baseUrl}/themes/${themeId}/assets.json`, {
          headers: {
            'X-Shopify-Access-Token': shopConfig.access_token,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch assets: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.assets;
      },
      
      get: async (themeId: number, params: { [key: string]: string }) => {
        const assetKey = params['asset[key]'];
        const response = await fetch(`${baseUrl}/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(assetKey)}`, {
          headers: {
            'X-Shopify-Access-Token': shopConfig.access_token,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch asset: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.asset;
      },
      
      create: async (themeId: number, assetData: { key: string; value: string }) => {
        const response = await fetch(`${baseUrl}/themes/${themeId}/assets.json`, {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': shopConfig.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ asset: assetData }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create asset: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.asset;
      },
    },
    
    // GraphQL API method
    graphql: async (query: string, variables?: any) => {
      const response = await fetch(`${baseUrl.replace('/admin/api/' + config.api_version, '')}/admin/api/${config.api_version}/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': shopConfig.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });
      
      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    },
  };
}
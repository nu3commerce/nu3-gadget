import { config } from '../config';
import { BigQueryService } from './bigquery';
import { AkeneoApiService } from './akeneo';
import { ProductWrapper } from './product';

export class BestBeforeNoticeManager {
  private bigQueryService: BigQueryService;
  private akeneoApiService: AkeneoApiService;
  private bbNotices: Record<string, string> = {};

  constructor() {
    try {
      this.bigQueryService = new BigQueryService(
        config.projectId,
        config.credentialsPath
      );
    } catch (error) {
      throw error;
    }

    try {
      this.akeneoApiService = new AkeneoApiService();
    } catch (error) {
      throw error;
    }

    this.createBBNoticesDictionary();
  }

  async run(): Promise<void> {
    const startTime = Date.now();

    try {
      // Get products nearing expiration from BigQuery
      const stockDataStartTime = Date.now();
      const stockData = await this.bigQueryService.getProductsNearingExpiration();

      if (stockData.length === 0) {
        return;
      }

      // Authenticate with Akeneo
      const authStartTime = Date.now();
      await this.akeneoApiService.authenticate();

      // Get all products from Akeneo
      const productsStartTime = Date.now();
      const akeneoProducts = await this.akeneoApiService.getAllProducts();

      const productWrappers = akeneoProducts.map(product => new ProductWrapper(product));

      // First, clear existing BB notices and remove from food saver category
      const productsWithNotices = productWrappers.filter(p => p.HasBBNotice);

      for (const product of productsWithNotices) {
        product.deleteBBNotices();

        // Also remove from food saver category if present
        if (product.isInFoodSaver()) {
          product.removeFromFoodSaveCat(this.akeneoApiService);
        }

        const response = await this.akeneoApiService.updateProduct(product.AkeneoProduct);

        if (response.errors && response.errors.length > 0) {
          console.error(`🚨 Failed to clear BB notice for ${product.Sku}:`, response.errors);
          throw new Error(`Failed to clear BB notice for ${product.Sku}: ${response.errors[0].message}`);
        }
      }

      // Set rotten status for products found in stock data
      productWrappers.forEach(product => {
        product.setRottenInside(stockData);
      });

      // Filter to only rotten products
      const rottenProducts = productWrappers.filter(p => p.IsRottenInside);

      if (rottenProducts.length === 0) {
        return;
      }

      // Update BB notices for rotten products and add to food saver category
      for (const product of rottenProducts) {
        product.updateBBNotice(this.bbNotices);

        // Add to food saver category
        product.addToFoodSaveCat(this.akeneoApiService);

        const response = await this.akeneoApiService.updateProduct(product.AkeneoProduct);

        if (response.errors && response.errors.length > 0) {
          throw new Error(`Failed to update BB notice for ${product.Sku}: ${response.errors[0].message}`);
        }
      }

      const totalTime = Date.now() - startTime;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('🚨 Best Before Notice Manager failed after', totalTime, 'ms');
      throw error;
    }
  }

  private createBBNoticesDictionary(): void {
    this.bbNotices = {
      'de_CH': config.noticeDE,
      'de_DE': config.noticeDE,
      'fr_FR': config.noticeFR,
      'it_IT': config.noticeIT,
    };
  }
}

export const run = async () => {
  const manager = new BestBeforeNoticeManager();
  await manager.run();
}
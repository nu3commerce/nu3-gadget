import { AkeneoProduct } from './akeneo';
import { ProductStock } from '../types';

export class ProductWrapper {
  private akeneoProduct: AkeneoProduct;
  private sku: string;
  private subSkus: string[] = [];
  private rottenDate?: Date;
  private isRottenInside: boolean = false;
  private isPurchasable: boolean = false;
  private onStock: number = 0;

  private static readonly LOCALES = ['de_CH', 'de_DE', 'fr_FR', 'it_IT'];

  constructor(akeneoProduct: AkeneoProduct) {
    this.akeneoProduct = akeneoProduct;
    this.sku = akeneoProduct.identifier.toLowerCase();
    this.fillSubSkus();
    this.setPurchasable();
  }

  get AkeneoProduct(): AkeneoProduct {
    return this.akeneoProduct;
  }

  set AkeneoProduct(value: AkeneoProduct) {
    this.akeneoProduct = value;
  }

  get HasBBNotice(): boolean {
    return this.akeneoProduct.values.hasOwnProperty('best_before_date_notice');
  }

  get IsRottenInside(): boolean {
    return this.isRottenInside;
  }

  set IsRottenInside(value: boolean) {
    this.isRottenInside = value;
  }

  get Sku(): string {
    return this.sku;
  }

  set Sku(value: string) {
    this.sku = value.toLowerCase();
  }

  get RottenDate(): Date | undefined {
    return this.rottenDate;
  }

  set RottenDate(value: Date | undefined) {
    this.rottenDate = value;
  }

  get OnStock(): number {
    return this.onStock;
  }

  set OnStock(value: number) {
    this.onStock = value;
  }

  get IsPurchasable(): boolean {
    return this.isPurchasable;
  }

  set IsPurchasable(value: boolean) {
    this.isPurchasable = value;
  }

  get Parent(): string | undefined {
    return this.akeneoProduct.parent;
  }

  /**
   * Delete the Best Before Notice in all locales of this product
   */
  deleteBBNotices(): void {
    if (this.akeneoProduct.values['best_before_date_notice']) {
      this.akeneoProduct.values['best_before_date_notice'].forEach(notice => {
        notice.data = '';
      });
    }
  }

  /**
   * Set the product as rotten if it appears in the provided stock data
   */
  setRottenInside(stockData: ProductStock[]): void {
    const matchingStock = stockData.find(stock => 
      stock.sku.toLowerCase() === this.sku || 
      this.subSkus.some(subSku => subSku === stock.sku.toLowerCase())
    );

    if (matchingStock) {
      this.isRottenInside = true;
      
      // Handle BigQuery date object - extract the value if it's a BigQuery date
      let dateValue = matchingStock.bestbefore;
      if (dateValue && typeof dateValue === 'object' && 'value' in dateValue) {
        dateValue = (dateValue as any).value;
      }
      this.rottenDate = new Date(dateValue);
      
      this.onStock = matchingStock.quantity;
    }
  }

  /**
   * Update best before notice with localized messages
   */
  updateBBNotice(bbNotices: Record<string, string>): void {
    if (!this.rottenDate) return;

    // Initialize best_before_date_notice if it doesn't exist
    if (!this.akeneoProduct.values['best_before_date_notice']) {
      this.akeneoProduct.values['best_before_date_notice'] = [];
    }

    const formattedDate = this.formatDate(this.rottenDate);

    ProductWrapper.LOCALES.forEach(locale => {
      if (bbNotices[locale]) {
        const notice = bbNotices[locale].replace('xxx', formattedDate);
        
        // Find existing notice for this locale or create new one
        let existingNotice = this.akeneoProduct.values['best_before_date_notice']
          .find((n: any) => n.locale === locale);

        if (existingNotice) {
          existingNotice.data = notice;
        } else {
          this.akeneoProduct.values['best_before_date_notice'].push({
            locale: locale,
            scope: null,
            data: notice
          });
        }
      }
    });
  }

  /**
   * Get the product title in German locale
   */
  getTitleDE(): string {
    if (this.akeneoProduct.values['title']) {
      const deTitle = this.akeneoProduct.values['title']
        .find((t: any) => t.locale === 'de_DE');
      return deTitle ? deTitle.data : this.sku;
    }
    return this.sku;
  }

  /**
   * Fill sub-SKUs from product data if it's a bundle or has variants
   */
  private fillSubSkus(): void {
    // Initialize with main SKU
    this.subSkus = [this.sku];
    
    // Add bundle items if they exist (like .NET version)
    if (this.akeneoProduct.values['bundle_items'] && 
        this.akeneoProduct.values['bundle_items'].length > 0 &&
        this.akeneoProduct.values['bundle_items'][0].data) {
      const bundleItems = this.akeneoProduct.values['bundle_items'][0].data.toString().split(',');
      this.subSkus.push(...bundleItems.map((item: string) => item.trim().toLowerCase()));
    }
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Check if this product or any of its sub-products is rotten
   */
  checkIfAnySubProductIsRotten(stockData: ProductStock[]): boolean {
    return stockData.some(stock => 
      this.subSkus.some(subSku => subSku === stock.sku.toLowerCase())
    );
  }

  /**
   * Add product to food saver category
   */
  addToFoodSaveCat(akeneoApiService: any): void {
    if (!this.Parent) {
      // Add food_saver_1460 category to product
      if (!this.akeneoProduct.categories) {
        this.akeneoProduct.categories = [];
      }
      if (!this.akeneoProduct.categories.includes('food_saver_1460')) {
        this.akeneoProduct.categories.push('food_saver_1460');
      }
    } else {
      // For products with parent models, add category to parent
      akeneoApiService.addCategory2Model(this.Parent);
    }
  }

  /**
   * Remove product from food saver category
   */
  removeFromFoodSaveCat(akeneoApiService: any): void {
    if (this.akeneoProduct.categories) {
      const index = this.akeneoProduct.categories.indexOf('food_saver_1460');
      if (index > -1) {
        this.akeneoProduct.categories.splice(index, 1);
      }
    }
    
    if (this.Parent) {
      akeneoApiService.removeCategoryFromModel(this.Parent);
    }
  }

  /**
   * Check if product is in food saver category
   */
  isInFoodSaver(): boolean {
    return this.akeneoProduct.categories ? 
      this.akeneoProduct.categories.includes('food_saver_1460') : 
      false;
  }

  /**
   * Set purchasable flag based on product values
   */
  private setPurchasable(): void {
    if (this.akeneoProduct.values['purchasable'] && 
        this.akeneoProduct.values['purchasable'].length > 0) {
      this.isPurchasable = this.akeneoProduct.values['purchasable']
        .some((value: any) => value.data && value.data.toString() === 'purchasable');
    }
  }
} 
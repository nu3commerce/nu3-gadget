export interface AkeneoProduct {
    identifier: string;
    family?: string;
    parent?: string;
    values: Record<string, any[]>;
    categories?: string[];
    enabled?: boolean;
}

export interface AkeneoApiResponse {
    status: number;
    statusText: string;
    data?: any;
    errors?: Array<{ message: string; code?: string }>;
}

interface AkeneoAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface AkeneoProductsResponse {
    _embedded: {
        items: AkeneoProduct[];
    };
    _links?: {
        next?: {
            href: string;
        };
    };
}

interface AkeneoErrorResponse {
    errors?: Array<{ message: string; code?: string }>;
}

interface AkeneoProductModel {
    parent?: string;
    categories?: string[];
}

export class AkeneoApiService {
    private baseUrl: string;
    private clientId: string;
    private clientSecret: string;
    private userName: string;
    private password: string;
    private accessToken?: string;

    constructor() {


        // Get credentials from environment variables - no hardcoded fallbacks
        this.baseUrl = process.env.AKENEO_BASE_URL!;
        this.clientId = process.env.AKENEO_CLIENT_ID!;
        this.clientSecret = process.env.AKENEO_CLIENT_SECRET!;
        this.userName = process.env.AKENEO_USERNAME!;
        this.password = process.env.AKENEO_PASSWORD!;



        // Validate all required fields are present
        const missing = [];
        if (!this.baseUrl) missing.push('AKENEO_BASE_URL');
        if (!this.clientId) missing.push('AKENEO_CLIENT_ID');
        if (!this.clientSecret) missing.push('AKENEO_CLIENT_SECRET');
        if (!this.userName) missing.push('AKENEO_USERNAME');
        if (!this.password) missing.push('AKENEO_PASSWORD');

        if (missing.length > 0) {
            console.error('🚨 Missing required Akeneo environment variables:', missing);
            throw new Error(`Missing required Akeneo environment variables: ${missing.join(', ')}`);
        }

    }

    async authenticate(): Promise<void> {
        try {


            // Create form data with all credentials
            const formData = new URLSearchParams();
            formData.append('grant_type', 'password');
            formData.append('client_id', this.clientId);
            formData.append('client_secret', this.clientSecret);
            formData.append('username', this.userName);
            formData.append('password', this.password);
            // Prepare headers
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            const response = await fetch(`${this.baseUrl}/api/oauth/v1/token`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as AkeneoAuthResponse;

            this.accessToken = data.access_token;

        } catch (error) {
            console.error('🚨 Akeneo API authentication failed with error:', error);
            throw error;
        }
    }

    async getThirdPartyProducts(): Promise<AkeneoProduct[]> {
        await this.ensureAuthenticated();
        try {
            const products: AkeneoProduct[] = [];
            const searchCriteria = encodeURIComponent(
                JSON.stringify({
                    enabled: [{ operator: "=", value: true }],
                    own_brand: [{ operator: "=", value: false }]
                })
            );
            let nextUrl: string | null = `${this.baseUrl}/api/rest/v1/products?search=${searchCriteria}&limit=100`;
            while (nextUrl) {
                const response = await fetch(nextUrl, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) throw new Error(`Failed to fetch products: ${response.statusText}`);
                const data = await response.json() as AkeneoProductsResponse;
                products.push(...data._embedded.items);
                nextUrl = data._links?.next?.href || null;
            }
            return products;
        } catch (error) {
            console.error('Failed to fetch products from Akeneo', error);
            throw error;
        }
    }

    async getAllProducts(): Promise<AkeneoProduct[]> {
        await this.ensureAuthenticated();

        try {
            const products: AkeneoProduct[] = [];
            // Filter for own_brand = true products only (like .NET version)
            const searchCriteria = encodeURIComponent('{"own_brand":[{"operator":"=","value":true}]}');
            let nextUrl: string | null = `${this.baseUrl}/api/rest/v1/products?search=${searchCriteria}&limit=100`;

            while (nextUrl) {
                const response = await fetch(nextUrl, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch products: ${response.statusText}`);
                }

                const data = await response.json() as AkeneoProductsResponse;
                products.push(...data._embedded.items);

                // Get next page URL from links
                nextUrl = data._links?.next?.href || null;
            }

            return products;

        } catch (error) {
            console.error('Failed to fetch products from Akeneo', error);
            throw error;
        }
    }

    async getProductsBySkus(skus: string[]): Promise<AkeneoProduct[]> {
        await this.ensureAuthenticated();

        try {
            const products: AkeneoProduct[] = [];

            // Fetch products in batches to avoid URL length limits
            const batchSize = 50;
            for (let i = 0; i < skus.length; i += batchSize) {
                const batch = skus.slice(i, i + batchSize);
                const searchParams = batch.map(sku => `search={"identifier":[{"operator":"IN","value":["${sku}"]}]}`).join('&');

                const response = await fetch(`${this.baseUrl}/api/rest/v1/products?${searchParams}&limit=100`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch products by SKUs: ${response.statusText}`);
                }

                const data = await response.json() as AkeneoProductsResponse;
                products.push(...data._embedded.items);
            }

            return products;

        } catch (error) {
            console.error('Failed to fetch products by SKUs from Akeneo', error);
            throw error;
        }
    }

    async updateProduct(product: AkeneoProduct): Promise<AkeneoApiResponse> {
        await this.ensureAuthenticated();

        try {
            // Create a clean copy and remove metadata/read-only fields
            const cleanProduct = { ...product };

            // Remove Akeneo metadata fields that shouldn't be sent back
            delete (cleanProduct as any)._links;
            delete (cleanProduct as any).created;
            delete (cleanProduct as any).updated;
            delete (cleanProduct as any).associations;
            delete (cleanProduct as any).quantified_associations;
            delete (cleanProduct as any).group_labels;
            delete (cleanProduct as any).label;
            delete (cleanProduct as any).quality_scores;

            // Remove read-only or problematic value fields
            if (cleanProduct.values.compare_at_price) {
                delete cleanProduct.values.compare_at_price;
            }

            // Remove any other problematic value fields
            const valuesToRemove = ['created', 'updated', 'family_variant'];
            valuesToRemove.forEach(field => {
                if (cleanProduct.values[field]) {
                    delete cleanProduct.values[field];
                }
            });

            const response = await fetch(`${this.baseUrl}/api/rest/v1/products/${product.identifier}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanProduct)
            });

            const result: AkeneoApiResponse = {
                status: response.status,
                statusText: response.statusText
            };

            if (!response.ok) {
                const errorData = await response.json() as AkeneoErrorResponse;
                result.errors = errorData.errors || [{ message: response.statusText }];
                console.error(`Failed to update product ${product.identifier}`, errorData);
            } else {

                // If product has a parent (variant), update the parent model too
                if (product.parent) {
                    await this.updateProductModel(product.parent);
                }
            }

            return result;

        } catch (error) {
            console.error(`Error updating product ${product.identifier}`, error);
            throw error;
        }
    }

    async updateProductModel(modelCode: string): Promise<AkeneoApiResponse> {
        await this.ensureAuthenticated();

        try {
            // Get the product model first
            const getResponse = await fetch(`${this.baseUrl}/api/rest/v1/product-models/${modelCode}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!getResponse.ok) {
                throw new Error(`Failed to fetch product model: ${getResponse.statusText}`);
            }

            const productModel = await getResponse.json() as AkeneoProductModel;

            // Check if this model has a parent, if so, update the parent instead (recursive)
            if (productModel.parent) {
                return await this.updateProductModel(productModel.parent);
            }

            // Add api_touched field with timestamp (like .NET version)
            const updateData = {
                values: {
                    api_touched: [
                        {
                            locale: null,
                            scope: null,
                            data: `updated: ${new Date().toLocaleDateString('de-DE')}`
                        }
                    ]
                }
            };

            const response = await fetch(`${this.baseUrl}/api/rest/v1/product-models/${modelCode}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result: AkeneoApiResponse = {
                status: response.status,
                statusText: response.statusText
            };

            if (!response.ok) {
                const errorData = await response.json() as AkeneoErrorResponse;
                result.errors = errorData.errors || [{ message: response.statusText }];
                console.error(`Failed to update product model ${modelCode}`, errorData);
            }

            return result;

        } catch (error) {
            console.error(`Error updating product model ${modelCode}`, error);
            throw error;
        }
    }

    async addCategory2Model(modelCode: string): Promise<AkeneoApiResponse> {
        await this.ensureAuthenticated();

        try {
            // Get the product model first
            const getResponse = await fetch(`${this.baseUrl}/api/rest/v1/product-models/${modelCode}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!getResponse.ok) {
                throw new Error(`Failed to fetch product model: ${getResponse.statusText}`);
            }

            const productModel = await getResponse.json() as AkeneoProductModel;

            // Add food_saver_1460 category if not already present
            if (!productModel.categories) {
                productModel.categories = [];
            }
            if (!productModel.categories.includes('food_saver_1460')) {
                productModel.categories.push('food_saver_1460');
            }

            // Update the model
            const updateData = {
                categories: productModel.categories
            };

            const response = await fetch(`${this.baseUrl}/api/rest/v1/product-models/${modelCode}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result: AkeneoApiResponse = {
                status: response.status,
                statusText: response.statusText
            };

            if (!response.ok) {
                const errorData = await response.json() as AkeneoErrorResponse;
                result.errors = errorData.errors || [{ message: response.statusText }];
                console.error(`Failed to add category to product model ${modelCode}`, errorData);
            }

            return result;

        } catch (error) {
            console.error(`Error adding category to product model ${modelCode}`, error);
            throw error;
        }
    }

    async removeCategoryFromModel(modelCode: string): Promise<AkeneoApiResponse> {
        await this.ensureAuthenticated();

        try {
            // Get the product model first
            const getResponse = await fetch(`${this.baseUrl}/api/rest/v1/product-models/${modelCode}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!getResponse.ok) {
                throw new Error(`Failed to fetch product model: ${getResponse.statusText}`);
            }

            const productModel = await getResponse.json() as AkeneoProductModel;

            // Remove food_saver_1460 category if present
            if (productModel.categories) {
                const index = productModel.categories.indexOf('food_saver_1460');
                if (index > -1) {
                    productModel.categories.splice(index, 1);
                }
            }

            // Update the model
            const updateData = {
                categories: productModel.categories || []
            };

            const response = await fetch(`${this.baseUrl}/api/rest/v1/product-models/${modelCode}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result: AkeneoApiResponse = {
                status: response.status,
                statusText: response.statusText
            };

            if (!response.ok) {
                const errorData = await response.json() as AkeneoErrorResponse;
                result.errors = errorData.errors || [{ message: response.statusText }];
                console.error(`Failed to remove category from product model ${modelCode}`, errorData);
            } else {
            }

            return result;

        } catch (error) {
            console.error(`Error removing category from product model ${modelCode}`, error);
            throw error;
        }
    }

    private async ensureAuthenticated(): Promise<void> {
        if (!this.accessToken) {
            await this.authenticate();
        }
    }
} 
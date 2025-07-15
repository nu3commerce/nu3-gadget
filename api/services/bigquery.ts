import { BigQuery } from '@google-cloud/bigquery';
import { ProductStock } from '../types';

export class BigQueryService {
    private bigquery: BigQuery;

    constructor(projectId: string, credentialsPath: string) {
        try {
            // Check if credentialsPath contains JSON content or is a file path
            if (credentialsPath.startsWith('{')) {
                // It's JSON content, parse it
                const credentials = JSON.parse(credentialsPath);
                this.bigquery = new BigQuery({
                    projectId,
                    credentials: credentials,
                });
            } else {
                // It's a file path
                this.bigquery = new BigQuery({
                    projectId,
                    keyFilename: credentialsPath,
                });
            }
        } catch (error) {
            console.error('BigQuery initialization failed', error);
            throw error;
        }
    }

    async executeQuery(sql: string): Promise<ProductStock[]> {
        try {
            const [rows] = await this.bigquery.query({
                query: sql,
                location: 'EU',
            });

            return rows.map(row => ({
                sku: row.sku,
                bestbefore: row.bestbefore,
                quantity: parseInt(row.quantity),
                product_id: row.product_id
            }));

        } catch (error) {
            console.error('BigQuery execution failed', error);
            throw error;
        }
    }

    async getProductsNearingExpiration(): Promise<ProductStock[]> {
        const query = `
      SELECT sku, min(best_before) bestbefore, CAST(sum(available_quantity) AS INT) quantity 
      FROM \`nu3-datalake.DS_50_bi_reports.product_stock_physical_sae_current_\`
      WHERE best_before < date_add(CAST(CURRENT_DATE() AS DATE), INTERVAL 3 MONTH) 
        AND best_before > CAST(CURRENT_DATE() AS DATE)
        AND available_quantity > 4 
        AND sku is not null
      GROUP BY sku
      ORDER BY bestbefore ASC
    `;

        return this.executeQuery(query);
    }

    async getExpiredProducts(): Promise<ProductStock[]> {
        const query = `
      SELECT product_id, sku, min(best_before) bestbefore, CAST(sum(available_quantity) AS INT) quantity 
      FROM \`nu3-datalake.DS_50_bi_reports.product_stock_physical_sae_current_\`
      WHERE best_before < CAST(CURRENT_DATE() AS DATE)
        AND available_quantity > 4 
        AND sku is not null
      GROUP BY sku, product_id
      ORDER BY bestbefore ASC
    `;

        return this.executeQuery(query);
    }
} 
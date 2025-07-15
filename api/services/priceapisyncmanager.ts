import { BigQuery } from '@google-cloud/bigquery';
import fetch from 'node-fetch';
import {
    PRICE_API_TOKEN,
    PRICE_API_ENDPOINT,
    BIGQUERY_DATASET_PRICEAPI,
    BIGQUERY_TABLE_PREFIX_PRICEAPI,
    PRICE_API_BATCH_SIZE,
    PRICE_API_COUNTRIES,
    config as globalConfig
} from '../config';

export class PriceApiSyncManager {
    private bigquery: BigQuery;

    constructor() {
        this.bigquery = new BigQuery({
            projectId: globalConfig.projectId,
            keyFilename: globalConfig.credentialsPath,
        });
    }

    public async run(): Promise<void> {
        for (const country of PRICE_API_COUNTRIES) {
            try {
                const eans = await this.fetchEligibleEANs(country);
                const batches = this.chunkArray(eans, PRICE_API_BATCH_SIZE);
                for (const batch of batches) {
                    const jobId = await this.submitBulkRequest(country, batch);
                    const resultRows = await this.pollAndDownloadResults(jobId);
                    await this.writeToBigQuery(country, resultRows);
                }
            } catch (error) {
                console.error(`[PriceApiSync] Error for country ${country}:`, error);
                // Continue with next country
            }
        }
    }

    private async fetchEligibleEANs(country: string): Promise<string[]> {
        // TODO: Adjust query to match your schema and requirements
        const query = `
      SELECT DISTINCT p.ean AS EAN
      FROM \
        \ 6bi_40_data_mart_raw.dbo.raw_akeneo_product p\
        JOIN bi_40_data_mart_raw.dbo.raw_akeneo_product_shop s ON s.sku = p.sku\
      WHERE s.shop_code = @country\
        AND p.brand NOT LIKE 'nu3%'\
        AND p.ean IS NOT NULL\
        AND (s.purchasable = 1 OR s.purchasable IS NULL)
    `;
        const options = {
            query,
            params: { country },
            location: 'EU',
        };
        const [rows] = await this.bigquery.query(options);
        return rows.map((row: any) => row.EAN);
    }

    private chunkArray<T>(arr: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    }

    private async submitBulkRequest(country: string, eans: string[]): Promise<string> {
        const endpoint = `${PRICE_API_ENDPOINT}/jobs`;
        const body = {
            token: PRICE_API_TOKEN,
            country,
            source: 'google-shopping',
            currentness: 'daily_updated',
            completeness: 'one_page',
            key: 'gtin',
            values: eans,
        };
        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`PriceAPI job submit failed: ${response.statusText}`);
        const data: any = await response.json();
        if (data.status !== 'new' || !data.job_id) throw new Error('PriceAPI did not return a job_id');
        return data.job_id;
    }

    private async pollAndDownloadResults(jobId: string): Promise<any[]> {
        // Poll for job completion
        let status = '';
        let attempts = 0;
        while (status !== 'finished' && attempts < 60) { // up to 10 minutes
            await this.sleep(10000); // 10 seconds
            const endpoint = `${PRICE_API_ENDPOINT}/jobs/${jobId}?token=${PRICE_API_TOKEN}`;
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`PriceAPI job status failed: ${response.statusText}`);
            const data: any = await response.json();
            status = data.status;
            if (status === 'finished') break;
            attempts++;
        }
        if (status !== 'finished') throw new Error('PriceAPI job did not finish in time');
        // Download results as CSV and parse in-memory
        const downloadUrl = `${PRICE_API_ENDPOINT}/products/bulk/${jobId}.csv?token=${PRICE_API_TOKEN}&format_option=row`;
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error(`PriceAPI download failed: ${response.statusText}`);
        const csvText = await response.text();
        return this.parseCsv(csvText);
    }

    private parseCsv(csv: string): any[] {
        // TODO: Use a proper CSV parser if needed
        const [headerLine, ...lines] = csv.split('\n').filter(Boolean);
        const headers = headerLine.split(',');
        return lines.map(line => {
            const values = line.split(',');
            const row: any = {};
            headers.forEach((h, i) => { row[h] = values[i]; });
            return row;
        });
    }

    private async writeToBigQuery(country: string, rows: any[]): Promise<void> {
        const table = `${BIGQUERY_DATASET_PRICEAPI}.${BIGQUERY_TABLE_PREFIX_PRICEAPI}${country}`;
        if (!rows.length) return;
        // TODO: Adjust schema/mapping as needed
        await this.bigquery.dataset(BIGQUERY_DATASET_PRICEAPI).table(`${BIGQUERY_TABLE_PREFIX_PRICEAPI}${country}`).insert(rows, { raw: true });
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 
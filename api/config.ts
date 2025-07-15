import { AppConfig } from './types';

const requiredEnvVars = [
  'GOOGLE_PROJECT_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'MAIL_ADDRESS_ERROR',
  'MAILING_LIST',
  'BIGQUERY_TABLE',
  'AKENEO_BASE_URL',
  'AKENEO_CLIENT_ID',
  'AKENEO_CLIENT_SECRET',
  'AKENEO_USERNAME',
  'AKENEO_PASSWORD',
  'PRICE_API_TOKEN',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export const config: AppConfig = {
  // Google Cloud Configuration
  projectId: process.env.GOOGLE_PROJECT_ID!,
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS!,

  // Email Configuration
  mailAddressError: process.env.MAIL_ADDRESS_ERROR!,
  mailingList: process.env.MAILING_LIST!,

  // Notification Messages
  noticeDE: 'Bitte beachte, dass dieser Artikel am xxx sein Mindesthaltbarkeitsdatum erreichen wird.',
  noticeFR: 'Veuillez noter que cet article atteindra sa date limite de consommation ou d\'utilisation le xxx',
  noticeIT: 'Si prega di notare che questo articolo ha come data di scadenza il xxx.',

  // BigQuery SQL Queries
  bigQuerySQLInit: `
    SELECT sku, min(best_before) bestbefore, CAST(sum(available_quantity) AS INT) quantity 
    FROM \`${process.env.BIGQUERY_TABLE!}\`
    WHERE best_before < date_add(CAST(CURRENT_DATE() AS DATE), INTERVAL 3 MONTH) 
      AND best_before > CAST(CURRENT_DATE() AS DATE)
      AND available_quantity > 4 
      AND sku is not null
    GROUP BY sku
  `,

  bigQuerySQLError: `
    SELECT product_id, sku, min(best_before) bestbefore, CAST(sum(available_quantity) AS INT) quantity 
    FROM \`${process.env.BIGQUERY_TABLE!}\`
    WHERE best_before < date_add(CAST(CURRENT_DATE() AS DATE), INTERVAL 3 MONTH) 
      AND best_before > CAST(CURRENT_DATE() AS DATE)
      AND available_quantity > 4 
      AND sku is not null
    GROUP BY sku
  `
};

// --- PriceApi Sync Config ---
export const PRICE_API_TOKEN = process.env.PRICE_API_TOKEN!;
export const PRICE_API_ENDPOINT = 'https://api.priceapi.com';
export const BIGQUERY_DATASET_PRICEAPI = 'DS_09_1_src_priceapi';
export const BIGQUERY_TABLE_PREFIX_PRICEAPI = 'src_priceapi_price_data_';
export const PRICE_API_BATCH_SIZE = 500;
export const PRICE_API_COUNTRIES = ['AT', 'CH', 'DE', 'FR']; 
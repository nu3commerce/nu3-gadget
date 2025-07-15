export interface ProductStock {
  sku: string;
  bestbefore: string | any; // Can be string or BigQuery date object with .value property
  quantity: number;
  product_id?: string;
}

export interface NotificationConfig {
  mailAddressError: string;
  mailingList: string;
  noticeDE: string;
  noticeFR: string;
  noticeIT: string;
}

export interface LogConfig {
  // No file-based logging - using console only
}

export interface DatabaseConfig {
  bigQuerySQLInit: string;
  bigQuerySQLError: string;
  sqlInitialQuery?: string;
  sqlErrorQuery?: string;
}

export interface AppConfig extends NotificationConfig, LogConfig, DatabaseConfig {
  projectId: string;
  credentialsPath: string;
} 
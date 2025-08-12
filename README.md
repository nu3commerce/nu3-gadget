# nu3 Platform (Gadget App Framework)

## Overview

**nu3 Platform** is an internal Gadget-based application framework designed to host and manage multiple required business apps for Shopify stores. It provides a unified environment for integrating and running various operational and compliance tools. The platform is built using Remix, Vite, and Shopify Polaris for a modern, embedded Shopify Admin experience.

**Best Before Notice Manager** is one of the included apps, automating the management of product best-before notices. **Template Sync** allows synchronization of Shopify templates between different stores. **Recipe Sync** manages recipe content synchronization from external sources to Shopify blog articles. The framework is designed to be extensible, allowing you to add and manage additional apps as business needs evolve.

## Features

- **App Framework**: Host and manage multiple business-critical apps within a single Gadget-based platform.
- **Best Before Notice Manager**: (Included app) Automatically identifies products nearing expiration using BigQuery, updates Akeneo PIM with localized best-before notices, and manages product categories (e.g., food saver).
- **PriceApi Sync**: (Included app) Syncs weekly market prices and competitor information from PriceAPI to BigQuery for LookerStudio dashboards.
- **Template Sync**: (Included app) Synchronizes Shopify templates between different stores, including product templates, collection templates, and other JSON templates. Features automatic section file synchronization and image transfer.
- **Recipe Sync**: (Included app) Synchronizes recipe content from external sources to Shopify blog articles, with support for multi-language content, metadata management, and featured images.
- **Shopify Integration**: Embedded app with deep integration into Shopify Admin, supporting shop, sync, and GDPR request models.
- **Akeneo PIM Integration**: Fetches and updates product data, manages categories, and synchronizes best-before notices.
- **BigQuery Integration**: Queries product stock and expiration data to drive business logic.
- **Automated Logging**: All major actions and errors are logged and viewable in the app UI, with separate log sections for each app on the home dashboard.
- **GDPR Compliance**: Handles Shopify GDPR requests for shop data.

## Tech Stack

- **Frameworks**: [Remix](https://remix.run/), [Vite](https://vitejs.dev/), [Gadget](https://gadget.dev/)
- **UI**: [Shopify Polaris](https://polaris.shopify.com/), [@gadgetinc/react-shopify-app-bridge](https://www.npmjs.com/package/@gadgetinc/react-shopify-app-bridge)
- **APIs**: Shopify Admin API, Akeneo PIM API, Google BigQuery
- **Languages**: TypeScript, React

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Yarn (v1)
- Access to required environment variables (see below)
- Access to Gadget, Shopify Partner, Akeneo, and Google Cloud accounts

### Installation
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd gadget
   ```
2. **Install dependencies:**
   ```sh
   yarn install
   ```

### Environment Variables
Create a `.env` file in the project root with the following variables:

```
GOOGLE_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=path-or-json-to-gcp-credentials
MAIL_ADDRESS_ERROR=your-error-email@example.com
MAILING_LIST=your-mailing-list@example.com
BIGQUERY_TABLE=your-bigquery-table
AKENEO_BASE_URL=https://your-akeneo-instance.com
AKENEO_CLIENT_ID=your-akeneo-client-id
AKENEO_CLIENT_SECRET=your-akeneo-client-secret
AKENEO_USERNAME=your-akeneo-username
AKENEO_PASSWORD=your-akeneo-password
PRICE_API_TOKEN=your-priceapi-token
```

### Shopify App Configuration
- The app is configured as an embedded Shopify app. See `shopify.app.toml` for production settings.
- Required Shopify API scopes are set in `settings.gadget.ts`.

### Running the App
- **Development:**
  ```sh
  yarn shopify:dev
  ```
- **Build for Production:**
  ```sh
  yarn build
  ```
- **Deploy to Shopify:**
  ```sh
  yarn shopify:deploy
  ```

## Usage
- Access the platform from your Shopify Admin (must be installed as a Shopify embedded app).
- The main dashboard displays the included apps (e.g., Best Before Notice Manager, PriceApi Sync, Recipe Sync) and logs of recent actions.
- Logs for each app are shown in separate sections for easy monitoring and troubleshooting.
- All major actions (e.g., notice updates, recipe syncs, errors) are logged and viewable in the UI.
- The framework is extensible—additional apps can be added as needed.

## Project Structure
- `api/` - Backend logic, integrations, and models
- `web/` - Frontend UI (Remix, Polaris, Gadget React)
- `accessControl/` - Permissions and access control
- `settings.gadget.ts` - App and plugin configuration
- `shopify.app.toml` - Shopify app settings

## Template Sync

The Template Sync feature allows you to synchronize Shopify templates between different stores. This is particularly useful for maintaining consistent product templates, collection templates, and other JSON templates across multiple Shopify stores.

### Features

- Select source shop and theme
- Browse and search templates from the source theme
- Select multiple templates to sync
- Select multiple target shops
- Automatic synchronization of required section files
- Automatic transfer of images used in templates
- Detailed error reporting and logging

### How It Works

1. **Select Source**: Choose the source shop and theme containing the templates you want to sync.
2. **Select Templates**: Browse and select the templates you want to synchronize.
3. **Select Targets**: Choose the target shops where you want to apply these templates.
4. **Sync**: Initiate the synchronization process.

The system will:
- Copy the selected templates to the target shops
- Ensure all required section files exist in the target themes
- Transfer any images referenced in the templates
- Log the results of the operation

### Technical Implementation

The Template Sync feature is implemented using the following components:

- **TemplateSyncManager**: A service that handles the synchronization logic
- **API Routes**: Endpoints for fetching themes and templates
- **UI Component**: A user-friendly interface for the sync operation

### Error Handling

The Template Sync feature includes robust error handling:

- If a section file is missing in the target theme, it will be copied from the source theme
- If a section file is missing in both source and target themes, the operation will continue but log a warning
- If an image is referenced in a template, it will be transferred to the target shop
- Any errors during the sync process are logged and displayed to the user

### Limitations

- Templates can only be synced between shops that are connected to the app
- The target theme must be the main (published) theme of the shop
- Large templates with many sections or images may take longer to sync

### Troubleshooting

If you encounter issues with the Template Sync feature:

1. Check the logs on the dashboard for detailed error messages
2. Ensure all shops have the necessary API access
3. Verify that the templates exist in the source theme
4. Check that the target shops have a published theme

### Security

The Template Sync feature includes several security measures:

- Cross-shop data access prevention
- Session validation
- Shop ID validation
- Proper error handling to prevent information leakage

## PriceApi Sync

The PriceApi Sync feature automatically synchronizes weekly market prices and competitor information from PriceAPI to BigQuery for LookerStudio dashboards. This tool runs on a scheduled basis to keep pricing data up-to-date for business intelligence and competitive analysis.

### Features

- **Automated Scheduling**: Runs weekly on Mondays at 06:00 UTC
- **Multi-Country Support**: Fetches pricing data for multiple countries (AT, CH, DE, FR, IT)
- **Akeneo Integration**: Filters products based on purchasability status from Akeneo PIM
- **Bulk Processing**: Handles large product catalogs efficiently with batch processing
- **BigQuery Storage**: Stores pricing data in BigQuery for analytics and reporting
- **Error Handling**: Comprehensive error logging and country-level fault tolerance

### How It Works

1. **Product Filtering**: Retrieves eligible products from Akeneo PIM based on country-specific purchasability rules
2. **EAN Extraction**: Extracts EAN codes from eligible products for price lookup
3. **Batch Processing**: Splits EAN codes into manageable batches for API efficiency
4. **PriceAPI Integration**: Submits bulk requests to PriceAPI for each country
5. **Result Processing**: Polls for job completion and downloads CSV results
6. **Data Storage**: Processes and stores pricing data in BigQuery tables

### Technical Implementation

The PriceApi Sync feature uses:

- **PriceApiSyncManager**: Core service handling the synchronization logic
- **Scheduled Execution**: Gadget scheduler trigger running weekly
- **Akeneo Integration**: Fetches product data and purchasability status
- **PriceAPI Integration**: Bulk price lookup service
- **BigQuery Integration**: Data warehouse for pricing analytics
- **Country-Specific Logic**: Handles different locale and purchasability rules per country

### Configuration

The feature requires the following environment variables:

```
PRICE_API_TOKEN=your-priceapi-token
GOOGLE_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=path-or-json-to-gcp-credentials
AKENEO_BASE_URL=https://your-akeneo-instance.com
AKENEO_CLIENT_ID=your-akeneo-client-id
AKENEO_CLIENT_SECRET=your-akeneo-client-secret
AKENEO_USERNAME=your-akeneo-username
AKENEO_PASSWORD=your-akeneo-password
```

### Country-Specific Rules

The system applies different rules for each country:

- **AT, CH, DE**: Products must be marked as "purchasable" in German locale
- **FR**: Products must be marked as "purchasable" in French locale
- **IT**: Products must be marked as "disabled" in Italian locale

### Data Flow

1. **Akeneo Query**: Fetches all third-party products from Akeneo PIM
2. **Country Filtering**: Applies country-specific purchasability filters
3. **EAN Collection**: Extracts EAN codes from eligible products
4. **Batch Creation**: Splits EANs into batches (configurable batch size)
5. **PriceAPI Jobs**: Submits bulk price lookup jobs to PriceAPI
6. **Result Polling**: Monitors job completion status
7. **Data Download**: Downloads CSV results from completed jobs
8. **BigQuery Insert**: Stores pricing data in country-specific BigQuery tables

### Monitoring and Logging

- All executions are logged to the Gadget logs model
- Success/failure status is tracked for each run
- Country-level error handling prevents single country failures from stopping the entire process
- Detailed error messages are captured for troubleshooting

### Troubleshooting

If you encounter issues with PriceApi Sync:

1. Check the main dashboard logs for detailed error messages
2. Verify PriceAPI token validity and rate limits
3. Ensure Akeneo credentials are valid and have proper permissions
4. Check BigQuery dataset and table permissions
5. Verify network connectivity to external APIs
6. Review country-specific product filtering rules

## Recipe Sync

The Recipe Sync feature manages the synchronization of recipe content from external sources to Shopify blog articles. This tool was migrated from Azure Functions to the Gadget platform, maintaining all existing functionality while leveraging Gadget's integrated Shopify APIs.

### Features

- **Recipe Synchronization**: Creates and updates Shopify blog articles from external recipe data
- **Multi-language Support**: Handles recipe content in multiple languages with proper blog routing
- **Metadata Management**: Manages recipe metafields, tags, and featured images
- **Idempotent Operations**: Safe to retry operations without duplication
- **Error Handling**: Comprehensive error logging and reporting
- **Web Interface**: Management dashboard for monitoring sync activity

### How It Works

1. **API Endpoint**: External systems send recipe data to the Recipe Sync API endpoint
2. **Data Processing**: The system processes the recipe payload and determines if it's a new recipe or an update
3. **Shopify Integration**: Creates or updates the corresponding Shopify blog article
4. **Metadata Sync**: Adds recipe-specific metafields and featured images
5. **Logging**: Records the operation results for monitoring and troubleshooting

### API Usage

**Endpoint:**
```
POST /api/actions/RecipeSync
```

**Request Format:**
```json
{
  "recipeId": "recipe-123",
  "handle": "delicious-recipe",
  "type": "main-course",
  "language": "en",
  "payload": {
    "id": "recipe-123",
    "title": "Delicious Recipe",
    "content": "<p>Recipe content...</p>",
    "summary": "A delicious recipe",
    "tags": ["healthy", "quick"],
    "featuredImage": "https://example.com/image.jpg",
    "language": "en"
  }
}
```

### Data Models

The Recipe Sync feature uses two main data models:

- **recipeContent**: Stores recipe content data (replaces Azure Table Storage "Content" table)
  - `shop`: Shop identifier
  - `recipeId`: Unique recipe identifier
  - `handle`: Recipe URL handle
  - `type`: Recipe type/category
  - `payload`: Recipe data (JSON)
  - `externalArticleId`: Shopify article ID
  - `language`: Recipe language

- **recipeBlogType**: Stores blog type mappings (replaces Azure Table Storage "BlogType" table)
  - `shop`: Shop identifier
  - `type`: Blog type
  - `externalBlogId`: Shopify blog ID

### Technical Implementation

The Recipe Sync feature is implemented using:

- **RecipeSyncManager**: Core service handling synchronization logic
- **Shopify API Integration**: Native Shopify API access via Gadget's shopifyConfig service
- **Data Models**: Gadget models replacing Azure Table Storage
- **API Action**: HTTP endpoint replacing Azure Function trigger
- **Web Interface**: Management dashboard for monitoring and troubleshooting

### Migration from Azure

The Recipe Sync tool was successfully migrated from Azure Functions to Gadget:

**Before (Azure):**
- Azure Functions HTTP trigger
- Azure Table Storage (Content and BlogType tables)
- Manual Shopify API client setup
- Environment variable configuration

**After (Gadget):**
- Gadget Action API endpoint
- Gadget data models (recipeContent and recipeBlogType)
- Integrated Shopify client via shopifyConfig service
- Gadget environment configuration

### Benefits of Migration

- **Simplified Architecture**: No need for separate Azure resources
- **Integrated Logging**: Built-in logging and monitoring via Gadget logs model
- **Native Shopify Integration**: Direct access to Shopify APIs through Gadget
- **Web Interface**: Built-in management interface for monitoring
- **Scalability**: Automatic scaling with Gadget platform

### Troubleshooting

If you encounter issues with Recipe Sync:

1. Check the Recipe Sync dashboard for detailed logs and error messages
2. Verify that the recipe data format matches the expected API schema
3. Ensure blog type mappings are configured in the recipeBlogType model
4. Check that the target Shopify shop has the necessary blog structure
5. Review the logs model for detailed error information

## Development
- TypeScript strict mode is enabled (`tsconfig.json`).
- Vite is used for fast builds and HMR (`vite.config.mts`).
- Custom UI components are in `web/components/`.
- Main business logic for best-before management is in `api/services/bestbeforenoticemanager.ts`.
- Main business logic for PriceApi Sync is in `api/services/priceapisyncmanager.ts`.
- Main business logic for Recipe Sync is in `api/services/recipesyncmanager.ts`.
- Add new apps by extending the framework with additional modules and UI components.

## Logging & Troubleshooting
- All actions and errors are logged to the `logs` model and viewable in the app UI.
- The home dashboard displays logs for each app in separate sections.
- For API reference, see [Gadget API docs](https://docs.gadget.dev/api/nu3).

## License
This project is **internal** and **UNLICENSED**. Do not distribute.
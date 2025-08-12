import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, Page, Layout, Text, Button, Banner, DataTable } from "@shopify/polaris";
import { api } from "../api";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get recent recipe sync logs
  const logs = await api.logs.findMany({
    filter: {
      source: { equals: "RecipeSync" }
    },
    sort: { createdAt: "Descending" },
    first: 10
  });

  return json({ logs });
};

export default function RecipeSync() {
  const { logs } = useLoaderData<typeof loader>();

  const logRows = logs.map((log: any) => [
    log.createdAt.toLocaleString(),
    log.status,
    log.message,
    log.error || "-"
  ]);

  return (
    <Page title="Recipe Sync">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h2">
                Recipe Sync Manager
              </Text>
              <div style={{ marginTop: "16px" }}>
                <Text as="p">
                  The Recipe Sync tool automatically synchronizes recipe content from external sources 
                  to Shopify blog articles. It handles creating and updating articles with proper 
                  metadata, tags, and featured images.
                </Text>
              </div>
              <div style={{ marginTop: "16px" }}>
                <Banner tone="info">
                  <p>
                    Recipe sync is triggered via API endpoint. The system will automatically 
                    create or update blog articles based on the recipe data received.
                  </p>
                </Banner>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h2">
                Recent Activity
              </Text>
              <div style={{ marginTop: "16px" }}>
                {logs.length > 0 ? (
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text']}
                    headings={['Date', 'Status', 'Message', 'Error']}
                    rows={logRows}
                  />
                ) : (
                  <Text as="p" tone="subdued">
                    No recent recipe sync activity found.
                  </Text>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
import { AutoTable } from "@gadgetinc/react/auto/polaris";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Layout,
  Link,
  Page,
  Text,
} from "@shopify/polaris";
import { api } from "../api";

export default function Index() {
  // Remove manual log fetching logic
  return (
    <Page title="nu3 Platform">
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h6">
              Best Before Notice Manager
            </Text>
            <AutoTable
              model={api.logs}
              columns={["createdAt", "status", "message", "error", "source"]}
              initialSort={{ createdAt: "Descending" }}
              paginate={false}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

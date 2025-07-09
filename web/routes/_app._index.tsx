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
  return (
    <Page title="nu3 Platform">
      <Layout>
        <Layout.Section>
          <Banner tone="success">
            <Text variant="bodyMd" as="p">
              Successfully connected your nu3 Platform to Shopify
            </Text>
          </Banner>
        </Layout.Section>
      </Layout>
    </Page >
  );
}

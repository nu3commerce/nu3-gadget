import { useCallback, useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Select,
  Checkbox,
  Button,
  Banner,
  TextField,
  Box,
  FormLayout,
  Spinner,
  Modal,
  Frame,
  BlockStack,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { api } from "../api";


// Define types for our data structures
type Shop = {
  id: string;
  myshopifyDomain: string | null;
  name: string | null;
};

type Theme = {
  id: number;
  name: string;
  role: string;
};

type Template = {
  key: string;
  value: string;
};


export default function Template() {
  const appBridge = useAppBridge();

  // State for shops
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>("");

  // State for themes
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("");

  // State for templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // State for target shops
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  // Fetch shops from configuration
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await api.TemplateSync({
          action: "getShops"
        });

        if (response.success && response.data) {
          setShops(response.data);
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
        setError("Failed to fetch shops");
      }
    };

    fetchShops();
  }, []);

  // Fetch themes when shop changes
  const fetchThemes = useCallback(async (shopDomain: string) => {
    if (!shopDomain) return;

    setIsLoading(true);
    setError("");
    setThemes([]);
    setSelectedTheme("");
    setTemplates([]);
    setFilteredTemplates([]);
    setSelectedTemplates([]);

    try {
      const response = await api.TemplateSync({
        action: "getThemes",
        shopDomain
      });
      if (response.success && response.data) {
        setThemes(response.data.filter((theme: Theme) => theme.role !== "unpublished"));
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
      setError("Failed to fetch themes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch templates when theme changes
  const fetchTemplates = useCallback(async (shopDomain: string, themeId: string) => {
    if (!shopDomain || !themeId) return;

    setIsLoading(true);
    setError("");
    setTemplates([]);
    setFilteredTemplates([]);
    setSelectedTemplates([]);

    try {
      const response = await api.TemplateSync({
        action: "getTemplates",
        shopDomain,
        themeId
      });
      if (response.success && response.data) {
        setTemplates(response.data);
        setFilteredTemplates(response.data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setError("Failed to fetch templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle shop selection
  const handleShopChange = useCallback((value: string) => {
    setSelectedShop(value);
    fetchThemes(value);
  }, [fetchThemes]);

  // Handle theme selection
  const handleThemeChange = useCallback((value: string) => {
    setSelectedTheme(value);
    fetchTemplates(selectedShop, value);
  }, [fetchTemplates, selectedShop]);

  // Handle template search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);

    if (value.length < 3) {
      setFilteredTemplates(templates);
      return;
    }

    const filtered = templates.filter(template =>
      template.key.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [templates]);

  // Handle template selection
  const handleTemplateSelection = useCallback((templateKey: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplates(prev => [...prev, templateKey]);
    } else {
      setSelectedTemplates(prev => prev.filter(key => key !== templateKey));
    }
  }, []);

  // Handle target shop selection
  const handleTargetSelection = useCallback((shopId: string, checked: boolean) => {
    if (checked) {
      setSelectedTargets(prev => [...prev, shopId]);
    } else {
      setSelectedTargets(prev => prev.filter(id => id !== shopId));
    }
  }, []);

  // Handle sync button click
  const handleSyncClick = useCallback(() => {
    if (selectedTemplates.length === 0 || selectedTargets.length === 0) {
      setError("Please select at least one template and one target shop.");
      return;
    }

    setConfirmModalOpen(true);
  }, [selectedTemplates, selectedTargets]);

  // Handle sync confirmation
  const handleSyncConfirm = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");
    setConfirmModalOpen(false);

    try {
      const response = await api.TemplateSync({
        action: "sync",
        sourceShopDomain: selectedShop,
        sourceThemeId: selectedTheme,
        templateKeys: selectedTemplates.reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        targetShopDomains: selectedTargets.reduce((acc, id) => ({ ...acc, [id]: true }), {}),
      });

      if (response.success) {
        setSuccess(response.message || "Templates synced successfully!");
      } else {
        setError(response.error || "Sync failed");
      }

      setSelectedTemplates([]);
      setSelectedTargets([]);
    } catch (error) {
      console.error("Error syncing templates:", error);
      setError("Failed to sync templates");
    } finally {
      setIsLoading(false);
    }
  }, [selectedShop, selectedTheme, selectedTemplates, selectedTargets]);

  return (
    <Page title="Template">
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical">{error}</Banner>
          </Layout.Section>
        )}

        {success && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSuccess("")}>
              {success}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Source Shop and Theme</Text>

              <FormLayout>
                <Select
                  label="Select Shop"
                  options={shops.map(shop => ({
                    label: shop.name || shop.myshopifyDomain || "",
                    value: shop.myshopifyDomain || shop.id,
                  }))}
                  onChange={handleShopChange}
                  value={selectedShop}
                  disabled={isLoading}
                />

                <Select
                  label="Select Theme"
                  options={themes.map(theme => ({
                    label: `${theme.name} (${theme.role})`,
                    value: theme.id.toString(),
                  }))}
                  onChange={handleThemeChange}
                  value={selectedTheme}
                  disabled={!selectedShop || isLoading}
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        {selectedTheme && (
          <Layout.Section>
            <Layout>
              <Layout.Section variant="oneHalf">
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">Select Templates</Text>

                    <TextField
                      label="Search Templates"
                      value={searchQuery}
                      onChange={handleSearch}
                      autoComplete="off"
                      disabled={isLoading}
                    />

                    <div style={{ maxHeight: "500px", overflow: "auto" }}>
                      {isLoading ? (
                        <div style={{ padding: "16px", textAlign: "center" }}>
                          <Spinner size="large" />
                        </div>
                      ) : filteredTemplates.length > 0 ? (
                        <BlockStack gap="300">
                          {filteredTemplates
                            .sort((a, b) => a.key.localeCompare(b.key))
                            .map(template => {
                              const templateName = template.key.split('/').pop();
                              return (
                                <Checkbox
                                  key={template.key}
                                  label={templateName}
                                  checked={selectedTemplates.includes(template.key)}
                                  onChange={(checked) => handleTemplateSelection(template.key, checked)}
                                />
                              );
                            })}
                        </BlockStack>
                      ) : (
                        <Text as="p" variant="bodyMd" tone="subdued">
                          No templates found
                        </Text>
                      )}
                    </div>
                  </BlockStack>
                </Card>
              </Layout.Section>

              <Layout.Section variant="oneHalf">
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">Select Target Shops</Text>

                    <div style={{ maxHeight: "500px", overflow: "auto" }}>
                      <BlockStack gap="300">
                        {shops
                          .filter(shop => (shop.myshopifyDomain || shop.id) !== selectedShop)
                          .map(shop => (
                            <Checkbox
                              key={shop.id}
                              label={shop.name || shop.myshopifyDomain}
                              checked={selectedTargets.includes(shop.myshopifyDomain || shop.id)}
                              onChange={(checked) => handleTargetSelection(shop.myshopifyDomain || shop.id, checked)}
                              disabled={isLoading || selectedTemplates.length === 0}
                            />
                          ))}
                      </BlockStack>
                    </div>

                    <div style={{ paddingTop: "16px" }}>
                      <Text as="p" variant="bodyMd" tone="critical">
                        Be careful, existing template(s) in the target store(s) will be overwritten.
                      </Text>
                    </div>

                    <Button
                      variant="primary"
                      tone="success"
                      onClick={handleSyncClick}
                      disabled={
                        isLoading ||
                        selectedTemplates.length === 0 ||
                        selectedTargets.length === 0
                      }
                      fullWidth
                    >
                      {isLoading ? "Syncing..." : "Sync Templates"}
                    </Button>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>
          </Layout.Section>
        )}

        {!selectedTheme && !isLoading && (
          <Layout.Section>
            <Card>
              <div style={{ padding: "16px", textAlign: "center" }}>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Please select a shop and theme to continue.
                </Text>
              </div>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Template Sync"
        primaryAction={{
          content: "Sync Templates",
          onAction: handleSyncConfirm,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setConfirmModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p" variant="bodyMd">
            You are about to sync {selectedTemplates.length} template(s) with {selectedTargets.length} target shop(s).
            This will overwrite any existing templates with the same names in the target shops.
            Are you sure you want to continue?
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
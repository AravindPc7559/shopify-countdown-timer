import { useState } from "react";
import {
  Card,
  Page,
  Layout,
  TextContainer,
  Stack,
  Text,
  Button,
  Badge,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ["timers"],
    queryFn: async () => {
      const response = await fetch("/api/timers");
      if (!response.ok) throw new Error("Failed to fetch timers");
      return response.json();
    },
  });

  const timers = data?.timers || [];
  const activeTimers = timers.filter((t) => t.status === "active").length;
  const totalImpressions = timers.reduce((sum, t) => sum + (t.impressions || 0), 0);

  return (
    <Page>
      <TitleBar
        title={t("HomePage.title")}
        primaryAction={{
          content: t("HomePage.createTimer"),
          onAction: () => navigate("/timers/new"),
        }}
      />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text as="h1" variant="headingLg">
                {t("HomePage.welcome")}
              </Text>
              <Text as="p" variant="bodyMd" color="subdued">
                {t("HomePage.description")}
              </Text>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Layout>
            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Text as="p" variant="headingMd" color="subdued">
                    {t("HomePage.totalTimers")}
                  </Text>
                  <Text as="h2" variant="heading2xl">
                    {isLoading ? "-" : timers.length}
                  </Text>
                </Stack>
              </Card>
            </Layout.Section>
            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Text as="p" variant="headingMd" color="subdued">
                    {t("HomePage.activeTimers")}
                  </Text>
                  <Text as="h2" variant="heading2xl">
                    {isLoading ? "-" : activeTimers}
                  </Text>
                </Stack>
              </Card>
            </Layout.Section>
            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Text as="p" variant="headingMd" color="subdued">
                    {t("HomePage.totalImpressions")}
                  </Text>
                  <Text as="h2" variant="heading2xl">
                    {isLoading ? "-" : totalImpressions.toLocaleString()}
                  </Text>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        <Layout.Section>
          {isLoading ? (
            <Card sectioned>
              <Text>{t("HomePage.loading")}</Text>
            </Card>
          ) : timers.length === 0 ? (
            <Card sectioned>
              <EmptyState
                heading={t("HomePage.noTimers")}
                action={{
                  content: t("HomePage.createFirstTimer"),
                  onAction: () => navigate("/timers/new"),
                }}
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              >
                <p>{t("HomePage.noTimersDescription")}</p>
              </EmptyState>
            </Card>
          ) : (
            <Card
              title={t("HomePage.recentTimers")}
              primaryFooterAction={{
                content: t("HomePage.viewAllTimers"),
                onAction: () => navigate("/timers"),
              }}
            >
              <Stack vertical spacing="tight">
                {timers.slice(0, 5).map((timer) => (
                  <div
                    key={timer._id}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid #e1e3e5",
                    }}
                  >
                    <Stack alignment="center" distribution="equalSpacing">
                      <Stack.Item>
                        <Stack vertical spacing="extraTight">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {timer.name}
                          </Text>
                          <Stack spacing="tight">
                            <Badge
                              status={
                                timer.status === "active"
                                  ? "success"
                                  : timer.status === "scheduled"
                                  ? "info"
                                  : "critical"
                              }
                            >
                              {timer.status === "active"
                                ? t("HomePage.statusActive")
                                : timer.status === "scheduled"
                                ? t("HomePage.statusScheduled")
                                : t("HomePage.statusExpired")}
                            </Badge>
                            <Text as="span" variant="bodySm" color="subdued">
                              {timer.type === "fixed"
                                ? t("HomePage.typeFixed")
                                : t("HomePage.typeEvergreen")}
                            </Text>
                          </Stack>
                        </Stack>
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          size="slim"
                          onClick={() => navigate(`/timers/${timer._id}`)}
                        >
                          {t("HomePage.edit")}
                        </Button>
                      </Stack.Item>
                    </Stack>
                  </div>
                ))}
              </Stack>
            </Card>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Text as="h2" variant="headingMd">
                {t("HomePage.getStarted")}
              </Text>
              <Stack vertical spacing="tight">
                <Text as="p" variant="bodyMd">
                  {t("HomePage.step1")}
                </Text>
                <Text as="p" variant="bodyMd">
                  {t("HomePage.step2")}
                </Text>
                <Text as="p" variant="bodyMd">
                  {t("HomePage.step3")}
                </Text>
              </Stack>
              <Button
                primary
                onClick={() => navigate("/timers/new")}
              >
                {t("HomePage.createTimer")}
              </Button>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

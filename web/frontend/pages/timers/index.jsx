import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
  Button,
  EmptyState,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function TimersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["timers"],
    queryFn: async () => {
      const response = await fetch("/api/timers");
      if (!response.ok) throw new Error("Failed to fetch timers");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (timerId) => {
      const response = await fetch(`/api/timers/${timerId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete timer");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["timers"]);
      shopify.toast.show(t("TimersPage.timerDeleted"));
    },
    onError: () => {
      shopify.toast.show(t("TimersPage.errorDeletingTimer"), {
        isError: true,
      });
    },
  });

  const handleDelete = (timerId) => {
    if (window.confirm(t("TimersPage.confirmDelete"))) {
      deleteMutation.mutate(timerId);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { status: "success", children: t("TimersPage.statusActive") },
      scheduled: {
        status: "info",
        children: t("TimersPage.statusScheduled"),
      },
      expired: { status: "critical", children: t("TimersPage.statusExpired") },
    };
    return <Badge {...statusMap[status]} />;
  };

  const rows = data?.timers?.map((timer) => [
    timer.name,
    timer.type === "fixed" ? t("TimersPage.typeFixed") : t("TimersPage.typeEvergreen"),
    timer.targetType === "all"
      ? t("TimersPage.targetAll")
      : timer.targetType === "products"
      ? `${t("TimersPage.targetProducts")} (${timer.targetIds.length})`
      : `${t("TimersPage.targetCollections")} (${timer.targetIds.length})`,
    timer.impressions || 0,
    getStatusBadge(timer.status),
    <div key={timer._id}>
      <Button
        size="slim"
        onClick={() => navigate(`/timers/${timer._id}`)}
      >
        {t("TimersPage.edit")}
      </Button>
      <Button
        size="slim"
        tone="critical"
        onClick={() => handleDelete(timer._id)}
        loading={deleteMutation.isLoading}
      >
        {t("TimersPage.delete")}
      </Button>
    </div>,
  ]) || [];

  return (
    <Page>
      <TitleBar
        title={t("TimersPage.title")}
        primaryAction={{
          content: t("TimersPage.createTimer"),
          onAction: () => navigate("/timers/new"),
        }}
      />
      <Layout>
        <Layout.Section>
          {isLoading ? (
            <Card sectioned>
              <Text>{t("TimersPage.loading")}</Text>
            </Card>
          ) : error ? (
            <Card sectioned>
              <EmptyState
                heading={t("TimersPage.errorHeading")}
                action={{
                  content: t("TimersPage.retry"),
                  onAction: () => queryClient.invalidateQueries(["timers"]),
                }}
              >
                <p>{t("TimersPage.errorMessage")}</p>
              </EmptyState>
            </Card>
          ) : rows.length === 0 ? (
            <Card sectioned>
              <EmptyState
                heading={t("TimersPage.noTimers")}
                action={{
                  content: t("TimersPage.createTimer"),
                  onAction: () => navigate("/timers/new"),
                }}
              >
                <p>{t("TimersPage.noTimersDescription")}</p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "numeric",
                  "text",
                  "text",
                ]}
                headings={[
                  t("TimersPage.tableName"),
                  t("TimersPage.tableType"),
                  t("TimersPage.tableTarget"),
                  t("TimersPage.tableImpressions"),
                  t("TimersPage.tableStatus"),
                  t("TimersPage.tableActions"),
                ]}
                rows={rows}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
  Button,
  EmptyState,
  Spinner,
  Banner,
  Modal,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import api from "../../utils/api.js";

export default function TimersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [timers, setTimers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [timerToDelete, setTimerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTimers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get("/timers");
      setTimers(data.timers || []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimers();
  }, []);

  const handleDeleteClick = (timerId, timerName) => {
    setTimerToDelete({ id: timerId, name: timerName });
    setDeleteModalActive(true);
  };

  const handleDeleteConfirm = async () => {
    if (!timerToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/timers/${timerToDelete.id}`);
      shopify.toast.show(t("TimersPage.timerDeleted"));
      setDeleteModalActive(false);
      setTimerToDelete(null);
      await fetchTimers();
    } catch (err) {
      shopify.toast.show(err.message || t("TimersPage.errorDeletingTimer"), {
        isError: true,
      });
    } finally {
      setIsDeleting(false);
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

  const formatTarget = (timer) => {
    if (timer.targetType === "all") {
      return t("TimersPage.targetAll");
    }
    const count = timer.targetIds?.length || 0;
    const type =
      timer.targetType === "products"
        ? t("TimersPage.targetProducts")
        : t("TimersPage.targetCollections");
    return `${type} (${count})`;
  };

  const rows = timers.map((timer) => [
    timer.name,
    timer.type === "fixed"
      ? t("TimersPage.typeFixed")
      : t("TimersPage.typeEvergreen"),
    formatTarget(timer),
    timer.impressions || 0,
    getStatusBadge(timer.status),
    <div key={timer._id} style={{ display: "flex", gap: "8px" }}>
      <Button size="slim" onClick={() => navigate(`/timers/${timer._id}`)}>
        {t("TimersPage.edit")}
      </Button>
      <Button
        size="slim"
        tone="critical"
        onClick={() => handleDeleteClick(timer._id, timer.name)}
        loading={isDeleting && timerToDelete?.id === timer._id}
      >
        {t("TimersPage.delete")}
      </Button>
    </div>,
  ]);

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
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <Spinner size="large" />
                <Text as="p" tone="subdued" style={{ marginTop: "1rem" }}>
                  {t("TimersPage.loading")}
                </Text>
              </div>
            </Card>
          ) : error ? (
            <Card sectioned>
              <Banner status="critical" onDismiss={() => setError(null)}>
                <p>{error.message || t("TimersPage.errorMessage")}</p>
              </Banner>
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <Button onClick={fetchTimers}>{t("TimersPage.retry")}</Button>
              </div>
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

      <Modal
        open={deleteModalActive}
        onClose={() => {
          setDeleteModalActive(false);
          setTimerToDelete(null);
        }}
        title={t("TimersPage.confirmDelete")}
        primaryAction={{
          content: t("TimersPage.delete"),
          destructive: true,
          onAction: handleDeleteConfirm,
          loading: isDeleting,
        }}
        secondaryActions={[
          {
            content: t("TimerForm.cancel"),
            onAction: () => {
              setDeleteModalActive(false);
              setTimerToDelete(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            {timerToDelete && (
              <>
                Are you sure you want to delete "{timerToDelete.name}"? This
                action cannot be undone.
              </>
            )}
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

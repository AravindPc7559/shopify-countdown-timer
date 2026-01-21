import { useState, useEffect, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Banner,
  Stack,
  Button,
  Spinner,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
import api from "../../utils/api.js";

export default function TimerFormPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const [formData, setFormData] = useState({
    name: "",
    type: "fixed",
    startDate: "",
    endDate: "",
    duration: "",
    targetType: "all",
    targetIds: [],
    appearance: {
      backgroundColor: "#000000",
      textColor: "#FFFFFF",
      position: "top",
      text: "Hurry! Sale ends in",
    },
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [fetchError, setFetchError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTimer = async () => {
    if (isNew) return;

    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await api.get(`/timers/${id}`);
      const timer = data.timer;

      setFormData({
        name: timer.name || "",
        type: timer.type || "fixed",
        startDate: timer.startDate
          ? new Date(timer.startDate).toISOString().slice(0, 16)
          : "",
        endDate: timer.endDate
          ? new Date(timer.endDate).toISOString().slice(0, 16)
          : "",
        duration: timer.duration?.toString() || "",
        targetType: timer.targetType || "all",
        targetIds: timer.targetIds || [],
        appearance: {
          backgroundColor: timer.appearance?.backgroundColor || "#000000",
          textColor: timer.appearance?.textColor || "#FFFFFF",
          position: timer.appearance?.position || "top",
          text: timer.appearance?.text || "Hurry! Sale ends in",
        },
      });
    } catch (err) {
      setFetchError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimer();
  }, [id]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("TimerForm.errorNameRequired");
    }

    if (formData.type === "fixed") {
      if (!formData.startDate) {
        newErrors.startDate = t("TimerForm.errorStartDateRequired");
      }
      if (!formData.endDate) {
        newErrors.endDate = t("TimerForm.errorEndDateRequired");
      }
      if (
        formData.startDate &&
        formData.endDate &&
        formData.endDate <= formData.startDate
      ) {
        newErrors.endDate = t("TimerForm.errorEndDateAfterStart");
      }
    } else {
      const duration = parseInt(formData.duration);
      if (!formData.duration || isNaN(duration) || duration <= 0) {
        newErrors.duration = t("TimerForm.errorDurationRequired");
      }
    }

    if (formData.targetType !== "all" && formData.targetIds.length === 0) {
      newErrors.targetIds = t("TimerForm.errorTargetIdsRequired");
    }

    return newErrors;
  }, [formData, t]);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const submitData = {
      name: formData.name.trim(),
      type: formData.type,
      targetType: formData.targetType,
      targetIds: formData.targetIds,
      appearance: formData.appearance,
    };

    if (formData.type === "fixed") {
      submitData.startDate = new Date(formData.startDate).toISOString();
      submitData.endDate = new Date(formData.endDate).toISOString();
    } else {
      submitData.duration = parseInt(formData.duration);
    }

    try {
      setIsSaving(true);
      if (isNew) {
        await api.post("/timers", submitData);
      } else {
        await api.put(`/timers/${id}`, submitData);
      }

      shopify.toast.show(
        isNew ? t("TimerForm.timerCreated") : t("TimerForm.timerUpdated")
      );
      navigate("/timers");
    } catch (err) {
      setSubmitError(err.message);
      shopify.toast.show(err.message, { isError: true });
    } finally {
      setIsSaving(false);
    }
  }, [formData, isNew, id, validateForm, t, shopify, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAppearanceChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value },
    }));
  };

  if (isLoading && !isNew) {
    return (
      <Page>
        <TitleBar title={t("TimerForm.title")} />
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <Spinner size="large" />
                <Text as="p" tone="subdued" style={{ marginTop: "1rem" }}>
                  {t("TimerForm.loading")}
                </Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (fetchError && !isNew) {
    return (
      <Page>
        <TitleBar title={t("TimerForm.title")} />
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <Banner status="critical">
                <p>{fetchError.message || "Failed to load timer"}</p>
              </Banner>
              <div style={{ marginTop: "1rem" }}>
                <Button onClick={() => navigate("/timers")}>
                  {t("TimerForm.cancel")}
                </Button>
                <Button onClick={fetchTimer} style={{ marginLeft: "0.5rem" }}>
                  Retry
                </Button>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar
        title={isNew ? t("TimerForm.createTitle") : t("TimerForm.editTitle")}
        primaryAction={{
          content: t("TimerForm.save"),
          onAction: handleSubmit,
          loading: isSaving,
        }}
        secondaryActions={[
          {
            content: t("TimerForm.cancel"),
            onAction: () => navigate("/timers"),
          },
        ]}
      />
      <Layout>
        <Layout.Section>
          {submitError && (
            <Banner status="critical" onDismiss={() => setSubmitError(null)}>
              <p>{submitError}</p>
            </Banner>
          )}

          <FormLayout>
            <Card sectioned>
              <TextField
                label={t("TimerForm.name")}
                value={formData.name}
                onChange={(value) => handleFieldChange("name", value)}
                error={errors.name}
                autoComplete="off"
                helpText="Give your timer a descriptive name"
              />

              <Select
                label={t("TimerForm.type")}
                options={[
                  { label: t("TimerForm.typeFixed"), value: "fixed" },
                  {
                    label: t("TimerForm.typeEvergreen"),
                    value: "evergreen",
                  },
                ]}
                value={formData.type}
                onChange={(value) => {
                  handleFieldChange("type", value);
                  setErrors({});
                }}
              />

              {formData.type === "fixed" ? (
                <>
                  <TextField
                    type="datetime-local"
                    label={t("TimerForm.startDate")}
                    value={formData.startDate}
                    onChange={(value) => handleFieldChange("startDate", value)}
                    error={errors.startDate}
                  />

                  <TextField
                    type="datetime-local"
                    label={t("TimerForm.endDate")}
                    value={formData.endDate}
                    onChange={(value) => handleFieldChange("endDate", value)}
                    error={errors.endDate}
                  />
                </>
              ) : (
                <TextField
                  type="number"
                  label={t("TimerForm.duration")}
                  value={formData.duration}
                  onChange={(value) => handleFieldChange("duration", value)}
                  error={errors.duration}
                  helpText={t("TimerForm.durationHelp")}
                  suffix={t("TimerForm.seconds")}
                  min={1}
                />
              )}

              <Select
                label={t("TimerForm.targetType")}
                options={[
                  { label: t("TimerForm.targetAll"), value: "all" },
                  { label: t("TimerForm.targetProducts"), value: "products" },
                  {
                    label: t("TimerForm.targetCollections"),
                    value: "collections",
                  },
                ]}
                value={formData.targetType}
                onChange={(value) => {
                  handleFieldChange("targetType", value);
                  setFormData((prev) => ({ ...prev, targetIds: [] }));
                  setErrors({});
                }}
              />

              {formData.targetType !== "all" && (
                <Stack vertical spacing="tight">
                  <TextField
                    label={t("TimerForm.targetIds")}
                    value={formData.targetIds.join(", ")}
                    onChange={(value) => {
                      const ids = value
                        .split(",")
                        .map((id) => id.trim())
                        .filter((id) => id.length > 0);
                      handleFieldChange("targetIds", ids);
                    }}
                    helpText={t("TimerForm.targetIdsHelp")}
                    error={errors.targetIds}
                    multiline={3}
                  />
                  {formData.targetIds.length > 0 && (
                    <Banner status="info">
                      {t("TimerForm.selectedCount", {
                        count: formData.targetIds.length,
                      })}
                    </Banner>
                  )}
                </Stack>
              )}
            </Card>

            <Card sectioned title={t("TimerForm.appearance")}>
              <TextField
                label={t("TimerForm.text")}
                value={formData.appearance.text}
                onChange={(value) => handleAppearanceChange("text", value)}
                helpText="Text displayed above the countdown"
              />

              <Select
                label={t("TimerForm.position")}
                options={[
                  { label: t("TimerForm.positionTop"), value: "top" },
                  { label: t("TimerForm.positionMiddle"), value: "middle" },
                  { label: t("TimerForm.positionBottom"), value: "bottom" },
                ]}
                value={formData.appearance.position}
                onChange={(value) => handleAppearanceChange("position", value)}
              />

              <Stack vertical spacing="tight">
                <div>
                  <Text as="label" variant="bodyMd" fontWeight="medium">
                    {t("TimerForm.backgroundColor")}
                  </Text>
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="color"
                      value={formData.appearance.backgroundColor}
                      onChange={(e) =>
                        handleAppearanceChange("backgroundColor", e.target.value)
                      }
                      style={{
                        width: "60px",
                        height: "40px",
                        cursor: "pointer",
                      }}
                    />
                    <Text as="span" tone="subdued">
                      {formData.appearance.backgroundColor}
                    </Text>
                  </div>
                </div>

                <div>
                  <Text as="label" variant="bodyMd" fontWeight="medium">
                    {t("TimerForm.textColor")}
                  </Text>
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="color"
                      value={formData.appearance.textColor}
                      onChange={(e) =>
                        handleAppearanceChange("textColor", e.target.value)
                      }
                      style={{
                        width: "60px",
                        height: "40px",
                        cursor: "pointer",
                      }}
                    />
                    <Text as="span" tone="subdued">
                      {formData.appearance.textColor}
                    </Text>
                  </div>
                </div>
              </Stack>
            </Card>
          </FormLayout>

          <Card sectioned>
            <Stack distribution="trailing">
              <Button onClick={() => navigate("/timers")}>
                {t("TimerForm.cancel")}
              </Button>
              <Button
                primary
                onClick={handleSubmit}
                loading={isSaving}
              >
                {t("TimerForm.save")}
              </Button>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

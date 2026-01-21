import { useState, useEffect } from "react";
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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function TimerFormPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

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

  // Fetch timer if editing
  const { data, isLoading } = useQuery({
    queryKey: ["timer", id],
    queryFn: async () => {
      const response = await fetch(`/api/timers/${id}`);
      if (!response.ok) throw new Error("Failed to fetch timer");
      return response.json();
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (data?.timer) {
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
        duration: timer.duration || "",
        targetType: timer.targetType || "all",
        targetIds: timer.targetIds || [],
        appearance: {
          backgroundColor: timer.appearance?.backgroundColor || "#000000",
          textColor: timer.appearance?.textColor || "#FFFFFF",
          position: timer.appearance?.position || "top",
          text: timer.appearance?.text || "Hurry! Sale ends in",
        },
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (timerData) => {
      const url = isNew ? "/api/timers" : `/api/timers/${id}`;
      const method = isNew ? "POST" : "PUT";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timerData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save timer");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["timers"]);
      shopify.toast.show(
        isNew ? t("TimerForm.timerCreated") : t("TimerForm.timerUpdated")
      );
      navigate("/timers");
    },
    onError: (error) => {
      shopify.toast.show(error.message, { isError: true });
    },
  });

  const handleSubmit = () => {
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
      if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
        newErrors.endDate = t("TimerForm.errorEndDateAfterStart");
      }
    } else {
      if (!formData.duration || formData.duration <= 0) {
        newErrors.duration = t("TimerForm.errorDurationRequired");
      }
    }

    if (formData.targetType !== "all" && formData.targetIds.length === 0) {
      newErrors.targetIds = t("TimerForm.errorTargetIdsRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const submitData = {
      name: formData.name,
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

    saveMutation.mutate(submitData);
  };


  if (isLoading && !isNew) {
    return (
      <Page>
        <TitleBar title={t("TimerForm.title")} />
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <p>{t("TimerForm.loading")}</p>
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
          loading: saveMutation.isLoading,
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

          <FormLayout>
            <Card sectioned>
              <TextField
                label={t("TimerForm.name")}
                value={formData.name}
                onChange={(value) =>
                  setFormData({ ...formData, name: value })
                }
                error={errors.name}
                autoComplete="off"
              />

              <Select
                label={t("TimerForm.type")}
                options={[
                  { label: t("TimerForm.typeFixed"), value: "fixed" },
                  { label: t("TimerForm.typeEvergreen"), value: "evergreen" },
                ]}
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value })}
              />

              {formData.type === "fixed" ? (
                <>
                  <TextField
                    type="datetime-local"
                    label={t("TimerForm.startDate")}
                    value={formData.startDate}
                    onChange={(value) =>
                      setFormData({ ...formData, startDate: value })
                    }
                    error={errors.startDate}
                  />

                  <TextField
                    type="datetime-local"
                    label={t("TimerForm.endDate")}
                    value={formData.endDate}
                    onChange={(value) =>
                      setFormData({ ...formData, endDate: value })
                    }
                    error={errors.endDate}
                  />
                </>
              ) : (
                <TextField
                  type="number"
                  label={t("TimerForm.duration")}
                  value={formData.duration}
                  onChange={(value) =>
                    setFormData({ ...formData, duration: value })
                  }
                  error={errors.duration}
                  helpText={t("TimerForm.durationHelp")}
                  suffix={t("TimerForm.seconds")}
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
                onChange={(value) =>
                  setFormData({ ...formData, targetType: value, targetIds: [] })
                }
              />

              {formData.targetType !== "all" && (
                <Stack vertical>
                  <TextField
                    label={t("TimerForm.targetIds")}
                    value={formData.targetIds.join(", ")}
                    onChange={(value) => {
                      const ids = value
                        .split(",")
                        .map((id) => id.trim())
                        .filter((id) => id.length > 0);
                      setFormData({ ...formData, targetIds: ids });
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

              <Card sectioned title={t("TimerForm.appearance")}>
                <TextField
                  label={t("TimerForm.text")}
                  value={formData.appearance.text}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      appearance: { ...formData.appearance, text: value },
                    })
                  }
                />

                <Select
                  label={t("TimerForm.position")}
                  options={[
                    { label: t("TimerForm.positionTop"), value: "top" },
                    { label: t("TimerForm.positionMiddle"), value: "middle" },
                    { label: t("TimerForm.positionBottom"), value: "bottom" },
                  ]}
                  value={formData.appearance.position}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      appearance: { ...formData.appearance, position: value },
                    })
                  }
                />

                <div style={{ marginTop: "1rem" }}>
                  <label>{t("TimerForm.backgroundColor")}</label>
                  <input
                    type="color"
                    value={formData.appearance.backgroundColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appearance: {
                          ...formData.appearance,
                          backgroundColor: e.target.value,
                        },
                      })
                    }
                    style={{ marginTop: "0.5rem", width: "100px", height: "40px" }}
                  />
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label>{t("TimerForm.textColor")}</label>
                  <input
                    type="color"
                    value={formData.appearance.textColor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appearance: {
                          ...formData.appearance,
                          textColor: e.target.value,
                        },
                      })
                    }
                    style={{ marginTop: "0.5rem", width: "100px", height: "40px" }}
                  />
                </div>
              </Card>
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
                loading={saveMutation.isLoading}
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

import CustomAlertModal, { AlertType } from "@/components/ui/CustomAlertModal";
import { useCallback, useState } from "react";

interface AlertConfig {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onClose?: () => void;
}

const INITIAL_CONFIG: AlertConfig = {
  visible: false,
  title: "",
  message: "",
  type: "info",
};

export function useCustomAlert() {
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(INITIAL_CONFIG);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      type: AlertType = "info",
      options?: {
        primaryButtonText?: string;
        secondaryButtonText?: string; // If provided, shows confirmation style
        onPrimaryPress?: () => void; // Action for primary button
        onClose?: () => void; // Action after closing (or secondary press)
      }
    ) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        type,
        primaryButtonText: options?.primaryButtonText,
        secondaryButtonText: options?.secondaryButtonText,
        onPrimaryPress: options?.onPrimaryPress,
        onClose: options?.onClose,
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    const callback = alertConfig.onClose;
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    if (callback) callback();
  }, [alertConfig.onClose]);

  const CustomAlertComponent = () => (
    <CustomAlertModal
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      type={alertConfig.type}
      primaryButtonText={alertConfig.primaryButtonText}
      secondaryButtonText={alertConfig.secondaryButtonText}
      onPrimaryPress={() => {
        // If specific action provided, run it.
        // Important: logic inside CustomAlertModal handles "onPrimaryPress" separate from "onClose"
        // But implementation there was: if onPrimaryPress, call it, else onClose.
        // We usually want to Close after Primary Press too unless it's async?
        // Let's assume onPrimaryPress handles closing or we wrap it here.
        // To be safe, let's wrap:
        if (alertConfig.onPrimaryPress) {
          alertConfig.onPrimaryPress();
          setAlertConfig((prev) => ({ ...prev, visible: false }));
        } else {
          hideAlert();
        }
      }}
      onClose={hideAlert}
    />
  );

  return {
    showAlert,
    hideAlert,
    CustomAlertComponent,
  };
}

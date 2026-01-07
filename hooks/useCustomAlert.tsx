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
  onSecondaryPress?: () => void;
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
        onSecondaryPress?: () => void; // Action for secondary button
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
        onSecondaryPress: options?.onSecondaryPress,
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
        if (alertConfig.onPrimaryPress) {
          alertConfig.onPrimaryPress();
          setAlertConfig((prev) => ({ ...prev, visible: false }));
        } else {
          hideAlert();
        }
      }}
      onSecondaryPress={() => {
        if (alertConfig.onSecondaryPress) {
          alertConfig.onSecondaryPress();
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

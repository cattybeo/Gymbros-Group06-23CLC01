import Colors from "@/constants/Colors";
import { useThemeContext } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TouchableOpacity, View } from "react-native";

export type AlertType = "success" | "error" | "warning" | "info";

interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: AlertType;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
}

export default function CustomAlertModal({
  visible,
  title,
  message,
  onClose,
  type = "info",
  primaryButtonText,
  secondaryButtonText,
  onPrimaryPress,
}: CustomAlertModalProps) {
  const { t } = useTranslation();
  const effectivePrimaryText = primaryButtonText || t("common.confirm");
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      case "warning":
        return "warning";
      default:
        return "information-circle";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return colors.success;
      case "error":
        return colors.error;
      case "warning":
        return colors.warning;
      default:
        return colors.info;
    }
  };

  const handlePrimaryPress = () => {
    if (onPrimaryPress) {
      onPrimaryPress();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/60 p-6">
        <View className="bg-card w-[85%] max-w-sm rounded-3xl p-6 border border-border items-center shadow-xl">
          <Ionicons
            name={getIconName()}
            size={48}
            color={getIconColor()}
            style={{ marginBottom: 16 }}
          />

          <Text className="text-foreground text-xl font-bold mb-2 text-center">
            {title}
          </Text>

          <Text className="text-muted_foreground text-base text-center mb-8 leading-6">
            {message}
          </Text>

          <View
            className={secondaryButtonText ? "flex-col gap-2 w-full" : "w-full"}
          >
            <TouchableOpacity
              onPress={handlePrimaryPress}
              accessibilityRole="button"
              accessibilityLabel={effectivePrimaryText}
              className="w-full py-4 rounded-2xl bg-primary items-center shadow-sm shadow-primary/20"
            >
              <Text className="text-on_primary font-bold text-lg">
                {effectivePrimaryText}
              </Text>
            </TouchableOpacity>

            {secondaryButtonText && (
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={secondaryButtonText}
                className="w-full py-4 rounded-2xl bg-transparent items-center"
              >
                <Text className="text-muted_foreground font-semibold text-base">
                  {secondaryButtonText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

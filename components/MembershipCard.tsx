import Colors from "@/constants/Colors";
import { GYM_IMAGES } from "@/constants/Images";
import { MembershipPlan, MembershipTier } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface MembershipCardProps {
  plan: MembershipPlan & {
    name?: string;
    description?: string;
    image_slug?: string;
  }; // Hybrid support for old/new
  tier?: MembershipTier; // New optional prop
  onBuy: (planId: string) => void;
  isLoading?: boolean;
  status: "default" | "current" | "upgrade" | "downgrade" | "cancelled";
}

export default function MembershipCard({
  plan,
  tier,
  onBuy,
  isLoading,
  status = "default",
}: MembershipCardProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(plan.price);

  // Use Tier image if available, else plan image, else default
  const imageKey = tier?.image_slug || plan.image_slug || "default";
  const imageSource = GYM_IMAGES[imageKey] || GYM_IMAGES["default"];

  // Button Logic based on status
  const isCurrent = status === "current";
  const isDowngrade = status === "downgrade";
  // Cancelled plans are effectively "expired" logic-wise for buying new ones?
  // No, if cancelled but still valid date -> "Ends Soon".
  // Note: membership.tsx filters "active" and "cancelled".
  // If cancelled, we might want to allow "Renew" (Buy again)?
  // For now, let's treat 'cancelled' as 'default' (Buyable to reactivate?)
  // OR show specific text. Let's show specific text.
  const isCancelled = status === "cancelled";

  const isDisabled = isCurrent || isDowngrade || isLoading;

  let buttonText = t("membership.buy_now");
  let buttonStyle = "bg-primary active:bg-primary/90";
  let textStyle = "text-on_primary font-bold text-lg";

  if (isLoading) {
    buttonText = t("membership.processing");
    buttonStyle = "bg-surface_highlight";
  } else if (isCurrent) {
    buttonText = t("membership.current");
    buttonStyle = "bg-surface_highlight opacity-50";
    textStyle = "text-foreground-secondary font-bold text-lg";
  } else if (isDowngrade) {
    buttonText = t("membership.no_downgrade");
    buttonStyle = "bg-surface border border-border";
    textStyle = "text-foreground-secondary font-semibold text-base";
  } else if (status === "upgrade") {
    buttonText = t("membership.upgrade");
    buttonStyle = "bg-success active:bg-success/90";
  } else if (isCancelled) {
    buttonText = "Đã hủy (Hết hạn sớm)";
    buttonStyle = "bg-error opacity-80";
    textStyle = "text-error-foreground font-bold text-lg"; // Error is usually red, text on red = white
  }

  return (
    <View className="bg-card p-4 rounded-2xl shadow-sm mb-4 border border-border overflow-hidden">
      <Image
        source={imageSource}
        className="w-full h-40 rounded-xl mb-4"
        resizeMode="cover"
      />
      <View className="flex-row justify-between items-center mb-2 px-2">
        <View className="flex-1">
          <Text className="text-xl font-bold text-card_foreground">
            {/* Try to translate the name (Silver, Gold) or fallback */}
            {tier
              ? t(`home.tier.${tier.code}`, { defaultValue: tier.name })
              : t(`plans.${plan.image_slug}`, { defaultValue: plan.name })}
          </Text>
          {plan.discount_label && (
            <Text className="text-success text-xs font-bold uppercase mt-1">
              {plan.discount_label}
            </Text>
          )}
        </View>

        <View className="bg-secondary px-3 py-1 rounded-full ml-2 border border-border">
          <Text className="font-semibold text-xs text-primary">
            {plan.duration_months} {t("membership.month")}
          </Text>
        </View>
      </View>

      <Text className="text-3xl font-extrabold my-2 px-2 text-primary">
        {formattedPrice}
      </Text>

      {/* Render Features from Tier */}
      {tier && tier.features && tier.features.length > 0 ? (
        <View className="mb-6 px-2">
          {tier.features.map((feature, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={16} color={colors.tint} />
              <Text className="text-muted_foreground ml-2 text-sm">
                {/* Provide i18n key or raw feature name */}
                {t(`features.${feature}`, {
                  defaultValue: feature.replace(/_/g, " "),
                })}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        // Fallback to description
        plan.description && (
          <Text className="text-muted_foreground mb-6 px-2">
            {plan.description}
          </Text>
        )
      )}

      <TouchableOpacity
        className={`w-full py-4 rounded-xl items-center ${buttonStyle}`}
        onPress={() => onBuy(plan.id)}
        disabled={isDisabled}
      >
        <Text
          className={textStyle}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ textAlign: "center", width: "100%" }}
        >
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

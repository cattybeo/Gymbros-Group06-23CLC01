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
  let buttonStyle = "bg-primary active:bg-orange-600";
  let textStyle = "text-white font-bold text-lg";

  if (isLoading) {
    buttonText = t("membership.processing");
    buttonStyle = "bg-gray-700";
  } else if (isCurrent) {
    buttonText = t("membership.current");
    buttonStyle = "bg-gray-700 opacity-50";
    textStyle = "text-gray-400 font-bold text-lg";
  } else if (isDowngrade) {
    buttonText = t("membership.no_downgrade");
    buttonStyle = "bg-gray-800 border border-gray-700";
    textStyle = "text-gray-500 font-semibold text-base";
  } else if (status === "upgrade") {
    buttonText = t("membership.upgrade");
    buttonStyle = "bg-green-600 active:bg-green-700";
  } else if (isCancelled) {
    buttonText = "Đã hủy (Hết hạn sớm)";
    buttonStyle = "bg-red-900 opacity-80";
    textStyle = "text-red-200 font-bold text-lg";
  }

  return (
    <View className="bg-surface p-4 rounded-2xl shadow-sm mb-4 border border-gray-800 overflow-hidden">
      <Image
        source={imageSource}
        className="w-full h-40 rounded-xl mb-4"
        resizeMode="cover"
      />
      <View className="flex-row justify-between items-center mb-2 px-2">
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">
            {/* Try to translate the name (Silver, Gold) or fallback */}
            {tier
              ? t(`home.tier.${tier.code}`, { defaultValue: tier.name })
              : t(`plans.${plan.image_slug}`, { defaultValue: plan.name })}
          </Text>
          {plan.discount_label && (
            <Text className="text-green-400 text-xs font-bold uppercase mt-1">
              {plan.discount_label}
            </Text>
          )}
        </View>

        <View className="bg-gray-700 px-3 py-1 rounded-full ml-2">
          <Text
            style={{ color: colors.tint }}
            className="font-semibold text-xs"
          >
            {plan.duration_months} {t("membership.month")}
          </Text>
        </View>
      </View>

      <Text
        style={{ color: colors.tint }}
        className="text-3xl font-extrabold my-2 px-2"
      >
        {formattedPrice}
      </Text>

      {/* Render Features from Tier */}
      {tier && tier.features && tier.features.length > 0 ? (
        <View className="mb-6 px-2">
          {tier.features.map((feature, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={16} color={colors.tint} />
              <Text className="text-gray-300 ml-2 text-sm">
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
          <Text className="text-gray-400 mb-6 px-2">{plan.description}</Text>
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

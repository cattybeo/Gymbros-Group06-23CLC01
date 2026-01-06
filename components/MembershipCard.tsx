import Colors from "@/constants/Colors";
import { GYM_IMAGES } from "@/constants/Images";
import { useThemeContext } from "@/lib/theme";
import { MembershipPlan, MembershipTier } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface MembershipCardProps {
  plan: MembershipPlan & {
    name?: string;
    description?: string;
    image_slug?: string;
  }; // Hybrid support for old/new
  tier?: MembershipTier;
  onBuy: (planId: string) => void;
  isLoading?: boolean;
  status: "default" | "current" | "upgrade" | "downgrade" | "cancelled";
  duration?: number;
}

export default function MembershipCard({
  plan,
  tier,
  onBuy,
  isLoading,
  status = "default",
  duration = 1,
}: MembershipCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  // LOGIC OVERRIDE: Standard Tier (Level 1) is always Free
  const isFreeTier = tier?.level === 1;

  // Calculate Monthly Price
  const monthlyPriceRaw = plan.price / duration;
  const formattedMonthlyPrice = isFreeTier
    ? t("membership.free")
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(monthlyPriceRaw);

  const formattedTotalPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(plan.price);

  // Use Tier image if available, else plan image, else default
  const imageKey = tier?.image_slug || plan.image_slug || "default";
  const imageSource = GYM_IMAGES[imageKey] || GYM_IMAGES["default"];

  const isCurrent = status === "current";
  const isDowngrade = status === "downgrade";
  const isCancelled = status === "cancelled";

  const isDisabled = isCurrent || isDowngrade || isLoading;

  let buttonText = t("membership.buy_now");
  let buttonStyle =
    "bg-primary active:bg-primary/90 shadow-md shadow-primary/30";
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
    buttonStyle = "bg-success active:bg-success/90 shadow-md shadow-success/30";
  } else if (isCancelled) {
    buttonText = t("membership.cancelled_early");
    buttonStyle = "bg-error opacity-80";
    textStyle = "text-error-foreground font-bold text-lg";
  }

  return (
    <View className="bg-card p-4 rounded-3xl shadow-sm mb-6 border border-border overflow-hidden">
      <View className="relative">
        <Image
          source={imageSource}
          className="w-full h-48 rounded-2xl mb-4"
          resizeMode="cover"
        />
        {/* Tier Badge Overlay */}
        <View className="absolute bottom-6 left-2 bg-background/80 blur-md px-3 py-1 rounded-full border border-white/10">
          <Text className="text-foreground font-bold text-sm tracking-wider uppercase">
            {tier
              ? t(`home.tier.${tier.code}`, { defaultValue: tier.name })
              : t(`plans.${plan.image_slug}`, { defaultValue: plan.name })}
          </Text>
        </View>

        {/* Discount Badge Overlay */}
        {plan.discount_label && (
          <View className="absolute top-2 right-2 bg-error px-3 py-1 rounded-full shadow-sm">
            <Text className="text-white text-xs font-bold uppercase">
              {plan.discount_label}
            </Text>
          </View>
        )}
      </View>

      {/* Price Section */}
      <View className="px-2 mb-4">
        {isFreeTier ? (
          <Text className="text-4xl font-extrabold text-primary mb-1">
            {t("membership.free", { defaultValue: "Miễn phí" })}
          </Text>
        ) : (
          <View>
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-extrabold text-primary">
                {formattedTotalPrice}
              </Text>
              <Text className="text-muted_foreground ml-1 text-base font-medium">
                / {duration} {t("membership.month_unit", { count: duration })}
              </Text>
            </View>

            {duration > 1 && (
              <Text className="text-muted_foreground text-sm mt-1">
                ≈ {formattedMonthlyPrice} /{" "}
                {t("membership.month_unit", { count: 1 })}
              </Text>
            )}
            {/* Show "Billed once" text? user probably gets it from "Total / X months" */}
          </View>
        )}
      </View>

      {/* Render Features from Tier */}
      {tier && tier.features && tier.features.length > 0 ? (
        <View className="mb-6 px-2 space-y-2">
          {tier.features.map((feature, index) => (
            <View key={index} className="flex-row items-center">
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.primary}
              />
              <Text className="text-foreground ml-3 text-sm font-medium">
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
        accessibilityRole="button"
        accessibilityLabel={buttonText}
        className={`w-full py-4 rounded-2xl items-center ${buttonStyle}`}
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

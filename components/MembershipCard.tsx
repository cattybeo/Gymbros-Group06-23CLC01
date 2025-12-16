import Colors from "@/constants/Colors";
import { GYM_IMAGES } from "@/constants/Images";
import { MembershipPlan } from "@/lib/types";
import { useTranslation } from "react-i18next";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface MembershipCardProps {
  plan: MembershipPlan;
  onBuy: (planId: string) => void;
  isLoading?: boolean;
  status: "default" | "current" | "upgrade" | "downgrade";
}

export default function MembershipCard({
  plan,
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

  const imageSource = GYM_IMAGES[plan.image_slug] || GYM_IMAGES["default"];

  // Button Logic based on status
  const isCurrent = status === "current";
  const isDowngrade = status === "downgrade";
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
  }

  return (
    <View className="bg-surface p-4 rounded-2xl shadow-sm mb-4 border border-gray-800 overflow-hidden">
      <Image
        source={imageSource}
        className="w-full h-40 rounded-xl mb-4"
        resizeMode="cover"
      />
      <View className="flex-row justify-between items-center mb-2 px-2">
        <Text className="text-xl font-bold text-white max-w-[70%]">
          {t(`plans.${plan.image_slug}`, { defaultValue: plan.name })}
        </Text>
        <View className="bg-gray-700 px-3 py-1 rounded-full">
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

      {plan.description && (
        <Text className="text-gray-400 mb-6 px-2">{plan.description}</Text>
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

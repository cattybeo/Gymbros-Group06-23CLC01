import { GYM_IMAGES } from "@/constants/Images";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ClassCatalogProps {
  selectedType: string;
  setSelectedType: (type: string) => void;
  uniqueClassTypes: { name: string; image_slug: string }[];
  colors: any;
}

export const ClassCatalog = ({
  selectedType,
  setSelectedType,
  uniqueClassTypes,
  colors,
}: ClassCatalogProps) => {
  const { t } = useTranslation();

  return (
    <View className="mb-6">
      <Text className="text-xl font-bold text-foreground mb-3 px-1">
        {t("classes.explore")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setSelectedType("All")}
            className={`mr-3 items-center ${
              selectedType === "All" ? "opacity-100" : "opacity-60"
            }`}
          >
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
                selectedType === "All" ? "bg-primary" : "bg-card"
              }`}
            >
              <Ionicons
                name="grid-outline"
                size={24}
                color={
                  selectedType === "All"
                    ? colors.on_primary
                    : colors.muted_foreground
                }
              />
            </View>
            <Text
              className={`text-xs font-semibold ${
                selectedType === "All"
                  ? "text-primary"
                  : "text-muted_foreground"
              }`}
            >
              {t("classes.all")}
            </Text>
          </TouchableOpacity>

          {uniqueClassTypes.map((type) => {
            const isSelected = selectedType === type.name;
            const imageSource =
              GYM_IMAGES[type.image_slug] || GYM_IMAGES["default"];

            return (
              <TouchableOpacity
                key={type.name}
                onPress={() => setSelectedType(type.name)}
                className={`mr-3 items-center ${isSelected ? "opacity-100" : "opacity-60"}`}
              >
                <Image
                  source={imageSource}
                  className={`w-16 h-16 rounded-full mb-2 border-2 ${isSelected ? "border-primary" : "border-transparent"}`}
                  resizeMode="cover"
                />
                <Text
                  className={`text-xs font-semibold max-w-[80px] text-center ${
                    isSelected ? "text-primary" : "text-muted_foreground"
                  }`}
                  numberOfLines={1}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

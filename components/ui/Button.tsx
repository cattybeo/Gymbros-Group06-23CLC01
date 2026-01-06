import Colors from "@/constants/Colors";
import { ActivityIndicator, Text, TouchableOpacity, useColorScheme } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
}

export default function Button({
  title,
  onPress,
  isLoading,
  variant = "primary",
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const bgClass =
    variant === "primary" ? "bg-primary" : "bg-secondary border border-border";
  const textClass =
    variant === "primary"
      ? "text-on-primary"
      : "text-on-secondary";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      className={`w-full p-4 rounded-xl items-center flex-row justify-center shadow-sm ${bgClass} ${isLoading ? "opacity-70" : ""}`}
    >
      {isLoading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? colors.on_primary
              : colors.on_secondary
          }
        />
      ) : (
        <Text className={`${textClass} font-bold text-lg`} numberOfLines={1}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

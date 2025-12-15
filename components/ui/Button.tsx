import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

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
  const bgClass =
    variant === "primary"
      ? "bg-primary"
      : "bg-transparent border border-primary";
  const textClass = variant === "primary" ? "text-white" : "text-primary";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      className={`w-full p-4 rounded-xl items-center flex-row justify-center shadow-sm ${bgClass} ${isLoading ? "opacity-70" : ""}`}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#FFA500"} />
      ) : (
        <Text className={`${textClass} font-bold text-lg`} numberOfLines={1}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

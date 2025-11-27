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
      ? "bg-blue-600"
      : "bg-transparent border border-blue-600";
  const textClass = variant === "primary" ? "text-white" : "text-blue-600";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      className={`w-full p-4 rounded-xl items-center flex-row justify-center shadow-sm ${bgClass} ${isLoading ? "opacity-70" : ""}`}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#2563EB"} />
      ) : (
        <Text className={`${textClass} font-bold text-lg`} numberOfLines={1}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

import { Text, TouchableOpacity } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}

export default function Button({
  title,
  onPress,
  variant = "primary",
}: ButtonProps) {
  // Logic chọn màu dựa trên biến variant
  const bgClass = variant === "primary" ? "bg-blue-600" : "bg-gray-200";
  const textClass = variant === "primary" ? "text-white" : "text-gray-800";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${bgClass} p-4 rounded-xl items-center active:opacity-80`}
    >
      <Text className={`${textClass} font-bold text-lg`}>{title}</Text>
    </TouchableOpacity>
  );
}

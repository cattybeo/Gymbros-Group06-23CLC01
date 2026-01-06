import Colors from "@/constants/Colors";
import { useThemeContext } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

interface InputFielProps extends TextInputProps {
  label: string;
  error?: string;
}

export default function InputField({
  label,
  error,
  secureTextEntry,
  ...props
}: InputFielProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  const isPasswordField = secureTextEntry === true;

  return (
    <View className="mb-4">
      <Text className="text-foreground mb-2 font-medium">{label}</Text>
      {/* Container for input and icon */}
      <View
        className={`w-full bg-card rounded-xl border flex-row items-center px-4 ${
          error ? "border-destructive" : "border-input"
        } focus:border-ring`}
      >
        <TextInput
          className="flex-1 py-4 text-foreground h-full"
          placeholderTextColor={colors.muted_foreground}
          secureTextEntry={isPasswordField && !isPasswordVisible}
          {...props}
        />

        {isPasswordField && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={24}
              color={colors.muted_foreground}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text className="text-destructive text-sm mt-1">{error}</Text>}
    </View>
  );
}

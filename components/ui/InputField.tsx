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
  error?: string; // Để hiển thị lỗi nếu có
}

export default function InputField({
  label,
  error,
  secureTextEntry,
  ...props
}: InputFielProps) {
  // State để quản lý hiển thị mật khẩu
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Kiểm tra nếu là trường mật khẩu
  const isPasswordField = secureTextEntry === true;

  return (
    <View className="mb-4">
      <Text className="text-gray-400 mb-2 font-medium">{label}</Text>
      {/* Container for input and icon */}
      <View
        className={`w-full bg-surface rounded-xl border flex-row items-center px-4 ${
          error ? "border-red-500" : "border-gray-700"
        } focus:border-primary`}
      >
        <TextInput
          className="flex-1 py-4 text-white h-full"
          placeholderTextColor="#6B7280"
          secureTextEntry={isPasswordField && !isPasswordVisible}
          {...props} // Truyền tất cả các props còn lại (onChangeText, value, secureTextEntry...)
        />

        {isPasswordField && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}

import { signOutFromGoogle } from "@/lib/GoogleAuth";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

export default function GoogleSignOutButton() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOutFromGoogle();
      // AuthContext will detect session = null and redirect to sign-in
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      disabled={loading}
      className="bg-destructive p-4 rounded-xl items-center justify-center"
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text className="text-destructive-foreground font-bold">
          {t("profile.logout")}
        </Text>
      )}
    </TouchableOpacity>
  );
}

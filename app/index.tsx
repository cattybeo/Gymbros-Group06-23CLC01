import { useAuthContext } from "@/lib/AuthContext";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function RootIndex() {
  const { session, isLoading, isTrainer, isStaff, isAdmin } = useAuthContext();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Trainers, Staff, and Admins share the "Pro" interface for now
  if (isTrainer || isStaff || isAdmin) {
    return <Redirect href="/(trainer)/dashboard" />;
  }

  // Default to member dashboard
  return <Redirect href="/(member)/dashboard" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

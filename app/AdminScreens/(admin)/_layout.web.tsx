// app/AdminScreens/(admin)/_layout.web.tsx
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { useAuth } from "../../../services/AuthContext";

export default function AdminLayoutWeb() {
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.replace("/AdminScreens/sign-in");
    }
  }, [user, role, loading]);

  if (loading || !user || role !== "admin") {
    return <View style={{ padding: 16 }}><Text>A validar sessão…</Text></View>;
  }

  return <Stack screenOptions={{ headerShown: false }} />; // 👉 Stack aqui é OK
}

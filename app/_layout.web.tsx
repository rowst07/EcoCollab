// app/_layout.web.tsx
import { Slot } from "expo-router";
import { Platform } from "react-native";
import { AuthProvider } from "../services/AuthContext";

if (Platform.OS === "web") {
  require("./global.css");
}

export default function RootLayoutWeb() {
  return (
    <AuthProvider>
      <Slot /> {/* 👉 só Slot aqui */}
    </AuthProvider>
  );
}

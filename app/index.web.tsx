import { router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../services/AuthContext";

export default function WebIndexRedirect() {
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && role === "admin") router.replace("/AdminScreens" as any);
    else router.replace("../AdminScreens/sign-in" as any);
  }, [user, role, loading]);

  return null;
}

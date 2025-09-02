// components/web/Topbar.tsx
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type NavItem = { label: string; path: string };

const NAV: NavItem[] = [
  { label: "Dashboard",    path: "/AdminScreens/(admin)/dashboard/index" },
  { label: "Retomas",      path: "/AdminScreens/(admin)/retomas/index" },
  { label: "Reports",      path: "/AdminScreens/(admin)/reports/index" },
  { label: "Utilizadores", path: "/AdminScreens/(admin)/users/index" },
];

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();

  const go = (path: string) => () => router.push(path as any);
  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path.replace(/\/index$/, ""));

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        {/* Brand → Dashboard */}
        <Pressable onPress={go("/AdminScreens/(admin)/dashboard/index")}>
          {({ pressed }) => (
            <Text style={[styles.brand, pressed && { opacity: 0.75 }]}>
              EcoCollab Admin
            </Text>
          )}
        </Pressable>

        {/* Navegação */}
        <View style={styles.nav}>
          {NAV.map((it) => (
            <Pressable
              key={it.path}
              onPress={go(it.path)}
              style={({ pressed }) => [
                styles.navBtn,
                isActive(it.path) && styles.navBtnActive,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={[styles.navTxt, isActive(it.path) && styles.navTxtActive]}>
                {it.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Ações à direita (ajusta consoante tiveres rotas/handlers) */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={go("/AdminScreens/(admin)/profile/index")}
            style={({ pressed }) => [styles.smallBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.smallTxt}>Perfil</Text>
          </Pressable>

          {/* Se tiveres um método logout no teu AuthContext, troca por onPress={logout} */}
          <Pressable
            onPress={go("/Auth/logout/index")}
            style={({ pressed }) => [styles.smallBtnOutline, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.smallTxtOutline}>Sair</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "fixed" as any,
    top: 0, left: 0, right: 0,
    height: 64,
    backgroundColor: "#f5f6f7",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    zIndex: 50,
    backdropFilter: "saturate(180%) blur(6px)" as any,
  },
  inner: {
    height: "100%",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: { fontSize: 18, fontWeight: "900", letterSpacing: 0.3 },
  nav: { flexDirection: "row", gap: 6, alignItems: "center" },
  navBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  navBtnActive: { backgroundColor: "#111827" },
  navTxt: { fontWeight: "800" },
  navTxtActive: { color: "white" },

  smallBtn: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: "#111827",
  },
  smallTxt: { color: "white", fontWeight: "800" },
  smallBtnOutline: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "white",
  },
  smallTxtOutline: { fontWeight: "800" },
});

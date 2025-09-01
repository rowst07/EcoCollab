import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAuth } from "../../../services/AuthContext";

export default function SignInWeb() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [subm, setSubm] = useState(false);

  useEffect(() => {
    if (user) router.replace("/AdminScreens" as any);
  }, [user]);

  if (loading) return <View style={{ padding: 16 }}><Text>A carregar…</Text></View>;

  return (
    <View
      style={{
        minHeight: "100vh" as any, // web only
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <View
        style={{
          width: 360,
          backgroundColor: "var(--card)",
          borderWidth: 1,
          borderColor: "var(--border)",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "900", marginBottom: 4 }}>Admin Login</Text>
        <Text style={{ color: "var(--muted)", marginBottom: 12 }}>
          Acesso restrito. Usa as credenciais atribuídas.
        </Text>

        <Text style={{ fontWeight: "600" }}>Email</Text>
        <TextInput
          style={{ marginTop: 4, marginBottom: 12, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "var(--border)" }}
          placeholder="admin@exemplo.pt"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={{ fontWeight: "600" }}>Palavra-passe</Text>
        <TextInput
          style={{ marginTop: 4, marginBottom: 12, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "var(--border)" }}
          placeholder="********"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {err && <Text style={{ color: "#e11d48", marginBottom: 8 }}>{err}</Text>}

        <Pressable
          style={{ backgroundColor: "var(--primary)", paddingVertical: 10, borderRadius: 10, alignItems: "center" }}
          disabled={subm}
          onPress={async () => {
            setErr(null); setSubm(true);
            try { await signIn(email.trim(), password); }
            catch (e: any) {
              const code = e?.code || "";
              if (code.includes("invalid-credential") || code.includes("wrong-password")) setErr("Email ou palavra-passe inválidos.");
              else if (code.includes("user-not-found")) setErr("Utilizador não encontrado.");
              else setErr("Não foi possível iniciar sessão.");
            } finally { setSubm(false); }
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>{subm ? "A entrar…" : "Entrar"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

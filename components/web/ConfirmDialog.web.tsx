import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export type ConfirmDialogProps = Props;

export default function ConfirmDialogWeb({
  open, title, description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm, onClose
}: Props) {
  if (!open) return null;
  return (
    <View
      style={{
        position: "fixed" as any, inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        alignItems: "center", justifyContent: "center", padding: 16, zIndex: 9999
      }}
    >
      <View
        style={{
          width: 420, maxWidth: "95%",
          backgroundColor: "var(--card)",
          borderWidth: 1, borderColor: "var(--border)",
          borderRadius: 12, padding: 16
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 6 }}>{title}</Text>
        {!!description && <Text style={{ color: "var(--muted)", marginBottom: 12 }}>{description}</Text>}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
          <Pressable
            onPress={onClose}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "var(--bg)", borderWidth: 1, borderColor: "var(--border)" }}
          >
            <Text>{cancelText}</Text>
          </Pressable>
          <Pressable
            onPress={async () => { await onConfirm(); onClose(); }}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#eaf4ee", borderWidth: 1, borderColor: "#cbe7d4" }}
          >
            <Text style={{ color: "#166534", fontWeight: "700" }}>{confirmText}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

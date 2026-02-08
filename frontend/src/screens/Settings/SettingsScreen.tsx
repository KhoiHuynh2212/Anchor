import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { T } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import AppIcon from "../../components/AppIcon";

const MOTIVATION_STYLES = [
  { value: "gentle", label: "Gentle", desc: "Soft, patient, nurturing" },
  { value: "balanced", label: "Balanced", desc: "Warm with a nudge" },
  { value: "direct", label: "Direct", desc: "Clear, action-oriented" },
];

export default function SettingsScreen() {
  const { userProfile, signOut, refreshProfile } = useAuth();
  const [nickname, setNickname] = useState("");
  const [motivationStyle, setMotivationStyle] = useState("balanced");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [bedTime, setBedTime] = useState("23:00");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todoistModalVisible, setTodoistModalVisible] = useState(false);
  const [todoistToken, setTodoistToken] = useState("");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      const data = res.data;
      setNickname(data.nickname || "");
      setMotivationStyle(data.motivation_style || "balanced");
      setWakeTime(data.wake_time || "07:00");
      setBedTime(data.bed_time || "23:00");
    } catch {
      // Use what we have from context
      setNickname(userProfile?.nickname || "");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/auth/me", {
        nickname: nickname || undefined,
        motivation_style: motivationStyle,
        wake_time: wakeTime,
        bed_time: bedTime,
      });
      // If today's brief is cached, it may still contain the old greeting text.
      // Regenerate so Sage uses the updated nickname immediately.
      try {
        await api.post("/brief/generate");
      } catch {
        // non-critical
      }
      await refreshProfile();
      Alert.alert("Saved", "Your preferences have been updated.");
    } catch {
      Alert.alert("Error", "Could not save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const res = await api.get("/integrations/google/auth-url");
      Alert.alert(
        "Connect Google",
        "Open this URL in your browser to connect:\n\n" + res.data.auth_url
      );
    } catch {
      Alert.alert("Error", "Could not get Google auth URL.");
    }
  };

  const handleTodoistConnect = () => {
    setTodoistToken("");
    setTodoistModalVisible(true);
  };

  const submitTodoistToken = async () => {
    if (!todoistToken.trim()) return;
    setTodoistModalVisible(false);
    try {
      await api.post("/integrations/todoist/connect", { api_token: todoistToken.trim() });
      Alert.alert("Connected", "Todoist connected successfully.");
    } catch {
      Alert.alert("Error", "Could not connect Todoist.");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 90 }}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <LinearGradientAvatar label={(nickname || userProfile?.email || "A").charAt(0).toUpperCase()} />
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{nickname || "You"}</Text>
          <Text style={styles.profileEmail}>{userProfile?.email || ""}</Text>
        </View>
        <View style={styles.editChip}>
          <Text style={styles.editChipText}>Edit</Text>
        </View>
      </View>

      {/* Preferences */}
      <Section title="Preferences">
        <Row label="Nickname" sublabel="What should Sage call you?">
          <TextInput
            style={styles.inlineInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Alex"
            placeholderTextColor={T.textMuted}
          />
        </Row>
        <Divider />
        <Row label="Motivation style" sublabel={MOTIVATION_STYLES.find((s) => s.value === motivationStyle)?.desc || ""}>
          <View style={styles.pillsRow}>
            {MOTIVATION_STYLES.map((s) => {
              const active = motivationStyle === s.value;
              return (
                <Pressable
                  key={s.value}
                  onPress={() => setMotivationStyle(s.value)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Row>
        <Divider />
        <Row label="Wake time" sublabel="Morning brief time">
          <TextInput
            style={styles.timeInput}
            value={wakeTime}
            onChangeText={setWakeTime}
            placeholder="07:30"
            placeholderTextColor={T.textMuted}
          />
        </Row>
        <Divider />
        <Row label="Bed time" sublabel="Evening check-in prompt">
          <TextInput
            style={styles.timeInput}
            value={bedTime}
            onChangeText={setBedTime}
            placeholder="23:00"
            placeholderTextColor={T.textMuted}
          />
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row label="Push notifications" sublabel="Morning brief, nudges, and reminders">
          <Toggle value={pushEnabled} onChange={setPushEnabled} />
        </Row>
        <Divider />
        <Row label="AI voice responses" sublabel="ElevenLabs voice in sessions">
          <Toggle value={voiceEnabled} onChange={setVoiceEnabled} />
        </Row>
      </Section>

      {/* Integrations */}
      <Section title="Integrations">
        <Pressable style={styles.integrationRow} onPress={handleGoogleConnect}>
          <View style={styles.integrationIcon}>
            <AppIcon name="logo-google" size={16} color={T.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.integrationName}>Google</Text>
            <Text style={styles.integrationDesc}>Calendar & Gmail</Text>
          </View>
          <Text style={styles.integrationAction}>Connect</Text>
        </Pressable>
        <Divider />
        <Pressable style={styles.integrationRow} onPress={handleTodoistConnect}>
          <View style={styles.integrationIcon}>
            <AppIcon name="checkmark-circle" size={16} color={T.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.integrationName}>Todoist</Text>
            <Text style={styles.integrationDesc}>Tasks & deadlines</Text>
          </View>
          <Text style={styles.integrationAction}>Connect</Text>
        </Pressable>
      </Section>

      {/* Save */}
      <Pressable style={styles.primaryButton} onPress={saveProfile} disabled={saving}>
        <LinearGradientButton disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryButtonText}>Save changes</Text>}
        </LinearGradientButton>
      </Pressable>

      {/* Sign out */}
      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      {/* Todoist Token Modal */}
      <Modal visible={todoistModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Connect Todoist</Text>
            <Text style={styles.modalDesc}>Enter your Todoist API token:</Text>
            <TextInput
              style={styles.modalInput}
              value={todoistToken}
              onChangeText={setTodoistToken}
              placeholder="Paste token here"
              placeholderTextColor={T.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={() => setTodoistModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={submitTodoistToken}>
                <Text style={styles.modalConfirmText}>Connect</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function LinearGradientAvatar({ label }: { label: string }) {
  return (
    <LinearGradient
      colors={[T.primary, T.accent]}
      style={styles.avatarWrap}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.avatarText}>{label}</Text>
    </LinearGradient>
  );
}

function LinearGradientButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <LinearGradient
      colors={disabled ? [T.borderLight, T.borderLight] : [T.primary, T.accent]}
      style={styles.primaryButtonInner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      {children}
    </LinearGradient>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      <View style={{ marginLeft: 12 }}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={[styles.toggle, value && styles.toggleOn]}>
      <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: "center",
    alignItems: "center",
  },

  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 18 },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  avatarText: { fontFamily: T.fontDisplay, fontSize: 26, color: "#fff" },
  profileName: { fontFamily: T.fontBold, fontSize: 20, color: T.text },
  profileEmail: { fontFamily: T.font, fontSize: 13, color: T.textSecondary, marginTop: 2 },
  editChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50, backgroundColor: T.primarySoft },
  editChipText: { fontFamily: T.fontBold, fontSize: 12, color: T.primary },

  section: { paddingHorizontal: 24, marginTop: 18 },
  sectionTitle: {
    fontFamily: T.fontBold,
    fontSize: 12,
    color: T.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
    paddingLeft: 2,
  },
  sectionCard: {
    borderRadius: T.radiusSm,
    backgroundColor: T.bgCard,
    shadowColor: T.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: T.shadowOpacity,
    shadowRadius: T.shadowRadius,
    elevation: 2,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 18 },
  rowLabel: { fontFamily: T.fontMedium, fontSize: 15, color: T.text },
  rowSublabel: { fontFamily: T.font, fontSize: 12, color: T.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: T.borderLight },

  inlineInput: {
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.border,
    fontFamily: T.font,
    fontSize: 14,
    color: T.text,
    textAlign: "right",
  },

  pillsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.borderLight },
  pillActive: { backgroundColor: `${T.primary}10`, borderColor: T.primary },
  pillText: { fontFamily: T.fontSemiBold, fontSize: 12, color: T.textMuted },
  pillTextActive: { color: T.primary },

  timeInput: {
    width: 96,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.border,
    fontFamily: T.fontSemiBold,
    fontSize: 14,
    color: T.text,
    textAlign: "center",
  },

  toggle: { width: 48, height: 28, borderRadius: 28, backgroundColor: T.border, padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: T.primary },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
  toggleKnobOn: { transform: [{ translateX: 20 }] },

  integrationRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 18 },
  integrationIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" },
  integrationName: { fontFamily: T.fontMedium, fontSize: 15, color: T.text },
  integrationDesc: { fontFamily: T.font, fontSize: 12, color: T.textMuted, marginTop: 2 },
  integrationAction: { fontFamily: T.fontBold, fontSize: 13, color: T.primary },

  primaryButton: { paddingHorizontal: 24, marginTop: 20 },
  primaryButtonInner: { width: "100%", borderRadius: 56, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#fff", fontFamily: T.fontBold, fontSize: 16 },

  signOutButton: { marginTop: 14, marginHorizontal: 24, paddingVertical: 16, borderRadius: 56, backgroundColor: T.surface, alignItems: "center" },
  signOutText: { color: T.danger, fontFamily: T.fontBold, fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalCard: {
    backgroundColor: T.bgCard,
    borderRadius: T.radius,
    padding: 24,
    width: "100%",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", color: T.text, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: T.textSecondary, marginBottom: 16 },
  modalInput: {
    backgroundColor: T.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: T.text,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  modalCancel: { paddingHorizontal: 20, paddingVertical: 10 },
  modalCancelText: { color: T.textSecondary, fontWeight: "600" },
  modalConfirm: {
    backgroundColor: T.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalConfirmText: { color: "#fff", fontWeight: "600" },
});

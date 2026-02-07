import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { T } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.subheading}>{userProfile?.email}</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROFILE</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="What should Sage call you?"
            placeholderTextColor={T.textMuted}
          />
        </View>
      </View>

      {/* Motivation Style */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MOTIVATION STYLE</Text>
        <View style={styles.card}>
          {MOTIVATION_STYLES.map((style) => (
            <TouchableOpacity
              key={style.value}
              style={[
                styles.styleOption,
                motivationStyle === style.value && styles.styleOptionActive,
              ]}
              onPress={() => setMotivationStyle(style.value)}
            >
              <View style={styles.styleRow}>
                <View
                  style={[
                    styles.radio,
                    motivationStyle === style.value && styles.radioActive,
                  ]}
                />
                <View>
                  <Text
                    style={[
                      styles.styleLabel,
                      motivationStyle === style.value && styles.styleLabelActive,
                    ]}
                  >
                    {style.label}
                  </Text>
                  <Text style={styles.styleDesc}>{style.desc}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SCHEDULE</Text>
        <View style={styles.card}>
          <View style={styles.timeRow}>
            <Text style={styles.label}>Wake Time</Text>
            <TextInput
              style={styles.timeInput}
              value={wakeTime}
              onChangeText={setWakeTime}
              placeholder="07:00"
              placeholderTextColor={T.textMuted}
            />
          </View>
          <View style={[styles.timeRow, { marginTop: 16 }]}>
            <Text style={styles.label}>Bed Time</Text>
            <TextInput
              style={styles.timeInput}
              value={bedTime}
              onChangeText={setBedTime}
              placeholder="23:00"
              placeholderTextColor={T.textMuted}
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Integrations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INTEGRATIONS</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.integrationRow} onPress={handleGoogleConnect}>
            <Text style={styles.integrationName}>Google Calendar & Gmail</Text>
            <Text style={styles.integrationAction}>Connect</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.integrationRow} onPress={handleTodoistConnect}>
            <Text style={styles.integrationName}>Todoist</Text>
            <Text style={styles.integrationAction}>Connect</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out */}
      <View style={[styles.section, { marginTop: 24 }]}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

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
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setTodoistModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={submitTodoistToken}>
                <Text style={styles.modalConfirmText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  heading: { fontSize: 28, fontWeight: "300", color: T.text, marginBottom: 4 },
  subheading: { fontSize: 14, color: T.textSecondary },
  section: { paddingHorizontal: 24, marginTop: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: T.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "500", color: T.text, marginBottom: 8 },
  input: {
    backgroundColor: T.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: T.text,
  },
  styleOption: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  styleOptionActive: {
    backgroundColor: T.primarySoft,
  },
  styleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: T.textMuted,
  },
  radioActive: {
    borderColor: T.primary,
    backgroundColor: T.primary,
  },
  styleLabel: { fontSize: 15, fontWeight: "600", color: T.text },
  styleLabelActive: { color: T.primary },
  styleDesc: { fontSize: 12, color: T.textSecondary, marginTop: 2 },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeInput: {
    backgroundColor: T.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: T.text,
    width: 100,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: T.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  integrationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  integrationName: { fontSize: 15, fontWeight: "500", color: T.text },
  integrationAction: { fontSize: 14, fontWeight: "600", color: T.primary },
  divider: { height: 1, backgroundColor: T.border },
  signOutButton: {
    backgroundColor: T.surface,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutText: { color: T.danger, fontSize: 16, fontWeight: "600" },
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

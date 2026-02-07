import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { T } from "../../theme";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const MOTIVATION_OPTIONS = [
  { id: "gentle", emoji: "\uD83C\uDF38", title: "Gentle & nurturing", desc: "Soft encouragement, patient reminders" },
  { id: "balanced", emoji: "\uD83C\uDF3F", title: "Balanced & warm", desc: "Supportive with a nudge when needed" },
  { id: "direct", emoji: "\uD83D\uDD25", title: "Direct & energizing", desc: "Clear accountability, action-focused" },
];

export default function QuestionsScreen({ navigation }: any) {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [goals, setGoals] = useState(["", "", ""]);
  const [motivationStyle, setMotivationStyle] = useState("balanced");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [bedTime, setBedTime] = useState("23:00");
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const updateGoal = (index: number, value: string) => {
    const updated = [...goals];
    updated[index] = value;
    setGoals(updated);
  };

  const canProceed = () => {
    if (step === 0) return nickname.trim().length > 0;
    if (step === 1) return goals.some((g) => g.trim().length > 0);
    return true;
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }

    // Submit answers
    setLoading(true);
    try {
      await api.post("/onboarding/answers", {
        nickname: nickname.trim(),
        goals: goals.filter((g) => g.trim()),
        motivation_style: motivationStyle,
        wake_time: wakeTime,
        bed_time: bedTime,
      });
      navigation.navigate("OnboardingChat");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save answers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Progress bar */}
        <View style={styles.progressRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressBar, i <= step ? styles.progressActive : styles.progressInactive]}
            />
          ))}
        </View>

        {step === 0 && (
          <View>
            <Text style={styles.heading}>What should we call you?</Text>
            <Text style={styles.subheading}>Pick a name that feels right.</Text>
            <TextInput
              style={styles.input}
              placeholder="Your nickname"
              placeholderTextColor={T.textMuted}
              value={nickname}
              onChangeText={setNickname}
              autoFocus
            />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.heading}>What are your top goals?</Text>
            <Text style={styles.subheading}>Share up to 3 goals you're working toward.</Text>
            {goals.map((goal, i) => (
              <TextInput
                key={i}
                style={styles.input}
                placeholder={`Goal ${i + 1}${i === 0 ? " (required)" : " (optional)"}`}
                placeholderTextColor={T.textMuted}
                value={goal}
                onChangeText={(v) => updateGoal(i, v)}
                autoFocus={i === 0}
              />
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.heading}>How do you like to{"\n"}be motivated?</Text>
            <Text style={styles.subheading}>This helps Sage tailor its tone to what works best for you.</Text>
            {MOTIVATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionCard, motivationStyle === opt.id && styles.optionCardSelected]}
                onPress={() => setMotivationStyle(opt.id)}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, motivationStyle === opt.id && styles.radioSelected]}>
                  {motivationStyle === opt.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.heading}>Your daily rhythm</Text>
            <Text style={styles.subheading}>When do you usually wake up and go to bed?</Text>
            <Text style={styles.label}>Wake time</Text>
            <TextInput
              style={styles.input}
              placeholder="07:00"
              placeholderTextColor={T.textMuted}
              value={wakeTime}
              onChangeText={setWakeTime}
            />
            <Text style={styles.label}>Bed time</Text>
            <TextInput
              style={styles.input}
              placeholder="23:00"
              placeholderTextColor={T.textMuted}
              value={bedTime}
              onChangeText={setBedTime}
            />
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.button, !canProceed() && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step === totalSteps - 1 ? "Continue to Chat" : "Continue"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 32 },
  progressBar: { flex: 1, height: 4, borderRadius: 4 },
  progressActive: { backgroundColor: T.primary },
  progressInactive: { backgroundColor: T.primarySoft },
  heading: {
    fontSize: 28,
    fontWeight: "300",
    color: T.text,
    marginBottom: 8,
    lineHeight: 36,
  },
  subheading: {
    fontSize: 15,
    color: T.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: T.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: T.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: T.radiusSm,
    borderWidth: 2,
    borderColor: T.border,
    backgroundColor: T.bgCard,
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: T.primary,
    backgroundColor: T.primary + "08",
  },
  optionEmoji: { fontSize: 28 },
  optionTitle: { fontSize: 16, fontWeight: "600", color: T.text },
  optionDesc: { fontSize: 13, color: T.textSecondary, marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: T.primary, backgroundColor: T.primary },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: T.primary,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

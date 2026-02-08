import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { T } from "../../theme";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AppIcon from "../../components/AppIcon";

const MOTIVATION_OPTIONS = [
  {
    id: "gentle",
    icon: "heart-outline",
    title: "Gentle & nurturing",
    desc: "Soft encouragement, patient reminders",
    preview: "\"Hey, just a gentle reminder about your quiz tomorrow. No pressure — you've got this.\"",
  },
  {
    id: "balanced",
    icon: "leaf-outline",
    title: "Balanced & warm",
    desc: "Supportive with a nudge when needed",
    preview:
      "\"Your Coursera quiz is due tomorrow and you've done 3 of 5 modules — a 45-min session today puts you in great shape!\"",
  },
  {
    id: "direct",
    icon: "flame-outline",
    title: "Direct & energizing",
    desc: "Clear accountability, action-focused",
    preview:
      "\"Quiz due tomorrow. 2 modules left. Block 6-7pm tonight and knock it out. You're behind but you can catch up.\"",
  },
];

const GOAL_PRESETS = [
  { id: "career", icon: "briefcase-outline", label: "Advance my career" },
  { id: "fitness", icon: "barbell-outline", label: "Get fit & healthy" },
  { id: "learning", icon: "book-outline", label: "Learn something new" },
  { id: "mindful", icon: "leaf-outline", label: "Be more mindful" },
  { id: "social", icon: "people-outline", label: "Build relationships" },
  { id: "finance", icon: "cash-outline", label: "Financial goals" },
  { id: "creative", icon: "color-palette-outline", label: "Creative projects" },
  { id: "sleep", icon: "moon-outline", label: "Better sleep habits" },
  { id: "habit", icon: "flash-outline", label: "Build new habits" },
];

// Onboarding steps shown after auth: Nickname, Goals, Motivation, Wake, Bed, Integrations
const TOTAL_STEPS = 6;

const to24Hour = (hour: number, minute: number, period: "AM" | "PM") => {
  const normalizedHour = period === "PM" && hour !== 12 ? hour + 12 : period === "AM" && hour === 12 ? 0 : hour;
  const hh = String(normalizedHour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}`;
};

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, i) => {
        if (i < step) {
          return (
            <LinearGradient
              key={i}
              colors={[T.primary, T.accent]}
              style={styles.progressBar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          );
        }

        return (
          <View
            key={i}
            style={[styles.progressBar, i === step ? styles.progressCurrent : styles.progressInactive]}
          />
        );
      })}
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.backButton}>
      <Text style={styles.backIcon}>‹</Text>
    </Pressable>
  );
}

function ContinueButton({
  onPress,
  disabled,
  label = "Continue",
  icon,
}: {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ width: "100%" }}>
      <LinearGradient
        colors={disabled ? [T.borderLight, T.borderLight] : [T.primary, T.accent]}
        style={[styles.continueButton, disabled && styles.continueButtonDisabled]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.continueText, disabled && styles.continueTextDisabled]}>{label}</Text>
        {icon ? <View style={{ marginLeft: 8 }}>{icon}</View> : null}
      </LinearGradient>
    </Pressable>
  );
}

function SkipLink({ onPress, label = "Skip for now" }: { onPress: () => void; label?: string }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={styles.skipLink}>{label}</Text>
    </Pressable>
  );
}

function ScreenHeader({
  step,
  total,
  onBack,
  title,
  subtitle,
}: {
  step: number;
  total: number;
  onBack?: () => void;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.headerRow}>
        {onBack ? <BackButton onPress={onBack} /> : <View style={{ width: 28 }} />}
      </View>
      <ProgressBar step={step} total={total} />
      <View style={{ marginTop: 24 }}>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function TimeWheel({
  values,
  value,
  onChange,
}: {
  values: Array<number | string>;
  value: number | string;
  onChange: (next: any) => void;
}) {
  const index = values.indexOf(value);
  const prev = values[(index - 1 + values.length) % values.length];
  const next = values[(index + 1) % values.length];

  return (
    <View style={styles.timeWheel}>
      <Pressable onPress={() => onChange(prev)} style={styles.timeWheelArrow}>
        <Text style={styles.timeWheelArrowText}>˄</Text>
      </Pressable>
      <Text style={styles.timeWheelFaded}>{typeof prev === "number" ? String(prev).padStart(2, "0") : prev}</Text>
      <View style={styles.timeWheelCurrent}>
        <Text style={styles.timeWheelCurrentText}>
          {typeof value === "number" ? String(value).padStart(2, "0") : value}
        </Text>
      </View>
      <Text style={styles.timeWheelFaded}>{typeof next === "number" ? String(next).padStart(2, "0") : next}</Text>
      <Pressable onPress={() => onChange(next)} style={styles.timeWheelArrow}>
        <Text style={styles.timeWheelArrowText}>˅</Text>
      </Pressable>
    </View>
  );
}

export default function QuestionsScreen() {
  const { refreshProfile, userProfile } = useAuth();
  const navigation = useNavigation<NavigationProp<any>>();
  // This screen is only reachable after auth (AppNavigator gates it on `session`),
  // so starting at the splash/create-account screens would feel like "duplicate onboarding".
  // Begin at the first real onboarding step instead.
  const [screen, setScreen] = useState(2);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("alex@gmail.com");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [motivationStyle, setMotivationStyle] = useState("balanced");
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(30);
  const [wakePeriod, setWakePeriod] = useState<"AM" | "PM">("AM");
  const [bedHour, setBedHour] = useState(11);
  const [bedMinute, setBedMinute] = useState(0);
  const [bedPeriod, setBedPeriod] = useState<"AM" | "PM">("PM");
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const wakeTime = useMemo(() => to24Hour(wakeHour, wakeMinute, wakePeriod), [wakeHour, wakeMinute, wakePeriod]);
  const bedTime = useMemo(() => to24Hour(bedHour, bedMinute, bedPeriod), [bedHour, bedMinute, bedPeriod]);

  const goNext = () => setScreen((prev) => Math.min(prev + 1, 8));
  const goBack = () => setScreen((prev) => Math.max(prev - 1, 2));

  const toggleGoal = (id: string) => {
    setGoals((prev) => {
      if (prev.includes(id)) return prev.filter((g) => g !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const addCustomGoal = () => {
    const trimmed = customGoal.trim();
    if (!trimmed || goals.length >= 5) return;
    setGoals((prev) => [...prev, trimmed]);
    setCustomGoal("");
    setShowCustomGoal(false);
  };

  const canContinue = () => {
    if (screen === 1) return fullName.trim().length > 0 && email.trim().length > 0 && password.length >= 8;
    if (screen === 2) return nickname.trim().length > 0;
    if (screen === 3) return goals.length > 0;
    if (screen === 4) return !!motivationStyle;
    return true;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.post("/onboarding/answers", {
        nickname: nickname.trim(),
        goals,
        motivation_style: motivationStyle,
        wake_time: wakeTime,
        bed_time: bedTime,
      });

      await api.post("/onboarding/complete");

      // Verify completion on server
      const response = await api.get("/auth/me");
      if (!response.data.onboarding_complete) {
        throw new Error("Onboarding was not marked complete on server");
      }

      // Update context with confirmed profile
      await refreshProfile();

      // Explicit navigation - don't rely on conditional rendering alone
      // Small delay to ensure state propagates
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }, 100);

    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || error?.message || "Failed to finish onboarding";
      Alert.alert(
        "Error",
        errorMsg + "\n\nPlease check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      // ALWAYS reset loading state
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {screen === 0 && (
        <View style={styles.splashContainer}>
          <View style={styles.splashBlobOne} />
          <View style={styles.splashBlobTwo} />
          <View style={styles.splashBlobThree} />

          <View style={{ flex: 1 }} />

          <View style={{ alignItems: "center" }}>
            <View style={styles.splashLogo}>
              <AppIcon name="leaf" size={44} color="#fff" />
            </View>
            <Text style={styles.splashTitle}>Sage</Text>
            <Text style={styles.splashSubtitle}>Your AI wellness companion</Text>
            <Text style={styles.splashBody}>
              Daily check-ins, mindful reflections, and gentle accountability to help you grow.
            </Text>
          </View>

          <View style={{ width: "100%", marginTop: 28 }}>
            <Pressable onPress={goNext} style={{ width: "100%" }}>
              <LinearGradient
                colors={[T.primary, T.accent]}
                style={styles.splashPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.splashPrimaryText}>Get Started</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.splashSecondary}>
              <Text style={styles.splashSecondaryText}>I already have an account</Text>
            </Pressable>
            <Text style={styles.splashFootnote}>
              By continuing, you agree to our <Text style={styles.splashLink}>Terms of Service</Text> and{" "}
              <Text style={styles.splashLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      )}

      {screen === 1 && (
        <ScrollView contentContainerStyle={styles.screenScroll} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            step={0}
            total={TOTAL_STEPS}
            onBack={goBack}
            title={
              <Text>
                Create your <Text style={styles.emphasis}>account</Text>
              </Text>
            }
            subtitle="Let's get you set up. This only takes a minute."
          />

          <View style={{ gap: 18 }}>
            <View>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={[styles.input, focused === "name" && styles.inputFocused]}
                placeholder="Your name"
                placeholderTextColor={T.textMuted}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
              />
            </View>

            <View>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.input, focused === "email" && styles.inputFocused]}
                placeholder="you@email.com"
                placeholderTextColor={T.textMuted}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={styles.fieldLabel}>Password</Text>
              <View>
                <TextInput
                  style={[styles.input, focused === "password" && styles.inputFocused, { paddingRight: 50 }]}
                  placeholder="Min 8 characters"
                  placeholderTextColor={T.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.passwordToggle}>
                  <AppIcon name={showPassword ? "eye-off" : "eye"} size={18} color={T.textMuted} />
                </Pressable>
              </View>
              <View style={styles.passwordStrength}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.passwordBar,
                      password.length >= i * 2
                        ? i <= 2
                          ? styles.passwordWarn
                          : styles.passwordStrong
                        : styles.passwordEmpty,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.passwordHint}>{password.length >= 8 ? "Strong password" : "Min 8 characters"}</Text>
            </View>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.socialButton}>
            <Text style={styles.socialText}>Continue with Google</Text>
          </Pressable>

          <View style={{ flex: 1 }} />

          <View style={{ paddingBottom: 16 }}>
            <ContinueButton onPress={goNext} disabled={!canContinue()} />
          </View>
        </ScrollView>
      )}

      {screen === 2 && (
        <View style={styles.screenContainer}>
          <ScreenHeader
            step={0}
            total={TOTAL_STEPS}
            onBack={screen > 2 ? goBack : undefined}
            title={
              <Text>
                What should we <Text style={styles.emphasis}>call you?</Text>
              </Text>
            }
            subtitle="Pick a name Sage will use when checking in with you."
          />

          <View style={styles.nicknameBody}>
            <View style={styles.nicknameAvatar}>
              {nickname ? (
                <Text style={styles.nicknameAvatarText}>{nickname.charAt(0).toUpperCase()}</Text>
              ) : (
                <AppIcon name="person-circle-outline" size={32} color={T.textMuted} />
              )}
            </View>

            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Your name"
              placeholderTextColor={T.textMuted}
              style={styles.nicknameInput}
            />

            {!nickname ? (
              <View style={styles.suggestionsRow}>
                <Text style={styles.suggestionsLabel}>Suggestions:</Text>
                {["Alex", "Lex", "A", "AJ"].map((name) => (
                  <Pressable key={name} onPress={() => setNickname(name)} style={styles.suggestionPill}>
                    <Text style={styles.suggestionPillText}>{name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.nicknameHint}>
                Hey <Text style={styles.nicknameEmphasis}>{nickname}</Text>, nice to meet you!
              </Text>
            )}
          </View>

          <View style={{ paddingBottom: 16 }}>
            <ContinueButton onPress={goNext} disabled={!canContinue()} />
          </View>
        </View>
      )}

      {screen === 3 && (
        <View style={styles.screenContainer}>
          <ScreenHeader
            step={1}
            total={TOTAL_STEPS}
            onBack={goBack}
            title={
              <Text>
                What are you <Text style={styles.emphasis}>working toward?</Text>
              </Text>
            }
            subtitle={`Choose up to 5 goals. ${goals.length}/5 selected`}
          />

          <ScrollView contentContainerStyle={styles.goalGrid} showsVerticalScrollIndicator={false}>
            {GOAL_PRESETS.map((preset) => {
              const active = goals.includes(preset.id);
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => toggleGoal(preset.id)}
                  style={[styles.goalCard, active && styles.goalCardActive]}
                >
                  <AppIcon
                    name={preset.icon as React.ComponentProps<typeof AppIcon>["name"]}
                    size={22}
                    color={active ? T.primary : T.text}
                    style={styles.goalIcon}
                  />
                  <Text style={[styles.goalLabel, active && styles.goalLabelActive]}>{preset.label}</Text>
                  {active && (
                    <AppIcon
                      name="checkmark"
                      size={14}
                      color="#fff"
                      style={styles.goalCheck}
                    />
                  )}
                </Pressable>
              );
            })}

            <Pressable onPress={() => setShowCustomGoal(true)} style={styles.customGoalCard}>
              {showCustomGoal ? (
                <View style={styles.customGoalInputRow}>
                  <TextInput
                    value={customGoal}
                    onChangeText={setCustomGoal}
                    placeholder="Type your own goal..."
                    placeholderTextColor={T.textMuted}
                    style={styles.customGoalInput}
                  />
                  <Pressable onPress={addCustomGoal} style={styles.customGoalAdd}>
                    <Text style={styles.customGoalAddText}>Add</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <AppIcon name="add" size={20} color={T.textMuted} />
                  <Text style={styles.customGoalLabel}>Add your own</Text>
                </>
              )}
            </Pressable>
          </ScrollView>

          <View style={{ paddingBottom: 16 }}>
            <ContinueButton onPress={goNext} disabled={!canContinue()} />
          </View>
        </View>
      )}

      {screen === 4 && (
        <View style={styles.screenContainer}>
          <ScreenHeader
            step={2}
            total={TOTAL_STEPS}
            onBack={goBack}
            title={
              <Text>
                How should Sage <Text style={styles.emphasis}>talk to you?</Text>
              </Text>
            }
            subtitle="This shapes how Sage checks in, nudges, and motivates you."
          />

          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
            {MOTIVATION_OPTIONS.map((opt) => {
              const active = motivationStyle === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setMotivationStyle(opt.id)}
                  style={[styles.motivationCard, active && styles.motivationCardActive]}
                >
                  <View style={[styles.motivationEmoji, active && styles.motivationEmojiActive]}>
                    <AppIcon
                      name={opt.icon as React.ComponentProps<typeof AppIcon>["name"]}
                      size={24}
                      color={active ? T.primary : T.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.motivationTitle, active && styles.motivationTitleActive]}>{opt.title}</Text>
                    <Text style={styles.motivationDesc}>{opt.desc}</Text>
                  </View>
                  <View style={[styles.motivationRadio, active && styles.motivationRadioActive]}>
                    {active ? <AppIcon name="checkmark" size={12} color="#fff" /> : null}
                  </View>
                  {active ? (
                    <View style={styles.motivationPreview}>
                      <Text style={styles.motivationPreviewLabel}>Preview</Text>
                      <Text style={styles.motivationPreviewText}>{opt.preview}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ paddingBottom: 16 }}>
            <ContinueButton onPress={goNext} disabled={!canContinue()} />
          </View>
        </View>
      )}

      {screen === 5 && (
        <View style={styles.screenContainer}>
          <ScreenHeader
            step={3}
            total={TOTAL_STEPS}
            onBack={goBack}
            title={
              <Text>
                When do you <Text style={styles.emphasis}>wake up?</Text>
              </Text>
            }
            subtitle="Sage will send your morning brief at this time."
          />

          <View style={styles.timeBody}>
            <View style={styles.sunIcon}>
              <AppIcon name="sunny" size={34} color="#fff" />
            </View>
            <View style={styles.timeRow}>
              <TimeWheel values={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} value={wakeHour} onChange={setWakeHour} />
              <Text style={styles.timeSeparator}>:</Text>
              <TimeWheel values={[0, 15, 30, 45]} value={wakeMinute} onChange={setWakeMinute} />
              <TimeWheel values={["AM", "PM"]} value={wakePeriod} onChange={setWakePeriod} />
            </View>
            <Text style={styles.timeHint}>
              Your morning brief arrives at{" "}
              <Text style={styles.timeHighlight}>
                {wakeHour}:{String(wakeMinute).padStart(2, "0")} {wakePeriod}
              </Text>
            </Text>
          </View>

          <View style={{ paddingBottom: 16 }}>
            <ContinueButton onPress={goNext} />
          </View>
        </View>
      )}

      {screen === 6 && (
        <View style={styles.screenContainer}>
          <ScreenHeader
            step={4}
            total={TOTAL_STEPS}
            onBack={goBack}
            title={
              <Text>
                When do you go <Text style={styles.emphasis}>to bed?</Text>
              </Text>
            }
            subtitle="Sage will prompt your evening reflection 1 hour before."
          />

          <View style={styles.timeBody}>
            <View style={styles.moonIcon}>
              <AppIcon name="moon" size={32} color="#fff" />
            </View>
            <View style={styles.timeRow}>
              <TimeWheel values={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} value={bedHour} onChange={setBedHour} />
              <Text style={styles.timeSeparator}>:</Text>
              <TimeWheel values={[0, 15, 30, 45]} value={bedMinute} onChange={setBedMinute} />
              <TimeWheel values={["AM", "PM"]} value={bedPeriod} onChange={setBedPeriod} />
            </View>
            <Text style={styles.timeHint}>
              Evening reflection at{" "}
              <Text style={styles.timeHighlight}>
                {bedHour === 1 && bedPeriod === "AM" ? "12" : bedHour - 1}:{String(bedMinute).padStart(2, "0")}{" "}
                {bedPeriod}
              </Text>
            </Text>
          </View>

          <View style={{ paddingBottom: 16 }}>
            <ContinueButton onPress={goNext} />
          </View>
        </View>
      )}

      {screen === 7 && (
        <View style={styles.screenContainer}>
          <ScreenHeader
            step={5}
            total={TOTAL_STEPS}
            onBack={goBack}
            title={
              <Text>
                Connect your <Text style={styles.emphasis}>world</Text>
              </Text>
            }
            subtitle="The more Sage knows, the smarter your nudges become."
          />

          <View style={{ gap: 14 }}>
            {[
              {
                id: "google",
                name: "Google Calendar & Gmail",
                desc: "Sync events, deadlines, and commitments",
              },
              {
                id: "todoist",
                name: "Todoist",
                desc: "Import tasks, projects, and deadlines",
              },
            ].map((integration) => {
              const isConnected = !!connected[integration.id];
              return (
                <View key={integration.id} style={styles.integrationCard}>
                  <View style={styles.integrationHeader}>
                    <View style={styles.integrationIcon}>
                      <AppIcon
                        name={integration.id === "google" ? "calendar" : "checkmark-circle"}
                        size={20}
                        color={T.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.integrationTitle}>{integration.name}</Text>
                      <Text style={styles.integrationDesc}>{integration.desc}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setConnected((prev) => ({ ...prev, [integration.id]: !isConnected }))}
                    style={[styles.integrationButton, isConnected && styles.integrationButtonActive]}
                  >
                    <Text style={[styles.integrationButtonText, isConnected && styles.integrationButtonTextActive]}>
                      {isConnected ? "Connected" : "Connect"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}

            <View style={styles.infoCallout}>
              <AppIcon name="information-circle" size={18} color={T.primary} />
              <Text style={styles.infoText}>
                Your data stays private. Sage only reads calendar events and task names — never your email content.
              </Text>
            </View>
          </View>

          <View style={{ paddingBottom: 16, paddingTop: 16, alignItems: "center" }}>
            <ContinueButton
              onPress={goNext}
              label={Object.keys(connected).length ? "Continue" : "Continue without connecting"}
            />
            {!Object.keys(connected).length ? <SkipLink onPress={goNext} /> : null}
          </View>
        </View>
      )}

      {screen === 8 && (
        <View style={styles.allSetContainer}>
          <View style={styles.allSetBadge}>
            <AppIcon name="checkmark" size={40} color="#fff" />
          </View>
          <Text style={styles.allSetTitle}>You're all set!</Text>
          <Text style={styles.allSetSubtitle}>
            Sage is ready to be your companion.{"\n"}Here's what to expect:
          </Text>

          <View style={{ gap: 10, width: "100%", marginBottom: 30 }}>
            {[
              {
                icon: "sunny",
                title: "Morning brief",
                desc: `at ${wakeHour}:${String(wakeMinute).padStart(2, "0")} ${wakePeriod}`,
              },
              { icon: "notifications", title: "Smart nudges", desc: "3 per day" },
              {
                icon: "moon",
                title: "Evening check-in",
                desc: `at ${bedHour === 1 && bedPeriod === "AM" ? "12" : bedHour - 1}:${String(bedMinute).padStart(
                  2,
                  "0"
                )} ${bedPeriod}`,
              },
            ].map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <AppIcon name={feature.icon} size={22} color={T.primary} style={styles.featureIcon} />
                <View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable onPress={handleFinish} disabled={loading} style={{ width: "100%" }}>
            <LinearGradient
              colors={loading ? [T.borderLight, T.borderLight] : [T.primary, T.accent]}
              style={styles.allSetButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.allSetButtonText}>Start my journey</Text>}
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  screenContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  screenScroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16 },
  progressRow: { flexDirection: "row", gap: 6, paddingHorizontal: 4 },
  progressBar: { flex: 1, height: 3.5, borderRadius: 4 },
  progressInactive: { backgroundColor: T.borderLight },
  progressCurrent: { backgroundColor: T.primarySoft },
  headerRow: { height: 32, justifyContent: "center" },
  backButton: { padding: 4, marginLeft: -4, width: 28, height: 28, justifyContent: "center", alignItems: "center" },
  backIcon: { fontSize: 28, color: T.text },
  screenTitle: {
    fontFamily: T.fontDisplay,
    fontSize: 30,
    color: T.text,
    marginBottom: 8,
    fontWeight: "400",
    lineHeight: 34,
  },
  screenSubtitle: { fontFamily: T.font, fontSize: 15, color: T.textSecondary, lineHeight: 22 },
  emphasis: { fontStyle: "italic", color: T.primary },
  continueButton: {
    width: "100%",
    paddingVertical: 17,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  continueButtonDisabled: { opacity: 0.7 },
  continueText: { color: "#fff", fontFamily: T.fontSemiBold, fontSize: 16 },
  continueTextDisabled: { color: T.textMuted },
  skipLink: { fontFamily: T.font, fontSize: 14, color: T.textMuted, paddingVertical: 12 },
  input: {
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: T.font,
    color: T.text,
    borderWidth: 1.5,
    borderColor: T.border,
  },
  inputFocused: {
    borderColor: T.primary,
    shadowColor: T.primary,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fieldLabel: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
    color: T.textSecondary,
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  passwordToggle: { position: "absolute", right: 14, top: 18 },
  passwordStrength: { flexDirection: "row", gap: 4, marginTop: 10 },
  passwordBar: { flex: 1, height: 3, borderRadius: 3 },
  passwordWarn: { backgroundColor: T.warning },
  passwordStrong: { backgroundColor: T.success },
  passwordEmpty: { backgroundColor: T.borderLight },
  passwordHint: { fontFamily: T.font, fontSize: 11, color: T.textMuted, marginTop: 6 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 16, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { fontFamily: T.font, fontSize: 12, color: T.textMuted, fontWeight: "500" },
  socialButton: {
    paddingVertical: 15,
    borderRadius: T.radiusSm,
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: "center",
    backgroundColor: T.bgCard,
  },
  socialText: { fontFamily: T.font, fontSize: 15, color: T.text, fontWeight: "500" },
  nicknameBody: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -20 },
  nicknameAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: T.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  nicknameAvatarText: { fontSize: 32, color: "#fff", fontFamily: T.fontDisplay },
  nicknameInput: {
    width: "100%",
    maxWidth: 260,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: T.border,
    fontFamily: T.fontDisplay,
    fontSize: 28,
    textAlign: "center",
    color: T.text,
  },
  suggestionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 },
  suggestionsLabel: { fontFamily: T.font, fontSize: 13, color: T.textMuted },
  suggestionPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: T.bgCard,
    borderWidth: 1.5,
    borderColor: T.border,
  },
  suggestionPillText: { fontFamily: T.font, fontSize: 14, color: T.text, fontWeight: "500" },
  nicknameHint: { fontFamily: T.font, fontSize: 15, color: T.textSecondary, marginTop: 10 },
  nicknameEmphasis: { color: T.primary, fontWeight: "600" },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 16,
  },
  goalCard: {
    width: "48%",
    padding: 16,
    borderRadius: T.radiusSm,
    borderWidth: 2,
    borderColor: T.borderLight,
    backgroundColor: T.bgCard,
    gap: 8,
  },
  goalCardActive: { borderColor: T.primary, backgroundColor: `${T.primary}08` },
  goalIcon: { marginBottom: 6 },
  goalLabel: { fontFamily: T.font, fontSize: 13.5, color: T.text, fontWeight: "600" },
  goalLabelActive: { color: T.primary },
  goalCheck: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: T.primary,
    borderRadius: 10,
    padding: 3,
  },
  customGoalCard: {
    width: "100%",
    padding: 16,
    borderRadius: T.radiusSm,
    borderWidth: 2,
    borderColor: T.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: T.surface,
  },
  customGoalLabel: { fontFamily: T.font, fontSize: 13.5, color: T.textMuted, fontWeight: "500" },
  customGoalInputRow: { flexDirection: "row", gap: 8, alignItems: "center", width: "100%" },
  customGoalInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: T.radiusXs,
    borderWidth: 1.5,
    borderColor: T.primary,
    backgroundColor: "#fff",
    fontFamily: T.font,
    fontSize: 14,
  },
  customGoalAdd: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: T.radiusXs,
    backgroundColor: T.primary,
  },
  customGoalAddText: { color: "#fff", fontFamily: T.fontSemiBold, fontSize: 13 },
  motivationCard: {
    padding: 18,
    borderRadius: T.radius,
    borderWidth: 2,
    borderColor: T.borderLight,
    backgroundColor: T.bgCard,
    gap: 12,
  },
  motivationCardActive: {
    borderColor: T.primary,
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowMdOpacity,
    shadowRadius: T.shadowMdRadius,
    shadowOffset: { width: 0, height: 4 },
  },
  motivationEmoji: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  motivationEmojiActive: { backgroundColor: `${T.primary}10` },
  motivationTitle: { fontFamily: T.fontSemiBold, fontSize: 16, color: T.text },
  motivationTitleActive: { color: T.primary },
  motivationDesc: { fontFamily: T.font, fontSize: 13, color: T.textSecondary, marginTop: 2 },
  motivationRadio: {
    position: "absolute",
    right: 18,
    top: 18,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  motivationRadioActive: { borderColor: T.primary, backgroundColor: T.primary },
  motivationPreview: {
    marginTop: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: `${T.primary}08`,
    borderWidth: 1,
    borderColor: `${T.primary}12`,
  },
  motivationPreviewLabel: {
    fontFamily: T.fontSemiBold,
    fontSize: 11,
    color: T.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  motivationPreviewText: { fontFamily: T.font, fontSize: 13.5, color: T.textSecondary, fontStyle: "italic" },
  timeBody: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -20 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  timeSeparator: { fontFamily: T.fontDisplay, fontSize: 48, color: T.textMuted, marginBottom: 6 },
  timeHint: { fontFamily: T.font, fontSize: 14, color: T.textSecondary, textAlign: "center" },
  timeHighlight: { color: T.primary, fontWeight: "600" },
  timeWheel: { alignItems: "center", gap: 2 },
  timeWheelArrow: { padding: 6 },
  timeWheelArrowText: { fontSize: 18, color: T.textMuted },
  timeWheelFaded: { fontFamily: T.fontDisplay, fontSize: 24, color: T.textMuted, opacity: 0.4 },
  timeWheelCurrent: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: `${T.primary}08` },
  timeWheelCurrentText: { fontFamily: T.fontDisplay, fontSize: 52, color: T.text },
  sunIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFD166",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  moonIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3A0CA3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  integrationCard: {
    padding: 20,
    borderRadius: T.radius,
    borderWidth: 1.5,
    borderColor: T.borderLight,
    backgroundColor: T.bgCard,
  },
  integrationHeader: { flexDirection: "row", gap: 16, marginBottom: 14, alignItems: "center" },
  integrationIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  integrationTitle: { fontFamily: T.fontSemiBold, fontSize: 16, color: T.text },
  integrationDesc: { fontFamily: T.font, fontSize: 13, color: T.textSecondary, marginTop: 2 },
  integrationButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.primarySoft,
    backgroundColor: `${T.primary}08`,
  },
  integrationButtonActive: { backgroundColor: T.successSoft, borderColor: `${T.success}30` },
  integrationButtonText: { fontFamily: T.fontSemiBold, fontSize: 14, color: T.primary },
  integrationButtonTextActive: { color: T.success },
  infoCallout: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: T.radiusSm,
    backgroundColor: `${T.primary}06`,
    borderWidth: 1,
    borderColor: `${T.primary}10`,
  },
  infoText: { fontFamily: T.font, fontSize: 13, color: T.textSecondary, lineHeight: 18, flex: 1 },
  allSetContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  allSetBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  allSetTitle: { fontFamily: T.fontDisplay, fontSize: 34, color: T.text, marginBottom: 8 },
  allSetSubtitle: { fontFamily: T.font, fontSize: 16, color: T.textSecondary, textAlign: "center", marginBottom: 24 },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: T.radiusSm,
    backgroundColor: T.bgCard,
    width: "100%",
  },
  featureIcon: { marginRight: 4 },
  featureTitle: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.text },
  featureDesc: { fontFamily: T.font, fontSize: 13, color: T.textMuted },
  allSetButton: {
    paddingVertical: 18,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  allSetButtonText: { fontFamily: T.fontSemiBold, fontSize: 17, color: "#fff" },
  splashContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "space-between",
  },
  splashLogo: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  splashTitle: { fontFamily: T.fontDisplay, fontSize: 48, color: T.text, marginBottom: 8 },
  splashSubtitle: { fontFamily: T.font, fontSize: 17, color: T.textSecondary, marginBottom: 6 },
  splashBody: {
    fontFamily: T.font,
    fontSize: 14,
    color: T.textMuted,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  splashPrimary: {
    paddingVertical: 18,
    borderRadius: 56,
    alignItems: "center",
    marginBottom: 14,
  },
  splashPrimaryText: { fontFamily: T.fontSemiBold, fontSize: 17, color: "#fff" },
  splashSecondary: {
    paddingVertical: 16,
    borderRadius: 56,
    borderWidth: 1.5,
    borderColor: T.primarySoft,
    alignItems: "center",
    backgroundColor: T.bgCard,
  },
  splashSecondaryText: { fontFamily: T.fontSemiBold, fontSize: 16, color: T.primary },
  splashFootnote: { fontFamily: T.font, fontSize: 12, color: T.textMuted, marginTop: 16, textAlign: "center" },
  splashLink: { color: T.primary, fontWeight: "600" },
  splashBlobOne: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: `${T.accent}08`,
  },
  splashBlobTwo: {
    position: "absolute",
    bottom: 100,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: `${T.primary}06`,
  },
  splashBlobThree: {
    position: "absolute",
    top: 200,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${T.accentLight}08`,
  },
});

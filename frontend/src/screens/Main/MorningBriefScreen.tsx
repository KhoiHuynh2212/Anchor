import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { T } from "../../theme";
import api from "../../services/api";
import { ensurePlayableUri as _ensurePlayableUri } from "../../utils/audio";
import { useResponsive } from "../../hooks/useResponsive";

type BriefData = {
  text: string;
  nickname: string;
  audio_base64: string;
  calendar_events: Array<{ title: string; time?: string; duration?: string; color?: string }>;
  tasks: Array<{ title: string; due?: string; priority?: string; icon?: string }>;
};

export default function MorningBriefScreen() {
  const { s, fs, vs, horizontalPadding, isTablet } = useResponsive();
  const styles = makeStyles(s, fs, vs);

  const navigation: any = useNavigation();
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const playing = !!playerStatus.playing;
  const cachedAudioRef = useRef<{ key: string; uri: string } | null>(null);

  useEffect(() => {
    fetchBrief();
  }, []);

  useEffect(() => {
    // If the brief audio changes (or refreshes), stop playback and clear cache.
    cachedAudioRef.current = null;
    try {
      player.pause();
    } catch {
      // ignore
    }
  }, [brief?.audio_base64, player]);

  const fetchBrief = async () => {
    setLoading(true);
    try {
      const res = await api.get("/brief/today");
      setBrief(res.data);
    } catch (error: any) {
      Alert.alert("Error", "Could not load morning brief");
    } finally {
      setLoading(false);
    }
  };

  const ensurePlayableUri = async (source: string) => {
    // Use cached version if we already converted this exact audio
    const key = `${source.length}-${source.slice(0, 24)}`;
    if (cachedAudioRef.current?.key === key) return cachedAudioRef.current.uri;

    const uri = await _ensurePlayableUri(source, "brief");
    cachedAudioRef.current = { key, uri };
    return uri;
  };

  const toggleAudio = async () => {
    if (!brief?.audio_base64) return;

    try {
      if (playing) {
        player.pause();
        return;
      }

      const uri = await ensurePlayableUri(brief.audio_base64);
      player.replace(uri);

      // If we previously finished playback, seek back to start before playing again.
      const atEnd =
        (playerStatus?.duration ?? 0) > 0 &&
        (playerStatus?.currentTime ?? 0) >= (playerStatus?.duration ?? 0) - 0.05;
      if (atEnd) {
        await player.seekTo(0);
      }

      player.play();
    } catch (e) {
      console.log("Audio playback error:", e);
    }
  };

  const getDate = () => {
    const d = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  };

  const getEventColor = (color?: string) => color || T.primary;

  const getPriorityStyle = (priority?: string) => {
    if (priority === "high") return { bg: T.danger + "15", color: T.danger };
    if (priority === "medium") return { bg: T.warningSoft, color: T.warning };
    return { bg: T.surface, color: T.textMuted };
  };

  const getTaskIcon = (icon?: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      target: "flag",
      book: "book",
      message: "chatbubble",
      file: "document-text",
    };
    return icons[icon || ""] || "ellipse";
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = (): string => {
    const current = playerStatus?.currentTime ?? 0;
    const total = playerStatus?.duration ?? 0;
    if (total <= 0 || current <= 0) return "0%";
    const percentage = Math.min(100, (current / total) * 100);
    return `${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={styles.loadingText}>Preparing your morning brief...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: s(130) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchBrief();
              setRefreshing(false);
            }}
            tintColor={T.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerGradient}>
          <View style={styles.headerRow}>
            <Pressable style={styles.nudgesButton} onPress={() => navigation.navigate("Nudges")}>
              <Ionicons name="notifications-outline" size={s(18)} color="rgba(0,119,182,0.5)" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateText}>{getDate()}</Text>
              <Text style={styles.greetingText}>
                {greeting()}, {brief?.nickname || "friend"}
              </Text>
            </View>
            <Pressable onPress={() => navigation.navigate("Settings")}>
              <LinearGradient
                colors={[T.primary, T.accent]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{(brief?.nickname || "A").charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Morning Brief Card */}
          <LinearGradient
            colors={[T.primary, T.primaryDark]}
            style={styles.briefCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.briefBlobOne} />
            <View style={styles.briefBlobTwo} />

            <View style={styles.briefLabelRow}>
              <Ionicons name="sparkles" size={s(14)} color={T.accentLight} />
              <Text style={styles.briefLabel}>Morning Brief</Text>
            </View>

            <Text style={styles.briefPreview} numberOfLines={3}>
              {brief?.text || "Your daily brief is ready."}
            </Text>

            <View style={styles.briefControlsRow}>
              <Pressable
                style={styles.playButton}
                onPress={toggleAudio}
                disabled={!brief?.audio_base64}
              >
                <Ionicons name={playing ? "pause" : "play"} size={s(18)} color="#fff" />
              </Pressable>
              <View style={{ flex: 1 }}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: getProgressPercentage() }]} />
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatTime(playerStatus?.currentTime ?? 0)}</Text>
                  <Text style={styles.timeText}>{formatTime(playerStatus?.duration ?? 0)}</Text>
                </View>
              </View>
            </View>

            {!brief?.audio_base64 ? <Text style={styles.noAudioText}>Audio not available</Text> : null}
          </LinearGradient>
        </View>

        <View style={[{ paddingHorizontal: s(24) }, isTablet && { paddingHorizontal: horizontalPadding }]}>
          {/* Today's Focus */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today's Focus</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s(12) }}>
            {(brief?.tasks || []).slice(0, 6).map((task, i) => {
              const ps = getPriorityStyle(task.priority);
              const dueColor =
                task.due === "Today" ? T.danger : task.due?.toLowerCase().includes("tomorrow") ? T.warning : ps.color;

              return (
                <View key={i} style={styles.focusCard}>
                  <Ionicons
                    name={task.icon ? getTaskIcon(task.icon) : "flag"}
                    size={s(22)}
                    color={T.text}
                    style={styles.focusIcon}
                  />
                  <Text style={styles.focusTitle} numberOfLines={2}>
                    {task.title}
                  </Text>
                  {!!task.due ? (
                    <Text style={[styles.focusDue, { color: dueColor }]} numberOfLines={1}>
                      {task.due}
                    </Text>
                  ) : (
                    <View style={{ height: s(16) }} />
                  )}
                  <View style={styles.focusProgressTrack}>
                    <LinearGradient
                      colors={[T.primary, T.accent]}
                      style={[styles.focusProgressFill, { width: `${Math.min(90, 25 + i * 12)}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Schedule */}
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {(brief?.calendar_events || []).map((evt, i) => (
            <View key={i} style={styles.eventCard}>
              <View style={[styles.eventBar, { backgroundColor: getEventColor(evt.color) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {evt.title}
                </Text>
                <Text style={styles.eventTime}>
                  {evt.time || ""} {evt.duration ? `· ${evt.duration}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={s(18)} color={T.textMuted} />
            </View>
          ))}

          {/* Talk to Sage */}
          <Pressable style={styles.talkCard} onPress={() => navigation.navigate("Voice")}>
            <LinearGradient
              colors={[T.primary, T.accent]}
              style={styles.talkIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="mic" size={s(20)} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.talkTitle}>Talk to Sage</Text>
              <Text style={styles.talkSubtitle}>Quick voice check-in anytime</Text>
            </View>
            <Ionicons name="chevron-forward" size={s(18)} color={T.primary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (s: (n: number) => number, fs: (n: number) => number, vs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" },
  loadingText: { color: T.textSecondary, fontSize: fs(14), fontFamily: T.font, marginTop: vs(16) },

  headerGradient: {
    backgroundColor: T.bgDeep,
    paddingHorizontal: s(24),
    paddingTop: vs(60),
    paddingBottom: s(20),
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: s(12), marginBottom: s(20) },
  dateText: { fontFamily: T.font, fontSize: fs(13), color: T.textMuted, marginBottom: s(2), fontWeight: "500" },
  greetingText: { fontFamily: T.fontDisplay, fontSize: fs(28), color: T.text, fontWeight: "400" },
  nudgesButton: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOpacity: 0.14,
    shadowRadius: s(16),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 4,
  },
  avatarText: { fontFamily: T.fontDisplay, fontSize: fs(20), color: "#fff" },

  briefCard: { borderRadius: T.radius, padding: s(20), overflow: "hidden" },
  briefBlobOne: {
    position: "absolute",
    top: s(-30),
    right: s(-30),
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  briefBlobTwo: {
    position: "absolute",
    bottom: s(-20),
    right: s(50),
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  briefLabelRow: { flexDirection: "row", alignItems: "center", gap: s(7), marginBottom: s(12) },
  briefLabel: {
    fontFamily: T.fontSemiBold,
    fontSize: fs(11),
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  briefPreview: { fontFamily: T.font, fontSize: fs(15), lineHeight: fs(23), color: "rgba(255,255,255,0.93)", marginBottom: s(16) },
  briefControlsRow: { flexDirection: "row", gap: s(12), alignItems: "center" },

  playButton: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarContainer: { height: s(3), borderRadius: s(3), backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: s(3), backgroundColor: "#fff" },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: s(5) },
  timeText: { fontFamily: T.font, fontSize: fs(10), color: "rgba(255,255,255,0.5)" },
  noAudioText: { fontFamily: T.font, fontSize: fs(12), color: "rgba(255,255,255,0.55)", marginTop: s(10), textAlign: "center" },

  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: s(18), marginBottom: s(14) },
  sectionTitle: {
    fontFamily: T.fontSemiBold,
    fontSize: fs(13),
    color: T.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: s(24),
    marginBottom: s(14),
  },
  seeAll: { fontFamily: T.fontSemiBold, fontSize: fs(12), color: T.primary },

  focusCard: {
    width: s(160),
    paddingVertical: s(18),
    paddingHorizontal: s(16),
    borderRadius: T.radiusSm,
    backgroundColor: T.bgCard,
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowOpacity,
    shadowRadius: s(T.shadowRadius),
    shadowOffset: { width: 0, height: s(2) },
    elevation: 2,
  },
  focusIcon: { marginBottom: s(10) },
  focusTitle: { fontFamily: T.fontSemiBold, fontSize: fs(14), color: T.text, lineHeight: fs(18), marginBottom: s(4) },
  focusDue: { fontFamily: T.fontSemiBold, fontSize: fs(12), marginBottom: s(10) },
  focusProgressTrack: { height: s(4), borderRadius: s(4), backgroundColor: T.borderLight, overflow: "hidden" },
  focusProgressFill: { height: "100%", borderRadius: s(4) },

  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(14),
    paddingVertical: s(13),
    paddingHorizontal: s(16),
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    marginBottom: s(8),
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowOpacity,
    shadowRadius: s(T.shadowRadius),
    shadowOffset: { width: 0, height: s(2) },
    elevation: 2,
  },
  eventBar: { width: s(3.5), height: s(36), borderRadius: s(4) },
  eventTitle: { fontFamily: T.fontMedium, fontSize: fs(14.5), color: T.text },
  eventTime: { fontFamily: T.font, fontSize: fs(12), color: T.textMuted, marginTop: s(2) },

  talkCard: {
    marginTop: s(20),
    padding: s(20),
    borderRadius: T.radius,
    backgroundColor: T.bgCard,
    borderWidth: 1.5,
    borderColor: T.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: s(16),
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowMdOpacity,
    shadowRadius: s(T.shadowMdRadius),
    shadowOffset: { width: 0, height: s(4) },
    elevation: 3,
  },
  talkIcon: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOpacity: 0.14,
    shadowRadius: s(16),
    shadowOffset: { width: 0, height: s(6) },
    elevation: 3,
  },
  talkTitle: { fontFamily: T.fontSemiBold, fontSize: fs(15), color: T.text },
  talkSubtitle: { fontFamily: T.font, fontSize: fs(13), color: T.textSecondary, marginTop: s(2) },
});

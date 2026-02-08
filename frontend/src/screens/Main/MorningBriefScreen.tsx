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
import * as FileSystem from "expo-file-system";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { T } from "../../theme";
import api from "../../services/api";

type BriefData = {
  text: string;
  nickname: string;
  audio_base64: string;
  calendar_events: Array<{ title: string; time?: string; duration?: string; color?: string }>;
  tasks: Array<{ title: string; due?: string; priority?: string; icon?: string }>;
};

export default function MorningBriefScreen() {
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

  const inferExtFromDataUri = (dataUri: string) => {
    const match = dataUri.match(/^data:([^;]+);base64,/i);
    const mime = match?.[1]?.toLowerCase();
    if (!mime) return "mp3";
    if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
    if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) return "m4a";
    if (mime.includes("wav")) return "wav";
    if (mime.includes("ogg")) return "ogg";
    return "mp3";
  };

  const ensurePlayableUri = async (source: string) => {
    const trimmed = source.trim();
    // If it's already a URL/file path, let expo-audio handle it.
    if (/^(https?:|file:|content:)/i.test(trimmed)) return trimmed;

    // If it's a data: URI, extract the base64 payload.
    let base64 = trimmed;
    let ext = "mp3";
    if (/^data:/i.test(trimmed)) {
      ext = inferExtFromDataUri(trimmed);
      const comma = trimmed.indexOf(",");
      base64 = comma >= 0 ? trimmed.slice(comma + 1) : "";
    }

    // If we can't cache to disk (e.g. web), fall back to original string.
    if (!FileSystem.cacheDirectory || !base64) return trimmed;

    const key = `${base64.length}-${base64.slice(0, 24)}`;
    if (cachedAudioRef.current?.key === key) return cachedAudioRef.current.uri;

    const safeKey = key.replace(/[^a-z0-9_-]/gi, "");
    const uri = `${FileSystem.cacheDirectory}brief-${safeKey}.${ext}`;
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
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
        contentContainerStyle={{ paddingBottom: 130 }}
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
              <Ionicons name="notifications-outline" size={20} color={T.primary} />
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
              <Ionicons name="sparkles" size={14} color={T.accentLight} />
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
                <Ionicons name={playing ? "pause" : "play"} size={18} color="#fff" />
              </Pressable>
              <View style={{ flex: 1 }}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: playing ? "35%" : "0%" }]} />
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{playing ? "0:32" : "0:00"}</Text>
                  <Text style={styles.timeText}>1:28</Text>
                </View>
              </View>
            </View>

            {!brief?.audio_base64 ? <Text style={styles.noAudioText}>Audio not available</Text> : null}
          </LinearGradient>
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          {/* Today's Focus */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today's Focus</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {(brief?.tasks || []).slice(0, 6).map((task, i) => {
              const ps = getPriorityStyle(task.priority);
              const dueColor =
                task.due === "Today" ? T.danger : task.due?.toLowerCase().includes("tomorrow") ? T.warning : ps.color;

              return (
                <View key={i} style={styles.focusCard}>
                  <Ionicons
                    name={task.icon ? getTaskIcon(task.icon) : "flag"}
                    size={22}
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
                    <View style={{ height: 16 }} />
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
              <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
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
              <Ionicons name="mic" size={20} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.talkTitle}>Talk to Sage</Text>
              <Text style={styles.talkSubtitle}>Quick voice check-in anytime</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={T.primary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, backgroundColor: T.bg, justifyContent: "center", alignItems: "center" },
  loadingText: { color: T.textSecondary, fontSize: 14, fontFamily: T.font, marginTop: 16 },

  headerGradient: {
    backgroundColor: T.bgDeep,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  dateText: { fontFamily: T.font, fontSize: 13, color: T.textMuted, marginBottom: 2, fontWeight: "500" },
  greetingText: { fontFamily: T.fontDisplay, fontSize: 28, color: T.text, fontWeight: "400" },
  nudgesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.bgCard,
    borderWidth: 1.5,
    borderColor: T.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatarText: { fontFamily: T.fontDisplay, fontSize: 20, color: "#fff" },

  briefCard: { borderRadius: T.radius, padding: 20, overflow: "hidden" },
  briefBlobOne: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  briefBlobTwo: {
    position: "absolute",
    bottom: -20,
    right: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  briefLabelRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 },
  briefLabel: {
    fontFamily: T.fontSemiBold,
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  briefPreview: { fontFamily: T.font, fontSize: 15, lineHeight: 23, color: "rgba(255,255,255,0.93)", marginBottom: 16 },
  briefControlsRow: { flexDirection: "row", gap: 12, alignItems: "center" },

  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarContainer: { height: 3, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 3, backgroundColor: "#fff" },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  timeText: { fontFamily: T.font, fontSize: 10, color: "rgba(255,255,255,0.5)" },
  noAudioText: { fontFamily: T.font, fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 10, textAlign: "center" },

  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 14 },
  sectionTitle: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
    color: T.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 14,
  },
  seeAll: { fontFamily: T.fontSemiBold, fontSize: 12, color: T.primary },

  focusCard: {
    width: 160,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: T.radiusSm,
    backgroundColor: T.bgCard,
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowOpacity,
    shadowRadius: T.shadowRadius,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  focusIcon: { marginBottom: 10 },
  focusTitle: { fontFamily: T.fontSemiBold, fontSize: 14, color: T.text, lineHeight: 18, marginBottom: 4 },
  focusDue: { fontFamily: T.fontSemiBold, fontSize: 12, marginBottom: 10 },
  focusProgressTrack: { height: 4, borderRadius: 4, backgroundColor: T.borderLight, overflow: "hidden" },
  focusProgressFill: { height: "100%", borderRadius: 4 },

  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    marginBottom: 8,
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowOpacity,
    shadowRadius: T.shadowRadius,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventBar: { width: 3.5, height: 36, borderRadius: 4 },
  eventTitle: { fontFamily: T.fontMedium, fontSize: 14.5, color: T.text },
  eventTime: { fontFamily: T.font, fontSize: 12, color: T.textMuted, marginTop: 2 },

  talkCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: T.radius,
    backgroundColor: T.bgCard,
    borderWidth: 1.5,
    borderColor: T.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowMdOpacity,
    shadowRadius: T.shadowMdRadius,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  talkIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  talkTitle: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.text },
  talkSubtitle: { fontFamily: T.font, fontSize: 13, color: T.textSecondary, marginTop: 2 },
});

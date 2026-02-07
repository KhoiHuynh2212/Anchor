import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Audio } from "expo-av";
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
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    fetchBrief();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

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

  const toggleAudio = async () => {
    if (!brief?.audio_base64) return;

    if (playing && soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlaying(false);
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setPlaying(true);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: brief.audio_base64 },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false);
        }
      });
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
    const icons: Record<string, string> = {
      target: "\uD83C\uDFAF",
      book: "\uD83D\uDCDA",
      message: "\uD83D\uDCAC",
      file: "\uD83D\uDCC4",
    };
    return icons[icon || ""] || "\u2022";
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
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
          <View>
            <Text style={styles.dateText}>{getDate()}</Text>
            <Text style={styles.greetingText}>
              Good morning, {brief?.nickname || "friend"}
            </Text>
          </View>
        </View>

        {/* Audio Player Card */}
        <View style={styles.audioCard}>
          <Text style={styles.audioLabel}>{"\u2728"} YOUR MORNING BRIEF</Text>
          <Text style={styles.audioPreview} numberOfLines={3}>
            {brief?.text?.substring(0, 150) || "Your daily brief is ready."}...
          </Text>
          <View style={styles.audioControls}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={toggleAudio}
              disabled={!brief?.audio_base64}
            >
              <Text style={styles.playIcon}>{playing ? "\u23F8" : "\u25B6"}</Text>
            </TouchableOpacity>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: playing ? "35%" : "0%" }]} />
            </View>
          </View>
          {!brief?.audio_base64 && (
            <Text style={styles.noAudioText}>Audio not available</Text>
          )}
        </View>
      </View>

      {/* Brief Text */}
      <View style={styles.section}>
        <Text style={styles.briefText}>{brief?.text}</Text>
      </View>

      {/* Today's Schedule */}
      {brief?.calendar_events && brief.calendar_events.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>
          {brief.calendar_events.map((evt, i) => (
            <View key={i} style={styles.eventCard}>
              <View style={[styles.eventDot, { backgroundColor: getEventColor(evt.color) }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{evt.title}</Text>
                <Text style={styles.eventTime}>
                  {evt.time || ""} {evt.duration ? `\u00B7 ${evt.duration}` : ""}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Priority Tasks */}
      {brief?.tasks && brief.tasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIORITY TASKS</Text>
          {brief.tasks.map((task, i) => {
            const ps = getPriorityStyle(task.priority);
            return (
              <View key={i} style={styles.taskCard}>
                <Text style={styles.taskIcon}>{getTaskIcon(task.icon)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text
                    style={[
                      styles.taskDue,
                      task.due === "Today" && { color: T.danger },
                    ]}
                  >
                    {task.due ? `Due ${task.due}` : ""}
                  </Text>
                </View>
                {task.priority && (
                  <View style={[styles.priorityBadge, { backgroundColor: ps.bg }]}>
                    <Text style={[styles.priorityText, { color: ps.color }]}>
                      {task.priority?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Start My Day Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.startDayButton}>
          <Text style={styles.startDayText}>Let's go!</Text>
        </TouchableOpacity>
      </View>
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
  loadingText: {
    color: T.textSecondary,
    fontSize: 14,
    marginTop: 16,
  },
  headerGradient: {
    backgroundColor: T.bgDeep,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  dateText: { fontSize: 14, color: T.textSecondary, marginBottom: 2 },
  greetingText: { fontSize: 28, fontWeight: "300", color: T.text },
  audioCard: {
    backgroundColor: T.primary,
    borderRadius: T.radius,
    padding: 22,
  },
  audioLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    marginBottom: 14,
  },
  audioPreview: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 24,
    marginBottom: 20,
  },
  audioControls: { flexDirection: "row", alignItems: "center", gap: 14 },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { color: "#fff", fontSize: 18 },
  progressBarContainer: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  noAudioText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 8,
    textAlign: "center",
  },
  section: { paddingHorizontal: 24, marginTop: 24 },
  briefText: {
    fontSize: 15,
    color: T.textSecondary,
    lineHeight: 24,
    backgroundColor: T.bgCard,
    padding: 18,
    borderRadius: T.radiusSm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: T.textMuted,
    letterSpacing: 1,
    marginBottom: 14,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  eventDot: { width: 4, height: 38, borderRadius: 4 },
  eventTitle: { fontSize: 15, fontWeight: "500", color: T.text },
  eventTime: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  taskIcon: { fontSize: 22 },
  taskTitle: { fontSize: 15, fontWeight: "500", color: T.text },
  taskDue: { fontSize: 12, color: T.textMuted, marginTop: 2 },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  startDayButton: {
    backgroundColor: T.primary,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  startDayText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

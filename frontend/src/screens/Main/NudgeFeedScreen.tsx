import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { T } from "../../theme";
import api from "../../services/api";
import AppIcon from "../../components/AppIcon";

type Nudge = {
  _id: string;
  type: string;
  title: string;
  body: string;
  emoji: string;
  status: string;
  scheduled_for: string;
};

const ICON_MAP: Record<string, React.ComponentProps<typeof AppIcon>["name"]> = {
  target: "flag",
  book: "book",
  message: "chatbubble",
  goal_check_in: "flag",
  deadline_reminder: "alarm",
  reflection_prompt: "chatbubble-ellipses",
};

const TYPE_LABELS: Record<string, string> = {
  goal_check_in: "Goal Check-in",
  deadline_reminder: "Deadline",
  reflection_prompt: "Reflection",
};

const TYPE_COLORS: Record<string, string> = {
  goal_check_in: T.accent,
  deadline_reminder: T.primary,
  reflection_prompt: T.success,
};

export default function NudgeFeedScreen() {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNudges();
  }, []);

  const fetchNudges = async () => {
    setLoading(true);
    try {
      const res = await api.get("/nudges");
      setNudges(res.data.nudges || []);
    } catch {
      Alert.alert("Error", "Could not load nudges");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (nudgeId: string) => {
    if (!responseText.trim()) return;
    setResponding(true);
    try {
      await api.post(`/nudges/${nudgeId}/respond`, {
        response_text: responseText.trim(),
      });
      setResponseText("");
      setExpandedId(null);
      fetchNudges();
    } catch {
      Alert.alert("Error", "Could not submit response");
    } finally {
      setResponding(false);
    }
  };

  const handleSnooze = async (nudgeId: string) => {
    try {
      await api.post(`/nudges/${nudgeId}/snooze`, { snooze_minutes: 30 });
      fetchNudges();
    } catch {
      Alert.alert("Error", "Could not snooze nudge");
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const renderNudge = useCallback(
    ({ item, index }: { item: Nudge; index: number }) => {
      const isExpanded = expandedId === item._id;
      const color = TYPE_COLORS[item.type] || T.primary;
      const isPending = item.status === "pending";
      const isResponded = item.status === "responded";

      return (
        <View style={styles.nudgeRow}>
          {/* Timeline dot */}
          <View style={styles.timelineColumn}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isPending ? T.border : color,
                  borderWidth: isPending ? 2 : 0,
                  borderColor: isPending ? T.textMuted : "transparent",
                },
                !isPending && { shadowColor: color, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
              ]}
            />
            {index < nudges.length - 1 && <View style={styles.timelineLine} />}
          </View>

          {/* Card */}
          <Pressable
            style={[
              styles.nudgeCard,
              isPending && styles.nudgeCardPending,
              isExpanded && { borderColor: `${color}30`, borderWidth: 1.5 },
            ]}
            onPress={() => setExpandedId(isExpanded ? null : item._id)}
          >
            <View style={styles.nudgeHeader}>
              <View style={styles.nudgeTypeRow}>
                <AppIcon
                  name={ICON_MAP[item.emoji] || ICON_MAP[item.type] || "sparkles"}
                  size={18}
                  color={color}
                />
                <Text style={[styles.nudgeType, { color }]}>
                  {TYPE_LABELS[item.type] || item.type}
                </Text>
              </View>
              <Text style={styles.nudgeTime}>{formatTime(item.scheduled_for)}</Text>
            </View>

            <Text style={styles.nudgeTitle}>{item.title}</Text>
            {isExpanded ? (
              <Text style={styles.nudgeBody}>{item.body}</Text>
            ) : null}

            {/* Actions */}
            {isExpanded ? (
              <View style={styles.actionRow}>
                {isResponded ? (
                  <View style={styles.doneBadge}>
                    <View style={styles.doneRow}>
                      <AppIcon name="checkmark" size={14} color={T.success} />
                      <Text style={styles.doneText}>Completed</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: `${color}12` }]}
                      onPress={() => setExpandedId(item._id)}
                    >
                      <Text style={[styles.actionButtonText, { color }]}>On it!</Text>
                    </Pressable>
                    <Pressable style={styles.snoozeButton} onPress={() => handleSnooze(item._id)}>
                      <Text style={styles.snoozeText}>Snooze</Text>
                    </Pressable>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.collapsedHintRow}>
                <Text style={styles.collapsedHint}>Tap to expand</Text>
              </View>
            )}

            {/* Expanded response input */}
            {isExpanded && !isResponded && (
              <View style={styles.responseRow}>
                <TextInput
                  style={styles.responseInput}
                  placeholder="Quick response..."
                  placeholderTextColor={T.textMuted}
                  value={responseText}
                  onChangeText={setResponseText}
                  onSubmitEditing={() => handleRespond(item._id)}
                />
                <Pressable
                  style={styles.responseSend}
                  onPress={() => handleRespond(item._id)}
                  disabled={responding}
                >
                  {responding ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <AppIcon name="arrow-up" size={18} color="#fff" />
                  )}
                </Pressable>
              </View>
            )}
          </Pressable>
        </View>
      );
    },
    [expandedId, responseText, nudges.length, responding]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.heading}>Nudges</Text>
            <Text style={styles.subheading}>{nudges.length} check-ins today</Text>
          </View>
          <View style={styles.filterRow}>
            <View style={[styles.filterChip, styles.filterChipActive]}>
              <Text style={[styles.filterChipText, styles.filterChipTextActive]}>All</Text>
            </View>
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Active</Text>
            </View>
          </View>
        </View>
      </View>

      {nudges.length === 0 ? (
        <View style={styles.emptyState}>
          <AppIcon name="notifications-outline" size={48} color={T.textMuted} />
          <Text style={styles.emptyText}>No nudges yet</Text>
          <Text style={styles.emptySubtext}>
            Anchor will send you personalized check-ins as you use the app.
          </Text>
        </View>
      ) : (
        <FlatList
          data={nudges}
          renderItem={renderNudge}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 130 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchNudges();
                setRefreshing(false);
              }}
              tintColor={T.primary}
            />
          }
        />
      )}
    </View>
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
  headerSection: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 10 },
  heading: { fontSize: 28, fontFamily: T.fontDisplay, color: T.text, marginBottom: 4 },
  subheading: { fontSize: 14, fontFamily: T.font, color: T.textSecondary },
  filterRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: T.bgCard,
    borderWidth: 1.5,
    borderColor: T.borderLight,
  },
  filterChipActive: { backgroundColor: `${T.primary}10`, borderColor: T.primary },
  filterChipText: { fontFamily: T.fontSemiBold, fontSize: 12, color: T.textMuted },
  filterChipTextActive: { color: T.primary },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { fontSize: 18, fontFamily: T.fontSemiBold, color: T.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, fontFamily: T.font, color: T.textSecondary, textAlign: "center" },
  nudgeRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  timelineColumn: { alignItems: "center", paddingTop: 2, width: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: T.border, marginTop: 4 },
  nudgeCard: {
    flex: 1,
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    padding: 18,
    shadowColor: T.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: T.shadowOpacity,
    shadowRadius: T.shadowRadius,
    elevation: 2,
  },
  nudgeCardPending: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: T.border,
  },
  nudgeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  nudgeTypeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  nudgeType: {
    fontSize: 11,
    fontFamily: T.fontSemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  nudgeTime: { fontSize: 12, fontFamily: T.font, color: T.textMuted },
  nudgeTitle: { fontSize: 16, fontFamily: T.fontSemiBold, color: T.text, marginBottom: 6 },
  nudgeBody: { fontSize: 14, fontFamily: T.font, color: T.textSecondary, lineHeight: 21, marginBottom: 14 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  actionButtonText: { fontSize: 13, fontFamily: T.fontSemiBold },
  snoozeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: T.surface,
  },
  snoozeText: { fontSize: 13, fontFamily: T.fontMedium, color: T.textMuted },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: T.successSoft,
  },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  doneText: { fontSize: 13, fontFamily: T.fontMedium, color: T.success },
  collapsedHintRow: { marginTop: 10 },
  collapsedHint: { fontFamily: T.font, fontSize: 12, color: T.textMuted },
  responseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  responseInput: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: T.font,
    color: T.text,
  },
  responseSend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

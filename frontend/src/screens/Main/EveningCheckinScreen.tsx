import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { T } from "../../theme";
import api from "../../services/api";
import AppIcon from "../../components/AppIcon";
import { useResponsive } from "../../hooks/useResponsive";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Insights = {
  mood: string;
  accomplishments: string[];
  blockers: string[];
  action_items: string[];
};

export default function EveningCheckinScreen() {
  const navigation = useNavigation<any>();
  const { s, fs, vs, horizontalPadding, isTablet } = useResponsive();
  const styles = makeStyles(s, fs, vs);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const startCheckin = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const res = await api.post("/checkin/start", { voice_mode: false });
      const data = res.data;
      setConversationId(data.conversation_id);
      const aiMsg: Message = {
        role: "assistant",
        content: data.ai_response,
      };
      setMessages([aiMsg]);
    } catch (error: any) {
      Alert.alert("Error", "Could not start check-in");
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText || loading || !conversationId) return;

    const userMsg: Message = {
      role: "user",
      content: messageText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/checkin/message", {
        message: messageText,
        conversation_id: conversationId,
        voice_mode: false,
      });

      const data = res.data;
      const aiMsg: Message = {
        role: "assistant",
        content: data.ai_response,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (data.complete) {
        setComplete(true);
        if (data.insights) setInsights(data.insights);
      }
    } catch (error: any) {
      const errMsg: Message = {
        role: "assistant",
        content: "Sorry, let me try that again. Could you repeat what you said?",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    item.role === "user" ? (
      <LinearGradient
        colors={[T.primary, T.accent]}
        style={[styles.messageBubble, styles.userBubble]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.messageText, styles.userText]}>
          {item.content}
        </Text>
      </LinearGradient>
    ) : (
      <View style={[styles.messageBubble, styles.aiBubble]}>
        <Text style={[styles.messageText, styles.aiText]}>
          {item.content}
        </Text>
      </View>
    )
  );

  if (!started) {
    return (
      <View style={[styles.startContainer, isTablet && { maxWidth: s(600), alignSelf: "center", width: "100%" }]}>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate("Nudges")}
        >
          <AppIcon name="notifications-outline" size={s(18)} color="rgba(0,119,182,0.5)" />
        </TouchableOpacity>
        <AppIcon name="moon" size={s(48)} color={T.primary} style={{ marginBottom: s(24) }} />
        <Text style={styles.startTitle}>Evening Reflection</Text>
        <Text style={styles.startSubtitle}>
          Take a few minutes to check in with yourself. Anchor will guide you through a reflective conversation.
        </Text>
        <TouchableOpacity onPress={startCheckin} activeOpacity={0.85}>
          <LinearGradient
            colors={[T.primary, T.accent]}
            style={styles.startButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.startButtonText}>Begin Check-in</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, isTablet && { maxWidth: s(700), alignSelf: "center", width: "100%" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity
        style={[styles.notificationButton, { top: s(20) }]}
        onPress={() => navigation.navigate("Nudges")}
      >
        <AppIcon name="notifications-outline" size={s(18)} color="rgba(0,119,182,0.5)" />
      </TouchableOpacity>

      <View style={styles.header}>
        <LinearGradient
          colors={['#003F66', '#0077B6']}
          style={styles.moonAvatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <AppIcon name="moon" size={s(18)} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Evening Reflection</Text>
          <Text style={styles.headerSubtitle}>
            {complete ? "Session complete" : `${messages.length} messages`}
          </Text>
        </View>
        {complete ? (
          <View style={styles.completeBadge}>
            <View style={styles.completeBadgeRow}>
              <AppIcon name="checkmark" size={s(12)} color={T.success} />
              <Text style={styles.completeBadgeText}>Done</Text>
            </View>
          </View>
        ) : messages.length > 0 ? (
          <TouchableOpacity
            style={styles.endSessionButton}
            onPress={() => {
              setComplete(true);
            }}
          >
            <Text style={styles.endSessionText}>End</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color={T.textMuted} />
          </View>
        </View>
      )}

      {complete && insights && (
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Session Insights</Text>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Mood:</Text>
            <View style={styles.insightValueRow}>
              <AppIcon
                name={insights.mood === "positive" ? "happy-outline" : insights.mood === "negative" ? "sad-outline" : "remove-outline"}
                size={s(14)}
                color={T.textSecondary}
              />
              <Text style={styles.insightValueText}>{insights.mood}</Text>
            </View>
          </View>
          {insights.accomplishments.length > 0 && (
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Wins:</Text>
              <Text style={styles.insightValue}>{insights.accomplishments.join(", ")}</Text>
            </View>
          )}
          {insights.action_items.length > 0 && (
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Next steps:</Text>
              <Text style={styles.insightValue}>{insights.action_items.join(", ")}</Text>
            </View>
          )}
        </View>
      )}

      {!complete && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={T.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={loading || !input.trim()}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[T.primary, T.accent]}
              style={[styles.sendButton, (!input.trim() || loading) && { opacity: 0.4 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <AppIcon name="arrow-up" size={s(20)} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (s: (n: number) => number, fs: (n: number) => number, vs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, paddingBottom: s(100) },
  notificationButton: {
    position: "absolute",
    top: vs(60),
    left: s(20),
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  startContainer: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: s(32),
  },
  startTitle: { fontSize: fs(28), fontFamily: T.fontDisplay, color: T.text, marginBottom: s(12) },
  startSubtitle: {
    fontSize: fs(15),
    fontFamily: T.font,
    color: T.textSecondary,
    textAlign: "center",
    lineHeight: fs(24),
    marginBottom: s(40),
    maxWidth: s(300),
  },
  startButton: {
    borderRadius: s(30),
    paddingVertical: s(18),
    paddingHorizontal: s(48),
  },
  startButtonText: { color: "#fff", fontSize: fs(16), fontFamily: T.fontSemiBold },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
    padding: s(16),
    paddingTop: vs(56),
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  moonAvatar: {
    width: s(38),
    height: s(38),
    borderRadius: s(14),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: fs(16), fontFamily: T.fontSemiBold, color: T.text },
  headerSubtitle: { fontSize: fs(12), fontFamily: T.font, color: T.textMuted },
  completeBadge: {
    backgroundColor: T.successSoft,
    borderRadius: s(20),
    paddingHorizontal: s(12),
    paddingVertical: s(6),
  },
  completeBadgeRow: { flexDirection: "row", alignItems: "center", gap: s(6) },
  completeBadgeText: { color: T.success, fontSize: fs(12), fontFamily: T.fontSemiBold },
  endSessionButton: {
    backgroundColor: T.surface,
    borderRadius: s(20),
    paddingHorizontal: s(14),
    paddingVertical: s(6),
  },
  endSessionText: { color: T.textSecondary, fontSize: fs(12), fontFamily: T.fontSemiBold },
  messageList: { padding: s(20), paddingBottom: s(8) },
  messageBubble: {
    maxWidth: "82%",
    padding: s(14),
    paddingHorizontal: s(18),
    marginBottom: s(14),
    borderRadius: s(20),
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: s(6),
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: T.bgCard,
    borderBottomLeftRadius: s(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.04,
    shadowRadius: s(10),
    elevation: 2,
  },
  messageText: { fontSize: fs(15), fontFamily: T.font, lineHeight: fs(22) },
  userText: { color: "#fff" },
  aiText: { color: T.text },
  typingIndicator: { paddingHorizontal: s(20), paddingBottom: s(8) },
  typingBubble: {
    alignSelf: "flex-start",
    backgroundColor: T.bgCard,
    borderRadius: s(20),
    borderBottomLeftRadius: s(6),
    padding: s(14),
    paddingHorizontal: s(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.04,
    shadowRadius: s(10),
    elevation: 2,
  },
  insightsCard: {
    margin: s(16),
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    padding: s(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    elevation: 3,
  },
  insightsTitle: {
    fontSize: fs(16),
    fontFamily: T.fontSemiBold,
    color: T.text,
    marginBottom: s(12),
  },
  insightRow: {
    flexDirection: "row",
    marginBottom: s(8),
    gap: s(8),
  },
  insightLabel: { fontSize: fs(13), fontFamily: T.fontSemiBold, color: T.textSecondary },
  insightValue: { fontSize: fs(13), fontFamily: T.font, color: T.text, flex: 1 },
  insightValueRow: { flexDirection: "row", alignItems: "center", gap: s(6), flex: 1 },
  insightValueText: { fontSize: fs(13), fontFamily: T.font, color: T.text },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    padding: s(14),
    paddingBottom: s(20),
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: T.bgCard,
    borderRadius: s(25),
    paddingHorizontal: s(18),
    paddingVertical: s(14),
    fontSize: fs(14),
    fontFamily: T.font,
    color: T.text,
    borderWidth: 1.5,
    borderColor: T.border,
  },
  sendButton: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
    alignItems: "center",
    justifyContent: "center",
  },
});

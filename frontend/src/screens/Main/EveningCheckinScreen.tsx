import React, { useState, useRef, useEffect } from "react";
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
import { Audio } from "expo-av";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";
import { T } from "../../theme";
import api from "../../services/api";
import AppIcon from "../../components/AppIcon";

type Message = {
  role: "user" | "assistant";
  content: string;
  audio_base64?: string;
};

type Insights = {
  mood: string;
  accomplishments: string[];
  blockers: string[];
  action_items: string[];
};

export default function EveningCheckinScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [complete, setComplete] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const startCheckin = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const res = await api.post("/checkin/start");
      const data = res.data;
      setConversationId(data.conversation_id);
      const aiMsg: Message = {
        role: "assistant",
        content: data.ai_response,
        audio_base64: data.audio_base64,
      };
      setMessages([aiMsg]);
      if (data.audio_base64) playAudio(data.audio_base64);
    } catch (error: any) {
      Alert.alert("Error", "Could not start check-in");
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (audioBase64: string) => {
    if (!audioBase64) return;
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioBase64 },
        { shouldPlay: true }
      );
      soundRef.current = sound;
    } catch (e) {
      console.log("Audio playback error:", e);
    }
  };

  const sendMessage = async (text?: string, audioBase64?: string) => {
    const messageText = text || input.trim();
    if ((!messageText && !audioBase64) || loading || !conversationId) return;

    const userMsg: Message = {
      role: "user",
      content: messageText || "(voice message)",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/checkin/message", {
        message: messageText,
        audio_base64: audioBase64,
        conversation_id: conversationId,
      });

      const data = res.data;
      const aiMsg: Message = {
        role: "assistant",
        content: data.ai_response,
        audio_base64: data.audio_base64,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (data.audio_base64) playAudio(data.audio_base64);

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

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Microphone access is required for voice input");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (e) {
      console.log("Recording error:", e);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const base64 = await readAsStringAsync(uri, {
          encoding: EncodingType.Base64,
        });
        sendMessage("", `data:audio/m4a;base64,${base64}`);
      }
    } catch (e) {
      console.log("Stop recording error:", e);
      setRecording(null);
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
        {item.audio_base64 ? (
          <TouchableOpacity
            style={styles.replayButton}
            onPress={() => playAudio(item.audio_base64!)}
          >
            <View style={styles.replayRow}>
              <AppIcon name="volume-high" size={14} color={T.primary} />
              <Text style={styles.replayText}>Replay</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    )
  );

  // Pre-start screen
  if (!started) {
    return (
      <View style={styles.startContainer}>
        <AppIcon name="moon" size={48} color={T.primary} style={{ marginBottom: 24 }} />
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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#003F66', '#0077B6']}
          style={styles.moonAvatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <AppIcon name="moon" size={18} color="#fff" />
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
              <AppIcon name="checkmark" size={12} color={T.success} />
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

      {/* Messages */}
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

      {/* Insights Card */}
      {complete && insights && (
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Session Insights</Text>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Mood:</Text>
            <View style={styles.insightValueRow}>
              <AppIcon
                name={insights.mood === "positive" ? "happy-outline" : insights.mood === "negative" ? "sad-outline" : "remove-outline"}
                size={14}
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

      {/* Input */}
      {!complete && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder={isRecording ? "Listening..." : "Type or hold to speak"}
            placeholderTextColor={T.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            editable={!isRecording}
          />
          {input.trim() ? (
            <TouchableOpacity
              onPress={() => sendMessage()}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[T.primary, T.accent]}
                style={styles.sendButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <AppIcon name="arrow-up" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isRecording ? [T.danger, T.accent] : [T.primary, T.accent]}
                style={[styles.micButton, isRecording && styles.micButtonRecording]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <AppIcon name="mic" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  startContainer: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  startTitle: { fontSize: 28, fontFamily: T.fontDisplay, color: T.text, marginBottom: 12 },
  startSubtitle: {
    fontSize: 15,
    fontFamily: T.font,
    color: T.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 300,
  },
  startButton: {
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 48,
  },
  startButtonText: { color: "#fff", fontSize: 16, fontFamily: T.fontSemiBold },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  moonAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontFamily: T.fontSemiBold, color: T.text },
  headerSubtitle: { fontSize: 12, fontFamily: T.font, color: T.textMuted },
  completeBadge: {
    backgroundColor: T.successSoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completeBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  completeBadgeText: { color: T.success, fontSize: 12, fontFamily: T.fontSemiBold },
  endSessionButton: {
    backgroundColor: T.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  endSessionText: { color: T.textSecondary, fontSize: 12, fontFamily: T.fontSemiBold },
  messageList: { padding: 20, paddingBottom: 8 },
  messageBubble: {
    maxWidth: "82%",
    padding: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderRadius: 20,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: T.bgCard,
    borderBottomLeftRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  messageText: { fontSize: 15, fontFamily: T.font, lineHeight: 22 },
  userText: { color: "#fff" },
  aiText: { color: T.text },
  replayButton: { marginTop: 8 },
  replayRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  replayText: { fontSize: 12, fontFamily: T.fontMedium, color: T.primary },
  typingIndicator: { paddingHorizontal: 20, paddingBottom: 8 },
  typingBubble: {
    alignSelf: "flex-start",
    backgroundColor: T.bgCard,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    padding: 14,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  insightsCard: {
    margin: 16,
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 16,
    fontFamily: T.fontSemiBold,
    color: T.text,
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  insightLabel: { fontSize: 13, fontFamily: T.fontSemiBold, color: T.textSecondary },
  insightValue: { fontSize: 13, fontFamily: T.font, color: T.text, flex: 1 },
  insightValueRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  insightValueText: { fontSize: 13, fontFamily: T.font, color: T.text },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: T.bgCard,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: T.font,
    color: T.text,
    borderWidth: 1.5,
    borderColor: T.border,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  micButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonRecording: {
    transform: [{ scale: 1.1 }],
  },
});

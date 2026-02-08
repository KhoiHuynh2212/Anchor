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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { T } from "../../theme";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AppIcon from "../../components/AppIcon";
import { useResponsive } from "../../hooks/useResponsive";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function OnboardingChatScreen() {
  const { refreshProfile } = useAuth();
  const { s, fs, vs, horizontalPadding, isTablet } = useResponsive();
  const styles = makeStyles(s, fs, vs);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Let Anchor initiate the conversation on mount
  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = async () => {
    setLoading(true);
    try {
      const res = await api.post("/onboarding/chat", {
        message: "",
        conversation_id: null,
      });
      const data = res.data;
      setConversationId(data.conversation_id);
      const aiMsg: Message = { role: "assistant", content: data.ai_response };
      setMessages([aiMsg]);
    } catch {
      const errMsg: Message = {
        role: "assistant",
        content: "Hey there! I'm Anchor. Tell me a bit about yourself and your goals!",
      };
      setMessages([errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/onboarding/chat", {
        message: messageText,
        conversation_id: conversationId,
      });

      const data = res.data;
      setConversationId(data.conversation_id);

      const aiMsg: Message = { role: "assistant", content: data.ai_response };
      setMessages((prev) => [...prev, aiMsg]);

      if (data.complete) {
        // Complete onboarding
        await api.post("/onboarding/complete");
        await refreshProfile();
      }
    } catch (error: any) {
      const errMsg: Message = {
        role: "assistant",
        content: "Sorry, I had a hiccup. Could you try saying that again?",
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, isTablet && { paddingHorizontal: horizontalPadding }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[T.primary, T.accent]}
          style={styles.sageAvatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <AppIcon name="leaf" size={s(20)} color="#fff" />
        </LinearGradient>
        <View>
          <Text style={styles.headerTitle}>Anchor</Text>
          <Text style={styles.headerSubtitle}>Getting to know you...</Text>
        </View>
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

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          placeholderTextColor={T.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={input.trim() && !loading ? [T.primary, T.accent] : [T.primarySoft, T.primarySoft]}
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <AppIcon name="arrow-up" size={s(20)} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (s: (n: number) => number, fs: (n: number) => number, vs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
    padding: s(16),
    paddingTop: vs(56),
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  sageAvatar: {
    width: s(38),
    height: s(38),
    borderRadius: s(14),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: fs(16), fontFamily: T.fontSemiBold, color: T.text },
  headerSubtitle: { fontSize: fs(12), fontFamily: T.font, color: T.success },
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    padding: s(14),
    paddingBottom: s(34),
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
  sendButtonDisabled: { opacity: 0.4 },
});

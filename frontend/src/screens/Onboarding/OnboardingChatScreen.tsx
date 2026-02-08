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

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function OnboardingChatScreen() {
  const { refreshProfile } = useAuth();
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
      style={styles.container}
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
          <AppIcon name="leaf" size={20} color="#fff" />
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
            <AppIcon name="arrow-up" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  sageAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontFamily: T.fontSemiBold, color: T.text },
  headerSubtitle: { fontSize: 12, fontFamily: T.font, color: T.success },
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
  sendButtonDisabled: { opacity: 0.4 },
});

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { T } from "../../theme";
import { useResponsive } from "../../hooks/useResponsive";

export default function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const { s, fs, vs, horizontalPadding, isTablet } = useResponsive();
  const styles = makeStyles(s, fs, vs);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.inner, isTablet && { paddingHorizontal: horizontalPadding }]}>
        <Text style={styles.title}>Sage</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={T.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={T.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={T.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.link}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (s: (n: number) => number, fs: (n: number) => number, vs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: s(32) },
  title: {
    fontSize: fs(48),
    fontWeight: "700",
    color: T.primary,
    textAlign: "center",
    marginBottom: s(8),
  },
  subtitle: {
    fontSize: fs(16),
    color: T.textSecondary,
    textAlign: "center",
    marginBottom: vs(48),
  },
  input: {
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    paddingHorizontal: s(20),
    paddingVertical: s(16),
    fontSize: fs(16),
    color: T.text,
    marginBottom: s(16),
    borderWidth: 1,
    borderColor: T.border,
  },
  button: {
    backgroundColor: T.primary,
    borderRadius: T.radiusSm,
    paddingVertical: s(16),
    alignItems: "center",
    marginTop: s(8),
    marginBottom: s(24),
  },
  buttonText: { color: "#FFFFFF", fontSize: fs(18), fontWeight: "600" },
  linkText: { textAlign: "center", color: T.textSecondary, fontSize: fs(14) },
  link: { color: T.primary, fontWeight: "600" },
});

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

export default function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuth();
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
      <View style={styles.inner}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  title: {
    fontSize: 48,
    fontWeight: "700",
    color: T.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: T.textSecondary,
    textAlign: "center",
    marginBottom: 48,
  },
  input: {
    backgroundColor: T.bgCard,
    borderRadius: T.radiusSm,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: T.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  button: {
    backgroundColor: T.primary,
    borderRadius: T.radiusSm,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  linkText: { textAlign: "center", color: T.textSecondary, fontSize: 14 },
  link: { color: T.primary, fontWeight: "600" },
});

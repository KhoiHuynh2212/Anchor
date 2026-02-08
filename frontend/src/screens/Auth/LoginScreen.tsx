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
import { useResponsive } from "../../hooks/useResponsive";

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const { s, fs, vs, horizontalPadding, isTablet } = useResponsive();
  const styles = makeStyles(s, fs, vs);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
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
        <Text style={styles.subtitle}>Your AI accountability companion</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8BADC2"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8BADC2"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.link}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (s: (n: number) => number, fs: (n: number) => number, vs: (n: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F2FA",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: s(32),
  },
  title: {
    fontSize: fs(48),
    fontWeight: "700",
    color: "#0077B6",
    textAlign: "center",
    marginBottom: s(8),
  },
  subtitle: {
    fontSize: fs(16),
    color: "#4A6A82",
    textAlign: "center",
    marginBottom: vs(48),
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: s(14),
    paddingHorizontal: s(20),
    paddingVertical: s(16),
    fontSize: fs(16),
    color: "#0A1628",
    marginBottom: s(16),
    borderWidth: 1,
    borderColor: "#C8E2F2",
  },
  button: {
    backgroundColor: "#0077B6",
    borderRadius: s(14),
    paddingVertical: s(16),
    alignItems: "center",
    marginTop: s(8),
    marginBottom: s(24),
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: fs(18),
    fontWeight: "600",
  },
  linkText: {
    textAlign: "center",
    color: "#4A6A82",
    fontSize: fs(14),
  },
  link: {
    color: "#0077B6",
    fontWeight: "600",
  },
});

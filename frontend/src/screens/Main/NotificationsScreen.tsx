import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { T } from "../../theme";
import AppIcon from "../../components/AppIcon";

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      {/* Soft background shapes */}
      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />

      <View style={styles.center}>
        {/* Bell */}
        <View style={styles.bellOuter}>
          <LinearGradient colors={[T.primary, T.accent]} style={styles.bellInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <AppIcon name="notifications" size={34} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>
          Stay on track with{"\n"}
          <Text style={styles.titleEmphasis}>gentle nudges</Text>
        </Text>
        <Text style={styles.subtitle}>
          Sage sends your morning brief, smart nudges, and evening reminders — only what matters, never spam.
        </Text>

        {/* Preview notifications */}
        <View style={styles.previewStack}>
          {[
            { time: "7:30 AM", text: "Good morning! Your day is ready" },
            { time: "12:15 PM", text: "How's the Coursera prep going?" },
            { time: "10:00 PM", text: "Time for your evening reflection" },
          ].map((n, i) => (
            <View key={i} style={styles.previewCard}>
              <LinearGradient colors={[T.primary, T.accent]} style={styles.previewIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <AppIcon name="leaf" size={16} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewText}>{n.text}</Text>
                <Text style={styles.previewTime}>{n.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={{ width: "100%", maxWidth: 320 }}>
          <Pressable onPress={() => Alert.alert("Notifications", "Permission flow can be wired next.")}>
            <LinearGradient colors={[T.primary, T.accent]} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.primaryButtonText}>Allow Notifications</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => Alert.alert("Notifications", "No problem — you can enable later in Settings.")} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  blobOne: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${T.primary}06`,
  },
  blobTwo: {
    position: "absolute",
    bottom: 80,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${T.accent}06`,
  },
  center: { width: "100%", alignItems: "center" },
  bellOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: T.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  bellInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  title: {
    fontFamily: T.fontDisplay,
    fontSize: 30,
    color: T.text,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 36,
    fontWeight: "400",
  },
  titleEmphasis: { color: T.primary, fontStyle: "italic" },
  subtitle: {
    fontFamily: T.font,
    fontSize: 15,
    color: T.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  previewStack: { width: "100%", maxWidth: 320, gap: 10, marginBottom: 26 },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: T.bgCard,
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowOpacity,
    shadowRadius: T.shadowRadius,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  previewIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  previewText: { fontFamily: T.font, fontSize: 13, color: T.text, fontWeight: "500", lineHeight: 18 },
  previewTime: { fontFamily: T.font, fontSize: 11, color: T.textMuted, marginTop: 2 },
  primaryButton: { paddingVertical: 17, borderRadius: 56, alignItems: "center", marginBottom: 10 },
  primaryButtonText: { fontFamily: T.fontBold, fontSize: 16, color: "#fff" },
  secondaryButton: { paddingVertical: 14, borderRadius: 56, alignItems: "center" },
  secondaryButtonText: { fontFamily: T.fontMedium, fontSize: 14, color: T.textMuted },
});


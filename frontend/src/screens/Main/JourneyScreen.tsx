import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { T } from "../../theme";
import AppIcon from "../../components/AppIcon";

// Mock data for demo
const MOOD_DATA = [
    { day: "M", value: 0.6 },
    { day: "T", value: 0.7 },
    { day: "W", value: 0.5 },
    { day: "T", value: 0.8 },
    { day: "F", value: 0.9 },
    { day: "S", value: 0.75 },
    { day: "S", value: 0.85 },
];

const GOALS = [
    { label: "Google SWE Internship", progress: 75, icon: "briefcase-outline", color: T.primary },
    { label: "AI/ML Course", progress: 67, icon: "school-outline", color: T.accent },
    { label: "Half Marathon", progress: 40, icon: "walk-outline", color: T.success },
];

const NETWORK = [
    { name: "Sarah Chen", role: "ML Engineer", company: "Google", helpsWith: "AI interviews" },
    { name: "Mike Ross", role: "CS Professor", company: "OU", helpsWith: "Research guidance" },
    { name: "Alex Kim", role: "Running Coach", company: "Freelance", helpsWith: "Training plans" },
];

export default function JourneyScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.heading}>Journey</Text>
                <Text style={styles.subheading}>Track your progress and insights</Text>
            </View>

            {/* Mood Trends */}
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>MOOD TRENDS</Text>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>This week</Text>
                    <Text style={styles.cardSubtitle}>+12% from last week</Text>
                </View>
                <View style={styles.moodChart}>
                    {MOOD_DATA.map((item, i) => (
                        <View key={i} style={styles.moodBar}>
                            <AppIcon
                                name={item.value >= 0.7 ? "happy-outline" : item.value < 0.5 ? "sad-outline" : "remove-outline"}
                                size={14}
                                color={T.textMuted}
                                style={styles.moodIcon}
                            />
                            <View style={styles.moodBarTrack}>
                                <LinearGradient
                                    colors={
                                        item.value >= 0.7
                                            ? [T.success, T.accentWarm]
                                            : item.value < 0.5
                                            ? [T.warning, T.danger]
                                            : [T.primary, T.accent]
                                    }
                                    style={[styles.moodBarFill, { height: `${item.value * 100}%` }]}
                                    start={{ x: 0, y: 1 }}
                                    end={{ x: 0, y: 0 }}
                                />
                            </View>
                            <Text style={styles.moodBarLabel}>{item.day}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.moodSummary}>
                    <View style={styles.moodSummaryItem}>
                        <AppIcon name="happy-outline" size={16} color={T.primary} />
                        <Text style={styles.moodSummaryLabel}>Average: Good</Text>
                    </View>
                    <View style={styles.moodSummaryItem}>
                        <AppIcon name="trending-up-outline" size={16} color={T.primary} />
                        <Text style={styles.moodSummaryLabel}>Trending up</Text>
                    </View>
                </View>
            </View>

            {/* Goal Progress */}
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>GOAL PROGRESS</Text>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Active goals</Text>
                    <TouchableOpacity>
                        <Text style={styles.cardAction}>Edit</Text>
                    </TouchableOpacity>
                </View>
                {GOALS.map((goal, i) => (
                    <View key={i} style={styles.goalRow}>
                        <View style={styles.goalInfo}>
                            <View style={styles.goalLabelRow}>
                                <AppIcon name={goal.icon as React.ComponentProps<typeof AppIcon>["name"]} size={18} color={goal.color} />
                                <Text style={styles.goalLabel}>{goal.label}</Text>
                            </View>
                            <Text style={[styles.goalPercent, { color: goal.color }]}>{goal.progress}%</Text>
                        </View>
                        <View style={styles.goalBarTrack}>
                            <LinearGradient
                                colors={[goal.color, goal.color + "80"]}
                                style={[styles.goalBarFill, { width: `${goal.progress}%` }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </View>
                    </View>
                ))}
            </View>

            {/* Your Network */}
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>YOUR NETWORK</Text>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Accountability partners</Text>
                    <TouchableOpacity>
                        <Text style={styles.cardAction}>Manage</Text>
                    </TouchableOpacity>
                </View>
                {NETWORK.map((person, i) => (
                    <TouchableOpacity key={i} style={styles.contactCard} activeOpacity={0.7}>
                        <View style={styles.contactAvatar}>
                            <Text style={styles.contactInitial}>
                                {person.name.charAt(0)}
                            </Text>
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{person.name}</Text>
                            <Text style={styles.contactRole}>
                                {person.role} · {person.company}
                            </Text>
                            <View style={styles.helpsWithRow}>
                                <AppIcon name="sparkles-outline" size={14} color={T.primary} />
                                <Text style={styles.helpsWithText}>Can help with: {person.helpsWith}</Text>
                            </View>
                        </View>
                        <AppIcon name="chevron-forward" size={18} color={T.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: T.bgDeep },
    heading: { fontSize: 28, fontFamily: T.fontDisplay, color: T.text, marginBottom: 4 },
    subheading: { fontSize: 14, fontFamily: T.font, color: T.textSecondary },
    card: {
        marginHorizontal: 24,
        marginBottom: 16,
        backgroundColor: T.bgCard,
        borderRadius: T.radiusSm,
        padding: 18,
        shadowColor: T.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: T.shadowOpacity,
        shadowRadius: T.shadowRadius,
        elevation: 2,
    },
    sectionLabel: {
        fontSize: 11,
        fontFamily: T.fontSemiBold,
        color: T.textMuted,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    cardTitle: { fontSize: 16, fontFamily: T.fontSemiBold, color: T.text },
    cardSubtitle: { fontSize: 11, fontFamily: T.font, color: T.textMuted },
    cardAction: { fontSize: 13, fontFamily: T.fontMedium, color: T.primary },
    moodChart: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        height: 100,
        marginBottom: 16,
    },
    moodBar: { alignItems: "center", flex: 1 },
    moodIcon: { marginBottom: 4 },
    moodBarTrack: {
        width: 24,
        height: 60,
        backgroundColor: T.surface,
        borderRadius: 12,
        overflow: "hidden",
        justifyContent: "flex-end",
    },
    moodBarFill: {
        width: "100%",
        borderRadius: 12,
    },
    moodBarLabel: {
        fontSize: 11,
        fontFamily: T.font,
        color: T.textMuted,
        marginTop: 6,
    },
    moodSummary: {
        flexDirection: "row",
        gap: 24,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: T.border,
    },
    moodSummaryItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    moodSummaryLabel: { fontSize: 12, fontFamily: T.font, color: T.textSecondary },
    goalRow: { marginBottom: 14 },
    goalInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    goalLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    goalLabel: { fontSize: 14, fontFamily: T.font, color: T.text },
    goalPercent: { fontSize: 13, fontFamily: T.fontSemiBold },
    goalBarTrack: {
        height: 6,
        backgroundColor: T.surface,
        borderRadius: 3,
        overflow: "hidden",
    },
    goalBarFill: {
        height: "100%",
        borderRadius: 3,
    },
    contactCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        backgroundColor: T.bgCard,
        borderRadius: T.radiusSm,
        marginBottom: 10,
        shadowColor: T.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: T.shadowOpacity,
        shadowRadius: T.shadowRadius,
        elevation: 2,
    },
    contactAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: T.primarySoft,
        alignItems: "center",
        justifyContent: "center",
    },
    contactInitial: {
        fontSize: 18,
        fontFamily: T.fontSemiBold,
        color: T.primary,
    },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 15, fontFamily: T.fontMedium, color: T.text },
    contactRole: { fontSize: 12, fontFamily: T.font, color: T.textSecondary, marginTop: 1 },
    helpsWithRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    helpsWithText: { fontSize: 11, fontFamily: T.font, color: T.primary },
});

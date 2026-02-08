import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
} from "react-native";
import { T } from "../../theme";

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
    { label: "Complete AI4All Application", progress: 75 },
    { label: "Exercise 3x per week", progress: 67 },
    { label: "Read 20 pages daily", progress: 40 },
];

const NETWORK = [
    { name: "Sarah", emoji: "👩" },
    { name: "Mike", emoji: "👨" },
    { name: "Alex", emoji: "🧑" },
];

export default function JourneyScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.heading}>Your Journey</Text>
                <Text style={styles.subheading}>Track your progress and insights</Text>
            </View>

            {/* Mood Trends */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Mood Trends</Text>
                    <Text style={styles.cardSubtitle}>This week</Text>
                </View>
                <View style={styles.moodChart}>
                    {MOOD_DATA.map((item, i) => (
                        <View key={i} style={styles.moodBar}>
                            <View style={styles.moodBarTrack}>
                                <View
                                    style={[
                                        styles.moodBarFill,
                                        { height: `${item.value * 100}%` },
                                        item.value >= 0.7 && styles.moodBarHigh,
                                        item.value < 0.5 && styles.moodBarLow,
                                    ]}
                                />
                            </View>
                            <Text style={styles.moodBarLabel}>{item.day}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.moodSummary}>
                    <View style={styles.moodSummaryItem}>
                        <Text style={styles.moodSummaryValue}>😊</Text>
                        <Text style={styles.moodSummaryLabel}>Average: Good</Text>
                    </View>
                    <View style={styles.moodSummaryItem}>
                        <Text style={styles.moodSummaryValue}>📈</Text>
                        <Text style={styles.moodSummaryLabel}>+12% from last week</Text>
                    </View>
                </View>
            </View>

            {/* Goal Progress */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Goal Progress</Text>
                    <TouchableOpacity>
                        <Text style={styles.cardAction}>Edit</Text>
                    </TouchableOpacity>
                </View>
                {GOALS.map((goal, i) => (
                    <View key={i} style={styles.goalRow}>
                        <View style={styles.goalInfo}>
                            <Text style={styles.goalLabel}>{goal.label}</Text>
                            <Text style={styles.goalPercent}>{goal.progress}%</Text>
                        </View>
                        <View style={styles.goalBarTrack}>
                            <View
                                style={[
                                    styles.goalBarFill,
                                    { width: `${goal.progress}%` },
                                ]}
                            />
                        </View>
                    </View>
                ))}
            </View>

            {/* Your Network */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Your Network</Text>
                    <TouchableOpacity>
                        <Text style={styles.cardAction}>Manage</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.networkSubtext}>
                    Accountability partners and mentors rooting for you
                </Text>
                <View style={styles.networkList}>
                    {NETWORK.map((person, i) => (
                        <View key={i} style={styles.networkItem}>
                            <View style={styles.networkAvatar}>
                                <Text style={{ fontSize: 24 }}>{person.emoji}</Text>
                            </View>
                            <Text style={styles.networkName}>{person.name}</Text>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.networkAdd}>
                        <Text style={styles.networkAddIcon}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Weekly Summary Card */}
            <View style={[styles.card, styles.summaryCard]}>
                <Text style={styles.summaryTitle}>🎯 Weekly Wins</Text>
                <View style={styles.summaryBullets}>
                    <Text style={styles.summaryBullet}>• Completed 5 evening check-ins</Text>
                    <Text style={styles.summaryBullet}>• Made progress on AI4All application</Text>
                    <Text style={styles.summaryBullet}>• Maintained positive mood all week</Text>
                </View>
            </View>

            {/* Reflections CTA */}
            <TouchableOpacity style={styles.ctaCard}>
                <View style={styles.ctaContent}>
                    <Text style={styles.ctaEmoji}>📝</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.ctaTitle}>View Past Reflections</Text>
                        <Text style={styles.ctaSubtitle}>23 entries this month</Text>
                    </View>
                    <Text style={styles.ctaArrow}>→</Text>
                </View>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    header: { padding: 24, paddingTop: 60 },
    heading: { fontSize: 28, fontWeight: "300", color: T.text, marginBottom: 4 },
    subheading: { fontSize: 14, color: T.textSecondary },
    card: {
        marginHorizontal: 24,
        marginBottom: 16,
        backgroundColor: T.bgCard,
        borderRadius: T.radiusSm,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    cardTitle: { fontSize: 16, fontWeight: "600", color: T.text },
    cardSubtitle: { fontSize: 11, color: T.textMuted },
    cardAction: { fontSize: 13, color: T.primary, fontWeight: "500" },
    moodChart: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        height: 80,
        marginBottom: 16,
    },
    moodBar: { alignItems: "center", flex: 1 },
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
        backgroundColor: T.primary,
        borderRadius: 12,
    },
    moodBarHigh: {
        backgroundColor: T.success,
    },
    moodBarLow: {
        backgroundColor: T.warning,
    },
    moodBarLabel: {
        fontSize: 11,
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
    moodSummaryValue: { fontSize: 16 },
    moodSummaryLabel: { fontSize: 12, color: T.textSecondary },
    goalRow: { marginBottom: 14 },
    goalInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    goalLabel: { fontSize: 14, color: T.text },
    goalPercent: { fontSize: 13, color: T.primary, fontWeight: "600" },
    goalBarTrack: {
        height: 6,
        backgroundColor: T.surface,
        borderRadius: 3,
        overflow: "hidden",
    },
    goalBarFill: {
        height: "100%",
        backgroundColor: T.primary,
        borderRadius: 3,
    },
    networkSubtext: {
        fontSize: 13,
        color: T.textSecondary,
        marginBottom: 14,
    },
    networkList: {
        flexDirection: "row",
        gap: 12,
    },
    networkItem: { alignItems: "center", gap: 4 },
    networkAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: T.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    networkName: { fontSize: 12, color: T.textSecondary },
    networkAdd: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: T.border,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
    networkAddIcon: { fontSize: 22, color: T.textMuted },
    summaryCard: {
        backgroundColor: T.successSoft,
        borderWidth: 1,
        borderColor: `${T.success}20`,
    },
    summaryTitle: { fontSize: 15, fontWeight: "600", color: T.success, marginBottom: 10 },
    summaryBullets: { gap: 4 },
    summaryBullet: { fontSize: 14, color: T.text, lineHeight: 22 },
    ctaCard: {
        marginHorizontal: 24,
        marginTop: 8,
        backgroundColor: T.surface,
        borderRadius: T.radiusSm,
        padding: 14,
        paddingHorizontal: 18,
    },
    ctaContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    ctaEmoji: { fontSize: 24 },
    ctaTitle: { fontSize: 15, fontWeight: "500", color: T.text },
    ctaSubtitle: { fontSize: 12, color: T.textMuted },
    ctaArrow: { fontSize: 20, color: T.textMuted },
});

import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { T } from "../../theme";
import AppIcon from "../../components/AppIcon";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

const STATE_CONFIG = {
    idle: { label: "Tap to speak", sublabel: "Sage is ready" },
    listening: { label: "Listening...", sublabel: "" },
    thinking: { label: "Thinking...", sublabel: "Processing" },
    speaking: { label: "Sage is speaking", sublabel: "Tap to interrupt" },
};

export default function VoiceChatScreen({ navigation }: any) {
    const nav = useNavigation<any>();
    const [state, setState] = useState<VoiceState>("idle");
    const [elapsed, setElapsed] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Demo: Cycle through states
    useEffect(() => {
        const cycle: VoiceState[] = ["idle", "listening", "thinking", "speaking"];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % cycle.length;
            setState(cycle[idx]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Elapsed timer for listening
    useEffect(() => {
        if (state !== "listening") {
            setElapsed(0);
            return;
        }
        const t = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(t);
    }, [state]);

    // Pulse animation for active states
    useEffect(() => {
        if (state === "listening" || state === "speaking") {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.08,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [state]);

    const cfg = STATE_CONFIG[state];

    const getOrbColors = (): [string, string] => {
        if (state === "listening") return [T.accent, T.primaryLight];
        if (state === "speaking") return [T.primaryLight, T.accent];
        if (state === "thinking") return ["#0096C7", T.primary];
        return [T.primary, T.accent];
    };

    const getMicColors = (): [string, string] => {
        if (state === "listening") return [T.accent, T.primaryLight];
        if (state === "speaking") return ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"];
        return [T.primary, T.accent];
    };

    return (
        <View style={styles.container}>
            {/* Ambient glow */}
            <View style={styles.ambientGlow} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => (navigation?.navigate ? navigation.navigate("Home") : nav.navigate("Home"))}
                >
                    <AppIcon name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>

                <View style={styles.sessionBadge}>
                    <View style={[styles.sessionDot, state !== "idle" && styles.sessionDotActive]} />
                    <Text style={styles.sessionText}>Voice session</Text>
                </View>

                <View style={styles.headerButton}>
                    <AppIcon name="ellipsis-vertical" size={16} color="rgba(255,255,255,0.7)" />
                </View>
            </View>

            {/* Center Orb Area */}
            <View style={styles.centerArea}>
                {/* Anchor identity */}
                <View style={styles.anchorIdentity}>
                    <LinearGradient
                        colors={[T.primary, T.accent]}
                        style={styles.anchorLogo}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <AppIcon name="leaf" size={22} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.anchorName}>Sage</Text>
                    <Text style={styles.anchorContext}>Voice session</Text>
                </View>

                {/* The Orb */}
                <Animated.View
                    style={[
                        styles.orbWrapper,
                        { transform: [{ scale: pulseAnim }] },
                    ]}
                >
                    {/* Pulse rings for listening/speaking */}
                    {(state === "listening" || state === "speaking") && (
                        <>
                            <View style={[styles.pulseRing, styles.pulseRing1]} />
                            <View style={[styles.pulseRing, styles.pulseRing2]} />
                        </>
                    )}
                    <LinearGradient
                        colors={getOrbColors()}
                        style={styles.orb}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Inner shine */}
                        <View style={styles.orbInner} />
                    </LinearGradient>
                </Animated.View>

                {/* State label */}
                <View style={styles.stateLabel}>
                    <Text style={styles.stateLabelText}>{cfg.label}</Text>
                    <Text style={styles.stateSublabel}>
                        {state === "listening" ? `${elapsed}s` : cfg.sublabel}
                    </Text>
                </View>

                {/* Transcript preview */}
                {state === "speaking" && (
                    <View style={styles.transcriptBox}>
                        <Text style={styles.transcriptText}>
                            I hear you. That deadline pressure is real — but you've got time. Let's break it down.
                        </Text>
                    </View>
                )}
                {state === "listening" && (
                    <View style={[styles.transcriptBox, styles.transcriptListening]}>
                        <Text style={[styles.transcriptText, { color: T.accentWarm }]}>
                            I'm feeling kind of stressed about the AI4All deadline...
                        </Text>
                    </View>
                )}
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
                {/* Mute */}
                <TouchableOpacity style={styles.controlButton}>
                    <AppIcon name="volume-mute" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>

                {/* Main mic button */}
                <TouchableOpacity activeOpacity={0.85}>
                    <LinearGradient
                        colors={getMicColors()}
                        style={[
                            styles.mainMicButton,
                            state === "listening" && styles.mainMicButtonListening,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {state === "speaking" ? (
                            <AppIcon name="stop" size={20} color="#fff" />
                        ) : (
                            <AppIcon name="mic" size={20} color="#fff" />
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* End call */}
                <TouchableOpacity
                    style={styles.endButton}
                    onPress={() => (navigation?.navigate ? navigation.navigate("Home") : nav.navigate("Home"))}
                >
                    <AppIcon name="call" size={20} color="#EA4335" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: T.bgDark,
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 50,
        paddingHorizontal: 24,
    },
    ambientGlow: {
        position: "absolute",
        top: "30%",
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: `${T.primary}20`,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    sessionBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    sessionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    sessionDotActive: {
        backgroundColor: T.accent,
    },
    sessionText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 13,
        fontFamily: T.fontMedium,
    },
    centerArea: {
        alignItems: "center",
        gap: 28,
    },
    anchorIdentity: {
        alignItems: "center",
    },
    anchorLogo: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    anchorName: {
        fontSize: 22,
        fontFamily: T.fontDisplay,
        color: "#fff",
        marginBottom: 4,
    },
    anchorContext: {
        fontSize: 13,
        fontFamily: T.font,
        color: "rgba(255,255,255,0.4)",
    },
    orbWrapper: {
        width: 180,
        height: 180,
        alignItems: "center",
        justifyContent: "center",
    },
    orb: {
        width: 180,
        height: 180,
        borderRadius: 90,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: T.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 60,
        elevation: 10,
    },
    pulseRing: {
        position: "absolute",
        borderRadius: 200,
        borderWidth: 1.5,
        borderColor: `${T.accent}30`,
    },
    pulseRing1: {
        width: 220,
        height: 220,
    },
    pulseRing2: {
        width: 260,
        height: 260,
    },
    orbInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    stateLabel: {
        alignItems: "center",
    },
    stateLabelText: {
        fontSize: 17,
        fontFamily: T.fontMedium,
        color: "#fff",
        marginBottom: 4,
    },
    stateSublabel: {
        fontSize: 13,
        fontFamily: T.font,
        color: "rgba(255,255,255,0.35)",
    },
    transcriptBox: {
        maxWidth: 280,
        padding: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    transcriptListening: {
        borderColor: `${T.accentWarm}15`,
    },
    transcriptText: {
        fontSize: 14,
        fontFamily: T.font,
        color: "rgba(255,255,255,0.7)",
        lineHeight: 21,
        textAlign: "center",
    },
    bottomControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 28,
    },
    controlButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    mainMicButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: T.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    mainMicButtonListening: {
        transform: [{ scale: 1.08 }],
    },
    endButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: `${T.danger}15`,
        borderWidth: 1,
        borderColor: `${T.danger}20`,
        alignItems: "center",
        justifyContent: "center",
    },
});

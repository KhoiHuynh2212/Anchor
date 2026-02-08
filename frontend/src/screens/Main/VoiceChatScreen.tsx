import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from "expo-audio";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";
import { T } from "../../theme";
import AppIcon from "../../components/AppIcon";
import api from "../../services/api";
import { ensurePlayableUri } from "../../utils/audio";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

const STATE_CONFIG = {
    idle: { label: "Hold to speak", sublabel: "Sage is ready" },
    listening: { label: "Listening...", sublabel: "" },
    thinking: { label: "Thinking...", sublabel: "Processing" },
    speaking: { label: "Sage is speaking", sublabel: "Tap to interrupt" },
};

export default function VoiceChatScreen() {
    const navigation = useNavigation<any>();
    const [state, setState] = useState<VoiceState>("idle");
    const [elapsed, setElapsed] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const recordingStartedAtMs = useRef<number | null>(null);
    const micHeldRef = useRef(false);
    const conversationIdRef = useRef<string | null>(null);
    const [debugLastPressInAt, setDebugLastPressInAt] = useState<number>(0);
    const [debugStep, setDebugStep] = useState<string>("");

    // New state for real voice integration
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userTranscript, setUserTranscript] = useState<string>("");
    const [aiTranscript, setAiTranscript] = useState<string>("");

    const player = useAudioPlayer(null);
    const playerStatus = useAudioPlayerStatus(player);
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Detect playback completion to transition from "speaking" to "idle"
    useEffect(() => {
        if (
            state === "speaking" &&
            playerStatus.playing === false &&
            (playerStatus.currentTime ?? 0) > 0 &&
            (playerStatus.duration ?? 0) > 0 &&
            (playerStatus.currentTime ?? 0) >= (playerStatus.duration ?? 0) - 0.05
        ) {
            if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
            setState("idle");
        }
    }, [state, playerStatus.playing, playerStatus.currentTime, playerStatus.duration]);

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

    const requestPermissions = async (): Promise<boolean> => {
        try {
            setDebugStep("requesting mic permission");
            const perm = await AudioModule.requestRecordingPermissionsAsync();
            if (!perm.granted) {
                setDebugStep("mic permission denied");
                Alert.alert(
                    "Permission needed",
                    "Microphone access is required for voice conversations with Sage"
                );
                return false;
            }
            setDebugStep("mic permission granted");
            return true;
        } catch (e) {
            console.log("Permission error:", e);
            setDebugStep("mic permission error");
            return false;
        }
    };

    const startSession = async (): Promise<string | null> => {
        setIsProcessing(true);
        setError(null);
        setState("thinking");
        try {
            setDebugStep("starting session");
            const res = await api.post("/checkin/start", { voice_mode: true });
            const data = res.data;
            const newConversationId: string | null = data?.conversation_id ?? null;

            conversationIdRef.current = newConversationId;
            setConversationId(data.conversation_id);
            setAiTranscript(data.ai_response);
            setDebugStep(newConversationId ? "session started" : "session missing id");

            if (data.audio_base64) {
                setState("speaking");
                playAudio(data.audio_base64);
            } else {
                setState("idle");
            }
            return newConversationId;
        } catch (err: any) {
            setError("Failed to start session");
            setState("idle");
            setDebugStep("session start failed");
            Alert.alert("Error", "Could not connect to Sage. Please try again.");
            return null;
        } finally {
            setIsProcessing(false);
        }
    };

    const startRecording = async (convId?: string) => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        // Session must exist to record
        const activeConversationId = convId ?? conversationIdRef.current;
        if (!activeConversationId) {
            console.log("Cannot record without active session");
            return;
        }

        try {
            setDebugStep("setting audio mode");
            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            setDebugStep("preparing recorder");
            await recorder.prepareToRecordAsync();
            setDebugStep("recording");
            recorder.record();
            recordingStartedAtMs.current = Date.now();
            setState("listening");
            setError(null);
        } catch (e) {
            console.log("Recording error:", e);
            setError("Failed to start recording");
            setDebugStep("recording error");
        }
    };

    const stopRecording = async () => {
        if (state !== "listening") return;

        try {
            const startedAt = recordingStartedAtMs.current;
            const tooShort = !!startedAt && Date.now() - startedAt < 250;

            setDebugStep("stopping recorder");
            await recorder.stop();
            await setAudioModeAsync({ allowsRecording: false });
            const uri = recorder.uri;
            recordingStartedAtMs.current = null;

            if (tooShort) {
                setDebugStep("hold too short");
                setState("idle");
                return;
            }

            if (uri) {
                setDebugStep("encoding audio");
                setState("thinking");
                setIsProcessing(true);

                const base64 = await readAsStringAsync(uri, {
                    encoding: EncodingType.Base64,
                });
                const audioBase64 = `data:audio/m4a;base64,${base64}`;
                setDebugStep("sending audio");
                await sendMessage(audioBase64);
            } else {
                setDebugStep("no recording uri");
                setState("idle");
            }
        } catch (e) {
            console.log("Stop recording error:", e);
            setError("Failed to process recording");
            setState("idle");
            setDebugStep("stop/encode error");
        }
    };

    const sendMessage = async (audioBase64: string) => {
        const activeConversationId = conversationIdRef.current ?? conversationId;
        if (!activeConversationId) return;

        setUserTranscript("(voice message)");

        try {
            const res = await api.post("/checkin/message", {
                message: "",
                audio_base64: audioBase64,
                conversation_id: activeConversationId,
                voice_mode: true,
            });

            const data = res.data;
            setAiTranscript(data.ai_response);

            if (data.audio_base64) {
                setState("speaking");
                playAudio(data.audio_base64);
            } else {
                setState("idle");
            }

            if (data.complete) {
                // Session complete - could show insights here
                if (data.insights) {
                    Alert.alert(
                        "Session Complete",
                        `Mood: ${data.insights.mood}\n\nGreat conversation! Check your insights in the app.`,
                        [
                            {
                                text: "OK",
                                onPress: () => {
                                    navigation.navigate("Home");
                                },
                            },
                        ]
                    );
                }
            }
        } catch (err: any) {
            console.log("Send message error:", err);
            setError("Failed to send message");
            setAiTranscript("Sorry, I didn't catch that. Could you try again?");
            setState("idle");
        } finally {
            setIsProcessing(false);
        }
    };

    const playAudio = async (audioBase64: string) => {
        if (!audioBase64) return;
        try {
            const uri = await ensurePlayableUri(audioBase64, "voice");
            player.replace(uri);
            player.play();

            // Safety timeout: if playback doesn't complete within 30s, reset to idle
            if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = setTimeout(() => {
                setState((s) => (s === "speaking" ? "idle" : s));
            }, 30000);
        } catch (e) {
            console.log("Audio playback error:", e);
            setState("idle");
        }
    };

    const handleMicPress = () => {
        if (state === "speaking") {
            // Interrupt AI speech
            player.pause();
            setState("idle");
            return;
        }

        // Tap to initialize session (useful if user doesn't hold).
        if (state === "idle" && !conversationId && !isProcessing) {
            startSession();
        }
    };

    const handleMicPressIn = async () => {
        micHeldRef.current = true;
        setDebugLastPressInAt(Date.now());
        setDebugStep("press in");
        if (state === "thinking") return;

        // If Sage is speaking, allow tap to interrupt (press-in should also interrupt).
        if (state === "speaking") {
            player.pause();
            setState("idle");
            return;
        }

        // First-time: start session, then (if still holding) start recording.
        let activeConversationId = conversationIdRef.current ?? conversationId;
        if (!activeConversationId) {
            activeConversationId = await startSession();
            if (!micHeldRef.current) return;
            // React state updates are async; use the id we just got.
            if (!activeConversationId) return;
        }

        if (state === "idle") {
            await startRecording(activeConversationId);
        }
    };

    const handleMicPressOut = async () => {
        micHeldRef.current = false;
        if (state === "listening") {
            await stopRecording();
        }
    };

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
            <View style={styles.ambientGlow} pointerEvents="none" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.navigate("Nudges")}
                >
                    <AppIcon name="notifications-outline" size={16} color="rgba(255,255,255,0.5)" />
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
                    {__DEV__ && Date.now() - debugLastPressInAt < 1200 ? (
                        <Text style={styles.debugPressText}>press detected</Text>
                    ) : null}
                    {__DEV__ && debugStep ? (
                        <Text style={styles.debugPressText}>{debugStep}</Text>
                    ) : null}
                </View>

                {/* Transcript preview */}
                {(state === "listening" || state === "thinking") && (
                    <View style={[styles.transcriptBox, styles.transcriptListening]}>
                        <Text style={[styles.transcriptText, { color: T.accentWarm }]}>
                            {userTranscript || "Listening..."}
                        </Text>
                    </View>
                )}

                {(state === "speaking" || state === "idle") && aiTranscript && (
                    <View style={styles.transcriptBox}>
                        <Text style={styles.transcriptText}>
                            {aiTranscript}
                        </Text>
                    </View>
                )}

                {/* Error display */}
                {error && (
                    <View style={styles.errorBadge}>
                        <AppIcon name="alert-circle" size={14} color={T.danger} />
                        <Text style={styles.errorText}>{error}</Text>
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
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleMicPress}
                    onPressIn={handleMicPressIn}
                    onPressOut={handleMicPressOut}
                >
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
                    onPress={() => navigation.navigate("Home")}
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
        paddingTop: 50,
        // Leave space for the custom bottom tab bar so it doesn't cover the in-screen mic.
        paddingBottom: 150,
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
    debugPressText: {
        marginTop: 8,
        fontSize: 11,
        fontFamily: T.fontMedium,
        color: "rgba(255,255,255,0.55)",
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
    errorBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: `${T.danger}15`,
        borderWidth: 1,
        borderColor: `${T.danger}25`,
    },
    errorText: {
        fontSize: 12,
        fontFamily: T.fontMedium,
        color: T.danger,
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

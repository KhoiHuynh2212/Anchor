import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { T } from "../../theme";
import AppIcon from "../../components/AppIcon";
import { useResponsive } from "../../hooks/useResponsive";

export default function WelcomeScreen({ navigation }: any) {
    const { s, fs, vs, horizontalPadding, isTablet } = useResponsive();
    const styles = makeStyles(s, fs, vs);

    return (
        <LinearGradient
            colors={[T.bg, T.bgDeep, T.primarySoft]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                {/* Decorative circles */}
                <View style={styles.circleTopRight} />
                <View style={styles.circleBottomLeft} />

                <View style={[styles.content, isTablet && { paddingHorizontal: horizontalPadding }]}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[T.primary, T.accent]}
                            style={styles.logoMark}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <AppIcon name="anchor" size={s(42)} color="#fff" />
                        </LinearGradient>

                        <Text style={styles.title}>Anchor</Text>
                        <Text style={styles.subtitle}>
                            Your mindful companion for growth, reflection & accountability
                        </Text>
                    </View>

                    {/* CTA Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("Register")}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={[T.primary, T.accent]}
                                style={styles.primaryButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.primaryButtonText}>Get Started</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate("Login")}
                        >
                            <Text style={styles.secondaryButtonText}>I have an account</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.termsText}>
                        By continuing, you agree to our Terms & Privacy Policy
                    </Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const makeStyles = (s: (n: number) => number, fs: (n: number) => number, vs: (n: number) => number) => StyleSheet.create({
    container: {
        flex: 1,
    },
    circleTopRight: {
        position: "absolute",
        top: s(-60),
        right: s(-60),
        width: s(200),
        height: s(200),
        borderRadius: s(100),
        backgroundColor: `${T.primaryLight}15`,
    },
    circleBottomLeft: {
        position: "absolute",
        bottom: s(-40),
        left: s(-40),
        width: s(160),
        height: s(160),
        borderRadius: s(80),
        backgroundColor: `${T.accent}10`,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: s(32),
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: vs(48),
    },
    logoMark: {
        width: s(88),
        height: s(88),
        borderRadius: s(28),
        alignItems: "center",
        justifyContent: "center",
        marginBottom: vs(32),
        shadowColor: T.primary,
        shadowOffset: { width: 0, height: s(12) },
        shadowOpacity: 0.3,
        shadowRadius: s(20),
        elevation: 10,
    },
    title: {
        fontSize: fs(42),
        fontFamily: T.fontDisplay,
        color: T.text,
        marginBottom: s(12),
    },
    subtitle: {
        fontSize: fs(16),
        fontFamily: T.font,
        color: T.textSecondary,
        textAlign: "center",
        lineHeight: fs(24),
        maxWidth: s(260),
    },
    buttonContainer: {
        width: "100%",
        maxWidth: s(280),
    },
    primaryButton: {
        width: "100%",
        paddingVertical: s(18),
        paddingHorizontal: s(32),
        borderRadius: s(60),
        alignItems: "center",
        marginBottom: s(16),
        shadowColor: T.primary,
        shadowOffset: { width: 0, height: s(8) },
        shadowOpacity: 0.3,
        shadowRadius: s(16),
        elevation: 8,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: fs(16),
        fontFamily: T.fontSemiBold,
        letterSpacing: 0.3,
    },
    secondaryButton: {
        width: "100%",
        paddingVertical: s(14),
        paddingHorizontal: s(32),
        backgroundColor: "transparent",
        borderRadius: s(60),
        borderWidth: 1.5,
        borderColor: T.primarySoft,
        alignItems: "center",
    },
    secondaryButtonText: {
        color: T.primary,
        fontSize: fs(15),
        fontFamily: T.fontMedium,
    },
    termsText: {
        fontSize: fs(12),
        fontFamily: T.font,
        color: T.textMuted,
        marginTop: vs(32),
        lineHeight: fs(18),
        textAlign: "center",
    },
});

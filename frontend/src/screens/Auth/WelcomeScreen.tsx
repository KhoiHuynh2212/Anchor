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

export default function WelcomeScreen({ navigation }: any) {
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

                <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[T.primary, T.accent]}
                            style={styles.logoMark}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <AppIcon name="anchor" size={42} color="#fff" />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    circleTopRight: {
        position: "absolute",
        top: -60,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: `${T.primaryLight}15`,
    },
    circleBottomLeft: {
        position: "absolute",
        bottom: -40,
        left: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: `${T.accent}10`,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 48,
    },
    logoMark: {
        width: 88,
        height: 88,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
        shadowColor: T.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 42,
        fontFamily: T.fontDisplay,
        color: T.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: T.font,
        color: T.textSecondary,
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 260,
    },
    buttonContainer: {
        width: "100%",
        maxWidth: 280,
    },
    primaryButton: {
        width: "100%",
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 60,
        alignItems: "center",
        marginBottom: 16,
        shadowColor: T.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontFamily: T.fontSemiBold,
        letterSpacing: 0.3,
    },
    secondaryButton: {
        width: "100%",
        paddingVertical: 14,
        paddingHorizontal: 32,
        backgroundColor: "transparent",
        borderRadius: 60,
        borderWidth: 1.5,
        borderColor: T.primarySoft,
        alignItems: "center",
    },
    secondaryButtonText: {
        color: T.primary,
        fontSize: 15,
        fontFamily: T.fontMedium,
    },
    termsText: {
        fontSize: 12,
        fontFamily: T.font,
        color: T.textMuted,
        marginTop: 32,
        lineHeight: 18,
        textAlign: "center",
    },
});

import React, { useEffect, useRef } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { T } from "../theme";
import { View, Text, Pressable, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Auth screens
import WelcomeScreen from "../screens/Auth/WelcomeScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";

// Onboarding screens
import QuestionsScreen from "../screens/Onboarding/QuestionsScreen";
import OnboardingChatScreen from "../screens/Onboarding/OnboardingChatScreen";

// Main screens
import MorningBriefScreen from "../screens/Main/MorningBriefScreen";
import NudgeFeedScreen from "../screens/Main/NudgeFeedScreen";
import JourneyScreen from "../screens/Main/JourneyScreen";
import VoiceChatScreen from "../screens/Main/VoiceChatScreen";
import NotificationsScreen from "../screens/Main/NotificationsScreen";
import EveningCheckinScreen from "../screens/Main/EveningCheckinScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SageTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const focusedRoute = state.routes[state.index];
  const shouldHide = focusedRoute?.name === "Voice";

  useEffect(() => {
    // Subtle continuous pulse on Voice button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // The Voice screen has its own bottom controls (mic/end-call). Our custom
  // tab bar sits absolutely at the bottom and can intercept touches.
  // Hide it on Voice to prevent “press does nothing” issues.
  if (shouldHide) return null;

  return (
    <View style={[tabStyles.wrap, { paddingBottom: Math.max(18, insets.bottom + 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.tabBarLabel ?? options.title ?? route.name) as string;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        const onLongPress = () => navigation.emit({ type: "tabLongPress", target: route.key });

        const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
          Home: "home-outline",
          Voice: "mic",
          Chat: "chatbubble-outline",
        };

        const iconName = iconMap[route.name] || "ellipse-outline";
        const isCenter = route.name === "Voice";

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[tabStyles.item, isCenter && tabStyles.centerItem]}
          >
            {isCenter ? (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <LinearGradient
                  colors={[T.primary, T.accent]}
                  style={[
                    tabStyles.centerButton,
                    !isFocused && tabStyles.centerButtonUnfocused,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="mic" size={24} color="#fff" />
                </LinearGradient>
              </Animated.View>
            ) : (
              <View style={{ alignItems: "center", gap: 2 }}>
                <Ionicons
                  name={iconName}
                  size={16}
                  color={isFocused ? T.primary : "rgba(0,0,0,0.35)"}
                />
                <Text
                  style={[
                    tabStyles.label,
                    tabStyles.labelMinimal,
                    isFocused && tabStyles.labelActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // we render our own
      }}
      tabBar={(props) => <SageTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={MorningBriefScreen}
      />
      <Tab.Screen
        name="Voice"
        component={VoiceChatScreen}
      />
      <Tab.Screen
        name="Chat"
        component={EveningCheckinScreen}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { session, loading, profileLoading, userProfile } = useAuth();

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg }}>
        <Text style={{ fontSize: 32, color: T.primary, fontWeight: "700" }}>Anchor</Text>
        <Text style={{ fontSize: 14, color: T.textSecondary, marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !userProfile?.onboarding_complete ? (
        <>
          <Stack.Screen name="Questions" component={QuestionsScreen} />
          <Stack.Screen name="OnboardingChat" component={OnboardingChatScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Nudges" component={NudgeFeedScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingTop: 6,
    paddingHorizontal: 4,
    backgroundColor: "rgba(230,242,250,0.88)",
    borderTopWidth: 1,
    borderTopColor: T.borderLight,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 6 },
  centerItem: { transform: [{ translateY: -16 }] },
  icon: { fontSize: 20, marginBottom: 3 },
  label: { fontFamily: T.fontSemiBold, fontSize: 10, marginTop: 2 },
  labelMinimal: {
    fontSize: 9,
    fontFamily: T.font,
    color: "rgba(0,0,0,0.4)",
    marginTop: 2,
  },
  labelActive: {
    color: T.primary,
    fontFamily: T.fontMedium,
  },
  labelInactive: { color: T.textMuted, fontWeight: "500" },
  centerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  centerButtonUnfocused: {
    shadowOpacity: 0.2,
    transform: [{ translateY: -14 }],
  },
  centerIcon: { fontSize: 22, color: "#fff" },
});

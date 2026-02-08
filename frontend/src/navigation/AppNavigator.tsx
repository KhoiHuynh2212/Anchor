import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { T } from "../theme";
import { View, Text, Pressable, StyleSheet } from "react-native";
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
import SettingsScreen from "../screens/Settings/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SageTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

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
          Voice: "mic-outline",
          Notifications: "notifications-outline",
          Journey: "trending-up-outline",
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
              <View style={{ alignItems: "center" }}>
                {isFocused ? (
                  <LinearGradient
                    colors={[T.primary, T.accent]}
                    style={tabStyles.centerButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="mic" size={22} color="#fff" />
                  </LinearGradient>
                ) : (
                  <View style={tabStyles.centerButtonIdle}>
                    <Ionicons name="mic-outline" size={22} color={T.primary} />
                  </View>
                )}
                <Text style={[tabStyles.label, isFocused ? tabStyles.labelActive : tabStyles.labelInactive]}>
                  {label}
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: "center" }}>
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isFocused ? T.primary : T.textMuted}
                />
                <Text style={[tabStyles.label, isFocused ? tabStyles.labelActive : tabStyles.labelInactive]}>
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
        name="Notifications"
        component={NotificationsScreen}
      />
      <Tab.Screen
        name="Journey"
        component={JourneyScreen}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { session, loading, userProfile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg }}>
        <Text style={{ fontSize: 32, color: T.primary, fontWeight: "700" }}>Sage</Text>
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
  centerItem: { transform: [{ translateY: -8 }] },
  icon: { fontSize: 20, marginBottom: 3 },
  label: { fontFamily: T.fontSemiBold, fontSize: 10, marginTop: 2 },
  labelActive: { color: T.primary },
  labelInactive: { color: T.textMuted, fontWeight: "500" },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  centerButtonIdle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.bgCard,
    borderWidth: 1.5,
    borderColor: T.borderLight,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.shadowColor,
    shadowOpacity: T.shadowMdOpacity,
    shadowRadius: T.shadowMdRadius,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  centerIcon: { fontSize: 22, color: "#fff" },
});

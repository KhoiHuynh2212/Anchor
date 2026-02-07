import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { T } from "../theme";
import { View, Text } from "react-native";

// Auth screens
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";

// Onboarding screens
import QuestionsScreen from "../screens/Onboarding/QuestionsScreen";
import OnboardingChatScreen from "../screens/Onboarding/OnboardingChatScreen";

// Main screens
import MorningBriefScreen from "../screens/Main/MorningBriefScreen";
import NudgeFeedScreen from "../screens/Main/NudgeFeedScreen";
import EveningCheckinScreen from "../screens/Main/EveningCheckinScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontSize: 20,
          color: focused ? T.primary : T.textMuted,
        }}
      >
        {label === "Brief"
          ? "\u2600"
          : label === "Nudges"
          ? "\uD83D\uDD14"
          : label === "Check-in"
          ? "\uD83C\uDF19"
          : "\u2699\uFE0F"}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.bg,
          borderTopColor: T.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Brief"
        component={MorningBriefScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Brief" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Nudges"
        component={NudgeFeedScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Nudges" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Check-in"
        component={EveningCheckinScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Check-in" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
        }}
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
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !userProfile?.onboarding_complete ? (
        <>
          <Stack.Screen name="Questions" component={QuestionsScreen} />
          <Stack.Screen name="OnboardingChat" component={OnboardingChatScreen} />
        </>
      ) : (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

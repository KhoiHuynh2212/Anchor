import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { T } from "../theme";
import { View, Text } from "react-native";

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
import EveningCheckinScreen from "../screens/Main/EveningCheckinScreen";
import JourneyScreen from "../screens/Main/JourneyScreen";
import VoiceChatScreen from "../screens/Main/VoiceChatScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Brief: "☀️",
    Nudges: "🔔",
    "Check-in": "🌙",
    Journey: "📊",
    Settings: "⚙️",
  };

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 40,
          height: 32,
          borderRadius: 16,
          backgroundColor: focused ? T.primary + "15" : "transparent",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 2,
        }}
      >
        <Text style={{ fontSize: 18 }}>{icons[label] || "•"}</Text>
      </View>
      {focused && (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: T.primary,
            position: "absolute",
            bottom: -6,
          }}
        />
      )}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.bgCard,
          borderTopColor: T.border,
          height: 85,
          paddingTop: 12,
          paddingBottom: 28, // iOS safe area
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 5,
        },
        tabBarShowLabel: false, // Hide default labels, we'll use icon only or custom
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.textMuted,
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
        name="Journey"
        component={JourneyScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Journey" focused={focused} />,
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
          <Stack.Screen
            name="VoiceChat"
            component={VoiceChatScreen}
            options={{ presentation: 'modal', gestureEnabled: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

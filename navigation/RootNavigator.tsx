import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import OnboardingScreen from "@/screens/OnboardingScreen";
import CreateTaskScreen from "@/screens/CreateTaskScreen";
import TaskDetailScreen from "@/screens/TaskDetailScreen";
import ChatScreen from "@/screens/ChatScreen";
import PaymentScreen from "@/screens/PaymentScreen";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { RootStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme, isDark } = useTheme();
  const { user, isLoading } = useApp();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark, transparent: false }),
        headerShown: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="CreateTask"
            component={CreateTaskScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="TaskDetail"
            component={TaskDetailScreen}
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            animation: "fade",
          }}
        />
      )}
    </Stack.Navigator>
  );
}

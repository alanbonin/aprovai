import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth }   from "./src/hooks/useAuth";
import { AgentProvider, useAgent } from "./src/hooks/useAgent";
import { C } from "./src/constants/colors";
import { LoadScreen } from "./src/components/UI";

import LoginScreen      from "./src/screens/LoginScreen";
import AgentSelectScreen from "./src/screens/AgentSelectScreen";
import HomeScreen       from "./src/screens/HomeScreen";
import StudyScreen      from "./src/screens/StudyScreen";
import FlashScreen      from "./src/screens/FlashScreen";
import SimuladoScreen   from "./src/screens/SimuladoScreen";
import ProfileScreen    from "./src/screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:     "🏠",
  Study:    "📖",
  Flash:    "🃏",
  Simulado: "🎯",
  Profile:  "👤",
};

function TabIcon({ name, focused }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[name]}</Text>
  );
}

function Navigator() {
  const { user, loading } = useAuth();
  const { activeAgent, agentLoaded } = useAgent();

  if (loading || !agentLoaded) return <LoadScreen msg="Carregando AprovAI…" />;
  if (!user)         return <LoginScreen />;
  if (!activeAgent)  return <AgentSelectScreen />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor:   C.amber,
        tabBarInactiveTintColor: C.text3,
        tabBarStyle: {
          backgroundColor:    C.bg1,
          borderTopColor:     C.border,
          borderTopWidth:     1,
          paddingBottom:      4,
          height:             60,
        },
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: "700",
          marginBottom: 4,
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel: "Início"     }} />
      <Tab.Screen name="Study"    component={StudyScreen}    options={{ tabBarLabel: "Estudar"    }} />
      <Tab.Screen name="Flash"    component={FlashScreen}    options={{ tabBarLabel: "Flashcards" }} />
      <Tab.Screen name="Simulado" component={SimuladoScreen} options={{ tabBarLabel: "Simulado"   }} />
      <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ tabBarLabel: "Perfil"     }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={C.bg0} />
        <AuthProvider>
          <AgentProvider>
            <Navigator />
          </AgentProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

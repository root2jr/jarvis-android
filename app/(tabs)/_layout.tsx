import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: "none" },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ headerShown: false, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="login" options={{ headerShown: false }} />
      <Tabs.Screen name="aipage" options={{ headerShown: false }} />
    </Tabs>
  );
}

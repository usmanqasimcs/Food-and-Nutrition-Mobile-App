import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthWrapper } from '../components/AuthWrapper';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <PaperProvider>
            <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthWrapper>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="register" options={{ headerShown: false }} />
                  <Stack.Screen name="profile" options={{ headerShown: false }} />
                  <Stack.Screen name="debug" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </AuthWrapper>
              <StatusBar style="auto" />
            </NavigationThemeProvider>
          </PaperProvider>
        </AuthProvider>
      </ThemeProvider>
      <Toast />
    </GestureHandlerRootView>
  );
}

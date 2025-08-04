import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return; // Don't navigate while loading

    const inTabsGroup = segments[0] === '(tabs)';
    const currentScreen = segments[0];
    const publicScreens = ['login', 'register', 'debug'];

    if (!user && !publicScreens.includes(currentScreen)) {
      // User is not authenticated and not on public screens, redirect to login
      router.replace('/login');
    } else if (user && (currentScreen === 'login' || currentScreen === 'register')) {
      // User is authenticated but on auth screens, redirect to tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  return <>{children}</>;
}

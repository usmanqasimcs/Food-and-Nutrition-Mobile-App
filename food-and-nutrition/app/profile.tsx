import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Avatar, Button, Card, List, Surface } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ProfileScreen() {
  const { colors, isDark, theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            // AuthWrapper will handle navigation after logout
          }
        }
      ]
    );
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    Toast.show({
      type: 'success',
      text1: 'Theme Updated',
      text2: `Switched to ${newTheme} theme`,
    });
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Profile & Settings
          </Text>
        </View>

        {/* User Profile Card */}
        <Card style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={user.name?.charAt(0) || 'U'}
              style={{ backgroundColor: colors.primary }}
              labelStyle={{ color: colors.onPrimary }}
            />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.onSurface }]}>
                {user.name}
              </Text>
              <Text style={[styles.userEmail, { color: colors.onSurfaceVariant }]}>
                {user.email}
              </Text>
              <Text style={[styles.memberSince, { color: colors.onSurfaceVariant }]}>
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Appearance Settings */}
        <Surface style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Appearance
          </Text>
          
          <List.Item
            title="Light Theme"
            description="Use light color scheme"
            left={(props) => <List.Icon {...props} icon="white-balance-sunny" />}
            right={() => (
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'light' && { backgroundColor: colors.primaryContainer }
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <Text style={[
                  styles.themeButtonText,
                  { color: theme === 'light' ? colors.onPrimaryContainer : colors.onSurface }
                ]}>
                  Light
                </Text>
              </TouchableOpacity>
            )}
          />
          
          <List.Item
            title="Dark Theme"
            description="Use dark color scheme"
            left={(props) => <List.Icon {...props} icon="weather-night" />}
            right={() => (
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'dark' && { backgroundColor: colors.primaryContainer }
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <Text style={[
                  styles.themeButtonText,
                  { color: theme === 'dark' ? colors.onPrimaryContainer : colors.onSurface }
                ]}>
                  Dark
                </Text>
              </TouchableOpacity>
            )}
          />
          
          <List.Item
            title="System Theme"
            description="Follow system settings"
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={() => (
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'system' && { backgroundColor: colors.primaryContainer }
                ]}
                onPress={() => handleThemeChange('system')}
              >
                <Text style={[
                  styles.themeButtonText,
                  { color: theme === 'system' ? colors.onPrimaryContainer : colors.onSurface }
                ]}>
                  Auto
                </Text>
              </TouchableOpacity>
            )}
          />
        </Surface>

        {/* App Settings */}
        <Surface style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            App Settings
          </Text>
          
          <List.Item
            title="Notifications"
            description="Receive analysis reminders and tips"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.outline, true: colors.primaryContainer }}
                thumbColor={notificationsEnabled ? colors.primary : colors.onSurfaceVariant}
              />
            )}
          />
          
          <List.Item
            title="Privacy Policy"
            description="Read our privacy policy"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              Alert.alert('Privacy Policy', 'Privacy policy content would be displayed here.');
            }}
          />
          
          <List.Item
            title="Terms of Service"
            description="Read our terms of service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              Alert.alert('Terms of Service', 'Terms of service content would be displayed here.');
            }}
          />
        </Surface>

        {/* Account Actions */}
        <View style={styles.accountActions}>
          <Button
            mode="contained"
            onPress={handleLogout}
            icon="logout"
            style={[styles.logoutButton, { backgroundColor: colors.primary }]}
            textColor={colors.onPrimary}
          >
            Logout
          </Button>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.onSurfaceVariant }]}>
            Food & Nutrition App v1.0.0
          </Text>
          <Text style={[styles.buildInfo, { color: colors.onSurfaceVariant }]}>
            Built with ♥️ using React Native & Expo
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileCard: {
    marginBottom: 20,
    borderRadius: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 16,
    marginTop: 8,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountActions: {
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  logoutButton: {
    borderRadius: 12,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 4,
  },
  buildInfo: {
    fontSize: 12,
  },
});

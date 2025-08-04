import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      // AuthWrapper will handle navigation after successful login
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPress = () => {
    router.push('/register');
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Password reset functionality will be implemented in the next update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <LinearGradient
        colors={[colors.primary + '20', colors.primaryContainer + '40']}
        style={styles.gradientBackground}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onBackground }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Sign in to continue your nutrition journey
            </Text>
          </View>

          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.form}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Email"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      error={!!errors.email}
                      style={styles.input}
                      theme={{
                        colors: {
                          primary: colors.primary,
                          background: colors.surface,
                          onSurface: colors.onSurface,
                        },
                      }}
                    />
                  )}
                />
                {errors.email && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.email.message}
                  </Text>
                )}

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Password"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      secureTextEntry
                      autoComplete="password"
                      error={!!errors.password}
                      style={styles.input}
                      theme={{
                        colors: {
                          primary: colors.primary,
                          background: colors.surface,
                          onSurface: colors.onSurface,
                        },
                      }}
                    />
                  )}
                />
                {errors.password && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.password.message}
                  </Text>
                )}

                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
                  <Text style={[styles.forgotText, { color: colors.primary }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <Button
                  mode="contained"
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  loading={isLoading}
                  style={styles.loginButton}
                  buttonColor={colors.primary}
                  textColor={colors.onPrimary}
                  contentStyle={styles.buttonContent}
                >
                  Sign In
                </Button>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleRegisterPress}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.demoSection}>
            <Text style={[styles.demoTitle, { color: colors.onSurfaceVariant }]}>
              Demo Account
            </Text>
            <Text style={[styles.demoText, { color: colors.onSurfaceVariant }]}>
              Email: demo@foodnutrition.app
            </Text>
            <Text style={[styles.demoText, { color: colors.onSurfaceVariant }]}>
              Password: demo123
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => router.push('/debug')}
          >
            <Text style={[styles.debugButtonText, { color: colors.primary }]}>
              🔧 Server Debug
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '50%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    marginBottom: 30,
    elevation: 8,
    borderRadius: 16,
  },
  cardContent: {
    padding: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 12,
    marginTop: -12,
    marginLeft: 12,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  demoSection: {
    alignItems: 'center',
    marginTop: 40,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  debugButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
  },
  debugButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

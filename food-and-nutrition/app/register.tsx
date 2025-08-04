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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await register(data.name, data.email, data.password);
      // AuthWrapper will handle navigation after successful registration
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.push('/login');
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
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Join us to start tracking your nutrition
            </Text>
          </View>

          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.form}>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Full Name"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      autoCapitalize="words"
                      autoComplete="name"
                      error={!!errors.name}
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
                {errors.name && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.name.message}
                  </Text>
                )}

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
                      autoComplete="new-password"
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

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Confirm Password"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      secureTextEntry
                      autoComplete="new-password"
                      error={!!errors.confirmPassword}
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
                {errors.confirmPassword && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.confirmPassword.message}
                  </Text>
                )}

                <Button
                  mode="contained"
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  loading={isLoading}
                  style={styles.registerButton}
                  buttonColor={colors.primary}
                  textColor={colors.onPrimary}
                  contentStyle={styles.buttonContent}
                >
                  Create Account
                </Button>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleLoginPress}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termsSection}>
            <Text style={[styles.termsText, { color: colors.onSurfaceVariant }]}>
              By creating an account, you agree to our{' '}
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Privacy Policy
              </Text>
            </Text>
          </View>
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
  registerButton: {
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
  termsSection: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { authService } from '../../services/authService';

export default function LoginScreen() {
  const { colors, isDarkMode } = useTheme();
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRole] = useState<'artisan' | 'buyer'>(params.role === 'buyer' ? 'buyer' : 'artisan');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (params.role === 'buyer' || params.role === 'artisan') {
      setRole(params.role);
      authService.setRole(params.role);
    }
  }, [params.role]);

  const handleRoleSelect = (selectedRole: 'artisan' | 'buyer') => {
    setRole(selectedRole);
    authService.setRole(selectedRole);
    setErrorMessage(null);
  };

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    try {
      authService.setRole(role);
      const success = await authService.login(identifier.trim(), password, role);
      if (success) {
        if (role === 'artisan') {
          router.replace('/(artisan)/dashboard' as any);
        } else {
          router.replace('/(buyer)/marketplace' as any);
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <View style={[styles.brandPill, isDarkMode && { backgroundColor: 'rgba(29,114,184,0.15)', borderColor: 'rgba(29,114,184,0.3)' }]}>
                <Ionicons name="flower-outline" size={13} color={isDarkMode ? colors.primary : '#94442E'} />
                <Text style={[styles.brandPillText, isDarkMode && { color: colors.primary }]}>कलाMitra</Text>
              </View>
              <Text style={styles.title}>
                <Text style={[styles.titlePrefix, { color: colors.primary }]}>{role === 'artisan' ? 'Artisan' : 'Buyer'}</Text>
                <Text style={[styles.titleSuffix, isDarkMode && { color: colors.onBackground }]}> Login</Text>
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {role === 'artisan' 
                  ? 'Access your digital store and AI cataloging tools.' 
                  : 'Explore handcrafted products and inquire wholesale.'}
              </Text>
            </View>

            <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              {/* Role Toggle Selector */}
              <View style={[styles.roleToggleContainer, { backgroundColor: isDarkMode ? '#13171F' : '#F4ECE6', borderColor: colors.borderLight }]}>
                <Pressable
                  onPress={() => handleRoleSelect('artisan')}
                  style={[styles.roleTab, role === 'artisan' && [styles.roleTabActive, { backgroundColor: colors.card }]]}
                >
                  <Text style={[styles.roleTabText, { color: colors.textMuted }, role === 'artisan' && [styles.roleTabTextActive, { color: colors.primary }]]}>
                    Artisan Login
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRoleSelect('buyer')}
                  style={[styles.roleTab, role === 'buyer' && [styles.roleTabActive, { backgroundColor: colors.card }]]}
                >
                  <Text style={[styles.roleTabText, { color: colors.textMuted }, role === 'buyer' && [styles.roleTabTextActive, { color: colors.primary }]]}>
                    Buyer Login
                  </Text>
                </Pressable>
              </View>

              {/* Input Form Fields */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.onBackground }]}>Email or Mobile Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                  placeholder="e.g. artisan@example.com or +91 98765 43210"
                  placeholderTextColor={colors.textMuted}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.onBackground }]}>Password</Text>
                <View style={[styles.passwordContainer, { backgroundColor: isDarkMode ? '#13171F' : colors.background, borderColor: colors.borderLight }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: colors.onBackground }]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                  />
                  <Pressable
                    onPress={() => setShowPassword(prev => !prev)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              <Button
                title="Login"
                onPress={handleLogin}
                variant="primary"
                style={styles.submitButton}
              />

              <Pressable
                onPress={() => router.push({ pathname: '/(auth)/register', params: { role } } as any)}
                style={styles.registerLink}
              >
                <Text style={[styles.registerLinkText, { color: colors.textMuted }]}>
                  {"Don't have an account? "}
                  <Text style={[styles.registerLinkHighlight, { color: colors.primary }]}>Register</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.marginMobile,
    justifyContent: 'center',
  },
  content: {
    paddingVertical: Spacing.xl,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(148,68,46,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148,68,46,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94442E',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  titlePrefix: {
    color: '#94442E',
  },
  titleSuffix: {
    color: '#006195',
  },
  subtitle: {
    fontSize: 15,
    color: '#6E5D53',
    lineHeight: 22,
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  roleTabActive: {
    backgroundColor: Colors.primary,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },
  roleTabTextActive: {
    color: Colors.textLight,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onBackground,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.touchTarget,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Spacing.touchTarget,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.onBackground,
    height: '100%',
    padding: 0,
  },
  eyeButton: {
    padding: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  errorContainer: {
    backgroundColor: '#FDF2F2',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#F8B4B4',
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: '#9B1C1C',
    fontWeight: '600',
    lineHeight: 18,
  },
  submitButton: {
    width: '100%',
  },
  registerLink: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: 4,
  },
  registerLinkText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  registerLinkHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

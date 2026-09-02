import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';

export default function RegisterScreen() {
  const { colors, isDarkMode } = useTheme();
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRole] = useState<'artisan' | 'buyer'>(params.role === 'buyer' ? 'buyer' : 'artisan');

  // Buyer specific fields
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Artisan specific fields
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [craft, setCraft] = useState('');
  const [location, setLocation] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'Hindi' | 'Marathi' | 'English'>('Hindi');

  // Shared fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (params.role === 'buyer' || params.role === 'artisan') {
      setRole(params.role);
    }
  }, [params.role]);

  const handleRoleChange = (selectedRole: 'artisan' | 'buyer') => {
    setRole(selectedRole);
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (role === 'buyer') {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      if (!password) {
        setErrorMessage('Please enter a password.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify.');
        return;
      }

      try {
        setIsSubmitting(true);
        const result = await authService.registerBuyer(
          {
            name: fullName.trim(),
            phone: phone.trim() || undefined,
          },
          email.trim(),
          password
        );

        if (result.emailConfirmationRequired) {
          setInfoMessage('Account created! Please check your email to confirm your account before logging in.');
        } else {
          router.replace('/(buyer)/marketplace' as any);
        }
      } catch (error: any) {
        setErrorMessage(error.message || 'Registration failed. Please check your details.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Artisan Registration
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Email and password are required.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }

      try {
        setIsSubmitting(true);
        const result = await authService.registerStore(
          {
            name: storeName.trim() || undefined,
            ownerName: ownerName.trim() || undefined,
            phone: phone.trim() || undefined,
            craft: craft.trim() || undefined,
            location: location.trim() || undefined,
            language: selectedLanguage,
          },
          email.trim(),
          password
        );

        if (result.emailConfirmationRequired) {
          setInfoMessage('Account created! Please check your email to confirm your account before logging in.');
        } else {
          router.replace('/(artisan)/dashboard' as any);
        }
      } catch (error: any) {
        setErrorMessage(error.message || 'Registration failed. Please check your details.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Screen Header */}
            <View style={styles.headerSection}>
              <View style={[styles.brandPill, isDarkMode && { backgroundColor: 'rgba(29,114,184,0.15)', borderColor: 'rgba(29,114,184,0.3)' }]}>
                <Ionicons name="flower-outline" size={13} color={isDarkMode ? colors.primary : '#94442E'} />
                <Text style={[styles.brandPillText, isDarkMode && { color: colors.primary }]}>कलाMitra</Text>
              </View>
              <Text style={styles.title}>
                <Text style={[styles.titlePrefix, { color: colors.primary }]}>
                  {role === 'artisan' ? 'Artisan' : 'Buyer'}
                </Text>
                <Text style={[styles.titleSuffix, { color: colors.onBackground }]}> Registration</Text>
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {role === 'artisan'
                  ? 'Create your digital shopfront and deploy smart AI listing helper tools.'
                  : 'Create your account to discover and connect with Indian artisans.'}
              </Text>
            </View>

            {/* Registration Card Form */}
            <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              {/* Role Toggle Selector */}
              <View style={[styles.roleToggleContainer, { backgroundColor: isDarkMode ? '#13171F' : '#F4ECE6', borderColor: colors.borderLight }]}>
                <Pressable
                  onPress={() => handleRoleChange('artisan')}
                  style={[styles.roleTab, role === 'artisan' && [styles.roleTabActive, { backgroundColor: colors.card }]]}
                >
                  <Text style={[styles.roleTabText, { color: colors.textMuted }, role === 'artisan' && [styles.roleTabTextActive, { color: colors.primary }]]}>
                    Artisan Registration
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRoleChange('buyer')}
                  style={[styles.roleTab, role === 'buyer' && [styles.roleTabActive, { backgroundColor: colors.card }]]}
                >
                  <Text style={[styles.roleTabText, { color: colors.textMuted }, role === 'buyer' && [styles.roleTabTextActive, { color: colors.primary }]]}>
                    Buyer Registration
                  </Text>
                </Pressable>
              </View>

              {/* BUYER REGISTRATION FIELDS */}
              {role === 'buyer' ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Full Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="e.g. Rahul Sharma"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Mobile Number</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Email Address</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="e.g. rahul@example.com"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Password</Text>
                    <View style={[styles.passwordContainer, { backgroundColor: isDarkMode ? '#13171F' : colors.background, borderColor: colors.borderLight }]}>
                      <TextInput
                        style={[styles.passwordInput, { color: colors.onBackground }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Create a password (min. 6 chars)"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="new-password"
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
                          size={20}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Confirm Password</Text>
                    <View style={[styles.passwordContainer, { backgroundColor: isDarkMode ? '#13171F' : colors.background, borderColor: colors.borderLight }]}>
                      <TextInput
                        style={[styles.passwordInput, { color: colors.onBackground }]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Re-enter your password"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoComplete="new-password"
                      />
                      <Pressable
                        onPress={() => setShowConfirmPassword(prev => !prev)}
                        style={styles.eyeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    </View>
                  </View>
                </>
              ) : (
                /* ARTISAN REGISTRATION FIELDS */
                <>
                  {/* Vernacular Language Selection */}
                  <View style={[styles.langSection, { backgroundColor: isDarkMode ? '#13171F' : Colors.background, borderColor: colors.borderLight }]}>
                    <Text style={[styles.langLabel, { color: colors.onBackground }]}>Vernacular Language:</Text>
                    <View style={styles.langButtons}>
                      {(['Hindi', 'Marathi', 'English'] as const).map((lang) => (
                        <Button
                          key={lang}
                          title={lang === 'Hindi' ? 'हिंदी' : lang === 'Marathi' ? 'मराठी' : 'English'}
                          onPress={() => setSelectedLanguage(lang)}
                          variant={selectedLanguage === lang ? 'primary' : 'secondary'}
                          style={styles.langButton}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Store Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                      value={storeName}
                      onChangeText={setStoreName}
                      placeholder="e.g. Savita Handicrafts"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Artisan Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                      value={ownerName}
                      onChangeText={setOwnerName}
                      placeholder="e.g. Savita Devi"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Phone Number</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Email Address</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="e.g. savita@diynest.org"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Password</Text>
                    <View style={[styles.passwordContainer, { backgroundColor: isDarkMode ? '#13171F' : colors.background, borderColor: colors.borderLight }]}>
                      <TextInput
                        style={[styles.passwordInput, { color: colors.onBackground }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Create a password (min. 6 chars)"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="new-password"
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
                          size={20}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Craft Specialization</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                      value={craft}
                      onChangeText={setCraft}
                      placeholder="e.g. Bamboo Craft, Pottery, Handloom"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.onBackground }]}>Location</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: isDarkMode ? '#13171F' : colors.background, color: colors.onBackground, borderColor: colors.borderLight }]}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="e.g. Pune, Maharashtra"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </>
              )}

              {/* Error & Info Feedback */}
              {errorMessage && (
                <View style={[
                  styles.errorContainer,
                  isDarkMode && { backgroundColor: 'rgba(155,28,28,0.2)', borderColor: 'rgba(248,180,180,0.3)' },
                ]}>
                  <Text style={[styles.errorText, isDarkMode && { color: '#F87171' }]}>⚠️ {errorMessage}</Text>
                </View>
              )}

              {infoMessage && (
                <View style={[
                  styles.infoContainer,
                  isDarkMode && { backgroundColor: 'rgba(29,114,184,0.15)', borderColor: 'rgba(29,114,184,0.3)' },
                ]}>
                  <Text style={[styles.infoText, isDarkMode && { color: colors.primary }]}>✉️ {infoMessage}</Text>
                </View>
              )}

              {/* Submit Button */}
              <Button
                title="Create Account"
                onPress={handleRegister}
                variant="primary"
                loading={isSubmitting}
                style={styles.submitButton}
              />

              {/* Link back to Login */}
              <Pressable
                onPress={() => router.push({ pathname: '/(auth)/login', params: { role } } as any)}
                style={styles.loginLink}
              >
                <Text style={[styles.loginLinkText, { color: colors.textMuted }]}>
                  {'Already have an account? '}
                  <Text style={[styles.loginLinkHighlight, { color: colors.primary }]}>Sign In</Text>
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
    paddingBottom: Spacing.xl,
  },
  content: {
    paddingVertical: Spacing.sm,
  },
  headerSection: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(148,68,46,0.1)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(148,68,46,0.25)',
    marginBottom: Spacing.xs,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94442E',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  titlePrefix: {
    color: Colors.primary,
  },
  titleSuffix: {
    color: Colors.onBackground,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4ECE6',
    borderRadius: BorderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  roleTabActive: {
    backgroundColor: Colors.card,
    ...Shadows.soft,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  roleTabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  langSection: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  langButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  langButton: {
    flex: 1,
    height: 36,
  },
  inputContainer: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onBackground,
    marginBottom: 4,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Colors.onBackground,
  },
  eyeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  errorContainer: {
    backgroundColor: '#FDF2F2',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#F8B4B4',
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: '#9B1C1C',
    fontWeight: '600',
    lineHeight: 16,
  },
  infoContainer: {
    backgroundColor: 'rgba(0,97,149,0.06)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,97,149,0.2)',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
    lineHeight: 16,
  },
  loginLink: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  loginLinkHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

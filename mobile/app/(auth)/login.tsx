import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { authService } from '../../services/authService';

export default function LoginScreen() {
  const [role, setRole] = useState<'artisan' | 'buyer'>('artisan');
  const [identifier, setIdentifier] = useState('savita@diynest.org'); // Set default dev email
  const [password, setPassword] = useState('pass1234');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);
    try {
      const success = await authService.login(identifier, password, role);
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
    <SafeAreaView style={styles.container}>
      <Header showBack={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {role === 'artisan' ? 'Artisan Login' : 'Buyer Login'}
            </Text>
            <Text style={styles.subtitle}>
              {role === 'artisan' 
                ? 'Access your digital store and AI cataloging tools.' 
                : 'Explore handcrafted products and inquire wholesale.'}
            </Text>

            <View style={styles.form}>
              {/* Role Toggle Selector */}
              <View style={styles.roleToggleContainer}>
                <Pressable
                  onPress={() => setRole('artisan')}
                  style={[styles.roleTab, role === 'artisan' && styles.roleTabActive]}
                >
                  <Text style={[styles.roleTabText, role === 'artisan' && styles.roleTabTextActive]}>
                    Artisan Login
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setRole('buyer')}
                  style={[styles.roleTab, role === 'buyer' && styles.roleTabActive]}
                >
                  <Text style={[styles.roleTabText, role === 'buyer' && styles.roleTabTextActive]}>
                    Buyer Login
                  </Text>
                </Pressable>
              </View>

              {/* Input Form Fields */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number or Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={Colors.textMuted}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType={identifier.includes('@') ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ℹ️ Dev mode: Sign in using your registered Supabase email credentials.
                </Text>
              </View>

              <Button
                title="Login"
                onPress={handleLogin}
                variant="primary"
                style={styles.submitButton}
              />

              <Pressable
                onPress={() => router.push('/(auth)/register' as any)}
                style={styles.registerLink}
              >
                <Text style={styles.registerLinkText}>
                  {"Don't have an account? "}
                  <Text style={styles.registerLinkHighlight}>Register</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
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
  warningContainer: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  warningText: {
    fontSize: 13,
    color: Colors.secondary,
    lineHeight: 18,
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

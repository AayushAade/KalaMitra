import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Button from '../../components/Button';
import Header from '../../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';

export default function RegisterScreen() {
  const [storeName, setStoreName] = useState('Savita Handicrafts');
  const [ownerName, setOwnerName] = useState('Savita Devi');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('savita@diynest.org');
  const [password, setPassword] = useState('pass1234');
  const [craft, setCraft] = useState('Bamboo & Textile Crafts');
  const [location, setLocation] = useState('Pune, Maharashtra');
  const [selectedLanguage, setSelectedLanguage] = useState<'Hindi' | 'Marathi' | 'English'>('Hindi');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      const result = await authService.registerStore(
        {
          name: storeName,
          ownerName,
          phone,
          craft,
          location,
          language: selectedLanguage
        },
        email,
        password
      );

      if (result.emailConfirmationRequired) {
        setInfoMessage('Account created! Please check your email to confirm your account before logging in.');
      } else {
        router.replace('/(artisan)/dashboard' as any);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed. Please check your details.');
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
            <Text style={styles.title}>Register Store</Text>
            <Text style={styles.subtitle}>
              Create your digital shopfront and deploy smart AI listing helper tools.
            </Text>

            <View style={styles.form}>
              {/* Language Selection */}
              <View style={styles.langSection}>
                <Text style={styles.langLabel}>Vernacular Language:</Text>
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

              {/* Form Inputs */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Store Name</Text>
                <TextInput
                  style={styles.input}
                  value={storeName}
                  onChangeText={setStoreName}
                  placeholder="e.g. Savita Handicrafts"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Artisan Name</Text>
                <TextInput
                  style={styles.input}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="e.g. Savita Devi"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. savita@diynest.org"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Craft Specialization</Text>
                <TextInput
                  style={styles.input}
                  value={craft}
                  onChangeText={setCraft}
                  placeholder="e.g. Bamboo Craft"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Pune, Maharashtra"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              {infoMessage && (
                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>✉️ {infoMessage}</Text>
                </View>
              )}

              <Button
                title="Create Account"
                onPress={handleRegister}
                variant="primary"
                style={styles.submitButton}
              />
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
  },
  content: {
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
    marginBottom: Spacing.xl,
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
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  langButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  langButton: {
    flex: 1,
    height: 38,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onBackground,
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.touchTarget,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.onBackground,
    backgroundColor: Colors.background,
  },
  submitButton: {
    width: '100%',
    marginTop: Spacing.sm,
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
  infoContainer: {
    backgroundColor: 'rgba(0,97,149,0.06)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,97,149,0.2)',
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '600',
    lineHeight: 18,
  },
});

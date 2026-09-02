import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<'Hindi' | 'Marathi' | 'English'>('English');

  const languages = [
    { code: 'Hindi', label: 'हिंदी (Hindi)', sub: 'अपनी भाषा में कलासूची बनाएं' },
    { code: 'Marathi', label: 'मराठी (Marathi)', sub: 'तुमच्या भाषेत उत्पादन सूची तयार करा' },
    { code: 'English', label: 'English', sub: 'Translate and catalog in global english language' },
  ] as const;

  const handleSave = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Language Preferences</Text>
          <Text style={styles.subtitle}>
            Select your preferred language. AI cataloging helper tools will accept descriptions in this language.
          </Text>

          <View style={styles.list}>
            {languages.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => setSelectedLanguage(lang.code)}
                  style={[
                    styles.item,
                    isSelected && styles.itemSelected,
                  ]}
                >
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemLabel, isSelected && styles.textSelected]}>
                      {lang.label}
                    </Text>
                    <Text style={styles.itemSub}>{lang.sub}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Button
            title="Save Preferences"
            onPress={handleSave}
            variant="primary"
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.marginMobile,
  },
  content: {
    paddingVertical: Spacing.xl,
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
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  list: {
    marginBottom: Spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  itemSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  textSelected: {
    color: Colors.primary,
  },
  itemSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  saveButton: {
    width: '100%',
  },
});

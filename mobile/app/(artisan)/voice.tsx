import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCreation } from '../../context/ProductCreationContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { voiceService } from '../../services/voiceService';
import { catalogService } from '../../services/catalogService';

export default function VoiceScreen() {
  const { productData, updateProductData } = useProductCreation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState(productData.voiceText || '');
  const [lang, setLang] = useState<'Hindi' | 'Marathi' | 'English'>('Hindi');

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording, start processing
      setIsRecording(false);
      setIsProcessing(true);
      
      const processVoice = async () => {
        try {
          const selectedLang = lang;
          const voiceRes = await voiceService.processMockVoice(productData.name || '', selectedLang);
          const catalogRes = await catalogService.generateMockCatalog(productData.name || '', voiceRes.transcript);
          
          setIsProcessing(false);
          setTranscript(voiceRes.transcript);
          updateProductData({
            voiceText: voiceRes.transcript,
            language: selectedLang,
            ...catalogRes
          });
        } catch (err) {
          console.error(err);
          setIsProcessing(false);
        }
      };
      processVoice();
    } else {
      // Start recording
      setTranscript('');
      setRecordingSeconds(0);
      setIsRecording(true);
    }
  };

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleNext = () => {
    updateProductData({ step: 4 });
    router.push('/(artisan)/catalog' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="AI Voice Cataloger" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Wizard Progress */}
        <View style={styles.wizard}>
          <Text style={styles.wizardLabel}>Step 3 of 5: Voice Description</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressIndicator, { width: '60%' }]} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Speak in your Language</Text>
          <Text style={styles.subtitle}>Tell the story, materials, and creation details of your craft.</Text>

          {/* Vernacular Language select */}
          <View style={styles.langSelector}>
            {(['Hindi', 'Marathi', 'English'] as const).map(l => (
              <Pressable
                key={l}
                onPress={() => setLang(l)}
                style={[styles.langBadge, lang === l && styles.langBadgeSelected]}
              >
                <Text style={[styles.langText, lang === l && styles.langTextSelected]}>
                  {l === 'Hindi' ? 'हिंदी' : l === 'Marathi' ? 'मराठी' : 'English'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recording interface */}
          <View style={styles.recorderBox}>
            <Text style={styles.timerText}>{formatTime(recordingSeconds)}</Text>
            
            <Pressable
              onPress={toggleRecording}
              style={[
                styles.micButton,
                isRecording && styles.micButtonActive,
                styles.glowBorder
              ]}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={36}
                color={Colors.textLight}
              />
            </Pressable>

            <Text style={styles.recordStatus}>
              {isRecording ? 'Recording... Tap to stop' : 'Tap microphone to speak'}
            </Text>
          </View>

          {/* AI Extract Progress Loader */}
          {isProcessing && (
            <View style={styles.processingCard}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.processingText}>AI analyzing speech & translating catalog...</Text>
            </View>
          )}

          {/* Results Transcript Box */}
          {transcript !== '' && !isProcessing && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Captured Speech Transcript ({lang})</Text>
              <Text style={styles.resultBody}>{transcript}</Text>

              <View style={styles.extractedAlert}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                <Text style={styles.alertText}>AI successfully generated English & Hindi draft descriptions!</Text>
              </View>
            </View>
          )}

          <Button
            title="Continue to Catalog Draft"
            onPress={handleNext}
            disabled={transcript === '' || isProcessing}
            variant="primary"
            style={styles.nextButton}
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
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.md,
  },
  wizard: {
    marginBottom: Spacing.lg,
  },
  wizardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  content: {
    paddingVertical: Spacing.sm,
  },
  title: {
    fontSize: 24,
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
  langSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  langBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  langBadgeSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
  },
  langTextSelected: {
    color: Colors.textLight,
  },
  recorderBox: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
    marginBottom: Spacing.lg,
  },
  timerText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.md,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  micButtonActive: {
    backgroundColor: Colors.tertiary,
  },
  glowBorder: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordStatus: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  processingCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: Spacing.md,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  resultBody: {
    fontSize: 15,
    color: Colors.onBackground,
    lineHeight: 22,
  },
  extractedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,97,149,0.06)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  nextButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
});

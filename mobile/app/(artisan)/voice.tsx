import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useProductCreation } from '../../context/ProductCreationContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { voiceService } from '../../services/voiceService';
import { VoiceExtractionMetadata } from '../../types';

export default function VoiceScreen() {
  const { colors, isDarkMode } = useTheme();
  const { productData, updateProductData } = useProductCreation();

  const [permissionResponse, setPermissionResponse] = useState<Audio.PermissionResponse | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState(productData.voiceText || '');
  const [detectedLang, setDetectedLang] = useState(productData.language || 'Hindi');
  const [extractedData, setExtractedData] = useState<VoiceExtractionMetadata | null>(null);
  const [selectedHintLang, setSelectedHintLang] = useState<'Hindi' | 'Marathi' | 'English'>('Hindi');
  const [manualText, setManualText] = useState('');
  const [showManualFallback, setShowManualFallback] = useState(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const status = await Audio.getPermissionsAsync();
        setPermissionResponse(status);
      } catch (err) {
        console.warn('[VoiceScreen] Error fetching audio permissions:', err);
      }
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const resp = await Audio.requestPermissionsAsync();
      setPermissionResponse(resp);
      return resp.granted;
    } catch (err) {
      console.error('[VoiceScreen] Error requesting mic permission:', err);
      Alert.alert('Permission Error', 'Could not request microphone access.');
      return false;
    }
  };

  const startRecording = async () => {
    try {
      // 1. Check or request permission
      let granted = permissionResponse?.granted;
      if (!granted) {
        granted = await requestMicrophonePermission();
        if (!granted) {
          Alert.alert(
            'Microphone Required',
            'Please allow microphone access to record the description of your craft.'
          );
          return;
        }
      }

      // 2. Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('[VoiceScreen] Starting audio recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingSeconds(0);
      setTranscript('');
      setExtractedData(null);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('[VoiceScreen] Failed to start recording:', err);
      Alert.alert('Recording Error', err.message || 'Failed to start microphone recording.');
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('[VoiceScreen] Stopping audio recording...');
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      await recording.stopAndUnloadAsync();
      const audioUri = recording.getURI();
      setRecording(null);

      if (!audioUri) {
        Alert.alert('Recording Failed', 'Could not retrieve the recorded audio file.');
        return;
      }

      if (recordingSeconds < 1) {
        Alert.alert('Recording Too Short', 'Please speak for at least 2 seconds about your craft.');
        return;
      }

      console.log(`[VoiceScreen] Recording saved at: ${audioUri} (Duration: ${recordingSeconds}s)`);

      // 3. Process voice recording via FastAPI
      setIsProcessing(true);
      const voiceRes = await voiceService.transcribeAndExtract(audioUri, selectedHintLang);

      setTranscript(voiceRes.transcript);
      setDetectedLang(voiceRes.detected_language);
      setExtractedData(voiceRes.metadata);

      // 4. Update ProductCreationContext
      updateProductData({
        voiceText: voiceRes.transcript,
        language: voiceRes.detected_language,
        name: voiceRes.metadata.product_name,
        category: voiceRes.metadata.category,
        material: voiceRes.metadata.material || undefined,
        craft: voiceRes.metadata.craft_type || undefined,
        productionTime: voiceRes.metadata.production_time_days
          ? `${voiceRes.metadata.production_time_days} days`
          : undefined,
        descriptionEnglish: voiceRes.metadata.description_english || undefined,
        descriptionHindi: voiceRes.metadata.description_hindi || undefined,
        tags: voiceRes.metadata.tags && voiceRes.metadata.tags.length > 0
          ? voiceRes.metadata.tags
          : undefined,
        step: 4,
      });
    } catch (err: any) {
      console.error('[VoiceScreen] Error during voice processing:', err);
      Alert.alert(
        'AI Voice Processing Error',
        err.message || 'Could not analyze voice recording. You can retry speaking or type details manually.',
        [
          { text: 'Retry Recording', onPress: () => {} },
          { text: 'Type Manually', onPress: () => setShowManualFallback(true) },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) {
      Alert.alert('Description Required', 'Please enter a brief craft description.');
      return;
    }

    setTranscript(manualText.trim());
    updateProductData({
      voiceText: manualText.trim(),
      language: selectedHintLang,
      descriptionEnglish: manualText.trim(),
      descriptionHindi: manualText.trim(),
      step: 4,
    });
    setShowManualFallback(false);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header showBack={true} title="AI Voice Studio" />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}>
        {/* Wizard Progress */}
        <View style={[styles.wizard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.wizardLabel, { color: colors.primary }]}>Step 3 of 5: Voice Description</Text>
          <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#222A36' : colors.borderLight }]}>
            <View style={[styles.progressIndicator, { width: '60%', backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.title, { color: colors.onBackground }]}>Speak in your Language</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Describe the materials, weaving or crafting technique, and the story of your creation.
          </Text>

          {/* Vernacular Language select */}
          <View style={styles.langSelector}>
            {(['Hindi', 'Marathi', 'English'] as const).map(l => (
              <Pressable
                key={l}
                onPress={() => setSelectedHintLang(l)}
                style={[
                  styles.langBadge,
                  { backgroundColor: colors.card, borderColor: colors.borderLight },
                  selectedHintLang === l && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.langText, { color: selectedHintLang === l ? colors.onPrimary : colors.textMuted }]}>
                  {l === 'Hindi' ? 'हिंदी' : l === 'Marathi' ? 'मराठी' : 'English'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recording interface */}
          <View style={[styles.recorderBox, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.timerText, { color: colors.onBackground }]}>
              {isRecording ? formatTime(recordingSeconds) : '0:00'}
            </Text>

            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              style={[
                styles.micButton,
                { backgroundColor: colors.primary },
                isRecording && styles.micButtonActive,
                styles.glowBorder,
              ]}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={38}
                color={colors.onPrimary}
              />
            </Pressable>

            <Text style={[styles.recordStatus, { color: colors.textMuted }]}>
              {isRecording
                ? 'Listening... Tap to stop'
                : isProcessing
                ? 'Creating your product story...'
                : 'Tap microphone to speak'}
            </Text>

            {isRecording && (
              <View style={styles.waveformContainer}>
                <View style={[styles.waveBar, { height: 14 }]} />
                <View style={[styles.waveBar, { height: 28 }]} />
                <View style={[styles.waveBar, { height: 42 }]} />
                <View style={[styles.waveBar, { height: 22 }]} />
                <View style={[styles.waveBar, { height: 35 }]} />
                <View style={[styles.waveBar, { height: 18 }]} />
              </View>
            )}
          </View>

          {/* AI Extract Progress Loader */}
          {isProcessing && (
            <View style={[styles.processingCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.processingTitle, { color: colors.onBackground }]}>AI Analyzing Voice & Cataloging...</Text>
              <Text style={[styles.processingSub, { color: colors.textMuted }]}>
                Detecting language, extracting materials, craft tradition, and drafting multilingual listings.
              </Text>
            </View>
          )}

          {/* Results Transcript Box */}
          {transcript !== '' && !isProcessing && (
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={styles.resultHeader}>
                <Ionicons name="sparkles" size={18} color={colors.primary} />
                <Text style={[styles.resultLabel, { color: colors.primary }]}>
                  Captured Speech ({detectedLang})
                </Text>
              </View>
              <Text style={[styles.resultBody, { color: colors.onBackground }]}>{transcript}</Text>

              {extractedData && (
                <View style={styles.extractedSummary}>
                  <Text style={[styles.summaryTitle, { color: colors.onBackground }]}>AI Extracted Highlights:</Text>
                  <Text style={[styles.summaryRow, { color: colors.textMuted }]}>🏷️ <Text style={[styles.bold, { color: colors.onBackground }]}>Title:</Text> {extractedData.product_name}</Text>
                  <Text style={[styles.summaryRow, { color: colors.textMuted }]}>🧵 <Text style={[styles.bold, { color: colors.onBackground }]}>Material:</Text> {extractedData.material || 'Handcrafted'}</Text>
                  <Text style={[styles.summaryRow, { color: colors.textMuted }]}>🎨 <Text style={[styles.bold, { color: colors.onBackground }]}>Craft:</Text> {extractedData.craft_type || 'Traditional Art'}</Text>
                  {extractedData.production_time_days && (
                    <Text style={[styles.summaryRow, { color: colors.textMuted }]}>⏱️ <Text style={[styles.bold, { color: colors.onBackground }]}>Time:</Text> {extractedData.production_time_days} days</Text>
                  )}
                </View>
              )}

              <View style={[
                styles.extractedAlert,
                {
                  backgroundColor: isDarkMode ? 'rgba(46,125,50,0.2)' : '#e8f5e9',
                  borderColor: isDarkMode ? 'rgba(74,222,128,0.3)' : 'transparent',
                  borderWidth: isDarkMode ? 1 : 0,
                },
              ]}>
                <Ionicons name="checkmark-circle" size={20} color={isDarkMode ? '#4ADE80' : '#2e7d32'} />
                <Text style={[styles.alertText, { color: isDarkMode ? '#4ADE80' : '#2e7d32' }]}>
                  AI successfully generated English & Hindi catalog drafts!
                </Text>
              </View>
            </View>
          )}

          {/* Manual Fallback Toggle */}
          {!isRecording && !isProcessing && (
            <Pressable
              onPress={() => setShowManualFallback(prev => !prev)}
              style={styles.manualToggle}
            >
              <Text style={[styles.manualToggleText, { color: colors.primary }]}>
                {showManualFallback ? 'Hide manual text entry' : 'Or type description manually'}
              </Text>
            </Pressable>
          )}

          {showManualFallback && (
            <View style={[styles.manualBox, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Text style={[styles.manualLabel, { color: colors.onBackground }]}>Enter Craft Story Manually:</Text>
              <TextInput
                style={[
                  styles.manualInput,
                  {
                    backgroundColor: isDarkMode ? '#13171F' : colors.background,
                    color: colors.onBackground,
                    borderColor: colors.borderLight,
                  },
                ]}
                placeholder="Describe materials, process, size, and tradition..."
                placeholderTextColor={colors.textMuted}
                value={manualText}
                onChangeText={setManualText}
                multiline
                numberOfLines={3}
              />
              <Button
                title="Save Manual Description"
                onPress={handleManualSubmit}
                variant="secondary"
                style={styles.saveManualBtn}
              />
            </View>
          )}

          {/* Action Button */}
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
    paddingBottom: Spacing.xl,
  },
  wizard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
    marginBottom: Spacing.md,
  },
  wizardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  content: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  langSelector: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  langBadge: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  langBadgeSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  langTextSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  recorderBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onBackground,
    marginBottom: Spacing.md,
    fontVariant: ['tabular-nums'],
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
    marginBottom: Spacing.sm,
  },
  micButtonActive: {
    backgroundColor: '#d32f2f',
    transform: [{ scale: 1.05 }],
  },
  glowBorder: {
    borderWidth: 4,
    borderColor: 'rgba(193, 154, 107, 0.25)',
  },
  recordStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    height: 48,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#d32f2f',
    borderRadius: 2,
  },
  processingCard: {
    backgroundColor: 'rgba(193, 154, 107, 0.08)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(193, 154, 107, 0.25)',
  },
  processingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  processingSub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  resultCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  resultBody: {
    fontSize: 14,
    color: Colors.onBackground,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  extractedSummary: {
    backgroundColor: Colors.card,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: 4,
  },
  summaryRow: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  bold: {
    fontWeight: '700',
    color: Colors.onBackground,
  },
  extractedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
    flex: 1,
  },
  manualToggle: {
    alignSelf: 'center',
    paddingVertical: 6,
    marginBottom: Spacing.sm,
  },
  manualToggleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  manualBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  manualLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: 6,
  },
  manualInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
    fontSize: 13,
    color: Colors.onBackground,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: Spacing.sm,
  },
  saveManualBtn: {
    marginTop: 2,
  },
  nextButton: {
    marginTop: Spacing.xs,
  },
});

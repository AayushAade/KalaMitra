import { Platform } from 'react-native';
import { api } from './api';
import { VoiceTranscribeResponse, VoiceResult } from '../types';

export const voiceService = {
  /**
   * Sends recorded audio file to FastAPI for Gemini vernacular transcription and structured product understanding.
   */
  transcribeAndExtract: async (
    audioUri: string,
    languageHint?: string
  ): Promise<VoiceTranscribeResponse> => {
    if (!audioUri || !audioUri.trim()) {
      throw new Error('No audio recording URI provided.');
    }

    const filename = audioUri.split('/').pop() || 'recording.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'm4a';
    const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mpeg' : ext === 'aac' ? 'audio/aac' : 'audio/m4a';

    console.log(`[VoiceService] ========================================`);
    console.log(`[VoiceService] Transcribing Audio via FastAPI`);
    console.log(`[VoiceService] Platform:      ${Platform.OS}`);
    console.log(`[VoiceService] Audio File:    ${filename} (${mimeType})`);
    console.log(`[VoiceService] Language Hint: ${languageHint || 'Auto-detect'}`);
    console.log(`[VoiceService] Target API:    /api/v1/voice/transcribe-and-extract`);
    console.log(`[VoiceService] ========================================`);

    const formData = new FormData();

    if (Platform.OS === 'web') {
      const fetchRes = await fetch(audioUri);
      if (!fetchRes.ok) {
        throw new Error(`Failed to fetch web audio recording (${fetchRes.status})`);
      }
      const blob = await fetchRes.blob();
      formData.append('audio', blob, filename);
    } else {
      formData.append('audio', {
        uri: audioUri,
        name: filename,
        type: mimeType,
      } as any);
    }

    if (languageHint) {
      formData.append('language_hint', languageHint);
    }

    const response = await api.post<VoiceTranscribeResponse>(
      '/api/v1/voice/transcribe-and-extract',
      formData
    );

    if (!response || !response.success) {
      const errorMsg = response?.error || 'Voice processing failed to transcribe audio.';
      console.error('[VoiceService] Backend error:', response);
      throw new Error(errorMsg);
    }

    console.log(`[VoiceService] Successfully transcribed in ${response.detected_language}: "${response.transcript}"`);
    console.log(`[VoiceService] Extracted Product: "${response.metadata?.product_name}" (${response.metadata?.category})`);

    return response;
  },

  /**
   * Fallback simulation for offline testing
   */
  processMockVoice: async (presetName: string, language: 'Hindi' | 'Marathi' | 'English'): Promise<VoiceResult> => {
    console.log(`[VoiceService] Processing simulated voice in ${language} for preset: ${presetName}`);
    await new Promise(resolve => setTimeout(resolve, 1200));

    let transcript = '';
    if (presetName === 'Silk Dupatta') {
      transcript = 'यह एक हाथ से बुना हुआ लाल और सुनहरी जरी वाला सिल्क दुपट्टा है। इसे तैयार करने में 5 दिन का समय लगा है।';
    } else if (presetName === 'Bamboo Basket') {
      transcript = 'बांस की बनी सुंदर टोकरी है, घरेलू उपयोग के लिए टिकाऊ है। इसे बनाने में दो दिन का समय लगता है।';
    } else {
      transcript = 'मिट्टी का फूलदान है, हाथ से पेंट किया हुआ सुंदर पारंपरिक चित्रकारी है।';
    }

    return {
      transcript,
      detectedLanguage: language,
    };
  },
};

import { VoiceResult } from '../types';

export const voiceService = {
  processMockVoice: async (presetName: string, language: 'Hindi' | 'Marathi' | 'English'): Promise<VoiceResult> => {
    console.log(`[VoiceService] Processing simulated voice in ${language} for preset: ${presetName}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    let transcript = '';
    if (presetName === 'Silk Dupatta') {
      transcript = "यह एक हाथ से बुना हुआ लाल और सुनहरी जरी वाला सिल्क दुपट्टा है। इसे तैयार करने में 5 दिन का समय लगा है।";
    } else if (presetName === 'Bamboo Basket') {
      transcript = "बांस की बनी सुंदर टोकरी है, घरेलू उपयोग के लिए टिकाऊ है। इसे बनाने में दो दिन का समय लगता है।";
    } else {
      transcript = "मिट्टी का फूलदान है, हाथ से पेंट किया हुआ सुंदर आदिवासी चित्रकारी है।";
    }

    return {
      transcript,
      detectedLanguage: language
    };
  }
};

import { request } from './api';

export const voiceService = {
  async processVoiceDescription(audioBlobOrText) {
    try {
      return await request('/catalog/voice', {
        method: 'POST',
        body: JSON.stringify({ audio: audioBlobOrText }),
      });
    } catch {
      // Mock extracted product info from voice input
      return {
        transcription: "यह रेशम की हाथ से बुनी लाल और सुनहरी दुपट्टा है। इसमें 5 दिन की मेहनत लगी है और प्राकृतिक जरी का धागा इस्तेमाल हुआ है।",
        extractedData: {
          title: "Handwoven Red and Gold Silk Dupatta",
          titleHindi: "हाथ से बुनी लाल और सुनहरी रेशमी दुपट्टा",
          category: "Textiles & Apparel",
          material: "Pure Mulberry Silk & Zari Thread",
          color: "Terracotta Red & Metallic Gold",
          craft: "Traditional Handloom Weaving",
          productionTime: "5 days",
          productionTimeDays: 5,
          materialCost: 700,
          laborHours: 24,
          dimensions: "2.5m x 1.0m",
          careInstructions: "Dry clean only"
        }
      };
    }
  }
};

export default voiceService;

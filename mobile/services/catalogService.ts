import { CatalogDraft } from '../types';

export const catalogService = {
  generateMockCatalog: async (presetName: string, transcript: string): Promise<CatalogDraft> => {
    console.log(`[CatalogService] Extracting metadata from transcript: "${transcript}"`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (presetName === 'Silk Dupatta') {
      return {
        name: "Handwoven Red and Gold Silk Dupatta",
        category: "Textiles",
        material: "Pure Silk & Gold Zari Thread",
        craft: "Traditional Handloom Weaving",
        productionTime: "5 days",
        descriptionEnglish: "Masterfully woven by skilled artisans in Maharashtra, this silk dupatta showcases intricate traditional handloom craft. Soft, lustrous pure silk intertwined with delicate zari highlights.",
        descriptionHindi: "महाराष्ट्र के कुशल कारीगरों द्वारा हस्तनिर्मित, यह रेशमी दुपट्टा पारंपरिक हथकरघा कला की अनूठी मिसाल है। शुद्ध शहतूत रेशम और जरी की कारीगरी से सजा।",
        tags: ["Silk", "Handloom", "Red & Gold", "Festive"]
      };
    } else if (presetName === 'Bamboo Basket') {
      return {
        name: "Bamboo Storage Basket",
        category: "Bamboo Craft",
        material: "Natural Treated Bamboo Strip",
        craft: "Hand-braided Weaving",
        productionTime: "2 days",
        descriptionEnglish: "Eco-friendly, durable bamboo basket hand-woven with precision. Perfect for household storage, hamper gifting, or home decor accent.",
        descriptionHindi: "पर्यावरण-अनुकूल और टिकाऊ बांस की टोकरी जिसे बड़ी कुशलता से हाथ से बुना गया है।",
        tags: ["Bamboo", "Eco-friendly", "Home Decor"]
      };
    } else {
      return {
        name: "Handpainted Terracotta Vase",
        category: "Pottery",
        material: "Terracotta Clay & Natural Pigments",
        craft: "Wheel Pottery & Tribal Painting",
        productionTime: "4 days",
        descriptionEnglish: "Elegant earthenware vase hand-thrown on the potter's wheel and painted with indigenous geometric motifs.",
        descriptionHindi: "कुम्हार के चाक पर ढला और लोक चित्रों से सजा खूबसूरत मिट्टी का फूलदान।",
        tags: ["Pottery", "Vase", "Handpainted"]
      };
    }
  }
};

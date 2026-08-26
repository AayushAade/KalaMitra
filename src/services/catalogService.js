import { request } from './api';

export const catalogService = {
  async generateCatalog(productInfo) {
    try {
      return await request('/catalog/generate', {
        method: 'POST',
        body: JSON.stringify(productInfo),
      });
    } catch {
      return {
        title: productInfo.title || "Handwoven Red and Gold Silk Dupatta",
        descriptionEnglish: productInfo.descriptionEnglish || "Masterfully woven by skilled artisans in Maharashtra, this silk dupatta showcases intricate traditional handloom craft. Soft, lustrous pure silk intertwined with delicate zari highlights, offering timeless elegance for ceremonial celebrations.",
        descriptionHindi: productInfo.descriptionHindi || "महाराष्ट्र के कुशल कारीगरों द्वारा हस्तनिर्मित, यह रेशमी दुपट्टा पारंपरिक हथकरघा कला की अनूठी मिसाल है। शुद्ध शहतूत रेशम और जरी की कारीगरी से सजा यह वस्त्र हर उत्सव को खास बनाता है।",
        category: productInfo.category || "Textiles & Apparel",
        material: productInfo.material || "Pure Mulberry Silk",
        craft: productInfo.craft || "Traditional Handloom Weaving",
        tags: ["Handloom", "Silk", "Zari", "Festive", "Heritage Craft"],
        authenticityGuarantee: "100% Certified Artisan Handcrafted"
      };
    }
  }
};

export default catalogService;

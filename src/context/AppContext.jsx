import React, { createContext, useContext, useState } from 'react';
import { initialArtisan, initialProducts, initialInquiries, initialAssistantTips } from '../data/initialData';

const AppContext = createContext();

const initialProductCreationState = {
  step: 1, // 1: Photo, 2: Enhancement, 3: Voice, 4: AI Details, 5: Catalog, 6: Pricing, 7: Inventory, 8: Preview, 9: Published
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTZ9ZdYNYjwvq9BLRKmIA8lrCueU6ss5NaK7NcL4tV4_640CzTmWYawWfXIL62guK6U4_aeNsP7XEHi_XCKkdFsG-Uvz-z5jxlfa6wI8-E_xR433XGR0x6KTEbjRK_uiGbQSYAjI_VKHuDAz206-2hYYSd4fQVwHVL-kFP4xv_pWeHnOMFLjUesGEMNGw8AmVV27wnmQ61K0QrPI4Wd3z2iwGPsmqyHIZPnbctLtiY-23o1zoi5D7c",
  enhancedImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9NdqtHHuX-C3fTyPOFZyJHmhxGdmIUVFNHQnBFec-x4sM6nam9v8zGl_A50EYGmZPn11LroWhvKHY5FCPYBHMXB8smCONqVv0H_O5bW-yoFUMcCyNZrnpHOq1c5STMMu_HCBEfCqtgew-DNpDA_CpmKQ8Hqd4TNZ9Ul3u_9AuI_LdlQ_rhb5UzODrcnCCzKSeWTTtYcrI2hIt2BuU6Z06-W5UYr8AKVJJQ3n9_6C3Kg4iBz6f2QhI",
  voiceRecorded: false,
  voiceText: "यह रेशम की हाथ से बुनी लाल और सुनहरी दुपट्टा है। इसमें 5 दिन की मेहनत लगी है और प्राकृतिक जरी का धागा इस्तेमाल हुआ है।",
  title: "Handwoven Red and Gold Silk Dupatta",
  titleHindi: "हाथ से बुनी लाल और सुनहरी रेशमी दुपट्टा",
  category: "Textiles",
  material: "Pure Mulberry Silk & Gold Zari Thread",
  craft: "Traditional Handloom Weaving",
  productionTime: "5 days",
  productionTimeDays: 5,
  descriptionEnglish: "Masterfully woven by skilled artisans in Maharashtra, this silk dupatta showcases intricate traditional handloom craft. Soft, lustrous pure silk intertwined with delicate zari highlights.",
  descriptionHindi: "महाराष्ट्र के कुशल कारीगरों द्वारा हस्तनिर्मित, यह रेशमी दुपट्टा पारंपरिक हथकरघा कला की अनूठी मिसाल है।",
  tags: ["Handloom", "Silk", "Zari", "Festive"],
  materialCost: 700,
  laborHours: 24,
  aiSuggestedPrice: 1850,
  priceRange: { min: 1600, max: 2100 },
  finalPrice: 1850,
  quantity: 10,
  madeToOrder: true,
  minBulkOrder: 20,
  status: "Draft"
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(initialArtisan);
  const [products, setProducts] = useState(initialProducts);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [assistantTips, setAssistantTips] = useState(initialAssistantTips);
  const [currentProduct, setCurrentProduct] = useState(initialProductCreationState);
  const [language, setLanguage] = useState('English');

  // User Auth Actions
  const loginUser = (userData) => {
    setUser({ ...initialArtisan, ...userData });
  };

  const logoutUser = () => {
    setUser(null);
  };

  // Product Actions
  const updateCurrentProduct = (data) => {
    setCurrentProduct((prev) => ({ ...prev, ...data }));
  };

  const resetCurrentProduct = () => {
    setCurrentProduct({ ...initialProductCreationState, step: 1, status: "Draft" });
  };

  const publishCurrentProduct = () => {
    const newProduct = {
      id: `prod-${Date.now()}`,
      artisanId: user?.id || "artisan-101",
      artisanName: user?.name || "Savita Handicrafts",
      artisanLocation: user?.location || "Pune, Maharashtra",
      title: currentProduct.title,
      titleHindi: currentProduct.titleHindi,
      category: currentProduct.category,
      price: Number(currentProduct.finalPrice) || currentProduct.aiSuggestedPrice,
      aiSuggestedPrice: currentProduct.aiSuggestedPrice,
      priceRange: currentProduct.priceRange,
      material: currentProduct.material,
      craft: currentProduct.craft,
      productionTime: currentProduct.productionTime,
      productionTimeDays: currentProduct.productionTimeDays,
      quantity: Number(currentProduct.quantity) || 1,
      madeToOrder: currentProduct.madeToOrder,
      minBulkOrder: currentProduct.minBulkOrder,
      status: "Published",
      image: currentProduct.enhancedImage || currentProduct.image,
      originalImage: currentProduct.image,
      descriptionEnglish: currentProduct.descriptionEnglish,
      descriptionHindi: currentProduct.descriptionHindi,
      tags: currentProduct.tags || ["Handmade", "Artisan Craft"],
      rating: 5.0,
      reviews: 0
    };

    setProducts((prev) => [newProduct, ...prev]);
    setCurrentProduct((prev) => ({ ...prev, status: "Published", publishedId: newProduct.id }));
    return newProduct;
  };

  const updateProduct = (id, updatedFields) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  // Inquiry Actions
  const addInquiry = (inquiryData) => {
    const newInquiry = {
      id: `inq-${Date.now()}`,
      status: "New",
      date: "Just now",
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "Buyer",
          text: inquiryData.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      ...inquiryData
    };
    setInquiries((prev) => [newInquiry, ...prev]);
    return newInquiry;
  };

  const replyToInquiry = (inquiryId, messageText) => {
    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id === inquiryId) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            sender: user?.role === 'buyer' ? 'Buyer' : 'Artisan',
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return {
            ...inq,
            status: "Replied",
            messages: [...(inq.messages || []), newMsg]
          };
        }
        return inq;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        products,
        inquiries,
        assistantTips,
        currentProduct,
        language,
        setLanguage,
        loginUser,
        logoutUser,
        updateCurrentProduct,
        resetCurrentProduct,
        publishCurrentProduct,
        updateProduct,
        deleteProduct,
        addInquiry,
        replyToInquiry
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;

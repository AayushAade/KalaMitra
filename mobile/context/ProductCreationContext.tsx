import React, { createContext, useContext, useState } from 'react';

export interface ProductCreationState {
  image?: string;
  enhancedImage?: string;
  voiceText?: string;
  name?: string;
  category?: string;
  material?: string;
  price?: number;
  aiSuggestedPrice?: number;
  priceRange?: { min: number; max: number };
  explanation?: string;
  materialCost?: number;
  laborCost?: number;
  otherCost?: number;
  descriptionEnglish?: string;
  descriptionHindi?: string;
  keywords?: string[];
  quantity?: number;
  step?: number;
  tags?: string[];
  craft?: string;
  productionTime?: string;
  language?: string;
}

interface ProductCreationContextType {
  productData: ProductCreationState;
  updateProductData: (data: Partial<ProductCreationState>) => void;
  resetProductData: () => void;
}

const ProductCreationContext = createContext<ProductCreationContextType | undefined>(undefined);

export const ProductCreationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productData, setProductData] = useState<ProductCreationState>({ step: 1 });

  const updateProductData = (data: Partial<ProductCreationState>) => {
    setProductData(prev => ({ ...prev, ...data }));
  };

  const resetProductData = () => {
    setProductData({ step: 1 });
  };

  return (
    <ProductCreationContext.Provider value={{ productData, updateProductData, resetProductData }}>
      {children}
    </ProductCreationContext.Provider>
  );
};

export const useProductCreation = () => {
  const context = useContext(ProductCreationContext);
  if (!context) {
    throw new Error('useProductCreation must be used within a ProductCreationProvider');
  }
  return context;
};

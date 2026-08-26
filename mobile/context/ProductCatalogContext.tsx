import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Inquiry, Message } from '../types';
import { productService } from '../services/productService';
import { inquiryService } from '../services/inquiryService';
import { chatService } from '../services/chatService';

interface ProductCatalogContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  inquiries: Inquiry[];
  addInquiry: (inquiry: Inquiry) => void;
  messagesMap: Record<string, Message[]>;
  addMessage: (inquiryId: string, message: Message) => void;
}

const ProductCatalogContext = createContext<ProductCatalogContextType | undefined>(undefined);

export const ProductCatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    // Load initial listings, inquiries, and dialogs through service layer
    setProducts(productService.getProducts());
    setInquiries(inquiryService.getInquiries());
    setMessagesMap(chatService.getAllMessages());
  }, []);

  const addProduct = (product: Product) => {
    // Add product through service layer
    const createdProduct = productService.createProduct(product);
    setProducts(prev => [createdProduct, ...prev]);
  };

  const addInquiry = (inquiry: Inquiry) => {
    // Add inquiry through service layer
    const createdInquiry = inquiryService.createInquiry({
      productId: inquiry.productId,
      productTitle: inquiry.productTitle,
      productPrice: inquiry.productPrice,
      productImage: inquiry.productImage,
      buyerName: inquiry.buyerName,
      buyerType: inquiry.buyerType,
      quantity: inquiry.quantity,
      expectedDelivery: inquiry.expectedDelivery,
      message: inquiry.message
    });
    setInquiries(prev => [createdInquiry, ...prev]);
  };

  const addMessage = (inquiryId: string, message: Message) => {
    // Save message through service layer
    const savedMessage = chatService.sendMessage(inquiryId, message);
    setMessagesMap(prev => {
      const existing = prev[inquiryId] || [];
      return {
        ...prev,
        [inquiryId]: [...existing, savedMessage]
      };
    });
  };

  return (
    <ProductCatalogContext.Provider value={{
      products,
      addProduct,
      inquiries,
      addInquiry,
      messagesMap,
      addMessage
    }}>
      {children}
    </ProductCatalogContext.Provider>
  );
};

export const useProductCatalog = () => {
  const context = useContext(ProductCatalogContext);
  if (!context) {
    throw new Error('useProductCatalog must be used within a ProductCatalogProvider');
  }
  return context;
};

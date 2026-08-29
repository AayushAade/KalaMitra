import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, Inquiry, Message } from '../types';
import { productService } from '../services/productService';
import { inquiryService } from '../services/inquiryService';
import { chatService } from '../services/chatService';

interface ProductCatalogContextType {
  products: Product[];
  addProduct: (product: Partial<Product> & { name: string; price: number }) => Promise<Product>;
  refreshProducts: () => Promise<void>;
  inquiries: Inquiry[];
  addInquiry: (inquiry: Inquiry) => void;
  messagesMap: Record<string, Message[]>;
  addMessage: (inquiryId: string, message: Message) => void;
  isLoading: boolean;
}

const ProductCatalogContext = createContext<ProductCatalogContextType | undefined>(undefined);

export const ProductCatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(productService.getProducts());
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedProducts = await productService.fetchProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      console.warn('[ProductCatalogContext] Error refreshing products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load initial listings, inquiries, and dialogs through service layer
    setInquiries(inquiryService.getInquiries());
    setMessagesMap(chatService.getAllMessages());
    // Asynchronously synchronize with live Supabase products
    refreshProducts();
  }, [refreshProducts]);

  const addProduct = async (product: Partial<Product> & { name: string; price: number }): Promise<Product> => {
    // Persist product through service layer to Supabase
    const createdProduct = await productService.createProduct(product);
    setProducts(prev => [createdProduct, ...prev.filter(p => p.id !== createdProduct.id)]);
    return createdProduct;
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
      refreshProducts,
      inquiries,
      addInquiry,
      messagesMap,
      addMessage,
      isLoading
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

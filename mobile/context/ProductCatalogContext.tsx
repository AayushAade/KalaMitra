import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, Inquiry, Message } from '../types';
import { productService } from '../services/productService';
import { inquiryService } from '../services/inquiryService';
import { chatService } from '../services/chatService';
import { artisanService } from '../services/artisanService';

interface ProductCatalogContextType {
  products: Product[];
  myProducts: Product[];
  addProduct: (product: Partial<Product> & { name: string; price: number }) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  refreshProducts: () => Promise<void>;
  refreshMyProducts: () => Promise<void>;
  resetCatalog: () => void;
  inquiries: Inquiry[];
  addInquiry: (inquiry: Inquiry) => void;
  messagesMap: Record<string, Message[]>;
  addMessage: (inquiryId: string, message: Message) => void;
  isLoading: boolean;
}

const ProductCatalogContext = createContext<ProductCatalogContextType | undefined>(undefined);

export const ProductCatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(productService.getProducts());
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeArtisanId, setActiveArtisanId] = useState<string | null>(
    artisanService.getAuthenticatedUser()?.id || null
  );

  const refreshMyProducts = useCallback(async (artisanId?: string) => {
    const targetId = artisanId || activeArtisanId || artisanService.getAuthenticatedUser()?.id;
    if (!targetId) {
      setMyProducts([]);
      return;
    }

    try {
      const fetchedMy = await productService.fetchMyProducts(targetId);
      setMyProducts(fetchedMy);
    } catch (err) {
      console.warn('[ProductCatalogContext] Error refreshing myProducts:', err);
      setMyProducts([]);
    }
  }, [activeArtisanId]);

  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedMarketplace = await productService.fetchProducts();
      setProducts(fetchedMarketplace);
      const currentUserId = artisanService.getAuthenticatedUser()?.id;
      if (currentUserId) {
        await refreshMyProducts(currentUserId);
      }
    } catch (err) {
      console.warn('[ProductCatalogContext] Error refreshing products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshMyProducts]);

  useEffect(() => {
    const unsubscribe = artisanService.subscribe((artisan) => {
      const newId = artisan.id || null;
      setActiveArtisanId(newId);
      if (newId) {
        refreshMyProducts(newId);
      } else {
        // Immediate purge on logout/account switch
        setMyProducts([]);
      }
    });
    return unsubscribe;
  }, [refreshMyProducts]);

  useEffect(() => {
    setInquiries(inquiryService.getInquiries());
    setMessagesMap(chatService.getAllMessages());
    refreshProducts();
  }, [refreshProducts]);

  const addProduct = async (product: Partial<Product> & { name: string; price: number }): Promise<Product> => {
    const createdProduct = await productService.createProduct(product);
    // Update local state immediately
    setMyProducts(prev => [createdProduct, ...prev.filter(p => p.id !== createdProduct.id)]);
    setProducts(prev => [createdProduct, ...prev.filter(p => p.id !== createdProduct.id)]);
    return createdProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
    const updated = await productService.updateProduct(id, updates);
    setMyProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
    return updated;
  };

  const resetCatalog = useCallback(() => {
    productService.reset();
    setProducts(productService.getProducts());
    setMyProducts([]);
    setInquiries([]);
    setMessagesMap({});
    setActiveArtisanId(null);
  }, []);

  const addInquiry = (inquiry: Inquiry) => {
    const createdInquiry = inquiryService.createInquiry({
      productId: inquiry.productId,
      productTitle: inquiry.productTitle,
      productPrice: inquiry.productPrice,
      productImage: inquiry.productImage,
      buyerName: inquiry.buyerName,
      buyerType: inquiry.buyerType,
      quantity: inquiry.quantity,
      expectedDelivery: inquiry.expectedDelivery,
      message: inquiry.message,
    });
    setInquiries(prev => [createdInquiry, ...prev]);
  };

  const addMessage = (inquiryId: string, message: Message) => {
    const savedMessage = chatService.sendMessage(inquiryId, message);
    setMessagesMap(prev => {
      const existing = prev[inquiryId] || [];
      return {
        ...prev,
        [inquiryId]: [...existing, savedMessage],
      };
    });
  };

  return (
    <ProductCatalogContext.Provider
      value={{
        products,
        myProducts,
        addProduct,
        updateProduct,
        refreshProducts,
        refreshMyProducts,
        resetCatalog,
        inquiries,
        addInquiry,
        messagesMap,
        addMessage,
        isLoading,
      }}
    >
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

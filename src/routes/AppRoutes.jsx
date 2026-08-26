import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';

// Public Pages
import LandingPage from '../pages/LandingPage';
import HowItWorksPage from '../pages/HowItWorksPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MarketplacePage from '../pages/MarketplacePage';
import ProductDetailsPage from '../pages/ProductDetailsPage';
import ArtisanStorePage from '../pages/ArtisanStorePage';

// Artisan Pages
import ArtisanDashboard from '../pages/ArtisanDashboard';
import MyProductsPage from '../pages/MyProductsPage';
import AddProductFlow from '../pages/AddProductFlow';
import ArtisanCatalogPage from '../pages/ArtisanCatalogPage';
import PricingAssistantPage from '../pages/PricingAssistantPage';
import ArtisanInquiriesPage from '../pages/ArtisanInquiriesPage';
import InquiryDetailsPage from '../pages/InquiryDetailsPage';
import ArtisanAssistantPage from '../pages/ArtisanAssistantPage';
import ArtisanProfilePage from '../pages/ArtisanProfilePage';

// Buyer Pages
import BuyerHome from '../pages/BuyerHome';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="marketplace/product/:id" element={<ProductDetailsPage />} />
        <Route path="artisan/store" element={<ArtisanStorePage />} />
        <Route path="artisan/:id" element={<ArtisanStorePage />} />

        {/* Artisan Routes */}
        <Route path="artisan/home" element={<ArtisanDashboard />} />
        <Route path="artisan/products" element={<MyProductsPage />} />
        <Route path="artisan/products/new" element={<AddProductFlow />} />
        <Route path="artisan/catalog" element={<ArtisanCatalogPage />} />
        <Route path="artisan/pricing" element={<PricingAssistantPage />} />
        <Route path="artisan/inquiries" element={<ArtisanInquiriesPage />} />
        <Route path="artisan/inquiries/:id" element={<InquiryDetailsPage />} />
        <Route path="artisan/assistant" element={<ArtisanAssistantPage />} />
        <Route path="artisan/profile" element={<ArtisanProfilePage />} />

        {/* Buyer Routes */}
        <Route path="buyer/home" element={<BuyerHome />} />
        <Route path="buyer/marketplace" element={<MarketplacePage />} />
        <Route path="buyer/products/:id" element={<ProductDetailsPage />} />
        <Route path="buyer/inquiries" element={<ArtisanInquiriesPage />} />
        <Route path="buyer/inquiries/:id" element={<InquiryDetailsPage />} />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

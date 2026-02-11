import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import CreateWorkspace from "@/pages/CreateWorkspace";
import OAuthCallback from "@/pages/OAuthCallback";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import Profile from "@/pages/Profile";
import ForceChangePassword from "@/pages/ForceChangePassword";

import SetupIntegrations from "@/pages/SetupIntegrations";
import ContactFormSetup from "@/pages/ContactFormSetup";
import Inbox from "@/pages/Inbox";
import PublicContactForm from "@/pages/PublicContactForm";

// Dashboard Layout & Pages
import DashboardLayout from "@/layouts/DashboardLayout";
import Bookings from "@/pages/Bookings";
import Customers from "@/pages/Customers";
import Services from "@/pages/Services";
import Inventory from "@/pages/Inventory";
import Settings from "@/pages/Settings";

// Onboarding
import OnboardingLayout from "@/pages/Onboarding/OnboardingLayout";
import Welcome from "@/pages/Onboarding/Welcome";
import BusinessProfile from "@/pages/Onboarding/BusinessProfile";
import ServicesSetup from "@/pages/Onboarding/ServicesSetup";
import StaffSetup from "@/pages/Onboarding/StaffSetup";
import InventorySetup from "@/pages/Onboarding/InventorySetup";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/oauth/callback" element={<OAuthCallback />} />

                    {/* Protected Dashboard Routes */}
                    <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/bookings" element={<Bookings />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/settings" element={<Settings />} />

                        {/* Legacy/Specific Workspace Routes */}
                        <Route path="/workspace/new" element={<CreateWorkspace />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/force-change-password" element={<ForceChangePassword />} />
                        <Route path="/workspace/:workspaceId/integrations" element={<SetupIntegrations />} />
                        <Route path="/workspace/:workspaceId/contact-form" element={<ContactFormSetup />} />
                        <Route path="/workspace/:workspaceId/inbox" element={<Inbox />} />
                    </Route>

                    {/* Onboarding Routes (Protected) */}
                    <Route path="/onboarding" element={<ProtectedRoute><OnboardingLayout /></ProtectedRoute>}>
                        <Route index element={<Welcome />} />
                        <Route path="business" element={<BusinessProfile />} />
                        <Route path="services" element={<ServicesSetup />} />
                        <Route path="staff" element={<StaffSetup />} />
                        <Route path="inventory" element={<InventorySetup />} />
                    </Route>

                    {/* Public Routes (Standalone) */}
                    <Route path="/forms/:slug" element={<PublicContactForm />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

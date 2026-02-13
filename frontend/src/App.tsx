import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages - Public
import Home from "@/pages/public/Home";
import NotFound from "@/pages/public/NotFound";
import PublicContactForm from "@/pages/public/PublicContactForm";
import PublicBookings from "@/pages/public/PublicBookings";
import StaticPage from "@/pages/public/StaticPages";

// Pages - Auth
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForceChangePassword from "@/pages/auth/ForceChangePassword";
import OAuthCallback from "@/pages/auth/OAuthCallback";

// Pages - Workspace
import CreateWorkspace from "@/pages/workspace/CreateWorkspace";
import WorkspaceView from "@/pages/workspace/WorkspaceView";
import WorkspaceSettings from "@/pages/workspace/WorkspaceSettings";
import InviteStaff from "@/pages/workspace/InviteStaff";
import Dashboard from "@/pages/workspace/Dashboard";
import Bookings from "@/pages/workspace/Bookings";
import CalendarSettings from "@/pages/workspace/CalendarSettings";
import Contacts from "@/pages/workspace/Contacts";
import ContactForms from "@/pages/workspace/ContactForms";
import Communication from "@/pages/workspace/Communication";
import Inventory from "@/pages/workspace/Inventory";
import Staff from "@/pages/workspace/Staff";
import Profile from "@/pages/workspace/Profile";
import WorkingHours from "@/pages/workspace/WorkingHours";
import Leads from "@/pages/workspace/Leads";
import FormBuilder from "@/pages/workspace/FormBuilder";
import GmailSettings from "@/pages/workspace/GmailSettings";
import AutomationSettings from "@/pages/workspace/AutomationSettings";

// Components
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";

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
                    <Route path="/book/:workspaceId" element={<PublicBookings />} />
                    <Route path="/form/:slug" element={<PublicContactForm />} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/workspace/new" element={<CreateWorkspace />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/force-change-password" element={<ForceChangePassword />} />
                        <Route path="/workspace/:workspaceId" element={<WorkspaceLayout />}>
                            <Route index element={<WorkspaceView />} />
                            <Route path="communication" element={<Communication />} />
                            <Route path="forms" element={<ContactForms />} />
                            <Route path="bookings" element={<Bookings />} />
                            <Route path="inventory" element={<Inventory />} />
                            <Route path="staff" element={<Staff />} />
                            <Route path="settings" element={<WorkspaceSettings />} />
                            <Route path="calendar" element={<CalendarSettings />} />
                            <Route path="contacts" element={<Contacts />} />
                            <Route path="working-hours" element={<WorkingHours />} />
                            <Route path="leads" element={<Leads />} />
                            <Route path="form-builder" element={<FormBuilder />} />
                            <Route path="gmail" element={<GmailSettings />} />
                            <Route path="automation" element={<AutomationSettings />} />
                        </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

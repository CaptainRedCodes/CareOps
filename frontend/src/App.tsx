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
import WorkspaceView from "./pages/WorskpaceView";
import Communication from "@/pages/Communication";
import ContactForms from "@/pages/ContactForms";
import Bookings from "@/pages/Bookings";
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

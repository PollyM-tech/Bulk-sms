// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext";
import ProtectedRoute from "./routes/protectedroutes";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth pages
import LoginPage from "./Pages/auth/login";
import SignupPage from "./Pages/auth/Register";
import ForgotPasswordPage from "./Pages/auth/forgotpassword";
import ResetPasswordPage from "./Pages/auth/resetpassword";

// Dashboard pages
import DashboardPage from "./Pages/dashboard/Dashboard";
import SendSmsPage from "./Pages/SMS/sms";
import ContactsPage from "./Pages/contact/contact";
import CampaignsPage from "./Pages/campaign/campaign";

import "./index.css";
import ReportPage from "./Pages/Report/report";

function App() {
  return (
    <AuthProvider>
      {/* Toast container (global) */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />

      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/send-sms"
          element={
            <ProtectedRoute>
              <SendSmsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/contacts"
          element={
            <ProtectedRoute>
              <ContactsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/campaigns"
          element={
            <ProtectedRoute>
              <CampaignsPage />
            </ProtectedRoute>
          }
        />
        <Route
           path="/dashboard/reports"
           element={
                       <ProtectedRoute>
                        <ReportPage />
                      </ProtectedRoute>
         }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

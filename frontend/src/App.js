import { lazy, Suspense, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ChatWidget } from "./components/ChatWidget";

// Lazy-loaded pages — only downloaded when the user navigates to them
const HomePage = lazy(() => import("./pages/HomePage"));
const AdnVisionPage = lazy(() => import("./pages/AdnVisionPage"));
const SolutionsPage = lazy(() => import("./pages/SolutionsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CaseStudiesPage = lazy(() => import("./pages/CaseStudiesPage"));
const CaseStudyDetailPage = lazy(() => import("./pages/CaseStudyDetailPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const CloserDashboard = lazy(() => import("./pages/admin/CloserDashboard"));
const ROICalculatorPage = lazy(() => import("./pages/ROICalculatorPage"));
const ClientLoginPage = lazy(() => import("./pages/ClientLoginPage"));
const ClientDashboardPage = lazy(() => import("./pages/ClientDashboardPage"));

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

function AdminLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

function ClientLayout({ children }) {
  return (
    <>
      <main>{children}</main>
    </>
  );
}

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    // Hide Emergent badge (CSS rule in App.css handles it; remove element once as fallback)
    document.getElementById('emergent-badge')?.remove();
  }, []);

  return (
    <div className={`App min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#F9FAFB] text-gray-900'}`}>
      <BrowserRouter>
        <Toaster theme={isDark ? "dark" : "light"} position="top-right" richColors />
        <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
          <Routes>
            <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
            <Route path="/adn" element={<AppLayout><AdnVisionPage /></AppLayout>} />
            <Route path="/solutions" element={<AppLayout><SolutionsPage /></AppLayout>} />
            <Route path="/cases" element={<AppLayout><CaseStudiesPage /></AppLayout>} />
            <Route path="/cases/:id" element={<AppLayout><CaseStudyDetailPage /></AppLayout>} />
            <Route path="/contact" element={<AppLayout><ContactPage /></AppLayout>} />
            <Route path="/privacy" element={<AppLayout><PrivacyPolicyPage /></AppLayout>} />
            <Route path="/terms" element={<AppLayout><TermsPage /></AppLayout>} />
            <Route path="/admin" element={<AdminLayout><AdminLoginPage /></AdminLayout>} />
            <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboardPage /></AdminLayout>} />
            <Route path="/closer" element={<AdminLayout><CloserDashboard /></AdminLayout>} />
            <Route path="/roi" element={<AppLayout><ROICalculatorPage /></AppLayout>} />
            <Route path="/client" element={<ClientLayout><ClientLoginPage /></ClientLayout>} />
            <Route path="/client/dashboard" element={<ClientLayout><ClientDashboardPage /></ClientLayout>} />
          </Routes>
        </Suspense>
        <ChatWidget />
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;

import { lazy, Suspense, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ChatWidget } from "./components/ChatWidget";
import { CookieConsent } from "./components/CookieConsent";
import { mountCursor } from "./lib/designAnimations";

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
const InstantQuotePage = lazy(() => import("./pages/InstantQuotePage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const ClientLoginPage = lazy(() => import("./pages/ClientLoginPage"));
const ClientDashboardPage = lazy(() => import("./pages/ClientDashboardPage"));
const DemosPage = lazy(() => import("./pages/DemosPage"));

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

/**
 * Le chat commercial est un outil du site public : on le masque dans l'espace
 * démo prospect, qui a son propre parcours et son propre CTA.
 */
function GlobalChatWidget() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/demos')) return null;
  return <ChatWidget />;
}

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    // Hide Emergent badge (CSS rule in App.css handles it; remove element once as fallback)
    document.getElementById('emergent-badge')?.remove();
    // Custom cursor (design refonte) — global, pointer-fine devices only
    const cleanup = mountCursor();
    return cleanup;
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
            <Route path="/quote" element={<AppLayout><InstantQuotePage /></AppLayout>} />
            <Route path="/faq" element={<AppLayout><FAQPage /></AppLayout>} />
            <Route path="/client" element={<ClientLayout><ClientLoginPage /></ClientLayout>} />
            <Route path="/client/dashboard" element={<ClientLayout><ClientDashboardPage /></ClientLayout>} />
            {/* Espace démos prospect : mise en page autonome (en-tête et pied de page propres) */}
            <Route path="/demos" element={<DemosPage />} />
            {/* Fallback: toute URL inconnue renvoie à l'accueil (évite l'écran blanc) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <GlobalChatWidget />
        <CookieConsent />
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

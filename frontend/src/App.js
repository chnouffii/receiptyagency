import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import HomePage from "./pages/HomePage";
import AdnVisionPage from "./pages/AdnVisionPage";
import SolutionsPage from "./pages/SolutionsPage";
import ContactPage from "./pages/ContactPage";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import CaseStudyDetailPage from "./pages/CaseStudyDetailPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CloserDashboard from "./pages/admin/CloserDashboard";
import ROICalculatorPage from "./pages/ROICalculatorPage";
import ClientLoginPage from "./pages/ClientLoginPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import { ChatWidget } from "./components/ChatWidget";

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

    // Masquer le badge Emergent + forcer favicon
    const cleanup = () => {
      const badge = document.getElementById('emergent-badge');
      if (badge) badge.remove();
      // Force favicon
      let link = document.querySelector("link[rel='icon']");
      if (!link || !link.href.includes('favicon.png')) {
        if (link) link.remove();
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = '/favicon.png';
        document.head.appendChild(link);
      }
    };
    cleanup();

    const observer = new MutationObserver(cleanup);
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = setInterval(cleanup, 500);

    return () => { observer.disconnect(); clearInterval(interval); };
  }, []);

  return (
    <div className={`App min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#F9FAFB] text-gray-900'}`}>
      <BrowserRouter>
        <Toaster theme={isDark ? "dark" : "light"} position="top-right" richColors />
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

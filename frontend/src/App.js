import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    document.documentElement.classList.add("dark");

    const TITLE = "Receipty | Agence d'IA";

    // Force title immediately and on every change
    const forceTitle = () => { document.title = TITLE; };
    forceTitle();

    // Masquer le badge Emergent + forcer favicon
    const cleanup = () => {
      const badge = document.getElementById('emergent-badge');
      if (badge) badge.remove();
      if (document.title !== TITLE) forceTitle();
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

    // MutationObserver pour intercepter les modifications du DOM et du <head>
    const observer = new MutationObserver(cleanup);
    observer.observe(document.body, { childList: true, subtree: true });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    // Interval de secours — certains scripts externes changent le titre après un délai
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
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

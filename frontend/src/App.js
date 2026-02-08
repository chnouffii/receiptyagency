import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { LanguageProvider } from "./context/LanguageContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import HomePage from "./pages/HomePage";
import AdnVisionPage from "./pages/AdnVisionPage";
import SolutionsPage from "./pages/SolutionsPage";
import InstantQuotePage from "./pages/InstantQuotePage";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import CaseStudyDetailPage from "./pages/CaseStudyDetailPage";
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

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");

    // Marque blanche : masquer le badge Emergent
    const hideBadge = () => {
      document.querySelectorAll('a[href*="emergentagent"], div[class*="emergent"], [data-testid*="emergent"]').forEach(el => {
        let target = el;
        while (target && target !== document.body && target.parentElement !== document.body) {
          target = target.parentElement;
        }
        if (target && target !== document.body) target.style.display = 'none';
        el.style.display = 'none';
      });
    };
    hideBadge();
    const observer = new MutationObserver(hideBadge);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <LanguageProvider>
      <div className="App min-h-screen bg-[#050505] text-white">
        <BrowserRouter>
          <Toaster theme="dark" position="top-right" richColors />
          <Routes>
            <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
            <Route path="/adn" element={<AppLayout><AdnVisionPage /></AppLayout>} />
            <Route path="/solutions" element={<AppLayout><SolutionsPage /></AppLayout>} />
            <Route path="/cases" element={<AppLayout><CaseStudiesPage /></AppLayout>} />
            <Route path="/cases/:id" element={<AppLayout><CaseStudyDetailPage /></AppLayout>} />
            <Route path="/quote" element={<AppLayout><InstantQuotePage /></AppLayout>} />
            <Route path="/admin" element={<AdminLayout><AdminLoginPage /></AdminLayout>} />
            <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboardPage /></AdminLayout>} />
          </Routes>
          <ChatWidget />
        </BrowserRouter>
      </div>
    </LanguageProvider>
  );
}

export default App;

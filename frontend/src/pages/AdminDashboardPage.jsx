import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Users, MessageCircle, BookOpen, Layers, Settings, UserCog, FileText, FileSearch, Briefcase, HelpCircle, Building } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import AdminLeadsTab from './admin/AdminLeadsTab';
import AdminChatAnalytics from './admin/AdminChatAnalytics';
import AdminCaseStudies from './admin/AdminCaseStudies';
import AdminSolutions from './admin/AdminSolutions';
import AdminSiteContent from './admin/AdminSiteContent';
import AdminUserManagement from './admin/AdminUserManagement';
import AdminQuotes from './admin/AdminQuotes';
import AdminAuditROI from './admin/AdminAuditROI';
import AdminClosersTab from './admin/AdminClosersTab';
import AdminFAQ from './admin/AdminFAQ';
import AdminClients from './admin/AdminClients';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboardPage() {
  const { t, lang } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('leads');
  const [quoteFromLead, setQuoteFromLead] = useState(null);
  const [auditFromLead, setAuditFromLead] = useState(null);
  const token = localStorage.getItem('receipty-admin-token');

  const fetchStats = useCallback(async () => {
    if (!token) { navigate('/admin'); return; }
    try {
      const res = await axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('receipty-admin-token');
        navigate('/admin');
      }
    }
  }, [token, navigate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const logout = () => {
    localStorage.removeItem('receipty-admin-token');
    localStorage.removeItem('receipty-admin-email');
    navigate('/admin');
  };

  // Handler to create quote from lead
  const handleCreateQuoteFromLead = (lead) => {
    setQuoteFromLead(lead);
    setActiveTab('quotes');
  };

  // Handler to create audit from lead
  const handleCreateAuditFromLead = (lead) => {
    setAuditFromLead(lead);
    setActiveTab('audit');
  };

  // Clear quote data after use
  const clearQuoteFromLead = () => {
    setQuoteFromLead(null);
  };

  // Clear audit data after use
  const clearAuditFromLead = () => {
    setAuditFromLead(null);
  };

  return (
    <div data-testid="admin-dashboard" className={`pt-24 min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className={`font-heading text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.admin.dashboard}</h1>
          <button
            onClick={logout}
            data-testid="admin-logout-btn"
            className={`flex items-center gap-2 text-sm transition-colors duration-200 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <LogOut className="w-4 h-4" /> {t.admin.logout}
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`mb-8 h-11 ${isDark ? 'bg-[#0F0F10] border border-white/5' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <TabsTrigger value="leads" data-testid="tab-leads" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-2 text-sm">
              <Users className="w-4 h-4" />
              {lang === 'fr' ? 'Leads' : 'Leads'}
            </TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat-analytics" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-2 text-sm">
              <MessageCircle className="w-4 h-4" />
              {lang === 'fr' ? 'Chat Analytics' : 'Chat Analytics'}
            </TabsTrigger>
            <TabsTrigger value="cases" data-testid="tab-case-studies" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-2 text-sm">
              <BookOpen className="w-4 h-4" />
              {lang === 'fr' ? 'Études de Cas' : 'Case Studies'}
            </TabsTrigger>
            <TabsTrigger value="solutions" data-testid="tab-solutions" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-2 text-sm">
              <Layers className="w-4 h-4" />
              Solutions
            </TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-2 text-sm">
              <Settings className="w-4 h-4" />
              {lang === 'fr' ? 'Contenu Site' : 'Site Content'}
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-2 text-sm">
              <UserCog className="w-4 h-4" />
              {lang === 'fr' ? 'Utilisateurs' : 'Users'}
            </TabsTrigger>
            <TabsTrigger value="quotes" data-testid="tab-quotes" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-2 text-sm">
              <FileText className="w-4 h-4" />
              {lang === 'fr' ? 'Devis' : 'Quotes'}
            </TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400 gap-2 text-sm">
              <FileSearch className="w-4 h-4" />
              {lang === 'fr' ? 'Audit ROI' : 'Audit ROI'}
            </TabsTrigger>
            <TabsTrigger value="closers" data-testid="tab-closers" className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 gap-2 text-sm">
              <Briefcase className="w-4 h-4" />
              Closers
            </TabsTrigger>
            <TabsTrigger value="faq" data-testid="tab-faq" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-2 text-sm">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="clients" data-testid="tab-clients" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 gap-2 text-sm">
              <Building className="w-4 h-4" />
              {lang === 'fr' ? 'Clients' : 'Clients'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <AdminLeadsTab token={token} stats={stats} onRefresh={fetchStats} onCreateQuote={handleCreateQuoteFromLead} onCreateAudit={handleCreateAuditFromLead} isDark={isDark} />
          </TabsContent>
          <TabsContent value="chat">
            <AdminChatAnalytics token={token} isDark={isDark} />
          </TabsContent>
          <TabsContent value="cases">
            <AdminCaseStudies token={token} isDark={isDark} />
          </TabsContent>
          <TabsContent value="solutions">
            <AdminSolutions token={token} isDark={isDark} />
          </TabsContent>
          <TabsContent value="content">
            <AdminSiteContent token={token} isDark={isDark} />
          </TabsContent>
          <TabsContent value="users">
            <AdminUserManagement token={token} isDark={isDark} />
          </TabsContent>
          <TabsContent value="quotes">
            <AdminQuotes token={token} leadData={quoteFromLead} onLeadDataUsed={clearQuoteFromLead} isDark={isDark} />
          </TabsContent>
          <TabsContent value="audit">
            <AdminAuditROI token={token} leadData={auditFromLead} onLeadDataUsed={clearAuditFromLead} onCreateQuote={handleCreateQuoteFromLead} isDark={isDark} />
          </TabsContent>
          <TabsContent value="closers">
            <AdminClosersTab token={token} isDark={isDark} />
          </TabsContent>
          <TabsContent value="faq">
            <AdminFAQ token={token} isDark={isDark} />
          </TabsContent>
          <TabsContent value="clients">
            <AdminClients token={token} isDark={isDark} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

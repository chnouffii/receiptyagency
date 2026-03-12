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

  const tabs = [
    { value: 'leads', icon: Users, label: lang === 'fr' ? 'Leads' : 'Leads', activeClass: 'data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400', testId: 'tab-leads' },
    { value: 'clients', icon: Building, label: lang === 'fr' ? 'Clients' : 'Clients', activeClass: 'data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400', testId: 'tab-clients' },
    { value: 'quotes', icon: FileText, label: lang === 'fr' ? 'Devis' : 'Quotes', activeClass: 'data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400', testId: 'tab-quotes' },
    { value: 'audit', icon: FileSearch, label: lang === 'fr' ? 'Audit' : 'Audit', activeClass: 'data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400', testId: 'tab-audit' },
    { value: 'closers', icon: Briefcase, label: 'Closers', activeClass: 'data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400', testId: 'tab-closers' },
    { value: 'chat', icon: MessageCircle, label: lang === 'fr' ? 'Chat' : 'Chat', activeClass: 'data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400', testId: 'tab-chat-analytics' },
    { value: 'cases', icon: BookOpen, label: lang === 'fr' ? 'Cas' : 'Cases', activeClass: 'data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400', testId: 'tab-case-studies' },
    { value: 'solutions', icon: Layers, label: 'Solutions', activeClass: 'data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400', testId: 'tab-solutions' },
    { value: 'content', icon: Settings, label: lang === 'fr' ? 'Contenu' : 'Content', activeClass: 'data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400', testId: 'tab-content' },
    { value: 'users', icon: UserCog, label: lang === 'fr' ? 'Users' : 'Users', activeClass: 'data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400', testId: 'tab-users' },
    { value: 'faq', icon: HelpCircle, label: 'FAQ', activeClass: 'data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400', testId: 'tab-faq' },
  ];

  return (
    <div data-testid="admin-dashboard" className={`pt-16 sm:pt-24 min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-8 gap-2">
          <h1 className={`font-heading text-lg sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.admin.dashboard}</h1>
          <button
            onClick={logout}
            data-testid="admin-logout-btn"
            className={`flex items-center gap-1.5 text-sm transition-colors duration-200 shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t.admin.logout}</span>
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile: select dropdown */}
          <div className="sm:hidden mb-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none ${isDark ? 'bg-[#0F0F10] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'}`}
            >
              {tabs.map((tab) => (
                <option key={tab.value} value={tab.value}>{tab.label}</option>
              ))}
            </select>
          </div>

          {/* Desktop: scrollable tab bar */}
          <div className="hidden sm:block overflow-x-auto mb-6 pb-1">
            <TabsList className={`h-11 min-w-max ${isDark ? 'bg-[#0F0F10] border border-white/5' : 'bg-white border border-gray-200 shadow-sm'}`}>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} data-testid={tab.testId} className={`${tab.activeClass} gap-1.5 text-sm px-3`}>
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

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

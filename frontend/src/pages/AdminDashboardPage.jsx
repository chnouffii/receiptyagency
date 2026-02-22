import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Users, MessageCircle, BookOpen, Layers, Settings, UserCog, FileText, FileSearch } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import AdminLeadsTab from './admin/AdminLeadsTab';
import AdminChatAnalytics from './admin/AdminChatAnalytics';
import AdminCaseStudies from './admin/AdminCaseStudies';
import AdminSolutions from './admin/AdminSolutions';
import AdminSiteContent from './admin/AdminSiteContent';
import AdminUserManagement from './admin/AdminUserManagement';
import AdminQuotes from './admin/AdminQuotes';
import AdminAuditROI from './admin/AdminAuditROI';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboardPage() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
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

  return (
    <div data-testid="admin-dashboard" className="pt-24 bg-[#050505] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-2xl font-bold text-white">{t.admin.dashboard}</h1>
          <button
            onClick={logout}
            data-testid="admin-logout-btn"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" /> {t.admin.logout}
          </button>
        </div>

        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="bg-[#0F0F10] border border-white/5 mb-8 h-11">
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
              {lang === 'fr' ? 'Etudes de Cas' : 'Case Studies'}
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
          </TabsList>

          <TabsContent value="leads">
            <AdminLeadsTab token={token} stats={stats} onRefresh={fetchStats} />
          </TabsContent>
          <TabsContent value="chat">
            <AdminChatAnalytics token={token} />
          </TabsContent>
          <TabsContent value="cases">
            <AdminCaseStudies token={token} />
          </TabsContent>
          <TabsContent value="solutions">
            <AdminSolutions token={token} />
          </TabsContent>
          <TabsContent value="content">
            <AdminSiteContent token={token} />
          </TabsContent>
          <TabsContent value="users">
            <AdminUserManagement token={token} />
          </TabsContent>
          <TabsContent value="quotes">
            <AdminQuotes token={token} />
          </TabsContent>
          <TabsContent value="audit">
            <AdminAuditROI token={token} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

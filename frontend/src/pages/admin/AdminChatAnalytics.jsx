import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Hash, BarChart3, Clock, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminChatAnalytics({ token, isDark }) {
  const { lang } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/chat-analytics`, { headers: { Authorization: `Bearer ${token}` } });
      setAnalytics(res.data);
    } catch {}
  }, [token]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const viewConversation = async (sessionId) => {
    try {
      const res = await axios.get(`${API}/chat/${sessionId}`);
      setSessionMessages(res.data);
      setSelectedSession(sessionId);
      setDialogOpen(true);
    } catch {}
  };

  const statItems = analytics ? [
    { label: lang === 'fr' ? 'Sessions totales' : 'Total sessions', value: analytics.total_sessions, icon: MessageCircle, color: 'text-blue-400' },
    { label: lang === 'fr' ? 'Messages totaux' : 'Total messages', value: analytics.total_messages, icon: Hash, color: 'text-cyan-400' },
    { label: lang === 'fr' ? 'Moy. messages/session' : 'Avg msgs/session', value: analytics.avg_messages_per_session, icon: BarChart3, color: 'text-emerald-400' },
  ] : [];

  return (
    <div data-testid="chat-analytics-tab">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statItems.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-white/5 bg-[#0F0F10] p-6" data-testid={`chat-stat-${i}`}>
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
            <p className="font-mono text-3xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Conversations */}
      <div className="rounded-xl border border-white/5 bg-[#0F0F10] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-heading text-lg font-semibold text-white">
            {lang === 'fr' ? 'Conversations récentes' : 'Recent conversations'}
          </h2>
        </div>

        {!analytics || analytics.conversations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {lang === 'fr' ? 'Aucune conversation pour le moment.' : 'No conversations yet.'}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {analytics.conversations.map((conv, i) => (
              <div key={conv.session_id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors duration-200" data-testid={`conversation-row-${i}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate max-w-md">
                        {conv.preview || (lang === 'fr' ? 'Conversation sans aperçu' : 'No preview')}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> {conv.message_count} msgs
                        </span>
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(conv.last_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => viewConversation(conv.session_id)}
                  data-testid={`view-conversation-${i}`}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors duration-200 ml-4"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {lang === 'fr' ? 'Voir' : 'View'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversation Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0F0F10] border-white/10 max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading text-white text-lg">
              {lang === 'fr' ? 'Détail conversation' : 'Conversation detail'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mt-4">
            {sessionMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/5 text-gray-300 rounded-tl-sm'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] mt-1 opacity-50">{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

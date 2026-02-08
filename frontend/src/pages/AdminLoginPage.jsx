import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminLoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/admin/login`, { email, password });
      localStorage.setItem('receipty-admin-token', res.data.token);
      localStorage.setItem('receipty-admin-email', res.data.email);
      toast.success('Connected');
      navigate('/admin/dashboard');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-login-page" className="pt-24 bg-[#050505] min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto px-6"
      >
        <div className="rounded-2xl border border-white/5 bg-[#0F0F10] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-white">{t.admin.login_title}</h1>
              <p className="text-sm text-gray-500">{t.admin.login_subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">{t.admin.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="admin-email-input"
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-lg text-white placeholder:text-gray-600 h-12 px-4 text-sm outline-none transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">{t.admin.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="admin-password-input"
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-lg text-white placeholder:text-gray-600 h-12 px-4 text-sm outline-none transition-all duration-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="admin-login-btn"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-full h-12 text-sm font-semibold transition-all duration-200 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
              {loading ? '...' : t.admin.login}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

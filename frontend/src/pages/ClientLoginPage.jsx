import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ClientLoginPage() {
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/client/login`, { email, password });
      localStorage.setItem('receipty-client-token', res.data.token);
      localStorage.setItem('receipty-client-name', res.data.name);
      localStorage.setItem('receipty-client-email', res.data.email);
      localStorage.setItem('receipty-client-company', res.data.company);
      toast.success(lang === 'fr' ? `Bienvenue, ${res.data.name} !` : `Welcome, ${res.data.name}!`);
      navigate('/client/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail;
      if (err.response?.status === 429) {
        toast.error(lang === 'fr' ? 'Trop de tentatives. Réessayez dans 15 minutes.' : 'Too many attempts. Try again in 15 minutes.');
      } else {
        toast.error(msg || (lang === 'fr' ? 'Email ou mot de passe incorrect.' : 'Incorrect email or password.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 pt-20 transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            {lang === 'fr' ? 'Espace Client' : 'Client Portal'}
          </div>
          <h1 className={`font-heading text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Receipty<span className="text-blue-500">.</span>
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {lang === 'fr'
              ? 'Accédez à votre espace projet et échangez avec votre équipe.'
              : 'Access your project space and communicate with your team.'}
          </p>
        </div>

        {/* Login card */}
        <div className={`rounded-2xl border p-8 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all outline-none ${
                    isDark
                      ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white placeholder:text-gray-600 focus:border-blue-500/50'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {lang === 'fr' ? 'Mot de passe' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all outline-none ${
                    isDark
                      ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white placeholder:text-gray-600 focus:border-blue-500/50'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {lang === 'fr' ? 'Se connecter' : 'Sign in'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className={`mt-6 pt-6 border-t text-center ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {lang === 'fr'
                ? 'Vos identifiants vous ont été communiqués par votre conseiller Receipty.'
                : 'Your credentials were provided by your Receipty advisor.'}
            </p>
            <a
              href="mailto:contact@receipty.fr"
              className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block transition-colors"
            >
              {lang === 'fr' ? 'Besoin d\'aide ? contact@receipty.fr' : 'Need help? contact@receipty.fr'}
            </a>
          </div>
        </div>

        <p className={`text-center text-xs mt-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          {lang === 'fr' ? 'Pas encore client ?' : 'Not a client yet?'}{' '}
          <a href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors">
            {lang === 'fr' ? 'Contactez-nous' : 'Contact us'}
          </a>
        </p>
      </motion.div>
    </div>
  );
}

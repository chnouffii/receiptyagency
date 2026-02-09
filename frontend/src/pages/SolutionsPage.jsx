import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Wallet, Globe, Cpu, ShoppingCart, Mail, Shield, BarChart3, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICON_MAP = { users: Users, wallet: Wallet, globe: Globe, cpu: Cpu, 'shopping-cart': ShoppingCart, mail: Mail, shield: Shield, 'bar-chart': BarChart3 };

const DEMO_DATA = {
  area: [{ m: 'Jan', v: 120 }, { m: 'Feb', v: 180 }, { m: 'Mar', v: 250 }, { m: 'Apr', v: 310 }, { m: 'May', v: 380 }, { m: 'Jun', v: 420 }],
  bar: [{ m: 'Jan', a: 45, b: 38 }, { m: 'Feb', a: 52, b: 41 }, { m: 'Mar', a: 48, b: 35 }, { m: 'Apr', a: 55, b: 37 }, { m: 'May', a: 51, b: 34 }, { m: 'Jun', a: 58, b: 36 }],
  line: [{ m: 'Jan', v: 1.2 }, { m: 'Feb', v: 2.1 }, { m: 'Mar', v: 3.8 }, { m: 'Apr', v: 5.2 }, { m: 'May', v: 7.5 }, { m: 'Jun', v: 10.2 }],
};

const chartStyle = { grid: 'rgba(255,255,255,0.03)', tick: '#475569', tooltip: { backgroundColor: '#0F0F10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' } };

function MiniDashboard({ chartType }) {
  const type = chartType || 'area';
  const data = DEMO_DATA[type] || DEMO_DATA.area;
  return (
    <div className="h-48 w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartStyle.grid} />
            <XAxis dataKey="m" tick={{ fill: chartStyle.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: chartStyle.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={chartStyle.tooltip} labelStyle={{ color: '#94A3B8' }} itemStyle={{ color: '#38BDF8' }} />
            <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#007AFF" stopOpacity={0.3} /><stop offset="100%" stopColor="#007AFF" stopOpacity={0} /></linearGradient></defs>
            <Area type="monotone" dataKey="v" stroke="#007AFF" fill="url(#areaGrad)" strokeWidth={2} />
          </AreaChart>
        ) : type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartStyle.grid} />
            <XAxis dataKey="m" tick={{ fill: chartStyle.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: chartStyle.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={chartStyle.tooltip} labelStyle={{ color: '#94A3B8' }} />
            <Bar dataKey="a" fill="#475569" radius={[4, 4, 0, 0]} />
            <Bar dataKey="b" fill="#007AFF" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartStyle.grid} />
            <XAxis dataKey="m" tick={{ fill: chartStyle.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: chartStyle.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={chartStyle.tooltip} labelStyle={{ color: '#94A3B8' }} itemStyle={{ color: '#38BDF8' }} />
            <Line type="monotone" dataKey="v" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 3 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function SolutionCard({ sol, index, lang }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = ICON_MAP[sol.icon] || Users;
  const name = lang === 'fr' ? sol.name_fr : (sol.name_en || sol.name_fr);
  const tag = lang === 'fr' ? sol.tag_fr : (sol.tag_en || sol.tag_fr);
  const desc = lang === 'fr' ? sol.desc_fr : (sol.desc_en || sol.desc_fr);
  const features = lang === 'fr' ? (sol.features_fr || []) : (sol.features_en || sol.features_fr || []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0F0F10] transition-all duration-300 hover:border-blue-500/20"
      data-testid={`solution-card-${index}`}
    >
      <div className="p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-white">{name}</h3>
            <Badge variant="outline" className="mt-1 text-xs text-blue-400 border-blue-500/30">{tag}</Badge>
          </div>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed mb-6">{desc}</p>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500/60 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-8 pb-8">
        <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm p-4">
          <p className="text-xs text-gray-600 font-mono uppercase tracking-wider mb-1">Performance Dashboard</p>
          <MiniDashboard chartType={sol.chart_type} />
        </div>
      </div>
    </motion.div>
  );
}

export default function SolutionsPage() {
  const { t, lang } = useLanguage();
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/solutions`).then(res => {
      setSolutions(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div data-testid="solutions-page" className="pt-24 bg-[#050505] min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-16">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">{t.solutions.title}</h1>
          <p className="mt-6 text-base md:text-lg text-gray-400 max-w-2xl">{t.solutions.subtitle}</p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-500 py-20">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>
        ) : solutions.length === 0 ? (
          <div className="text-center text-gray-500 py-20">{lang === 'fr' ? 'Aucune solution pour le moment.' : 'No solutions yet.'}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {solutions.map((sol, i) => (
              <SolutionCard key={sol.id} sol={sol} index={i} lang={lang} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

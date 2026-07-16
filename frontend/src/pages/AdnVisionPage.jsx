import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import SEOHead from '../components/SEOHead';

function AnimatedCounter({ target, suffix = '', inView }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseInt(target);
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span className="font-mono text-4xl sm:text-5xl font-bold text-blue-400">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function AdnVisionPage() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' });
  const teamRef = useRef(null);
  const teamInView = useInView(teamRef, { once: true, margin: '-80px' });

  const stats = [
    { value: 10, suffix: '+', label: t.adn.stats.projects },
    { value: 52000, suffix: '+', label: t.adn.stats.hours },
    { value: 94, suffix: '%', label: t.adn.stats.automation },
  ];

  const colors = ['bg-blue-600', 'bg-cyan-500', 'bg-indigo-500', 'bg-sky-500'];

  return (
    <div data-testid="adn-page" className={`pt-24 min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <SEOHead page="adn" />
      {/* Manifesto */}
      <section className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={`font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.adn.title}
          </h1>
          <p className={`mt-6 text-base md:text-lg max-w-3xl leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t.adn.subtitle}
          </p>
        </motion.div>

        <motion.blockquote
          className="mt-16 pl-6 border-l-2 border-blue-500/50"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <p className={`text-lg md:text-xl leading-relaxed italic font-light ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            "{t.adn.manifesto}"
          </p>
        </motion.blockquote>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className={`flex flex-col items-start rounded-2xl border p-8 ${
                isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-200 bg-white shadow-sm'
              }`}
              data-testid={`stat-card-${i}`}
            >
              <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={statsInView} />
              <span className={`mt-3 text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team Grid - Bento Style */}
      <section ref={teamRef} className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <motion.h2
          className={`font-heading text-2xl sm:text-3xl font-bold mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}
          initial={{ opacity: 0 }}
          animate={teamInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          {t.adn.team}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.adn.members.map((member, i) => {
            const spans = ['', ''];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={teamInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`${spans[i]} group relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:border-blue-500/20 ${
                  isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'
                }`}
                data-testid={`team-member-${i}`}
              >
                <div className="flex items-start gap-5">
                  <Avatar className={`w-14 h-14 border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <AvatarFallback className={`${colors[i]} text-white font-heading font-bold text-lg`}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                    <p className="text-sm text-blue-400 font-medium mt-0.5">{member.role}</p>
                    <p className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{member.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

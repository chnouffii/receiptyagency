import { useState, useEffect } from 'react';
import axios from 'axios';
import SEOHead, { OrganizationSchema, ServiceSchema, FAQSchema } from '../components/SEOHead';
import Hero from '../components/landing/Hero';
import Services from '../components/landing/Services';
import Proof from '../components/landing/Proof';
import SolutionsPreview from '../components/landing/SolutionsPreview';
import Faq from '../components/landing/Faq';
import CTA from '../components/landing/CTA';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * La landing n'est plus qu'un assemblage : chaque bloc vit dans
 * `components/landing/` avec sa mise en page et ses animations. La page ne
 * garde que le chargement des données et l'ordre des sections.
 *
 * Ordre retenu : promesse → ce qu'on fait → preuve chiffrée → par où entrer →
 * objections (FAQ) → conversion. La preuve passe avant les solutions pour que
 * le choix d'une porte d'entrée se fasse une fois le crédit acquis.
 */
export default function HomePage() {
  const [trustedCompanies, setTrustedCompanies] = useState([
    'GlobalTech', 'BioPharm', 'NeoRetail', 'MedStaff', 'InvestCorp',
  ]);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    // `Array.isArray` et pas seulement `.length` : quand REACT_APP_BACKEND_URL
    // n'est pas défini, l'appel part sur une URL relative servie par le
    // serveur statique, qui répond `index.html` en 200. On récupère alors une
    // chaîne HTML — dont `.length` est vrai — et le premier `.map()` en aval
    // fait tomber toute la page dans l'ErrorBoundary.
    axios.get(`${API}/site-content`)
      .then((res) => {
        const companies = res.data?.trusted_companies;
        if (Array.isArray(companies) && companies.length > 0) setTrustedCompanies(companies);
      })
      .catch(() => {});
    axios.get(`${API}/faq`)
      .then((res) => { if (Array.isArray(res.data)) setFaqs(res.data); })
      .catch(() => {});
  }, []);

  return (
    <div data-testid="home-page" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SEOHead page="home" />
      <OrganizationSchema />
      <ServiceSchema />
      <FAQSchema faqs={faqs} />

      <Hero trustedCompanies={trustedCompanies} />
      <Services />
      <Proof />
      <SolutionsPreview />
      <Faq faqs={faqs} />
      <CTA />
    </div>
  );
}

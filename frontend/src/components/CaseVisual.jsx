/**
 * Visuel d'une étude de cas, sans photo d'illustration.
 *
 * Les études de cas étaient illustrées par des photos de banque d'images. Sur
 * une page qui affirme « +340 % d'efficacité chez GlobalTech », une photo de
 * bureau générique est le signal E-E-A-T le plus faible possible : elle suggère
 * une preuve visuelle qui n'en est pas une, et un lecteur attentif la reconnaît.
 *
 * On affiche plutôt ce qui constitue réellement l'argument — le résultat chiffré
 * et la catégorie — sur un fond composé. C'est honnête, c'est lisible, et ça met
 * en avant l'information qui compte.
 *
 * Une vraie capture d'écran d'un livrable client resterait meilleure : dès que
 * `image_url` est renseigné, elle est utilisée à la place.
 */
export function CaseVisual({ roi, category, title, imageUrl, hauteur }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title || ''}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        style={hauteur ? { height: hauteur } : undefined}
      />
    );
  }

  return (
    <div
      // Purement décoratif : le ROI et la catégorie sont déjà dans le texte de
      // la carte, un lecteur d'écran ne doit pas les entendre deux fois.
      aria-hidden="true"
      style={{
        position: 'relative',
        width: '100%',
        height: hauteur || '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 20,
        overflow: 'hidden',
        background:
          'radial-gradient(120% 120% at 20% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%), var(--surface2)',
      }}
    >
      {/* Trame technique discrète, cohérente avec l'espace démo. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px),' +
            'linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
        }}
      />
      {roi && (
        <span
          className="font-heading"
          style={{
            position: 'relative',
            fontSize: 'clamp(1.6rem,5vw,2.4rem)',
            fontWeight: 700,
            letterSpacing: '-.02em',
            color: 'var(--accent-text)',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {roi}
        </span>
      )}
      {category && (
        <span
          style={{
            position: 'relative',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: 'var(--text2)',
            textAlign: 'center',
          }}
        >
          {category}
        </span>
      )}
    </div>
  );
}

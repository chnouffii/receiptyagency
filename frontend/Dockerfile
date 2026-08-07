FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install ajv@8.17.1 ajv-keywords@5.1.0 --legacy-peer-deps
COPY . .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
# Les source maps exposent l'intégralité du code source (commentaires compris)
# à quiconque ouvre /static/js/*.map. Jamais en production.
ENV GENERATE_SOURCEMAP=false
RUN npm run build
# Ceinture et bretelles : aucun .map ne doit atteindre l'image nginx, même si
# une dépendance en émet en dehors du contrôle de CRA.
RUN find build -name "*.map" -type f -delete

# --- Prérendu statique (SEO/GEO) — NON-FATAL ---------------------------------
# Génère un HTML complet par page vitrine pour les robots qui n'exécutent pas
# le JS. Tout le bloc est protégé par `|| echo` : si l'installation de Chromium,
# de puppeteer ou le rendu échoue, le build SPA déjà produit est livré tel quel.
RUN (apt-get update \
      && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation \
      && rm -rf /var/lib/apt/lists/* \
      && npm install --no-save --legacy-peer-deps puppeteer-core@23 \
      && CHROMIUM_PATH=/usr/bin/chromium node prerender.mjs) \
    || echo "⚠ Étape de prérendu ignorée — livraison du build SPA standard."

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

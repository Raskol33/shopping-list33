# Étape 1: Construire l'application Next.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances pour tirer parti du cache Docker
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm i --frozen-lockfile; \
  else npm i; \
  fi

COPY . .

# Construire l'application
RUN npx prisma generate # Si vous utilisez Prisma
RUN npm run build

# Étape 2: Servir l'application construite avec un serveur léger
FROM node:20-alpine AS runner

WORKDIR /app

# Définir l'utilisateur non-root pour la sécurité
ENV NODE_ENV production

# Copier les dépendances de production et l'application construite de l'étape du builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Assurez-vous que le port est exposé
EXPOSE 3000

# Commande pour démarrer l'application Next.js en production
CMD ["npm", "start"]
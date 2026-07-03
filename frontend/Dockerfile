# ==========================================
# FASE 1: Costruzione (Build) con Node.js
# ==========================================
# Usiamo Node 20 (la versione LTS attuale, ottima per Vite)
FROM node:20-alpine AS build

# Impostiamo la cartella di lavoro nel container
WORKDIR /app

# Copiamo PRIMA solo i file delle dipendenze. 
# Questo è un trucco Docker: se non cambi i pacchetti, Docker userà la cache 
# e salterà questa fase lunghissima nei build successivi!
COPY package*.json ./

# Installiamo le librerie di React/Vite
RUN npm install

# Ora copiamo tutto il resto del codice (componenti, css, asset)
COPY . ./

# Lancia il comando di build di Vite.
# Attenzione: a differenza di Create React App (che crea la cartella 'build/'),
# Vite per impostazione predefinita genera i file compilati nella cartella 'dist/'
RUN npm run build


# ==========================================
# FASE 2: Produzione (Serve) con Nginx
# ==========================================
# Partiamo da un'immagine pulita di Nginx
FROM nginx:alpine

# Rimuoviamo la pagina di benvenuto di default di Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamo i file compilati dalla Fase 1 (dist/) dentro la cartella pubblica di Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiamo la nostra configurazione personalizzata per il routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Esponiamo la porta 80 (standard per il traffico web HTTP)
EXPOSE 80

# Avviamo Nginx bloccandolo in foreground (richiesto da Docker)
CMD ["nginx", "-g", "daemon off;"]
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm install

# Copiar código do backend
COPY server ./server

# Build do frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# Stage de produção
FROM node:18-alpine

WORKDIR /app

# Copiar apenas dependências de produção
COPY package*.json ./
RUN npm install --production

# Copiar código do backend
COPY server ./server

# Copiar build do frontend
COPY --from=builder /app/client/build ./client/build

# Criar diretório para dados
RUN mkdir -p /app/data

# Expor porta
EXPOSE 5000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5000

# Comando para iniciar
CMD ["node", "server/index.js"]


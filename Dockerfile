FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências do backend
COPY package*.json ./

# Instalar dependências do backend
RUN npm install

# Copiar código do backend
COPY server ./server

# Instalar dependências do cliente e fazer build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# Voltar para o diretório raiz
WORKDIR /app

# Criar diretório para dados
RUN mkdir -p /app/data

# Expor porta
EXPOSE 5000

# Comando para iniciar
CMD ["node", "server/index.js"]


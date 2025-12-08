# 🚀 Guia Rápido de Início

## Pré-requisitos

- Docker e Docker Compose instalados
- Evolution API configurada e rodando

## Configuração Rápida

1. **Clone e configure o ambiente:**
```bash
cd amigo-secreto
cp .env.example .env
```

2. **Edite o arquivo `.env` com suas credenciais:**
```env
EVOLUTION_BASE_URL=http://seu-evolution-api:8080
EVOLUTION_INSTANCE=sua-instancia
EVOLUTION_TOKEN=seu-token
APP_BASE_URL=http://localhost:5000
```

3. **Execute com Docker:**
```bash
docker-compose up --build
```

4. **Acesse a aplicação:**
- Abra seu navegador em `http://localhost:5000`

## Uso Básico

1. **Criar Grupo**: Clique em "Novo Grupo"
2. **Adicionar Participantes**: Abra o grupo e adicione pelo menos 3 participantes
   - Formato do telefone: DDI + número (ex: 5548999999999)
3. **Realizar Sorteio**: Clique em "Realizar Sorteio"
4. **Enviar Links**: Clique em "Enviar Links para Todos"
5. **Participantes recebem**: Link único via WhatsApp que só pode ser visualizado uma vez

## Desenvolvimento Local

Para desenvolvimento sem Docker:

```bash
# Instalar dependências
npm install
cd client && npm install && cd ..

# Configurar .env
cp .env.example .env
# Editar .env

# Executar em modo desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
amigo-secreto/
├── server/           # Backend Node.js/Express
│   ├── controllers/  # Controladores da API
│   ├── routes/       # Rotas da API
│   ├── services/     # Serviços (Evolution API)
│   ├── utils/        # Utilitários
│   └── database.js   # Configuração SQLite
├── client/           # Frontend React
│   └── src/
│       └── components/
└── data/             # Banco de dados SQLite (criado automaticamente)
```

## Troubleshooting

**Erro ao conectar Evolution API:**
- Verifique se a Evolution API está rodando
- Confirme as credenciais no `.env`
- Teste a conexão manualmente

**Erro no sorteio:**
- Certifique-se de ter pelo menos 3 participantes
- O algoritmo tenta até 100 vezes

**Link não funciona:**
- Verifique se o `APP_BASE_URL` está correto no `.env`
- Em produção, use o domínio real onde a aplicação está hospedada


# 🎁 Amigo Secreto - Aplicação com Evolution API

Aplicação web para organizar **Amigo Secreto** e enviar links de visualização única via **WhatsApp** usando **Evolution API**.

[![Deploy](https://img.shields.io/badge/Deploy-Coolify-blue)](https://ambiente.bacco-erp.com/)

## 📋 Funcionalidades

- ✅ Cadastro de grupos de amigo secreto
- ✅ Cadastro de participantes (nome + telefone com DDI)
- ✅ Sorteio automatizado com regras:
  - Ninguém pode tirar a si mesmo
  - Ninguém pode tirar quem o tirou (sem pares A↔B)
- ✅ Geração de links únicos por participante
- ✅ Visualização única (cada link só pode ser visto uma vez)
- ✅ Envio dos links via WhatsApp usando Evolution API
- ✅ Banco de dados SQLite

## 🚀 Tecnologias

- **Backend**: Node.js + Express
- **Frontend**: React
- **Banco de Dados**: SQLite
- **Containerização**: Docker

## 📦 Instalação e Execução

### Opção 1: Docker (Recomendado)

1. Clone o repositório:
```bash
git clone <repo-url>
cd amigo-secreto
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
EVOLUTION_BASE_URL=http://localhost:8080
EVOLUTION_INSTANCE=default
EVOLUTION_TOKEN=seu_token_aqui
APP_BASE_URL=http://localhost:5000
PORT=5000
DB_PATH=./data/database.sqlite
```

3. Construa e execute com Docker Compose:
```bash
docker-compose up --build
```

A aplicação estará disponível em `http://localhost:5000`

### Opção 2: Desenvolvimento Local

1. Instale as dependências:
```bash
npm install
cd client && npm install && cd ..
```

2. Configure o arquivo `.env` (veja acima)

3. Execute em modo desenvolvimento:
```bash
npm run dev
```

Isso iniciará:
- Backend na porta 5000
- Frontend na porta 3000

4. Para produção:
```bash
# Build do frontend
npm run build

# Iniciar servidor
npm start
```

## 🔧 Configuração da Evolution API

Certifique-se de ter a Evolution API configurada e rodando. Você precisará:

1. **EVOLUTION_BASE_URL**: URL base da sua instância Evolution API
2. **EVOLUTION_INSTANCE**: Nome da instância configurada
3. **EVOLUTION_TOKEN**: Token de autenticação da API

## 📱 Uso

1. **Criar um Grupo**: Clique em "Novo Grupo" e preencha os dados
2. **Adicionar Participantes**: Abra o grupo e adicione participantes (mínimo 3)
   - Nome do participante
   - Telefone no formato internacional (DDI + número, ex: 5548999999999)
3. **Realizar Sorteio**: Clique em "Realizar Sorteio" quando tiver pelo menos 3 participantes
4. **Enviar Links**: Após o sorteio, clique em "Enviar Links para Todos" para enviar via WhatsApp
5. **Visualizar Resultado**: Cada participante receberá um link único que só pode ser visualizado uma vez

## 🗄️ Estrutura do Banco de Dados

### Tabelas

- **grupos**: Armazena os grupos de amigo secreto
- **participantes**: Armazena os participantes de cada grupo
- **sorteios**: Armazena os resultados do sorteio com tokens únicos
- **envios**: Registra o histórico de envios via Evolution API

## 🔐 Segurança

- Tokens de revelação são gerados usando `crypto.randomBytes(32)`
- Links só podem ser visualizados uma vez
- Validação de telefone internacional
- Validação de regras de sorteio

## 📝 API Endpoints

### Grupos
- `GET /api/grupos` - Lista todos os grupos
- `GET /api/grupos/:id` - Obtém um grupo específico
- `POST /api/grupos` - Cria um novo grupo
- `PUT /api/grupos/:id` - Atualiza um grupo
- `DELETE /api/grupos/:id` - Deleta um grupo

### Participantes
- `GET /api/grupos/:grupo_id/participantes` - Lista participantes de um grupo
- `POST /api/grupos/:grupo_id/participantes` - Adiciona participante
- `DELETE /api/participantes/:id` - Remove participante

### Sorteio
- `POST /api/grupos/:grupo_id/sorteio` - Realiza o sorteio
- `GET /api/grupos/:grupo_id/sorteio` - Obtém resultado do sorteio

### Envio
- `POST /api/grupos/:grupo_id/enviar` - Envia links via Evolution API
- `GET /api/grupos/:grupo_id/envios` - Lista histórico de envios

### Reveal (Público)
- `GET /api/reveal/:token` - Revela o amigo secreto (visualização única)

## 🐛 Troubleshooting

### Erro ao conectar com Evolution API
- Verifique se a Evolution API está rodando
- Confirme as credenciais no arquivo `.env`
- Verifique se a instância está ativa

### Erro no sorteio
- Certifique-se de ter pelo menos 3 participantes
- O algoritmo tenta até 100 vezes gerar um sorteio válido

### Link já visualizado
- Cada link só pode ser visualizado uma vez por design
- Se necessário, gere um novo sorteio

## 📄 Licença

ISC

## 👥 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.


#!/bin/bash

# Script para criar Redis via API do Coolify
# O token precisa ter permissão de escrita (write)

API_URL="https://ambiente.bacco-erp.com/api/v1"
TOKEN="1|cYs9PY4Aigsl9BRNLl05uKWnVUnEhJaTjnJ9InX3f5030d64"
PROJECT_UUID="j0wwcocgocwwg0g884w8so0g"
SERVER_UUID="t0owoogk488sg8s8kw0kgcsc"
ENV_NAME="production"

echo "🔴 Criando Redis via API do Coolify..."
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/databases/redis" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "server_uuid": "'$SERVER_UUID'",
    "project_uuid": "'$PROJECT_UUID'",
    "environment_name": "'$ENV_NAME'",
    "name": "redis-amigo-secreto",
    "description": "Redis para filas de envio de mensagens",
    "redis_password": "",
    "instant_deploy": true
  }')

echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q "Missing required permissions"; then
    echo ""
    echo "❌ Erro: Token não tem permissão de escrita (write)"
    echo ""
    echo "📝 Solução:"
    echo "1. Acesse: https://ambiente.bacco-erp.com/"
    echo "2. Vá em 'Settings' > 'Keys & Tokens'"
    echo "3. Crie um novo token com permissão 'write'"
    echo "4. Atualize o TOKEN neste script"
    echo ""
    echo "OU crie manualmente via interface:"
    echo "1. Projeto 'amigo-secreto' > New Resource > Database > Redis"
    echo "2. Nome: redis-amigo-secreto"
    echo "3. Deploy"
elif echo "$RESPONSE" | grep -q "uuid\|id"; then
    echo ""
    echo "✅ Redis criado com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Vá na aplicação 'amigo-secreto' > Environment Variables"
    echo "2. Adicione: REDIS_URL=redis://redis-amigo-secreto:6379"
    echo "3. Faça redeploy da aplicação"
fi


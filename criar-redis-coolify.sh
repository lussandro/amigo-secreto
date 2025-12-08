#!/bin/bash

# Script para criar Redis no Coolify via API
API_URL="https://ambiente.bacco-erp.com/api/v1"
TOKEN="1|cYs9PY4Aigsl9BRNLl05uKWnVUnEhJaTjnJ9InX3f5030d64"
PROJECT_UUID="j0wwcocgocwwg0g884w8so0g"
SERVER_UUID="t0owoogk488sg8s8kw0kgcsc"

echo "🔴 Criando serviço Redis no Coolify..."

# Tentar criar Redis como database service
echo "📋 Tentando criar Redis..."
RESPONSE=$(curl -s -X POST "$API_URL/projects/$PROJECT_UUID/databases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "redis-amigo-secreto",
    "description": "Redis para filas de envio de mensagens",
    "type": "redis",
    "server_id": "'$SERVER_UUID'"
  }')

echo "$RESPONSE" | python3 -m json.tool

if echo "$RESPONSE" | grep -q "error\|Error\|ERROR"; then
  echo ""
  echo "⚠️  Não foi possível criar via API. Siga os passos manuais:"
  echo ""
  echo "1. Acesse: https://ambiente.bacco-erp.com/"
  echo "2. Vá no projeto 'amigo-secreto'"
  echo "3. Clique em 'New Resource' > 'Database'"
  echo "4. Selecione 'Redis'"
  echo "5. Configure:"
  echo "   - Name: redis-amigo-secreto"
  echo "   - Server: localhost"
  echo "6. Clique em 'Deploy'"
  echo ""
  echo "7. Após criar, vá na aplicação 'amigo-secreto' > Environment Variables"
  echo "8. Adicione:"
  echo "   REDIS_URL=redis://redis-amigo-secreto:6379"
  echo "   (ou use as variáveis que o Coolify fornecer)"
  echo ""
else
  echo ""
  echo "✅ Redis criado com sucesso!"
  echo ""
  echo "📝 Próximos passos:"
  echo "1. Vá na aplicação 'amigo-secreto' > Environment Variables"
  echo "2. Adicione:"
  echo "   REDIS_URL=redis://redis-amigo-secreto:6379"
  echo "   (ou use as variáveis de conexão que o Coolify fornecer)"
  echo "3. Faça redeploy da aplicação"
fi


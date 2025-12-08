#!/bin/bash

# Tentativa final de criar Redis via API do Coolify
# Se não funcionar, use criar-redis-servidor.sh no servidor

API_URL="https://ambiente.bacco-erp.com/api/v1"
TOKEN="1|cYs9PY4Aigsl9BRNLl05uKWnVUnEhJaTjnJ9InX3f5030d64"
PROJECT_UUID="j0wwcocgocwwg0g884w8so0g"
ENV_UUID="jwoggw0o8s0gc8cwoo0g04s8"
SERVER_UUID="t0owoogk488sg8s8kw0kgcsc"

echo "🔴 Tentando criar Redis via API do Coolify..."

# Tentar diferentes formatos de requisição
echo "📋 Tentativa 1: POST /resources..."
RESPONSE1=$(curl -s -X POST "$API_URL/environments/$ENV_UUID/resources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "redis-amigo-secreto",
    "type": "database",
    "database_type": "redis",
    "server_id": "'$SERVER_UUID'"
  }')
echo "$RESPONSE1" | python3 -m json.tool

echo ""
echo "📋 Tentativa 2: POST /databases..."
RESPONSE2=$(curl -s -X POST "$API_URL/environments/$ENV_UUID/databases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "redis-amigo-secreto",
    "type": "redis",
    "server_id": "'$SERVER_UUID'"
  }')
echo "$RESPONSE2" | python3 -m json.tool

echo ""
echo "📋 Tentativa 3: POST /services..."
RESPONSE3=$(curl -s -X POST "$API_URL/environments/$ENV_UUID/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "redis-amigo-secreto",
    "type": "redis",
    "server_id": "'$SERVER_UUID'"
  }')
echo "$RESPONSE3" | python3 -m json.tool

# Verificar se alguma funcionou
if echo "$RESPONSE1" | grep -q -v "Not found\|error\|Error"; then
    echo ""
    echo "✅ Sucesso na tentativa 1!"
    exit 0
fi

if echo "$RESPONSE2" | grep -q -v "Not found\|error\|Error"; then
    echo ""
    echo "✅ Sucesso na tentativa 2!"
    exit 0
fi

if echo "$RESPONSE3" | grep -q -v "Not found\|error\|Error"; then
    echo ""
    echo "✅ Sucesso na tentativa 3!"
    exit 0
fi

echo ""
echo "❌ Nenhuma tentativa funcionou. A API do Coolify não suporta criação de databases."
echo ""
echo "📝 Solução: Execute criar-redis-servidor.sh no servidor do Coolify:"
echo "   scp criar-redis-servidor.sh root@72.60.1.216:/tmp/"
echo "   ssh root@72.60.1.216 'bash /tmp/criar-redis-servidor.sh'"
echo ""
echo "OU crie manualmente via interface web do Coolify:"
echo "1. Acesse: https://ambiente.bacco-erp.com/"
echo "2. Projeto 'amigo-secreto' > New Resource > Database > Redis"
echo "3. Nome: redis-amigo-secreto"
echo "4. Deploy"


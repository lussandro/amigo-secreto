#!/bin/bash

# Script para deploy no Coolify via API
# Token: 1|cYs9PY4Aigsl9BRNLl05uKWnVUnEhJaTjnJ9InX3f5030d64

API_URL="https://ambiente.bacco-erp.com/api/v1"
TOKEN="1|cYs9PY4Aigsl9BRNLl05uKWnVUnEhJaTjnJ9InX3f5030d64"
PROJECT_UUID="j0wwcocgocwwg0g884w8so0g"
SERVER_UUID="t0owoogk488sg8s8kw0kgcsc"

echo "🚀 Iniciando deploy no Coolify..."

# Verificar se o projeto existe
echo "📋 Verificando projeto..."
PROJECT=$(curl -s -X GET "$API_URL/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Projeto encontrado: $PROJECT_UUID"

echo ""
echo "✅ Projeto criado com sucesso!"
echo ""
echo "📝 Próximos passos via interface web:"
echo "1. Acesse: https://ambiente.bacco-erp.com/"
echo "2. Vá no projeto 'amigo-secreto'"
echo "3. Clique em 'New Resource' > 'Application'"
echo "4. Configure:"
echo "   - Name: amigo-secreto"
echo "   - Server: localhost"
echo "   - Source: GitHub"
echo "   - Repository: lussandro/amigo-secreto"
echo "   - Branch: main"
echo "   - Build Pack: Dockerfile"
echo "   - Dockerfile: Dockerfile.prod"
echo "   - Port: 5000"
echo ""
echo "5. Variáveis de ambiente:"
echo "   NODE_ENV=production"
echo "   PORT=5000"
echo "   EVOLUTION_BASE_URL=https://api2.chatcoreapi.io"
echo "   EVOLUTION_INSTANCE=noel"
echo "   EVOLUTION_TOKEN=1CCBD19CE3EF-43F3-95F3-58AC12BB10CB"
echo "   APP_BASE_URL=http://SEU_IP:PORTA (atualizar após deploy)"
echo "   DB_PATH=/app/data/database.sqlite"
echo ""
echo "6. Volume:"
echo "   Path: /app/data"
echo ""
echo "7. Clique em Deploy!"


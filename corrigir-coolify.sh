#!/bin/bash

# Script para corrigir configurações no Coolify
# Infelizmente a API do Coolify tem limitações, então algumas coisas precisam ser feitas manualmente

API_URL="https://ambiente.bacco-erp.com/api/v1"
TOKEN="1|cYs9PY4Aigsl9BRNLl05uKWnVUnEhJaTjnJ9InX3f5030d64"
PROJECT_UUID="j0wwcocgocwwg0g884w8so0g"
RESOURCE_UUID="xc4wkk08ccuwoccscc8848co"
ENV_UUID="jwoggw0o8s0gc8cwoo0g04s8"
DOMAIN="xc4wkk08ccuwoccscc8848co.72.60.1.216.sslip.io"

echo "🔧 Tentando corrigir configurações via API..."

# Tentar atualizar porta (pode não funcionar via API)
echo "📌 Tentando atualizar porta para 5000..."
curl -s -X PUT "$API_URL/projects/$PROJECT_UUID/resources/$RESOURCE_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"port": 5000, "ports_exposes": 5000}' > /dev/null

echo ""
echo "⚠️  A API do Coolify tem limitações. Você precisa fazer manualmente:"
echo ""
echo "1. Acesse: https://ambiente.bacco-erp.com/"
echo "2. Vá no projeto 'amigo-secreto' > aplicação 'amigo-secreto'"
echo "3. Vá em 'General' ou 'Settings'"
echo "4. Altere 'Port Exposes' de 3000 para 5000"
echo "5. Vá em 'Environment Variables'"
echo "6. Encontre 'NODE_ENV=production' e DESMARQUE 'Available at Buildtime'"
echo "7. Adicione/Atualize 'APP_BASE_URL' com: https://$DOMAIN"
echo "8. Clique em 'Redeploy' ou 'Restart'"
echo ""
echo "✅ Depois disso, a aplicação deve funcionar!"


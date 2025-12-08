#!/bin/bash

# Script para criar Redis no servidor do Coolify
# Execute este script no servidor onde o Coolify está rodando

echo "🔴 Criando Redis no servidor do Coolify..."

# Encontrar a rede do Coolify
COOLIFY_NETWORK=$(docker network ls | grep -i coolify | head -1 | awk '{print $1}')
if [ -z "$COOLIFY_NETWORK" ]; then
    # Tentar encontrar rede padrão do Coolify
    COOLIFY_NETWORK=$(docker network ls | grep -E "coolify|traefik" | head -1 | awk '{print $1}')
fi

if [ -z "$COOLIFY_NETWORK" ]; then
    echo "❌ Não foi possível encontrar a rede do Coolify"
    echo "📋 Redes disponíveis:"
    docker network ls
    echo ""
    echo "Por favor, execute manualmente:"
    echo "docker network ls"
    echo "E depois:"
    echo "docker run -d --name redis-amigo-secreto --network <NETWORK_ID> -p 6379:6379 redis:7-alpine"
    exit 1
fi

NETWORK_NAME=$(docker network inspect $COOLIFY_NETWORK --format '{{.Name}}' 2>/dev/null || echo "unknown")
echo "✅ Rede encontrada: $NETWORK_NAME ($COOLIFY_NETWORK)"

# Verificar se Redis já existe
if docker ps -a --format '{{.Names}}' | grep -q "^redis-amigo-secreto$"; then
    echo "⚠️  Redis 'redis-amigo-secreto' já existe"
    read -p "Deseja remover e recriar? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🗑️  Removendo Redis existente..."
        docker stop redis-amigo-secreto 2>/dev/null
        docker rm redis-amigo-secreto 2>/dev/null
    else
        echo "✅ Usando Redis existente"
        docker start redis-amigo-secreto 2>/dev/null
        exit 0
    fi
fi

# Criar Redis
echo "🚀 Criando container Redis..."
docker run -d \
    --name redis-amigo-secreto \
    --network $NETWORK_NAME \
    --restart unless-stopped \
    -p 6379:6379 \
    redis:7-alpine \
    redis-server --appendonly yes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Redis criado com sucesso!"
    echo ""
    echo "📋 Informações:"
    echo "   Nome: redis-amigo-secreto"
    echo "   Rede: $NETWORK_NAME"
    echo "   Porta: 6379"
    echo "   URL: redis://redis-amigo-secreto:6379"
    echo ""
    echo "📝 Próximos passos no Coolify:"
    echo "1. Vá na aplicação 'amigo-secreto' > Environment Variables"
    echo "2. Adicione: REDIS_URL=redis://redis-amigo-secreto:6379"
    echo "3. Faça redeploy da aplicação"
    echo ""
else
    echo "❌ Erro ao criar Redis"
    exit 1
fi


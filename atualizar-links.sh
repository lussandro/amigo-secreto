#!/bin/bash
# Script para atualizar links no banco de dados do Coolify
# Conecta via SSH e atualiza os links

echo "Para atualizar os links no banco de produção, você precisa:"
echo ""
echo "1. Conectar via SSH no servidor do Coolify"
echo "2. Executar:"
echo ""
echo "docker exec -it <container_id> sqlite3 /app/data/database.sqlite \""
echo "UPDATE sorteios SET link_visualizacao = REPLACE(link_visualizacao, 'http://localhost:3000', 'http://xc4wkk08ccuwoccscc8848co.72.60.1.216.sslip.io');"
echo "\""
echo ""
echo "Ou fazer um novo sorteio que vai gerar os links corretos."

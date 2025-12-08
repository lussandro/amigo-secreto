# 🚀 Guia de Deploy - Coolify

## Pré-requisitos

1. Conta no GitHub
2. Acesso ao Coolify: https://ambiente.bacco-erp.com/
3. Credenciais: lussandro@gmail.com / Paty@30042021

## Passo 1: Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Nome do repositório: `amigo-secreto` (ou outro nome de sua preferência)
3. Marque como **Público** ou **Privado** (sua escolha)
4. **NÃO** marque "Initialize with README" (já temos arquivos)
5. Clique em "Create repository"

## Passo 2: Enviar Código para o GitHub

No terminal, execute:

```bash
cd /home/lussandro/amigo-secreto

# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Initial commit: Amigo Secreto com Evolution API"

# Adicionar remote do GitHub (substitua SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/amigo-secreto.git

# Enviar para o GitHub
git branch -M main
git push -u origin main
```

## Passo 3: Configurar no Coolify

1. Acesse https://ambiente.bacco-erp.com/
2. Faça login com: `lussandro@gmail.com` / `Paty@30042021`
3. Clique em "New Resource" ou "New Application"
4. Selecione "GitHub" como fonte
5. Conecte sua conta do GitHub (se necessário)
6. Selecione o repositório `amigo-secreto`
7. Configure:
   - **Build Pack**: Docker
   - **Dockerfile Path**: `Dockerfile.prod`
   - **Port**: `5000`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=5000
     EVOLUTION_BASE_URL=https://api2.chatcoreapi.io
     EVOLUTION_INSTANCE=noel
     EVOLUTION_TOKEN=1CCBD19CE3EF-43F3-95F3-58AC12BB10CB
     APP_BASE_URL=http://SEU_IP:PORTA
     DB_PATH=/app/data/database.sqlite
     ```
     
     **Importante**: Substitua `SEU_IP:PORTA` pelo IP e porta que o Coolify atribuirá à aplicação.
     Exemplo: `http://192.168.1.100:5000` ou `http://seu-ip-publico:5000`
8. Adicione um volume persistente:
   - **Path**: `/app/data`
   - Para manter o banco de dados SQLite

## Passo 4: Configurar Domínio

1. No Coolify, vá em "Domains" ou "Settings"
2. Adicione um domínio (ex: `amigo-secreto.ambiente.bacco-erp.com`)
3. Atualize a variável `APP_BASE_URL` com o domínio correto
4. Reinicie a aplicação

## Passo 5: Atualizar Links

Após o deploy, os links gerados usarão o `APP_BASE_URL` configurado.

**Importante**: Certifique-se de que o `APP_BASE_URL` está correto para que os links funcionem!

## Troubleshooting

- **Erro de build**: Verifique se o Dockerfile.prod está correto
- **Banco não persiste**: Verifique se o volume `/app/data` está configurado
- **Links não funcionam**: Verifique se `APP_BASE_URL` está correto e acessível
- **Erro 500**: Verifique os logs no Coolify

## Comandos Úteis

```bash
# Ver logs
docker logs <container-id>

# Acessar container
docker exec -it <container-id> sh

# Verificar banco de dados
docker exec -it <container-id> ls -la /app/data
```


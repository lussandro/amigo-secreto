# 🔧 Correções Necessárias no Coolify

## ⚠️ Problemas Identificados nos Logs

### 1. Porta Incorreta (CRÍTICO)
**Erro:** `PORT environment variable (5000) does not match configured ports_exposes: 3000`

**Solução:**
1. No Coolify, vá em **General** (ou configurações da aplicação)
2. Altere **Port Exposes** de `3000` para `5000`
3. Salve e reinicie a aplicação

### 2. NODE_ENV durante Build
**Aviso:** `NODE_ENV=production` durante o build pode pular devDependencies necessárias

**Solução (escolha uma):**

**Opção A - Recomendada:**
1. No Coolify, vá em **Environment Variables**
2. Encontre `NODE_ENV=production`
3. **Desmarque** "Available at Buildtime" (deixe apenas Runtime)
4. Adicione uma nova variável para build:
   - Name: `NODE_ENV`
   - Value: `development`
   - Marque: "Available at Buildtime" ✅
   - Marque: "Available at Runtime" ❌
5. Mantenha a variável original:
   - Name: `NODE_ENV`
   - Value: `production`
   - Marque: "Available at Buildtime" ❌
   - Marque: "Available at Runtime" ✅

**Opção B - Mais Simples:**
1. No Coolify, vá em **Environment Variables**
2. Encontre `NODE_ENV=production`
3. **Desmarque** "Available at Buildtime"
4. Mantenha apenas "Available at Runtime"

### 3. Verificar Variáveis de Ambiente

Certifique-se de que todas estas variáveis estão configuradas:

```
NODE_ENV=production (Runtime only)
PORT=5000
EVOLUTION_BASE_URL=https://api2.chatcoreapi.io
EVOLUTION_INSTANCE=noel
EVOLUTION_TOKEN=1CCBD19CE3EF-43F3-95F3-58AC12BB10CB
APP_BASE_URL=http://SEU_IP:5000 (ou domínio fornecido pelo Coolify)
DB_PATH=/app/data/database.sqlite
```

### 4. Verificar Volume

Certifique-se de que o volume está configurado:
- **Path:** `/app/data`
- Isso mantém o banco SQLite persistente

## 📋 Passos para Corrigir

1. ✅ Acesse: https://ambiente.bacco-erp.com/
2. ✅ Vá na aplicação `amigo-secreto`
3. ✅ Vá em **General** → Altere porta de `3000` para `5000`
4. ✅ Vá em **Environment Variables** → Ajuste `NODE_ENV` conforme Opção A ou B acima
5. ✅ Verifique se `APP_BASE_URL` está correto (com IP/domínio do Coolify)
6. ✅ Vá em **Volumes** → Verifique se `/app/data` está configurado
7. ✅ Clique em **Redeploy** ou **Restart**

## ✅ Após Correções

A aplicação deve funcionar corretamente. Teste:
- Acesse a URL fornecida pelo Coolify
- Crie um grupo
- Adicione participantes
- Faça o sorteio
- Envie os links


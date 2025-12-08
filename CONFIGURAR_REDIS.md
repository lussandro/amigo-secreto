# 🔴 Configurar Redis no Coolify

## Passo 1: Criar o serviço Redis

1. Acesse: https://ambiente.bacco-erp.com/
2. Vá no projeto **"amigo-secreto"**
3. Clique em **"New Resource"** > **"Database"**
4. Selecione **"Redis"**
5. Configure:
   - **Name**: `redis-amigo-secreto`
   - **Server**: `localhost`
   - **Description**: `Redis para filas de envio de mensagens`
6. Clique em **"Deploy"**

## Passo 2: Obter URL de conexão do Redis

Após o Redis ser criado, o Coolify fornecerá variáveis de ambiente. Você pode encontrá-las em:

1. Vá no serviço **"redis-amigo-secreto"**
2. Vá na aba **"Environment Variables"** ou **"Connection"**
3. Anote a URL de conexão (geralmente algo como `redis://redis-amigo-secreto:6379`)

**OU** use o nome do serviço diretamente:
- **Host**: `redis-amigo-secreto` (nome do serviço)
- **Port**: `6379` (porta padrão do Redis)
- **URL completa**: `redis://redis-amigo-secreto:6379`

## Passo 3: Configurar variável de ambiente na aplicação

1. Vá na aplicação **"amigo-secreto"**
2. Vá em **"Environment Variables"**
3. Adicione a variável:
   ```
   REDIS_URL=redis://redis-amigo-secreto:6379
   ```
   
   **OU** se o Coolify fornecer variáveis específicas:
   ```
   REDIS_HOST=redis-amigo-secreto
   REDIS_PORT=6379
   REDIS_URL=redis://redis-amigo-secreto:6379
   ```

## Passo 4: Atualizar código (se necessário)

O código já está configurado para usar `REDIS_URL` por padrão. Se o Coolify fornecer variáveis separadas (`REDIS_HOST`, `REDIS_PORT`), você pode atualizar `server/services/queue.js`:

```javascript
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const REDIS_URL = process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;
```

## Passo 5: Redeploy da aplicação

1. Vá na aplicação **"amigo-secreto"**
2. Clique em **"Redeploy"** ou **"Restart"**
3. Aguarde o deploy completar

## Verificação

Após o deploy, verifique os logs da aplicação. Você deve ver:
```
[WORKER] Workers de envio iniciados
[QUEUE] Job X completado: ...
```

Se houver erros de conexão com Redis, verifique:
- O nome do serviço Redis está correto
- A variável `REDIS_URL` está configurada corretamente
- O Redis está rodando (verifique no Coolify)

## Teste

1. Acesse a aplicação
2. Crie um grupo e adicione participantes
3. Realize o sorteio
4. Clique em "Enviar Links"
5. Verifique os logs - as mensagens devem ser agendadas na fila e processadas com delays aleatórios


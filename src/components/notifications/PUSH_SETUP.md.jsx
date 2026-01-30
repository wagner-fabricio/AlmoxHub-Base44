# Push Notifications - Configuração

## Gerar VAPID Keys

Execute no terminal:
```bash
npx web-push generate-vapid-keys
```

Copie as chaves geradas e configure no Dashboard → Configurações → Environment Variables:

1. **VAPID_PUBLIC_KEY**: Public Key (compartilhável)
2. **VAPID_PRIVATE_KEY**: Private Key (manter secreto!)
3. **VAPID_SUBJECT**: mailto:seu-email@dominio.com

## Service Worker

O sistema tentará registrar automaticamente `/push-sw.js`. Como não é possível criar arquivos em `/public`, você precisará criar manualmente o arquivo `push-sw.js` na raiz pública do projeto com o conteúdo disponível no commit.

## Funcionalidades

- ✅ Notificações de atribuição de OS
- ✅ Mudanças de status em OS
- ✅ Menções em comentários
- ✅ Menções em mensagens
- ✅ Alertas de prazos próximos (automação diária às 9h)

## Configuração do Usuário

Desktop: Menu → Notificações
Mobile: Perfil → Configurar Notificações
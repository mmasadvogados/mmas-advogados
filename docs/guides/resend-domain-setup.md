# Configuracao do Dominio Verificado no Resend

## Por que e necessario?

O Resend em modo sandbox (`onboarding@resend.dev`) so entrega emails para o email cadastrado na conta Resend. Para enviar newsletters para todos os assinantes, e necessario verificar um dominio proprio.

## Passo a Passo

### 1. Acessar o Resend Dashboard

- Acesse [resend.com/domains](https://resend.com/domains)
- Clique em **Add Domain**
- Informe o dominio: `mmasadvogados.adv.br`

### 2. Adicionar Registros DNS

O Resend vai gerar registros que precisam ser adicionados no painel DNS do dominio (Registro.br, Cloudflare, etc.):

| Tipo | Nome | Valor | Finalidade |
|------|------|-------|------------|
| TXT | `_resend` | (gerado pelo Resend) | Verificacao de propriedade |
| CNAME | `resend._domainkey` | (gerado pelo Resend) | DKIM — assinatura digital |
| CNAME | `resend2._domainkey` | (gerado pelo Resend) | DKIM — assinatura digital |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Politica anti-fraude (recomendado) |

### 3. Aguardar Verificacao

- Propagacao DNS pode levar de **minutos a 48 horas**
- O Resend verifica automaticamente e mostra status "Verified"

### 4. Configurar Variaveis de Ambiente

No **Vercel Dashboard** (Settings > Environment Variables):

```
RESEND_FROM_EMAIL=noreply@mmasadvogados.adv.br
NEXT_PUBLIC_APP_URL=https://mmas-advogados.vercel.app
```

### 5. Redeploy

Apos setar as env vars, faca um redeploy no Vercel para aplicar.

## Teste

1. Inscreva um email de teste no footer do site
2. Publique um artigo via admin ou Telegram
3. Verifique se o email chega no inbox
4. Confirme que o link aponta para `https://mmas-advogados.vercel.app/blog/...`

## Troubleshooting

- **Emails nao chegam:** Verifique se o dominio esta "Verified" no Resend Dashboard
- **Emails vao para spam:** Verifique se DKIM e DMARC estao configurados corretamente
- **Links apontam para localhost:** Verifique `NEXT_PUBLIC_APP_URL` no Vercel

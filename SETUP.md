# Setup — Fase 1

Passos que só você pode fazer (contas/projetos cloud). Depois de cada um, me
diga o que precisar que eu configure no código.

## 1. Supabase

1. Crie um projeto em https://supabase.com/dashboard (região recomendada:
   `sa-east-1` — São Paulo, menor latência para o Brasil).
2. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (guarde com cuidado,
     nunca vai para o client nem para o repositório)
3. Cole esses três valores em um arquivo `.env.local` na raiz do projeto
   (copie `.env.example` como base — `.env.local` já está no `.gitignore`).
4. Rode a migration inicial: abra **SQL Editor** no painel do Supabase e
   execute o conteúdo de `supabase/migrations/0001_init.sql`.
5. Crie o bucket de storage: **Storage → New bucket** → nome
   `project-documents`, **privado** (não marcar "Public bucket").
6. Crie seu primeiro usuário admin:
   - **Authentication → Users → Add user** (email + senha).
   - No **SQL Editor**, rode (troque o e-mail):
     ```sql
     insert into profiles (id, full_name, role)
     select id, 'Seu Nome', 'admin'
     from auth.users
     where email = 'seu-email@estaleiromaua.com.br';
     ```

## 2. GitHub + Vercel

O repositório Git local já existe (`git init` + commit inicial feitos).
Falta só o remoto, que exige sua conta:

1. Crie um repositório **vazio** no GitHub (sem README/gitignore) e me passe
   a URL — eu adiciono o remote e faço o push do commit já existente.
2. Em https://vercel.com, **Add New → Project**, importe esse repositório.
3. Em **Environment Variables**, adicione as mesmas três variáveis do passo 1
   (não cole a `service_role` a menos que uma rota server-side precise dela).
4. Deploy. O framework é detectado automaticamente (Next.js).

## 3. Depois de pronto

Volte e me avise quais dessas variáveis você já tem — preencho o
`.env.local` local com você e testamos o login antes de avançar para a
Fase 2 (regras de negócio e telas de projeto).

# Revisão técnica do projeto `csm-app`

## Escopo da revisão

Esta revisão foi baseada em:

- análise estrutural do monorepo Nx (apps e libs);
- leitura dos módulos principais de API/NestJS e Web/Angular;
- validação de build dos projetos `api` e `web`.

## Resumo executivo

O projeto está em estágio inicial/protótipo, com boa intenção arquitetural (Nx + separação em libs), porém com **bloqueios importantes de build**, **stubs de infraestrutura em produção de código** e **configurações de segurança ainda permissivas**.

Principais pontos:

1. **Build quebrado em ambos os apps** (`api` e `web`).
2. **Incompatibilidade de versões Angular/TypeScript**.
3. **`PrismaService` mockado**, mascarando problemas reais de banco.
4. **CORS permissivo com `credentials: true`**, configuração insegura.
5. **README desatualizado**, não reflete stack atual do monorepo.

## Achados detalhados

### 1) Build do `api` falha por caminho de assets inexistente

- O target de build da API referencia `apps/api/src/assets`, mas a pasta não existe.
- Resultado: o app não gera artefato de produção.

**Impacto:** impede pipeline de CI/CD e deploy.

**Recomendação:**

- criar a pasta `apps/api/src/assets` (com `.gitkeep`) **ou**
- remover a entrada `assets` em `apps/api/project.json` caso não seja necessária.

---

### 2) Build do `web` falha por mismatch Angular x TypeScript

- Dependências Angular estão em `^21.x`, mas `typescript` está em `~5.5.0`.
- Angular 21 requer TypeScript `>=5.9.0` e `<6.0.0`.

**Impacto:** front-end não compila em produção.

**Recomendação:** alinhar `typescript` para `~5.9.x` (ou versão suportada pelo Angular instalado) e revalidar lockfile.

---

### 3) Serviço Prisma está com shim/mock no código principal

- `libs/api/database/src/lib/prisma.service.ts` implementa um `PrismaClient` fake.
- Comentário indica “SHIM” para contornar ausência de `prisma generate`.

**Impacto:**

- falso positivo em ambiente de desenvolvimento;
- risco de erros silenciosos em runtime;
- cobertura funcional irreal das libs de domínio/configuração.

**Recomendação:**

- restaurar import de `PrismaClient` real de `@prisma/client`;
- garantir `prisma generate` no fluxo de setup/CI;
- manter fallback apenas em ambiente de teste (se estritamente necessário).

---

### 4) Configuração de CORS insegura na API

- `apps/api/src/main.ts` define `origin: process.env.CORS_ORIGIN || '*'` com `credentials: true`.
- Em browsers, isso é inválido/arriscado e pode causar comportamento inconsistente.

**Impacto:**

- risco de exposição indevida de recursos;
- falhas intermitentes de autenticação baseada em cookies/credenciais.

**Recomendação:**

- exigir `CORS_ORIGIN` explícito por ambiente;
- usar allowlist de origens (array) e nunca `'*'` com `credentials: true`.

---

### 5) Módulo principal da API com dependências stubadas

- `AppModule` registra provider `AuthService` com `useValue` mock (`guest`).
- `RuntimeController` retorna payload fixo de setup.

**Impacto:**

- reduz confiabilidade da integração real;
- dificulta transição para produção por esconder contratos ausentes.

**Recomendação:**

- separar claramente “modo demo/dev” de “modo produção” por módulo/feature flag;
- implementar contrato real de autenticação ou gateway adapter com interface e implementação concreta.

---

### 6) Documentação principal não corresponde ao projeto atual

- `README.md` descreve fluxo de “AI Studio app” com `npm run dev` e `GEMINI_API_KEY`.
- O repositório atual é um monorepo Nx com apps `api` e `web`.

**Impacto:** onboarding ruim, risco de execução incorreta e perda de tempo em setup.

**Recomendação:**

- atualizar README com:
  - pré-requisitos (Node, pnpm, Docker opcional);
  - comandos Nx reais (`pnpm nx serve api`, `pnpm nx serve web`, build, banco);
  - variáveis de ambiente necessárias;
  - fluxo de desenvolvimento local.

## Priorização sugerida (ordem de execução)

1. Corrigir build do `web` (versão TypeScript).
2. Corrigir build do `api` (assets/project config).
3. Eliminar shim do Prisma e formalizar geração de client.
4. Endurecer CORS por ambiente.
5. Atualizar README e explicitar modo dev/demo.

## Comandos executados na revisão

- `pnpm nx show projects`
- `pnpm nx show project api`
- `pnpm nx show project web`
- `pnpm nx build api`
- `pnpm nx build web`

## Nota final

A base arquitetural é promissora, mas o projeto precisa de uma rodada de “stabilization hardening” antes de qualquer entrega produtiva: **build verde, contratos reais de infraestrutura e documentação mínima confiável**.

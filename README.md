## Satisfaction Web

Plataforma web para **monitorar e gerenciar a satisfação de clientes em tempo real**, com dashboards, relatórios, monitor de operação e gestão de empresas, usuários e tipos de serviço.

Construída em **React + Vite + TypeScript**, usando **Tailwind CSS** e componentes **shadcn/ui**, com autenticação, controle de permissões e layout responsivo.

---

### ✨ Principais funcionalidades

- **Autenticação segura**
  - Tela de login moderna e responsiva
  - Controle de sessão com rotas protegidas
  - Redirecionamento automático para o dashboard após login

- **Dashboard de indicadores**
  - Visão geral dos principais números de satisfação
  - Gráficos interativos (Chart.js / Recharts)
  - Destaques e comparativos de desempenho

- **Monitor em tempo real**
  - Acompanhamento de votos/avaliações por empresa ou operação
  - Atualização em tempo real (via WebSocket/socket.io quando configurado)

- **Cadastro e gestão**
  - **Empresas**
  - **Tipos de serviço**
  - **Usuários**
  - Permissões e rotas protegidas por perfil

- **Relatórios**
  - Listagens filtráveis
  - Exportações (PDF / outros formatos, conforme configurado)

- **UI/UX**
  - Layout responsivo (desktop, tablet, mobile)
  - Tema claro/escuro (ThemeProvider)
  - Componentes reutilizáveis (sidebar, navbar, toasts, tooltips etc.)

---

### 🧱 Tecnologias utilizadas

- **Frontend**
  - [React 18](https://react.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vitejs.dev/)
  - [React Router DOM](https://reactrouter.com/)
  - [React Hook Form](https://react-hook-form.com/)
  - [Zod](https://zod.dev/) + `@hookform/resolvers`
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind)
  - [lucide-react](https://lucide.dev/) (ícones)
  - [@tanstack/react-query](https://tanstack.com/query/latest) (requisições e cache)

- **Outros**
  - Axios
  - Chart.js / react-chartjs-2
  - Recharts
  - socket.io-client

---

### 🚀 Como rodar o projeto (desenvolvimento)

#### 1. Pré-requisitos

- **Node.js** (recomendado: versão LTS mais recente)  
- **npm** ou **yarn** (exemplos abaixo usam `npm`)

No Windows, você pode verificar:

```bash
node -v
npm -v
```

#### 2. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd satisfaction-web
```

#### 3. Instalar dependências

```bash
npm install
```

#### 4. Configurar variáveis de ambiente

Crie um arquivo `.env` ou `.env.local` na raiz do projeto (se ainda não existir) e configure as variáveis necessárias, por exemplo:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

> Ajuste a URL e demais variáveis conforme seu backend/ambiente.

#### 5. Rodar em modo desenvolvimento

```bash
npm run dev
```

Por padrão, o Vite sobe em algo como:

```text
http://localhost:5173
```

Abra essa URL no navegador para usar o sistema.

---

### 🧪 Build e preview de produção

#### Gerar build

```bash
npm run build
```

Isso gera a pasta `dist/` com os arquivos otimizados.

#### Servir o build localmente

```bash
npm run preview
```

Ou, de acordo com o script definido:

```bash
npm run start
```

---

### 🔐 Autenticação e rotas protegidas

- O app usa um `AuthProvider` (`src/context/AuthContext.tsx`) para gerenciar:
  - estado de autenticação (`isAuthenticated`, `isLoading`);
  - função `login` usada na tela de `Login`.
- Rotas internas (dashboard, monitor, empresas, usuários, relatórios etc.) são protegidas via componente `ProtectedRoute`.
- Quando o usuário não estiver logado:
  - é redirecionado para `/login`;
  - após login, é levado ao painel principal.

---

### 🗺️ Estrutura geral (resumida)

```text
src/
  App.tsx              # Configuração de rotas e provedores globais
  pages/
    Login.tsx          # Tela de login
    Dashboard.tsx      # Painel principal
    Monitor.tsx        # Monitor em tempo real
    Companies.tsx      # Gestão de empresas
    ServiceTypes.tsx   # Tipos de serviço
    Users.tsx          # Gestão de usuários
    Relatorios.tsx     # Relatórios
    ...
  components/
    Sidebar.tsx
    Navbar.tsx
    ui/                # Componentes shadcn/ui
  context/
    AuthContext.tsx
    ThemeContext.tsx
```

---

### 🙋‍♂️ Como contribuir

1. Crie uma branch a partir da `main`:

```bash
git checkout -b feature/minha-feature
```

2. Faça suas alterações e rode o projeto localmente.  
3. (Opcional) Rode lint e testes, se configurados:

```bash
npm run lint
```

4. Envie um Pull Request descrevendo claramente:
   - o que foi alterado;
   - por que a mudança é importante;
   - qualquer passo extra de configuração, se necessário.

---

### 📌 Anotações finais

- O foco do sistema é **facilitar a leitura e acompanhamento de satisfação**, com uma experiência de uso agradável e responsiva.
- Caso você queira adaptar o layout (cores, logotipo, textos), basta ajustar os componentes de layout, especialmente:
  - `src/pages/Login.tsx`
  - `src/components/Sidebar.tsx`
  - `src/pages/Dashboard.tsx`

Sinta-se à vontade para evoluir o projeto e deixá-lo ainda mais com a cara da sua empresa. 🎯

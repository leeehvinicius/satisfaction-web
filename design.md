## Design do sistema Satisfaction

Este documento descreve o **visual padrão** do sistema web para você reaplicar o mesmo design no seu app Expo/React Native.

---

## 1. Visão geral

- **Estilo geral**: dashboard moderno, limpo, com muito espaço em branco, bordas suaves e foco em legibilidade.
- **Tema**: suporta **modo claro e escuro**, alternado pelo `ThemeToggle` (ícones de lua/sol).
- **Linguagem visual**:
  - Muito uso de **cards**, painéis e listas.
  - Ícones `lucide-react` para navegação e status.
  - Feedback visual com **cores fortes** para estados de sucesso/erro (principalmente em indicadores de satisfação).

---

## 2. Paleta de cores (tokens principais)

As cores são definidas em `src/index.css` via variáveis CSS, e usadas no Tailwind (`tailwind.config.ts`) como tokens. Quando for para o Expo, use esses mesmos valores como base do seu tema.

### 2.1 Tema claro (`:root`)

- **Background principal**: `--background: 0 0% 100%`  
  - Fundo **branco puro**, app “clean”.
- **Texto principal**: `--foreground: 222.2 84% 4.9%`  
  - Cinza quase preto, alta legibilidade.
- **Cards / painéis**:
  - `--card: 0 0% 100%` (fundo branco)
  - `--card-foreground: 222.2 84% 4.9%`
- **Cor primária (botões, links principais, highlights)**:
  - `--primary: 221.2 83.2% 53.3%` (azul intenso)
  - `--primary-foreground: 210 40% 98%` (texto claro sobre o azul)
- **Secundária / superfícies neutras**:
  - `--secondary: 210 40% 96.1%` (cinza bem claro)
  - `--secondary-foreground: 222.2 47.4% 11.2%`
- **Cores de apoio**:
  - `--muted`: 210 40% 96.1% (fundos discretos)
  - `--accent`: 210 40% 96.1% (acentos suaves, hovers)
- **Feedback destrutivo (erro/alerta forte)**:
  - `--destructive: 0 84.2% 60.2%` (vermelho vivo)
  - `--destructive-foreground: 210 40% 98%`
- **Bordas / inputs / foco**:
  - `--border` e `--input`: 214.3 31.8% 91.4% (bordas claras)
  - `--ring`: 221.2 83.2% 53.3% (anel de foco azul)

### 2.2 Tema escuro (`.dark`)

- **Background principal**: `--background: 222.2 84% 4.9%` (azul quase preto).
- **Texto principal**: `--foreground: 210 40% 98%` (quase branco).
- **Cards / painéis**:
  - `--card`: 222.2 84% 4.9%
  - `--card-foreground`: 210 40% 98%
- **Cor primária**:
  - `--primary: 217.2 91.2% 59.8%` (azul um pouco mais claro)
  - `--primary-foreground: 222.2 47.4% 11.2%`
- **Superfícies secundárias / muted / accent**:
  - `--secondary`, `--muted`, `--accent`: 217.2 32.6% 17.5% (cinza-azulado escuro)
  - `--muted-foreground`: 215 20.2% 65.1%
- **Destrutivo**:
  - `--destructive: 0 62.8% 30.6%` (vermelho mais fechado)
  - `--destructive-foreground: 210 40% 98%`
- **Bordas / inputs / foco**:
  - `--border` e `--input`: 217.2 32.6% 17.5%
  - `--ring`: 224.3 76.3% 48%

> **Para o Expo**: crie dois objetos de tema (light/dark) com estes mesmos tons, e use-os em um `ThemeProvider` ou contexto.

---

## 3. Tipografia

- **Fonte principal**: `Inter`, peso 100–900 (importada via Google Fonts).
- **Cor de texto**:
  - Usa `text-foreground` para texto padrão.
  - Usa `text-muted-foreground` para descrições e textos secundários.
- **Estilo**:
  - Títulos com peso **semibold/bold**.
  - Textos auxiliares em tamanho menor e cor `muted`.

No Expo, use `Inter` (via `expo-font`) para manter o mesmo visual tipográfico.

---

## 4. Espaçamentos, bordas e layout

- **Espaçamento de container**:
  - No Tailwind, `.container` é centralizado com `padding: 2rem` e largura máxima de `1400px` em telas grandes.
- **Raio de borda**:
  - Token `--radius: 0.5rem`.
  - Convertido em:
    - `lg`: `var(--radius)`
    - `md`: `var(--radius) - 2px`
    - `sm`: `var(--radius) - 4px`
- **Layout principal autenticado**:
  - `Sidebar` fixa à esquerda (`SidebarComponent`).
  - Conteúdo ocupa o restante da tela com `min-h-screen`.
  - A navbar web é fixa no topo, com fundo semi-transparente e blur.

No app, tente reproduzir:

- Um **menu lateral** ou **tab bar** fixa para a navegação.
- Cards com bordas arredondadas e padding interno confortável (16–24px).

---

## 5. Componentes e padrões visuais

### 5.1 Navbar

- **Posicionamento**: `fixed` topo, `left:0`, `right:0`.
- **Estilo**:
  - Fundo: `bg-background/80` com `backdrop-blur-md` (efeito vidro).
  - Borda inferior: `border-b border-border`.
  - Logo com ícone `Activity` azul (`text-primary`) e texto “Satisfaction”.
- **Interações**:
  - Links com hover mudando para `bg-secondary` e `text-foreground`.
  - Botão “Registrar” em destaque com `bg-primary` e `text-primary-foreground`.

Para o Expo, use um `Header` translúcido com blur e botões de ação à direita (tema, logout, etc.).

### 5.2 Sidebar

- **Fundo**: `bg-white dark:bg-neutral-950` com `border-r`.
- **Navegação**:
  - Menu vertical com ícones e texto, cada item:
    - `flex items-center gap-2 px-4 py-2`.
    - `hover:bg-accent`, bordas arredondadas.
    - Item ativo com `bg-accent`.
- **Rodapé da sidebar**:
  - Cards compactos com:
    - Ranking Top 5 empresas (badges verdes com `%` de satisfação).
    - Indicadores “Satisfação 😁” (verde) e “Melhoria 😕” (vermelho).
    - Card com nome/perfil do usuário.
    - Botão “Sair” (`variant="outline"`).

No app, você pode usar:

- Drawer lateral com lista de itens (ícone + label).
- Pequenos cards verticalmente empilhados para KPIs e ranking.

### 5.3 Cards e efeito vidro (`.glass-card`)

- Classe utilitária `glass-card`:
  - `bg-white/80` no claro, `dark:bg-slate-900/80` no escuro.
  - `backdrop-blur-md`.
  - Borda suave com transparência (`border-white/20` ou `dark:border-slate-800/20`).

Isso cria o efeito de **glassmorphism**.  
No Expo, pode ser aproximado com:

- Fundo semi-transparente (`rgba(...)`).
- `borderWidth` baixo com cor levemente translúcida.
- Se quiser, usar `BlurView` (expo-blur) atrás do card.

### 5.4 Estados de interação (`.interactive`)

- Classe `interactive`:
  - `transition-transform duration-300`.
  - `hover:scale-[1.02]` e `active:scale-[0.98]`.

No app, use leve `transform scale` em botões/cards ao pressionar para transmitir a mesma sensação de responsividade.

### 5.5 Scrollbar e UX

- Scrollbar customizado:
  - Trilho com `bg-secondary/50`.
  - Polegar com `bg-primary/30` e `hover:bg-primary/50`.
- Foco de acessibilidade:
  - `input`, `button`, `a` com `ring` azul suave (`ring-primary/20` e `ring-offset-1`).

No Expo, não há scrollbar custom nativo, mas mantenha:

- Espaçamento adequado.
- Destaques claros em campos focados/botões selecionados.

---

## 6. Motion e animações

Definidas em `tailwind.config.ts` e `index.css`.

- **Transitions de página**:
  - `.page-enter` → `animate-enter` (fade + scale-in).
  - `.page-exit` → `animate-exit` (fade + scale-out).
- **Accordion**:
  - `accordion-down` / `accordion-up` para abrir/fechar suave.
- **Slides laterais**:
  - `slide-in-right` / `slide-out-right` para drawers/sidebars.
- **Pulse sutil**:
  - `pulse-subtle` para dar vida a indicadores importantes.
- **Ticker de notícias**:
  - Animação `ticker` para o `NewsTicker` (marquee horizontal, pausa no hover).

No Expo, use animações equivalentes com **Reanimated** ou **Animated API**:

- Fade + translateY pequeno para entrada de telas/componentes.
- Scale leve para enfatizar elementos importantes.

---

## 7. Resumo para aplicação no Expo

- **Tema**:
  - Replique os tokens de cor (`background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`) em objetos JS para light/dark.
- **Tipografia**:
  - Use `Inter` como fonte padrão e mantenha pesos bold para títulos.
- **Componentes principais**:
  - Header fixo/translúcido com logo “Satisfaction”.
  - Drawer/Sidebar com ícones e labels, highlight no item ativo.
  - Cards com borda arredondada, fundo branco/escuro e, quando fizer sentido, efeito vidro.
  - Botões primários azuis, secundários em cinza claro/escuro.
- **Motion**:
  - Animações suaves de entrada/saída e pequenos efeitos de escala para interações.

Seguindo estes pontos, o seu app Expo vai ficar visualmente **coerente** com o sistema web Satisfaction.


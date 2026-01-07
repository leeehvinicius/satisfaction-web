# Etapa 1: Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY .env ./
RUN chmod -R +x node_modules/.bin && npm run build \
	&& ls -l /app/dist

# Etapa 2: Rodar a aplicação
FROM node:18-alpine
WORKDIR /app

# ✅ Instala fuso horário
RUN apk add --no-cache tzdata
ENV TZ=America/Manaus

# ⬇️ Instala o serve globalmente
RUN npm install -g serve

# copia o conteúdo da dist para a raiz
COPY --from=builder /app/dist ./

EXPOSE 3001
CMD ["serve", "-s", ".", "-l", "3001"]
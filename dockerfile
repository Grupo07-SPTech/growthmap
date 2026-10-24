
# Utiliza Node.js
FROM node:22-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia as configurações do projeto
COPY package.json ./

# Instala as dependências necessárias
RUN npm install 

# Copia o servidor, as rotas e os arquivos estáticos
COPY app.js ./
COPY src ./src
COPY public ./public

# Define o ambiente de produção
ENV NODE_ENV=production
ENV AMBIENTE_PROCESSO=producao

# Porta utilizada pela aplicação (ajuste conforme APP_PORT)
EXPOSE 3333

# Inicia a aplicação
CMD ["npm", "start"]

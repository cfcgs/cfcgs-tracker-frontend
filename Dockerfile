FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine as production
# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf
# Copia a sua configuração personalizada
COPY nginx.conf /etc/nginx/conf.d/
# Copia os arquivos estáticos da aplicação construída
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

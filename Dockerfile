FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_TUTORIAL_ENABLED=true
ARG VITE_EVALUATION_FORM_URL

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_TUTORIAL_ENABLED=${VITE_TUTORIAL_ENABLED}
ENV VITE_EVALUATION_FORM_URL=${VITE_EVALUATION_FORM_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

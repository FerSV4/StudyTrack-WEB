# ==========================================
# Etapa 1: Compilación (Build)
# ==========================================
FROM node:22-alpine AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --ignore-scripts

# Copiar el resto del código fuente del proyecto
COPY . .

# Compilar la aplicación para producción
RUN npm run build --configuration=production

# ==========================================
# Etapa 2: Servidor Web (Serve)
# ==========================================
FROM nginx:alpine

# Eliminar los archivos por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar el build de Angular desde la Etapa 1
# Nota: En Angular 17+ con el builder "application", los archivos estáticos 
# se generan dentro de la subcarpeta "browser".
COPY --from=build /app/dist/studytrack-web/browser /usr/share/nginx/html

# Copiar tu configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
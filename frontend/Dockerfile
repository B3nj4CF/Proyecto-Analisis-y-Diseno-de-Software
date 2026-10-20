# Usamos una imagen ligera de Node.js
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia de los archivos de dependencias
COPY package*.json ./

# Instalacion de las dependencias
RUN npm install

# Copia del resto de la aplicación
COPY . .

# Comando para iniciar Vite exponiendo el host a Docker
CMD ["npm", "run", "dev", "--", "--host"]
# Documentación de Despliegue y Arquitectura en la Nube - StudyTrack

## 1. Visión General de la Infraestructura

El proyecto **StudyTrack** ha sido desplegado utilizando una arquitectura basada en microservicios contenerizados y orquestados, separando claramente los entornos de desarrollo y producción. La solución en la nube se aloja en **Amazon Web Services (AWS)**, garantizando alta disponibilidad, seguridad en el manejo de credenciales y despliegue automatizado.

La pila tecnológica desplegada consta de:

* **Frontend:** Angular 17 servido a través de Nginx.
* **Backend:** API REST desarrollada en NestJS con Prisma ORM.
* **Base de Datos:** PostgreSQL administrado.

---

## 2. Orquestación y Contenedores (Pilar 1)

La aplicación principal se ejecuta sobre un clúster de Kubernetes ligero (**K3s**) aprovisionado dentro de una instancia **Amazon EC2 (Ubuntu)**. Esta decisión arquitectónica permite abstraer la complejidad del hardware y gestionar el ciclo de vida de los microservicios de manera declarativa.

### Imágenes Optimizadas (Multi-stage Build)

Tanto el frontend como el backend cuentan con archivos `Dockerfile` estructurados en múltiples etapas. La etapa de construcción (*builder*) compila el código TypeScript y genera los binarios (carpeta `dist`), mientras que la etapa de producción (*alpine*) empaqueta únicamente los archivos necesarios para la ejecución, reduciendo drásticamente la superficie de ataque y el peso final de las imágenes.

### Manifiestos de Kubernetes

Se implementaron recursos nativos como:

* **Deployments** para el manejo de los Pods.
* **Services (NodePort)** para la exposición del tráfico web hacia el exterior.

---

## 3. Integración y Despliegue Continuo (CI/CD) - Pilar 3

Se ha implementado un pipeline de integración y entrega continua utilizando **GitHub Actions**, automatizando el proceso desde el repositorio hasta el registro de contenedores.

### Validación y Construcción

Ante cada actualización en las ramas principales, los flujos de trabajo instalan dependencias y compilan los proyectos de Angular y NestJS.

### Inyección de Entorno en Tiempo de Construcción

Para el frontend, la URL de la API de producción (`API_URL_PROD`) se inyecta dinámicamente mediante el pipeline utilizando secretos del repositorio, eliminando la necesidad de exponer rutas en los archivos `environment.ts` del código fuente.

### Registro de Imágenes

Una vez superadas las pruebas de construcción, las imágenes son etiquetadas y enviadas automáticamente (*push*) a Docker Hub, listas para ser descargadas por el orquestador en la instancia EC2.

---

## 4. Seguridad, Cifrado y Manejo de Secretos (Base Obligatoria)

El sistema cumple con las prácticas más estrictas de seguridad al desacoplar el 100 % de la información confidencial del código fuente.

### Almacenamiento Desacoplado

Ningún token, contraseña o cadena de conexión existe en los repositorios de control de versiones. El entorno local está protegido mediante un archivo `.env` registrado en el `.gitignore`.

### Secretos de Kubernetes

En el entorno de producción, las credenciales (como `JWT_SECRET` y `DATABASE_URL`) se inyectan a los contenedores en tiempo de ejecución mediante recursos **Secret** de Kubernetes, codificados en Base64.

### Conexión Cifrada a la Base de Datos

Las comunicaciones entre el Pod del backend y la base de datos están forzadas a utilizar encriptación TLS/SSL (mediante el parámetro `sslmode=no-verify`), mitigando el riesgo de interceptación de datos en la red de AWS.

---

## 5. Almacenamiento Administrado en la Nube

Para garantizar la integridad y persistencia de la información sin la fragilidad del estado interno en los Pods, se delegó la capa de datos a un servicio administrado.

### Amazon RDS para PostgreSQL

La base de datos opera como un servicio administrado en la nube. Esto elimina la complejidad de sincronizar volúmenes persistentes (*StatefulSets*) dentro del clúster de Kubernetes, ofreciendo una arquitectura **stateless** para el backend.

### Migraciones Automatizadas

Durante el arranque del Pod de NestJS, el cliente de Prisma ejecuta el comando:

```bash
prisma migrate deploy
```

Esto asegura que el esquema de la base de datos en RDS coincida exactamente con la última versión del código antes de aceptar tráfico.

---

## 6. Alta Disponibilidad y Autoescalado (HPA)

El clúster está configurado para responder elásticamente a picos de demanda simulada o real, manteniendo la disponibilidad del servicio.

### Horizontal Pod Autoscaler (HPA)

Se configuraron manifiestos de autoescalado para los despliegues del frontend y backend.

### Métricas de Consumo

El HPA monitorea constantemente el uso de CPU. Si el consumo de los recursos de un contenedor supera el **70 %** de su límite asignado (por ejemplo, durante la ejecución de migraciones complejas o un alto volumen de peticiones), Kubernetes instanciará réplicas adicionales, escalando desde **1 hasta un máximo de 3 Pods** para distribuir la carga de trabajo.

Una vez que el tráfico se estabiliza, las réplicas adicionales son eliminadas progresivamente, optimizando el consumo de recursos.

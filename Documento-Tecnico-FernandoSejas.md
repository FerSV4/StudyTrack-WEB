# Documento de Arquitectura y Despliegue Cloud

**Nombre:** Fernando Andres Sejas Colque
    
**Proyecto:** StudyTrack
**Materia:** Computación en la Nube (ISW-341)

---

# 1. Ficha Técnica del Proyecto Base

## Descripción del Software

**StudyTrack** es una plataforma digital centralizada para la gestión académica y productividad estudiantil. Permite a los usuarios organizar sus deberes, fechas de entrega y progreso académico mediante una interfaz interactiva y jerarquizada.

## Arquitectura de Software

Cliente-Servidor Multicapa Desacoplada (*Single Page Application* con API REST).

## Tecnologías Implementadas

### Frontend

* Angular 17
* TypeScript
### Backend

* NestJS
* Node.js
* TypeScript

### Acceso a Datos

* Prisma ORM

### Base de Datos Inicial (Local)

* PostgreSQL

## Modelo de Datos

Estructura relacional orientada al dominio académico.

### Entidades Principales

* **Users:** Gestión de identidad y credenciales.
* **Academic_Terms:** Árbol jerárquico de semestres.
* **Subjects:** Materias inscritas.
* **Tasks:** Deberes con atributos de fecha, estado y prioridad.

## Funcionalidad ABM/CRUD

El sistema cuenta con ABM completo para:

* Registro de usuarios.
* Autenticación mediante JWT.
* Creación de actividades.
* Lectura mediante filtros dinámicos (temporales y por estado).
* Actualización de detalles y estados.
* Eliminación de tareas.

---

# 2. Definición de Arquitectura de Red y Nube



## Descripción Lógica de la Infraestructura AWS

### Capa de Cómputo (EC2)

Una instancia de Amazon EC2 (Ubuntu t2.micro/t2.medium) alojada en la subred pública.

Funciones:

* Hospedar el nodo Kubernetes.
* Ejecutar K3s.
* Alojar los contenedores de la aplicación.

### Orquestador (K3s)

Dentro de la instancia EC2 se ejecuta un clúster K3s encargado de:

* Administrar los Pods del Frontend.
* Administrar los Pods del Backend.
* Gestionar el escalamiento horizontal mediante HPA.

### Capa de Persistencia (RDS)

Una instancia de Amazon RDS PostgreSQL opera como servicio administrado independiente para garantizar la persistencia de los datos.

## Direccionamiento y Flujo de Datos

### Acceso de Usuarios

El usuario accede desde Internet hacia la IP pública o dirección asignada a la instancia EC2 mediante el Internet Gateway.

### Flujo Web

```text
Usuario
   ↓
Internet Gateway
   ↓
EC2 (Puerto 30080 - NodePort)
   ↓
Frontend Pod (Angular + Nginx)
   ↓
Puerto interno 80
```

### Flujo API

```text
Frontend
   ↓
EC2 (Puerto 30000 - NodePort)
   ↓
Backend Pod (NestJS)
   ↓
Puerto interno 3000
```

### Flujo de Base de Datos

```text
Backend Pod
   ↓
TCP 5432 + TLS/SSL
   ↓
Amazon RDS PostgreSQL
```

---

# 3. Registro de Decisiones de Arquitectura (ADR)

Las siguientes decisiones arquitectónicas garantizan la viabilidad, escalabilidad y sostenibilidad económica del sistema.

## ADR-01: Uso de EC2 con K3s en lugar de Amazon EKS

### Contexto

Se requería una solución para la orquestación de contenedores.

### Decisión

Implementar K3s dentro de una instancia EC2 en lugar de utilizar Amazon EKS.

### Justificación

* Amazon EKS posee un costo base elevado.
* Excede rápidamente los créditos disponibles en AWS Learner Lab.
* K3s reduce significativamente el consumo de recursos.
* Permite demostrar competencias en Kubernetes con menor complejidad operativa.

---

## ADR-02: Base de Datos Administrada (RDS) vs. Contenedor Stateful

### Contexto

Necesidad de persistencia de datos.

### Decisión

Utilizar Amazon RDS PostgreSQL y mantener el clúster K3s completamente stateless.

### Justificación

* Evita administrar volúmenes persistentes dentro de Kubernetes.
* Facilita el escalamiento horizontal.
* Reduce el riesgo de corrupción o colisión de datos.
* Simplifica la operación del entorno.

---

## ADR-03: Inyección de Secretos y Variabilidad de IP en AWS Learner Lab

### Contexto

Las instancias EC2 cambian de IP pública cada vez que el laboratorio se reinicia.

### Decisión

* GitHub Secrets para configuración en tiempo de construcción (*Build Time*).
* Kubernetes Secrets para configuración en tiempo de ejecución (*Run Time*).

### Justificación

#### Frontend (Angular)

La URL de la API se compila dentro de la aplicación.

Al cambiar la IP:

1. Se actualiza el GitHub Secret.
2. El pipeline CI/CD recompila la aplicación.
3. Se genera una nueva imagen Docker.

#### Backend (NestJS)

Las credenciales se inyectan dinámicamente desde Kubernetes:

* JWT_SECRET
* DATABASE_URL


---

# 4. Guía de Despliegue (Runbook)

## Paso 1: Aprovisionamiento de Infraestructura AWS

### Crear la Base de Datos

* Crear una instancia Amazon RDS PostgreSQL.
* Utilizar la capa gratuita.

### Crear la Instancia EC2

* Sistema operativo Ubuntu.
* Configurar Security Group.

### Reglas de Entrada Requeridas

| Puerto | Protocolo | Propósito    |
| ------ | --------- | ------------ |
| 22     | TCP       | SSH          |
| 30000  | TCP       | Backend API  |
| 30080  | TCP       | Frontend Web |

Origen:

```text
0.0.0.0/0
```

---

## Paso 2: Configuración del Motor de Orquestación

Conectarse mediante SSH:

```bash
ssh ubuntu@<IP_EC2>
```

Instalar K3s:

```bash
curl -sfL https://get.k3s.io | sh -
```

---

## Paso 3: Configuración de CI/CD (GitHub)

Navegar a:

```text
Settings > Secrets and variables > Actions
```

Agregar:

* Credenciales Docker Hub.
* API_URL_PROD

Ejemplo:

```text
http://<IP_EC2>:30000/api
```

Ejecutar los workflows de GitHub Actions para:

1. Construir imágenes.
2. Publicarlas en Docker Hub.

---

## Paso 4: Aplicación de Manifiestos Kubernetes

### Clonar el Repositorio

```bash
git clone <repositorio>
```

### Configurar Secretos

Editar:

```text
01-secrets.yaml
```

Aplicar:

```bash
sudo k3s kubectl apply -f 01-secrets.yaml
```

### Aplicar ConfigMaps

```bash
sudo k3s kubectl apply -f configmap.yaml
```

### Desplegar Backend

```bash
sudo k3s kubectl apply -f 03-backend.yaml
```

### Desplegar Frontend

```bash
sudo k3s kubectl apply -f frontend.yaml
```

### Activar HPA

```bash
sudo k3s kubectl apply -f hpa.yaml
```

---

## Paso 5: Validación

Verificar Pods:

```bash
sudo k3s kubectl get pods
```

Acceder desde el navegador:

```text
http://<IP_EC2>:30080
```

---

# 5. Reporte de Consumo y Costos

La arquitectura fue diseñada para mantenerse dentro de los límites del AWS Learner Lab y de la capa gratuita de AWS.

## Cómputo (Amazon EC2)

### Recursos

* 1 instancia t2.micro o t3.micro.

### Consumo Estimado

* 730 horas/mes.

### Costo Estimado

```text
$0.00 USD
```

Cubierto por las 750 horas mensuales de la capa gratuita.

---

## Persistencia (Amazon RDS)

### Recursos

* 1 instancia db.t3.micro.
* Single-AZ.
* 20 GB SSD gp2.

### Consumo Estimado

* 730 horas/mes.

### Costo Estimado

```text
$0.00 USD
```

Cubierto por:

* 750 horas mensuales.
* 20 GB de almacenamiento gratuito.

---

## Tráfico de Red e IPs Públicas

### Estrategia

Uso de IPs públicas dinámicas para evitar costos asociados a Elastic IPs.

### Consumo Estimado

* Menos de 100 GB mensuales de tráfico saliente.

### Costo Estimado

```text
$0.00 USD
```

---

## Orquestación y CI/CD

### K3s

* Open Source.
* Sin costo de licencia.

### Docker Hub

* Free Tier.

### GitHub Actions

Incluye:

```text
2,000 minutos gratuitos por mes
```

Suficientes para múltiples despliegues diarios.

---

# Conclusión de Costos

El costo operativo mensual proyectado es:

```text
$0.00 USD
```

durante el período de elegibilidad de la capa gratuita de AWS.

## Escenario Comercial

Una vez finalizada la capa gratuita:

| Servicio | Costo Aproximado |
| -------- | ---------------- |
| EC2      | ~$10 USD         |
| RDS      | ~$15–20 USD      |

### Total Estimado

```text
$25 - $30 USD por mes
```


# StudyTrack WEB

Plataforma web diseñada para optimizar la organización académica, permitiendo a los estudiantes centralizar y gestionar sus tareas, materias y fechas de entrega de manera eficiente.

## Características Principales

* **Autenticación y Seguridad:** Sistema de registro y login gestionado con Supabase Auth, complementado con protección de rutas (Guards) en el frontend.
* **Gestión de Estado Reactivo:** Uso de `BehaviorSubjects` y RxJS como única fuente de verdad (Single Source of Truth) para sincronizar la UI instantáneamente sin recargar la página.
* **Agenda Dinámica (CRUD):** Creación, edición, eliminación y filtrado de tareas en memoria cliente, con ordenamiento cronológico automático.
* **Dashboard de Productividad:** Panel de métricas en tiempo real y calendario semanal interactivo.
* **Resiliencia y Manejo de Errores:** Implementación de *Graceful Degradation* con detección de red (`navigator.onLine`) y un sistema de notificaciones globales (Toasts) para errores de API.
* **Responsive Web Design:** Interfaz construida con CSS Grid y Flexbox nativo, adaptable a cualquier dispositivo móvil o de escritorio sin librerías de UI externas.

## Stack Tecnológico

* **Frontend:** Angular (Standalone Components), TypeScript, RxJS, HTML5, CSS3.
* **Backend (BaaS):** Supabase (PostgreSQL, GoTrue).


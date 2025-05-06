# 🎮 GAMEBLOG

## 👥 Integrantes
 
- **Juan Guillermo López Cortés**
- **Luis Alejandro Téllez Forero** 
- **Sergio Tovar Perdigón**

---

## 🌐 Sitio Web

Puedes visitar la aplicación desplegada aquí:  
🔗 [https://blog-nine-eta-12.vercel.app](https://blog-nine-eta-12.vercel.app)


## 🛠️ Tecnologías Usadas

### 💻 IDE

- **WebStorm**

### ⚙️ Frameworks

- **Django** (Backend con MongoDB)  
- **React + TypeScript (Vite)** (Frontend)

### 📚 Librerías

#### ✍️ Editor de Markdown

- `@uiw/react-md-editor`

#### 🖼️ Manejo de Imágenes

- `react-dropzone` → para subir imágenes mediante *drag-and-drop*.  
- `axios` → para enviar imágenes al backend.  
- `react-image-preview` o `FileReader` + `useState` → para mostrar vista previa de imágenes antes de enviarlas.
- `flowbite-react` → para utilizar componentes prebuildeados de flowbite como Spinners o Alertas.
---

## ❓ ¿Para qué sirve?

**GAMEBLOG** es una plataforma digital centrada en el mundo de los videojuegos. Los usuarios pueden leer artículos segmentados por autores y etiquetas, compartir contenido, y aprender sobre sus títulos favoritos. La plataforma fomenta la participación de la comunidad, con funcionalidades adaptadas según el rol del usuario.

---

## 👤 Funcionalidades para Usuarios

- 📖 **Lectura de artículos**, filtrables por etiquetas y autores.  
- ✍️ **Solicitud para ser escritor**.  
- 📝 **Creación de artículos (sólo para escritores y administradores)**:  
  - Se guardan automáticamente como **borrador**.
  - El artículo solo se publica si el usuario **envía una solicitud** y esta es **aprobada por un administrador**.
  - Los usuarios pueden **editar sus borradores** antes de enviarlos.
  - Las **actualizaciones** también se manejan como borradores hasta ser enviadas.
- 🔁 Si un artículo enviado es **rechazado**, vuelve a estado de **borrador** para poder ser editado y reenviado.
- ✅ Si un artículo enviado es **aprobado**, se hace la respectiva actualización o creación del artículo, dependiendo de su tipo.

---

## 🔧 Funcionalidades para Administradores

- ✅ **Aprobación o rechazo** de solicitudes de:
  - Nuevos escritores.
  - Publicación o actualización de artículos.
- 🕹️ Gestión activa de la comunidad y contenido publicado.

---

## 🧭 Metodología de Desarrollo

### 🔄 Cascada (Waterfall)

- Proceso **secuencial**:  
  `Análisis` → `Diseño` → `Desarrollo` → `Pruebas` → `Entrega`
- Ideal para proyectos con requisitos claros desde el inicio.  
- Fácil de gestionar, aunque menos flexible ante cambios.

---

## 🎯 Objetivos del Proyecto

### ✅ Objetivo General

- **Crear un blog interactivo y actualizado sobre videojuegos**, donde los usuarios puedan informarse, comentar y compartir contenido relacionado con el mundo del gaming.

### 🎯 Objetivos Específicos

- Publicar **contenido original** (noticias, reseñas, avances) sobre videojuegos actuales y clásicos.  
- Implementar un **sistema de registro e inicio de sesión**, con distintos roles:  
  - **Lector**  
  - **Escritor (previa aprobación)**  
  - **Administrador (previa aprobación)**

---

## 🚀 Estado Actual

- Backend funcional con **Django + MongoDB**.  
- Frontend construido con **React 19 + Vite + TypeScript**.  

---

## 📌 Notas Finales

- Este proyecto está pensado para fomentar la creatividad, la crítica constructiva y el gusto por los videojuegos.
- La gestión de artículos garantiza calidad y evita contenido no deseado gracias a la moderación de los administradores.

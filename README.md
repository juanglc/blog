
# 🎮 GAMEBLOG

## 👥 Integrantes

- **Luis Alejandro Téllez Forero**  
- **Juan Guillermo López Cortés**  
- **Sergio Tovar Perdigón**  

---

## 🛠️ Tecnologías Usadas

### 💻 IDE

- **WebStorm**

### ⚙️ Frameworks

- **Django** (Backend)  
- **React** (Frontend)

### 📚 Librerías

#### ✍️ Markdown Editor

- `@uiw/react-md-editor`

#### 🖼️ Imágenes

- `react-dropzone` → para subir imágenes mediante *drag-and-drop*.  
- `axios` → para enviar imágenes al backend.  
- `react-image-preview` o `FileReader` + `useState` → para mostrar vista previa de la imagen antes de enviarla.

---

## ❓ ¿Para qué sirve?

**GAMEBLOG** es un blog dedicado a los videojuegos, donde los usuarios pueden compartir, leer y aprender de artículos sobre sus títulos favoritos. Los administradores se encargan del mantenimiento de la plataforma, promoviendo una comunidad activa donde se comparten anécdotas, experiencias y gustos por los juegos más emblemáticos.

---

## 🧭 Metodología de Desarrollo

### 🔄 Cascada (Waterfall)

- Proceso **secuencial**:  
  `Análisis` → `Diseño` → `Desarrollo` → `Pruebas` → `Entrega`
- Fácil de gestionar, pero **rígida** y poco flexible ante cambios.

---

## 🎯 Objetivos del Proyecto

### ✅ Objetivo General

- **Crear un blog interactivo y actualizado sobre videojuegos**, donde los usuarios puedan informarse, comentar y compartir contenido relacionado con el mundo del gaming.

### 🎯 Objetivos Específicos

- Publicar **contenido original** (noticias, reseñas, avances) sobre videojuegos actuales y clásicos.  
- Implementar un **sistema de registro e inicio de sesión seguro**, con diferentes roles: **lector**, **escritor** y **administrador**.

---

## 🗃️ Base de Datos (Estructura)

### 👤 Usuarios

```json
{
  "_id": "u123",
  "nombre": "Pedro Pérez",
  "correo": "pedro@email.com",
  "contraseña": "hashed_password", 
  "rol": "lector" // Roles posibles: lector, escritor, admin
}
```

### 📝 Artículos

```json
{
  "_id": "a001",
  "titulo": "Top 10 RPG del año",
  "contenido_markdown": "### Lista de RPGs\n1. Final Fantasy...",
  "imagen_url": "/uploads/articulo1.jpg",
  "tags": ["t001", "t002"],
  "autor_id": "u123",
  "fecha_creacion": "2025-04-08T14:33:00Z"
}
```

### 🔖 Tags

```json
{
  "_id": "t001",
  "nombre": "RPG",
  "descripcion": "Videojuegos de rol"
}
```

### ❤️ Favoritos

```json
{
  "_id": "u123", 
  "tags": ["t001", "t002", "t003"]
}
```

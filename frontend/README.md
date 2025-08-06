# Frontend - Gestión de Clínica Distribuida

## 📋 Descripción

Interfaz React para el sistema de gestión de clínica distribuida. Proporciona una GUI sencilla para probar operaciones de fragmentación y replicación de datos en bases de datos distribuidas.

## 🚀 Funcionalidades

- **Fragmentación de Datos**: Interfaz para fragmentación horizontal y vertical
- **Replicación de Datos**: Configuración de estrategias de replicación (bidireccional, unidireccional, maestro-esclavo)
- **Panel de Resultados**: Visualización de respuestas del backend en tiempo real
- **Interfaz Responsiva**: Diseño moderno con Tailwind CSS

## 🛠️ Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Herramienta de build y desarrollo
- **Tailwind CSS** - Framework de estilos
- **Axios** - Cliente HTTP (listo para usar)

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

## 🔌 Conexión con Backend

### Estado Actual
El frontend está **completamente listo** para conectar con el backend, pero las llamadas API están comentadas para evitar errores de conexión.

### Pasos para Activar la Conexión

1. **Iniciar el Backend**
   ```bash
   cd ../backend
   npm start
   ```
   El servidor debe estar ejecutándose en `http://localhost:3001`

2. **Descomentar las Llamadas API**
   
   En `src/App.jsx`, localiza y descomenta estas secciones:

   **Para Fragmentación:**
   ```javascript
   // const response = await fetch('http://localhost:3001/fragment', {
   //   method: 'POST',
   //   headers: {
   //     'Content-Type': 'application/json',
   //   },
   //   body: JSON.stringify({
   //     type: type,
   //     ...parsedParams
   //   })
   // });
   // const result = await response.json();
   ```

   **Para Replicación:**
   ```javascript
   // const response = await fetch('http://localhost:3001/replicate', {
   //   method: 'POST',
   //   headers: {
   //     'Content-Type': 'application/json',
   //   },
   //   body: JSON.stringify({
   //     strategy: strategy,
   //     ...parsedParams
   //   })
   // });
   // const result = await response.json();
   ```

3. **Modificar el manejo de respuestas**
   
   Reemplaza los placeholders con la respuesta real:
   ```javascript
   onResult({
     operation: 'Fragmentación', // o 'Replicación'
     success: true,
     data: result, // Datos del backend
     timestamp: new Date().toLocaleString()
   });
   ```

## 🔗 Endpoints del Backend

| Endpoint | Método | Descripción | Payload |
|----------|--------|-------------|---------|
| `/fragment` | POST | Fragmentación de datos | `{type: 'horizontal/vertical', condition: '...', table: '...'}` |
| `/replicate` | POST | Replicación de datos | `{strategy: 'bidirectional/unidirectional', nodes: [...], tables: [...]}` |

## 📋 Ejemplos de Uso

### Fragmentación Horizontal
```json
{
  "condition": "id > 100",
  "table": "pacientes"
}
```

### Fragmentación Vertical
```json
{
  "columns": ["nombre", "apellido", "email"],
  "table": "pacientes"
}
```

### Replicación Bidireccional
```json
{
  "nodes": ["quito", "guayaquil"],
  "tables": ["pacientes", "medicamentos"]
}
```

## 🎯 Estructura del Proyecto

```
frontend/
├── src/
│   ├── App.jsx          # Componente principal con formularios
│   ├── main.jsx         # Punto de entrada de React
│   └── index.css        # Estilos base con Tailwind
├── public/              # Archivos estáticos
├── package.json         # Dependencias y scripts
├── vite.config.js       # Configuración de Vite
├── tailwind.config.js   # Configuración de Tailwind
└── postcss.config.cjs   # Configuración de PostCSS
```

## 🔧 Configuración

### Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
REACT_APP_API_URL=http://localhost:3001
```

### Scripts Disponibles
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter ESLint
```

## 🐛 Troubleshooting

### Error de Conexión con el Backend
- Verifica que el backend esté ejecutándose en el puerto 3001
- Asegúrate de descomentar las llamadas API en App.jsx
- Revisa la consola del navegador para errores CORS

### Problemas de Styling
- Verifica que Tailwind esté correctamente configurado
- Ejecuta `npm run build` para regenerar estilos

### Errores de JSON
- Valida que el JSON en los formularios esté bien formateado
- Usa herramientas online para validar sintaxis JSON

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador para errores
2. Verifica que el backend esté respondiendo correctamente
3. Asegúrate de que las llamadas API estén descomentadas
4. Confirma que los endpoints del backend coincidan con los del frontend

---

**Estado**: ✅ Frontend listo para producción - Requiere activación de conexión API

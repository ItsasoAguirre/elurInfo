# Sistema de Internacionalización - ElurInfo

## Idiomas Soportados

La aplicación ahora soporta los siguientes idiomas:

- 🇪🇸 **Español (es)** - Idioma por defecto
- 🇬🇧 **English (en)** - Inglés
- 🇫🇷 **Français (fr)** - Francés  
- 🏴󠁥󠁳󠁣󠁴󠁿 **Català (ca)** - Catalán
- 🏴󠁥󠁳󠁰󠁶󠁿 **Euskera (eu)** - Euskera/Vasco

## Características Implementadas

### 🔄 Detección Automática
- Detecta automáticamente el idioma del navegador al primer acceso
- Si el idioma del navegador no está soportado, usa español por defecto

### 💾 Persistencia
- La preferencia de idioma se guarda en localStorage
- Se mantiene la selección entre sesiones del navegador

### 🎛️ Selector de Idioma
- Selector de idioma disponible en la página de Ajustes
- Cambio instantáneo sin necesidad de recargar la página
- Interfaz con banderas y nombres de idiomas

### 🌐 Traducción Completa
- Navegación (tabs): Mapa, Estaciones, Ajustes
- Página de Mapa: título, subtítulo, leyenda de riesgos
- Página de Estaciones: estados de carga, errores, contenido
- Página de Ajustes: todas las opciones y configuraciones
- Mensajes de estado: offline, loading, error, etc.

## Estructura de Archivos

```
src/
├── locales/
│   ├── index.ts          # Configuración central y exportaciones
│   ├── es.json          # Traducciones en español
│   ├── en.json          # Traducciones en inglés
│   ├── fr.json          # Traducciones en francés
│   ├── ca.json          # Traducciones en catalán
│   └── eu.json          # Traducciones en euskera
├── composables/
│   └── useLanguage.ts   # Composable para manejo de idiomas
└── main.ts              # Configuración de Vue i18n
```

## Uso del Sistema

### En Componentes Vue

```vue
<script setup>
import { useLanguage } from '@/composables/useLanguage'

const { t, currentLanguage, setLanguage } = useLanguage()
</script>

<template>
  <h1>{{ t('settings.title') }}</h1>
  <p>{{ t('settings.subtitle') }}</p>
</template>
```

### Cambiar Idioma Programáticamente

```typescript
import { useLanguage } from '@/composables/useLanguage'

const { setLanguage } = useLanguage()

// Cambiar a inglés
setLanguage('en')

// Cambiar a catalán
setLanguage('ca')
```

### Formateo de Fechas Localizadas

```typescript
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const locale = currentLanguage.value === 'ca' ? 'ca-ES' : 
                currentLanguage.value === 'eu' ? 'eu-ES' :
                currentLanguage.value === 'en' ? 'en-GB' :
                currentLanguage.value === 'fr' ? 'fr-FR' : 'es-ES'
  
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}
```

## Añadir Nuevas Traducciones

### 1. Añadir la Clave en los Archivos JSON

En cada archivo de idioma (`es.json`, `en.json`, etc.), añadir la nueva clave:

```json
{
  "newSection": {
    "title": "Nuevo Título",
    "description": "Nueva descripción"
  }
}
```

### 2. Usar en el Componente

```vue
<template>
  <h2>{{ t('newSection.title') }}</h2>
  <p>{{ t('newSection.description') }}</p>
</template>
```

## Configuración Técnica

### Vue i18n v9
- Modo Composition API (legacy: false)
- Idioma de fallback: español (es)
- Detección automática del idioma del navegador
- Persistencia en localStorage

### Configuración en main.ts

```typescript
const i18n = createI18n({
  legacy: false,
  locale: defaultLanguage,
  fallbackLocale: 'es',
  messages
})
```

## Mejoras Futuras

- [ ] Añadir más idiomas (portugués, italiano, alemán)
- [ ] Localización de números y monedas
- [ ] Pluralización avanzada
- [ ] Traducción dinámica de contenido del backend
- [ ] Detección de dirección de texto (RTL/LTR)

## Notas de Desarrollo

- El backend mantiene los mensajes en español por ahora (para el MVP)
- Los datos de las APIs (AEMET) se muestran en el idioma original
- Las fechas y horas se formatean según el idioma seleccionado
- El documento HTML se actualiza con el atributo `lang` correcto
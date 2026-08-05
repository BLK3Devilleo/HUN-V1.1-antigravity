Añadidos en UI para crear lógica en backend

# 📌 Especificación de Lógica Backend: Programación y Cola de Variaciones

Este documento define la estructura de datos, parámetros y reglas de negocio enviadas desde el Frontend en Next.js hacia las Server Actions y Webhooks del Backend (`publishPostAction` / n8n Webhook / Supabase queue).

---

## 1. Regla de Programación "Mismo Día para Este Proyecto"
Cuando el usuario activa la casilla **"Mismo día para este proyecto"** en el selector de hora del calendario:
- **Misma Fecha (`scheduledDate`):** Todos los bloques de variación del proyecto heredan la misma fecha base.
- **Intervalo Mínimo de 2 Minutos (`+2 min gap`):** El sistema garantiza que cada variación del proyecto mantenga al menos 2 minutos de diferencia con respecto al bloque anterior.
  - *Bloque #1:* `HH:MM` (ej. 14:00)
  - *Bloque #2:* `HH:MM + 2 min` (ej. 14:02)
  - *Bloque #n:* `HH:MM + (n-1)*2 min` (ej. 14:04)

Esto asegura que los microservicios y webhooks (n8n / Meta API / TikTok API) dispongan del tiempo necesario para procesar y renderizar los archivos multimedia sin colisiones.

---

## 2. Flujo de Confirmación y Cola Secuencial ("Faltan bloques por programar")
Si **no** se selecciona la opción "Mismo día para este proyecto" y existen bloques sin fecha programada individual:
- El Frontend muestra el aviso flotante naranja del sistema: *"Faltan bloques por programar, continuar los subirá en fila ahora. ¿Continuar?"*.
- Al hacer clic en **Continuar**, las variaciones no programadas se envían con prioridad de cola en fila (despacho secuencial inmediato).

---

## 3. Payload Estructurado enviado desde el Frontend
```json
{
  "projectId": "proj-12345",
  "title": "Campaña Ecológica",
  "sameDayScheduled": true,
  "baseScheduledDate": "2026-08-15",
  "baseScheduledTime": "14:00",
  "blocks": [
    {
      "id": "var-1",
      "number": 1,
      "caption": "Texto variación 1",
      "platforms": ["facebook", "instagram"],
      "mediaUrls": ["https://.../img1.jpg"],
      "scheduledTimestamp": "2026-08-15T14:00:00Z"
    },
    {
      "id": "var-2",
      "number": 2,
      "caption": "Texto variación 2",
      "platforms": ["facebook", "x"],
      "mediaUrls": ["https://.../video1.mp4"],
      "scheduledTimestamp": "2026-08-15T14:02:00Z"
    }
  ]
}
```

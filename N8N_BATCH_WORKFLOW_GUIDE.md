# Guía de Actualización de Workflows N8N - Sistema de Batches

## Cambios en los Parámetros Enviados

El backend ahora envía los siguientes parámetros a N8N para las campañas de email:

### Para Campañas CSV
```json
{
  "campaignId": "uuid-campaign",
  "nombre": "Nombre Campaña",
  "batchSize": 10,           // Nuevo: 10 emails por batch
  "batchIntervalMinutes": 2, // Nuevo: 2 minutos entre cada email
  "pauseHours": 1,           // Nuevo: 1 hora de pausa después de 10 emails
  "contacts": [
    {
      "uuid": "contact-uuid",
      "nombre": "Nombre",
      "email": "email@example.com",  // SOLO EMAIL (sin celular)
      "isValid": true,
      "status": "PENDING"
    }
  ]
}
```

### Para Envíos Manuales
```json
{
  "campaignId": "MANUAL",
  "nombre": "Envío Manual - Nombre",
  "batchSize": 1,
  "batchIntervalMinutes": 0,
  "pauseHours": 0,
  "contacts": [
    {
      "nombre": "Nombre",
      "email": "email@example.com",  // SOLO EMAIL
      "isValid": true,
      "status": "PENDING"
    }
  ],
  "mensajePersonalizado": "mensaje opcional"
}
```

## Lógica de Envío que Debe Implementar N8N

### Algoritmo de Batches
```
Para cada campaña CSV:
  1. Tomar contactos de a 10 (batchSize)
  2. Para cada contacto en el batch:
     a. Enviar email
     b. Esperar 2 minutos (batchIntervalMinutes)
     c. Registrar resultado via POST /api/campaigns/{campaignId}/log
  3. Después de completar 10 emails:
     a. Esperar 1 hora (pauseHours)
     b. Luego continuar con los próximos 10
  4. Repetir hasta procesar todos los contactos
```

### Pasos Recomendados en N8N

1. **Webhook Trigger**: Recibir el payload con campaignId y contacts
   
2. **Loop de Batches**: 
   - Usar un nodo Schedule para crear batches de 10
   - Implementar delay de 2 minutos entre emails
   
3. **Envío de Emails**:
   - Solo procesar campo `email`
   - No procesar celular (ya fue eliminado)
   - Usar un servicio de email (SendGrid, Gmail, etc.)
   
4. **Logging**:
   - Después de cada email enviado, hacer POST a:
   ```
   POST /api/campaigns/{campaignId}/log
   Body: {
     "contactId": "uuid-contact",
     "messageIndex": 1,
     "channel": "EMAIL",
     "status": "SUCCESS" | "FAILED",
     "message": "descripción del resultado"
   }
   ```

5. **Pausa de 1 Hora**:
   - Después de completar 10 emails, pausar por 1 hora
   - Luego continuar con los siguientes 10
   
6. **Manejo de Duplicados**:
   - El backend ya elimina duplicados
   - Solo procesar contactos únicos

## Cambios en CSV Input

### Formato Anterior (DEPRECATED)
```
nombre,celular,email
Juan,+5511999999999,juan@example.com
```

### Nuevo Formato (REQUIRED)
```
nombre,email
Juan,juan@example.com
Pedro,pedro@example.com
```

**IMPORTANTE**: El campo `celular` ya no es requerido ni debe ser procesado.

## Validaciones a Implementar en N8N

- [x] Email es obligatorio
- [x] Email debe ser válido (validación básica en backend)
- [x] No enviar a emails duplicados (backend lo valida)
- [ ] Implementar reintentos si falla el envío
- [ ] Manejar tasa de límite de emails (rate limiting)

## Ejemplo de Implementación Simplificada

```javascript
// Pseudo-código para N8N
async function processCampaign(campaignId, contacts, batchSize, batchIntervalMinutes, pauseHours) {
  let emailCount = 0;
  
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    
    for (const contact of batch) {
      // Enviar email
      const result = await sendEmail(contact.email, message);
      
      // Registrar resultado
      await logEvent(campaignId, contact.uuid, result.status, result.message);
      
      emailCount++;
      
      // Esperar intervalo entre emails
      await sleep(batchIntervalMinutes * 60 * 1000);
    }
    
    // Después de batchSize emails, pausar
    if (i + batchSize < contacts.length) {
      console.log(`Pausa de ${pauseHours} hora(s) después de ${emailCount} emails...`);
      await sleep(pauseHours * 60 * 60 * 1000);
    }
  }
}
```

## Testing

Prueba con un CSV pequeño:
```
nombre,email
Test 1,test1@example.com
Test 2,test2@example.com
Test 3,test3@example.com
```

Verifica que:
1. Se reciben los 3 contactos en N8N
2. Se envían 3 emails (batchSize 10 > 3 contactos = sin pausa)
3. Los logs se registran correctamente en la API

## Rollback (si es necesario)

Si necesitas revertir a la versión anterior:
```bash
npx prisma migrate resolve --rolled-back 20260525130216_remove_celular_add_email_only
```

Luego restaurar el schema.prisma anterior con celular y recrear la migración.

---

**Última actualización**: 25 de mayo de 2026
**Version**: 2.0 (Solo Emails, Sistema de Batches)

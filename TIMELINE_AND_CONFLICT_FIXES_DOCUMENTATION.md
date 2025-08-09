# Timeline Продължителности и Conflict Detection - Фиксове

## 📅 Дата: 2025-08-05
## 🎯 Статус: РЕШЕНО ✅

---

## 🚨 Проблеми

### 1. Timeline продължителности показват винаги 30 минути
**Симптоми:** Всички резервации в timeline заемаха 30 минути по default, независимо от реалната продължителност на услугата.

### 2. "Зает час" при редактиране на резервация
**Симптоми:** При редактиране на резервация (промяна на услуга), системата съобщава за конфликт с времето, дори когато не се променя часът.

---

## 🔍 Root Cause Analysis

### Проблем 1: Timeline API несъответствие
- **DailySchedule** компонентът използва `/api/admin/daily-schedule?date=X`
- **Calendar/Bookings** компонентът използва `/api/admin/bookings`
- **Различни SQL заявки** с различни проблеми:
  - `daily-schedule` имаше стария грешен `s.id::text` JOIN
  - PostgreSQL връщаше `serviceduration` (lowercase) вместо `serviceDuration` (camelCase)

### Проблем 2: Availability API липсващо ID поле
- **BookingForm** прави client-side conflict check към `/api/admin/bookings?date=X`
- **API не връщаше `id` поле** в `bookedSlots`
- **Exclude логиката** `bookedSlot.id === booking.id` никога не работеше (undefined === number)
- **Текущата резервация** винаги се считаше за конфликт

---

## 🛠️ Решения

### Fix 1: Daily Schedule API
**Файл:** `src/app/api/admin/daily-schedule/route.ts`

```sql
-- ПРЕДИ (ГРЕШНО):
LEFT JOIN services s ON b.service = s.id::text

-- СЛЕД (ПРАВИЛНО):
LEFT JOIN services s ON b.service::integer = s.id
```

**Mapping добавен:**
```javascript
const mappedBookings = bookings.rows.map(booking => {
  const { serviceduration, ...rest } = booking
  return {
    ...rest,
    serviceDuration: serviceduration || booking.serviceDuration || 30
  }
})
```

### Fix 2: Bookings API Mapping
**Файл:** `src/app/api/admin/bookings/route.ts`

**GET заявка (за календар):**
```javascript
const mappedBookings = result.rows.map(booking => {
  const { serviceduration, ...rest } = booking
  return {
    ...rest,
    serviceDuration: serviceduration || booking.serviceDuration || 30
  }
})
```

### Fix 3: Availability API ID поле
**Файл:** `src/app/api/admin/bookings/route.ts`

```sql
-- ПРЕДИ:
SELECT b.time, COALESCE(b.serviceduration, s.duration, 30) as serviceDuration

-- СЛЕД:
SELECT b.id, b.time, COALESCE(b.serviceduration, s.duration, 30) as serviceDuration
```

**Mapping добавен:**
```javascript
const mappedBookedSlots = bookingsResult.rows.map(slot => {
  const { serviceduration, ...rest } = slot
  return {
    ...rest,
    serviceDuration: serviceduration || slot.serviceDuration || 30
  }
})
```

### Fix 4: Conflict Detection Type Safety
**Файл:** `src/app/api/admin/bookings/route.ts`

```javascript
// ПРЕДИ:
checkTimeSlotAvailability(db, date, time, service, serviceDuration, id)

// СЛЕД:
checkTimeSlotAvailability(db, date, time, parseInt(service), serviceDuration, parseInt(id))
```

---

## 🧪 Verification Tests

### Test 1: Timeline API
```bash
curl -H "x-admin-token: test" "http://localhost:3000/api/admin/daily-schedule?date=2025-08-05"
# Връща: serviceDuration: 60 (не 30)
```

### Test 2: Availability API  
```bash
curl -H "x-admin-token: test" "http://localhost:3000/api/admin/bookings?date=2025-08-04"
# Връща: {id: 14, time: "01:00", serviceDuration: 15}
```

### Test 3: Booking Edit
1. Отвори резервация за редактиране
2. Промени услугата (не часът)
3. Натисни "Запази"
4. ✅ Не показва "конфликт"

---

## 📝 Files Changed

### API Endpoints
- `src/app/api/admin/daily-schedule/route.ts` - Timeline данни
- `src/app/api/admin/bookings/route.ts` - Bookings CRUD + availability

### Frontend Components  
- `src/components/admin/BookingForm.tsx` - Debug логове добавени
- `src/components/admin/DailySchedule.tsx` - Без промени (работи със съществуващата логика)

---

## 🔬 Technical Details

### PostgreSQL Column Naming
- **Database:** колони са lowercase (`serviceduration`)
- **Frontend:** очаква camelCase (`serviceDuration`) 
- **Solution:** Mapping layer в API responses

### JOIN Corrections
- **Проблем:** `b.service = s.id::text` (TEXT = INTEGER)
- **Решение:** `b.service::integer = s.id` (INTEGER = INTEGER)

### Conflict Detection Logic
```javascript
// Exclude current booking from conflict check
if (booking?.id && bookedSlot.id === booking.id) {
  continue // Skip checking against itself
}
```

---

## 🚀 Result

✅ **Timeline показва правилните продължителности** (60 мин, 90 мин, etc.)  
✅ **Редактирането работи без грешни конфликти**  
✅ **API consistency** - всички endpoints връщат `serviceDuration` (camelCase)  
✅ **Type safety** - правилни INTEGER типове в SQL заявките

---

## 🔮 Future Improvements

1. **Database Schema Alignment** - Помисли за стандартизиране на column naming
2. **API Response Standardization** - Централизиран mapping layer
3. **Client-side Cache Invalidation** - Избегни frontend кеширане на стари данни
4. **Comprehensive Testing** - Unit tests за conflict detection логиката

---

## i18n бележка (2025-08-09)

- В момента част от backend съобщенията са на английски (напр. Users API). За да вижда потребителят съобщения на български без да пипаме бекенда, добавихме фронтенд преводен слой в `src/components/admin/UserForm.tsx` (`translateUserError`).
- Ако в бъдеще мигрираме към български съобщения в backend, този слой може да се премахне или да остане като fallback.

---

*Документирано от @virtual-doer - Август 2025*
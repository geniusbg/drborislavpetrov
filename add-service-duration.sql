-- Добавяне на serviceDuration колона към bookings таблицата
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS serviceDuration INTEGER DEFAULT 30;

-- Обновяване на съществуващите записи с serviceDuration според услугата
UPDATE bookings 
SET serviceDuration = s.duration 
FROM services s 
WHERE bookings.service = s.id AND bookings.serviceDuration IS NULL;

-- Проверка на резултата
SELECT b.id, b.name, b.service, s.name as serviceName, b.serviceDuration, s.duration as serviceDurationFromServices
FROM bookings b
LEFT JOIN services s ON b.service = s.id
LIMIT 10; 
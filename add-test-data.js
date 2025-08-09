// Add test bookings with treatment notes
console.log('📝 Adding test bookings with treatment notes...')
await db.query(`
  INSERT INTO bookings (name, email, phone, service, date, time, status, treatment_notes) 
  VALUES 
  ('Тест Пациент 1', 'test1@example.com', '+359888123456', 1, '2025-08-03', '10:00', 'confirmed', 'Първа сесия - пациентът се чувства добре'),
  ('Тест Пациент 2', 'test2@example.com', '+359888123457', 2, '2025-08-03', '11:00', 'pending', 'Втора сесия - нужни са допълнителни процедури'),
  ('Тест Пациент 3', 'test3@example.com', '+359888123458', 3, '2025-08-03', '12:00', 'confirmed', 'Трета сесия - лечение завършено успешно')
`)
console.log('✅ Added test bookings with treatment notes') 
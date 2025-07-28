import { z } from 'zod'

// Booking form validation schema
export const bookingSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа'),
  email: z.string().email('Невалиден имейл адрес').optional(),
  phone: z.string().min(10, 'Телефонният номер трябва да е поне 10 символа'),
  service: z.string().min(1, 'Моля изберете услуга'),
  date: z.string().min(1, 'Моля изберете дата'),
  time: z.string().min(1, 'Моля изберете час'),
  message: z.string().optional()
})

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа'),
  email: z.string().email('Невалиден имейл адрес'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Съобщението трябва да е поне 10 символа')
})

export type BookingFormData = z.infer<typeof bookingSchema>
export type ContactFormData = z.infer<typeof contactSchema>

// Validation functions
export const validateBooking = (data: unknown) => {
  return bookingSchema.safeParse(data)
}

export const validateContact = (data: unknown) => {
  return contactSchema.safeParse(data)
} 
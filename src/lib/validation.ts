import { z } from 'zod'

// Phone number validation function
const validatePhoneNumber = (phone: string) => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Check if it's a valid Bulgarian phone number
  // Bulgarian numbers: +359XXXXXXXXX or 0XXXXXXXXX
  if (digitsOnly.startsWith('359') && digitsOnly.length === 12) {
    return true // +359XXXXXXXXX format (12 digits including +)
  }
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return true // 0XXXXXXXXX format
  }
  
  return false
}

// Booking form validation schema (for public bookings - phone required)
export const bookingSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа'),
  email: z.string().email('Невалиден имейл адрес').optional(),
  phone: z.string()
    .min(10, 'Телефонният номер трябва да е поне 10 символа')
    .refine(validatePhoneNumber, 'Невалиден телефонен номер. Използвайте формат +359XXXXXXXXX или 0XXXXXXXXX'),
  service: z.string().min(1, 'Моля изберете услуга'),
  date: z.string().min(1, 'Моля изберете дата'),
  time: z.string().min(1, 'Моля изберете час'),
  message: z.string().optional()
})

// Admin booking form validation schema (phone optional)
export const adminBookingSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа'),
  email: z.string().email('Невалиден имейл адрес').optional(),
  phone: z.string()
    .optional()
    .refine((val) => !val || validatePhoneNumber(val), 'Невалиден телефонен номер. Използвайте формат +359XXXXXXXXX или 0XXXXXXXXX'),
  service: z.string().min(1, 'Моля изберете услуга'),
  date: z.string().min(1, 'Моля изберете дата'),
  time: z.string().min(1, 'Моля изберете час'),
  message: z.string().optional()
})

// Contact form validation schema
export const contactSchema = z.object({
  name: z.string().min(2, 'Името трябва да е поне 2 символа'),
  email: z.string().email('Невалиден имейл адрес'),
  phone: z.string()
    .optional()
    .refine((val) => !val || validatePhoneNumber(val), 'Невалиден телефонен номер. Използвайте формат +359XXXXXXXXX или 0XXXXXXXXX'),
  message: z.string().min(10, 'Съобщението трябва да е поне 10 символа')
})

export type BookingFormData = z.infer<typeof bookingSchema>
export type AdminBookingFormData = z.infer<typeof adminBookingSchema>
export type ContactFormData = z.infer<typeof contactSchema>

// Validation functions
export const validateBooking = (data: unknown) => {
  return bookingSchema.safeParse(data)
}

export const validateAdminBooking = (data: unknown) => {
  return adminBookingSchema.safeParse(data)
}

export const validateContact = (data: unknown) => {
  return contactSchema.safeParse(data)
} 
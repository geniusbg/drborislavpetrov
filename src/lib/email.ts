import nodemailer from 'nodemailer'
import { getDatabase } from './database'

interface EmailData {
  to: string
  subject: string
  html: string
}

// Create transporter (configure with your email service)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  })
}

export const sendEmail = async (data: EmailData): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'dr.petrov@example.com',
      to: data.to,
      subject: data.subject,
      html: data.html
    })
    
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export const sendBookingConfirmation = async (booking: {
  name: string
  email?: string
  phone: string
  service: string | number
  date: string
  time: string
  message?: string
}) => {
  if (!booking.email) return false

  // Get service name from database
  const db = await getDatabase()
  const service = await db.query('SELECT name FROM services WHERE id = $1', [booking.service])
  const serviceName = service.rows.length > 0 ? service.rows[0].name : 'Неизвестна услуга'
  db.release()

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0284c7;">Потвърждение на резервация</h2>
      <p>Уважаеми/а ${booking.name},</p>
      <p>Вашата резервация е приета успешно!</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                          <h3 style="margin-top: 0;">Детайли на резервацията:</h3>
                  <p><strong>Услуга:</strong> ${serviceName}</p>
        <p><strong>Дата:</strong> ${new Date(booking.date).toLocaleDateString('bg-BG')}</p>
        <p><strong>Час:</strong> ${booking.time}</p>
        <p><strong>Телефон:</strong> ${booking.phone}</p>
        ${booking.message ? `<p><strong>Допълнителна информация:</strong> ${booking.message}</p>` : ''}
      </div>
      
      <p>Ще се свържем с вас скоро за потвърждение на резервацията.</p>
      <p>С уважение,<br>Д-р Борислав Петров</p>
    </div>
  `

  return sendEmail({
    to: booking.email,
    subject: 'Потвърждение на резервация - Д-р Борислав Петров',
    html
  })
}

export const sendAdminNotification = async (booking: {
  name: string
  email?: string
  phone: string
  service: string | number
  date: string
  time: string
  message?: string
}) => {
  // Get service name from database
  const db = await getDatabase()
  const service = await db.query('SELECT name FROM services WHERE id = $1', [booking.service])
  const serviceName = service.rows.length > 0 ? service.rows[0].name : 'Неизвестна услуга'
  db.release()

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Нова резервация</h2>
      <p>Получена е нова резервация от уебсайта.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Детайли:</h3>
                    <p><strong>Име:</strong> ${booking.name}</p>
                    <p><strong>Телефон:</strong> ${booking.phone}</p>
                    ${booking.email ? `<p><strong>Имейл:</strong> ${booking.email}</p>` : ''}
                    <p><strong>Услуга:</strong> ${serviceName}</p>
                    <p><strong>Дата:</strong> ${new Date(booking.date).toLocaleDateString('bg-BG')}</p>
                    <p><strong>Час:</strong> ${booking.time}</p>
                    ${booking.message ? `<p><strong>Съобщение:</strong> ${booking.message}</p>` : ''}
      </div>
    </div>
  `

  return sendEmail({
    to: process.env.ADMIN_EMAIL || 'admin@example.com',
    subject: 'Нова резервация - Д-р Борислав Петров',
    html
  })
} 
'use client'

import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
import { validateContact, type ContactFormData } from '@/lib/validation'

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  // const [csrfToken, setCsrfToken] = useState('') // временно изключено

  // Generate CSRF token on component mount - временно изключено
  // useEffect(() => {
  //   const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
  //   setCsrfToken(token)
  // }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Client-side validation
    const validation = validateContact(formData)
    if (!validation.success) {
      const newErrors: Record<string, string> = {}
      validation.error.issues.forEach(issue => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message
        }
      })
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'x-csrf-token': csrfToken // временно изключено
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message)
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        })
      } else {
        setErrors({ submit: result.error })
      }
    } catch (error) {
      setErrors({ submit: 'Възникна грешка. Моля опитайте отново.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Адрес',
      content: 'ул. "Примерна" 123, София 1000',
      link: 'https://maps.google.com'
    },
    {
      icon: Phone,
      title: 'Телефон',
      content: '+359 888 123 456',
      link: 'tel:+359888123456'
    },
    {
      icon: Mail,
      title: 'Имейл',
      content: 'dr.petrov@example.com',
      link: 'mailto:dr.petrov@example.com'
    },
    {
      icon: Clock,
      title: 'Работно време',
      content: 'Понеделник - Петък: 9:00 - 18:00\nСъбота: 9:00 - 14:00',
      link: null
    }
  ]

  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
            Свържете се с нас
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Имате въпроси или искате да резервирате час? Не се колебайте да се свържете с нас.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8 animate-fade-in">
            <div className="grid sm:grid-cols-2 gap-6 animate-fade-in">
              {contactInfo.map((info, index) => (
                <div key={index} className="card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        {info.title}
                      </h3>
                      {info.link ? (
                        <a
                          href={info.link}
                          className="text-secondary-600 hover:text-primary-600 transition-colors"
                          target={info.link.startsWith('http') ? '_blank' : undefined}
                          rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-secondary-600 whitespace-pre-line">
                          {info.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Placeholder */}
            <div className="bg-secondary-100 rounded-xl p-8 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="w-16 h-16 bg-secondary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Нашата локация
              </h3>
              <p className="text-secondary-600 mb-4">
                Централно разположение с лесен достъп
              </p>
              <button className="btn-secondary">
                Отвори в Google Maps
              </button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card animate-slide-up">
            <h3 className="text-2xl font-semibold text-secondary-900 mb-6">
              Изпратете ни съобщение
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                    Име *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Вашето име"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                    Имейл *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
              
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+359 888 123 456"
                />
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-2">
                  Съобщение *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className={`input-field resize-none ${errors.message ? 'border-red-500' : ''}`}
                  placeholder="Напишете вашето съобщение..."
                />
                {errors.message && (
                  <p className="text-red-600 text-xs mt-1">{errors.message}</p>
                )}
              </div>

              {errors.submit && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  {errors.submit}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in"
                style={{ animationDelay: '0.5s' }}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Изпращане...' : 'Изпрати съобщение'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact 
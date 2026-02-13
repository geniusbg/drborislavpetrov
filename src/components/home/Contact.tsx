'use client'

import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, Smartphone } from 'lucide-react'
import { validateContact, type ContactFormData } from '@/lib/validation'
import { useAppMessage } from '@/contexts/AppMessageContext'

const Contact = () => {
  const { showMessage } = useAppMessage()
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
        showMessage({
          variant: 'success',
          title: 'Съобщението е изпратено',
          message: result.message ?? 'Ще ви отговорим възможно най-скоро.'
        })
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        })
      } else {
        showMessage({ variant: 'error', message: result.error ?? 'Неуспешно изпращане.' })
        setErrors({ submit: result.error })
      }
    } catch (error) {
      showMessage({ variant: 'error', message: 'Възникна грешка. Моля опитайте отново.' })
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

  const offices = [
    {
      title: 'Кабинет Здравец',
      address: 'ал. "Бели Брези" № 8, вх. 2, ет. 1',
      city: 'гр. Русе',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=ал.+Бели+Брези+8+Русе',
      wazeUrl: 'https://waze.com/ul?q=ал.+Бели+Брези+8,+Русе',
      embedUrl: 'https://www.google.com/maps?q=ал.+Бели+Брези+8,+Русе&output=embed'
    },
    {
      title: 'Кабинет КООП Пазар',
      address: 'ул. "Цар Асен II" № 32, вх. 1, ет. 2',
      city: 'гр. Русе',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Цар+Асен+32+Русе',
      wazeUrl: 'https://waze.com/ul?q=ул.+Цар+Асен+32,+Русе',
      embedUrl: 'https://www.google.com/maps?q=ул.+Цар+Асен+32,+Русе&output=embed'
    }
  ]

  const contactInfo = [
    {
      icon: Phone,
      title: 'Телефон',
      content: 'Мобилен: 0887 229 669\nСтационарен: 082 857 725',
      link: 'tel:+359887229669'
    },
    {
      icon: Mail,
      title: 'Имейл',
      content: 'bpg23@abv.bg',
      link: 'mailto:bpg23@abv.bg'
    },
    {
      icon: Clock,
      title: 'Работно време',
      content: 'Понеделник - Петък: 9:00 - 19:00\nСъбота: Затворено\nНеделя: Затворено',
      link: null
    }
  ]

  return (
    <section id="contact" className="section-padding bg-white overflow-x-hidden">
      <div className="container-custom max-w-full min-w-0">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
            Свържете се с нас
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Имате въпроси или искате да резервирате час? Не се колебайте да се свържете с нас.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 min-w-0">
          {/* Contact Information */}
          <div className="space-y-8 animate-fade-in min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in min-w-0">
              {offices.map((office, index) => (
                <div key={office.title} className="card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        {office.title}
                      </h3>
                      <p className="text-secondary-600 text-sm mb-2">
                        {office.address}
                        <br />
                        {office.city}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <a
                          href={office.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Google Maps →
                        </a>
                        <a
                          href={office.wazeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Waze →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {contactInfo.map((info, index) => (
                <div
                  key={info.title}
                  className={`card animate-fade-in ${info.title === 'Работно време' ? 'sm:col-span-2' : ''}`}
                  style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                        {info.title}
                      </h3>
                      {info.title === 'Телефон' ? (
                        <div className="space-y-2">
                          <a href="tel:+359887229669" className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors">
                            <Smartphone className="w-5 h-5 flex-shrink-0" />
                            <span>0887 229 669</span>
                          </a>
                          <a href="tel:+35982857725" className="flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors">
                            <Phone className="w-5 h-5 flex-shrink-0" />
                            <span>082 857 725</span>
                          </a>
                        </div>
                      ) : info.title === 'Работно време' ? (
                        <div className="rounded-lg bg-secondary-50/80 border border-secondary-100 overflow-hidden">
                          <div className="flex justify-between items-center py-3 px-4 gap-4 border-b border-secondary-100">
                            <span className="font-medium text-secondary-900 text-sm sm:text-base">Понеделник – Петък</span>
                            <span className="text-secondary-600 text-sm sm:text-base tabular-nums">9:00 – 19:00</span>
                          </div>
                          <div className="flex justify-between items-center py-3 px-4 gap-4 border-b border-secondary-100">
                            <span className="font-medium text-secondary-900 text-sm sm:text-base">Събота</span>
                            <span className="text-secondary-500 text-sm sm:text-base">Затворено</span>
                          </div>
                          <div className="flex justify-between items-center py-3 px-4 gap-4">
                            <span className="font-medium text-secondary-900 text-sm sm:text-base">Неделя</span>
                            <span className="text-secondary-500 text-sm sm:text-base">Затворено</span>
                          </div>
                        </div>
                      ) : info.link ? (
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
          </div>

          {/* Contact Form */}
          <div className="card animate-slide-up min-w-0 overflow-hidden">
            <h3 className="text-2xl font-semibold text-secondary-900 mb-6">
              Изпратете ни съобщение
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <div className="animate-fade-in min-w-0" style={{ animationDelay: '0.1s' }}>
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
                    className={`input-field w-full max-w-full box-border ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Вашето име"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                <div className="animate-fade-in min-w-0" style={{ animationDelay: '0.2s' }}>
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
                    className={`input-field w-full max-w-full box-border ${errors.email ? 'border-red-500' : ''}`}
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
                  className="input-field w-full max-w-full box-border"
                  placeholder="0887 229 669"
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
                  className={`input-field w-full max-w-full resize-none box-border ${errors.message ? 'border-red-500' : ''}`}
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

        {/* Нашите кабинети в Русе – пълна ширина, заглавие отгоре и текст отдолу */}
        <div className="mt-16 animate-fade-in">
          <h3 className="text-2xl font-semibold text-secondary-900 text-center flex items-center justify-center gap-2">
            <MapPin className="w-7 h-7 text-primary-600" />
            Нашите кабинети в Русе
          </h3>
          <p className="text-secondary-600 text-center mt-2 max-w-2xl mx-auto">
            Два удобно разположени кабинета за по-лесен достъп до вас.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-8 w-full min-w-0">
            {offices.map((office) => (
              <div key={office.title} className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full">
                <div className="p-4 sm:p-5 border-b border-secondary-100">
                  <h4 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    {office.title}
                  </h4>
                  <p className="text-secondary-600 text-sm mt-1">
                    {office.address}
                    <br />
                    {office.city}
                  </p>
                </div>
                <div className="relative w-full bg-secondary-100" style={{ minHeight: '280px' }}>
                  <div className="relative w-full h-0 pb-[75%] sm:pb-[60%] lg:pb-[55%]">
                    <iframe
                      title={`Карта – ${office.title}`}
                      src={office.embedUrl}
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex flex-wrap gap-2">
                  <a
                    href={office.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    Google Maps
                  </a>
                  <a
                    href={office.wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    Waze
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="text-secondary-600 text-center text-sm mt-6">
            Отворете в Google Maps или Waze за насоки до кабинета.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Contact 
import Link from 'next/link'
import { Calendar, Clock, MapPin, Phone } from 'lucide-react'

const Hero = () => {
  return (
    <section id="home" className="pt-20 lg:pt-24 bg-gradient-to-br from-primary-50 to-white overflow-x-hidden">
      <div className="container-custom section-padding max-w-full min-w-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-w-0">
          {/* Content */}
          <div className="space-y-8 animate-fade-in min-w-0">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-secondary-900 leading-tight">
                Професионална{' '}
                <span className="text-gradient">зъболекарска грижа</span>
              </h1>
              <p className="text-xl text-secondary-600 leading-relaxed">
                Д-р Борислав Петров предлага модерни зъболекарски услуги в приятна и спокойна среда. 
                Вашето здраве е наш приоритет.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span className="text-secondary-700">Онлайн резервации</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary-600" />
                <span className="text-secondary-700">Гъвкаво работно време</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-primary-600" />
                <span className="text-secondary-700">Два кабинета в Русе</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary-600" />
                <span className="text-secondary-700">24/7 поддръжка</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="#booking" className="btn-primary text-center">
                Резервирай час
              </Link>
              <Link href="#contact" className="btn-secondary text-center">
                Свържи се с нас
              </Link>
            </div>
          </div>

          {/* Image/Visual */}
          <div className="relative animate-slide-up min-w-0">
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl p-8 lg:p-12">
              <div className="aspect-square bg-white rounded-2xl shadow-custom flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-4xl">🦷</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900">
                    Модерна стоматология
                  </h3>
                  <p className="text-secondary-600">
                    Най-новите технологии за вашата усмивка
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-accent-100 rounded-full p-4 shadow-lg animate-bounce">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-4 shadow-lg animate-pulse">
              <span className="text-2xl">💙</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 
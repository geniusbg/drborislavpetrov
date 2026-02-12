import Link from 'next/link'
import { Heart, Phone, Mail, MapPin } from 'lucide-react'
import { getBulgariaTime } from '@/lib/bulgaria-time'

const Footer = () => {
  const currentYear = getBulgariaTime().getFullYear()

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Practice Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6 animate-fade-in">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">ДП</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Д-р Борислав Петров</h3>
                <p className="text-secondary-300">Зъболекар</p>
              </div>
            </div>
            <p className="text-secondary-300 mb-6 max-w-md">
              Предоставяме висококачествена зъболекарска грижа в приятна и спокойна среда. 
              Вашето здраве е наш приоритет.
            </p>
            <div className="flex space-x-4">
              <a href="tel:+359887229669" className="text-secondary-300 hover:text-white transition-colors" title="Мобилен: 0887 229 669">
                <Phone className="w-5 h-5" />
              </a>
              <a href="mailto:bpg23@abv.bg" className="text-secondary-300 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="https://www.google.com/maps/search/?api=1&query=ал.+Бели+Брези+8+Русе" target="_blank" rel="noopener noreferrer" className="text-secondary-300 hover:text-white transition-colors" title="Кабинет Здравец – ал. Бели Брези 8, Русе">
                <MapPin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Бързи връзки</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#home" className="text-secondary-300 hover:text-white transition-colors animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  Начало
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-secondary-300 hover:text-white transition-colors animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  За мен
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-secondary-300 hover:text-white transition-colors animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  Услуги
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-secondary-300 hover:text-white transition-colors animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  Контакти
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Услуги</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#services" className="text-secondary-300 hover:text-white transition-colors animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  Профилактика
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-secondary-300 hover:text-white transition-colors animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  Консервативно лечение
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-secondary-300 hover:text-white transition-colors animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  Хирургия и имплантология
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-secondary-300 hover:text-white transition-colors animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  Ортопедия
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-700 mt-8 pt-8">
                  <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-secondary-300 text-sm animate-fade-in">
            © {currentYear} Д-р Борислав Петров. Всички права запазени.
          </p>
          <div className="flex items-center space-x-2 text-secondary-300 text-sm mt-4 sm:mt-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <span>Създадено с</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>от</span>
            <a 
              href="https://www.gsoft.bg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-secondary-300 hover:text-white transition-colors"
            >
              GSoft.bg
            </a>
          </div>
        </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 
import { Shield, Heart, Star } from 'lucide-react'

const Services = () => {
  const services = [
    {
      icon: Shield,
      title: 'Профилактика',
      description: 'Регулярни прегледи и професионално почистване на зъбния камък',
      features: ['Обстоен дентален преглед', 'Почистване на зъбен камък и плака', 'Флуориране', 'Консултации']
    },
    {
      icon: Heart,
      title: 'Консервативно лечение',
      description: 'Консервативно лечение на зъбите с обтуриране и най-новите материали',
      features: ['Диагностика', 'Лечение', 'Обтуриране', 'Последващ контрол']
    },
    {
      icon: Star,
      title: 'Хирургия и имплантология',
      description: 'Хирургично отстраняване и имплантологично възстановяване на зъби',
      features: ['Обстоен преглед', 'Анализ', 'Лечение', 'Последващ контрол']
    },
    {
      icon: Shield,
      title: 'Ортопедия',
      description: 'Възстановяване на липсващи зъби по протетичен начин',
      features: ['Обстоен преглед', 'Ситуационен анализ', 'Лечение', 'Последващ контрол']
    }
  ]

  return (
    <section id="services" className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
            Нашите услуги
          </h2>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Предлагаме пълна гама от зъболекарски услуги с фокус върху качеството и комфорта на пациента
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 animate-fade-in">
          {services.map((service, index) => (
            <div key={index} className="card hover:shadow-xl transition-shadow duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <service.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2 animate-fade-in" style={{ animationDelay: `${(index * 0.1) + (featureIndex * 0.05)}s` }}>
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="text-secondary-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-primary-50 rounded-2xl p-8 lg:p-12 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-2xl font-semibold text-secondary-900 mb-4">
              Защо да изберете нас?
            </h3>
            <div className="grid sm:grid-cols-3 gap-6 mt-8">
              <div className="text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h4 className="font-semibold text-secondary-900 mb-2">Опит</h4>
                <p className="text-secondary-600 text-sm">Повече от 21 години професионален опит в стоматологията</p>
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="font-semibold text-secondary-900 mb-2">Технологии</h4>
                <p className="text-secondary-600 text-sm">Най-новите стоматологични технологии на водещи брандове в денталната медицина</p>
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💙</span>
                </div>
                <h4 className="font-semibold text-secondary-900 mb-2">Грижа</h4>
                <p className="text-secondary-600 text-sm">Индивидуален подход към всеки пациент</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Services

import { Award, GraduationCap, Users, Clock } from 'lucide-react'

const About = () => {
  const achievements = [
    {
      icon: Award,
      number: '15+',
      label: 'Години опит'
    },
    {
      icon: Users,
      number: '5000+',
      label: 'Доволни пациенти'
    },
    {
      icon: GraduationCap,
      number: '3',
      label: 'Специализации'
    },
    {
      icon: Clock,
      number: '24/7',
      label: 'Достъпност'
    }
  ]

  return (
    <section id="about" className="section-padding bg-secondary-50">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center animate-fade-in">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900">
                За д-р Борислав Петров
              </h2>
              <p className="text-lg text-secondary-600 leading-relaxed">
                Д-р Борислав Петров е опитен зъболекар с повече от 15 години практика в стоматологията. 
                Специализира в профилактика, лечение на кариес и естетична стоматология.
              </p>
              <p className="text-lg text-secondary-600 leading-relaxed">
                Нашата мисия е да предоставяме висококачествена зъболекарска грижа в приятна и спокойна среда, 
                използвайки най-новите технологии и методи за лечение.
              </p>
            </div>

            {/* Education & Experience */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">Образование</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-secondary-900">Медицински университет - София</p>
                      <p className="text-secondary-600">Стоматология</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-secondary-900">Специализации</p>
                      <p className="text-secondary-600">Естетична стоматология, Ортодонтия, Имплантология</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">Нашата философия</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-secondary-700">Индивидуален подход към всеки пациент</span>
                  </li>
                  <li className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-secondary-700">Използване на най-новите технологии</span>
                  </li>
                  <li className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-secondary-700">Приоритет на комфорта на пациента</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stats & Visual */}
          <div className="space-y-8 animate-slide-up">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <achievement.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="text-2xl font-bold text-secondary-900 mb-2">
                    {achievement.number}
                  </div>
                  <div className="text-secondary-600 text-sm">
                    {achievement.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Doctor Image Placeholder */}
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl p-8 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-6xl">👨‍⚕️</span>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Д-р Борислав Петров
              </h3>
              <p className="text-secondary-600">
                Вашият доверен зъболекар
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About 
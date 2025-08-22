'use client'

import { useState, useEffect } from 'react'
import { Shield, Bot, Eye, EyeOff, Save, AlertTriangle } from 'lucide-react'

interface BotProtectionSettingsProps {
  className?: string
}

interface BotProtectionConfig {
  enabled: boolean
  allowIndexing: boolean
  allowCrawling: boolean
  allowArchiving: boolean
  allowSnippets: boolean
}

const BotProtectionSettings = ({ className = '' }: BotProtectionSettingsProps) => {
  const [config, setConfig] = useState<BotProtectionConfig>({
    enabled: true,
    allowIndexing: false,
    allowCrawling: false,
    allowArchiving: false,
    allowSnippets: false
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Зареждане на настройките от localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('botProtectionConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
      } catch (error) {
        console.error('Error parsing bot protection config:', error)
      }
    }
  }, [])

  // Запазване на настройките
  const saveConfig = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      // Запазване в localStorage
      localStorage.setItem('botProtectionConfig', JSON.stringify(config))
      
      // Ако защитата е включена, обновяваме robots.txt
      if (config.enabled) {
        await updateRobotsTxt()
      }
      
      setMessage('Настройките са запазени успешно!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Грешка при запазване на настройките!')
      console.error('Error saving bot protection config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Обновяване на robots.txt файла
  const updateRobotsTxt = async () => {
    try {
      const robotsContent = config.allowCrawling 
        ? `User-agent: *
${config.allowIndexing ? 'Allow: /' : 'Disallow: /'}
${config.allowArchiving ? '' : 'Disallow: /archive'}
${config.allowSnippets ? '' : 'Disallow: /snippets'}

# Настройки за защита от ботове
# Генерирано автоматично от админ панела`
        : `User-agent: *
Disallow: /

# Забрана за всички ботове
# Този сайт е защитен от автоматично индексиране`

      const response = await fetch('/api/admin/update-robots-txt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': localStorage.getItem('adminToken') || ''
        },
        body: JSON.stringify({ content: robotsContent })
      })

      if (!response.ok) {
        throw new Error('Failed to update robots.txt')
      }
    } catch (error) {
      console.error('Error updating robots.txt:', error)
      throw error
    }
  }

  // Превключване на основната защита
  const toggleProtection = () => {
    setConfig(prev => ({
      ...prev,
      enabled: !prev.enabled
    }))
  }

  // Превключване на отделните опции
  const toggleOption = (option: keyof Omit<BotProtectionConfig, 'enabled'>) => {
    setConfig(prev => ({
      ...prev,
      [option]: !prev[option]
    }))
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Защита от ботове</h3>
          <p className="text-sm text-gray-600">
            Контролирайте достъпа на търсачките и ботове до сайта
          </p>
        </div>
      </div>

      {/* Основен превключвател */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
        <div className="flex items-center space-x-3">
          {config.enabled ? (
            <Shield className="w-5 h-5 text-green-600" />
          ) : (
            <Bot className="w-5 h-5 text-red-600" />
          )}
          <div>
            <h4 className="font-medium text-gray-900">
              {config.enabled ? 'Защитата е активна' : 'Защитата е изключена'}
            </h4>
            <p className="text-sm text-gray-600">
              {config.enabled 
                ? 'Ботовете не могат да индексират сайта' 
                : 'Всички ботове имат достъп до сайта'
              }
            </p>
          </div>
        </div>
        <button
          onClick={toggleProtection}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.enabled ? 'bg-green-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Детайлни настройки - само когато защитата е активна */}
      {config.enabled && (
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-gray-900">Детайлни настройки</h4>
          
          {/* Разрешаване на индексиране */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {config.allowIndexing ? <Eye className="w-4 h-4 text-blue-600" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
              <div>
                <span className="font-medium text-gray-900">Разреши индексиране</span>
                <p className="text-xs text-gray-600">Позволява на търсачките да индексират страниците</p>
              </div>
            </div>
            <button
              onClick={() => toggleOption('allowIndexing')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                config.allowIndexing ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  config.allowIndexing ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Разрешаване на crawling */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {config.allowCrawling ? <Bot className="w-4 h-4 text-green-600" /> : <Bot className="w-4 h-4 text-gray-500" />}
              <div>
                <span className="font-medium text-gray-900">Разреши crawling</span>
                <p className="text-xs text-gray-600">Позволява на ботове да обхождат сайта</p>
              </div>
            </div>
            <button
              onClick={() => toggleOption('allowCrawling')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                config.allowCrawling ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  config.allowCrawling ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Разрешаване на архивиране */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {config.allowArchiving ? <Eye className="w-4 h-4 text-yellow-600" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
              <div>
                <span className="font-medium text-gray-900">Разреши архивиране</span>
                <p className="text-xs text-gray-600">Позволява на търсачките да архивират страници</p>
              </div>
            </div>
            <button
              onClick={() => toggleOption('allowArchiving')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                config.allowArchiving ? 'bg-yellow-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  config.allowArchiving ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Разрешаване на snippets */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {config.allowSnippets ? <Eye className="w-4 h-4 text-purple-600" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
              <div>
                <span className="font-medium text-gray-900">Разреши snippets</span>
                <p className="text-xs text-gray-600">Позволява на търсачките да показват откъси</p>
              </div>
            </div>
            <button
              onClick={() => toggleOption('allowSnippets')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                config.allowSnippets ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  config.allowSnippets ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Предупреждение */}
      {!config.enabled && (
        <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            <strong>Внимание:</strong> Когато защитата е изключена, всички ботове могат да достъпват сайта.
            Това не се препоръчва за сайтове в разработка.
          </div>
        </div>
      )}

      {/* Бутон за запазване */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Настройките се прилагат веднага след запазване
        </div>
        <button
          onClick={saveConfig}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Запазване...' : 'Запази настройките'}</span>
        </button>
      </div>

      {/* Съобщение */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.includes('успешно') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Информация за текущите настройки */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Текущи настройки:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• Защита: {config.enabled ? 'Активна' : 'Изключена'}</div>
          {config.enabled && (
            <>
              <div>• Индексиране: {config.allowIndexing ? 'Разрешено' : 'Забранено'}</div>
              <div>• Crawling: {config.allowCrawling ? 'Разрешен' : 'Забранен'}</div>
              <div>• Архивиране: {config.allowArchiving ? 'Разрешено' : 'Забранено'}</div>
              <div>• Snippets: {config.allowSnippets ? 'Разрешени' : 'Забранени'}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BotProtectionSettings


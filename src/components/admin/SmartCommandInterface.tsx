import React, { useState, useEffect, useRef } from 'react'
import { X, Check, AlertCircle, Type, Zap, Smartphone, Command } from 'lucide-react'

interface SmartCommandInterfaceProps {
  onCommand: (command: string) => void
}

interface CommandTemplate {
  category: string
  commands: {
    text: string
    example: string
    icon?: string
  }[]
}

const SmartCommandInterface: React.FC<SmartCommandInterfaceProps> = ({ onCommand }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [command, setCommand] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Command templates organized by category
  const commandTemplates: CommandTemplate[] = [
    {
      category: '👥 Потребители',
      commands: [
        { 
          text: 'добави потребител [име] телефон [номер]', 
          example: 'добави потребител Иван Иванов телефон 0888123456',
          icon: '👤'
        },
        { 
          text: 'промени потребител [име] телефон [номер]', 
          example: 'промени потребител Мария телефон 0888765432',
          icon: '✏️'
        },
        { 
          text: 'изтрий потребител [име]', 
          example: 'изтрий потребител Петър',
          icon: '🗑️'
        }
      ]
    },
    {
      category: '📅 Резервации',
      commands: [
        { 
          text: 'добави резервация [име] [дата] [час]', 
          example: 'добави резервация Петър 15.12.2024 14:00',
          icon: '➕'
        },
        { 
          text: 'промени резервация [име] [дата] [час]', 
          example: 'промени резервация Иван 20.12.2024 10:00',
          icon: '✏️'
        },
        { 
          text: 'отмени резервация [име] [дата]', 
          example: 'отмени резервация Мария 25.12.2024',
          icon: '❌'
        }
      ]
    },
    {
      category: '🔧 Услуги',
      commands: [
        { 
          text: 'провери свободни часове [дата]', 
          example: 'провери свободни часове за утре',
          icon: '🔍'
        },
        { 
          text: 'покажи резервации [дата]', 
          example: 'покажи резервации за днес',
          icon: '📋'
        }
      ]
    }
  ]

  // Detect mobile device
  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobile)
  }, [])

  // Smart suggestions based on input
  const getSuggestions = (input: string) => {
    if (!input.trim()) return []
    
    const suggestions: string[] = []
    const lowerInput = input.toLowerCase()
    
    commandTemplates.forEach(category => {
      category.commands.forEach(cmd => {
        if (cmd.text.toLowerCase().includes(lowerInput) || 
            cmd.example.toLowerCase().includes(lowerInput)) {
          suggestions.push(cmd.example)
        }
      })
    })
    
    return suggestions.slice(0, 5)
  }

  const suggestions = getSuggestions(command)

  // Handle command input
  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCommand(value)
    setShowSuggestions(value.length > 0)
    setSelectedSuggestion(0)
    setError('')
    setSuccess('')
  }

  // Handle keyboard navigation
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0) {
        // Use selected suggestion
        setCommand(suggestions[selectedSuggestion])
        setShowSuggestions(false)
      } else {
        handleSubmit()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestion(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestion(prev => prev > 0 ? prev - 1 : 0)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setShowTemplates(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setCommand(suggestion)
    setShowSuggestions(false)
  }

  // Handle template click
  const handleTemplateClick = (template: string) => {
    setCommand(template)
    setShowTemplates(false)
    inputRef.current?.focus()
  }

  // Submit command
  const handleSubmit = async () => {
    if (!command.trim()) return

    setIsProcessing(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/voice-commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'smart_command',
          originalCommand: command.trim()
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(result.message || 'Командата е изпълнена успешно')
        setCommand('')
        onCommand(command.trim())
      } else {
        setError(result.error || 'Грешка при изпълнение на командата')
      }
    } catch (err) {
      setError('Грешка при обработка на командата')
      console.error('Smart command error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Clear all
  const handleClear = () => {
    setCommand('')
    setShowSuggestions(false)
    setShowTemplates(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Command className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Smart Command Interface
            </h3>
            {isMobile && (
              <Smartphone className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <button
            onClick={handleClear}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Command Input */}
        <div className="relative mb-3">
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={handleCommandChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(command.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Въведете команда..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Smart Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    index === selectedSuggestion ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mb-3">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !command.trim()}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Обработване...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Zap className="w-4 h-4 mr-1" />
                Изпълни
              </div>
            )}
          </button>
          
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>

        {/* Command Templates */}
        {showTemplates && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">Бързи команди:</p>
            <div className="space-y-2">
              {commandTemplates.map((category, catIndex) => (
                <div key={catIndex}>
                  <p className="text-xs font-medium text-gray-600 mb-1">{category.category}</p>
                  <div className="space-y-1">
                    {category.commands.map((cmd, cmdIndex) => (
                      <button
                        key={cmdIndex}
                        onClick={() => handleTemplateClick(cmd.example)}
                        className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors"
                        title={cmd.example}
                      >
                        <span className="mr-1">{cmd.icon}</span>
                        {cmd.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg mb-2">
            <Check className="w-4 h-4 text-green-500" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Help */}
        <div className="text-xs text-gray-500 mt-3">
          <p className="font-medium mb-1">💡 Smart Features:</p>
          <ul className="space-y-1">
            <li>• Автоматични предложения</li>
            <li>• Бързи команди</li>
            <li>• Keyboard навигация (↑↓)</li>
            <li>• Touch оптимизация</li>
          </ul>
          {isMobile && (
            <p className="mt-2 text-blue-600">
              📱 Оптимизирано за мобилни устройства
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartCommandInterface 
'use client'

import React, { useState, useEffect } from 'react'
import { Play, FileText, CheckCircle, AlertCircle, Clock, RefreshCw, Trash2, Download, Eye } from 'lucide-react'

interface QATest {
  name: string
  description: string
  filename: string
  status: 'available' | 'running' | 'completed' | 'failed'
  lastRun?: string
  result?: string
}

interface QAReport {
  timestamp: string
  totalTests: number
  passedTests: number
  failedTests: number
  details: any[]
}

export default function QADashboard() {
  const [tests, setTests] = useState<QATest[]>([])
  const [reports, setReports] = useState<QAReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [showReport, setShowReport] = useState<QAReport | null>(null)

  const qaTests: QATest[] = [
    {
      name: 'Автоматизиран QA тест',
      description: 'Пълна автоматизация на QA процеса с Puppeteer',
      filename: 'QA_AUTOMATED_TEST.js',
      status: 'available'
    },
    {
      name: 'Тест на резервации',
      description: 'Тестване на създаване и редактиране на резервации',
      filename: 'TEST_BOOKINGS.js',
      status: 'available'
    },
    {
      name: 'Тест на календар',
      description: 'Тестване на функционалността на календара',
      filename: 'TEST_CALENDAR.js',
      status: 'available'
    },
    {
      name: 'Тест на потребители',
      description: 'Тестване на управлението на потребители',
      filename: 'TEST_USERS.js',
      status: 'available'
    },
    {
      name: 'Тест на услуги',
      description: 'Тестване на управлението на услуги',
      filename: 'TEST_SERVICE_EDITING.js',
      status: 'available'
    },
    {
      name: 'Тест на API',
      description: 'Тестване на API ендпойнти',
      filename: 'TEST_API.js',
      status: 'available'
    },
    {
      name: 'Тест на мрежа',
      description: 'Тестване на мрежовите заявки',
      filename: 'TEST_NETWORK.js',
      status: 'available'
    },
    {
      name: 'Тест на локално съхранение',
      description: 'Тестване на localStorage функционалност',
      filename: 'TEST_LOCALSTORAGE.js',
      status: 'available'
    },
    {
      name: 'Тест на валидация',
      description: 'Тестване на валидация на форми',
      filename: 'TEST_FORM_VALIDATION.js',
      status: 'available'
    },
    {
      name: 'Тест на бутони',
      description: 'Тестване на интерактивност на бутони',
      filename: 'TEST_BUTTONS.js',
      status: 'available'
    },
    {
      name: 'Тест на начална страница',
      description: 'Тестване на началната страница',
      filename: 'TEST_HOMEPAGE.js',
      status: 'available'
    },
    {
      name: 'Тест на хидрейшън',
      description: 'Тестване на хидрейшън проблеми',
      filename: 'TEST_HYDRATION_FIX.js',
      status: 'available'
    },
    {
      name: 'Тест на почивки',
      description: 'Тестване на функционалността за почивки и предотвратяване на резервации в тях',
      filename: 'TEST_BREAKS.js',
      status: 'available'
    }
  ]

  useEffect(() => {
    setTests(qaTests)
    loadReports()
    
    // Auto-refresh reports every 30 seconds
    const interval = setInterval(() => {
      loadReports()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadReports = async () => {
    try {
      console.log('Loading QA reports...')
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/qa/reports', {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('QA reports data:', data)
        setReports(data.reports || [])
        console.log('Reports loaded:', data.reports?.length || 0)
      } else {
        console.error('Failed to load QA reports:', response.status)
      }
    } catch (error) {
      console.error('Error loading QA reports:', error)
    }
  }

  const runTest = async (testName: string) => {
    setIsLoading(true)
    setSelectedTest(testName)
    
    try {
      const response = await fetch('/api/admin/qa/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': localStorage.getItem('adminToken') || ''
        },
        body: JSON.stringify({ testName })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Test result:', result)
        
        // Update test status
        setTests(prev => prev.map(test => 
          test.name === testName 
            ? { ...test, status: 'completed', lastRun: new Date().toISOString(), result: result.success ? 'passed' : 'failed' }
            : test
        ))

                 // Show detailed results for specific tests
        console.log('Test result details:', result.details)
        console.log('Test name:', testName)
        console.log('Has testResults:', result.details && result.details.testResults)
        console.log('Test results array:', result.details?.testResults)
        
        // Special debug for users test
        if (testName === 'Тест на потребители') {
          console.log('DEBUG: Тест на потребители detected')
          console.log('Result details:', result.details)
          console.log('Has testResults:', result.details && result.details.testResults)
        }
        
        if ((testName === 'Тест на почивки' || testName === 'Тест на календар' || testName === 'Тест на потребители') && result.details && result.details.testResults) {
          console.log('Showing detailed results for:', testName)
          console.log('Result details structure:', JSON.stringify(result.details, null, 2))
          console.log('Test results array length:', result.details.testResults.length)
          
          const details = result.details.testResults.map((t: { test: string; status: string; details: string }) => 
            `${t.test}: ${t.status === 'PASSED' ? '✅' : '❌'} ${t.details}`
          ).join('\n')
          
          const successRate = `${result.details.passedTests}/${result.details.totalTests}`
          const status = result.success ? '✅ ВСИЧКИ ТЕСТОВЕ ПРОЙДЕНИ' : '❌ ИМА ПРОВАЛЕНИ ТЕСТОВЕ'
          
          console.log('Details string:', details)
          console.log('Success rate:', successRate)
          console.log('Status:', status)
          
          alert(`Резултати от ${testName}:\n\n${status}\n\n${details}\n\nОбщо: ${successRate} успешни`)
        } else if (result.details && result.details.error) {
          // Show error details if available
          console.log('Showing error details')
          const status = result.success ? '✅ УСПЕШНО' : '❌ ПРОВАЛЕНО'
          alert(`Тестът завърши: ${status}\n\n${result.message}\n\nГрешка: ${result.details.error}`)
        } else {
          console.log('Showing basic results')
          console.log('Result details:', result.details)
          console.log('Result message:', result.message)
          const status = result.success ? '✅ УСПЕШНО' : '❌ ПРОВАЛЕНО'
          alert(`Тестът завърши: ${status}\n\n${result.message}`)
        }
      } else {
        console.error('Failed to run test')
        alert('Грешка при стартиране на теста')
      }
    } catch (error) {
      console.error('Error running test:', error)
      alert('Грешка при стартиране на теста')
    } finally {
      setIsLoading(false)
      setSelectedTest(null)
    }
  }

  const runAutomatedTest = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/admin/qa/run-automated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': localStorage.getItem('adminToken') || ''
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Automated test result:', result)
        alert('Автоматизираният тест завърши успешно!')
      } else {
        console.error('Failed to run automated test')
        alert('Грешка при стартиране на автоматизирания тест')
      }
    } catch (error) {
      console.error('Error running automated test:', error)
      alert('Грешка при стартиране на автоматизирания тест')
    } finally {
      setIsLoading(false)
    }
  }

  const cleanupTestData = async () => {
    if (!confirm('Сигурни ли сте, че искате да изчистите тестовите данни?')) return
    
    try {
      const response = await fetch('/api/admin/qa/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': localStorage.getItem('adminToken') || ''
        }
      })

      if (response.ok) {
        alert('Тестовите данни бяха изчистени успешно!')
      } else {
        alert('Грешка при изчистване на тестовите данни')
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error)
      alert('Грешка при изчистване на тестовите данни')
    }
  }

  const generateReport = async () => {
    try {
      const response = await fetch('/api/admin/qa/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': localStorage.getItem('adminToken') || ''
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Report generated successfully:', result)
        alert('QA отчетът беше генериран успешно!')
        console.log('Reloading reports...')
        
        // Force reload reports after a short delay
        setTimeout(async () => {
          await loadReports()
        }, 1000)
      } else {
        console.error('Failed to generate report:', response.status)
        alert('Грешка при генериране на QA отчета')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Грешка при генериране на QA отчета')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Play className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTestResultColor = (result: string) => {
    switch (result) {
      case 'passed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">QA Dashboard</h2>
            <p className="text-purple-100 mt-1">Управление на качеството и тестове</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={runAutomatedTest}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>Автоматизиран тест</span>
            </button>
            <button
              onClick={generateReport}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Генерирай отчет</span>
            </button>
            <button
              onClick={cleanupTestData}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Изчисти данни</span>
            </button>
            <button
              onClick={loadReports}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Обнови отчети</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Общо тестове</p>
              <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Завършени</p>
              <p className="text-2xl font-bold text-green-600">
                {tests.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">В процес</p>
              <p className="text-2xl font-bold text-blue-600">
                {tests.filter(t => t.status === 'running').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Отчети</p>
              <p className="text-2xl font-bold text-purple-600">{reports.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">QA Тестове</h3>
          <p className="text-sm text-gray-600 mt-1">Управление на отделни тестове</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => (
              <div key={test.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                  </div>
                  {getStatusIcon(test.status)}
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(test.status)}`}>
                      {test.status === 'completed' && 'Завършен'}
                      {test.status === 'running' && 'В процес'}
                      {test.status === 'failed' && 'Провален'}
                      {test.status === 'available' && 'Достъпен'}
                    </span>
                    
                    {test.result && (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTestResultColor(test.result)}`}>
                        {test.result === 'passed' ? '✅ Успешен' : '❌ Провален'}
                      </span>
                    )}
                  </div>
                  
                  {test.lastRun && (
                    <span className="text-xs text-gray-500">
                      {new Date(test.lastRun).toLocaleDateString('bg-BG')}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => runTest(test.name)}
                    disabled={isLoading || test.status === 'running'}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 disabled:opacity-50"
                    title="Стартирай тест"
                  >
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Стартирай</span>
                  </button>
                  
                                     {test.result && (
                     <button
                       onClick={() => {
                         const status = test.result === 'passed' ? '✅ УСПЕШЕН' : '❌ ПРОВАЛЕН'
                         const details = test.lastRun ? 
                           `Тестът е изпълнен на: ${new Date(test.lastRun).toLocaleString('bg-BG')}` : 
                           'Няма допълнителна информация'
                         alert(`Резултат от ${test.name}:\n\n${status}\n\n${details}`)
                       }}
                       className="flex items-center space-x-1 text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                       title="Виж резултат"
                     >
                       <Eye className="w-4 h-4" />
                       <span className="text-sm">Резултат</span>
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports */}
      {reports.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">QA Отчети</h3>
            <p className="text-sm text-gray-600 mt-1">История на генерираните отчети</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {reports.map((report, index) => (
                <div key={`${report.timestamp}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">QA Отчет #{report.id || index + 1}</h4>
                      <p className="text-sm text-gray-600">
                        Генериран на: {new Date(report.timestamp).toLocaleString('bg-BG')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Тестове: {report.passedTests}/{report.totalTests} успешни
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowReport(report)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Виж</span>
                    </button>
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(report, null, 2)
                        const dataBlob = new Blob([dataStr], { type: 'application/json' })
                        const url = URL.createObjectURL(dataBlob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `qa-report-${new Date(report.timestamp).toISOString().split('T')[0]}.json`
                        link.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Изтегли</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white m-4">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">QA Отчет</h3>
                <button
                  onClick={() => setShowReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-600">Общо тестове</p>
                    <p className="text-2xl font-bold text-blue-900">{showReport.totalTests}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-600">Успешни</p>
                    <p className="text-2xl font-bold text-green-900">{showReport.passedTests}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-600">Провалени</p>
                    <p className="text-2xl font-bold text-red-900">{showReport.failedTests}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Детайли</h4>
                  <pre className="text-sm text-gray-700 overflow-auto max-h-96">
                    {JSON.stringify(showReport.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-gray-900">
              {selectedTest ? `Стартиране на ${selectedTest}...` : 'Стартиране на тест...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 
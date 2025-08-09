// Функции за автоматично записване на бъгове

export interface BugData {
  title: string
  description: string
  category: 'ui' | 'functionality' | 'performance' | 'security' | 'database'
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolution?: string
}

export const recordBug = async (bugData: BugData): Promise<boolean> => {
  try {
    const adminToken = localStorage.getItem('adminToken')
    const response = await fetch('/api/admin/bugs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken || ''
      },
      body: JSON.stringify({
        ...bugData,
        priority: 'medium',
        reporter: 'System',
        stepsToReproduce: [],
        expectedBehavior: '',
        actualBehavior: '',
        tags: ['auto-recorded']
      })
    })
    
    if (response.ok) {
      console.log('✅ Bug автоматично записан:', bugData.title)
      return true
    } else {
      console.error('❌ Грешка при записване на bug:', response.statusText)
      return false
    }
  } catch (error) {
    console.error('❌ Грешка при записване на bug:', error)
    return false
  }
}

// Функция за записване на бъгове с резолюция
export const recordBugWithResolution = async (
  bugData: BugData, 
  resolution: string
): Promise<boolean> => {
  return recordBug({
    ...bugData,
    resolution
  })
}

// Функция за записване на UI бъгове
export const recordUIBug = async (
  title: string, 
  description: string, 
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  resolution?: string
): Promise<boolean> => {
  return recordBug({
    title,
    description,
    category: 'ui',
    severity,
    resolution
  })
}

// Функция за записване на функционални бъгове
export const recordFunctionalityBug = async (
  title: string, 
  description: string, 
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  resolution?: string
): Promise<boolean> => {
  return recordBug({
    title,
    description,
    category: 'functionality',
    severity,
    resolution
  })
} 
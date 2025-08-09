# UI/UX Guidelines

## 🎯 Основни принципи за модални прозорци

### 1. Затваряне с Escape клавиш
**ВИНАГИ** прилагайте следната концепция при създаване на модални прозорци:

```typescript
// В React компоненти с модали
useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose() // или setShowModal(false)
    }
  }

  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
}, [onClose])
```

### 2. Примери за правилна имплементация

#### ✅ Правилно - UserHistory.tsx
```typescript
// Handle Escape key for closing modal
useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }

  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
}, [onClose])
```

#### ✅ Правилно - SupportNotes.tsx
```typescript
// Добавете в компонента:
useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }

  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
}, [onClose])
```

### 3. Задължителни елементи за модали

1. **Escape клавиш** - затваря модала
2. **X бутон** - в горния десен ъгъл
3. **Click outside** - затваря при клик извън модала
4. **Overlay** - тъмен фон зад модала
5. **Focus trap** - фокусът остава в модала

### 4. Структура на модал компонент

```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Заглавие</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
```

### 5. Проверен списък за нови модали

При създаване на нова модална функционалност, проверете:

- [ ] Escape клавиш затваря модала
- [ ] X бутон в горния десен ъгъл
- [ ] Click outside затваря модала
- [ ] Правилен z-index (z-50 или по-висок)
- [ ] Overlay с bg-opacity-50
- [ ] Focus trap (ако е необходимо)
- [ ] Правилно cleanup на event listeners

### 6. Примери за имплементация

#### За модал с форма:
```typescript
const [showModal, setShowModal] = useState(false)

useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowModal(false)
    }
  }

  if (showModal) {
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }
}, [showModal])
```

#### За модал с данни:
```typescript
const [selectedItem, setSelectedItem] = useState(null)

useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setSelectedItem(null)
    }
  }

  if (selectedItem) {
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }
}, [selectedItem])
```

## 🚨 ВАЖНО

**ВИНАГИ** прилагайте тази концепция при създаване на нови модални прозорци. Това е стандарт за UX и потребителите очакват да могат да затварят модали с Escape клавиша.

## 📝 Забележки

- Използвайте `useEffect` с правилно cleanup
- Проверявайте дали модалът е отворен преди да добавяте event listener
- Използвайте правилни z-index стойности
- Тествайте функционалността в различни браузъри 
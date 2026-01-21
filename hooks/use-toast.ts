'use client'

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: { title: string; description: string; variant?: 'default' | 'destructive' }) => {
    const notification = document.createElement('div')
    
    const baseStyles = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border animate-in fade-in slide-in-from-bottom-4'
    const variantStyles = variant === 'destructive' 
      ? 'bg-red-50 border-red-500 text-red-900' 
      : 'bg-white border-gray-200'
    
    notification.className = `${baseStyles} ${variantStyles}`
    notification.setAttribute('role', 'status')
    notification.setAttribute('aria-live', 'polite')
    
    const titleEl = document.createElement('div')
    titleEl.className = 'font-semibold'
    titleEl.textContent = title
    
    const descEl = document.createElement('div')
    descEl.className = 'text-sm opacity-90'
    descEl.textContent = description
    
    notification.appendChild(titleEl)
    notification.appendChild(descEl)
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  return { toast }
}
'use client'

type ToastVariant = 'default' | 'destructive'

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

const TOAST_CONTAINER_ID = 'toast-container'

function getToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID)

  if (!container) {
    container = document.createElement('div')
    container.id = TOAST_CONTAINER_ID
    container.className =
      'fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none'
    container.setAttribute('aria-live', 'polite')
    container.setAttribute('aria-relevant', 'additions')
    document.body.appendChild(container)
  }

  return container
}

export function useToast() {
  const toast = ({
    title,
    description,
    variant = 'default',
    duration = 3000,
  }: ToastOptions) => {
    const container = getToastContainer()
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const notification = document.createElement('div')

    const baseStyles =
      'pointer-events-auto relative w-full rounded-lg border p-4 shadow-lg flex gap-3 items-start transition-all'
    const motionStyles = prefersReducedMotion
      ? ''
      : 'animate-in fade-in slide-in-from-bottom-2'
    const variantStyles =
      variant === 'destructive'
        ? 'bg-red-50 border-red-500 text-red-900'
        : 'bg-white border-gray-200 text-gray-900'

    notification.className = `${baseStyles} ${variantStyles} ${motionStyles}`
    notification.setAttribute('role', 'status')
    notification.tabIndex = 0

    const content = document.createElement('div')
    content.className = 'flex-1'

    const titleEl = document.createElement('div')
    titleEl.className = 'font-semibold leading-tight'
    titleEl.textContent = title

    content.appendChild(titleEl)

    if (description) {
      const descEl = document.createElement('div')
      descEl.className = 'text-sm opacity-90 mt-1'
      descEl.textContent = description
      content.appendChild(descEl)
    }

    const closeButton = document.createElement('button')
    closeButton.type = 'button'
    closeButton.className =
      'ml-2 text-sm opacity-60 hover:opacity-100 focus:outline-none'
    closeButton.setAttribute('aria-label', 'Dismiss notification')
    closeButton.innerHTML = '✕'

    notification.appendChild(content)
    notification.appendChild(closeButton)
    container.appendChild(notification)

    let timeoutId: number

    const dismiss = () => {
      if (!prefersReducedMotion) {
        notification.classList.remove(
          'animate-in',
          'fade-in',
          'slide-in-from-bottom-2'
        )
        notification.classList.add('animate-out', 'fade-out')
        setTimeout(() => notification.remove(), 200)
      } else {
        notification.remove()
      }
    }

    const startTimer = () => {
      timeoutId = window.setTimeout(dismiss, duration)
    }

    const clearTimer = () => {
      window.clearTimeout(timeoutId)
    }

    startTimer()

    notification.addEventListener('mouseenter', clearTimer)
    notification.addEventListener('mouseleave', startTimer)
    closeButton.addEventListener('click', dismiss)
  }

  return { toast }
}
'use client'

import { useEffect, useRef } from 'react'

export function ClientEffects() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = 0
    let mouseY = 0
    let dotX = 0
    let dotY = 0
    let ringX = 0
    let ringY = 0

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const onClick = (e: MouseEvent) => {
      const ripple = document.createElement('div')
      ripple.className = 'cursor-ripple'
      ripple.style.left = `${e.clientX}px`
      ripple.style.top = `${e.clientY}px`
      document.body.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
    }

    const animate = () => {
      dotX += (mouseX - dotX) * 0.2
      dotY += (mouseY - dotY) * 0.2
      ringX += (mouseX - ringX) * 0.1
      ringY += (mouseY - ringY) * 0.1

      dot.style.left = `${dotX}px`
      dot.style.top = `${dotY}px`
      ring.style.left = `${ringX}px`
      ring.style.top = `${ringY}px`

      requestAnimationFrame(animate)
    }

    const addHoverListeners = () => {
      const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [tabindex]')
      interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => ring?.classList.add('hover'))
        el.addEventListener('mouseleave', () => ring?.classList.remove('hover'))
      })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('click', onClick)
    const frameId = requestAnimationFrame(animate)

    const observer = new MutationObserver(addHoverListeners)
    observer.observe(document.body, { childList: true, subtree: true })
    addHoverListeners()

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('click', onClick)
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="custom-cursor-dot hidden md:block" />
      <div ref={ringRef} className="custom-cursor-ring hidden md:block" />
    </>
  )
}
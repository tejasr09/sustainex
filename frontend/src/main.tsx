import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { useEffect } from 'react'
import App from './App'
import './index.css'
import Lenis from 'lenis'

function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      syncTouch: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }

    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}

function CursorTracker() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dot = document.getElementById('cursor-tracker')
    const ring = document.getElementById('cursor-tracker-ring')
    if (!dot || !ring) return

    let raf = 0
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ringPos = { ...pos }
    let visible = false
    const interactiveSelector = 'a, button, input, select, textarea, [role="button"]'

    const render = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.2
      ringPos.y += (pos.y - ringPos.y) * 0.2
      dot.style.transform = `translate3d(${pos.x - 4}px, ${pos.y - 4}px, 0)`
      ring.style.transform = `translate3d(${ringPos.x - 17}px, ${ringPos.y - 17}px, 0)`
      raf = requestAnimationFrame(render)
    }

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      if (!visible) {
        visible = true
        dot.style.opacity = '1'
        ring.style.opacity = '1'
      }
    }
    const onLeave = () => {
      visible = false
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }
    const onHover = (e: MouseEvent) => {
      const target = e.target as Element | null
      const isInteractive = !!target?.closest(interactiveSelector)
      ring.style.width = isInteractive ? '44px' : '34px'
      ring.style.height = isInteractive ? '44px' : '34px'
      ring.style.borderColor = isInteractive ? 'rgba(255, 111, 240, 0.95)' : 'rgba(187, 153, 255, 0.7)'
    }

    raf = requestAnimationFrame(render)
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onHover)
    window.addEventListener('mouseout', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onHover)
      window.removeEventListener('mouseout', onLeave)
    }
  }, [])

  return (
    <>
      <div id="cursor-tracker" className="cursor-tracker" aria-hidden />
      <div id="cursor-tracker-ring" className="cursor-tracker-ring" aria-hidden />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LenisProvider>
        <App />
        <CursorTracker />
      </LenisProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

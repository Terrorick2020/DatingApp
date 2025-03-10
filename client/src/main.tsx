import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { viewport, init, isTMA } from '@telegram-apps/sdk'

import store from './store'
import App from './App.tsx'


async function initTg() {
  if (await isTMA()) {
    await init()
    if (viewport.mount.isAvailable()) {
      await viewport.mount()
      viewport.expand()
    }
    if (viewport.requestFullscreen.isAvailable()) {
      await viewport.requestFullscreen()
    }
  }
}

(async () => { await initTg() })()


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={ store }>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)

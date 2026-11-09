import '@fontsource/hind-siliguri/400.css'
import '@fontsource/hind-siliguri/500.css'
import '@fontsource/hind-siliguri/700.css'
import './styles/tokens.css'
import './styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './app/App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

// Register the service worker so the app keeps working without internet.
// `immediate` makes the worker take over as soon as it is ready.
registerSW({ immediate: true })

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

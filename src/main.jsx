import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { TonConnectUIProvider } from '@tonconnect/ui-react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TonConnectUIProvider
      manifestUrl="https://ggcat.org/media/tonconnect-manifest.json"
    >
      <UserProvider>
        <App />
      </UserProvider>
    </TonConnectUIProvider>
  </StrictMode>
)

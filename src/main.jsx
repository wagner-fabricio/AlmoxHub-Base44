import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

function mobileRedirect() {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768
    if (!isMobile) return
    const path = window.location.pathname.replace(/^\/+/, '').split('/')[0]
    const allowed = ['EmFluxo', 'MeuPerfilMobile', 'NotificationsMobile', 'NewUserSetup', 'PendingApproval', 'UserApproval', 'ThankYou']
    if (allowed.includes(path)) return
    const osId = new URLSearchParams(window.location.search).get('os_id')
    window.location.replace('/EmFluxo' + (osId ? '?os_id=' + osId : ''))
  } catch (e) {
    // noop
  }
}

mobileRedirect()

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}
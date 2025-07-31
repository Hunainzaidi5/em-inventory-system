import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Fallback component in case of errors
const FallbackApp = () => (
  <div style={{ 
    padding: '20px', 
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  }}>
    <h1 style={{ color: '#333' }}>E&M Inventory Management System</h1>
    <p>Loading application...</p>
    <p>If you see this message for more than a few seconds, please refresh the page.</p>
  </div>
)

const rootElement = document.getElementById("root")
if (rootElement) {
  try {
    console.log("Starting React application...")
    createRoot(rootElement).render(<App />)
  } catch (error) {
    console.error("Error rendering React app:", error)
    createRoot(rootElement).render(<FallbackApp />)
  }
} else {
  console.error("Root element not found!")
  document.body.innerHTML = '<h1 style="color: red; padding: 20px;">Error: Root element not found!</h1>'
}

import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [messaggio, setMessaggio] = useState("In attesa del backend...")

  useEffect(() => {
    // Il frontend chiama l'API esposta sulla porta 5000 dal backend
    axios.get('/api/dashboard/status')
      .then(response => {
        setMessaggio(response.data.status)
      })
      .catch(error => {
        setMessaggio("Errore di connessione: " + error.message)
      })
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>OMRExams - Tirocinio</h1>
      <p>Stato Backend: <strong style={{ color: 'blue' }}>{messaggio}</strong></p>
    </div>
  )
}

export default App
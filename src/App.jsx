import { useState } from 'react'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Reservations from './pages/Reservations'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onPageChange={setCurrentPage} />
      case 'menu':
        return <Menu />
      case 'reservations':
        return <Reservations />
      default:
        return <Home onPageChange={setCurrentPage} />
    }
  }

  return (
    <div className="App">
      <NavBar currentPage={currentPage} onPageChange={setCurrentPage} />
      {renderPage()}
      <footer className="bg-dark text-light text-center py-4 mt-5">
        <div className="container">
          <p className="mb-1">&copy; 2024 Cafe Delight. All rights reserved.</p>
          <p className="mb-0 text-muted small">123 Main Street • Downtown • (555) 123-4567</p>
        </div>
      </footer>
    </div>
  )
}

export default App
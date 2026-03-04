export default function NavBar({ currentPage, onPageChange }) {
  const navStyle = { cursor: 'pointer', textDecoration: 'none' }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">
      <div className="container">
        <span 
          className="navbar-brand fw-bold" 
          style={navStyle}
          onClick={() => onPageChange('home')}
        >
          ☕ Cafe Delight
        </span>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <span 
                className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
                style={navStyle}
                onClick={() => onPageChange('home')}
              >
                Home
              </span>
            </li>
            <li className="nav-item">
              <span 
                className={`nav-link ${currentPage === 'menu' ? 'active' : ''}`}
                style={navStyle}
                onClick={() => onPageChange('menu')}
              >
                Menu
              </span>
            </li>
            <li className="nav-item">
              <span 
                className={`nav-link ${currentPage === 'reservations' ? 'active' : ''}`}
                style={navStyle}
                onClick={() => onPageChange('reservations')}
              >
                Reservations
              </span>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
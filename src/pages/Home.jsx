export default function Home({ onPageChange }) {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-3">Welcome to Cafe Delight</h1>
          <p className="lead mb-4">Your neighborhood cafe serving fresh coffee, breakfast, lunch, and pastries</p>
          <div className="d-flex gap-3 justify-content-center">
            <button 
              className="btn btn-light btn-lg fw-bold"
              onClick={() => onPageChange('menu')}
            >
              View Menu
            </button>
            <button 
              className="btn btn-outline-light btn-lg fw-bold"
              onClick={() => onPageChange('reservations')}
            >
              Make Reservation
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="display-5 mb-3">☕</div>
                  <h5 className="card-title fw-bold">Premium Coffee</h5>
                  <p className="card-text text-muted">Locally roasted beans, expertly crafted by our skilled baristas</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="display-5 mb-3">🥐</div>
                  <h5 className="card-title fw-bold">Fresh Pastries</h5>
                  <p className="card-text text-muted">Baked fresh daily using quality ingredients and traditional recipes</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="display-5 mb-3">🥗</div>
                  <h5 className="card-title fw-bold">Healthy Options</h5>
                  <p className="card-text text-muted">Nutritious meals and salads made with fresh, local produce</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hours & Location */}
      <section className="bg-light py-5">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-6">
              <h2 className="fw-bold mb-4">Opening Hours</h2>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span>Monday - Friday</span>
                <span className="fw-bold">7:00 AM - 8:00 PM</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span>Saturday</span>
                <span className="fw-bold">8:00 AM - 9:00 PM</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span>Sunday</span>
                <span className="fw-bold">8:00 AM - 6:00 PM</span>
              </div>
            </div>
            <div className="col-lg-6">
              <h2 className="fw-bold mb-4">Location</h2>
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <h5 className="card-title fw-bold mb-3">Cafe Delight</h5>
                  <p className="card-text mb-2">📍 123 Main Street, Downtown</p>
                  <p className="card-text mb-2">📞 (555) 123-4567</p>
                  <p className="card-text mb-0">✉️ hello@cafedelight.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
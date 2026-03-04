import { useState } from 'react'

export default function Reservations() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    partySize: '',
    date: '',
    time: '',
    notes: ''
  })
  const [availability, setAvailability] = useState(null)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('info')

  const today = new Date().toISOString().split('T')[0]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setAvailability(null)
    setMessage(null)
  }

  const checkAvailability = async () => {
    if (!formData.date || !formData.time || !formData.partySize) {
      setMessage('Please fill in date, time, and party size')
      setMessageType('warning')
      return
    }

    const partySize = parseInt(formData.partySize)
    if (partySize < 1 || partySize > 20) {
      setMessage('Party size must be between 1 and 20')
      setMessageType('warning')
      return
    }

    setChecking(true)
    setAvailability(null)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/reservations/availability?date=${formData.date}&time=${formData.time}&partySize=${partySize}`
      )

      if (!response.ok) throw new Error('Failed to check availability')

      const data = await response.json()
      setAvailability(data)

      if (data.available) {
        setMessage(`Great! ${data.remainingSeats} seats available for your party of ${partySize}`)
        setMessageType('success')
      } else {
        setMessage(`Sorry, not enough tables available for ${partySize} at this time`)
        setMessageType('danger')
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      setMessage('Failed to check availability. Please try again.')
      setMessageType('danger')
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!availability?.available) {
      setMessage('Please check availability before submitting your reservation')
      setMessageType('warning')
      return
    }

    if (!formData.name || !formData.contact) {
      setMessage('Please fill in your name and contact information')
      setMessageType('warning')
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          contact: formData.contact,
          party_size: parseInt(formData.partySize),
          date: formData.date,
          time: formData.time,
          notes: formData.notes
        })
      })

      if (!response.ok) throw new Error('Failed to create reservation')

      const result = await response.json()
      setMessage(`Reservation confirmed for ${formData.partySize} guest(s) on ${new Date(formData.date).toLocaleDateString()} at ${formData.time}! We'll send a confirmation to ${formData.contact}.`)
      setMessageType('success')
      
      // Reset form
      setFormData({
        name: '',
        contact: '',
        partySize: '',
        date: '',
        time: '',
        notes: ''
      })
      setAvailability(null)
    } catch (error) {
      console.error('Error creating reservation:', error)
      setMessage('Failed to create reservation. Please try again.')
      setMessageType('danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h1 className="text-center fw-bold mb-4">Make a Reservation</h1>
            <p className="text-center text-muted mb-5">
              Reserve your table and enjoy a memorable dining experience with us
            </p>

            {message && (
              <div className={`alert alert-${messageType} alert-dismissible fade show mb-4`} role="alert">
                {message}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setMessage(null)}
                />
              </div>
            )}

            <div className="card border-0 shadow">
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <h5 className="fw-bold mb-4">Reservation Details</h5>
                  
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label htmlFor="date" className="form-label">Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        min={today}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="time" className="form-label">Time *</label>
                      <input
                        type="time"
                        className="form-control"
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        min="07:00"
                        max="21:00"
                        required
                      />
                      <small className="text-muted">We're open 7:00 AM - 9:00 PM</small>
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="partySize" className="form-label">Party Size *</label>
                      <select
                        className="form-select"
                        id="partySize"
                        name="partySize"
                        value={formData.partySize}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select guests</option>
                        {[...Array(20)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="d-grid gap-2 mb-4">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={checkAvailability}
                      disabled={checking || !formData.date || !formData.time || !formData.partySize}
                    >
                      {checking ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : 'Check Availability'}
                    </button>
                  </div>

                  {availability && (
                    <div className={`alert ${availability.available ? 'alert-success' : 'alert-warning'} mb-4`}>
                      {availability.available ? (
                        <div>
                          <strong className="d-block mb-2">✓ Available!</strong>
                          <p className="mb-2">{availability.remainingSeats} seats remaining for your selection</p>
                          <small className="text-muted">Please complete your contact information below to confirm your reservation</small>
                        </div>
                      ) : (
                        <div>
                          <strong className="d-block mb-2">⚠ Not Available</strong>
                          <p className="mb-2">We're fully booked or don't have enough space for your party size at this time</p>
                          {availability.suggestions && availability.suggestions.length > 0 && (
                            <div className="mt-3">
                              <small className="fw-bold">Suggested alternatives:</small>
                              <ul className="mb-0 mt-1">
                                {availability.suggestions.slice(0, 3).map((s, i) => (
                                  <li key={i} className="small">{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <hr className="my-4" />

                  <h5 className="fw-bold mb-4">Contact Information</h5>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label">Your Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="contact" className="form-label">Phone or Email *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="contact"
                        name="contact"
                        value={formData.contact}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567 or email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="notes" className="form-label">Special Requests (Optional)</label>
                    <textarea
                      className="form-control"
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Any dietary restrictions, special occasions, or seating preferences..."
                      maxLength={500}
                    />
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={submitting || !availability?.available}
                    >
                      {submitting ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : 'Confirm Reservation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="mt-5 text-center text-muted small">
              <p className="mb-1">For parties larger than 20, please call us at (555) 123-4567</p>
              <p className="mb-0">Reservations can be cancelled or modified up to 2 hours before your scheduled time</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
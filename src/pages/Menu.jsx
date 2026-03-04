import { useState, useEffect } from 'react'

export default function Menu() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState({})
  const [expandedItems, setExpandedItems] = useState({})
  const [newComment, setNewComment] = useState({})
  const [submitting, setSubmitting] = useState({})
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu')
      if (!response.ok) throw new Error('Failed to fetch menu')
      const data = await response.json()
      setMenuItems(data)
      
      // Fetch comments for each item
      for (const item of data) {
        await fetchComments(item.id)
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
      setMessage('Failed to load menu')
      setMessageType('danger')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (itemId) => {
    try {
      const response = await fetch(`/api/menu/${itemId}/comments`)
      if (!response.ok) return
      const data = await response.json()
      setComments(prev => ({ ...prev, [itemId]: data }))
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const toggleComments = (itemId) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const handleCommentSubmit = async (itemId) => {
    const comment = newComment[itemId]
    if (!comment || !comment.body.trim()) {
      setMessage('Please enter a comment')
      setMessageType('danger')
      return
    }

    setSubmitting(prev => ({ ...prev, [itemId]: true }))
    setMessage(null)

    try {
      const response = await fetch(`/api/menu/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: comment.displayName || 'Anonymous',
          rating: comment.rating ? parseInt(comment.rating) : null,
          body: comment.body
        })
      })

      if (!response.ok) throw new Error('Failed to submit comment')

      const result = await response.json()
      
      // Show the new comment immediately with status
      setComments(prev => ({
        ...prev,
        [itemId]: [result, ...(prev[itemId] || [])]
      }))
      
      setNewComment(prev => ({ ...prev, [itemId]: { displayName: '', rating: '', body: '' } }))
      setExpandedItems(prev => ({ ...prev, [itemId]: true }))
      setMessage('Comment submitted! ' + (result.status === 'pending' ? 'It is awaiting moderation and will be visible once approved.' : ''))
      setMessageType('result.status === \'approved\' ? \'success\' : \'warning\'')
    } catch (error) {
      console.error('Error submitting comment:', error)
      setMessage('Failed to submit comment. Please try again.')
      setMessageType('danger')
    } finally {
      setSubmitting(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const getStarRating = (rating) => {
    if (!rating) return ''
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const getPrice = (priceCents) => {
    return '$' + (priceCents / 100).toFixed(2)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge bg-success">Approved</span>
      case 'pending':
        return <span className="badge bg-warning text-dark">Pending Approval</span>
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <main className="py-5">
      <div className="container">
        <h1 className="text-center fw-bold mb-5">Our Menu</h1>
        
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

        <div className="row g-4">
          {menuItems.map(item => (
            <div key={item.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title fw-bold mb-0">{item.name}</h5>
                    <span className="text-primary fw-bold">{getPrice(item.price_cents)}</span>
                  </div>
                  <p className="card-text text-muted small mb-3">{item.description}</p>
                  
                  <button 
                    className="btn btn-outline-primary btn-sm mb-3"
                    onClick={() => toggleComments(item.id)}
                  >
                    {expandedItems[item.id] ? 'Hide Comments' : 'View Comments'} 
                    {comments[item.id] && comments[item.id].length > 0 && (
                      <span className="badge bg-secondary ms-2">
                        {comments[item.id].filter(c => c.status === 'approved').length}
                      </span>
                    )}
                  </button>

                  {expandedItems[item.id] && (
                    <div className="comments-section">
                      {/* Comment Form */}
                      <div className="card bg-light mb-3">
                        <div className="card-body p-3">
                          <h6 className="card-title small fw-bold mb-3">Add a Comment</h6>
                          <div className="mb-2">
                            <input
                              type="text"
                              className="form-control form-control-sm mb-2"
                              placeholder="Your name (optional)"
                              value={newComment[item.id]?.displayName || ''}
                              onChange={(e) => setNewComment(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], displayName: e.target.value }
                              }))}
                              disabled={submitting[item.id]}
                            />
                          </div>
                          <div className="mb-2">
                            <select
                              className="form-select form-select-sm mb-2"
                              value={newComment[item.id]?.rating || ''}
                              onChange={(e) => setNewComment(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], rating: e.target.value }
                              }))}
                              disabled={submitting[item.id]}
                            >
                              <option value="">Rating (optional)</option>
                              <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                              <option value="4">⭐⭐⭐⭐ Good</option>
                              <option value="3">⭐⭐⭐ Average</option>
                              <option value="2">⭐⭐ Fair</option>
                              <option value="1">⭐ Poor</option>
                            </select>
                          </div>
                          <div className="mb-2">
                            <textarea
                              className="form-control form-control-sm mb-2"
                              placeholder="Share your experience..."
                              rows="2"
                              value={newComment[item.id]?.body || ''}
                              onChange={(e) => setNewComment(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], body: e.target.value }
                              }))}
                              disabled={submitting[item.id]}
                              maxLength={500}
                            />
                          </div>
                          <button
                            className="btn btn-primary btn-sm w-100"
                            onClick={() => handleCommentSubmit(item.id)}
                            disabled={submitting[item.id]}
                          >
                            {submitting[item.id] ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : 'Submit Comment'}
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="comments-list">
                        {comments[item.id] && comments[item.id].length > 0 ? (
                          comments[item.id].map(comment => (
                            comment.status !== 'rejected' && (
                              <div key={comment.id} className="card mb-2 border-0 shadow-sm">
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <strong className="small">
                                      {comment.display_name}
                                      {comment.rating && (
                                        <span className="text-warning ms-1">
                                          {getStarRating(comment.rating)}
                                        </span>
                                      )}
                                    </strong>
                                    <small className="text-muted">
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </small>
                                  </div>
                                  <p className="card-text small mb-1">{comment.body}</p>
                                  {getStatusBadge(comment.status)}
                                </div>
                              </div>
                            )
                          ))
                        ) : (
                          <p className="text-muted small text-center">No comments yet. Be the first to review!</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
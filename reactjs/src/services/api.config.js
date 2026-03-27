const API_BASE = process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000/api/v1'
    : process.env.REACT_APP_BASE_URL

export default API_BASE

import axios from 'axios'

import API_BASE from './api.config'

const API_URL = `${API_BASE}/auth`

const signup = (email, password) => {
    return axios.post(`${API_URL}/signup`, {
        email, password
    })
    .then(response => {
        console.log(response)
        if (response.data.token) {
            localStorage.setItem("user", JSON.stringify(response.data))
        }
        return response.data
    })
}

const login = (email, password) => {
    return axios.post(`${API_URL}/signin`, {
        email, password
    })
    .then(response => {
        if (response.data.token) {
            localStorage.setItem("user", JSON.stringify(response.data))
        }
        return response.data
    })
}

const logout = () => {
    localStorage.removeItem("user")
}

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("user"))
}

const AuthService = {
    signup,
    login,
    logout,
    getCurrentUser
}

export default AuthService

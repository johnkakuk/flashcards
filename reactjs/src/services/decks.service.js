import axios from "axios"
import authHeader from "./auth-header"
import API_BASE from './api.config'

const API_URL = `${API_BASE}/decks`

const getAllPrivateDecks = () => {
    return axios.get(`${API_URL}`, { headers: authHeader() })
}

const createPrivateDeck = (deckData) => {
    return axios.post(`${API_URL}`, deckData, { headers: authHeader() })
}

const updatePrivateDeck = (deckId, deckData) => {
    return axios.patch(`${API_URL}/${deckId}`, deckData, { headers: authHeader() })
}

const deletePrivateDeck = (deckId) => {
    return axios.delete(`${API_URL}/${deckId}`, { headers: authHeader() })
}

const DecksService = {
    getAllPrivateDecks,
    createPrivateDeck,
    updatePrivateDeck,
    deletePrivateDeck
}

export default DecksService

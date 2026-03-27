import axios from "axios"
import authHeader from "./auth-header"
import API_BASE from './api.config'

const API_URL = `${API_BASE}/cards`

const getAllPrivateCards = () => {
    return axios.get(`${API_URL}`, { headers: authHeader() })
}

const getAllPrivateCardsByDeck = (deckId) => {
    return axios.get(`${API_URL}?deck=${deckId}`, { headers: authHeader() })
}

const createPrivateCard = (cardData) => {
    return axios.post(`${API_URL}`, cardData, { headers: authHeader() })
}

const updatePrivateCard = (cardId, cardData) => {
    return axios.patch(`${API_URL}/${cardId}`, cardData, { headers: authHeader() })
}

const deletePrivateCard = (cardId) => {
    return axios.delete(`${API_URL}/${cardId}`, { headers: authHeader() })
}

const CardsService = {
    getAllPrivateCards,
    getAllPrivateCardsByDeck,
    createPrivateCard,
    updatePrivateCard,
    deletePrivateCard
}

export default CardsService

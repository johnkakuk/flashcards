import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

function Home() {
    // State, hooks and constants
    const navigate = useNavigate()
    const [decks, setDecks] = useState([])
    const [deckCardStats, setDeckCardStats] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [menuDeckId, setMenuDeckId] = useState('')
    const [editingDeckId, setEditingDeckId] = useState('')
    const [editingName, setEditingName] = useState('')
    const [savingDeckId, setSavingDeckId] = useState('')
    const [newDeck, setNewDeck] = useState(null)

    const API_BASE = process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000/api/v1'
        : process.env.REACT_APP_BASE_URL

    useEffect(() => {
        const fetchDecks = async () => {
            setLoading(true)
            setError('')

            try {
                const response = await fetch(`${API_BASE}/decks`)
                const data = await response.json()
                if (!response.ok) {
                    throw new Error(data.message || 'Unable to load decks')
                }
                setDecks(data || [])
            } catch (err) {
                setError(err.message || 'Unexpected error while loading decks')
            } finally {
                setLoading(false)
            }
        }

        fetchDecks()
    }, [API_BASE])

    // Fetch stats
    useEffect(() => {
        let ignore = false
        const loadTime = new Date()

        // Fetch all cards to calculate deck stats (total cards and cards due). Kind of inefficient but works for now since we don't expect a huge number of cards. Maybe later I can create a specific endpoint to fetch stats
        const fetchCardStats = async () => {
            try {
                const response = await fetch(`${API_BASE}/cards`)
                const cards = await response.json()
                if (!response.ok) {
                    throw new Error(cards.message || 'Unable to load card stats')
                }

                const statsByDeck = (cards || []).reduce((stats, card) => {
                    if (!card.deck) {
                        return stats
                    }

                    if (!stats[card.deck]) {
                        stats[card.deck] = {
                            totalCards: 0,
                            cardsDue: 0
                        }
                    }

                    stats[card.deck].totalCards += 1
                    if (new Date(card.showNext) <= loadTime) {
                        stats[card.deck].cardsDue += 1
                    }

                    return stats
                }, {})

                if (!ignore) {
                    setDeckCardStats(statsByDeck)
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message || 'Unexpected error while loading card stats')
                }
            }
        }

        fetchCardStats()

        return () => {
            ignore = true
        }
    }, [API_BASE])

    // Handler for the info button on deck cards
    const handleToggleMenu = (event, deckId) => {
        event.stopPropagation()
        setMenuDeckId(currentDeckId => currentDeckId === deckId ? '' : deckId)
    }

    // Handler for starting the rename process (when clicking "Rename" in the deck menu)
    const handleStartRename = (deck) => {
        setMenuDeckId('')
        setEditingDeckId(deck._id)
        setEditingName(deck.name || '')
        setError('')
    }

    // Handler for saving a deck (both creating new and renaming existing)
    const handleSaveDeck = async (event, deck) => {
        event.preventDefault()

        const deckName = editingName.trim()
        if (!deckName) {
            setError('Deck title is required')
            return
        }

        setSavingDeckId(deck._id)
        setError('')

        try {
            if (deck.isNew) {
                const response = await fetch(`${API_BASE}/decks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: deckName })
                })

                const savedDeck = await response.json()
                if (!response.ok) {
                    throw new Error(savedDeck.message || 'Unable to save new deck')
                }

                setDecks(currentDecks => [...currentDecks, savedDeck])
                setNewDeck(null)
            } else {
                const response = await fetch(`${API_BASE}/decks/${deck._id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: deckName })
                })

                const updatedDeck = await response.json()
                if (!response.ok) {
                    throw new Error(updatedDeck.message || 'Unable to rename deck')
                }

                setDecks(currentDecks =>
                    currentDecks.map(currentDeck =>
                        currentDeck._id === deck._id ? updatedDeck : currentDeck
                    )
                )
            }

            setEditingDeckId('')
            setEditingName('')
        } catch (err) {
            setError(err.message || 'Unexpected error while saving deck')
        } finally {
            setSavingDeckId('')
        }
    }

    // Handler for canceling deck edit
    const handleCancelDeckEdit = (deck) => {
        if (deck?.isNew) {
            setNewDeck(null)
        }
        setEditingDeckId('')
        setEditingName('')
        setError('')
    }

    // Handler for deleting a deck
    const handleDeleteDeck = async (deck) => {
        setMenuDeckId('')
        if (!window.confirm(`Delete "${deck.name}"?`)) {
            return
        }

        setError('')
        try {
            const response = await fetch(`${API_BASE}/decks/${deck._id}`, {
                method: 'DELETE'
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.message || 'Unable to delete deck')
            }

            setDecks(currentDecks => currentDecks.filter(currentDeck => currentDeck._id !== deck._id))
            if (editingDeckId === deck._id) {
                setEditingDeckId('')
                setEditingName('')
            }
        } catch (err) {
            setError(err.message || 'Unexpected error while deleting deck')
        }
    }

    // Handler for adding a new deck (when clicking the "Add Deck" card)
    const handleAddDeck = () => {
        setMenuDeckId('')
        setError('')

        if (newDeck) {
            setEditingDeckId(newDeck._id)
            return
        }

        const tempDeck = {
            _id: `new-${Date.now()}`,
            name: '',
            isNew: true
        }

        setNewDeck(tempDeck)
        setEditingDeckId(tempDeck._id)
        setEditingName('')
    }

    // Combine decks with the new deck being created (if any) for display purposes
    const displayDecks = newDeck ? [...decks, newDeck] : decks

    return (
        <DecksHome onClick={() => setMenuDeckId('')}>
            <DecksHeading>Decks</DecksHeading>
            {error && <DecksError>{error}</DecksError>}
            {loading && decks.length === 0 && <DecksStatus>Loading decks...</DecksStatus>}

            <DecksGrid>
                {displayDecks.map(deck => {
                    // Bools for conditional rendering and button states
                    const isEditing = editingDeckId === deck._id
                    const isSaving = savingDeckId === deck._id
                    const stats = deckCardStats[deck._id] || { totalCards: 0, cardsDue: 0 }

                    return (
                        // Deck card component for each deck, with all necessary props and handlers. Man React is beautiful
                        <DeckCard
                            key={deck._id}
                            deck={deck}
                            isEditing={isEditing}
                            isSaving={isSaving}
                            editingName={editingName}
                            showMenu={menuDeckId === deck._id}
                            onToggleMenu={(event) => handleToggleMenu(event, deck._id)}
                            onStartRename={() => handleStartRename(deck)}
                            onDelete={() => handleDeleteDeck(deck)}
                            onNameChange={(event) => setEditingName(event.target.value)}
                            onSave={(event) => handleSaveDeck(event, deck)}
                            onCancel={() => handleCancelDeckEdit(deck)}
                            onOpenDeck={() => navigate(`/decks/${deck._id}`, {
                                state: { deckName: deck.name }
                            })}
                            deckStats={stats}
                        />
                    )
                })}

                {/* Card for adding a new deck, with its handler. */}
                <AddDeckCard onAddDeck={handleAddDeck} />
            </DecksGrid>
        </DecksHome>
    )
}

// Component for each deck card on the home page, w/ conditional rendering
function DeckCard({
    deck,
    isEditing,
    isSaving,
    editingName,
    deckStats,
    showMenu,
    onToggleMenu,
    onStartRename,
    onDelete,
    onNameChange,
    onSave,
    onCancel,
    onOpenDeck
}) {
    // To avoid having the "pointer" cursor on unopenable decks (like when editing or creating a new deck that hasn't been saved yet)
    const canOpenDeck = Boolean(onOpenDeck && !isEditing && !deck.isNew)

    return (
        // Okay it's about to get cool
        <Card
            $isEditing={isEditing}
            $canOpenDeck={canOpenDeck}
            onClick={canOpenDeck ? onOpenDeck : undefined}
        >
            {/* If the card is in editing mode, show the edit form, otherwise show the deck title and stats */}
            {isEditing ? (
                <DeckEditForm onSubmit={onSave}>
                    <DeckInput
                        type="text"
                        name="name"
                        value={editingName}
                        onChange={onNameChange}
                        placeholder="Deck title"
                        autoFocus
                    />
                    <DeckEditActions>
                        <CancelDeckBtn type="button" onClick={onCancel} disabled={isSaving}>
                            CANCEL
                        </CancelDeckBtn>
                        <SaveDeckBtn type="submit" disabled={isSaving}>
                            {isSaving ? 'SAVING...' : 'SAVE'}
                        </SaveDeckBtn>
                    </DeckEditActions>
                </DeckEditForm>
            ) : (
                <DeckTitle>{deck.name}</DeckTitle>
            )}

            {/* Only show stats when not editing, to avoid clutter and confusion. */}
            {!isEditing && (
                <DeckStats>
                    <DeckStatsLine><DeckStatsLabel>Total cards:</DeckStatsLabel> {deckStats?.totalCards || 0}</DeckStatsLine>
                    <DeckStatsLine><DeckStatsLabel>Cards due:</DeckStatsLabel> {deckStats?.cardsDue || 0}</DeckStatsLine>
                </DeckStats>
            )}

            {/* Info button for each deck, only shown for non-editing, non-new decks */}
            {!isEditing && !deck.isNew && (
                <>
                    <DeckInfoBtn
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation()
                            onToggleMenu(event)
                        }}
                        aria-label={`Deck options for ${deck.name}`}
                    >
                        i
                    </DeckInfoBtn>
                    {showMenu && (
                        <DeckTooltip onClick={(event) => event.stopPropagation()}>
                            <DeckTooltipBtn
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onStartRename()
                                }}
                            >
                                Rename
                            </DeckTooltipBtn>
                            <DeleteDeckBtn
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onDelete()
                                }}
                            >
                                Delete
                            </DeleteDeckBtn>
                        </DeckTooltip>
                    )}
                </>
            )}
        </Card>
    )
}

// Simple component for the "Add Deck" card, just a button with a plus symbol
function AddDeckCard({ onAddDeck }) {
    return (
        <AddDeckBtn type="button" onClick={onAddDeck} aria-label="Add deck">
            <AddDeckSymbol>⊕</AddDeckSymbol>
        </AddDeckBtn>
    )
}

export default Home

const Card = styled.article`
    border: 1px solid;
`

const DeckTitle = styled.h2``

const DeckStats = styled.div``

const DeckStatsLine = styled.p``

const DeckStatsLabel = styled.span``

const DeckEditForm = styled.form``

const DeckInput = styled.input``

const SaveDeckBtn = styled.button`
    cursor: pointer;

    &:disabled {
        cursor: not-allowed;
    }
`

const CancelDeckBtn = styled(SaveDeckBtn)``

const DeckEditActions = styled.div``

const DeckInfoBtn = styled.button``

const DeckTooltip = styled.div`
    border: 1px solid;
`

const DeckTooltipBtn = styled.button`
    cursor: pointer;
`

const DeleteDeckBtn = styled(DeckTooltipBtn)``

const AddDeckBtn = styled.button`
    border: 1px solid;
`

const AddDeckSymbol = styled.span``

const DecksHome = styled.section``

const DecksHeading = styled.h1``

const DecksGrid = styled.section``

const DecksError = styled.p``

const DecksStatus = styled.p``

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

    // Handler for viewing all cards in a deck
    const handleViewAll = async (deck) => {
        setMenuDeckId('')
        navigate(`/decks/${deck._id}`, {
            state: {
                deckName: deck.name,
                viewingAllCards: true
            }
        })
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
                            onViewAll={() => handleViewAll(deck)}
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
    onViewAll,
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
                            <DeckTooltipBtn
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onViewAll()
                                }}
                            >
                                View All
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
    position: relative;
    min-height: 180px;
    border: 1px solid ${props => props.theme.border};
    border-radius: 10px;
    background: ${props => props.theme.surface};
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.25rem;
    transition: background-color 180ms ease, border-color 180ms ease;
    cursor: ${props => props.$canOpenDeck ? 'pointer' : 'default'};
`

const DeckTitle = styled.h2`
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    text-align: center;
    line-height: 1.15;
    color: ${props => props.theme.text};

    @media (max-width: 640px) {
        font-size: 1rem;
    }
`

const DeckStats = styled.div`
    position: absolute;
    right: 0.75rem;
    bottom: 0.55rem;
    text-align: right;
    color: ${props => props.theme.text};
    font-size: 0.78rem;
    line-height: 1.22;
`

const DeckStatsLine = styled.p`
    margin: 0;
`

const DeckStatsLabel = styled.span`
    color: ${props => props.theme.muted};
`

const DeckEditForm = styled.form`
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    display: grid;
    gap: 0.65rem;
`

const DeckInput = styled.input`
    width: 100%;
    max-width: calc(100% - 1.25rem);
    border: 1px solid ${props => props.theme.border};
    border-radius: 8px;
    background: ${props => props.theme.bg};
    color: ${props => props.theme.text};
    font-size: 1.2rem;
    padding: 0.45rem 0.55rem;

    @media (max-width: 640px) {
        font-size: 1.2rem;
    }
`

const SaveDeckBtn = styled.button`
    border: none;
    background: transparent;
    color: ${props => props.theme.accent};
    font-size: 1rem;
    font-weight: 700;
    padding: 0.15rem 0;
    cursor: pointer;

    &:hover {
        background: transparent;
        color: ${props => props.theme.accent};
    }

    &:disabled {
        color: ${props => props.theme.muted};
        cursor: not-allowed;
    }
`

const CancelDeckBtn = styled(SaveDeckBtn)`
    color: ${props => props.theme.muted};

    &:hover {
        color: ${props => props.theme.text};
    }
`

const DeckEditActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
`

const DeckInfoBtn = styled.button`
    position: absolute;
    left: 10px;
    bottom: 10px;
    width: 18px;
    height: 18px;
    border: 1px solid ${props => props.theme.info};
    border-radius: 50%;
    background: transparent;
    color: ${props => props.theme.info};
    font-size: 0.75rem;
    line-height: 1;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        background: ${props => props.theme.bg};
    }
`

const DeckTooltip = styled.div`
    position: absolute;
    left: 32px;
    bottom: 22px;
    background: ${props => props.theme.surface};
    border-radius: 6px;
    border: 1px solid ${props => props.theme.border};
    padding: 0.35rem 0.55rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    box-shadow: 0 6px 18px rgba(47, 54, 64, 0.12);
`

const DeckTooltipBtn = styled.button`
    margin: 0;
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    color: ${props => props.theme.text};
    font-size: 0.92rem;
    line-height: 1.2;
    cursor: pointer;

    &:hover {
        background: transparent;
        text-decoration: underline;
    }
`

const DeleteDeckBtn = styled(DeckTooltipBtn)`
    color: ${props => props.theme.danger};
`

const AddDeckBtn = styled.button`
    min-height: 180px;
    border: 1px dashed transparent;
    border-radius: 12px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    cursor: pointer;

    &:hover {
        background: ${props => props.theme.surface};
        border-color: ${props => props.theme.border};
    }

    &:hover span {
        color: ${props => props.theme.text};
    }
`

const AddDeckSymbol = styled.span`
    font-size: 3.6rem;
    line-height: 1;
    color: ${props => props.theme.muted};
`

const DecksHome = styled.section`
    min-height: 100vh;
    padding: 2rem 3rem;
    background: ${props => props.theme.bg};
    color: ${props => props.theme.text};
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    transition: background-color 180ms ease, color 180ms ease;

    @media (max-width: 640px) {
        padding: 1rem;
    }
`

const DecksHeading = styled.h1`
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.15;
`

const DecksGrid = styled.section`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    width: min(1200px, 100%);
    margin: 6rem auto;

    @media (max-width: 1023px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 767px) {
        grid-template-columns: 1fr;
        margin-top: 3rem;
    }
`

const DecksError = styled.p`
    color: ${props => props.theme.danger};
    margin: 0 0 0.75rem;
`

const DecksStatus = styled.p`
    color: ${props => props.theme.muted};
`

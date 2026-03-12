import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

// Spaced repetition options with corresponding delay times and button tones. Will make this more dynamic later, hardcoding for now 
const SPACED_REP_OPTIONS = [
    { id: 'again', label: 'Again', delayMs: 1 * 60 * 1000, delayLabel: '1 min', tone: 'again' },
    { id: 'hard', label: 'Hard', delayMs: 10 * 60 * 1000, delayLabel: '10 min', tone: 'hard' },
    { id: 'good', label: 'Good', delayMs: 24 * 60 * 60 * 1000, delayLabel: '1 day', tone: 'good' },
    { id: 'easy', label: 'Easy', delayMs: 4 * 24 * 60 * 60 * 1000, delayLabel: '4 days', tone: 'easy' }
]

function Flashcards() {
    // State, hooks and constants
    const { deckId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const [allCards, setAllCards] = useState([])
    const [sessionCards, setSessionCards] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showCardMenu, setShowCardMenu] = useState(false)
    const [viewingAllCards, setViewingAllCards] = useState(
        Boolean(location.state?.viewingAllCards)
    )

    const API_BASE = process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000/api/v1'
        : process.env.REACT_APP_BASE_URL

    const deckName = location.state?.deckName || deckId || 'Deck'
    const cardsLeftCount = sessionCards.length

    // Load session cards on mount
    useEffect(() => {
        let ignore = false
        const loadTime = new Date()

        const fetchSessionCards = async () => {
            setLoading(true)
            setError('')

            try {
                const response = await fetch(`${API_BASE}/cards?deck=${deckId}`) // Yo I legit did this in ONE DAY, front and back. God I love dev
                const cards = await response.json()

                if (!response.ok) {
                    throw new Error(cards.message || 'Unable to load flashcards')
                }

                const dueCards = (cards || [])
                    .filter(card => new Date(card.showNext) <= loadTime)
                    .sort((a, b) => new Date(a.showNext) - new Date(b.showNext))

                if (!ignore) {
                    setSessionCards(dueCards)
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message || 'Unexpected error while loading cards')
                }
            } finally {
                if (!ignore) {
                    setLoading(false)
                }
            }
        }

        fetchSessionCards()

        return () => {
            ignore = true
        }
    }, [API_BASE, deckId])

    // Load cards for "view all" mode when that mode is activated
    useEffect(() => {
        setViewingAllCards(Boolean(location.state?.viewingAllCards))
        if (!viewingAllCards) {
            return
        }

        let ignore = false
        
        const fetchAllCards = async () => {
            setLoading(true)
            setError('')

            try {
                const response = await fetch(`${API_BASE}/cards?deck=${deckId}`)
                const cards = await response.json()

                if (!response.ok) {
                    throw new Error(cards.message || 'Unable to load flashcards')
                }

                // Sort by creation date, oldest to newest
                const allCards = (cards || [])
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

                if (!ignore) {
                    setAllCards(allCards)
                }
            } catch (err) {
                if (!ignore) {
                    setError(err.message || 'Unexpected error while loading cards')
                }
            } finally {
                if (!ignore) {
                    setLoading(false)
                }
            }
        }

        fetchAllCards()
        
        return () => {
            ignore = true
        }
    }, [location.state?.viewingAllCards, API_BASE, deckId])

    // Handler for navigating back to the home page
    const handleBack = () => {
        navigate('/')
    }

    return (
        // Next line: close the card menu if open when user clicks outside of it
        <FlashcardsPage onClick={() => setShowCardMenu(false)}> 
            <TopBar>
                <BackButton type="button" onClick={handleBack}>
                    Back
                </BackButton>

                <DeckName>{deckName}</DeckName>

                <StatsColumn>
                    <StatItem>
                        <StatValueHover>
                            <StatValue>{cardsLeftCount}</StatValue>
                            <StatTooltip>Cards left in this session</StatTooltip>
                        </StatValueHover>
                    </StatItem>
                </StatsColumn>
            </TopBar>

            <CardStage>
                {viewingAllCards ? (
                    <CardsGrid>
                        {allCards.map(card => {
                            return (
                                <Flashcard
                                    cardSet={allCards}
                                    setCardSet={setAllCards}
                                    loading={loading}
                                    setError={setError}
                                    apiBase={API_BASE}
                                    deckId={deckId}
                                    showCardMenu={showCardMenu}
                                    setShowCardMenu={setShowCardMenu}
                                    key={card._id}
                                />
                            )
                        })}
                    </CardsGrid>
                ) : (
                    <Flashcard
                        cardSet={sessionCards}
                        setCardSet={setSessionCards}
                        loading={loading}
                        setError={setError}
                        apiBase={API_BASE}
                        deckId={deckId}
                        showCardMenu={showCardMenu}
                        setShowCardMenu={setShowCardMenu}
                    />
                )}            
            </CardStage>

            {/* Errors at the end */}
            {error && <FlashcardsError>{error}</FlashcardsError>}
        </FlashcardsPage>
    )
}

function Flashcard({
    cardSet,
    setCardSet,
    loading,
    setError,
    apiBase,
    deckId,
    showCardMenu,
    setShowCardMenu,
    key
}) {
    const currentCard = cardSet.find(card => card._id === key) || null

    const [isFlipped, setIsFlipped] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isRating, setIsRating] = useState(false)
    const [editorValues, setEditorValues] = useState({
        front: '',
        back: ''
    })
    const frontEditorRef = useRef(null)

    // Handler for card clicks. Simple class toggle with CSS flip
    const handleFlipCard = () => {
        if (!currentCard || isEditing) {
            return
        }
        setIsFlipped(isCardFlipped => !isCardFlipped)
    }

    // Handler for starting the add flow
    const handleStartAddNew = () => {
        setEditorValues({ front: '', back: '' })
        setShowCardMenu(false)
        setIsFlipped(false)
        setIsEditing(true)
        setIsAddingNew(true)
        setError('')
    }

    // Handler for starting the edit flow, pre-fills editor with current card values
    const handleStartEdit = () => {
        if (!currentCard) {
            return
        }

        setEditorValues({
            front: currentCard.front || '',
            back: currentCard.back || ''
        })
        setShowCardMenu(false)
        setIsFlipped(false)
        setIsEditing(true)
        setIsAddingNew(false)
        setError('')
    }

    // Handler for cancel
    const handleCancelEdit = () => {
        setIsEditing(false)
        setIsAddingNew(false)
        setEditorValues({ front: '', back: '' })
        setError('')
    }

    // Handler for delete, confirms with user before deleting and moving to next card
    const handleDeleteCurrent = async () => {
        if (!currentCard) {
            return
        }

        setShowCardMenu(false)
        if (!window.confirm('Delete this card?')) {
            return
        }

        try {
            const response = await fetch(`${apiBase}/cards/${currentCard._id}`, {
                method: 'DELETE'
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Unable to delete card')
            }

            setCardSet(cards => cards.slice(1))
            setIsEditing(false)
            setIsFlipped(false)
        } catch (err) {
            setError(err.message || 'Unexpected error while deleting card')
        }
    }

    // AI-generated: keep editor flow keyboard-only by supporting Cmd/Ctrl+Enter on focused textareas.
    const handleEditorShortcut = (event) => {
        if (!(event.metaKey || event.ctrlKey) || event.key !== 'Enter') {
            return
        }
        if (isSaving) {
            return
        }

        event.preventDefault()
        handleSaveEditor(event, true)
    }

    // AI-generated: after save-and-continue actions, move focus back to Front for quick entry.
    const focusFrontEditor = () => {
        requestAnimationFrame(() => {
            frontEditorRef.current?.focus()
        })
    }

    // Handler for saving both new and edited cards. shouldAddNew functionality is vestigial, keeping it just in case I want it later.
    const handleSaveEditor = async (event, shouldAddNew = false) => {
        event.preventDefault()

        if (!isAddingNew && !currentCard) {
            return
        }

        const front = editorValues.front.trim()
        const back = editorValues.back.trim()

        if (!front || !back) {
            setError('Front and back text are both required')
            return
        }

        setIsSaving(true)
        setError('')

        // Alright this is really cool
        try {
            let savedCard = null

            // POST if adding new
            if (isAddingNew) {
                const response = await fetch(`${apiBase}/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        front,
                        back,
                        deck: deckId,
                        showNext: new Date().toISOString(),
                        lastShown: null
                    })
                })

                const createdCard = await response.json()
                if (!response.ok) {
                    throw new Error(createdCard.message || 'Unable to add card')
                }

                savedCard = createdCard
            } else { // PATCH if editing existing
                const response = await fetch(`${apiBase}/cards/${currentCard._id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        front,
                        back
                    })
                })

                const updatedCard = await response.json()
                if (!response.ok) {
                    throw new Error(updatedCard.message || 'Unable to save card')
                }

                savedCard = updatedCard
            }

            // Again, this is vestigial, but it allows for flexibility later without changing the core saving logic, so I'm keeping it in for now.
            if (shouldAddNew) {
                if (isAddingNew) {
                    setCardSet(cards => [savedCard, ...cards])
                } else {
                    setCardSet(cards => [savedCard, ...cards.slice(1)])
                }
                setEditorValues({ front: '', back: '' })
                setIsEditing(true)
                setIsAddingNew(true)
                focusFrontEditor()
            } else {
                if (isAddingNew) {
                    setCardSet(cards => [savedCard, ...cards])
                } else {
                    setCardSet(cards => [savedCard, ...cards.slice(1)])
                }
                setIsEditing(false)
                setIsAddingNew(false)
            }
        } catch (err) {
            setError(err.message || 'Unexpected error while saving card')
        } finally {
            setIsSaving(false)
        }
    }

    // Handler for rating a card after review. Key to spaced repetition functionality
    // Updates the card's showNext and lastShown based on the selected spaced repetition option, then moves to the next card.
    const handleRateCard = async (delayMs) => {
        if (!currentCard || isEditing) {
            return
        }

        setIsRating(true)
        setError('')

        try {
            const now = new Date()
            const showNext = new Date(now.getTime() + delayMs)

            const response = await fetch(`${apiBase}/cards/${currentCard._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    showNext: showNext.toISOString(),
                    lastShown: now.toISOString()
                })
            })

            const updatedCard = await response.json()
            if (!response.ok) {
                throw new Error(updatedCard.message || 'Unable to score card')
            }

            setCardSet(cards => cards.slice(1))
            setIsFlipped(false)
        } catch (err) {
            setError(err.message || 'Unexpected error while scoring card')
        } finally {
            setIsRating(false)
        }
    }

    return (
        <FlashcardShell>
            {/* Conditional rendering for flashcard view vs editor view */}
            {isEditing ? (
                <EditorForm onSubmit={handleSaveEditor} onClick={(event) => event.stopPropagation()}>
                    <HiddenLabel htmlFor="frontEditor">Front</HiddenLabel>
                    <EditorTextArea
                        id="frontEditor"
                        ref={frontEditorRef}
                        name="front"
                        value={editorValues.front}
                        onChange={(event) => setEditorValues(values => ({ ...values, front: event.target.value }))}
                        onKeyDown={handleEditorShortcut}
                        placeholder="Front text"
                        rows={4}
                        autoFocus
                    />

                    <HiddenLabel htmlFor="backEditor">Back</HiddenLabel>
                    <EditorTextArea
                        id="backEditor"
                        name="back"
                        value={editorValues.back}
                        onChange={(event) => setEditorValues(values => ({ ...values, back: event.target.value }))}
                        onKeyDown={handleEditorShortcut}
                        placeholder="Back text"
                        rows={4}
                    />

                    <EditorActions>
                        <EditorCancelButton
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                        >
                            CANCEL
                        </EditorCancelButton>
                        <EditorSecondaryButton
                            type="button"
                            onClick={(event) => handleSaveEditor(event, true)}
                            disabled={isSaving}
                        >
                            {isSaving ? 'SAVING...' : 'SAVE'}
                        </EditorSecondaryButton>
                    </EditorActions>
                </EditorForm>
            ) : (
                <FlipScene onClick={handleFlipCard}>
                    <FlipCard $isFlipped={isFlipped}>
                        <CardFace>
                            {currentCard ? currentCard.front : (loading ? 'Loading cards...' : 'No due cards')}
                        </CardFace>
                        <CardFace $isBackFace>
                            {currentCard ? currentCard.back : 'Add a new card to this deck'}
                        </CardFace>
                    </FlipCard>
                </FlipScene>
            )}

            {/* Only show the card menu button when not editing */}
            {!isEditing && (
                <>
                    <CardInfoButton
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation()
                            setShowCardMenu(menuOpen => !menuOpen)
                        }}
                        aria-label="Flashcard options"
                    >
                        i
                    </CardInfoButton>

                    {showCardMenu && (
                        <CardInfoMenu onClick={(event) => event.stopPropagation()}>
                            <CardInfoMenuButton type="button" onClick={handleStartAddNew}>
                                Add New
                            </CardInfoMenuButton>
                            <CardInfoMenuButton
                                type="button"
                                onClick={handleStartEdit}
                                disabled={!currentCard}
                            >
                                Edit
                            </CardInfoMenuButton>
                            <DeleteButton type="button" onClick={handleDeleteCurrent} disabled={!currentCard}>
                                Delete
                            </DeleteButton>
                        </CardInfoMenu>
                    )}
                </>
            )}

            {/* Only show review buttons when not editing, and only show them after the card has been flipped */}
            {!isEditing && isFlipped && currentCard && (
                <ReviewButtonsRow>
                    {SPACED_REP_OPTIONS.map(option => (
                        <ReviewOption key={option.id}>
                            <ReviewButton
                                type="button"
                                $tone={option.tone}
                                disabled={isRating}
                                onClick={() => handleRateCard(option.delayMs)}
                            >
                                {option.label}
                            </ReviewButton>
                            <ReviewDelay>{option.delayLabel}</ReviewDelay>
                        </ReviewOption>
                    ))}
                </ReviewButtonsRow>
            )}
        </FlashcardShell>
    )
}

export default Flashcards

const FlashcardsPage = styled.section`
    min-height: 100vh;
    padding: 2rem 3rem;
    background: ${props => props.theme.bg};
    color: ${props => props.theme.text};
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    transition: background-color 180ms ease, color 180ms ease;

    @media (max-width: 760px) {
        padding: 1rem;
    }
`

const CardsGrid = styled.section`
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

const TopBar = styled.header`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: start;
`

const BackButton = styled.button`
    justify-self: start;
    appearance: none;
    border: none;
    background: transparent;
    color: ${props => props.theme.text};
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.15;
    padding: 0;
    cursor: pointer;
    margin: 0 0 1.5rem;

    @media (max-width: 760px) {
        font-size: 1.2rem;
    }
`

const DeckName = styled.h1`
    justify-self: center;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;

    @media (max-width: 760px) {
        font-size: 1.35rem;
    }
`

const StatsColumn = styled.div`
    justify-self: end;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
`

const StatItem = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    gap: 0;
`

const StatValue = styled.span`
    min-width: 1.6rem;
    text-align: right;
    color: ${props => props.theme.text};
    font-size: 1.5rem;
    line-height: 1;
`

const StatValueHover = styled.div`
    position: relative;
    display: inline-flex;
    justify-content: flex-end;
    align-items: center;
    min-width: 1.6rem;

    &:hover > div {
        opacity: 1;
        transform: translateY(0);
    }
`

const StatTooltip = styled.div`
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    padding: 0.35rem 0.55rem;
    border-radius: 6px;
    background: ${props => props.theme.surface};
    border: 1px solid ${props => props.theme.border};
    color: ${props => props.theme.text};
    font-size: 0.86rem;
    opacity: 0;
    transform: translateY(-4px);
    transition: opacity 140ms ease, transform 140ms ease;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
`

const CardStage = styled.section`
    width: min(26rem, 100%);
    margin: 8rem auto 0;

    @media (max-width: 760px) {
        margin-top: 3rem;
    }
`

const FlashcardShell = styled.div`
    position: relative;
    min-height: 18rem;
    border: 1px solid ${props => props.theme.border};
    border-radius: 10px;
    background: ${props => props.theme.surface};
    box-sizing: border-box;
`

const FlipScene = styled.div`
    perspective: 1000px;
    width: 100%;
    height: 18rem;
    cursor: pointer;
`

const FlipCard = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 380ms ease;
    transform: ${props => props.$isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'};
`

const CardFace = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    padding: 1.6rem;
    border-radius: 10px;
    color: ${props => props.theme.text};
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
    transform: ${props => props.$isBackFace ? 'rotateY(180deg)' : 'rotateY(0deg)'};
    box-sizing: border-box;
    overflow-y: auto;
`

const CardInfoButton = styled.button`
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

const CardInfoMenu = styled.div`
    position: absolute;
    left: -6.2rem;
    bottom: -1.4rem;
    background: ${props => props.theme.surface};
    border: 1px solid ${props => props.theme.border};
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
`

const CardInfoMenuButton = styled.button`
    margin: 0;
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    color: ${props => props.theme.text};
    font-size: 1.25rem;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        text-decoration: none;
    }
`

const DeleteButton = styled(CardInfoMenuButton)`
    color: ${props => props.theme.danger};
`

const ReviewButtonsRow = styled.div`
    margin-top: 1rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.6rem;
`

const ReviewOption = styled.div`
    display: grid;
    grid-template-rows: auto auto;
    justify-items: center;
    gap: 0.25rem;
`

const ReviewButton = styled.button`
    border: none;
    border-radius: 10px;
    padding: 0.75rem 0.4rem;
    font-size: 1.3rem;
    font-weight: 700;
    cursor: pointer;
    background: ${props => {
        return props.theme.surface
    }};
    color: ${props => {
        if (props.$tone === 'again') return props.theme.danger
        if (props.$tone === 'hard') return props.theme.hard
        if (props.$tone === 'good') return props.theme.accent
        return props.theme.info
    }};
    border: 1px solid ${props => props.theme.border};

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`

const ReviewDelay = styled.span`
    font-size: 0.78rem;
    line-height: 1.1;
    color: ${props => props.theme.muted};
`

const EditorForm = styled.form`
    height: 100%;
    display: grid;
    grid-template-rows: auto auto auto;
    gap: 1rem;
    padding: 1rem;
`

const HiddenLabel = styled.label`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
`

const EditorTextArea = styled.textarea`
    width: 100%;
    border: 1px solid ${props => props.theme.border};
    border-radius: 8px;
    background: ${props => props.theme.bg};
    color: ${props => props.theme.text};
    font-size: 1.1rem;
    line-height: 1.4;
    padding: 0.75rem 0.85rem;
    resize: vertical;
    box-sizing: border-box;
`

const EditorSaveButton = styled.button`
    justify-self: end;
    border: none;
    background: transparent;
    color: ${props => props.theme.accent};
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        color: ${props => props.theme.accent};
    }

    &:disabled {
        color: ${props => props.theme.muted};
        cursor: not-allowed;
    }
`

const EditorSecondaryButton = styled(EditorSaveButton)`
    opacity: 0.9;
`

const EditorCancelButton = styled(EditorSaveButton)`
    color: ${props => props.theme.muted};

    &:hover {
        color: ${props => props.theme.text};
    }
`

const EditorActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
`

const FlashcardsError = styled.p`
    margin: 1rem auto 0;
    width: min(26rem, 100%);
    color: ${props => props.theme.danger};
    font-size: 0.95rem;
`

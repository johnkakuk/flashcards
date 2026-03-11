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

    const [sessionCards, setSessionCards] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isFlipped, setIsFlipped] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [showCardMenu, setShowCardMenu] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isRating, setIsRating] = useState(false)
    const [editorValues, setEditorValues] = useState({
        front: '',
        back: ''
    })
    const frontEditorRef = useRef(null)

    const API_BASE = process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000/api/v1'
        : process.env.REACT_APP_BASE_URL

    const deckName = location.state?.deckName || deckId || 'Deck'
    const currentCard = sessionCards[0] || null
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
            const response = await fetch(`${API_BASE}/cards/${currentCard._id}`, {
                method: 'DELETE'
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Unable to delete card')
            }

            setSessionCards(cards => cards.slice(1))
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
                const response = await fetch(`${API_BASE}/cards`, {
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
                const response = await fetch(`${API_BASE}/cards/${currentCard._id}`, {
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
                    setSessionCards(cards => [savedCard, ...cards])
                } else {
                    setSessionCards(cards => [savedCard, ...cards.slice(1)])
                }
                setEditorValues({ front: '', back: '' })
                setIsEditing(true)
                setIsAddingNew(true)
                focusFrontEditor()
            } else {
                if (isAddingNew) {
                    setSessionCards(cards => [savedCard, ...cards])
                } else {
                    setSessionCards(cards => [savedCard, ...cards.slice(1)])
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

            const response = await fetch(`${API_BASE}/cards/${currentCard._id}`, {
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

            setSessionCards(cards => cards.slice(1))
            setIsFlipped(false)
        } catch (err) {
            setError(err.message || 'Unexpected error while scoring card')
        } finally {
            setIsRating(false)
        }
    }

    // Handler for navigating back to the home page
    const handleBack = () => {
        navigate('/')
    }

    return (
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
                </FlashcardShell>

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
            </CardStage>

            {/* Errors at the end */}
            {error && <FlashcardsError>{error}</FlashcardsError>}
        </FlashcardsPage>
    )
}

export default Flashcards

const FlashcardsPage = styled.section``

const TopBar = styled.header``

const BackButton = styled.button`
    cursor: pointer;
`

const DeckName = styled.h1``

const StatsColumn = styled.div``

const StatItem = styled.div``

const StatValue = styled.span``

const StatValueHover = styled.div`
    position: relative;
    display: inline;

    &:hover > div {
        display: block;
    }
`

const StatTooltip = styled.div`
    border: 1px solid;
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    white-space: nowrap;
`

const CardStage = styled.section``

const FlashcardShell = styled.div`
    border: 1px solid;
    position: relative;
`

const FlipScene = styled.div`
    cursor: pointer;
`

const FlipCard = styled.div`
    position: relative;
    min-height: 16rem;
    transform-style: preserve-3d;
    transition: none;
    transform: ${props => props.$isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'};
`

const CardFace = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    transform: ${props => props.$isBackFace ? 'rotateY(180deg)' : 'rotateY(0deg)'};
    overflow-y: auto;
`

const CardInfoButton = styled.button`
    position: absolute;
    left: 0;
    bottom: 0;
`

const CardInfoMenu = styled.div`
    border: 1px solid;
    position: absolute;
    left: 0;
    bottom: 2rem;
`

const CardInfoMenuButton = styled.button`
    cursor: pointer;

    &:disabled {
        cursor: not-allowed;
    }
`

const DeleteButton = styled(CardInfoMenuButton)``

const ReviewButtonsRow = styled.div``

const ReviewOption = styled.div``

const ReviewButton = styled.button`
    cursor: pointer;

    &:disabled {
        cursor: not-allowed;
    }
`

const ReviewDelay = styled.span``

const EditorForm = styled.form``

const HiddenLabel = styled.label`
    display: none;
`

const EditorTextArea = styled.textarea``

const EditorSaveButton = styled.button`
    cursor: pointer;

    &:disabled {
        cursor: not-allowed;
    }
`

const EditorSecondaryButton = styled(EditorSaveButton)``

const EditorCancelButton = styled(EditorSaveButton)``

const EditorActions = styled.div``

const FlashcardsError = styled.p``

import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components'
import Home from './pages/Home'
import Flashcards from './pages/Flashcards'
import moonIcon from './images/np_moon_8138189_000000.svg'
import sunIcon from './images/np_sun_8202492_000000.svg'

const THEME_STORAGE_KEY = 'flashcards-theme'

const lightTheme = {
    bg: '#eceff1',
    surface: '#e1e6eb',
    text: '#2f3640',
    muted: '#647182',
    border: '#8ba4b5',
    accent: '#2f8b4f',
    hard: '#d9822b',
    danger: '#c0392b',
    info: '#5e6fc1',
    toggleShadow: '0 8px 20px rgba(20, 28, 37, 0.14)',
    toggleIconFilter: 'none'
}

const darkTheme = {
    bg: '#171c23',
    surface: '#242b36',
    text: '#e7edf5',
    muted: '#aab8c9',
    border: '#4d6472',
    accent: '#56c684',
    hard: '#ffb86c',
    danger: '#ff847a',
    info: '#98c4ff',
    toggleShadow: '0 8px 20px rgba(0, 0, 0, 0.32)',
    toggleIconFilter: 'invert(1)'
}

const getInitialTheme = () => {
    if (typeof window === 'undefined') {
        return 'light'
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
    const [themeMode, setThemeMode] = useState(getInitialTheme)

    useEffect(() => {
        window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
        document.documentElement.setAttribute('data-theme', themeMode)
    }, [themeMode])

    const isDarkMode = themeMode === 'dark'
    const activeTheme = isDarkMode ? darkTheme : lightTheme

    const handleToggleTheme = () => {
        setThemeMode(currentTheme => currentTheme === 'dark' ? 'light' : 'dark')
    }

    return (
        <ThemeProvider theme={activeTheme}>
            <GlobalThemeStyle />
            <Router>
                <Routes>
                    <Route path='/' exact element={<Home />} />
                    <Route path='/decks/:deckId' exact element={<Flashcards />} />
                </Routes>
                <ThemeToggleBtn
                    type="button"
                    onClick={handleToggleTheme}
                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={isDarkMode ? 'Light mode' : 'Dark mode'}
                >
                    <ThemeIconWrap>
                        <ThemeIcon
                            src={isDarkMode ? sunIcon : moonIcon}
                            alt={isDarkMode ? 'Sun icon' : 'Moon icon'}
                        />
                    </ThemeIconWrap>
                </ThemeToggleBtn>
            </Router>
        </ThemeProvider>
    )
}

export default App

const GlobalThemeStyle = createGlobalStyle`
    body {
        background: ${props => props.theme.bg};
        color: ${props => props.theme.text};
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.4;
        transition: background-color 180ms ease, color 180ms ease;
    }

    button,
    input,
    textarea,
    select {
        font-family: inherit;
    }
`

const ThemeToggleBtn = styled.button`
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    border-radius: 999px;
    border: 1px solid ${props => props.theme.border};
    background: ${props => props.theme.surface};
    box-shadow: ${props => props.theme.toggleShadow};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    z-index: 1200;
    cursor: pointer;

    &:hover {
        transform: translateY(-1px);
    }
`

const ThemeIconWrap = styled.span`
    width: 2.1rem;
    height: 2.1rem;
    border-radius: 999px;
    background: ${props => props.theme.bg};
    display: inline-flex;
    align-items: center;
    justify-content: center;
`

const ThemeIcon = styled.img`
    width: 1.25rem;
    height: 1.25rem;
    filter: ${props => props.theme.toggleIconFilter};
`

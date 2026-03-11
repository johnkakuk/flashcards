import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components'
import Home from './pages/Home'
import Flashcards from './pages/Flashcards'
import moonIcon from './images/np_moon_8138189_000000.svg'
import sunIcon from './images/np_sun_8202492_000000.svg'

const THEME_STORAGE_KEY = 'flashcards-theme'

const lightTheme = {
    bg: '#ffffff',
    surface: '#ffffff',
    text: '#111111',
    muted: '#555555',
    border: '#cccccc',
    accent: '#111111',
    hard: '#cc6600',
    danger: '#111111',
    info: '#111111',
    toggleShadow: 'none',
    toggleIconFilter: 'none'
}

const darkTheme = {
    bg: '#111111',
    surface: '#111111',
    text: '#f3f3f3',
    muted: '#cccccc',
    border: '#666666',
    accent: '#f3f3f3',
    hard: '#ff9933',
    danger: '#f3f3f3',
    info: '#f3f3f3',
    toggleShadow: 'none',
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
    }
`

const ThemeToggleBtn = styled.button`
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    border: 0;
    background: transparent;
    z-index: 1200;
    cursor: pointer;
`

const ThemeIconWrap = styled.span`
    display: inline;
`

const ThemeIcon = styled.img`
    width: 1rem;
    height: 1rem;
    filter: ${props => props.theme.toggleIconFilter};
`

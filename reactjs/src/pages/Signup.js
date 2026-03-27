import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import AuthService from '../services/auth.service'

function Signup({ onAuthSuccess }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')

    const handleSignup = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        try {
            await AuthService.signup(email, password).then (
                response => {
                    onAuthSuccess?.(response)
                },
                error => {
                    const fallbackError = error?.response?.data?.error
                        || error?.response?.data
                        || error?.message
                        || 'Failed to create an account'
                    setError(typeof fallbackError === 'string' ? fallbackError : 'Failed to create an account')
                }
            )
        } catch (err) {
            const fallbackError = err?.response?.data?.error
                || err?.response?.data
                || err?.message
                || 'Failed to create an account'
            setError(typeof fallbackError === 'string' ? fallbackError : 'Failed to create an account')
            console.error(err)
        }
    }
    
    return (
        <AuthPage>
            <AuthCard>
                <AuthHeading>Sign Up</AuthHeading>
                <AuthForm onSubmit={handleSignup}>
                    <FieldGroup>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <FieldInput
                            type="email"
                            id="email"
                            value={email}
                            placeholder="Email"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <FieldInput
                            type="password"
                            id="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </FieldGroup>
                    <FieldGroup>
                        <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                        <FieldInput
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </FieldGroup>
                    {error ? <AuthError>{error}</AuthError> : null}
                    <SubmitButton type="submit">Sign Up</SubmitButton>
                </AuthForm>
                <AuthFooter>
                    <span>Already have an account? </span>
                    <AuthLink to="/login">Log in here</AuthLink>
                </AuthFooter>
            </AuthCard>
        </AuthPage>
    )
}

export default Signup

// Lovingly styled by the ChatGPT man to match my existing style choices

const AuthPage = styled.main`
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1rem;
`

const AuthCard = styled.section`
    width: min(100%, 26rem);
    background: ${props => props.theme.surface};
    border: 1px solid ${props => props.theme.border};
    border-radius: 0.9rem;
    padding: 1.25rem;
`

const AuthHeading = styled.h1`
    margin: 0 0 1rem;
`

const AuthForm = styled.form`
    display: grid;
    gap: 0.9rem;
`

const FieldGroup = styled.div`
    display: grid;
    gap: 0.35rem;
`

const FieldLabel = styled.label`
    font-size: 0.92rem;
`

const FieldInput = styled.input`
    border: 1px solid ${props => props.theme.border};
    background: ${props => props.theme.bg};
    color: ${props => props.theme.text};
    border-radius: 0.5rem;
    padding: 0.65rem 0.75rem;
`

const AuthError = styled.p`
    margin: 0;
    color: ${props => props.theme.danger};
`

const SubmitButton = styled.button`
    border: 1px solid ${props => props.theme.border};
    background: ${props => props.theme.accent};
    color: #fff;
    border-radius: 0.5rem;
    padding: 0.6rem 0.8rem;
    cursor: pointer;
`

const AuthFooter = styled.p`
    margin: 1rem 0 0;
`

const AuthLink = styled(Link)`
    color: ${props => props.theme.info};
`

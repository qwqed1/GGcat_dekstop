import './AuthModal.css'
import { useState } from 'react'
import { X, User, Mail, Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useUser } from '../context/UserContext'

function AuthModal({ isOpen, onClose }) {
  const { t } = useLanguage()
  const { registerUser, loginUser, isRegistering } = useUser()
  
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError(t('auth.usernameRequired') || 'Username is required')
      return false
    }
    if (formData.username.length < 3) {
      setError(t('auth.usernameTooShort') || 'Username must be at least 3 characters')
      return false
    }
    if (mode === 'register') {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError(t('auth.invalidEmail') || 'Invalid email format')
        return false
      }
      if (!formData.password) {
        setError(t('auth.passwordRequired') || 'Password is required')
        return false
      }
      if (formData.password.length < 6) {
        setError(t('auth.passwordTooShort') || 'Password must be at least 6 characters')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t('auth.passwordMismatch') || 'Passwords do not match')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        await registerUser({
          username: formData.username.trim(),
          email: formData.email.trim() || null,
          password: formData.password,
        })
      } else {
        await loginUser({
          username: formData.username.trim(),
          password: formData.password,
        })
      }
      onClose()
    } catch (err) {
      setError(err.message || (mode === 'register' 
        ? (t('auth.registerError') || 'Registration failed') 
        : (t('auth.loginError') || 'Login failed')))
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-modal-header">
          <h2>{mode === 'login' 
            ? (t('auth.loginTitle') || 'Login') 
            : (t('auth.registerTitle') || 'Create Account')}</h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? (t('auth.loginSubtitle') || 'Enter your credentials to continue')
              : (t('auth.registerSubtitle') || 'Fill in your details to get started')}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>{t('auth.username') || 'Username'}</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder={t('auth.usernamePlaceholder') || 'Enter username'}
                autoComplete="username"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="auth-input-group">
              <label>{t('auth.email') || 'Email'} <span className="optional">({t('auth.optional') || 'optional'})</span></label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('auth.emailPlaceholder') || 'Enter email'}
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label>{t('auth.password') || 'Password'}</label>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('auth.passwordPlaceholder') || 'Enter password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
              <button 
                type="button" 
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="auth-input-group">
              <label>{t('auth.confirmPassword') || 'Confirm Password'}</label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('auth.confirmPasswordPlaceholder') || 'Confirm password'}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading 
              ? (t('common.loading') || 'Loading...') 
              : mode === 'login' 
                ? (t('auth.loginButton') || 'Login')
                : (t('auth.registerButton') || 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {mode === 'login' 
              ? (t('auth.noAccount') || "Don't have an account?")
              : (t('auth.hasAccount') || 'Already have an account?')}
          </span>
          <button type="button" onClick={switchMode}>
            {mode === 'login' 
              ? (t('auth.registerLink') || 'Sign up')
              : (t('auth.loginLink') || 'Login')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthModal

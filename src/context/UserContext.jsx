import { createContext, useContext, useState, useEffect } from 'react'
import * as usersApi from '../api/users'

const UserContext = createContext(null)

export const useUser = () => useContext(UserContext)

// Ключи для localStorage
const SETTINGS_KEY = 'gg_user_settings'
const AUTH_KEY = 'gg_auth_data'

// Настройки по умолчанию
const DEFAULT_SETTINGS = {
  hideLogin: true,      // Скрывать логин по умолчанию
  vibrationEnabled: true, // Вибрация включена по умолчанию
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(true) // Гость = не зарегистрирован
  const [isRegistering, setIsRegistering] = useState(false)
  
  // Настройки пользователя (хранятся локально)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Сохраняем настройки в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save settings:', e)
    }
  }, [settings])

  // Функция для обновления настроек
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  // Проверяем сохраненные данные авторизации при загрузке
  useEffect(() => {
    const checkSavedAuth = async () => {
      try {
        const savedAuth = localStorage.getItem(AUTH_KEY)
        if (savedAuth) {
          const authData = JSON.parse(savedAuth)
          if (authData.tg_id) {
            await initUser(authData)
            return
          }
        }
      } catch (e) {
        console.warn('Failed to restore auth:', e)
        localStorage.removeItem(AUTH_KEY)
      }
      // Если нет сохраненных данных - пользователь гость
      setLoading(false)
      setIsGuest(true)
    }
    
    // Проверяем Telegram WebApp
    const tg = window.Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      const tgUser = tg.initDataUnsafe.user
      initUser({
        tg_id: String(tgUser.id),
        username: tgUser.username || `tg_${tgUser.id}`,
        firstname: tgUser.first_name || 'Guest',
        photo_url: tgUser.photo_url || null,
      })
    } else {
      checkSavedAuth()
    }
  }, [])

  const initUser = async ({ tg_id, username, firstname, photo_url }) => {
    try {
      const existingUser = await usersApi.getUserByTgId(tg_id)
      
      // Обновляем аватар если он изменился в Telegram
      if (photo_url && existingUser.url_image !== photo_url) {
        try {
          const updatedUser = await usersApi.updateUser(existingUser.id, {
            url_image: photo_url,
          })
          setUser(updatedUser)
        } catch (updateErr) {
          console.warn('Failed to update avatar:', updateErr)
          setUser(existingUser)
        }
      } else {
        setUser(existingUser)
      }
      setIsGuest(false)
      // Сохраняем данные авторизации
      localStorage.setItem(AUTH_KEY, JSON.stringify({ tg_id, username, firstname, photo_url }))
    } catch (err) {
      if (err.message === 'User not found') {
        const newUser = await usersApi.createUser({
          tg_id,
          username,
          firstname,
          refLink: 'https://t.me/ggcat_game_bot?start=' + tg_id,
          url_image: photo_url || null,
        })
        setUser(newUser)
        setIsGuest(false)
        localStorage.setItem(AUTH_KEY, JSON.stringify({ tg_id, username, firstname, photo_url }))
      } else {
        console.error('User init error:', err)
        setIsGuest(true)
      }
    } finally {
      setLoading(false)
    }
  }

  // Регистрация нового пользователя (для десктопа)
  const registerUser = async ({ username, email, password }) => {
    setIsRegistering(true)
    try {
      // Генерируем уникальный tg_id для десктопного пользователя
      const tg_id = `desktop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newUser = await usersApi.createUser({
        tg_id,
        username,
        firstname: username,
        email: email || null,
        password, // Бэкенд должен хешировать
        refLink: `https://ggcat.org/ref/${tg_id}`,
        url_image: null,
      })
      
      setUser(newUser)
      setIsGuest(false)
      localStorage.setItem(AUTH_KEY, JSON.stringify({ 
        tg_id, 
        username, 
        firstname: username,
        photo_url: null 
      }))
      
      return newUser
    } catch (err) {
      console.error('Registration error:', err)
      throw err
    } finally {
      setIsRegistering(false)
    }
  }

  // Вход существующего пользователя
  const loginUser = async ({ username, password }) => {
    setIsRegistering(true)
    try {
      // Ищем пользователя по username
      // Примечание: нужен эндпоинт для логина на бэкенде
      const response = await usersApi.loginUser({ username, password })
      
      if (response && response.user) {
        setUser(response.user)
        setIsGuest(false)
        localStorage.setItem(AUTH_KEY, JSON.stringify({ 
          tg_id: response.user.tg_id, 
          username: response.user.username,
          firstname: response.user.firstname,
          photo_url: response.user.url_image
        }))
        return response.user
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      throw err
    } finally {
      setIsRegistering(false)
    }
  }

  // Выход из аккаунта
  const logout = () => {
    setUser(null)
    setIsGuest(true)
    localStorage.removeItem(AUTH_KEY)
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        initUser,
        loading,
        settings,
        updateSettings,
        isGuest,
        isRegistering,
        registerUser,
        loginUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

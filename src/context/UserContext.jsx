import { createContext, useContext, useState, useEffect } from 'react'
import * as usersApi from '../api/users'

const UserContext = createContext(null)

export const useUser = () => useContext(UserContext)

// Ключи для localStorage
const SETTINGS_KEY = 'gg_user_settings'

// Настройки по умолчанию
const DEFAULT_SETTINGS = {
  hideLogin: true,      // Скрывать логин по умолчанию
  vibrationEnabled: true, // Вибрация включена по умолчанию
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
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
      } else {
        console.error('User init error:', err)
      }
    } finally {
      setLoading(false)
    }
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
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

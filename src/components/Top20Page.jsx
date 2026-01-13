import { useMemo } from 'react'
import './Top20Page.css'
import Header from './Header'
import Navigation from './Navigation'
import { useCurrency } from '../context/CurrencyContext'
import { useLanguage } from '../context/LanguageContext'
import { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'
import * as usersApi from '../api/users'
import { maskUsername } from '../utils/maskUsername'




function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(value).replaceAll('\u00A0', ' ')
}

function Top20Page() {
  const { t } = useLanguage()
  const { user, settings } = useUser()
  const { selectedCurrency, formatAmount } = useCurrency()

  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadTop20 = async () => {
      try {
        const users = await usersApi.getUsers()

        const sorted = [...users]
          .filter(u => Number(u.balance) > 0)
          .sort((a, b) => Number(b.balance) - Number(a.balance))
          .slice(0, 20)
          .map((u, index) => ({
            id: u.id,
            rank: index + 1,
            name: u.username || u.firstname || 'User',
            avatar: u.url_image || '/image/default-avatar.png', // 👈 ВОТ ТУТ
            balance: Number(u.balance) || 0,
            isYou: Number(user?.id) === Number(u.id),
          }))
          

        if (mounted) setPlayers(sorted)
      } catch (e) {
        console.error('Failed to load top 20', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadTop20()
    return () => (mounted = false)
  }, [user?.id])


  return (
    <div className="app top20-page">
      <Header />

      <main className="main-content top20-content">
        <div className="top20-card">
          <div className="top20-title">{t('top20.title')}</div>

          <div className="top20-list">
            {players.map((player) => {
              const placeClass =
                player.rank === 1
                  ? 'top20-row--gold'
                  : player.rank === 2
                    ? 'top20-row--silver'
                    : player.rank === 3
                      ? 'top20-row--bronze'
                      : ''

              return (
                <div key={player.id} className={`top20-row ${placeClass} ${player.isYou ? 'top20-row--you' : ''}`.trim()}>
                  <div className="top20-left">
                    <div className="top20-rank">{player.rank}</div>
                    <div className="top20-avatar">
                    <img
  src={player.avatar}
  alt={player.name}
  onError={(e) => {
    e.currentTarget.src = '/image/default-avatar.png'
  }}
/>
                    </div>
                    <div className="top20-name">
                      {player.isYou && settings?.hideLogin ? maskUsername(player.name) : player.name}
                    </div>
                  </div>

                  <div className="top20-right">
                    {player.isYou && <span className="top20-you">{t('common.you')}</span>}
                    <div className="top20-score">
  {formatAmount(player.balance)}
</div>
                    <img
                      className="top20-currency"
                      src={selectedCurrency.icon}
                      alt={selectedCurrency.id}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <Navigation />
    </div>
  )
}

export default Top20Page

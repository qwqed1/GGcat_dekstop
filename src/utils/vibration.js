/**
 * Утилита для вибрации устройства
 * Использует Vibration API (navigator.vibrate)
 */

/**
 * Проверяет поддержку вибрации
 */
export function isVibrationSupported() {
  return 'vibrate' in navigator
}

/**
 * Вызывает вибрацию
 * @param {number|number[]} pattern - длительность в мс или паттерн [вибрация, пауза, вибрация, ...]
 */
export function vibrate(pattern = 50) {
  if (!isVibrationSupported()) return false
  
  try {
    return navigator.vibrate(pattern)
  } catch (e) {
    console.warn('Vibration failed:', e)
    return false
  }
}

/**
 * Останавливает вибрацию
 */
export function stopVibration() {
  if (!isVibrationSupported()) return
  navigator.vibrate(0)
}

// Предустановленные паттерны вибрации
export const VIBRATION_PATTERNS = {
  // Короткая вибрация для тиков
  tick: 30,
  // Средняя вибрация для действий
  action: 50,
  // Длинная вибрация для важных событий
  long: 100,
  // Паттерн для победы
  win: [100, 50, 100, 50, 200],
  // Паттерн для проигрыша
  lose: [200, 100, 200],
  // Паттерн для спина (рулетка/кейсы)
  spin: [30, 30, 30, 30, 30, 30, 30],
  // Паттерн для краша
  crash: [50, 30, 50, 30, 100],
  // Паттерн для обратного отсчета
  countdown: 80,
  // Продолжительная вибрация для вращения рулетки (6 секунд с интервалами)
  wheelSpin: [50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100, 50, 100],
  // Продолжительная вибрация для полёта ракеты (повторяется каждые 2 сек)
  rocketFlight: [30, 200, 30, 200, 30, 200, 30, 200, 30, 200],
}

export default vibrate

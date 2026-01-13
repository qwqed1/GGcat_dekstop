/**
 * Маскирует имя пользователя: первый символ + *** + последний символ
 * Например: "Ольга" -> "О***а", "mr_testman" -> "m*****n"
 */
export function maskUsername(name) {
  if (!name || typeof name !== 'string') return name

  const trimmed = name.trim()
  
  if (trimmed.length <= 2) {
    // Слишком короткое имя - показываем как есть с одной звёздочкой
    return trimmed[0] + '*'
  }
  
  if (trimmed.length <= 5) {
    // Короткое имя (3-5 символов) - первый + ** + последний
    return trimmed[0] + '**' + trimmed[trimmed.length - 1]
  }
  
  if (trimmed.length <= 8) {
    // Среднее имя (6-8 символов) - первый + *** + последний
    return trimmed[0] + '***' + trimmed[trimmed.length - 1]
  }
  
  // Длинное имя (>8 символов) - первый + ***** + последний
  return trimmed[0] + '*****' + trimmed[trimmed.length - 1]
}

export default maskUsername

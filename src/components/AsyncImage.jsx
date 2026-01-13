import { useState, useEffect } from 'react'

const AsyncImage = ({ src, alt, className, placeholder = '/image/mdi_gift.svg' }) => {
  const [loaded, setLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(placeholder)

  useEffect(() => {
    if (!src) return
    
    const img = new Image()
    img.src = src
    img.onload = () => {
      setLoaded(true)
      setCurrentSrc(src)
    }
    img.onerror = () => {
      // Keep placeholder or handle error
    }
    
    // Reset if src changes
    return () => {
      setLoaded(false)
      setCurrentSrc(placeholder)
    }
  }, [src, placeholder])

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} ${!loaded ? 'loading-placeholder' : ''}`}
    />
  )
}

export default AsyncImage

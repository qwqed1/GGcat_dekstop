import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import './Banner.css'

const bannerSlides = [
  { id: 1, image: '/image/Slide1.webp', alt: 'Promo banner 1' },
  { id: 2, image: '/image/Slide2.webp', alt: 'Promo banner 2' },
]

function Banner() {
  return (
    <div className="banner-carousel">
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="banner-swiper"
      >
        {bannerSlides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <img 
              src={slide.image} 
              alt={slide.alt} 
              className="banner-image"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default Banner

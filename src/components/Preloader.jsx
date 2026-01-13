import './Preloader.css'

function Preloader({ progress = 0 }) {
  return (
    <div className="preloader">
      <div className="preloader-content">
        <img src="/image/Logo.svg" alt="GG Cat Logo" className="preloader-logo" />

        <div className="preloader-progress-container">
          <div
            className="preloader-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="preloader-text">Loading...</p>
      </div>
    </div>
  )
}

export default Preloader

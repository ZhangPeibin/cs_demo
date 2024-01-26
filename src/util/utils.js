export function initGoogleSDK (callback) {
    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        callback()
      }
      document.body.appendChild(script)
    } else {
      callback()
    }
  }

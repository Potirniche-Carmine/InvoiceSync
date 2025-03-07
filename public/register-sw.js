if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    const shouldRegister = window.location.protocol === 'https:' || isLocalhost;
    
    if (shouldRegister) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registration successful with scope:', registration.scope);
          
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    } else {
      console.log('Service Worker not registered: Not HTTPS or localhost');
    }
  });
  
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'AUTH_ERROR') {
      window.location.href = '/?error=Session+expired';
    }
  });
}
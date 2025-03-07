if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.hostname !== 'localhost' && window.location.protocol === 'https:') {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registration successful');
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
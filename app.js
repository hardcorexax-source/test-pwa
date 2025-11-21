// Регистрация service worker и UI-логика
(function(){
  // UI элементы
  const statusEl = document.getElementById('online-status');
  const fetchBtn = document.getElementById('fetch-btn');
  const fetchResult = document.getElementById('fetch-result');

  // Обновление статуса онлайн/оффлайн
  function updateOnlineStatus(){
    statusEl.textContent = navigator.onLine ? 'онлайн' : 'оффлайн';
    statusEl.style.color = navigator.onLine ? 'green' : 'crimson';
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // Пробный сетевой запрос (можно заменить на любой API)
  fetchBtn.addEventListener('click', async () => {
    fetchResult.textContent = 'Выполняется запрос...';
    try {
      // здесь используем публичный API; если оффлайн — упадет и покажем сообщение
      const res = await fetch('https://jsonplaceholder.typicode.com/todos/1', {cache: 'no-store'});
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      fetchResult.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      fetchResult.textContent = 'Ошибка запроса: ' + err.message + '\n(Если вы оффлайн — это ожидаемо.)';
    }
  });

  // Регистрация service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('Service Worker зарегистрирован:', reg);
        })
        .catch(err => {
          console.warn('Ошибка регистрации Service Worker:', err);
        });
    });
  } else {
    console.warn('Service Workers не поддерживаются в этом браузере.');
  }
})();
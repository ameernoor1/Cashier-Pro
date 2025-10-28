// Service Worker محدث لـ Cash Pro PWA
const CACHE_NAME = 'cashpro-v2.0.0';
const RUNTIME_CACHE = 'cashpro-runtime-v2.0.0';

// الملفات الأساسية للتخزين المؤقت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './landing.html',
  './register.html',
  './app.html',
  './404.html',
  './manifest.webmanifest',
  './firebase-config.js',
  './subscription-manager.js',
  './cache-buster.js',
  './pwa-install.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-numbers.png'
];

// الملفات الخارجية المهمة
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap'
];

// حدث التثبيت
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching app shell');
        
        // تخزين الملفات الأساسية
        return cache.addAll(ASSETS_TO_CACHE)
          .catch((error) => {
            console.error('❌ Failed to cache some assets:', error);
            // المتابعة حتى لو فشل بعض الملفات
            return Promise.resolve();
          });
      })
      .then(() => {
        console.log('✅ Service Worker: Installed successfully');
        // تفعيل Service Worker الجديد فوراً
        return self.skipWaiting();
      })
  );
});

// حدث التفعيل
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // حذف النسخ القديمة من الـ cache
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated successfully');
        // السيطرة على جميع الصفحات فوراً
        return self.clients.claim();
      })
  );
});

// حدث الـ fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // تجاهل الطلبات غير HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // تجاهل طلبات Firebase و API
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('firebaseio') ||
      url.hostname.includes('googleapis')) {
    return;
  }
  
  // استراتيجية Cache First للأصول الثابتة
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // استراتيجية Network First للصفحات
  if (isHTMLPage(request)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // استراتيجية Network First للباقي
  event.respondWith(networkFirst(request));
});

// التحقق من كون الطلب لأصل ثابت
function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.webp', '.ico'];
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname.includes('/assets/') ||
         url.pathname.includes('/icons/');
}

// التحقق من كون الطلب لصفحة HTML
function isHTMLPage(request) {
  return request.headers.get('accept').includes('text/html');
}

// استراتيجية Cache First
async function cacheFirst(request) {
  try {
    // البحث في الـ cache أولاً
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('✅ Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // إذا لم يكن موجوداً في الـ cache، جلبه من الشبكة
    console.log('🌐 Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    // حفظ النسخة الجديدة في الـ cache
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Cache First failed:', error);
    
    // محاولة العودة إلى الـ cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إذا فشل كل شيء، إرجاع صفحة offline
    return caches.match('./404.html');
  }
}

// استراتيجية Network First
async function networkFirst(request) {
  try {
    // محاولة الجلب من الشبكة أولاً
    console.log('🌐 Network First - Fetching:', request.url);
    const networkResponse = await fetch(request);
    
    // حفظ النسخة الجديدة في الـ cache
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('⚠️ Network failed, trying cache:', request.url);
    
    // إذا فشلت الشبكة، العودة إلى الـ cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('✅ Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // إذا فشل كل شيء
    console.error('❌ Network First failed completely:', error);
    
    // إرجاع صفحة offline للصفحات HTML
    if (isHTMLPage(request)) {
      return caches.match('./404.html');
    }
    
    // إرجاع استجابة فارغة للباقي
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// حدث الرسائل
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ Service Worker: Skipping waiting');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Service Worker: Clearing cache');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// حدث المزامنة في الخلفية (اختياري)
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// دالة مزامنة البيانات (اختيارية)
async function syncData() {
  try {
    // يمكن إضافة منطق المزامنة هنا
    console.log('🔄 Syncing data...');
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return Promise.reject(error);
  }
}

// حدث الإشعارات (اختياري)
self.addEventListener('push', (event) => {
  console.log('📬 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد من كاش برو',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'cashpro-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('كاش برو', options)
  );
});

// حدث النقر على الإشعار (اختياري)
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('✅ Service Worker script loaded - Version:', CACHE_NAME);
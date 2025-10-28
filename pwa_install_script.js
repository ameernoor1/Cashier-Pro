// سكريبت تثبيت التطبيق كـ PWA مع رسالة محسنة
(function() {
    'use strict';
    
    let deferredPrompt;
    let installButton;
    let installBanner;
    
    // التحقق من إمكانية التثبيت
    function canInstall() {
        // التحقق من عدم تثبيت التطبيق مسبقاً
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('✅ التطبيق مثبت بالفعل');
            return false;
        }
        
        // التحقق من وجود beforeinstallprompt
        return true;
    }
    
    // إنشاء بانر التثبيت
    function createInstallBanner() {
        // إزالة البانر القديم إن وجد
        const oldBanner = document.getElementById('pwaInstallBanner');
        if (oldBanner) {
            oldBanner.remove();
        }
        
        const banner = document.createElement('div');
        banner.id = 'pwaInstallBanner';
        banner.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1.5rem 2rem;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
            z-index: 99999;
            max-width: 90%;
            width: 500px;
            text-align: center;
            animation: slideDown 0.5s ease;
            font-family: 'Cairo', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        `;
        
        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                <img 
                    src="./assets/icons/icon-192.png" 
                    alt="كاش برو" 
                    style="width: 60px; height: 60px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);"
                    onerror="this.style.display='none'"
                >
                <div style="flex: 1; text-align: right;">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.3rem; font-weight: bold;">
                        💰 كاش برو
                    </h3>
                    <p style="margin: 0; font-size: 0.95rem; opacity: 0.95;">
                        ثبت التطبيق على جهازك للوصول السريع
                    </p>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; width: 100%;">
                <button 
                    id="pwaInstallBtn" 
                    style="
                        flex: 1;
                        background: white;
                        color: #059669;
                        border: none;
                        padding: 0.8rem 1.5rem;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 1rem;
                        cursor: pointer;
                        font-family: 'Cairo', sans-serif;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                >
                    <i class="fas fa-download"></i> تثبيت الآن
                </button>
                
                <button 
                    id="pwaCloseBtn"
                    style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: 2px solid white;
                        padding: 0.8rem 1.5rem;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 1rem;
                        cursor: pointer;
                        font-family: 'Cairo', sans-serif;
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.2)'"
                >
                    لاحقاً
                </button>
            </div>
            
            <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.5rem;">
                ✨ مميزات: وصول سريع • يعمل بلا إنترنت • تجربة أفضل
            </div>
        `;
        
        // إضافة CSS للأنيميشن
        if (!document.getElementById('pwaInstallStyles')) {
            const style = document.createElement('style');
            style.id = 'pwaInstallStyles';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-50px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(banner);
        
        // إضافة مستمعي الأحداث
        installButton = document.getElementById('pwaInstallBtn');
        const closeButton = document.getElementById('pwaCloseBtn');
        
        installButton.addEventListener('click', installApp);
        closeButton.addEventListener('click', closeBanner);
        
        installBanner = banner;
        
        return banner;
    }
    
    // إغلاق البانر
    function closeBanner() {
        if (installBanner) {
            installBanner.style.animation = 'slideUp 0.5s ease';
            setTimeout(() => {
                installBanner.remove();
                installBanner = null;
            }, 500);
            
            // حفظ حالة الإغلاق
            localStorage.setItem('pwaInstallDismissed', Date.now());
        }
    }
    
    // تثبيت التطبيق
    async function installApp() {
        if (!deferredPrompt) {
            console.log('❌ لا يوجد حدث تثبيت متاح');
            return;
        }
        
        // إظهار رسالة التثبيت
        try {
            // عرض نافذة التثبيت الأصلية
            deferredPrompt.prompt();
            
            // انتظار اختيار المستخدم
            const choiceResult = await deferredPrompt.userChoice;
            
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ المستخدم قبل التثبيت');
                
                // إظهار رسالة نجاح
                showSuccessMessage();
                
                // إخفاء البانر
                closeBanner();
            } else {
                console.log('❌ المستخدم رفض التثبيت');
            }
            
            // إعادة تعيين المتغير
            deferredPrompt = null;
            
        } catch (error) {
            console.error('❌ خطأ في عملية التثبيت:', error);
        }
    }
    
    // إظهار رسالة النجاح
    function showSuccessMessage() {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1.5rem 2rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
            z-index: 99999;
            text-align: center;
            animation: slideDown 0.5s ease;
            font-family: 'Cairo', sans-serif;
        `;
        
        successMsg.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
            <div style="font-weight: bold; font-size: 1.2rem; margin-bottom: 0.5rem;">
                تم التثبيت بنجاح!
            </div>
            <div style="font-size: 0.95rem; opacity: 0.95;">
                يمكنك الآن الوصول إلى كاش برو من الشاشة الرئيسية
            </div>
        `;
        
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.style.animation = 'slideUp 0.5s ease';
            setTimeout(() => successMsg.remove(), 500);
        }, 4000);
    }
    
    // التحقق من عدم عرض البانر مؤخراً
    function shouldShowBanner() {
        const dismissed = localStorage.getItem('pwaInstallDismissed');
        if (!dismissed) return true;
        
        const dismissedTime = parseInt(dismissed);
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        // عرض البانر مرة أخرى بعد 3 أيام
        return (now - dismissedTime) > (dayInMs * 3);
    }
    
    // مستمع حدث beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('🎯 beforeinstallprompt event fired');
        
        // منع عرض النافذة التلقائية
        e.preventDefault();
        
        // حفظ الحدث للاستخدام لاحقاً
        deferredPrompt = e;
        
        // التحقق من إمكانية عرض البانر
        if (canInstall() && shouldShowBanner()) {
            // الانتظار قليلاً قبل عرض البانر
            setTimeout(() => {
                createInstallBanner();
            }, 2000);
        }
    });
    
    // مستمع لحدث تثبيت التطبيق
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA تم تثبيته');
        deferredPrompt = null;
        
        // إخفاء البانر إن كان موجوداً
        if (installBanner) {
            closeBanner();
        }
        
        // إظهار رسالة نجاح
        showSuccessMessage();
    });
    
    // التحقق من حالة التثبيت عند تحميل الصفحة
    window.addEventListener('load', () => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('✅ التطبيق يعمل في وضع standalone');
        } else {
            console.log('ℹ️ التطبيق يعمل في المتصفح');
        }
    });
    
    // دالة عامة لعرض البانر يدوياً
    window.showPWAInstallBanner = function() {
        if (canInstall() && deferredPrompt) {
            createInstallBanner();
        } else if (window.matchMedia('(display-mode: standalone)').matches) {
            alert('التطبيق مثبت بالفعل! 🎉');
        } else {
            alert('التثبيت غير متاح حالياً. يرجى المحاولة من متصفح يدعم PWA مثل Chrome أو Edge.');
        }
    };
    
    console.log('✅ نظام PWA Install جاهز');
    
})();
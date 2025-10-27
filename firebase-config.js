// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBGP3v4g2Mq8GyIBk3m7lN5dZ8-xYwR1pQ",
    authDomain: "cashier-system-iraq.firebaseapp.com",
    databaseURL: "https://cashier-system-iraq-default-rtdb.firebaseio.com",
    projectId: "cashier-system-iraq",
    storageBucket: "cashier-system-iraq.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// مرجع قاعدة البيانات
const database = firebase.database();

// دوال مساعدة
function generateUserId() {
    return 'USER-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function generateActivationCode(type) {
    const prefix = type === 'monthly' ? 'MONTHLY' : 'YEARLY';
    const code = Math.random().toString(36).substr(2, 12).toUpperCase();
    return `${prefix}-${code}`;
}

// حفظ بيانات المستخدم
async function saveUserData(userData) {
    try {
        const userId = generateUserId();
        const now = new Date();
        const subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 يوم

        const user = {
            userId: userId,
            name: userData.name,
            phone: userData.phone,
            country: userData.country,
            city: userData.city,
            street: userData.street,
            subscription: {
                type: userData.planType,
                status: 'free',
                start: now.toISOString(),
                end: subscriptionEnd.toISOString(),
                daysLeft: 30
            },
            createdAt: now.toISOString(),
            lastLogin: now.toISOString()
        };

        await database.ref('users/' + userId).set(user);
        
        // حفظ في localStorage
        localStorage.setItem('userId', userId);
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('userPhone', userData.phone);
        localStorage.setItem('subscriptionType', userData.planType);
        localStorage.setItem('subscriptionEnd', subscriptionEnd.toISOString());
        localStorage.setItem('subscriptionStatus', 'free');
        
        return { success: true, userId: userId };
    } catch (error) {
        console.error('Error saving user:', error);
        return { success: false, error: error.message };
    }
}

// التحقق من حالة الاشتراك
function checkSubscriptionStatus() {
    const subscriptionEnd = localStorage.getItem('subscriptionEnd');
    if (!subscriptionEnd) return { active: false, expired: true };

    const endDate = new Date(subscriptionEnd);
    const now = new Date();
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    return {
        active: daysLeft > 0,
        expired: daysLeft <= 0,
        daysLeft: Math.max(0, daysLeft),
        endDate: endDate
    };
}

// تفعيل الاشتراك برمز
async function activateSubscription(code) {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            return { success: false, error: 'المستخدم غير مسجل' };
        }

        // التحقق من الرمز في قاعدة البيانات
        const codeSnap = await database.ref('subscriptionCodes/' + code).once('value');
        const codeData = codeSnap.val();

        if (!codeData) {
            return { success: false, error: 'رمز الاشتراك غير موجود' };
        }

        if (codeData.used) {
            return { success: false, error: 'هذا الرمز مستخدم بالفعل' };
        }

        const now = new Date();
        let subscriptionEnd;
        let type;

        if (code.startsWith('MONTHLY-')) {
            subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            type = 'monthly';
        } else if (code.startsWith('YEARLY-')) {
            subscriptionEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            type = 'yearly';
        } else {
            return { success: false, error: 'رمز غير صالح' };
        }

        // تحديث بيانات المستخدم
        await database.ref('users/' + userId + '/subscription').update({
            type: type,
            status: 'active',
            start: now.toISOString(),
            end: subscriptionEnd.toISOString(),
            activationCode: code
        });

        // تحديث حالة الرمز
        await database.ref('subscriptionCodes/' + code).update({
            used: true,
            usedBy: userId,
            usedAt: now.toISOString()
        });

        // تحديث localStorage
        localStorage.setItem('subscriptionType', type);
        localStorage.setItem('subscriptionEnd', subscriptionEnd.toISOString());
        localStorage.setItem('subscriptionStatus', 'active');
        localStorage.setItem('activationCode', code);

        return { success: true, type: type, endDate: subscriptionEnd };
    } catch (error) {
        console.error('Error activating subscription:', error);
        return { success: false, error: error.message };
    }
}

// تحديث آخر تسجيل دخول
async function updateLastLogin() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        try {
            await database.ref('users/' + userId).update({
                lastLogin: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }
}

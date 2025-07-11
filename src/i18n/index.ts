import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.courses': 'Courses',
      'nav.attendance': 'Attendance',
      'nav.grades': 'Grades',
      'nav.contact': 'Contact',
      'nav.logout': 'Logout',
      'nav.login': 'Login',
      'nav.register': 'Register',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.submit': 'Submit',
      'common.email': 'Email',
      'common.password': 'Password',
      'common.name': 'Full Name',
      'common.role': 'Role',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.actions': 'Actions',
      'common.status': 'Status',
      'common.date': 'Date',
      'common.time': 'Time',
      'common.location': 'Location',
      'common.department': 'Department',
      'common.credits': 'Credits',
      'common.capacity': 'Capacity',
      'common.semester': 'Semester',
      'common.description': 'Description',
      'common.instructor': 'Instructor',
      'common.schedule': 'Schedule',
      'common.close': 'Close',
      'common.confirm': 'Confirm',
      'common.view': 'View',
      'common.download': 'Download',
      'common.upload': 'Upload',
      'common.create': 'Create',
      'common.update': 'Update',
      'common.manage': 'Manage',
      'common.overview': 'Overview',
      'common.details': 'Details',
      'common.settings': 'Settings',
      'common.profile': 'Profile',
      'common.notifications': 'Notifications',
      'common.recent': 'Recent',
      'common.all': 'All',
      'common.none': 'None',
      'common.yes': 'Yes',
      'common.no': 'No',
      
      // Auth
      'auth.login.title': 'Login to MyISU Portal',
      'auth.login.subtitle': 'Access your university dashboard',
      'auth.register.title': 'Create Account',
      'auth.register.subtitle': 'Join MyISU University',
      'auth.student': 'Student',
      'auth.faculty': 'Faculty',
      'auth.admin': 'Administrator',
      'auth.loginError': 'Invalid email or password',
      'auth.registerSuccess': 'Account created successfully',
      'auth.signOut': 'Sign Out',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.rememberMe': 'Remember me',
      'auth.alreadyHaveAccount': 'Already have an account?',
      'auth.dontHaveAccount': "Don't have an account?",
      
      // Dashboard
      'dashboard.welcome': 'Welcome to MyISU Portal',
      'dashboard.student.title': 'Student Dashboard',
      'dashboard.faculty.title': 'Faculty Dashboard',
      'dashboard.admin.title': 'Admin Dashboard',
      'dashboard.recentActivity': 'Recent Activity',
      'dashboard.quickActions': 'Quick Actions',
      'dashboard.stats': 'Statistics',
      'dashboard.summary': 'Summary',
      
      // Contact
      'contact.title': 'Contact Us',
      'contact.message': 'Message',
      'contact.send': 'Send Message',
      'contact.success': 'Message sent successfully',
      'contact.error': 'Error sending message',
      'contact.getInTouch': 'Get in touch',
      'contact.sendMessage': 'Send us a message',
      'contact.universityCampus': 'University Campus',
      'contact.officeHours': 'Office Hours',
      'contact.contactInformation': 'Contact Information',
      'contact.responseTime': 'Response Time',
      'contact.helpMessage': "We're here to help. Send us a message and we'll respond as soon as possible.",
      'contact.responseMessage': 'We typically respond to messages within 24 hours during business days.',
      'contact.urgentMatters': 'For urgent matters, please call our main number.',
      'contact.tellUsHow': 'Tell us how we can help you...',
      'contact.yourFullName': 'Your full name',
      'contact.yourEmail': 'your.email@example.com',
      'contact.sending': 'Sending...',
    },
  },
  ar: {
    translation: {
      // Navigation
      'nav.dashboard': 'لوحة التحكم',
      'nav.courses': 'المقررات',
      'nav.attendance': 'الحضور',
      'nav.grades': 'الدرجات',
      'nav.contact': 'اتصل بنا',
      'nav.logout': 'تسجيل الخروج',
      'nav.login': 'تسجيل الدخول',
      'nav.register': 'إنشاء حساب',
      
      // Common
      'common.loading': 'جاري التحميل...',
      'common.error': 'خطأ',
      'common.success': 'نجح',
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.add': 'إضافة',
      'common.submit': 'إرسال',
      'common.email': 'البريد الإلكتروني',
      'common.password': 'كلمة المرور',
      'common.name': 'الاسم الكامل',
      'common.role': 'الدور',
      'common.search': 'بحث',
      'common.filter': 'تصفية',
      'common.actions': 'الإجراءات',
      'common.status': 'الحالة',
      'common.date': 'التاريخ',
      'common.time': 'الوقت',
      'common.location': 'الموقع',
      'common.department': 'القسم',
      'common.credits': 'الساعات المعتمدة',
      'common.capacity': 'السعة',
      'common.semester': 'الفصل الدراسي',
      'common.description': 'الوصف',
      'common.instructor': 'المدرس',
      'common.schedule': 'الجدول',
      'common.close': 'إغلاق',
      'common.confirm': 'تأكيد',
      'common.view': 'عرض',
      'common.download': 'تحميل',
      'common.upload': 'رفع',
      'common.create': 'إنشاء',
      'common.update': 'تحديث',
      'common.manage': 'إدارة',
      'common.overview': 'نظرة عامة',
      'common.details': 'التفاصيل',
      'common.settings': 'الإعدادات',
      'common.profile': 'الملف الشخصي',
      'common.notifications': 'الإشعارات',
      'common.recent': 'الأحدث',
      'common.all': 'الكل',
      'common.none': 'لا يوجد',
      'common.yes': 'نعم',
      'common.no': 'لا',
      
      // Auth
      'auth.login.title': 'تسجيل الدخول إلى بوابة MyISU',
      'auth.login.subtitle': 'الوصول إلى لوحة تحكم الجامعة',
      'auth.register.title': 'إنشاء حساب',
      'auth.register.subtitle': 'انضم إلى جامعة MyISU',
      'auth.student': 'طالب',
      'auth.faculty': 'عضو هيئة تدريس',
      'auth.admin': 'مدير',
      'auth.loginError': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'auth.registerSuccess': 'تم إنشاء الحساب بنجاح',
      'auth.signOut': 'تسجيل الخروج',
      'auth.forgotPassword': 'نسيت كلمة المرور؟',
      'auth.rememberMe': 'تذكرني',
      'auth.alreadyHaveAccount': 'لديك حساب بالفعل؟',
      'auth.dontHaveAccount': 'ليس لديك حساب؟',
      
      // Dashboard
      'dashboard.welcome': 'مرحباً بك في بوابة MyISU',
      'dashboard.student.title': 'لوحة تحكم الطالب',
      'dashboard.faculty.title': 'لوحة تحكم عضو هيئة التدريس',
      'dashboard.admin.title': 'لوحة تحكم المدير',
      'dashboard.recentActivity': 'النشاط الأخير',
      'dashboard.quickActions': 'الإجراءات السريعة',
      'dashboard.stats': 'الإحصائيات',
      'dashboard.summary': 'الملخص',
      
      // Contact
      'contact.title': 'اتصل بنا',
      'contact.message': 'الرسالة',
      'contact.send': 'إرسال الرسالة',
      'contact.success': 'تم إرسال الرسالة بنجاح',
      'contact.error': 'خطأ في إرسال الرسالة',
      'contact.getInTouch': 'تواصل معنا',
      'contact.sendMessage': 'أرسل لنا رسالة',
      'contact.universityCampus': 'الحرم الجامعي',
      'contact.officeHours': 'ساعات العمل',
      'contact.contactInformation': 'معلومات الاتصال',
      'contact.responseTime': 'وقت الاستجابة',
      'contact.helpMessage': 'نحن هنا للمساعدة. أرسل لنا رسالة وسنرد في أقرب وقت ممكن.',
      'contact.responseMessage': 'نرد عادة على الرسائل خلال 24 ساعة في أيام العمل.',
      'contact.urgentMatters': 'للأمور العاجلة، يرجى الاتصال على رقمنا الرئيسي.',
      'contact.tellUsHow': 'أخبرنا كيف يمكننا مساعدتك...',
      'contact.yourFullName': 'اسمك الكامل',
      'contact.yourEmail': 'your.email@example.com',
      'contact.sending': 'جاري الإرسال...',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
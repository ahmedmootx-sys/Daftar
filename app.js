'use strict';

/* =====================================================================
   Daftar - متابعة حضور وغياب الدروس (متعدد الأقسام، كل درس شهره المستقل)
   مجموعات + ملاحظات يومية + تذكيرات + أعمدة إضافية + دخل + تصدير/استيراد دروس
   ===================================================================== */

const STORAGE_KEY = '***';

/* ---------- بيانات المسؤول الثابتة ---------- */
const ADMIN_NAME = 'Ahmed Saber Sayed Hamed';
const ADMIN_PHONE = '+20 12 83279337';
const MASTER_RESET_CODE = '967925868934670272500351';
const APP_NAME = 'Daftar';

/* ---------- الحفظ التلقائي في ملف ---------- */
let fileHandle = null;
let autoSaveReady = false;
let autoSaveTimer = null;
const AUTOSAVE_FLAG = 'attendance_autosave_prompted';

/* ---------- أدوات مساعدة ---------- */
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const DAY_NAMES   = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const STATUS_COLORS = ['#2563eb','#7c3aed','#0891b2','#db2777','#ea580c','#4d7c0f','#9333ea','#0e7490'];
const GROUP_LETTERS = ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];
const REMINDERS = [
  { value: 0,    label: 'بدون تذكير' },
  { value: 30,   label: 'قبل نصف ساعة' },
  { value: 60,   label: 'قبل ساعة' },
  { value: 180,  label: 'قبل 3 ساعات' },
  { value: 1440, label: 'قبل يوم' }
];
const REMINDER_PRESETS = [0, 30, 60, 180, 1440];
const APP_VERSION = 'v32';
const CHANGELOG = {
  v32: [
    '🚫 منع تكرار الطلاب وتأكيد النقل: فحص مسبق للأسماء لمنع تكرار أو نقل أي طالب مسجل مسبقاً في الدرس المستهدف مع رسالة تأكيد تفصيلية توضح عدد الطلاب والأسماء المكررة المتخطاة قبل التنفيذ',
    '📲 مراسلة جماعية مجمعة من عدة شهور ومصادر: إمكانية تحديد وإرسال الرسائل لطلاب من الشهر الحالي وشهور مؤرشفة معاً في جلسة إرسال متتابع واحدة مع منع تكرار المراسلة للطالب المشترك تلقائياً',
    '📝 ضبط وتجاوب جدول درجات الاختبارات على الموبايل: إصلاح مشكلة كبر عمود اسم الطالب وثباته لتظهر خانات الدرجات والمتوسط بوضوح وسلاسة مع إمكانية التمرير الأفقي الحر على الهواتف',
    '🎯 تخصيص واختيار الطلاب في المراسلة الجماعية: إمكانية تحديد الطلاب يدوياً باختيار فردي أو بأزرار سريعة (الحاضرون فقط، الغائبون فقط، تحديد الكل) مع البحث الفوري'
  ],
  v31: [
    '🎯 تخصيص تصدير تيليجرام: إمكانية اختيار تصدير النسخة الكاملة أو تحديد درس/دروس معينة قبل إرسال النسخة لمحادثة تيليجرام',
    '🖼️ إرفاق الصور في المراسلة الجماعية: إرفاق بوستر أو صورة امتحان مع الرسائل المتتابعة ومشاركتها ونسخها بسهولة لواتساب',
    '🛡️ حماية تصفير كلمة سر الدخل: اشتراط إدخال كود التفعيل المعتمد (المقدم من المطور) لتصفير كلمة المرور لحماية البيانات المالية'
  ],
  v30: [
    '⚡ التحضير السريع الجماعي: تعيين حالة لجميع طلاب الحصة بنقرة واحدة (تحضير الكل / تغييب الكل / اعتذار / تفريغ)',
    '📲 المراسلة التسلسلية الذكية: إرسال رسائل فردية سريعة ومتتابعة للغائبين أو لجميع الطلاب عبر واتساب بقوالب مخصصة',
    '💰 سجل مصروفات ومدفوعات الطالب: تتبع الأقساط ورسوم الملازم والكتب لدروس الاشتراك مع شارات سداد دقيقة',
    '📝 جدول درجات الاختبارات المستقل: رصد درجات الامتحانات والواجبات في جدول مخصص ومدمج في تقارير الشهر والواتساب',
    '📊 لوحة المؤشرات والتحليلات: نظرة سريعة في الرئيسية لإجمالي الطلاب والحصص ونسب الحضور مع رسوم بيانية ومقارنات',
    '☑️ التحديد المتعدد ونقل الطلاب: تحديد عدة طلاب ونقلهم أو تكرارهم بين المجموعات والدروس مع خيار ترحيل سجل الحضور',
    '☁️ النسخ الاحتياطي السحابي الهجين: مشاركة سريعة عبر Google Drive وتطبيقات الهاتف، وإرسال تلقائي لمحادثة تيليجرام',
    '🔄 إعادة الضبط والبدء من جديد: تصفير كلمة سر الدخل، أو تفريغ درس محدد، أو استرجاع الإعدادات، أو تصفير شامل مع رسائل تأكيد لحماية البيانات'
  ],
  v29: [
    '👤 ملف الطالب (Profile): بطاقة شخصية متكاملة للطالب بصورته ومهنته/وظيفته وعنوانه وعمره وإيميله وملاحظاته الخاصة وإحصائيات حضوره',
    '🔄 تحريك الحصص وترتيبها التلقائي: إدراج الحصة زمنياً بحسب تاريخها، مع إمكانية سحبها يميناً ويساراً وتعديل مسمياتها',
    '⚙️ تجديد قسم الإعدادات: دمج الأعمدة الإضافية مع إمكانية إعادة ترتيبها، وإزالة العناوين غير المستغلة',
    '🔘 تحويل مفاتيح التفعيل إلى سويتشات حديثة (الاشتراك، التذكير، الإشعارات، الحفظ التلقائي) في قالب موحد',
    '🔔 ظهور إشعار التحديث مرة واحدة فقط عند نزول كل إصدار، مع بقائه متاحاً دائماً من شريط الإشعارات'
  ],
  v28: [
    '🔔 سجل "ما الجديد" داخل شريط الإشعارات: اقرأ تحديثات فاتتك في أي وقت، واحذف الإشعار متى شئت',
    '⚠️ تنبيه عند تسجيل حضور في يوم لم يأتي بعد — بدون منع، وقابل للإيقاف من الإعدادات'
  ],
  v27: [
    '📄 تقارير PDF أصبحت عمودية (Portrait) مضغوطة: صفوف أقصر وخط أصغر لاستيعاب طلاب أكثر في الصفحة وتوفير الورق'
  ],
  v26: [
    '🛠️ إصلاح تداخل رقم الترتيب "م" مع اسم الطالب في ورقة الحضور المطبوعة: توسيع عمود الرقم وتصغير صندوق الرقم الأصفر ومنع الفيضان'
  ],
  v25: [
    '🔢 عمود "م" (رقم الترتيب) في أول الجداول المصدّرة: تقرير الشهر، التقرير الشامل، وورقة الحضور',
    '🖨️ ورقة الحضور الفارغة أصبحت عمودية (Portrait) وتستوعب 15 طالبًا في الصفحة',
    '🎨 خلية الاسم في ورقة الحضور: الاسم بارز والهاتف أسفله مع تظليل أصفر خفيف'
  ],
  v24: [
    '📅 تقرير الشهر: اختيار فترة (من يوم - إلى يوم) وإعادة حساب النسب والتقارير عليها',
    '📅 التقرير الشامل: نفس فلتر الفترة الزمنية - الحصص خارج الفترة تُستبعد من كل الشهور',
    '📊 Excel التقرير الشامل: خلية الشهر الواحدة فيها عدد الحضور (5/9) والنسبة تحتها'
  ],
  v23: [
    '📞 حذف رمز الدولة (+20) من أرقام الهواتف في كل التقارير المصدّرة (PDF/Excel)',
    '📊 تقرير شامل جديد: جدول نسب حضور الطلاب عبر كل الشهور - كل عمود شهر فيه عدد مرات الحضور والنسبة، مع تضمين الشهر الحالي حتى آخر حصة',
    '📱 إصلاح القوائم المنسدلة: تثبيت القائمة في مكانها مع سكرول داخلي (فوق/تحت/يمين/يسار) بدون قطع الخيارات'
  ],
  v22: [
    '⚠️ مؤشر خطر الغياب: كل طالب بيظهر بجانبه مؤشر ملون (مثالي/متابعة/إنقاذ) حسب نسبة حضوره - قابل للتخصيص من الإعدادات',
    '📁 عند التصدير: اختيار مكان حفظ الملف بنفسك (Chrome/Edge)',
    '💡 إشعار تذكير بالتصدير: لو سجّلت حضور/غياب ولم تصدّر، يظهر تنبيه صغير',
    '🎯 تبسيط الأزرار: شريط أدوات نظيف بقوائم منسدلة بدل 14 زر مزدحم',
    '📊 التقارير والمؤشرات تعتمد على الحصص اللي فاتت بس - مش كل الشهر (الحصص المستقبلية لا تحسب غياب)'
  ],
  v21: [
    '👨‍👩‍👦 دروس الاشتراك الشهري: رقم للطالب + رقم لولي الأمر + أرقام إضافية للطالبين',
    '📱 الدروس العادية: إضافة أكثر من رقم هاتف لنفس العضو',
    '📖 زر «جهات الاتصال»: اختيار الرقم مباشرة من جهات اتصال الجهاز بدل النسخ واللصق (يعمل على Chrome بالموبايل)',
    '🛠️ إصلاح زر «ملخص الحصة» الذي توقف عن العمل'
  ],
  v19: [
    '📄 ورقة حضور فارغة جاهزة للطباعة: زر «ورقة حضور» يطلع ورقة A4 بأسماء الطلاب وأيام الحصص واسم الدرس والشهر - مربعات الحضور فارغة عشان تكتب فيها يدويًا بعد الطباعة',
    '⬇️ خيار Excel (CSV) كمان للورقة الفارغة'
  ],
  v18: [
    '📤/📥 تصدير واستيراد شهر مؤرشف منفصل (دمج بدون التأثير على الباقي)',
    '📚 تصدير الدرس يشمل شهوره المؤرشفة - والاستيراد يجلب كل بياناته',
    '🏷️ تسمية حالات درس معين فقط (مثل: تم → حضر) دون باقي الدروس',
    '🛠️ صلاحيات كاملة للشهر المؤرشف: إضافة/حذف حصة، تعديل التاريخ والحدث، ملخص الحصة، وتقرير كرسالة - دون استبدال الشهر الحالي'
  ],
  v17: [
    '♻️ استعادة شهر مؤرشف: يرجع للصفحة الرئيسية لتعديل ترتيب الطلاب/البيانات، ثم تعيد أرشفته'
  ],
  v16: [
    '📨 تقرير الشهر كرسالة واتساب (نِسب كل الطلاب مرتبة) - للجروب أو أي رقم',
    '✏️ تعديل الشهور المؤرشفة: الحالات والملاحظات والدفع تُحفظ في الأرشيف مباشرة'
  ],
  v15: [
    '📤 ملخص حضور الطالب: يوضح أي حصص حضر / اعتذر / لم يحضر + نسبة الحضور، مع إرساله واتساب (الشهر أو كل الشهور)',
    '⚡ تحسين سرعة التطبيق على الموبايل: تغيير الحالة أصبح فورياً بدون إعادة رسم الجدول كاملاً'
  ],
  v14: [
    '📝 إضافة حدث لحصة معينة (مثل: اختبار) ويظهر في تقرير الشهر/الطباعة',
    '📤 زر ملخص الحصة: من حضر / لم يحضر / اعتذر - يُرسل للمشرف واتساب',
    '📊 تحسين تصدير Excel: اسم الطالب ورقمه في خلية واحدة (الاسم فوق والرقم تحته)'
  ],
  v13: [
    '👥 رابط جروب واتساب مستقل لكل مجموعة داخل الدرس (يظهر في قائمة الرسالة الأسبوعية)',
    '📊 تقرير شامل PDF/Excel: اسم الطالب + رقم الهاتف + نسبة الحضور عبر كل الشهور المؤرشفة',
    '🧮 عداد حضور لكل حصة (عدد الطلاب الحاضرين «تم» / إجمالي الطلاب)'
  ],
  v12: [
    '🔎 البحث عن الطالب برقم ترتيبه (داخل الدرس وفي البحث العام)',
    '↔️ تحريك الجدول يمين/يسار بالماوس من أي مكان فيه (كمبيوتر)',
    '📈 زر ترتيب الطلاب حسب نسبة الحضور (الأعلى أولاً)',
    '💾 اسم ملف تصدير الدرس يشمل اسم الدرس + الشهر + وقت التصدير',
    '🆕 رسالة التحديثات تظهر عند كل تحديث جديد'
  ],
  v11: [
    '📋 نسخ تلقائي للرسالة عند الإرسال لجروب واتساب',
    '🖱️ تمرير تلقائي + بكرة الماوس أثناء سحب الطالب',
    '📴 العرض بدون إنترنت (Service Worker)',
    '🔔 طلب صلاحية الإشعارات تلقائياً'
  ],
  v10: [
    '📱 اختيار نوع الواتساب (عادي/أعمال) عند إرسال رسالة لطالب',
    '🔑 استرجاع كلمة سر الدخل عبر سؤال أمان',
    '🛡️ إصلاح فقدان بيانات الحضور عند تعديل المجموعات'
  ]
};

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function uid(prefix){
  return (prefix||'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}
function digits(p){ return String(p||'').replace(/\D/g,''); }
function normalizePhone(p){
  let d = digits(p);
  if(!d) return '';
  if(d.startsWith('00')) d = d.slice(2);
  if(d.startsWith('0'))  d = '20' + d.slice(1);
  if(!d.startsWith('20')) d = '20' + d;
  return '+' + d;
}
/* رقم محلي بدون رمز الدولة (للتقارير والطباعة) */
function localPhone(p){
  let d = digits(p);
  if(!d) return '';
  if(d.startsWith('00')) d = d.slice(2);
  if(d.startsWith('20')) d = '0' + d.slice(2);
  return d;
}
function waHref(phone, text){
  const num = digits(phone);
  const business = (state && state.settings && state.settings.whatsappType === 'business');
  if(business){
    return 'https://api.whatsapp.com/send?phone=' + num + (text ? '&text=' + encodeURIComponent(text) : '');
  }
  return 'https://wa.me/' + num + (text ? '?text=' + encodeURIComponent(text) : '');
}

/* نسخ الصورة إلى حافظة المتصفح للصق المباشر في واتساب */
async function copyImageToClipboard(imgObj){
  if(!imgObj || !navigator.clipboard || !window.ClipboardItem) return false;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgObj.dataUrl;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const pngBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if(!pngBlob) return false;
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob })
    ]);
    return true;
  } catch(e) {
    console.warn('Clipboard image copy failed:', e);
    return false;
  }
}
function b64(buf){ return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
function unb64(s){ const bin = atob(s); const a = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) a[i]=bin.charCodeAt(i); return a; }

function formatTime12(t){
  if(!t) return '';
  const parts = String(t).split(':');
  const h = parseInt(parts[0],10), m = parseInt(parts[1]||'0',10);
  if(isNaN(h)) return String(t);
  const hh = h % 12 || 12;
  const suffix = h >= 12 ? 'م' : 'ص';
  return hh + ':' + String(m).padStart(2,'0') + ' ' + suffix;
}
function reminderLabel(min){
  const r = REMINDERS.find(x => x.value === min);
  return r ? r.label : ('قبل ' + min + ' دقيقة');
}
function reminderOptionsHTML(selected){
  const custom = !REMINDER_PRESETS.includes(selected);
  return REMINDERS.map(r => '<option value="'+r.value+'"'+(String(r.value)===String(selected)?' selected':'')+'>'+r.label+'</option>').join('')
    + '<option value="custom"'+(custom?' selected':'')+'>مخصص...</option>';
}
function groupReminderHTML(g, gi){
  const val = g.reminderMinutes;
  const custom = !REMINDER_PRESETS.includes(val);
  return '<select class="g-rem" data-gi="'+gi+'" onchange="groupRemChanged('+gi+', this.value, this)">'
    + REMINDERS.map(r => '<option value="'+r.value+'"'+(String(r.value)===String(val)?' selected':'')+'>'+r.label+'</option>').join('')
    + '<option value="custom"'+(custom?' selected':'')+'>مخصص...</option>'
    + '</select>'
    + '<input type="number" class="g-rem-custom" data-gi="'+gi+'" min="1" placeholder="دقائق" value="'+(custom?val:'')+'" style="display:'+(custom?'':'none')+'" oninput="editingGroups['+gi+'].reminderMinutes=parseInt(this.value,10)||0">';
}
function groupRemChanged(gi, val, sel){
  const row = sel.closest('.group-row');
  const num = row ? row.querySelector('.g-rem-custom') : null;
  if(val === 'custom'){
    if(num){
      num.style.display = '';
      const cur = editingGroups[gi].reminderMinutes;
      if(!cur || REMINDER_PRESETS.includes(cur)) num.value = '';
      num.focus();
    }
  } else {
    if(num) num.style.display = 'none';
    editingGroups[gi].reminderMinutes = parseInt(val,10) || 0;
  }
}

/* ---------- بحث تقريبي (عربي) ---------- */
function normalizeForSearch(s){
  return String(s||'')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0600-\u06FFa-z0-9]/g, '');
}

/* ---------- تجزئة كلمة السر ---------- */
async function sha256Hex(str){
  if(window.crypto && crypto.subtle){
    try{
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    }catch(e){}
  }
  let h = 0;
  for(let i=0;i<str.length;i++){ h = ((h<<5)-h + str.charCodeAt(i))|0; }
  return 'x' + Math.abs(h).toString(16);
}

/* ---------- القيم الافتراضية ---------- */
function defaultStatuses(){
  return [
    { id:'st_done',     label:'تم',          color:'#15803d' },
    { id:'st_apology',  label:'اعتذار',       color:'#b45309' },
    { id:'st_noanswer', label:'لم يتم الرد',   color:'#dc2626' }
  ];
}
function nowMonth(){ return { monthNumber: new Date().getMonth()+1, year: new Date().getFullYear() }; }
function todayStr(){ return new Date().toISOString().slice(0,10); }

function defaultState(){
  const m = nowMonth();
  return {
    version: 6,
    settings: {
      appTitle: 'جدول حضور وغياب',
      monthTitleTemplate: 'جدول حضور وغياب شهر {month}',
      studentLabel: 'اسم الطالب',
      notesLabel: 'ملاحظات',
      customFields: [],
      statuses: defaultStatuses(),
      whatsappNumber: '+201038805435',
      whatsappType: 'normal',
      warnFutureAttendance: true,
      tgBotToken: '',
      tgChatId: '',
      hideDashboardMoney: false,
      messageTemplate: 'السلام عليكم ورحمة الله وبركاته\n\nأخباركم إن شاء الله تكونو بخير\n\nبنأكد على معاد النهاردة الساعة {time} وجزاكم الله خيراً',
      ownerName: ADMIN_NAME,
      ownerPhone: ADMIN_PHONE,
      attendanceIndicators: [
        { id: 'ideal', label: 'مثالي', color: '#15803d', minPct: 90 },
        { id: 'watch', label: 'متابعة', color: '#b45309', minPct: 50 },
        { id: 'rescue', label: 'إنقاذ', color: '#dc2626', minPct: 0 }
      ]
    },
    moneyPasswordHash: '',
    moneySecurityQ: '',
    moneySecurityA: '',
    lessons: [],
    archive: []
  };
}

function monthKey(year, month){ return year + '-' + String(month).padStart(2,'0'); }

/* ---------- تحميل/تطبيع ---------- */
function normalizePayment(p){
  return {
    id: p.id || uid('pay'),
    date: p.date || todayStr(),
    amount: Number(p.amount) || 0,
    type: p.type || 'subscription',
    note: typeof p.note === 'string' ? p.note : ''
  };
}
function normalizeExam(e){
  return {
    id: e.id || uid('ex'),
    name: e.name || 'اختبار',
    date: e.date || todayStr(),
    maxScore: Number(e.maxScore) > 0 ? Number(e.maxScore) : 20
  };
}
function normalizeStudent(st){
  return {
    id: st.id || uid('s'),
    name: st.name || '',
    phone: normalizePhone(st.phone),
    guardianPhone: normalizePhone(st.guardianPhone || ''),
    extraPhones: Array.isArray(st.extraPhones) ? st.extraPhones.map(normalizePhone).filter(Boolean) : [],
    guardianExtraPhones: Array.isArray(st.guardianExtraPhones) ? st.guardianExtraPhones.map(normalizePhone).filter(Boolean) : [],
    paid: !!st.paid,
    groupId: st.groupId || '',
    fields: (st.fields && typeof st.fields === 'object') ? st.fields : {},
    address: typeof st.address === 'string' ? st.address : '',
    job: typeof st.job === 'string' ? st.job : '',
    age: (typeof st.age === 'string' || typeof st.age === 'number') ? String(st.age) : '',
    email: typeof st.email === 'string' ? st.email : '',
    photo: typeof st.photo === 'string' ? st.photo : '',
    profileNotes: typeof st.profileNotes === 'string' ? st.profileNotes : '',
    payments: Array.isArray(st.payments) ? st.payments.map(normalizePayment) : []
  };
}
function normalizeGroup(g){
  return {
    id: g.id || uid('g'),
    name: g.name || 'مجموعة',
    time: g.time || '18:00',
    reminderMinutes: (typeof g.reminderMinutes === 'number') ? g.reminderMinutes : 60,
    waGroup: g.waGroup || ''
  };
}
function normalizeState(raw){
  const base = defaultState();
  const fm = nowMonth();
  const settings = Object.assign({}, base.settings, raw.settings || {});
  if(!Array.isArray(settings.statuses) || settings.statuses.length === 0) settings.statuses = base.settings.statuses;
  if(!Array.isArray(settings.customFields)) settings.customFields = base.settings.customFields;
  settings.customFields = settings.customFields
    .map(f => ({ id: f.id || uid('f'), label: (f.label || '').trim() }))
    .filter(f => f.label);
  settings.whatsappType = (settings.whatsappType === 'business') ? 'business' : 'normal';
  settings.warnFutureAttendance = settings.warnFutureAttendance !== false;
  settings.tgBotToken = (raw.settings && typeof raw.settings.tgBotToken === 'string') ? raw.settings.tgBotToken : '';
  settings.tgChatId = (raw.settings && typeof raw.settings.tgChatId === 'string') ? raw.settings.tgChatId : '';
  settings.hideDashboardMoney = !!(raw.settings && raw.settings.hideDashboardMoney);
  settings.ownerName = ADMIN_NAME;
  settings.ownerPhone = ADMIN_PHONE;
  /* مؤشرات خطر الغياب */
  if(!Array.isArray(settings.attendanceIndicators) || settings.attendanceIndicators.length < 3){
    settings.attendanceIndicators = base.settings.attendanceIndicators;
  } else {
    settings.attendanceIndicators = settings.attendanceIndicators.map((ind, i) => ({
      id: ind.id || base.settings.attendanceIndicators[i]?.id || ('ind_'+i),
      label: ind.label || base.settings.attendanceIndicators[i]?.label || '',
      color: ind.color || base.settings.attendanceIndicators[i]?.color || '#64748b',
      minPct: (typeof ind.minPct === 'number') ? ind.minPct : (base.settings.attendanceIndicators[i]?.minPct || 0)
    }));
  }

  let lessons = [];
  if(Array.isArray(raw.lessons) && raw.lessons.length){
    lessons = raw.lessons.map(L => {
      const cur = L.current || {};
      const monthNumber = (typeof L.monthNumber === 'number') ? L.monthNumber
        : (typeof cur.monthNumber === 'number') ? cur.monthNumber
        : (raw.settings && typeof raw.settings.monthNumber === 'number') ? raw.settings.monthNumber
        : fm.monthNumber;
      const year = (typeof L.year === 'number') ? L.year
        : (typeof cur.year === 'number') ? cur.year
        : (raw.settings && typeof raw.settings.year === 'number') ? raw.settings.year
        : fm.year;
      return {
        id: L.id || uid('L'),
        name: L.name || 'درس',
        schedule: (Array.isArray(L.schedule) && L.schedule.length) ? L.schedule : [5],
        subscription: !!L.subscription,
        price: (typeof L.price === 'number') ? L.price : 0,
        waGroup: L.waGroup || '',
        time: L.time || '18:00',
        reminderMinutes: (typeof L.reminderMinutes === 'number') ? L.reminderMinutes : 60,
        remindHeadOnly: !!L.remindHeadOnly,
        statusLabels: (L.statusLabels && typeof L.statusLabels === 'object') ? L.statusLabels : {},
        groups: Array.isArray(L.groups) ? L.groups.map(normalizeGroup) : [],
        students: Array.isArray(L.students) ? L.students.map(normalizeStudent) : [],
        monthNumber, year,
        sessions: (Array.isArray(L.sessions) ? L.sessions : (Array.isArray(cur.sessions) ? cur.sessions : [])),
        records: (L.records && typeof L.records === 'object') ? L.records : ((cur.records && typeof cur.records === 'object') ? cur.records : {}),
        exams: Array.isArray(L.exams) ? L.exams.map(normalizeExam) : [],
        examScores: (L.examScores && typeof L.examScores === 'object') ? L.examScores : {},
        lastExportAt: L.lastExportAt || null
      };
    });
  } else if(Array.isArray(raw.students)){
    const m = nowMonth();
    lessons = [{
      id: 'L1',
      name: 'الدرس الأول',
      schedule: (raw.settings && typeof raw.settings.lessonDay === 'number') ? [raw.settings.lessonDay] : [5],
      subscription: false,
      price: 0,
      waGroup: '',
      time: '18:00',
      reminderMinutes: 60,
      remindHeadOnly: false,
      statusLabels: {},
      groups: [],
      students: raw.students.map(normalizeStudent),
      monthNumber: (raw.currentMonth && raw.currentMonth.monthNumber) || m.monthNumber,
      year: (raw.currentMonth && raw.currentMonth.year) || m.year,
      sessions: (raw.currentMonth && raw.currentMonth.weeks) || [],
      records: (raw.currentMonth && raw.currentMonth.records) || {}
    }];
  }
  if(lessons.length === 0) lessons = JSON.parse(JSON.stringify(base.lessons));

  lessons.forEach(L => {
    if(!Array.isArray(L.students)) L.students = [];
    if(!Array.isArray(L.sessions)) L.sessions = [];
    if(!Array.isArray(L.groups)) L.groups = [];
    if(!L.records || typeof L.records !== 'object') L.records = {};
    if(L.sessions.length === 0) fillSessions(L);
  });

  let archive = [];
  if(Array.isArray(raw.archive)){
    archive = raw.archive.map(a => ({
      id: a.id || uid('a'),
      lessonId: a.lessonId || '',
      lessonName: a.lessonName || '',
      monthNumber: a.monthNumber,
      year: a.year,
      subscription: !!a.subscription,
      students: Array.isArray(a.students) ? a.students.map(normalizeStudent) : [],
      sessions: (Array.isArray(a.sessions) ? a.sessions : a.weeks) || [],
      records: a.records || {},
      archivedAt: a.archivedAt || new Date().toISOString()
    }));
  }

  return { version: 6, settings, moneyPasswordHash: (typeof raw.moneyPasswordHash === 'string') ? raw.moneyPasswordHash : '', moneySecurityQ: (typeof raw.moneySecurityQ === 'string') ? raw.moneySecurityQ : '', moneySecurityA: (typeof raw.moneySecurityA === 'string') ? raw.moneySecurityA : '', lessons, archive };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const s = JSON.parse(raw);
    if(!s || typeof s !== 'object') return null;
    return normalizeState(s);
  }catch(e){
    return null;
  }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleAutoSave();
}

let state = loadState() || defaultState();
saveState();

/* ---------- توليد الحصص ---------- */
function sessionDates(year, monthNumber, schedule){
  const out = [];
  const d = new Date(year, monthNumber - 1, 1);
  while(d.getMonth() === monthNumber - 1){
    if(schedule.includes(d.getDay())) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function formatDate(d){
  return DAY_NAMES[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth()+1);
}
function fillSessions(lesson){
  const dates = sessionDates(lesson.year, lesson.monthNumber, lesson.schedule);
  lesson.sessions = dates.map((d, i) => ({
    id: uid('ss'),
    label: 'حصة ' + (i+1),
    date: d.toISOString().slice(0,10),
    dateLabel: formatDate(d)
  }));
}
function genSessions(lesson, confirmLoss){
  const hasRecords = Object.keys(lesson.records || {}).some(sid => Object.keys(lesson.records[sid] || {}).length > 0);
  if(confirmLoss && hasRecords){
    if(!window.confirm('يوجد تسجيلات حالية في هذا الدرس. توليد الحصص سيحذف بيانات الحضور الحالية. متابعة؟')) return;
  }
  fillSessions(lesson);
  if(confirmLoss) lesson.records = {};
  saveState();
}
function sortLessonSessions(lesson){
  if(!lesson || !Array.isArray(lesson.sessions)) return;
  lesson.sessions.sort((a,b) => {
    if(a.date && b.date) return a.date.localeCompare(b.date);
    if(a.date && !b.date) return -1;
    if(!a.date && b.date) return 1;
    return 0;
  });
}
function shiftSession(lesson, sessionId, dir){
  if(!lesson || !Array.isArray(lesson.sessions)) return;
  const idx = lesson.sessions.findIndex(x => x.id === sessionId);
  if(idx < 0) return;
  const targetIdx = idx + dir;
  if(targetIdx < 0 || targetIdx >= lesson.sessions.length) return;
  const tmp = lesson.sessions[idx];
  lesson.sessions[idx] = lesson.sessions[targetIdx];
  lesson.sessions[targetIdx] = tmp;
  saveState();
  renderLessonDetail();
}
function addSession(lesson){
  const n = lesson.sessions.length + 1;
  lesson.sessions.push({ id: uid('ss'), label: 'حصة ' + n, date:'', dateLabel:'' });
  saveState();
}
function addSessionModal(lesson){
  if(!lesson) return;
  const n = (lesson.sessions ? lesson.sessions.length : 0) + 1;
  const defaultName = 'حصة ' + n;
  const todayStr = new Date().toISOString().slice(0,10);
  const presets = ['حصة ' + n, 'حصة إضافية', 'حصة مراجعة', 'اختبار', 'تدريب عملي'];
  const chipsHTML = presets.map(p => '<button type="button" class="preset-chip" data-val="'+esc(p)+'">'+esc(p)+'</button>').join('');

  openModal('➕ إضافة حصة جديدة',
    '<div class="form-row"><label>اسم ومسمى الحصة<input id="new_sess_name" type="text" value="'+esc(defaultName)+'"></label>'
    + '<div class="preset-chips">'+chipsHTML+'</div></div>'
    + '<div class="form-row"><label>تاريخ الحصة (اختياري - يحدد موضعها وترتيبها الزمني تلقائياً)<input id="new_sess_date" type="date" value="'+todayStr+'"></label></div>'
    + '<div class="modal-actions"><button class="btn" id="new_sess_save">حفظ وإدراج الحصة</button><button class="btn btn-outline" id="new_sess_cancel">إلغاء</button></div>'
  );

  $$('#modalBody .preset-chip').forEach(btn => {
    btn.onclick = () => { $('#new_sess_name').value = btn.dataset.val; };
  });

  $('#new_sess_cancel').onclick = closeModal;
  $('#new_sess_save').onclick = () => {
    const lbl = ($('#new_sess_name').value || '').trim() || defaultName;
    const dt = ($('#new_sess_date').value || '').trim();
    let dtLabel = '';
    if(dt){
      const d = new Date(dt);
      dtLabel = isNaN(d) ? dt : formatDate(d);
    }
    const newSession = { id: uid('ss'), label: lbl, date: dt, dateLabel: dtLabel };
    lesson.sessions.push(newSession);
    if(dt){
      sortLessonSessions(lesson);
    }
    saveState();
    renderAll();
    closeModal();
    showToastMessage('تمت إضافة «' + esc(lbl) + '» ' + (dt ? 'وترتيبها زمنياً بنجاح' : ''));
  };
}

/* ---------- حالة العرض ---------- */
let currentLessonId = null;
let globalSearchQuery = '';
let lessonFilterQuery = '';
let groupFilterQuery = '';
let moneyUnlocked = false;
let dragState = { dragId: null, touchTimer: null, touchActive: false, ghost: null, startX: 0, startY: 0, row: null, suppressNative: false };
let hScroll = { active:false, wrap:null, startX:0, startY:0, startScroll:0, horiz:false };
let fieldSaveTimer = null;

/* ---------- الدخل ---------- */
function moneyData(){
  let total = 0, collected = 0, lessons = [];
  state.lessons.forEach(L => {
    if(L.subscription && (L.price||0) > 0){
      const cnt = L.students.length;
      const paid = L.students.filter(s => s.paid).length;
      const t = cnt * L.price, c = paid * L.price;
      total += t; collected += c;
      lessons.push({ name: L.name, total: t, collected: c, cnt, paid });
    }
  });
  return { total, collected, lessons };
}
function moneyMasked(){ return !moneyUnlocked; }
function moneyDisplay(v){ return moneyMasked() ? '***' : String(v || 0); }

function askMoneyPassword(){
  return new Promise((resolve) => {
    openModal('🔒 أدخل كلمة السر لرؤية الدخل',
      '<div class="form-row"><label>كلمة المرور<input id="pwd" type="password" autocomplete="new-password"></label></div>'
      + '<div class="modal-actions"><button class="btn" id="pwd_ok">موافق</button><button class="btn btn-outline" id="pwd_forgot">نسيت كلمة السر؟</button><button class="btn btn-outline" id="pwd_cancel">إلغاء</button></div>');
    $('#pwd_ok').onclick = () => { const v = $('#pwd').value; closeModal(); resolve({ ok:true, forgot:false, value:v }); };
    $('#pwd_forgot').onclick = () => { closeModal(); resolve({ ok:false, forgot:true }); };
    $('#pwd_cancel').onclick = () => { closeModal(); resolve({ ok:false, forgot:false }); };
  });
}

async function revealMoney(){
  if(state.moneyPasswordHash){
    const r = await askMoneyPassword();
    if(r.forgot){ await forgotMoneyPassword(); return; }
    if(!r.ok) return;
    const h = await sha256Hex(r.value);
    if(h === state.moneyPasswordHash){ moneyUnlocked = true; renderAll(); }
    else { alert('كلمة السر غير صحيحة.'); }
  } else {
    await setupMoneyPassword();
  }
}

async function setupMoneyPassword(){
  openModal('🔑 عيّن كلمة سر جديدة للدخل',
    '<div class="form-row"><label>كلمة السر<input id="mp_pwd" type="password" autocomplete="new-password"></label></div>'
    + '<div class="form-row"><label>سؤال الأمان (اختياري - للاسترجاع لو نسيت)<input id="mp_q" type="text" placeholder="مثال: ما اسم أول مدرسة؟"></label></div>'
    + '<div class="form-row"><label>إجابة سؤال الأمان<input id="mp_a" type="text"></label></div>'
    + '<div class="modal-actions"><button class="btn" id="mp_ok">حفظ</button><button class="btn btn-outline" id="mp_cancel">إلغاء</button></div>');
  const res = await new Promise(resolve => {
    $('#mp_ok').onclick = () => { const r = { p: $('#mp_pwd').value, q: $('#mp_q').value.trim(), a: $('#mp_a').value.trim() }; closeModal(); resolve(r); };
    $('#mp_cancel').onclick = () => { closeModal(); resolve(null); };
  });
  if(!res) return;
  if(res.p.length < 4){ alert('استخدم كلمة سر أطول (4 أحرف على الأقل).'); return; }
  if(res.q && !res.a){ alert('اكتب إجابة سؤال الأمان أو اترك السؤال فارغاً.'); return; }
  state.moneyPasswordHash = await sha256Hex(res.p);
  if(res.q && res.a){
    state.moneySecurityQ = res.q;
    state.moneySecurityA = await sha256Hex(normalizeForSearch(res.a));
  }
  moneyUnlocked = true;
  saveState(); renderAll();
}

async function forgotMoneyPassword(){
  if(!state.moneySecurityQ || !state.moneySecurityA){
    openResetPasswordAuthModal();
    return;
  }
  openModal('🔑 استرجاع كلمة السر',
    '<p class="muted">سؤال الأمان: <b>' + esc(state.moneySecurityQ) + '</b></p>'
    + '<div class="form-row"><label>إجابتك<input id="mp_ans" type="text"></label></div>'
    + '<div style="margin:10px 0;text-align:center"><button class="btn btn-outline btn-sm" id="mp_use_master" type="button">🔑 ناسي الإجابة؟ تصفير عبر كود تفعيل المطور</button></div>'
    + '<div class="modal-actions"><button class="btn" id="mp_verify">تحقق</button><button class="btn btn-outline" id="mp_cancel">إلغاء</button></div>');
  const action = await new Promise(resolve => {
    $('#mp_verify').onclick = () => { const v = $('#mp_ans').value; closeModal(); resolve({ type:'verify', val:v }); };
    $('#mp_use_master').onclick = () => { closeModal(); resolve({ type:'master' }); };
    $('#mp_cancel').onclick = () => { closeModal(); resolve(null); };
  });
  if(!action) return;
  if(action.type === 'master'){
    openResetPasswordAuthModal();
    return;
  }
  const h = await sha256Hex(normalizeForSearch(action.val));
  if(h !== state.moneySecurityA){ alert('الإجابة غير صحيحة.'); return; }
  await setNewMoneyPassword();
}

/* تصفير كلمة سر قسم الدخل عبر كود التفعيل المعتمد من المطور */
function openResetPasswordAuthModal(){
  if(!state.moneyPasswordHash && !state.moneySecurityQ){
    alert('قسم الدخل غير محمي بكلمة سر حالياً.');
    return;
  }
  const modalHTML = '<div class="reset-box" style="line-height:1.6;text-align:right">'
    + '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-bottom:12px;color:#1e40af;font-size:13px">'
    +   '<b>🛡️ حماية مشددة لسجلات الدخل والأمان:</b><br>'
    +   'لحماية خصوصية الإيرادات وسجلات المصروفات، لا يمكن تصفير أو استرجاع كلمة السر وسؤال الأمان إلا بإدخال <b>كود إعادة التفعيل المعتمد</b>.'
    + '</div>'
    + '<div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:12px;margin-bottom:14px;color:#854d0e;font-size:12px">'
    +   '📞 <b>للحصول على كود التفعيل:</b><br>'
    +   'يرجى التواصل مباشرة مع المطور <b>' + esc(ADMIN_NAME) + '</b> على الرقم:<br>'
    +   '<span style="direction:ltr;display:inline-block;font-weight:800;font-size:14px;color:#1e293b;margin:4px 0">' + ADMIN_PHONE + '</span><br>'
    +   '<a href="https://wa.me/' + digits(ADMIN_PHONE) + '?text=' + encodeURIComponent('مرحباً، أود الحصول على كود إعادة تفعيل وتصفير كلمة سر قسم الدخل في تطبيق دفتر.') + '" target="_blank" rel="noopener" class="btn btn-sm btn-whatsapp" style="margin-top:6px;display:inline-flex;align-items:center;gap:6px">'
    +     '💬 مراسلة المطور عبر واتساب للحصول على الكود'
    +   '</a>'
    + '</div>'
    + '<div class="form-row">'
    +   '<label style="font-weight:800;font-size:13px">أدخل كود إعادة التفعيل المعتمد (24 رقماً):'
    +     '<input id="reset_master_code_input" type="text" placeholder="مثال: 967925868934670272500351" style="direction:ltr;text-align:center;font-family:monospace;letter-spacing:1.5px;font-size:15px;margin-top:6px" autocomplete="off">'
    +   '</label>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:16px">'
    +   '<button class="btn btn-danger" id="btn_do_master_reset">تأكيد وتصفير كلمة السر 🔓</button>'
    +   '<button class="btn btn-outline" id="btn_cancel_master_reset">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('🔑 تصفير كلمة سر قسم الدخل والأمان', modalHTML);
  $('#btn_cancel_master_reset').onclick = closeModal;
  $('#btn_do_master_reset').onclick = () => {
    const entered = ($('#reset_master_code_input').value || '').trim().replace(/[\s\-]+/g, '');
    if(!entered){
      alert('يرجى كتابة كود التفعيل أولاً.');
      return;
    }
    if(entered !== MASTER_RESET_CODE){
      alert('❌ كود إعادة التفعيل غير صحيح!\nيرجى التأكد من الكود المكتوب أو التواصل مع المطور على الرقم الموضح (' + ADMIN_PHONE + ') للحصول على كود التفعيل المعتمد.');
      return;
    }
    state.moneyPasswordHash = '';
    state.moneySecurityQ = '';
    state.moneySecurityA = '';
    moneyUnlocked = true;
    saveState();
    renderAll();
    closeModal();
    showToastMessage('✅ تم تصفير كلمة سر الدخل وسؤال الأمان بنجاح عبر كود التفعيل.');
  };
}

async function setNewMoneyPassword(){
  openModal('🔑 عيّن كلمة سر جديدة',
    '<div class="form-row"><label>كلمة السر الجديدة<input id="mp_pwd" type="password" autocomplete="new-password"></label></div>'
    + '<div class="modal-actions"><button class="btn" id="mp_ok">حفظ</button><button class="btn btn-outline" id="mp_cancel">إلغاء</button></div>');
  const p = await new Promise(resolve => {
    $('#mp_ok').onclick = () => { const v = $('#mp_pwd').value; closeModal(); resolve(v); };
    $('#mp_cancel').onclick = () => { closeModal(); resolve(null); };
  });
  if(p == null) return;
  if(p.length < 4){ alert('استخدم كلمة سر أطول (4 أحرف على الأقل).'); return; }
  state.moneyPasswordHash = await sha256Hex(p);
  saveState();
  alert('تمت إعادة تعيين كلمة السر بنجاح.');
  renderAll();
}

function openWhatsApp(phone, text, label){
  openModal('📱 اختر نوع الواتساب' + (label ? ' - ' + esc(label) : ''),
    '<p class="muted" style="margin-top:0">بأي تطبيق تريد فتح المحادثة؟</p>'
    + '<div class="modal-actions" style="flex-direction:column;align-items:stretch;gap:8px">'
    + '<a class="btn btn-whatsapp" href="' + waHrefNumber(phone, text, 'normal') + '" target="_blank" rel="noopener" data-waclose>واتساب عادي</a>'
    + '<a class="btn btn-whatsapp" href="' + waHrefNumber(phone, text, 'business') + '" target="_blank" rel="noopener" data-waclose>واتساب أعمال</a>'
    + '<button class="btn btn-outline" id="waCancel">إلغاء</button>'
    + '</div>');
  $$('#modalBody [data-waclose]').forEach(a => { a.onclick = () => closeModal(); });
  $('#waCancel').onclick = closeModal;
}
function lockMoney(){ moneyUnlocked = false; renderAll(); }

function renderIncomeCard(){
  const el = $('#incomeCard');
  if(!el) return;
  const d = moneyData();
  if(d.total <= 0){ el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = '<span>💰 إجمالي الدخل: <b>' + moneyDisplay(d.collected) + ' / ' + moneyDisplay(d.total) + ' ج.م</b></span>'
    + '<button class="mini-btn ' + (moneyMasked() ? 'mini-lock' : 'mini-add') + '" data-act="' + (moneyMasked() ? 'reveal-money' : 'lock-money') + '">' + (moneyMasked() ? '🔒 عرض' : '🔓 إخفاء') + '</button>';
}

/* ---------- عرض عام ---------- */
function renderAll(){
  renderHeader();
  renderFooter();
  renderLessonsHome();
  renderGlobalSearch();
  renderLessonDetail();
  renderArchive();
  renderSettings();
  renderToday();
  renderIncomeCard();
  updateNotifStatus();
  scheduleReminders();
}

function totalStudents(){
  return state.lessons.reduce((n,L) => n + L.students.length, 0);
}
function renderHeader(){
  $('#appTitle').textContent = APP_NAME;
  $('#appTagline').textContent = state.settings.appTitle;
  $('#monthSubtitle').textContent = state.lessons.length + ' درس · ' + totalStudents() + ' طالب';
  document.title = APP_NAME;
}
function renderFooter(){
  const s = state.settings;
  const tel = normalizePhone(s.ownerPhone);
  $('#footerOwner').innerHTML = '<span>' + esc(s.ownerName) + '</span>' + (tel ? ' · <a href="tel:' + esc(tel) + '">' + esc(s.ownerPhone) + '</a>' : '');
}
function buildMonthTitle(monthNumber){
  return state.settings.monthTitleTemplate.replace(/\{month\}/g, monthNumber);
}
function scheduleLabel(L){
  const days = (L.schedule||[]).map(d => DAY_NAMES[d]).join('، ');
  return days + (L.time ? ' · ' + formatTime12(L.time) : '');
}

/* ---------- لوحة المؤشرات والتحليلات ---------- */
function renderDashboardOverview(){
  const wrap = $('#dashboardOverview');
  if(!wrap) return;
  if(state.lessons.length === 0){
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'block';

  let totalSt = 0;
  state.lessons.forEach(L => { totalSt += (L.students || []).length; });

  const todayItems = todayScheduleItems();

  let totalPastAttended = 0, totalPossible = 0;
  state.lessons.forEach(L => {
    const ps = pastSessions(L.sessions);
    if(ps.length && L.students.length){
      L.students.forEach(st => {
        ps.forEach(s => {
          totalPossible++;
          const rec = (L.records[st.id] && L.records[st.id][s.id]) || {};
          if(rec.status === 'st_done') totalPastAttended++;
        });
      });
    }
  });
  const overallPct = totalPossible > 0 ? Math.round((totalPastAttended / totalPossible) * 100) : 0;

  let totalCollected = 0, hasSub = false;
  state.lessons.forEach(L => {
    if(L.subscription){
      hasSub = true;
      (L.students || []).forEach(st => {
        const payments = st.payments || [];
        if(payments.length > 0){
          totalCollected += payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        } else if(st.paid){
          totalCollected += (L.price || 0);
        }
      });
    }
  });

  const hideMoney = !!state.settings.hideDashboardMoney;
  const moneyValStr = hideMoney ? '••••' : (moneyDisplay(totalCollected) + ' ج.م');

  let todayListHTML = '';
  if(todayItems.length > 0){
    todayListHTML = '<div class="dash-today-list"><b>📅 حصص اليوم:</b> '
      + todayItems.map(item => '<span class="dash-today-item">🕒 ' + esc(item.label) + ' (' + formatTime12(item.time) + ')</span>').join('')
      + '</div>';
  } else {
    todayListHTML = '<div class="dash-today-list muted">لا توجد حصص مجدولة لليوم.</div>';
  }

  wrap.innerHTML = '<div class="dash-head">'
    + '<div class="dash-title">📊 لوحة المؤشرات السريعة</div>'
    + '<div style="display:flex;gap:6px">'
    +   (hasSub ? '<button class="btn btn-outline btn-sm" id="btnToggleDashMoney" title="إخفاء/إظهار المبالغ" style="padding:2px 8px;font-size:12px">' + (hideMoney ? '👁️ إظهار' : '🔒 إخفاء') + '</button>' : '')
    +   '<button class="btn btn-outline btn-sm" id="btnDashAnalytics" style="padding:2px 8px;font-size:12px">📈 التحليلات</button>'
    + '</div>'
    + '</div>'
    + '<div class="dash-grid">'
    +   '<div class="dash-metric"><div class="dash-val">' + totalSt + '</div><div class="dash-lbl">إجمالي الطلاب</div></div>'
    +   '<div class="dash-metric"><div class="dash-val" style="color:' + (overallPct >= 80 ? '#15803d' : overallPct >= 50 ? '#b45309' : '#dc2626') + '">' + overallPct + '%</div><div class="dash-lbl">نسبة حضور الشهر</div></div>'
    +   '<div class="dash-metric"><div class="dash-val">' + todayItems.length + '</div><div class="dash-lbl">حصص اليوم</div></div>'
    +   (hasSub ? '<div class="dash-metric"><div class="dash-val" style="color:#15803d">' + moneyValStr + '</div><div class="dash-lbl">إجمالي التحصيل</div></div>' : '')
    + '</div>'
    + todayListHTML;

  const btnToggle = $('#btnToggleDashMoney');
  if(btnToggle){
    btnToggle.onclick = () => {
      state.settings.hideDashboardMoney = !state.settings.hideDashboardMoney;
      saveState();
      renderDashboardOverview();
    };
  }
  const btnAnalytics = $('#btnDashAnalytics');
  if(btnAnalytics) btnAnalytics.onclick = openAnalyticsModal;
}

function openAnalyticsModal(){
  let chartBars = '';
  state.lessons.forEach(L => {
    const ps = pastSessions(L.sessions);
    let done = 0, total = ps.length * (L.students.length || 1);
    if(ps.length && L.students.length){
      L.students.forEach(st => {
        ps.forEach(s => {
          if((L.records[st.id] && L.records[st.id][s.id] && L.records[st.id][s.id].status === 'st_done')) done++;
        });
      });
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const barColor = pct >= 85 ? '#15803d' : pct >= 50 ? '#b45309' : '#dc2626';
    chartBars += '<div style="margin-bottom:12px">'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:4px">'
      +   '<span>' + esc(L.name) + ' (' + L.students.length + ' طالب)</span>'
      +   '<span style="color:' + barColor + '">' + pct + '% حضور</span>'
      + '</div>'
      + '<div style="background:#e2e8f0;border-radius:999px;height:10px;overflow:hidden">'
      +   '<div style="background:' + barColor + ';width:' + pct + '%;height:100%;border-radius:999px;transition:width .4s ease"></div>'
      + '</div>'
      + '</div>';
  });

  let html = '<div class="dash-chart-card">'
    + '<div class="dash-chart-title">مقارنة نسب الحضور بين الدروس (الشهر الحالي)</div>'
    + (chartBars || '<p class="muted">لا توجد بيانات حضور كافية بعد.</p>')
    + '</div>'
    + '<div class="modal-actions"><button class="btn btn-outline" id="an_close">إغلاق</button></div>';

  openModal('📊 التحليلات والإحصائيات العامة', html);
  $('#an_close').onclick = closeModal;
}

/* ---------- شاشة الدروس ---------- */
function renderLessonsHome(){
  renderDashboardOverview();
  const list = $('#lessonsList');
  if(state.lessons.length === 0){
    list.innerHTML = '<div class="empty-state">لا توجد دروس بعد - اضغط «درس جديد» لإضافة أول درس.</div>';
    return;
  }
  list.innerHTML = state.lessons.map(L =>
    '<div class="lesson-card">'
    + '<div class="lesson-info">'
    +   '<div class="lesson-name">' + esc(L.name) + (L.subscription ? ' <span class="badge-sub">اشتراك شهري</span>' : '') + '</div>'
    +   '<div class="lesson-meta">' + esc(scheduleLabel(L)) + ' · ' + L.students.length + ' طالب · ' + L.sessions.length + ' حصة</div>'
    +   '<div class="lesson-meta">شهر ' + L.monthNumber + '/' + L.year + (L.groups.length ? ' · ' + L.groups.length + ' مجموعة' : '') + '</div>'
    + '</div>'
    + '<div class="lesson-actions">'
    +   '<button class="btn btn-sm" data-act="open-lesson" data-id="'+L.id+'">فتح</button>'
    +   '<button class="btn btn-sm btn-outline" data-act="edit-lesson" data-id="'+L.id+'">تعديل</button>'
    +   '<button class="btn btn-sm btn-danger" data-act="del-lesson" data-id="'+L.id+'">حذف</button>'
    + '</div>'
    + '</div>'
  ).join('');
}

/* ---------- البحث العام ---------- */
function renderGlobalSearch(){
  const q = globalSearchQuery.trim();
  const qN = normalizeForSearch(q);
  const box = $('#globalSearchResults');
  if(!q){ box.innerHTML = ''; box.style.display = 'none'; return; }
  const matches = [];
  state.lessons.forEach(L => {
    L.students.forEach((st, sidx) => {
      if(normalizeForSearch(st.name).includes(qN) || (st.phone||'').includes(q) || (st.guardianPhone||'').includes(q) || (st.extraPhones||[]).some(p => p.includes(q)) || (st.guardianExtraPhones||[]).some(p => p.includes(q)) || (qN && String(sidx+1) === qN)){
        matches.push({ lesson: L, student: st });
      }
    });
  });
  if(matches.length === 0){
    box.innerHTML = '<div class="empty-state">لا توجد نتائج مطابقة.</div>';
  } else {
    box.innerHTML = matches.map(m =>
      '<div class="search-item">'
      + '<span class="s-name">'+esc(m.student.name)+'</span>'
      + '<span class="s-meta">في درس «'+esc(m.lesson.name)+'»</span>'
      + '<button class="btn btn-sm btn-outline" data-act="open-student" data-lesson="'+m.lesson.id+'" data-id="'+m.student.id+'">فتح</button>'
      + '</div>'
    ).join('');
  }
  box.style.display = 'block';
}

/* ---------- جدول الدرس ---------- */
function renderGroupFilter(L){
  const sel = $('#groupFilter');
  if(!sel) return;
  let opts = '<option value="">كل المجموعات</option>';
  (L.groups||[]).forEach(g => {
    opts += '<option value="'+esc(g.id)+'"'+(groupFilterQuery===g.id?' selected':'')+'>'+esc(g.name)+'</option>';
  });
  opts += '<option value="__none__"'+(groupFilterQuery==='__none__'?' selected':'')+'>بدون مجموعة</option>';
  sel.innerHTML = opts;
  sel.style.display = (L.groups && L.groups.length) ? '' : 'none';
}

/* =====================================================================
   v30: المتغيرات العامة والدوال الجديدة
   ===================================================================== */
let currentLessonSubtab = 'attendance'; // 'attendance' | 'exams'
let isBulkSelecting = false;
let selectedStudentIds = new Set();

/* ---------- 1. التحضير السريع الجماعي (Bulk Attendance) ---------- */
function openBulkAttendanceModal(lesson, session){
  if(!lesson || !session) return;
  const html = '<div style="text-align:center;padding:8px">'
    + '<p style="font-size:14px;font-weight:700;margin-bottom:14px">تعيين حالة لجميع طلاب الحصة:<br><b style="color:var(--primary);font-size:15px">' + esc(session.label) + (session.dateLabel ? ' (' + esc(session.dateLabel) + ')' : '') + '</b></p>'
    + '<div style="display:flex;flex-direction:column;gap:10px;max-width:300px;margin:0 auto">'
    +   '<button class="btn" id="bulk_set_done" style="background:#15803d;color:#fff;justify-content:center">✅ تحضير الكل حاضر</button>'
    +   '<button class="btn" id="bulk_set_apology" style="background:#b45309;color:#fff;justify-content:center">⚠️ تسجيل الكل اعتذار</button>'
    +   '<button class="btn" id="bulk_set_absent" style="background:#b91c1c;color:#fff;justify-content:center">❌ تغييب الكل غائب</button>'
    +   '<button class="btn btn-outline" id="bulk_set_clear" style="justify-content:center">🔄 تفريغ سجلات الحصة للجميع</button>'
    + '</div>'
    + '</div>';

  openModal('⚡ التحضير السريع الجماعي', html);

  function applyStatus(stCode){
    let targetStudents = lesson.students;
    if(groupFilterQuery && groupFilterQuery !== '__none__'){
      targetStudents = targetStudents.filter(st => st.groupId === groupFilterQuery);
    } else if(groupFilterQuery === '__none__'){
      targetStudents = targetStudents.filter(st => !st.groupId);
    }
    targetStudents.forEach(st => {
      if(!lesson.records[st.id]) lesson.records[st.id] = {};
      if(stCode === null){
        delete lesson.records[st.id][session.id];
      } else {
        lesson.records[st.id][session.id] = {
          status: stCode,
          note: (lesson.records[st.id][session.id] && lesson.records[st.id][session.id].note) || ''
        };
      }
    });
    saveState();
    renderLessonDetail();
    closeModal();
    showToastMessage('تم تطبيق الحالة على ' + targetStudents.length + ' طالب.');
  }

  $('#bulk_set_done').onclick = () => applyStatus('st_done');
  $('#bulk_set_apology').onclick = () => applyStatus('st_apology');
  $('#bulk_set_absent').onclick = () => applyStatus('st_noanswer');
  $('#bulk_set_clear').onclick = () => applyStatus(null);
}

/* ---------- 2. المراسلة التسلسلية الذكية (Sequential WhatsApp) ---------- */
function openSequentialMessagingModal(initialSource){
  const sources = [];
  (state.lessons || []).forEach(l => {
    sources.push({
      id: 'lesson_' + l.id,
      type: 'lesson',
      name: l.name,
      label: '📚 درس: ' + l.name + ' (الشهر الحالي ' + l.monthNumber + '/' + l.year + ')',
      studentCount: (l.students || []).length,
      raw: l
    });
  });
  (state.archive || []).forEach((a, idx) => {
    sources.push({
      id: 'arch_' + idx,
      type: 'archive',
      name: a.lessonName,
      label: '🗄️ أرشيف: ' + a.lessonName + ' (شهر ' + a.monthNumber + '/' + a.year + ')',
      studentCount: archiveStudents(a).length,
      raw: a,
      archIdx: idx
    });
  });

  if(sources.length === 0){
    alert('لا توجد دروس أو شهور مؤرشفة متاحة للمراسلة.');
    return;
  }

  let defaultSourceId = sources[0].id;
  if(initialSource){
    if(initialSource.archivedAt || (initialSource.lessonName && initialSource.monthNumber)){
      const foundIdx = (state.archive || []).indexOf(initialSource);
      if(foundIdx !== -1) defaultSourceId = 'arch_' + foundIdx;
      else {
        const match = sources.find(s => s.type === 'archive' && s.name === initialSource.lessonName && s.raw.monthNumber === initialSource.monthNumber && s.raw.year === initialSource.year);
        if(match) defaultSourceId = match.id;
      }
    } else if(initialSource.id){
      const match = sources.find(s => s.type === 'lesson' && s.raw.id === initialSource.id);
      if(match) defaultSourceId = match.id;
    }
  }

  let html = '<div class="form-row" style="margin-bottom:10px">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:4px">'
    +     '<label style="font-weight:800;font-size:12.5px;color:var(--text);margin:0">📚 مصادر الطلاب (حدد درساً حالياً و/أو شهوراً مؤرشفة معاً):</label>'
    +     '<span id="seq_sources_summary" style="font-size:11px;font-weight:700;color:var(--primary);background:var(--primary-light);padding:2px 8px;border-radius:6px">1 مصدر محدد</span>'
    +   '</div>'
    +   '<div id="seq_sources_box" style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:6px 8px;max-height:120px;overflow-y:auto;display:flex;flex-direction:column;gap:5px">'
    +     sources.map(s => {
            const isDef = (s.id === defaultSourceId);
            return '<label class="seq-source-item" style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:#fff;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:12px">'
              + '<input type="checkbox" class="seq-source-cb" value="' + s.id + '" ' + (isDef ? 'checked' : '') + ' style="cursor:pointer;accent-color:var(--primary);width:16px;height:16px">'
              + '<span style="flex:1;min-width:0;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(s.label) + '</span>'
              + '<span style="font-size:10.5px;color:var(--muted);flex-shrink:0">(' + s.studentCount + ' طالب)</span>'
              + '</label>';
          }).join('')
    +   '</div>'
    + '</div>'
    + '<div class="form-row"><label>الجمهور المستهدف:'
    + '<select id="seq_audience"></select>'
    + '</label></div>'
    + '<div id="seq_custom_students_box" style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:12px">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px">'
    +     '<div style="font-weight:800;font-size:12px;color:var(--primary)">'
    +       '👥 الطلاب المطلوب إرسال الرسالة لهم:'
    +       '<span id="seq_selected_count" style="background:var(--primary);color:#fff;border-radius:6px;padding:2px 8px;margin-right:6px;font-size:11px;font-weight:700">0 محدد</span>'
    +     '</div>'
    +     '<div style="display:flex;gap:4px;flex-wrap:wrap">'
    +       '<button type="button" class="btn btn-sm btn-outline" id="seq_btn_sel_all" style="padding:2px 6px;font-size:11px">تحديد الكل</button>'
    +       '<button type="button" class="btn btn-sm btn-outline" id="seq_btn_desel_all" style="padding:2px 6px;font-size:11px">إلغاء التحديد</button>'
    +       '<button type="button" class="btn btn-sm btn-outline" id="seq_btn_sel_absent" style="padding:2px 6px;font-size:11px;color:#dc2626;border-color:#fca5a5">الطلاب الغائبون فقط</button>'
    +       '<button type="button" class="btn btn-sm btn-outline" id="seq_btn_sel_attended" style="padding:2px 6px;font-size:11px;color:#16a34a;border-color:#bbf7d0">الطلاب الحاضرون فقط</button>'
    +     '</div>'
    +   '</div>'
    +   '<div style="margin-bottom:8px">'
    +     '<input type="text" id="seq_st_search" placeholder="🔍 ابحث بالاسم أو رقم الهاتف..." style="width:100%;padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid var(--border);box-sizing:border-box">'
    +   '</div>'
    +   '<div id="seq_students_list" style="max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;padding-left:2px">'
    +   '</div>'
    + '</div>'
    + '<div class="grid2">'
    +   '<label>إرسال إلى:'
    +     '<select id="seq_target">'
    +       '<option value="guardian">ولي الأمر (ثم الطالب إن لم يتوفر)</option>'
    +       '<option value="student">هاتف الطالب مباشرة</option>'
    +       '<option value="both">كلاهما (طالب وولي أمر)</option>'
    +     '</select>'
    +   '</label>'
    +   '<label>نوع الواتساب:'
    +     '<select id="seq_wa_type">'
    +       '<option value="normal">واتساب عادي</option>'
    +       '<option value="business">واتساب أعمال</option>'
    +     '</select>'
    +   '</label>'
    + '</div>'
    + '<div class="form-row"><label>نص قالب الرسالة (المتغيرات: {name}، {lesson}، {date}، {group}):'
    + '<textarea id="seq_tmpl" rows="4" dir="rtl"></textarea></label></div>'
    + '<div class="form-row" style="margin-top:8px"><label>🖼️ إرفاق صورة مع الرسالة (اختياري - مثلاً: بوستر امتحان، جدول، تنبيه):'
    + '<input type="file" id="seq_img_input" accept="image/*" style="margin-top:6px;display:block;width:100%">'
    + '</label>'
    + '<div id="seq_img_preview" style="display:none;margin-top:8px;padding:8px 10px;background:var(--bg-card);border:1px dashed var(--border);border-radius:8px;align-items:center;gap:10px">'
    +   '<img id="seq_img_thumb" src="" style="width:50px;height:50px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">'
    +   '<div style="flex:1;min-width:0;text-align:right">'
    +     '<div id="seq_img_name" style="font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>'
    +     '<div id="seq_img_size" class="muted" style="font-size:11px"></div>'
    +   '</div>'
    +   '<button type="button" class="btn btn-sm btn-outline btn-danger" id="seq_img_remove">❌ إزالة</button>'
    + '</div>'
    + '</div>'
    + '<div class="modal-actions">'
    +   '<button class="btn btn-whatsapp" id="seq_start">بدء الإرسال المتتابع 🚀</button>'
    +   '<button class="btn btn-outline" id="seq_close">إلغاء</button>'
    + '</div>';

  openModal('📲 مراسلة جماعية مخصصة', html);

  let attachedImage = null;
  const imgInput = $('#seq_img_input');
  const imgPreview = $('#seq_img_preview');
  const imgThumb = $('#seq_img_thumb');
  const imgName = $('#seq_img_name');
  const imgSize = $('#seq_img_size');
  const imgRemove = $('#seq_img_remove');

  if(imgInput){
    imgInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        attachedImage = {
          file: file,
          dataUrl: ev.target.result,
          name: file.name,
          size: file.size,
          type: file.type
        };
        if(imgThumb) imgThumb.src = attachedImage.dataUrl;
        if(imgName) imgName.textContent = file.name;
        if(imgSize) imgSize.textContent = Math.round(file.size / 1024) + ' KB';
        if(imgPreview) imgPreview.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    };
  }
  if(imgRemove){
    imgRemove.onclick = () => {
      attachedImage = null;
      if(imgInput) imgInput.value = '';
      if(imgPreview) imgPreview.style.display = 'none';
    };
  }

  const defaultTemplates = {
    absent: 'السلام عليكم ورحمة الله وبركاته،\nنحيطكم علماً بغياب الطالب/ة {name} عن حصة {lesson} بتاريخ {date}.\nنرجو الاطمئنان ومتابعة ما فاته.',
    attended: 'السلام عليكم ورحمة الله وبركاته،\nنشكر الطالب/ة {name} على التزامه وحضوره في حصة {lesson} اليوم {date}. بارك الله في جهوده.',
    all: 'السلام عليكم ورحمة الله وبركاته،\nنود تذكيركم بموعد حصة {lesson} القادمة للطالب/ة {name}.\nبالتوفيق دائماً إن شاء الله.',
    custom: 'السلام عليكم ورحمة الله وبركاته،\nتحية طيبة للطالب/ة {name} وولي أمره بخصوص مادة {lesson}.\nبالتوفيق دائماً إن شاء الله.'
  };

  const tmplArea = $('#seq_tmpl');
  tmplArea.value = defaultTemplates.all;

  let curCombinedStudents = [];

  function loadSelectedSources(){
    const checkedBoxes = $$('.seq-source-cb:checked');
    const checkedSourceIds = checkedBoxes.map(cb => cb.value);
    const summaryEl = $('#seq_sources_summary');
    if(summaryEl){
      summaryEl.textContent = checkedSourceIds.length + ' مصدر محدد';
    }

    if(checkedSourceIds.length === 0){
      curCombinedStudents = [];
      const audSel = $('#seq_audience');
      if(audSel) audSel.innerHTML = '<option value="all">لا توجد مصادر محددة</option>';
      renderStudentList();
      return;
    }

    const selectedSources = sources.filter(s => checkedSourceIds.includes(s.id));
    const combined = [];

    selectedSources.forEach(src => {
      const raw = src.raw;
      const isArch = src.type === 'archive';
      const lessonName = isArch ? raw.lessonName : raw.name;
      const students = isArch ? archiveStudents(raw) : (raw.students || []);
      const sessions = raw.sessions || [];
      const records = raw.records || {};
      const parentL = isArch ? state.lessons.find(x => x.id === raw.lessonId) : raw;
      const groups = (parentL && parentL.groups) || [];
      const past = pastSessions(sessions);
      const lastSession = past.length ? past[past.length - 1] : (sessions[0] || null);
      const srcTag = isArch ? ('أرشيف ' + raw.monthNumber + '/' + raw.year) : 'الحالي';

      students.forEach(st => {
        const normName = normalizeForSearch(st.name || '');
        const p1 = digits(st.phone || '');
        const p2 = digits(st.guardianPhone || '');

        let existing = combined.find(item => {
          if(st.id && item.student.id === st.id) return true;
          if(normName && normalizeForSearch(item.student.name || '') === normName){
            if(p1 && (digits(item.student.phone || '') === p1 || digits(item.student.guardianPhone || '') === p1)) return true;
            if(p2 && (digits(item.student.phone || '') === p2 || digits(item.student.guardianPhone || '') === p2)) return true;
            if(!p1 && !p2) return true;
          }
          return false;
        });

        const rec = (lastSession && records[st.id] && records[st.id][lastSession.id]) || {};
        const stStatus = rec.status || 'none';
        const grp = groups.find(g => g.id === st.groupId);

        if(existing){
          if(!existing.sourceTags.includes(srcTag)){
            existing.sourceTags.push(srcTag);
          }
          if(!existing.student.phone && st.phone) existing.student.phone = st.phone;
          if(!existing.student.guardianPhone && st.guardianPhone) existing.student.guardianPhone = st.guardianPhone;
          if(stStatus !== 'none' && existing.status === 'none'){
            existing.status = stStatus;
            existing.lastSession = lastSession;
            existing.lessonName = lessonName;
          }
          if(!existing.groupName && grp){
            existing.groupId = st.groupId;
            existing.groupName = grp.name;
          }
        } else {
          combined.push({
            uniqueId: 'comb_' + combined.length + '_' + (st.id || uid('st')),
            student: Object.assign({}, st),
            status: stStatus,
            sourceTags: [srcTag],
            lastSession: lastSession,
            lessonName: lessonName,
            groupId: st.groupId,
            groupName: grp ? grp.name : ''
          });
        }
      });
    });

    curCombinedStudents = combined;

    const audSel = $('#seq_audience');
    let audOpts = '<option value="all" selected>جميع الطلاب المحددين (' + combined.length + ' طالب)</option>'
      + '<option value="custom">🎯 تحديد يدوي مخصص (اختيار فردي)</option>'
      + '<option value="absent">الطلاب الغائبون فقط</option>'
      + '<option value="attended">الطلاب الحاضرون فقط</option>';

    const allGroups = [];
    combined.forEach(c => {
      if(c.groupName && !allGroups.includes(c.groupName)){
        allGroups.push(c.groupName);
      }
    });
    allGroups.forEach(gName => {
      audOpts += '<option value="grp_' + esc(gName) + '">مجموعة: ' + esc(gName) + '</option>';
    });

    audSel.innerHTML = audOpts;
    audSel.value = 'all';
    tmplArea.value = defaultTemplates.all;

    renderStudentList();
  }

  function renderStudentList(){
    const listEl = $('#seq_students_list');
    if(!listEl) return;

    if(curCombinedStudents.length === 0){
      listEl.innerHTML = '<p class="muted" style="font-size:12px;text-align:center;margin:10px 0">يرجى تحديد مصدر واحد على الأقل من القائمة أعلاه لعرض الطلاب.</p>';
      updateCountBadge();
      return;
    }

    const aud = $('#seq_audience').value;

    let itemsHTML = '';
    curCombinedStudents.forEach(item => {
      const st = item.student;
      const stStatus = item.status;
      let statusBadge = '';
      if(stStatus === 'st_done') statusBadge = '<span style="font-size:10px;background:#dcfce7;color:#166534;padding:1px 5px;border-radius:4px;font-weight:700">🟢 حاضر</span>';
      else if(stStatus === 'st_noanswer') statusBadge = '<span style="font-size:10px;background:#fee2e2;color:#991b1b;padding:1px 5px;border-radius:4px;font-weight:700">🔴 غائب</span>';
      else if(stStatus === 'st_apology') statusBadge = '<span style="font-size:10px;background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:4px;font-weight:700">🟡 اعتذار</span>';
      else statusBadge = '<span style="font-size:10px;background:#f1f5f9;color:#475569;padding:1px 5px;border-radius:4px">⚪ لم يسجل</span>';

      const groupBadge = item.groupName ? '<span style="font-size:10px;background:#e0e7ff;color:#3730a3;padding:1px 5px;border-radius:4px;margin-right:4px">' + esc(item.groupName) + '</span>' : '';

      let sourceBadge = '';
      if(item.sourceTags.length === 1){
        const isCur = item.sourceTags[0] === 'الحالي';
        sourceBadge = '<span style="font-size:9.5px;background:' + (isCur ? '#e0f2fe;color:#0369a1' : '#fef3c7;color:#92400e') + ';padding:1px 5px;border-radius:4px;margin-right:4px;font-weight:700">' + esc(item.sourceTags[0]) + '</span>';
      } else {
        sourceBadge = '<span style="font-size:9.5px;background:#dcfce7;color:#15803d;padding:1px 5px;border-radius:4px;margin-right:4px;font-weight:700" title="' + esc(item.sourceTags.join(' + ')) + '">مشترك (' + item.sourceTags.length + ')</span>';
      }

      let checked = false;
      if(aud === 'all') checked = true;
      else if(aud === 'absent') checked = (stStatus === 'st_noanswer');
      else if(aud === 'attended') checked = (stStatus === 'st_done');
      else if(aud.startsWith('grp_')) checked = (item.groupName === aud.replace('grp_', ''));
      else if(aud === 'custom') checked = true;

      const ph = st.phone || st.guardianPhone || '';

      itemsHTML += '<label class="seq-st-item" data-name="' + normalizeForSearch(st.name) + '" data-phone="' + digits(ph) + '" style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#fff;border:1px solid var(--border);border-radius:8px;cursor:pointer">'
        + '<input type="checkbox" class="seq-st-cb" value="' + item.uniqueId + '" data-status="' + stStatus + '" ' + (checked ? 'checked' : '') + ' style="cursor:pointer;accent-color:var(--primary)">'
        + '<div style="flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:6px">'
        +   '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center">'
        +     '<span style="font-size:13px;font-weight:700;color:var(--text)">' + esc(st.name) + '</span>'
        +     sourceBadge
        +     groupBadge
        +   '</div>'
        +   '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">'
        +     '<span style="font-size:11px;direction:ltr;color:var(--muted)">' + esc(localPhone(ph)) + '</span>'
        +     statusBadge
        +   '</div>'
        + '</div>'
        + '</label>';
    });

    listEl.innerHTML = itemsHTML;

    $$('.seq-st-cb').forEach(cb => {
      cb.onchange = updateCountBadge;
    });

    updateCountBadge();
  }

  function updateCountBadge(){
    const total = $$('.seq-st-cb').length;
    const checked = $$('.seq-st-cb:checked').length;
    const badge = $('#seq_selected_count');
    if(badge){
      badge.textContent = checked + ' من ' + total + ' طالب';
    }
  }

  $$('.seq-source-cb').forEach(cb => {
    cb.onchange = () => {
      const checkedBoxes = $$('.seq-source-cb:checked');
      if(checkedBoxes.length === 0){
        cb.checked = true;
        alert('يجب تحديد مصدر واحد على الأقل للمراسلة.');
        return;
      }
      loadSelectedSources();
    };
  });

  $('#seq_audience').onchange = (e) => {
    const aud = e.target.value;
    if(defaultTemplates[aud]) tmplArea.value = defaultTemplates[aud];
    else if(aud.startsWith('grp_')) tmplArea.value = defaultTemplates.all;

    $$('.seq-st-cb').forEach(cb => {
      const uidVal = cb.value;
      const item = curCombinedStudents.find(x => x.uniqueId === uidVal);
      const stStatus = item ? item.status : 'none';

      if(aud === 'all') cb.checked = true;
      else if(aud === 'absent') cb.checked = (stStatus === 'st_noanswer');
      else if(aud === 'attended') cb.checked = (stStatus === 'st_done');
      else if(aud.startsWith('grp_')) cb.checked = (item && item.groupName === aud.replace('grp_', ''));
      else if(aud === 'custom') cb.checked = true;
    });

    updateCountBadge();
  };

  if($('#seq_btn_sel_all')){
    $('#seq_btn_sel_all').onclick = () => {
      $$('.seq-st-cb').forEach(cb => { cb.checked = true; });
      $('#seq_audience').value = 'custom';
      updateCountBadge();
    };
  }
  if($('#seq_btn_desel_all')){
    $('#seq_btn_desel_all').onclick = () => {
      $$('.seq-st-cb').forEach(cb => { cb.checked = false; });
      $('#seq_audience').value = 'custom';
      updateCountBadge();
    };
  }
  if($('#seq_btn_sel_absent')){
    $('#seq_btn_sel_absent').onclick = () => {
      $$('.seq-st-cb').forEach(cb => {
        cb.checked = (cb.dataset.status === 'st_noanswer');
      });
      $('#seq_audience').value = 'custom';
      updateCountBadge();
    };
  }
  if($('#seq_btn_sel_attended')){
    $('#seq_btn_sel_attended').onclick = () => {
      $$('.seq-st-cb').forEach(cb => {
        cb.checked = (cb.dataset.status === 'st_done');
      });
      $('#seq_audience').value = 'custom';
      updateCountBadge();
    };
  }

  if($('#seq_st_search')){
    $('#seq_st_search').oninput = (e) => {
      const q = normalizeForSearch(e.target.value.trim());
      const digitsQ = digits(e.target.value.trim());
      $$('.seq-st-item').forEach(item => {
        const nameMatch = item.dataset.name && item.dataset.name.includes(q);
        const phoneMatch = digitsQ && item.dataset.phone && item.dataset.phone.includes(digitsQ);
        item.style.display = (!q || nameMatch || phoneMatch) ? 'flex' : 'none';
      });
    };
  }

  $('#seq_close').onclick = closeModal;

  $('#seq_start').onclick = () => {
    if(curCombinedStudents.length === 0){
      alert('لا توجد مصادر أو طلاب محددين للمراسلة.');
      return;
    }
    const tgt = $('#seq_target').value;
    const waType = $('#seq_wa_type').value;
    const tmpl = tmplArea.value.trim();
    if(!tmpl){ alert('يرجى كتابة نص الرسالة.'); return; }

    const checkedUids = $$('.seq-st-cb:checked').map(cb => cb.value);
    if(checkedUids.length === 0){
      alert('يرجى تحديد طالب واحد على الأقل للمراسلة من القائمة.');
      return;
    }

    const selectedItems = curCombinedStudents.filter(item => checkedUids.includes(item.uniqueId));

    let queue = [];
    selectedItems.forEach(item => {
      const st = item.student;
      const text = tmpl
        .replace(/\{name\}/g, st.name)
        .replace(/\{lesson\}/g, item.lessonName)
        .replace(/\{date\}/g, (item.lastSession && item.lastSession.dateLabel) || todayStr())
        .replace(/\{group\}/g, item.groupName || '');

      if(tgt === 'guardian'){
        const ph = st.guardianPhone || st.phone;
        if(ph) queue.push({ student: st, phone: ph, targetLabel: st.name + ' (ولي الأمر)', text });
      } else if(tgt === 'student'){
        if(st.phone) queue.push({ student: st, phone: st.phone, targetLabel: st.name, text });
      } else if(tgt === 'both'){
        if(st.guardianPhone) queue.push({ student: st, phone: st.guardianPhone, targetLabel: st.name + ' (ولي الأمر)', text });
        if(st.phone && st.phone !== st.guardianPhone) queue.push({ student: st, phone: st.phone, targetLabel: st.name + ' (الطالب)', text });
      }
    });

    if(queue.length === 0){
      alert('لم يتم العثور على أرقام هواتف مسجلة للطلاب المحددين.');
      return;
    }

    startSequentialQueue(queue, waType, attachedImage);
  };

  loadSelectedSources();
}

function startSequentialQueue(queue, waType, attachedImage){
  let currIdx = 0;

  function renderStep(){
    if(currIdx >= queue.length){
      openModal('🎉 اكتملت المراسلة',
        '<div class="seq-box">'
        + '<div style="font-size:48px;margin-bottom:10px">✅</div>'
        + '<h3>تم الانتهاء من إرسال كافة الرسائل بنجاح!</h3>'
        + '<p class="muted" style="margin-top:6px">تم المرور على ' + queue.length + ' رقم هاتف.</p>'
        + '<div class="modal-actions" style="justify-content:center;margin-top:16px"><button class="btn btn-primary" id="seq_finish">إغلاق</button></div>'
        + '</div>');
      $('#seq_finish').onclick = closeModal;
      return;
    }

    const item = queue[currIdx];
    const pct = Math.round(((currIdx + 1) / queue.length) * 100);

    let imageCardHTML = '';
    if(attachedImage){
      imageCardHTML = '<div class="seq-img-card" style="margin-top:10px;padding:8px 10px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;display:flex;align-items:center;gap:10px;text-align:right">'
        + '<img src="' + attachedImage.dataUrl + '" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid #94a3b8;cursor:pointer" id="seq_step_img_thumb" title="انقر لمعاينة الصورة">'
        + '<div style="flex:1;min-width:0">'
        +   '<div style="font-size:12px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🖼️ ' + esc(attachedImage.name) + '</div>'
        +   '<div style="font-size:11px;color:#64748b;margin-top:2px">جاهزة للمشاركة أو اللصق في شات الطالب</div>'
        + '</div>'
        + '<div style="display:flex;gap:4px">'
        +   '<button class="btn btn-outline btn-sm" id="seq_copy_img_btn" style="font-size:11px;padding:3px 8px" title="نسخ الصورة للحافظة">📋 نسخ الصورة</button>'
        + '</div>'
        + '</div>'
        + '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px 10px;margin-top:8px;font-size:11px;color:#166534;line-height:1.4">'
        +   '💡 <b>طريقة إرسال الصورة:</b> عند فتح المحادثة، اضغط مباشرة على <b>لصق (Ctrl+V)</b> لإرفاق الصورة فوراً مع النص، أو استخدم زر المشاركة المباشرة للهواتف.'
        + '</div>';
    }

    const canNativeShare = !!(attachedImage && navigator.share && navigator.canShare && navigator.canShare({ files: [attachedImage.file] }));

    const html = '<div class="seq-box">'
      + '<div style="font-size:13px;font-weight:800;color:var(--primary);display:flex;justify-content:space-between">'
      +   '<span>الرسالة رقم ' + (currIdx + 1) + ' من ' + queue.length + '</span>'
      +   '<span>' + pct + '%</span>'
      + '</div>'
      + '<div class="seq-progress-wrap"><div class="seq-progress-bar" style="width:' + pct + '%"></div></div>'
      + '<div class="seq-card">'
      +   '<div class="seq-name">' + esc(item.targetLabel) + '</div>'
      +   '<div class="seq-phone">📱 ' + esc(localPhone(item.phone)) + '</div>'
      +   '<div class="seq-preview">' + esc(item.text) + '</div>'
      +   imageCardHTML
      + '</div>'
      + '<div class="modal-actions" style="justify-content:space-between;flex-wrap:wrap;gap:8px">'
      +   '<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +     (currIdx > 0 ? '<button class="btn btn-outline btn-sm" id="seq_prev">⏪ السابق</button>' : '')
      +     '<button class="btn btn-outline btn-sm" id="seq_skip">تخطي ⏭️</button>'
      +     '<button class="btn btn-outline btn-sm" id="seq_copy_text">📋 نسخ النص</button>'
      +     (canNativeShare ? '<button class="btn btn-whatsapp btn-sm" id="seq_native_share">📲 مشاركة الصورة والنص</button>' : '')
      +   '</div>'
      +   '<div style="display:flex;gap:6px">'
      +     '<button class="btn btn-whatsapp" id="seq_send_next">🚀 إرسال لواتساب والتالي ⏩</button>'
      +     '<button class="btn btn-outline" id="seq_stop">إنهاء</button>'
      +   '</div>'
      + '</div>'
      + '</div>';

    openModal('📲 إرسال متتابع (' + (currIdx + 1) + '/' + queue.length + ')', html);

    if($('#seq_prev')) $('#seq_prev').onclick = () => { currIdx--; renderStep(); };
    $('#seq_skip').onclick = () => { currIdx++; renderStep(); };
    $('#seq_stop').onclick = closeModal;

    if($('#seq_copy_img_btn')){
      $('#seq_copy_img_btn').onclick = async () => {
        const ok = await copyImageToClipboard(attachedImage);
        if(ok) showToastMessage('✅ تم نسخ الصورة للحافظة! يمكنك الآن لصقها (Ctrl+V) في شات واتساب.');
        else showToastMessage('⚠️ تعذر نسخ الصورة للحافظة في هذا المتصفح. يمكنك إرفاقها من الزائد في واتساب.');
      };
    }
    if($('#seq_step_img_thumb')){
      $('#seq_step_img_thumb').onclick = () => {
        const w = window.open('');
        if(w){
          w.document.write('<body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh"><img src="' + attachedImage.dataUrl + '" style="max-width:95vw;max-height:95vh;object-fit:contain;border-radius:8px"></body>');
        }
      };
    }
    if($('#seq_native_share')){
      $('#seq_native_share').onclick = () => {
        if(navigator.share){
          navigator.share({
            files: [attachedImage.file],
            title: item.targetLabel,
            text: item.text
          }).then(() => {
            showToastMessage('✅ تم فتح المشاركة بنجاح');
            currIdx++;
            renderStep();
          }).catch(()=>{});
        }
      };
    }

    $('#seq_copy_text').onclick = () => {
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(item.text).then(() => showToastMessage('تم نسخ نص الرسالة'));
      } else fallbackCopy(item.text);
    };

    $('#seq_send_next').onclick = () => {
      if(attachedImage){
        copyImageToClipboard(attachedImage).catch(()=>{});
      } else if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(item.text).catch(()=>{});
      }
      const url = waHrefNumber(item.phone, item.text, waType);
      window.open(url, '_blank', 'noopener');
      currIdx++;
      renderStep();
    };
  }

  renderStep();
}

/* ---------- 3. سجل مدفوعات ومصروفات الطالب (Payments & Expenses) ---------- */
function openAddPaymentModal(student, lesson){
  if(!student || !lesson) return;
  const subPrice = lesson.price || 0;
  const payments = student.payments || [];
  const currentTotal = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const defAmount = Math.max(0, subPrice - currentTotal) || subPrice || '';

  const html = '<div class="form-row"><label>المبلغ (ج.م)<input id="pm_amount" type="number" step="1" min="1" value="' + defAmount + '"></label></div>'
    + '<div class="grid2">'
    +   '<label>التاريخ<input id="pm_date" type="date" value="' + todayStr() + '"></label>'
    +   '<label>نوع البند'
    +     '<select id="pm_type">'
    +       '<option value="subscription">اشتراك شهري</option>'
    +       '<option value="book">رسوم مذكرة / كتاب</option>'
    +       '<option value="other">أخرى</option>'
    +     '</select>'
    +   '</label>'
    + '</div>'
    + '<div class="form-row"><label>ملاحظات (اختياري)<input id="pm_note" type="text" placeholder="مثال: قسط أول، كتاب الفصل الدراسي الثاني..."></label></div>'
    + '<div class="modal-actions"><button class="btn" id="pm_save">حفظ الدفعة</button><button class="btn btn-outline" id="pm_cancel">إلغاء</button></div>';

  openModal('💰 تسجيل دفعة جديدة - ' + esc(student.name), html);

  $('#pm_cancel').onclick = () => {
    closeModal();
    openStudentProfile(student, lesson);
  };

  $('#pm_save').onclick = () => {
    const amt = Number($('#pm_amount').value);
    const dt = $('#pm_date').value || todayStr();
    const tp = $('#pm_type').value || 'subscription';
    const nt = ($('#pm_note').value || '').trim();

    if(!amt || amt <= 0){ alert('اكتب مبلغاً صحيحاً.'); return; }

    if(!Array.isArray(student.payments)) student.payments = [];
    student.payments.push({
      id: uid('pay'),
      date: dt,
      amount: amt,
      type: tp,
      note: nt
    });

    // تحديث علامة paid تلقائياً إن كان المجموع يغطي الاشتراك
    const newTotal = student.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    if(lesson.price > 0 && newTotal >= lesson.price) student.paid = true;

    saveState();
    renderLessonDetail();
    closeModal();
    openStudentProfile(student, lesson);
    showToastMessage('✅ تم تسجيل الدفعة بنجاح.');
  };
}

/* ---------- 4. درجات الاختبارات (Exams View) ---------- */
function renderExamsTable(lesson, filteredStudents){
  const exams = lesson.exams || [];
  const head = $('#examsHead');
  const body = $('#examsBody');
  const foot = $('#examsFoot');
  const meta = $('#examsMeta');
  if(!head || !body) return;

  if(meta) meta.textContent = exams.length + ' اختبار مسجل';

  let h = '<tr><th class="sticky-col">اسم الطالب</th>';
  exams.forEach(ex => {
    h += '<th><div style="font-size:12px;font-weight:800">' + esc(ex.name) + '</div>'
      + '<span class="exam-max-badge">الدرجة: ' + ex.maxScore + ' (' + esc(ex.date) + ')</span>'
      + '<div style="display:flex;gap:4px;justify-content:center;margin-top:3px">'
      +   '<button class="mini-btn mini-edit" data-act="edit-exam" data-id="' + ex.id + '" title="تعديل الاختبار">✏️</button>'
      +   '<button class="mini-btn mini-del" data-act="del-exam" data-id="' + ex.id + '" title="حذف الاختبار">✕</button>'
      + '</div>'
      + '</th>';
  });
  h += '<th>المتوسط %</th></tr>';
  head.innerHTML = h;

  let students = filteredStudents || lesson.students;
  let b = '';
  students.forEach((st, idx) => {
    const studentScores = (lesson.examScores && lesson.examScores[st.id]) || {};
    let totalPct = 0, examCount = 0;

    b += '<tr><td class="sticky-col student-cell">'
      +   '<div class="student-name">'
      +     '<span class="student-num">' + (idx + 1) + '.</span> '
      +     '<span class="st-name-click" data-act="view-student" data-id="' + st.id + '">' + esc(st.name) + '</span>'
      +   '</div>'
      + '</td>';

    exams.forEach(ex => {
      const scoreVal = studentScores[ex.id] !== undefined ? studentScores[ex.id] : '';
      const pct = (scoreVal !== '' && ex.maxScore > 0) ? Math.round((Number(scoreVal) / ex.maxScore) * 100) : null;
      if(pct !== null){ totalPct += pct; examCount++; }

      b += '<td style="text-align:center">'
        +   '<input type="number" step="0.5" min="0" max="' + ex.maxScore + '" value="' + (scoreVal !== '' ? scoreVal : '') + '" class="exam-input" data-sid="' + st.id + '" data-eid="' + ex.id + '" placeholder="-">'
        +   (pct !== null ? '<span class="exam-pct" style="color:' + (pct >= 50 ? '#15803d' : '#b91c1c') + '">' + pct + '%</span>' : '')
        + '</td>';
    });

    const avgPct = examCount > 0 ? Math.round(totalPct / examCount) : null;
    b += '<td style="text-align:center;font-weight:800;color:' + (avgPct !== null ? (avgPct >= 50 ? '#15803d' : '#b91c1c') : 'var(--muted)') + '">'
      + (avgPct !== null ? avgPct + '%' : '-')
      + '</td></tr>';
  });

  if(students.length === 0){
    b = '<tr><td colspan="' + (exams.length + 2) + '" class="empty-state">لا يوجد طلاب لعرض درجاتهم.</td></tr>';
  }
  body.innerHTML = b;

  let f = '<tr class="count-row"><td class="sticky-col">متوسط درجات الطلاب</td>';
  exams.forEach(ex => {
    let sum = 0, cnt = 0;
    lesson.students.forEach(st => {
      const v = (lesson.examScores && lesson.examScores[st.id] && lesson.examScores[st.id][ex.id]);
      if(v !== undefined && v !== '' && !isNaN(Number(v))){ sum += Number(v); cnt++; }
    });
    const avg = cnt > 0 ? (sum / cnt).toFixed(1) : '-';
    f += '<td><b>' + avg + (cnt > 0 ? ' / ' + ex.maxScore : '') + '</b></td>';
  });
  f += '<td></td></tr>';
  if(foot) foot.innerHTML = f;
}

function addExamModal(lesson, examToEdit){
  if(!lesson) return;
  const isEdit = !!examToEdit;
  const html = '<div class="form-row"><label>اسم الاختبار أو الواجب<input id="ex_name" type="text" value="' + esc(isEdit ? examToEdit.name : '') + '" placeholder="مثال: اختبار الأسبوع الأول"></label></div>'
    + '<div class="grid2">'
    +   '<label>الدرجة النهائية (العظمى)<input id="ex_max" type="number" min="1" step="1" value="' + (isEdit ? examToEdit.maxScore : 20) + '"></label>'
    +   '<label>التاريخ<input id="ex_date" type="date" value="' + (isEdit ? examToEdit.date : todayStr()) + '"></label>'
    + '</div>'
    + '<div class="modal-actions"><button class="btn" id="ex_save">حفظ</button><button class="btn btn-outline" id="ex_cancel">إلغاء</button></div>';

  openModal(isEdit ? '✏️ تعديل الاختبار' : '➕ إضافة اختبار جديد', html);
  $('#ex_cancel').onclick = closeModal;

  $('#ex_save').onclick = () => {
    const nm = ($('#ex_name').value || '').trim();
    const mx = Number($('#ex_max').value);
    const dt = $('#ex_date').value || todayStr();

    if(!nm){ alert('اكتب اسم الاختبار.'); return; }
    if(!mx || mx <= 0){ alert('اكتب الدرجة العظمى بشكل صحيح.'); return; }

    if(!Array.isArray(lesson.exams)) lesson.exams = [];
    if(!lesson.examScores || typeof lesson.examScores !== 'object') lesson.examScores = {};

    if(isEdit){
      examToEdit.name = nm;
      examToEdit.maxScore = mx;
      examToEdit.date = dt;
    } else {
      lesson.exams.push({ id: uid('ex'), name: nm, maxScore: mx, date: dt });
    }

    saveState();
    renderExamsTable(lesson);
    closeModal();
    showToastMessage('✅ تم حفظ بيانات الاختبار.');
  };
}

/* ---------- 5. التحديد المتعدد ونقل/تكرار الطلاب (Bulk Move / Copy) ---------- */
function bulkMoveStudentsModal(lesson, isCopy){
  if(!lesson || selectedStudentIds.size === 0) return;
  const otherLessons = state.lessons.filter(l => l.id !== lesson.id);
  if(otherLessons.length === 0){
    alert('لا توجد دروس أخرى متاحة للنقل أو التكرار إليها. قم بإنشاء درس آخر أولاً.');
    return;
  }

  let html = '<p style="font-size:13px;font-weight:700;margin-bottom:12px">تم تحديد <b style="color:var(--primary)">' + selectedStudentIds.size + '</b> طالب من درس «' + esc(lesson.name) + '».</p>'
    + '<div class="form-row"><label>الدرس المستهدف'
    +   '<select id="bm_target_lesson">'
    +     otherLessons.map(l => '<option value="' + l.id + '">' + esc(l.name) + ' (شهر ' + l.monthNumber + '/' + l.year + ')</option>').join('')
    +   '</select>'
    + '</label></div>'
    + '<div class="form-row"><label>المجموعة في الدرس المستهدف'
    +   '<select id="bm_target_group"><option value="">بدون مجموعة</option></select>'
    + '</label></div>'
    + '<div class="form-row" style="margin-top:10px">'
    +   '<label class="switch-row" style="padding:4px 0">'
    +     '<div>'
    +       '<div class="switch-label">ترحيل سجل حضور الشهر الحالي أيضاً</div>'
    +       '<div class="muted" style="font-size:11px">إن كانت الحصص متطابقة، تُنقل حالات الحضور والغياب مع الطالب.</div>'
    +     '</div>'
    +     '<label class="switch"><input type="checkbox" id="bm_inc_att"><span class="switch-slider"></span></label>'
    +   '</label>'
    + '</div>'
    + '<div class="modal-actions">'
    +   '<button class="btn btn-primary" id="bm_submit">' + (isCopy ? '📋 نسخ الطلاب للدرس المحدد' : '🔄 نقل الطلاب وحذفهم من الحالي') + '</button>'
    +   '<button class="btn btn-outline" id="bm_cancel">إلغاء</button>'
    + '</div>';

  openModal(isCopy ? '📋 نسخ وتكرار الطلاب' : '🔄 نقل الطلاب بين الدروس', html);

  function updateGroups(){
    const targetL = state.lessons.find(l => l.id === $('#bm_target_lesson').value);
    const grpSel = $('#bm_target_group');
    if(!targetL || !grpSel) return;
    let opts = '<option value="">بدون مجموعة</option>';
    (targetL.groups || []).forEach(g => {
      opts += '<option value="' + esc(g.id) + '">' + esc(g.name) + '</option>';
    });
    grpSel.innerHTML = opts;
  }
  $('#bm_target_lesson').onchange = updateGroups;
  updateGroups();

  $('#bm_cancel').onclick = closeModal;

  $('#bm_submit').onclick = () => {
    const targetL = state.lessons.find(l => l.id === $('#bm_target_lesson').value);
    if(!targetL) return;
    const targetGid = $('#bm_target_group').value;
    const incAtt = $('#bm_inc_att').checked;

    const toProcess = lesson.students.filter(st => selectedStudentIds.has(st.id));
    if(toProcess.length === 0){
      alert('لم يتم تحديد أي طلاب.');
      return;
    }

    // فحص الأسماء المكررة في الدرس المستهدف
    const existingDuplicates = [];
    const studentsToTransfer = [];

    toProcess.forEach(st => {
      const isDup = targetL.students.some(x => normalizeForSearch(x.name) === normalizeForSearch(st.name));
      if(isDup){
        existingDuplicates.push(st);
      } else {
        studentsToTransfer.push(st);
      }
    });

    if(studentsToTransfer.length === 0){
      alert('⚠️ تعذر تنفيذ العملية:\nجميع الطلاب المحددين (' + existingDuplicates.map(s => s.name).join('، ') + ') مسجلون بالفعل في درس «' + targetL.name + '»!\nلن يتم تكرار أسمائهم منعاً للازدواجية.');
      return;
    }

    // رسالة تأكيد واضحة قبل النقل أو النسخ
    let confirmMsg = 'هل أنت متأكد من ' + (isCopy ? 'نسخ' : 'نقل') + ' (' + studentsToTransfer.length + ') طالب من درس «' + lesson.name + '» إلى درس «' + targetL.name + '»؟';
    if(existingDuplicates.length > 0){
      confirmMsg += '\n\n⚠️ تنبيه: تم اكتشاف (' + existingDuplicates.length + ') طالب مسجلين بالفعل في الدرس المستهدف وسيتم تخطيهم منعاً للتكرار:\n• ' + existingDuplicates.map(s => s.name).join('\n• ');
    }

    if(!confirm(confirmMsg)) return;

    studentsToTransfer.forEach(st => {
      const targetStudent = JSON.parse(JSON.stringify(st));
      targetStudent.id = uid('s');
      targetStudent.groupId = targetGid;
      targetL.students.push(targetStudent);

      if(incAtt){
        if(!targetL.records[targetStudent.id]) targetL.records[targetStudent.id] = {};
        lesson.sessions.forEach((s, idx) => {
          const rec = (lesson.records[st.id] && lesson.records[st.id][s.id]);
          if(rec && targetL.sessions[idx]){
            targetL.records[targetStudent.id][targetL.sessions[idx].id] = JSON.parse(JSON.stringify(rec));
          }
        });
      }

      if(!isCopy){
        // حذف من الدرس الأصلي عند النقل
        lesson.students = lesson.students.filter(x => x.id !== st.id);
        delete lesson.records[st.id];
      }
    });

    selectedStudentIds.clear();
    isBulkSelecting = false;
    saveState();
    renderLessonDetail();
    closeModal();
    const dupNote = existingDuplicates.length > 0 ? ' (تم تخطي ' + existingDuplicates.length + ' طالب مكررين)' : '';
    showToastMessage('✅ تم ' + (isCopy ? 'نسخ' : 'نقل') + ' ' + studentsToTransfer.length + ' طالب بنجاح.' + dupNote);
  };
}

/* ---------- 6. النسخ الاحتياطي السحابي (Cloud Backup) ---------- */
async function cloudShareBackup(){
  const json = JSON.stringify(state, null, 2);
  const fn = 'daftar-backup-' + todayStr() + '.json';

  try {
    const file = new File([json], fn, { type: 'application/json' });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      await navigator.share({
        files: [file],
        title: 'نسخة احتياطية - تطبيق دفتر',
        text: 'نسخة احتياطية كاملة لبيانات دفتر بتاريخ ' + todayStr()
      });
      showToastMessage('✅ تمت المشاركة السحابية بنجاح.');
      return;
    }
  } catch(err) {
    if(err.name === 'AbortError') return;
  }

  // Fallback: تنزيل الملف للجهاز مع إشعار للمستخدم
  downloadBlob(json, fn, 'application/json');
  showToastMessage('⬇️ تم تنزيل النسخة الاحتياطية. يمكنك رفعها لـ Google Drive أو حفظها.');
}

async function telegramBackup(){
  const token = (state.settings.tgBotToken || '').trim();
  const chatId = (state.settings.tgChatId || '').trim();
  const statusEl = $('#tgStatus');

  if(!token || !chatId){
    alert('يرجى كتابة Bot Token و Chat ID الخاصين بك على تيليجرام أولاً من خانات الإعدادات بالأسفل.');
    return;
  }

  const lessons = state.lessons || [];
  const totalStudents = lessons.reduce((sum, l) => sum + (l.students ? l.students.length : 0), 0);

  let modalHTML = '<div class="reset-box" style="line-height:1.6;text-align:right">'
    + '<p style="font-size:13px;color:var(--text);margin-bottom:14px">'
    +   'حدد البيانات التي ترغب في تصديرها وإرسالها إلى محادثتك على تيليجرام:'
    + '</p>'
    + '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">'
    +   '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;background:#fff;border:1px solid var(--border);border-radius:10px;padding:10px 12px">'
    +     '<input type="radio" name="tg_scope" value="all" checked id="tg_scope_all" style="margin-top:3px">'
    +     '<div>'
    +       '<div style="font-weight:800;font-size:13px;color:var(--text)">📦 النسخة الكاملة للتطبيق</div>'
    +       '<div class="muted" style="font-size:11px;margin-top:2px">تشمل كل الدروس (' + lessons.length + ')، وجميع الطلاب (' + totalStudents + ')، والأرشيف، والإعدادات.</div>'
    +     '</div>'
    +   '</label>'
    +   '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;background:#fff;border:1px solid var(--border);border-radius:10px;padding:10px 12px">'
    +     '<input type="radio" name="tg_scope" value="selected" id="tg_scope_selected" style="margin-top:3px">'
    +     '<div>'
    +       '<div style="font-weight:800;font-size:13px;color:var(--text)">📚 تحديد درس أو دروس معينة فقط</div>'
    +       '<div class="muted" style="font-size:11px;margin-top:2px">اختر درساً محدداً أو عدة دروس لتصديرها كملف مستقل دون باقي البيانات.</div>'
    +     '</div>'
    +   '</label>'
    + '</div>'
    + '<div id="tg_lessons_picker" style="display:none;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:14px">'
    +   (lessons.length === 0
          ? '<p class="muted" style="font-size:12px;margin:0">لا توجد دروس حالياً للاختيار منها.</p>'
          : '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
            + '<span style="font-size:12px;font-weight:800">قائمة الدروس:</span>'
            + '<div style="display:flex;gap:6px">'
            +   '<button type="button" class="btn btn-sm btn-outline" id="tg_btn_select_all" style="font-size:11px;padding:2px 8px">تحديد الكل</button>'
            +   '<button type="button" class="btn btn-sm btn-outline" id="tg_btn_deselect_all" style="font-size:11px;padding:2px 8px">إلغاء التحديد</button>'
            + '</div>'
            + '</div>'
            + '<div style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:6px">'
            +   lessons.map(l => '<label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;background:#fff;border:1px solid var(--border);cursor:pointer">'
                + '<input type="checkbox" class="tg-lesson-cb" value="' + l.id + '" checked>'
                + '<span style="font-size:12px;font-weight:700">' + esc(l.name) + ' <small class="muted">(' + (l.students ? l.students.length : 0) + ' طالب · ' + (l.sessions ? l.sessions.length : 0) + ' حصة)</small></span>'
                + '</label>').join('')
            + '</div>')
    + '</div>'
    + '<div class="modal-actions" style="margin-top:16px">'
    +   '<button class="btn btn-primary" id="tg_btn_proceed">🚀 إرسال النسخة المحددة إلى تيليجرام</button>'
    +   '<button class="btn btn-outline" id="tg_btn_cancel">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('🤖 تصدير نسخة إلى تيليجرام', modalHTML);

  const scopeAll = $('#tg_scope_all');
  const scopeSel = $('#tg_scope_selected');
  const picker = $('#tg_lessons_picker');

  function updatePickerVis(){
    if(picker) picker.style.display = (scopeSel && scopeSel.checked) ? 'block' : 'none';
  }
  if(scopeAll) scopeAll.onchange = updatePickerVis;
  if(scopeSel) scopeSel.onchange = updatePickerVis;

  if($('#tg_btn_select_all')){
    $('#tg_btn_select_all').onclick = () => {
      $$('.tg-lesson-cb').forEach(cb => { cb.checked = true; });
    };
  }
  if($('#tg_btn_deselect_all')){
    $('#tg_btn_deselect_all').onclick = () => {
      $$('.tg-lesson-cb').forEach(cb => { cb.checked = false; });
    };
  }
  $('#tg_btn_cancel').onclick = closeModal;

  $('#tg_btn_proceed').onclick = () => {
    const isSelected = scopeSel && scopeSel.checked;
    let exportData, fn, caption;

    if(isSelected){
      const checkedIds = $$('.tg-lesson-cb:checked').map(cb => cb.value);
      if(checkedIds.length === 0){
        alert('يرجى تحديد درس واحد على الأقل لتصديره إلى تيليجرام.');
        return;
      }
      const selectedLessons = lessons.filter(l => checkedIds.includes(l.id));
      exportData = {
        type: 'daftar_lessons_export',
        version: state.version || 6,
        exportedAt: new Date().toISOString(),
        lessons: selectedLessons,
        settings: state.settings
      };
      if(selectedLessons.length === 1){
        const singleL = selectedLessons[0];
        const safeName = (singleL.name || 'lesson').replace(/[\s\/\\:?*"<>|]+/g, '_');
        fn = 'daftar-lesson-' + safeName + '-' + todayStr() + '.json';
        caption = '📦 نسخة درس من تطبيق دفتر: ' + singleL.name
          + '\n📅 التاريخ: ' + todayStr()
          + '\n👥 عدد الطلاب: ' + (singleL.students ? singleL.students.length : 0)
          + '\n🗓️ عدد الحصص: ' + (singleL.sessions ? singleL.sessions.length : 0);
      } else {
        fn = 'daftar-' + selectedLessons.length + '-lessons-' + todayStr() + '.json';
        caption = '📦 نسخة دروس مختارة من تطبيق دفتر (' + selectedLessons.length + ' دروس)'
          + '\n📅 التاريخ: ' + todayStr()
          + '\n📚 الدروس: ' + selectedLessons.map(l => l.name).join('، ');
      }
    } else {
      exportData = state;
      fn = 'daftar-backup-' + todayStr() + '.json';
      caption = '📦 نسخة احتياطية كاملة من تطبيق دفتر'
        + '\n📅 التاريخ: ' + todayStr()
        + '\n📚 عدد الدروس: ' + lessons.length
        + '\n👥 إجمالي الطلاب: ' + totalStudents;
    }

    closeModal();
    executeTelegramUpload(token, chatId, JSON.stringify(exportData, null, 2), fn, caption);
  };
}

async function executeTelegramUpload(token, chatId, json, fn, caption){
  const statusEl = $('#tgStatus');
  if(statusEl) statusEl.textContent = '⏳ جاري إرسال النسخة إلى تيليجرام...';

  const blob = new Blob([json], { type: 'application/json' });
  const fd = new FormData();
  fd.append('chat_id', chatId);
  fd.append('caption', caption);
  fd.append('document', blob, fn);

  try {
    const res = await fetch('https://api.telegram.org/bot' + token + '/sendDocument', {
      method: 'POST',
      body: fd
    });
    const data = await res.json();

    if(data.ok){
      if(statusEl) statusEl.textContent = '✅ تم الإرسال بنجاح!';
      showToastMessage('✅ تم إرسال النسخة المحددة لمحادثتك على تيليجرام بنجاح!');
      return;
    } else {
      if(statusEl) statusEl.textContent = '❌ خطأ: ' + (data.description || 'فشل الإرسال');
      alert('فشل الإرسال: ' + (data.description || 'تأكد من صحة التوكن والـ Chat ID وبدء المحادثة مع البوت أولاً (/start)'));
      return;
    }
  } catch(err) {
    if(statusEl) statusEl.textContent = '❌ تعذر الاتصال المباشر بتيليجرام';

    const modalBody = '<div style="padding:6px;text-align:right">'
      + '<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;padding:12px;margin-bottom:14px;color:#991b1b;font-size:13px;line-height:1.6">'
      +   '<b>⚠️ تعذر الاتصال المباشر بخوادم تيليجرام:</b><br>'
      +   'مزودو خدمة الإنترنت في بعض الدول (مثل مصر) يحجبون الاتصال المباشر بـ <code>api.telegram.org</code> داخل المتصفحات.'
      + '</div>'
      + '<p style="font-size:13px;font-weight:700;margin-bottom:10px">💡 يمكنك حفظ النسخة المحددة بسهولة بإحدى الطريقتين التاليتين:</p>'
      + '<div style="display:flex;flex-direction:column;gap:10px">'
      +   '<button class="btn btn-primary" id="tg_alt_share">📲 مشاركة الملف مباشرة لتطبيق Telegram / Drive</button>'
      +   '<button class="btn btn-outline" id="tg_alt_download">⬇️ تنزيل ملف النسخة لجهازك (' + esc(fn) + ')</button>'
      + '</div>'
      + '<div class="modal-actions" style="margin-top:14px">'
      +   '<button class="btn btn-outline" id="tg_alt_close">إغلاق</button>'
      + '</div>'
      + '</div>';

    openModal('🤖 النسخ الاحتياطي عبر تيليجرام', modalBody);
    $('#tg_alt_close').onclick = closeModal;
    $('#tg_alt_download').onclick = () => {
      closeModal();
      downloadBlob(json, fn, 'application/json');
    };
    $('#tg_alt_share').onclick = () => {
      closeModal();
      if(navigator.share && navigator.canShare){
        try {
          const shareFile = new File([blob], fn, { type: 'application/json' });
          navigator.share({ files: [shareFile], title: 'نسخة دفتر الاحتياطية', text: caption }).catch(()=>{});
        } catch(e){
          downloadBlob(json, fn, 'application/json');
        }
      } else {
        downloadBlob(json, fn, 'application/json');
      }
    };
  }
}

/* ---------- 7. إعادة الضبط والبدء من جديد (Reset) ---------- */
function openResetModal(){
  const lessons = state.lessons || [];

  let optionsHTML = '<div class="reset-box">'
    + '<p style="font-size:13px;color:var(--text);margin-bottom:16px;line-height:1.6">'
    +   'اختر نوع إعادة الضبط المطلوب. لن يتم مسح أي شيء إلا بعد إعطائك رسالة تأكيد واضحة:'
    + '</p>'
    + '<div class="reset-options-list">'

    // 1. ريست كلمة سر الدخل
    + '<div class="reset-opt-card">'
    +   '<div class="reset-opt-head">'
    +     '<div class="reset-opt-title">🔑 تصفير كلمة سر قسم الدخل والأمان</div>'
    +     '<button class="btn btn-sm btn-outline" id="btnResetPassword">تصفير كلمة السر</button>'
    +   '</div>'
    +   '<div class="reset-opt-desc">يتطلب إدخال كود التفعيل المعتمد (من المطور) لمحو كلمة سر الدخل الحالية وسؤال الأمان، دون المساس بأي من الدروس أو الطلاب.</div>'
    + '</div>'

    // 2. ريست درس محدد
    + '<div class="reset-opt-card">'
    +   '<div class="reset-opt-title">📚 تصفير درس محدد بالكامل</div>'
    +   '<div class="reset-opt-desc">يمحو طلاب الدرس وسجل حضورهم وغيابهم ودرجات الاختبارات وسجل المدفوعات، مع الإبقاء على اسم ومواعيد الدرس.</div>'
    +   (lessons.length > 0
          ? '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
            + '<select id="reset_target_lesson" style="flex:1;min-width:180px;padding:6px 10px;border-radius:8px;border:1px solid var(--border)">'
            +   lessons.map(l => '<option value="' + l.id + '">' + esc(l.name) + ' (' + (l.students ? l.students.length : 0) + ' طالب)</option>').join('')
            + '</select>'
            + '<button class="btn btn-sm btn-danger" id="btnResetLesson">تصفير الدرس المختار</button>'
            + '</div>'
          : '<p class="muted" style="font-size:12px;margin-top:6px">لا توجد دروس حالياً.</p>')
    + '</div>'

    // 3. ريست الإعدادات فقط
    + '<div class="reset-opt-card">'
    +   '<div class="reset-opt-head">'
    +     '<div class="reset-opt-title">⚙️ إعادة ضبط الإعدادات فقط</div>'
    +     '<button class="btn btn-sm btn-outline" id="btnResetSettings">استرجاع الإعدادات الافتراضية</button>'
    +   '</div>'
    +   '<div class="reset-opt-desc">يسترجع الحالات الافتراضية والألوان ومؤشرات الغياب وعناوين الأعمدة الأصلية، مع الحفاظ الكامل على كافة الدروس والطلاب والأرشيف.</div>'
    + '</div>'

    // 4. ريست شامل للتطبيق
    + '<div class="reset-opt-card" style="border-color:#fca5a5;background:#fff5f5">'
    +   '<div class="reset-opt-head">'
    +     '<div class="reset-opt-title" style="color:#b91c1c">💥 إعادة ضبط المصنع الشاملة</div>'
    +     '<button class="btn btn-sm btn-danger" id="btnResetAll">تصفير كل شيء</button>'
    +   '</div>'
    +   '<div class="reset-opt-desc" style="color:#7f1d1d">يمحو كل البيانات والدروس والأرشيف والإعدادات ويبدأ التطبيق من الصفر تماماً كما لو تم تثبيته لأول مرة.</div>'
    + '</div>'

    + '</div>'
    + '<div class="modal-actions" style="margin-top:16px"><button class="btn btn-outline" id="reset_close">إغلاق</button></div>'
    + '</div>';

  openModal('⚠️ خيارات إعادة الضبط (Reset)', optionsHTML);
  $('#reset_close').onclick = closeModal;

  // 1. تصفير كلمة سر الدخل
  $('#btnResetPassword').onclick = () => {
    if(!state.moneyPasswordHash && !state.moneySecurityQ){
      alert('قسم الدخل غير محمي بكلمة سر حالياً.');
      return;
    }
    openResetPasswordAuthModal();
  };

  // 2. تصفير درس محدد
  const btnResetL = $('#btnResetLesson');
  if(btnResetL){
    btnResetL.onclick = () => {
      const lid = $('#reset_target_lesson').value;
      const targetL = state.lessons.find(l => l.id === lid);
      if(!targetL) return;

      const studentCount = targetL.students ? targetL.students.length : 0;
      const warnMsg = '⚠️ تحذير شديد الأهمية:\n'
        + 'أنت على وشك تصفير درس «' + targetL.name + '».\n'
        + 'سيتم حذف جميع الطلاب (' + studentCount + ' طالب)، وسجلات حضورهم وغيابهم، ودرجات الاختبارات، وسجل المدفوعات بالكامل!\n\n'
        + 'هل تريد المتابعة وتفريغ هذا الدرس؟';

      if(!confirm(warnMsg)) return;

      const confirmText = prompt('لتأكيد تصفير درس «' + targetL.name + '»، اكتب كلمة (تأكيد):');
      if(confirmText !== 'تأكيد' && confirmText !== 'تاكيد'){
        alert('لم يتم التصفير لأنك لم تكتب كلمة التأكيد بشكل صحيح.');
        return;
      }

      targetL.students = [];
      targetL.records = {};
      targetL.exams = [];
      targetL.examScores = {};
      fillSessions(targetL);

      saveState();
      renderAll();
      closeModal();
      showToastMessage('✅ تم تصفير درس «' + targetL.name + '» بنجاح.');
    };
  }

  // 3. تصفير الإعدادات فقط
  $('#btnResetSettings').onclick = () => {
    if(!confirm('هل تريد استرجاع إعدادات التطبيق الافتراضية (الحالات، العناوين، مؤشرات الغياب)؟ لن يتم حذف أي دروس أو طلاب.')) return;
    const def = defaultState();
    state.settings.statuses = def.settings.statuses;
    state.settings.attendanceIndicators = def.settings.attendanceIndicators;
    state.settings.customFields = [];
    state.settings.appTitle = def.settings.appTitle;
    state.settings.monthTitleTemplate = def.settings.monthTitleTemplate;
    state.settings.studentLabel = def.settings.studentLabel;
    state.settings.notesLabel = def.settings.notesLabel;
    saveState();
    renderAll();
    closeModal();
    showToastMessage('✅ تم استرجاع الإعدادات الافتراضية بنجاح.');
  };

  // 4. تصفير شامل
  $('#btnResetAll').onclick = () => {
    const promptAns = prompt('⚠️ تنبيه نهائي: سيتم محو كل البيانات في تطبيق دفتر بالكامل والبدء من الصفر.\n\nلتأكيد مسح كافة البيانات، اكتب كلمة (تأكيد):');
    if(promptAns !== 'تأكيد' && promptAns !== 'تاكيد'){
      alert('تم إلغاء التصفير الشامل.');
      return;
    }
    state = defaultState();
    currentLessonId = null;
    moneyUnlocked = false;
    saveState();
    renderAll();
    closeModal();
    showToastMessage('🔄 تم تصفير كافة بيانات التطبيق بالكامل.');
  };
}

function renderLessonDetail(){
  const L = state.lessons.find(x => x.id === currentLessonId);
  const home = $('#lessonsHome');
  const detail = $('#lessonDetail');
  if(!L){
    home.style.display = 'block';
    detail.style.display = 'none';
    return;
  }
  home.style.display = 'none';
  detail.style.display = 'block';

  $('#lessonTitle').textContent = L.name;
  $('#lessonMeta').textContent = esc(scheduleLabel(L)) + ' · ' + L.students.length + ' طالب · شهر ' + L.monthNumber + '/' + L.year + (L.subscription ? ' · اشتراك شهري' : '') + (L.groups.length ? ' · ' + L.groups.length + ' مجموعة' : '');

  // الدخل داخل الدرس (اشتراك)
  const incEl = $('#lessonIncome');
  if(incEl){
    if(L.subscription && (L.price||0) > 0){
      const cnt = L.students.length;
      let totalCollected = 0;
      L.students.forEach(st => {
        const payments = st.payments || [];
        if(payments.length > 0){
          totalCollected += payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        } else if(st.paid){
          totalCollected += L.price;
        }
      });
      const total = cnt * L.price;
      incEl.innerHTML = '💰 التحصيل: <b>' + moneyDisplay(totalCollected) + ' / ' + moneyDisplay(total) + ' ج.م</b>';
      incEl.style.display = '';
    } else {
      incEl.style.display = 'none';
    }
  }

  renderGroupFilter(L);

  // فلترة حسب البحث الداخلي والمجموعة
  let students = L.students;
  if(groupFilterQuery === '__none__') students = students.filter(st => !st.groupId);
  else if(groupFilterQuery) students = students.filter(st => st.groupId === groupFilterQuery);
  const fq = lessonFilterQuery.trim().toLowerCase();
  const fqN = normalizeForSearch(lessonFilterQuery);
  if(fq){
    const numQ = parseInt(fq, 10);
    const isNum = !isNaN(numQ) && String(numQ) === fq;
    students = students.filter(st => {
      if(isNum && (L.students.findIndex(x => x.id === st.id) + 1) === numQ) return true;
      return normalizeForSearch(st.name).includes(fqN) || (st.phone||'').includes(fq) || (st.guardianPhone||'').includes(fq) || (st.extraPhones||[]).some(p => p.includes(fq)) || (st.guardianExtraPhones||[]).some(p => p.includes(fq));
    });
  }

  // التحكم بالتبويب الفرعي (حضور وغياب أم درجات اختبارات)
  const subtabAtt = $('#subtabAttendance');
  const subtabEx = $('#subtabExams');
  const attWrap = $('#attendanceWrap') || $('.table-wrap');
  const attLegend = $('#attendanceLegend') || $('#statusLegend');
  const attHint = $('#attendanceHint');
  const examsView = $('#examsView');

  if(subtabAtt && subtabEx){
    subtabAtt.classList.toggle('active', currentLessonSubtab === 'attendance');
    subtabEx.classList.toggle('active', currentLessonSubtab === 'exams');
  }

  if(currentLessonSubtab === 'exams'){
    if(attWrap) attWrap.style.display = 'none';
    if(attLegend) attLegend.style.display = 'none';
    if(attHint) attHint.style.display = 'none';
    if(examsView) examsView.style.display = 'block';
    renderExamsTable(L, students);
    return;
  } else {
    if(attWrap) attWrap.style.display = '';
    if(attLegend) attLegend.style.display = '';
    if(attHint) attHint.style.display = '';
    if(examsView) examsView.style.display = 'none';
  }

  // تحديث شريط التحديد المتعدد
  const bulkBar = $('#bulkActionBar');
  const bulkBtn = $('#bulkSelectBtn');
  if(bulkBtn){
    bulkBtn.textContent = isBulkSelecting ? '☑️ إنهاء التحديد' : '☑️ تحديد متعدد';
    bulkBtn.className = isBulkSelecting ? 'btn btn-primary' : 'btn btn-outline';
  }
  if(bulkBar){
    bulkBar.style.display = isBulkSelecting ? 'flex' : 'none';
    const cntEl = $('#bulkSelectedCount');
    if(cntEl) cntEl.textContent = selectedStudentIds.size;
  }

  const sd = state.settings;
  const eff = effectiveStatuses(L);
  const head = $('#tableHead');
  const body = $('#tableBody');

  let h = '<tr>';
  if(isBulkSelecting){
    const allChecked = students.length > 0 && students.every(st => selectedStudentIds.has(st.id));
    h += '<th class="bulk-select-cell"><input type="checkbox" id="bulkSelectAll"' + (allChecked ? ' checked' : '') + ' title="تحديد/إلغاء الكل"></th>';
  }
  h += '<th class="sticky-col">' + esc(sd.studentLabel) + '</th>';
  sd.customFields.forEach(f => { h += '<th class="field-col">' + esc(f.label) + '</th>'; });
  L.sessions.forEach((s, sIdx) => {
    h += '<th class="session-col-drag" draggable="true" data-session-id="'+s.id+'" data-idx="'+sIdx+'"><div class="week-head">'
       + '<span class="week-title" title="اضغط لتعديل مسمى الحصة" data-act="edit-session-label" data-id="'+s.id+'">' + esc(s.label) + '</span>'
       + '<span class="week-date" title="اضغط لتعديل التاريخ والترتيب الزمني" data-act="edit-session-date" data-id="'+s.id+'">' + (s.dateLabel ? esc(s.dateLabel) : 'بدون تاريخ') + '</span>'
       + (s.event ? '<span class="week-event" title="اضغط لتعديل الحدث" data-act="edit-session-event" data-id="'+s.id+'">📝 ' + esc(s.event) + '</span>' : '')
       + '<div class="week-tools">'
       + (sIdx > 0 ? '<button class="mini-btn" data-act="shift-session-left" data-id="'+s.id+'" title="تحريك لليمين (سابق)">◀</button>' : '')
       + (sIdx < L.sessions.length - 1 ? '<button class="mini-btn" data-act="shift-session-right" data-id="'+s.id+'" title="تحريك لليسار (تالي)">▶</button>' : '')
       + '<button class="mini-btn" data-act="bulk-attendance" data-id="'+s.id+'" title="⚡ التحضير السريع الجماعي للحصة">⚡</button>'
       + '<button class="mini-btn mini-edit" data-act="edit-session-event" data-id="'+s.id+'" title="حدث الحصة">📝</button>'
       + '<button class="mini-btn mini-wa" data-act="session-summary" data-id="'+s.id+'" title="ملخص واتساب">📤</button>'
       + '<button class="del-week" data-act="del-session" data-id="'+s.id+'" title="حذف الحصة">✕</button>'
       + '</div>'
       + '</div></th>';
  });
  h += '<th>' + esc(sd.notesLabel) + '</th></tr>';
  head.innerHTML = h;

  let b = '';
  students.forEach(st => {
    const realIdx = L.students.findIndex(x => x.id === st.id);
    const g = (L.groups||[]).find(x => x.id === st.groupId);
    const ps = pastSessions(L.sessions);
    const stPct = ps.length ? Math.round(ps.filter(s => (L.records[st.id]||{})[s.id] && L.records[st.id][s.id].status === 'st_done').length / ps.length * 100) : 0;
    const ind = ps.length > 0 ? attendanceIndicator(stPct) : null;

    let payPillHTML = '';
    if(L.subscription){
      const subPrice = L.price || 0;
      const payments = st.payments || [];
      const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) + (st.paid && payments.length === 0 ? subPrice : 0);
      const remaining = Math.max(0, subPrice - totalPaid);
      let pillClass = 'pay-pill-none', pillText = '❌ غير مسدد';
      if(totalPaid >= subPrice && subPrice > 0){
        pillClass = 'pay-pill-full';
        pillText = '✅ مسدد (' + totalPaid + ')';
      } else if(totalPaid > 0){
        pillClass = 'pay-pill-part';
        pillText = '⏳ مدفوع ' + totalPaid + (remaining > 0 ? ' (باقي ' + remaining + ')' : '');
      }
      payPillHTML = '<div class="pay-pill ' + pillClass + '" data-act="open-payments" data-id="' + st.id + '" title="اضغط لفتح سجل المدفوعات والمصروفات">' + pillText + '</div>';
    }

    b += '<tr class="student-row" draggable="true" data-drag-id="'+st.id+'">';
    if(isBulkSelecting){
      b += '<td class="bulk-select-cell"><input type="checkbox" class="bulk-student-check" data-id="' + st.id + '"' + (selectedStudentIds.has(st.id) ? ' checked' : '') + '></td>';
    }
    b += '<td class="sticky-col student-cell">'
       +   '<div class="student-name">'
       +     '<input class="order-input" type="number" min="1" max="'+L.students.length+'" value="'+(realIdx+1)+'" data-act="order" data-id="'+st.id+'" title="اكتب رقم الترتيب الجديد ثم اضغط Enter"> '
       +     (st.photo ? '<img src="'+st.photo+'" class="st-avatar-mini" alt="">' : '<span class="st-avatar-initial">'+esc((st.name||'').trim().charAt(0) || '👤')+'</span>')
       +     ' <span class="st-name-click" data-act="view-student" data-id="'+st.id+'" title="اضغط لفتح الملف الشخصي للطالب">' + esc(st.name) + '</span>'
       +     (g ? ' <span class="badge-group">'+esc(g.name)+'</span>' : '')
       +     (ind ? ' <span class="badge-indicator" style="background:'+ind.color+'" title="'+esc(ind.label)+' ('+stPct+'%)">'+esc(ind.label)+'</span>' : '')
       +   '</div>'
       +   '<div class="student-phone">' + esc(st.phone) + '</div>'
       +   (L.subscription && st.guardianPhone ? '<div class="student-phone">👨 ولي الأمر: ' + esc(st.guardianPhone) + ' <a class="mini-btn mini-call" href="tel:'+esc(st.guardianPhone)+'">📞 اتصال</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+st.id+'" data-phone="'+esc(st.guardianPhone)+'">واتساب</button></div>' : '')
       +   ((st.guardianExtraPhones||[]).map(p => '<div class="student-phone">👨 ' + esc(p) + ' <a class="mini-btn mini-call" href="tel:'+esc(p)+'">📞 اتصال</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+st.id+'" data-phone="'+esc(p)+'">واتساب</button></div>').join(''))
       +   ((st.extraPhones||[]).map(p => '<div class="student-phone">📱 ' + esc(p) + ' <a class="mini-btn mini-call" href="tel:'+esc(p)+'">📞 اتصال</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+st.id+'" data-phone="'+esc(p)+'">واتساب</button></div>').join(''))
       +   '<div class="student-actions">'
       +     '<button class="mini-btn mini-move" data-act="move-student" data-id="'+st.id+'" data-dir="up"'+(realIdx===0?' disabled':'')+' title="تحريك لأعلى">▲</button>'
       +     '<button class="mini-btn mini-move" data-act="move-student" data-id="'+st.id+'" data-dir="down"'+(realIdx===L.students.length-1?' disabled':'')+' title="تحريك لأسفل">▼</button>'
       +     (st.phone ? '<a class="mini-btn mini-call" href="tel:' + esc(st.phone) + '">📞 اتصال</a>' : '')
       +     (st.phone ? '<button class="mini-btn mini-wa" data-act="wa" data-id="'+st.id+'">واتساب</button>' : '')
       +     '<button class="mini-btn mini-wa" data-act="student-summary" data-id="'+st.id+'" title="ملخص حضور الطالب وإرساله له">📤 ملخص</button>'
       +     (L.subscription ? '<button class="mini-btn" data-act="open-payments" data-id="'+st.id+'" title="سجل مدفوعات ومصروفات الطالب">💰 المصروفات</button>' : '')
       +     '<button class="mini-btn mini-edit" data-act="edit-student" data-id="'+st.id+'" title="تعديل بيانات الطالب">✏️</button>'
       +     '<button class="mini-btn mini-del" data-act="del-student" data-id="'+st.id+'" title="حذف الطالب">🗑️</button>'
       +   '</div>'
       +   payPillHTML
       +   (L.subscription ? '<label class="paid-toggle"><input type="checkbox" data-act="paid" data-id="'+st.id+'"'+(st.paid?' checked':'')+'> دفع كامل الاشتراك</label>' : '')
       + '</td>';

    sd.customFields.forEach(f => {
      b += '<td class="field-cell"><input type="text" class="field-input" data-act="field" data-id="'+st.id+'" data-fid="'+f.id+'" value="'+esc((st.fields||{})[f.id]||'')+'" placeholder="..."></td>';
    });

    L.sessions.forEach(s => {
      const rec = (L.records[st.id] && L.records[st.id][s.id]) || {};
      b += '<td><div class="cell-wrap">'
         + statusSelectHTML(st.id, s.id, rec.status || '', null, eff)
         + dayNoteHTML(st.id, s.id, rec.note || '')
         + '</div></td>';
    });

    const note = (L.records[st.id] && L.records[st.id]['__note__']) || '';
    b += '<td><textarea class="note-input" data-act="note" data-id="'+st.id+'" placeholder="...">' + esc(note) + '</textarea></td></tr>';
  });

  const totalCols = L.sessions.length + 2 + sd.customFields.length + (isBulkSelecting ? 1 : 0);
  if(students.length === 0){
    b = '<tr><td colspan="' + totalCols + '"><div class="empty-state">' + (fq ? 'لا نتائج مطابقة للبحث.' : 'لا يوجد أعضاء - اضغط «عضو جديد» لإضافة أول اسم.') + '</div></td></tr>';
  }
  let tf = '<tr class="count-row">';
  if(isBulkSelecting) tf += '<td></td>';
  tf += '<td class="sticky-col">حضور الحصة</td>';
  sd.customFields.forEach(() => tf += '<td></td>');
  L.sessions.forEach(s => {
    let c = 0;
    L.students.forEach(st => {
      const rec = (L.records[st.id] && L.records[st.id][s.id]) || {};
      if(rec.status === 'st_done') c++;
    });
    tf += '<td title="عدد الطلاب الحاضرين (علامة تم) من إجمالي الطلاب"><b>' + c + ' / ' + L.students.length + '</b></td>';
  });
  tf += '<td></td></tr>';
  body.innerHTML = b;
  const footEl = $('#tableFoot');
  if(footEl) footEl.innerHTML = tf;

  const legEl = $('#attendanceLegend') || $('#statusLegend');
  if(legEl){
    legEl.innerHTML = eff.map(s =>
      '<span><span class="dot" style="background:'+esc(s.color)+'"></span>'+esc(s.label)+'</span>'
    ).join('');
  }
  updateExportReminder();
}

function statusSelectHTML(studentId, sessionId, current, archIdx, statuses){
  const sd = statuses || state.settings.statuses;
  let cls = 'status-select s-empty';
  if(current){
    if(current === 'st_done') cls = 'status-select s-done';
    else if(current === 'st_apology') cls = 'status-select s-apology';
    else if(current === 'st_noanswer') cls = 'status-select s-noanswer';
    else cls = 'status-select s-custom';
  }
  let opts = '<option value="">-</option>';
  sd.forEach(s => {
    opts += '<option value="'+esc(s.id)+'"' + (s.id===current?' selected':'') + '>'+esc(s.label)+'</option>';
  });
  const archAttr = (archIdx !== undefined && archIdx !== null) ? ' data-arch="'+archIdx+'"' : '';
  return '<select class="'+cls+'" data-act="status"'+archAttr+' data-sid="'+studentId+'" data-ssid="'+sessionId+'">'+opts+'</select>';
}

function dayNoteHTML(studentId, sessionId, note, archIdx){
  const has = note && note.trim();
  const archAttr = (archIdx !== undefined && archIdx !== null) ? ' data-arch="'+archIdx+'"' : '';
  return '<button class="day-note-btn' + (has ? ' has-note' : '') + '" data-act="day-note"'+archAttr+' data-sid="'+studentId+'" data-ssid="'+sessionId+'" title="' + (has ? 'عرض/تعديل ملاحظة اليوم' : 'إضافة ملاحظة لهذا اليوم') + '">' + (has ? '💬 ملاحظة' : '📝 ملاحظة') + '</button>';
}

/* ---------- الأرشيف ---------- */
function renderArchive(){
  const list = $('#archiveList');
  if(state.archive.length === 0){
    list.innerHTML = '<div class="empty-state">لا يوجد أرشيف بعد. عند إنهاء شهر أي درس سيُحفظ هنا.</div>';
  } else {
    const sorted = state.archive.slice().sort((a,b) => new Date(b.archivedAt) - new Date(a.archivedAt));
    list.innerHTML = sorted.map(a => {
      const idx = state.archive.indexOf(a);
      return '<div class="archive-card" data-act="open-archive" data-idx="'+idx+'">'
        + '<div class="m-title">'+esc(a.lessonName)+(a.subscription?' <span class="badge-sub">اشتراك</span>':'')+'</div>'
        + '<div class="m-meta">' + esc(buildMonthTitle(a.monthNumber)) + ' - ' + a.monthNumber + '/' + a.year + ' · ' + a.sessions.length + ' حصة</div>'
        + '</div>';
    }).join('');
  }
  $('#archiveDetail').innerHTML = '';
}

function archiveStudents(a){
  if(Array.isArray(a.students) && a.students.length) return a.students;
  const L = state.lessons.find(x => x.id === a.lessonId);
  return L ? L.students : [];
}

function renderArchiveDetail(idx){
  const a = state.archive[idx];
  if(!a) return;
  const L = state.lessons.find(x => x.id === a.lessonId);
  const eff = L ? effectiveStatuses(L) : state.settings.statuses;
  const container = $('#archiveDetail');
  container.innerHTML =
    '<div class="detail-card">'
    + '<h3 style="margin-top:0">'+esc(a.lessonName)+' - '+esc(buildMonthTitle(a.monthNumber))+'</h3>'
    + '<p class="muted">'+a.monthNumber+'/'+a.year+' · '+a.sessions.length+' حصة · أُرشف في '+new Date(a.archivedAt).toLocaleString('ar-EG')+'</p>'
    + '<div class="detail-actions">'
    +   '<button class="btn" data-act="analytics" data-idx="'+idx+'">📊 التحليل والتقرير</button>'
    +   '<button class="btn btn-outline" data-act="csv" data-idx="'+idx+'">⬇️ Excel (CSV)</button>'
    +   '<button class="btn btn-outline" data-act="pdf" data-idx="'+idx+'">🖨️ PDF (A4)</button>'
    +   '<button class="btn btn-whatsapp" data-act="archive-report-msg" data-idx="'+idx+'">📨 تقرير كرسالة</button>'
    +   '<button class="btn btn-whatsapp" data-act="archive-seq-msg" data-idx="'+idx+'">📲 مراسلة جماعية</button>'
    +   '<button class="btn btn-outline" data-act="arch-add-session" data-idx="'+idx+'">➕ حصة</button>'
    +   '<button class="btn btn-outline" data-act="export-archive" data-idx="'+idx+'">⬇️ تصدير الشهر</button>'
    +   '<button class="btn" data-act="restore-archive" data-idx="'+idx+'" title="إرجاع الشهر للصفحة الرئيسية للتعديل ثم أرشفته من جديد">♻️ استعادة الشهر</button>'
    +   '<button class="btn btn-danger" data-act="del-archive" data-idx="'+idx+'">🗑️ حذف</button>'
    + '</div>'
    + '<p class="hint">💡 تعديل كامل: الحالات والملاحظات والدفع + إضافة/حذف حصة وتعديل تاريخها والحدث وملخص الحصة وتقرير كرسالة - يُحفظ في الأرشيف فوراً.</p>'
    + archiveTableHTML(a, idx, eff)
    + '</div>';
  container.scrollIntoView({behavior:'smooth'});
}

function archiveTableHTML(a, idx, statuses){
  const sd = state.settings;
  const students = archiveStudents(a);
  let h = '<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th class="sticky-col">'+esc(sd.studentLabel)+'</th>';
  sd.customFields.forEach(f => { h += '<th class="field-col">'+esc(f.label)+'</th>'; });
  a.sessions.forEach(s => {
    h += '<th><div class="week-head">'
       + '<span>'+esc(s.label)+'</span>'
       + '<span class="week-date" title="اضغط لتعديل التاريخ" data-act="edit-session-date" data-arch="'+idx+'" data-id="'+s.id+'">'+esc(s.dateLabel||'بدون تاريخ')+'</span>'
       + (s.event ? '<span class="week-event" data-act="edit-session-event" data-arch="'+idx+'" data-id="'+s.id+'">📝 '+esc(s.event)+'</span>' : '')
       + '<button class="del-week" data-act="del-session" data-arch="'+idx+'" data-id="'+s.id+'" title="حذف الحصة">حذف</button>'
       + '<div class="week-tools">'
       + '<button class="mini-btn mini-edit" data-act="edit-session-event" data-arch="'+idx+'" data-id="'+s.id+'">📝 حدث</button>'
       + '<button class="mini-btn mini-wa" data-act="session-summary" data-arch="'+idx+'" data-id="'+s.id+'">📤 ملخص</button>'
       + '</div></div></th>';
  });
  h += '<th>'+esc(sd.notesLabel)+'</th>';
  if(a.subscription) h += '<th>دفع الاشتراك</th>';
  h += '</tr></thead><tbody>';
  const ids = students.map(x => x.id).concat(Object.keys(a.records));
  Array.from(new Set(ids)).forEach(sid => {
    const st = students.find(x => x.id === sid);
    const name = st ? st.name : sid;
    h += '<tr><td class="sticky-col student-cell"><div class="student-name">'+esc(name)+'</div></td>';
    sd.customFields.forEach(f => { h += '<td>' + esc((st && st.fields && st.fields[f.id]) || '') + '</td>'; });
    a.sessions.forEach(s => {
      const rec = (a.records[sid] && a.records[sid][s.id]) || {};
      h += '<td><div class="cell-wrap">'
         + statusSelectHTML(sid, s.id, rec.status || '', idx, statuses)
         + dayNoteHTML(sid, s.id, rec.note || '', idx)
         + '</div></td>';
    });
    const note = (a.records[sid] && a.records[sid]['__note__']) || '';
    h += '<td><textarea class="note-input" data-act="note" data-arch="'+idx+'" data-id="'+sid+'" placeholder="...">' + esc(note) + '</textarea></td>';
    if(a.subscription) h += '<td><label class="paid-toggle"><input type="checkbox" data-act="paid" data-arch="'+idx+'" data-id="'+sid+'"'+(st && st.paid?' checked':'')+'> دفع</label></td>';
    h += '</tr>';
  });
  h += '</tbody><tfoot><tr class="count-row"><td class="sticky-col">حضور الحصة</td>';
  sd.customFields.forEach(() => h += '<td></td>');
  a.sessions.forEach(s => {
    let c = 0;
    const sts = students;
    sts.forEach(st => { const rec = (a.records[st.id] && a.records[st.id][s.id]) || {}; if(rec.status === 'st_done') c++; });
    h += '<td><b>' + c + ' / ' + sts.length + '</b></td>';
  });
  h += '<td></td>';
  if(a.subscription) h += '<td></td>';
  h += '</tr></tfoot></table></div>';
  return h;
}

/* ---------- الإعدادات ---------- */
function renderSettings(){
  const sd = state.settings;
  if($('#set_appTitle')) $('#set_appTitle').value = sd.appTitle;
  if($('#set_monthTitle')) $('#set_monthTitle').value = sd.monthTitleTemplate;
  if($('#set_studentLabel')) $('#set_studentLabel').value = sd.studentLabel;
  if($('#set_notesLabel')) $('#set_notesLabel').value = sd.notesLabel;
  if($('#set_whatsappNumber')) $('#set_whatsappNumber').value = sd.whatsappNumber;
  if($('#set_whatsappType')) $('#set_whatsappType').value = sd.whatsappType;
  if($('#set_messageTemplate')) $('#set_messageTemplate').value = sd.messageTemplate;
  if($('#set_tgBotToken')) $('#set_tgBotToken').value = sd.tgBotToken || '';
  if($('#set_tgChatId')) $('#set_tgChatId').value = sd.tgChatId || '';
  
  const wf = $('#set_warnFuture');
  if(wf) wf.checked = sd.warnFutureAttendance !== false;

  const notifSw = $('#set_enableNotif');
  if(notifSw) notifSw.checked = notifSupported() && (Notification.permission === 'granted');

  const asSw = $('#set_enableAutoSave');
  if(asSw) asSw.checked = autoSaveReady;

  updateNotifStatus();
  updateAutoSaveStatus();

  $('#customFieldsList').innerHTML = sd.customFields.map((f, i) =>
    '<div class="status-edit-row" data-fid="'+f.id+'">'
    + '<input type="text" value="'+esc(f.label)+'" data-act="field-label" data-id="'+f.id+'">'
    + '<button class="btn-move" data-act="field-move-up" data-id="'+f.id+'" title="تحريك لأعلى" '+(i===0?'disabled':'')+'>⬆️</button>'
    + '<button class="btn-move" data-act="field-move-down" data-id="'+f.id+'" title="تحريك لأسفل" '+(i===sd.customFields.length-1?'disabled':'')+'>⬇️</button>'
    + '<button class="del-status" data-act="del-field" data-id="'+f.id+'">حذف</button>'
    + '</div>'
  ).join('') || '<p class="muted">لا توجد أعمدة إضافية.</p>';

  $('#statusList').innerHTML = sd.statuses.map(s =>
    '<div class="status-edit-row">'
    + '<input type="color" value="'+esc(s.color)+'" data-act="status-color" data-id="'+s.id+'">'
    + '<input type="text" value="'+esc(s.label)+'" data-act="status-label" data-id="'+s.id+'">'
    + '<button class="del-status" data-act="del-status" data-id="'+s.id+'">حذف</button>'
    + '</div>'
  ).join('');

  /* مؤشرات خطر الغياب */
  const indicators = sd.attendanceIndicators || [];
  $('#indicatorList').innerHTML = indicators.map(ind =>
    '<div class="status-edit-row">'
    + '<input type="color" value="'+esc(ind.color)+'" data-act="ind-color" data-id="'+ind.id+'">'
    + '<input type="text" value="'+esc(ind.label)+'" data-act="ind-label" data-id="'+ind.id+'" style="width:90px">'
    + '<input type="number" value="'+ind.minPct+'" data-act="ind-pct" data-id="'+ind.id+'" min="0" max="100" style="width:55px" title="الحد الأدنى لنسبة الحضور %">%'
    + '</div>'
  ).join('') || '<p class="muted">لا توجد مؤشرات.</p>';
}

/* ---------- الإشعارات والتذكيرات ---------- */
let notifTimers = [];
function notifSupported(){ return ('Notification' in window); }
function updateNotifStatus(){
  const el = $('#notifStatus');
  if(!el) return;
  const notifSw = $('#set_enableNotif');
  if(!notifSupported()){
    el.textContent = '⚠️ الإشعارات غير مدعومة في هذا المتصفح.';
    if(notifSw) notifSw.disabled = true;
    return;
  }
  if(Notification.permission === 'granted'){
    el.textContent = '✅ الإشعارات مفعّلة - تذكير قبل موعد كل حصة.';
    if(notifSw) notifSw.checked = true;
  } else if(Notification.permission === 'denied'){
    el.textContent = '⛔ تم حظر الإشعارات من المتصفح (فعّلها من إعدادات الموقع).';
    if(notifSw) notifSw.checked = false;
  } else {
    el.textContent = '🔕 الإشعارات غير مفعّلة بعد.';
    if(notifSw) notifSw.checked = false;
  }
}
function requestNotifications(){
  if(!notifSupported()){ alert('الإشعارات غير مدعومة في هذا المتصفح.'); updateNotifStatus(); return; }
  Notification.requestPermission().then(() => { updateNotifStatus(); scheduleReminders(); });
}
function maybePromptNotifications(){
  if(!notifSupported()) return;
  if(Notification.permission !== 'default') return;
  try{ if(sessionStorage.getItem('notif_prompted')) return; sessionStorage.setItem('notif_prompted','1'); }catch(e){}
  setTimeout(() => {
    openModal('🔔 فعّل الإشعارات',
      '<p class="muted" style="margin-top:0">ليصلك تذكير بموعد الدرس في شريط الإشعارات وشاشة القفل، فعّل الإشعارات.</p>'
      + '<div class="modal-actions"><button class="btn" id="np_yes">🔔 تفعيل</button><button class="btn btn-outline" id="np_no">لاحقاً</button></div>');
    $('#np_yes').onclick = () => { closeModal(); requestNotifications(); };
    $('#np_no').onclick = closeModal;
  }, 900);
}
function versionNum(v){ return parseInt(String(v).replace(/[^0-9]/g,''),10) || 0; }
/* ---------- سجل "ما الجديد" داخل شريط الإشعارات ---------- */
const CHANGELOG_STORE_KEY = 'daftar_whatsnew';
function whatsNewList(){
  /* يرجّع قائمة الإصدارات المحفوظة (غير المحذوفة) من localStorage */
  let saved = null;
  try{ saved = JSON.parse(localStorage.getItem(CHANGELOG_STORE_KEY) || 'null'); }catch(e){}
  if(!saved || typeof saved !== 'object') saved = {};
  const seen = versionNum(saved.seenVersion || '');
  const current = versionNum(APP_VERSION);
  /* مزامنة: أي إصدار في CHANGELOG أعلى من آخر نسخة شافها المستخدم ≤ الحالي يُضاف للمخزن */
  let changed = false;
  Object.keys(CHANGELOG).forEach(v => {
    const n = versionNum(v);
    if(n > seen && n <= current){
      if(!Array.isArray(saved[v])){ saved[v] = CHANGELOG[v]; changed = true; }
    }
  });
  if(!saved.seenVersion || versionNum(saved.seenVersion) < current){ saved.seenVersion = APP_VERSION; changed = true; }
  if(changed){ try{ localStorage.setItem(CHANGELOG_STORE_KEY, JSON.stringify(saved)); }catch(e){} }
  /* لو المستخدم حذف كل الإصدارات، دايمًا نضيف الإصدار الحالي مرة واحدة عند الترقية فقط (بفضل seenVersion) */
  return Object.keys(CHANGELOG)
    .filter(v => Array.isArray(saved[v]) && saved[v].length)
    .sort((a,b) => versionNum(a) - versionNum(b))
    .map(v => ({ v: v, items: saved[v] }));
}
function whatsNewCount(){ return whatsNewList().length; }
function removeWhatsNew(v){
  let saved = null;
  try{ saved = JSON.parse(localStorage.getItem(CHANGELOG_STORE_KEY) || 'null'); }catch(e){}
  if(!saved || typeof saved !== 'object') return;
  delete saved[v];
  try{ localStorage.setItem(CHANGELOG_STORE_KEY, JSON.stringify(saved)); }catch(e){}
}
function removeAllWhatsNew(){
  let saved = null;
  try{ saved = JSON.parse(localStorage.getItem(CHANGELOG_STORE_KEY) || 'null'); }catch(e){}
  const popupSeen = (saved && saved.popupSeenVersion) || APP_VERSION;
  saved = { seenVersion: APP_VERSION, popupSeenVersion: popupSeen };
  try{ localStorage.setItem(CHANGELOG_STORE_KEY, JSON.stringify(saved)); }catch(e){}
}
function whatsNewModal(v){
  const entry = whatsNewList().find(x => x.v === v);
  if(!entry) return;
  const html = '<div class="changelog-ver"><b>🆕 التحديث ' + esc(entry.v) + '</b><ul>' + entry.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>';
  openModal('ما الجديد؟', html + '<div class="modal-actions"><button class="btn" id="wn_ok">تمام</button><button class="btn btn-outline" id="wn_del">🗑️ حذف هذا الإشعار</button></div>');
  $('#wn_ok').onclick = () => { closeModal(); };
  $('#wn_del').onclick = () => { removeWhatsNew(entry.v); closeModal(); renderToday(); if(!$('#notifPanel').hidden) renderNotifPanel(); };
}
function maybeShowChangelog(next){
  let saved = null;
  try{ saved = JSON.parse(localStorage.getItem(CHANGELOG_STORE_KEY) || 'null'); }catch(e){}
  if(!saved || typeof saved !== 'object') saved = {};
  const current = versionNum(APP_VERSION);
  const popupSeen = versionNum(saved.popupSeenVersion || '');
  if(popupSeen >= current){
    if(next) next();
    return;
  }
  const entries = whatsNewList();
  if(entries.length === 0){
    saved.popupSeenVersion = APP_VERSION;
    try{ localStorage.setItem(CHANGELOG_STORE_KEY, JSON.stringify(saved)); }catch(e){}
    if(next) next();
    return;
  }
  const html = entries.map(en =>
    '<div class="changelog-ver"><b>🆕 التحديث ' + esc(en.v) + '</b><ul>' + en.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>'
  ).join('');
  openModal('ما الجديد في ' + APP_VERSION + '؟', html + '<div class="modal-actions"><button class="btn" id="cl_ok">تمام</button></div>');
  $('#cl_ok').onclick = () => {
    try{
      let s2 = JSON.parse(localStorage.getItem(CHANGELOG_STORE_KEY) || '{}');
      s2.popupSeenVersion = APP_VERSION;
      localStorage.setItem(CHANGELOG_STORE_KEY, JSON.stringify(s2));
    }catch(e){}
    closeModal();
    renderToday();
    if(next) setTimeout(next, 400);
  };
}
function notify(title, body){
  if(notifSupported() && Notification.permission === 'granted'){
    try { new Notification(title, { body: body, lang: 'ar', dir: 'rtl', tag: 'daftar-' + Date.now() }); } catch(e){}
  }
}
function lessonScheduleItems(L){
  const today = new Date().getDay();
  if(!(L.schedule||[]).includes(today)) return [];
  const groups = (L.groups && L.groups.length) ? L.groups : null;
  if(!groups){
    if((typeof L.reminderMinutes === 'number') && L.reminderMinutes > 0){
      return [{ lesson: L.name, group: null, time: L.time || '18:00', reminderMinutes: L.reminderMinutes }];
    }
    return [];
  }
  if(L.remindHeadOnly){
    if((typeof L.reminderMinutes === 'number') && L.reminderMinutes > 0){
      return [{ lesson: L.name, group: null, time: L.time || '18:00', reminderMinutes: L.reminderMinutes }];
    }
    return [];
  }
  return groups
    .filter(g => (typeof g.reminderMinutes === 'number') && g.reminderMinutes > 0)
    .map(g => ({ lesson: L.name, group: g.name, time: g.time || L.time || '18:00', reminderMinutes: g.reminderMinutes }));
}
function todayScheduleItems(){
  const items = [];
  state.lessons.forEach(L => { items.push.apply(items, lessonScheduleItems(L)); });
  items.sort((a,b) => String(a.time||'').localeCompare(String(b.time||'')));
  return items;
}
function renderToday(){
  const banner = $('#todayBanner');
  const dot = $('#notifDot');
  if(!banner) return;
  const items = todayScheduleItems();
  const hasNews = whatsNewCount() > 0;
  if(items.length || hasNews){
    if(items.length){
      banner.hidden = false;
      banner.innerHTML = '<div class="tb-title">📅 جدول اليوم والتذكيرات</div>'
        + items.map(it => '<div class="tb-item"><span>'+esc(it.lesson)+(it.group?' - '+esc(it.group):'')+'</span><span class="tb-time">🕐 '+formatTime12(it.time)+'</span>'+(it.reminderMinutes?'<span class="muted">('+reminderLabel(it.reminderMinutes)+')</span>':'')+'</div>').join('');
    } else {
      banner.hidden = true;
      banner.innerHTML = '';
    }
    if(dot) dot.hidden = !hasNews;
  } else {
    banner.hidden = true;
    banner.innerHTML = '';
    if(dot) dot.hidden = true;
  }
}
function renderNotifPanel(){
  const panel = $('#notifPanel');
  if(!panel) return;
  const items = todayScheduleItems();
  let html = '<p class="np-title">🔔 جدول اليوم والتذكيرات</p>';
  if(items.length === 0){
    html += '<p class="np-empty">لا توجد حصص اليوم.</p>';
  } else {
    items.forEach(it => {
      html += '<div class="np-item">'+esc(it.lesson)+(it.group?' - '+esc(it.group):'')+'<br><span class="np-time">🕐 '+formatTime12(it.time)+'</span>'+(it.reminderMinutes?' · '+reminderLabel(it.reminderMinutes):'')+'</div>';
    });
  }
  /* سجل "ما الجديد" — الإصدارات غير المحذوفة */
  const news = whatsNewList();
  if(news.length){
    html += '<p class="np-title" style="margin-top:10px">🆕 ما الجديد؟</p>';
    news.slice().reverse().forEach(en => {
      html += '<div class="np-item np-news" data-wn="'+esc(en.v)+'">'
        + '<span class="np-news-ver">التحديث ' + esc(en.v) + '</span>'
        + '<ul class="np-news-list">' + en.items.map(i => '<li>'+esc(i)+'</li>').join('') + '</ul>'
        + '<button class="np-news-del" data-wn-del="'+esc(en.v)+'" title="حذف هذا الإشعار">🗑️</button>'
        + '</div>';
    });
    html += '<button class="np-news-clear" data-wn-clear="1">حذف كل إشعارات التحديثات</button>';
  }
  panel.innerHTML = html;
}
function showReminderToast(label, time){
  const toast = $('#toast');
  if(!toast) return;
  $('#toastBody').innerHTML = '⏰ تذكير: <b>'+esc(label)+'</b><br><span class="tb-time">🕐 الساعة '+formatTime12(time)+'</span>';
  toast.hidden = false;
}
function hideToast(){
  const toast = $('#toast');
  if(toast) toast.hidden = true;
}
function showToastMessage(html){
  const toast = $('#toast');
  if(!toast) return;
  $('#toastBody').innerHTML = html;
  toast.hidden = false;
}
function warnIfFutureSession(L, ssid){
  if(!state.settings.warnFutureAttendance) return;
  const s = (L.sessions || []).find(x => x.id === ssid);
  if(!s || !s.date) return;
  const todayStr = new Date().toISOString().slice(0,10);
  if(s.date > todayStr){
    showToastMessage('⚠️ تنبيه: يوم «' + esc(s.dateLabel || s.label) + '» لم يأتي بعد، ومع ذلك تم تسجيل الحضور. (يمكن إيقاف هذا التنبيه من الإعدادات)');
  }
}
function scheduleReminders(){
  if(notifTimers){ notifTimers.forEach(t => clearTimeout(t)); }
  notifTimers = [];
  if(!notifSupported() || Notification.permission !== 'granted') return;
  const now = new Date();
  todayScheduleItems().forEach(it => {
    if(!it.reminderMinutes) return;
    const parts = String(it.time||'18:00').split(':');
    const hh = parseInt(parts[0],10), mm = parseInt(parts[1]||'0',10);
    if(isNaN(hh)) return;
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
    const fireAt = target.getTime() - it.reminderMinutes * 60000;
    const delay = fireAt - now.getTime();
    if(delay > 1000 && delay < 48*3600*1000){
      const label = it.lesson + (it.group ? ' - ' + it.group : '');
      notifTimers.push(setTimeout(() => {
        notify('⏰ تذكير: ' + label, 'موعد الحصة اليوم الساعة ' + formatTime12(it.time));
        showReminderToast(label, it.time);
        renderToday();
      }, delay));
    }
  });
}

/* ---------- التحليل ---------- */
/* ---------- حالات الدرس (تسمية خاصة لكل درس) ---------- */
function effectiveStatuses(lesson){
  const base = state.settings.statuses;
  if(!lesson || !lesson.statusLabels) return base;
  return base.map(s => (lesson.statusLabels[s.id] ? { id: s.id, label: lesson.statusLabels[s.id], color: s.color } : s));
}

function lessonStatusesEditor(lesson){
  const eff = effectiveStatuses(lesson);
  const inputs = eff.map(s =>
    '<div class="status-edit-row"><span class="dot" style="background:'+esc(s.color)+'"></span>'
    + '<input type="text" data-sid="'+esc(s.id)+'" value="'+esc(s.label)+'"></div>'
  ).join('');
  openModal('🏷️ حالات درس «' + esc(lesson.name) + '»',
    '<p class="muted" style="margin-top:0">غيّر التسمية لهذا الدرس فقط (مثال: «تم» ← «حضر»). باقي الدروس تستخدم الاسم العام من الإعدادات.</p>'
    + inputs
    + '<div class="modal-actions"><button class="btn" id="ls_save">حفظ</button><button class="btn btn-outline" id="ls_reset">استخدام العام</button><button class="btn btn-outline" id="ls_cancel">إلغاء</button></div>');
  $('#ls_save').onclick = () => {
    const map = {};
    $$('#modalBody input[data-sid]').forEach(inp => {
      const id = inp.dataset.sid;
      const g = state.settings.statuses.find(x => x.id === id);
      const v = inp.value.trim();
      if(g && v && v !== g.label) map[id] = v;
    });
    if(Object.keys(map).length) lesson.statusLabels = map; else delete lesson.statusLabels;
    saveState(); renderAll(); closeModal();
  };
  $('#ls_reset').onclick = () => { delete lesson.statusLabels; saveState(); renderAll(); closeModal(); };
  $('#ls_cancel').onclick = closeModal;
}

function computeStats(students, sessions, records, statuses){
  const stList = statuses || state.settings.statuses;
  return students.map(st => {
    const recs = records[st.id] || {};
    const counts = {};
    stList.forEach(s => counts[s.id] = 0);
    let marked = 0;
    sessions.forEach(s => {
      const status = recs[s.id] && recs[s.id].status;
      if(status){ marked++; counts[status] = (counts[status]||0) + 1; }
    });
    const total = sessions.length;
    const done = counts['st_done'] || 0;
    const pct = total ? Math.round(done / total * 100) : 0;
    return { st, counts, marked, total, done, pct };
  });
}

/* ---------- حصص سابقة (تاريخها <= النهاردة) ---------- */
function pastSessions(sessions){
  const today = new Date(); today.setHours(23,59,59,999);
  const todayStr = today.toISOString().slice(0,10);
  return sessions.filter(s => !s.date || s.date <= todayStr);
}

function attendanceIndicator(pct){
  const indicators = state.settings.attendanceIndicators || [];
  /* مرتبة من أعلى minPct لأقل */
  const sorted = indicators.slice().sort((a,b) => b.minPct - a.minPct);
  for(const ind of sorted){
    if(pct >= ind.minPct) return ind;
  }
  return sorted[sorted.length - 1] || { id:'unknown', label:'', color:'#64748b', minPct:0 };
}

/* ---------- إشعار تذكير التصدير ---------- */
function updateExportReminder(){
  const el = $('#exportReminder');
  if(!el) return;
  const L = curLesson();
  if(!L || !L.sessions.length){ el.hidden = true; return; }
  /* هل في حصص مسجّلة بعد آخر تصدير؟ */
  const lastExp = L.lastExportAt || 0;
  let hasNewRecords = false;
  L.students.forEach(st => {
    L.sessions.forEach(s => {
      const rec = (L.records[st.id] && L.records[st.id][s.id]) || {};
      if(rec.status) hasNewRecords = true;
    });
  });
  if(!hasNewRecords || lastExp > 0){
    /* لو صدّر بعد ما سجّل، خفي الإشعار */
    /* بس لو في تسجيلات جديدة بعد التصدير → أظهر */
    if(lastExp > 0){
      /* مفيش طريقة نعرف وقت التسجيل بالضبط - نبني الإشعار لو في أي بيانات وآخر تصدير قديم */
      const daysSinceExport = (Date.now() - lastExp) / 86400000;
      if(daysSinceExport > 1 && hasNewRecords){
        el.hidden = false;
        el.innerHTML = '⚠️ لم تصدّر هذا الدرس منذ أكثر من يوم. <button class="btn btn-outline" style="font-size:11px;padding:2px 8px" data-act="quick-export">⬇️ تصدير الآن</button>';
        return;
      }
    }
    /* أول مرة يسجّل ولم يصدّر أبداً */
    if(hasNewRecords && lastExp === 0){
      el.hidden = false;
      el.innerHTML = '💡 لم تصدّر هذا الدرس بعد. <button class="btn btn-outline" style="font-size:11px;padding:2px 8px" data-act="quick-export">⬇️ تصدير الآن</button>';
      return;
    }
  }
  el.hidden = true;
}

function sortByAttendance(){
  const L = curLesson();
  if(!L) return;
  if(L.students.length < 2){ showToastMessage('لا يوجد عدد كافٍ من الطلاب للترتيب.'); return; }
  const pct = {};
  L.students.forEach(st => {
    const recs = L.records[st.id] || {};
    let done = 0;
    const ps = pastSessions(L.sessions||[]);
    ps.forEach(s => { if(recs[s.id] && recs[s.id].status === 'st_done') done++; });
    pct[st.id] = ps.length ? (done / ps.length * 100) : 0;
  });
  L.students.sort((a,b) => (pct[b.id]||0) - (pct[a.id]||0));
  saveState();
  renderLessonDetail();
  showToastMessage('📈 تم ترتيب الطلاب حسب نسبة الحضور (الأعلى أولاً).');
}

function showAnalytics(students, sessions, records, title, statuses){
  const stList = statuses || state.settings.statuses;
  const dated = sessions.filter(s => s.date);
  const minDate = dated.length ? dated.reduce((a,b) => a.date < b.date ? a : b).date : '';
  const maxDate = dated.length ? dated.reduce((a,b) => a.date > b.date ? a : b).date : '';

  const filterHTML = dated.length
    ? '<div class="range-filter"><span>📅 فترة التقرير:</span>'
      + '<label>من <input type="date" id="rangeFrom" value="'+minDate+'"></label>'
      + '<label>إلى <input type="date" id="rangeTo" value="'+maxDate+'"></label>'
      + '</div>'
    : '';

  openModal('📊 تحليل ' + title, filterHTML + '<div id="analyticsTableWrap"></div>');
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.innerHTML =
    '<button class="btn btn-outline" id="analyticsCsv">⬇️ Excel (CSV)</button>'
    + '<button class="btn btn-outline" id="analyticsPdf">🖨️ PDF (A4)</button>'
    + '<button class="btn" id="analyticsClose">إغلاق</button>';
  $('#modalBody').appendChild(actions);

  let curSessions = sessions;
  function applyRange(){
    const from = $('#rangeFrom') ? $('#rangeFrom').value : '';
    const to = $('#rangeTo') ? $('#rangeTo').value : '';
    curSessions = sessions.filter(s => {
      if(!s.date) return true;
      if(from && s.date < from) return false;
      if(to && s.date > to) return false;
      return true;
    });
    const rows = computeStats(students, curSessions, records, statuses);
    let body = '<div class="table-wrap"><table class="stats-table"><thead><tr><th>الطالب</th>';
    stList.forEach(s => body += '<th>'+esc(s.label)+'</th>');
    body += '<th>نسبة الحضور</th></tr></thead><tbody>';
    rows.forEach(r => {
      body += '<tr><td style="text-align:right;font-weight:700">'+esc(r.st.name)+'</td>';
      stList.forEach(s => body += '<td>'+(r.counts[s.id]||0)+'</td>');
      body += '<td><div class="bar" style="display:inline-block"><i style="width:'+r.pct+'%"></i></div> <b>'+r.pct+'%</b></td></tr>';
    });
    body += '</tbody></table></div>';
    if(dated.length){
      const shown = curSessions.filter(s => s.date).length;
      body += '<p class="muted" style="font-size:12px;margin:6px 0 0">الحصص المحسوبة: ' + shown + ' من ' + sessions.length + '</p>';
    }
    $('#analyticsTableWrap').innerHTML = body;
  }
  applyRange();
  if($('#rangeFrom')) $('#rangeFrom').onchange = applyRange;
  if($('#rangeTo')) $('#rangeTo').onchange = applyRange;

  $('#analyticsCsv').onclick = () => exportCSV(students, curSessions, records, title, statuses);
  $('#analyticsPdf').onclick = () => printReport(students, curSessions, records, title, statuses);
  $('#analyticsClose').onclick = closeModal;
}

/* ---------- التقرير الشامل عبر الشهور المؤرشفة ---------- */
function comprehensiveData(lesson, fromDate, toDate){
  const inRange = (s) => {
    if(!s.date) return true;
    if(fromDate && s.date < fromDate) return false;
    if(toDate && s.date > toDate) return false;
    return true;
  };
  const months = state.archive
    .filter(a => a.lessonId === lesson.id)
    .sort((a,b) => (a.year - b.year) || (a.monthNumber - b.monthNumber))
    .map(a => ({ label: 'شهر ' + a.monthNumber + '/' + a.year, monthNumber: a.monthNumber, year: a.year, sessions: (a.sessions||[]).filter(inRange), records: a.records||{}, students: archiveStudents(a) }))
    .filter(m => pastSessions(m.sessions).length > 0);
  /* الشهر الحالي (إلى لحظة توقف الدرس) */
  if(lesson && pastSessions((lesson.sessions||[]).filter(inRange)).length){
    months.push({ label: 'شهر ' + lesson.monthNumber + '/' + lesson.year, monthNumber: lesson.monthNumber, year: lesson.year, sessions: (lesson.sessions||[]).filter(inRange), records: lesson.records||{}, students: lesson.students||[] });
  }
  if(!months.length) return null;
  const studentMap = {};
  months.forEach(m => {
    m.students.forEach(st => {
      if(!studentMap[st.id]) studentMap[st.id] = { id: st.id, name: st.name, phone: st.phone };
      else { if(st.name) studentMap[st.id].name = st.name; if(st.phone) studentMap[st.id].phone = st.phone; }
    });
  });
  const rows = Object.keys(studentMap).map(id => {
    const st = studentMap[id];
    const per = months.map(m => {
      const recs = (m.records && m.records[st.id]) || {};
      const ps = pastSessions(m.sessions);
      let done = 0;
      ps.forEach(s => { if(recs[s.id] && recs[s.id].status === 'st_done') done++; });
      const total = ps.length;
      const pct = total ? Math.round(done / total * 100) : 0;
      return { done: done, total: total, pct: pct };
    });
    const tot = per.reduce((acc,p) => ({ done: acc.done + p.done, total: acc.total + p.total }), { done:0, total:0 });
    const pct = tot.total ? Math.round(tot.done / tot.total * 100) : 0;
    return { st: st, per: per, tot: tot, pct: pct };
  });
  rows.sort((x,y) => y.pct - x.pct);
  return { months: months, rows: rows, range: { from: fromDate || '', to: toDate || '' } };
}

function showComprehensiveReport(lesson){
  /* اجمع كل الحصص من الأرشيف + الشهر الحالي لتحديد حدود الفترة */
  const allSessions = [];
  state.archive.filter(a => a.lessonId === lesson.id).forEach(a => (a.sessions||[]).forEach(s => allSessions.push(s)));
  (lesson.sessions||[]).forEach(s => allSessions.push(s));
  const dated = allSessions.filter(s => s.date);
  const minDate = dated.length ? dated.reduce((a,b) => a.date < b.date ? a : b).date : '';
  const maxDate = dated.length ? dated.reduce((a,b) => a.date > b.date ? a : b).date : '';
  const hasDates = dated.length > 0;

  const filterHTML = hasDates
    ? '<div class="range-filter"><span>📅 فترة التقرير:</span>'
      + '<label>من <input type="date" id="compRangeFrom" value="'+minDate+'"></label>'
      + '<label>إلى <input type="date" id="compRangeTo" value="'+maxDate+'"></label>'
      + '</div>'
    : '';
  openModal('📊 تقرير شامل - ' + esc(lesson.name), filterHTML + '<div id="compTableWrap"></div>');
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.innerHTML = '<button class="btn btn-outline" id="compCsv">⬇️ Excel (CSV)</button><button class="btn btn-outline" id="compPdf">🖨️ PDF (A4)</button><button class="btn" id="compClose">إغلاق</button>';
  $('#modalBody').appendChild(actions);

  let curData = null;
  function applyRange(){
    const from = $('#compRangeFrom') ? $('#compRangeFrom').value : '';
    const to = $('#compRangeTo') ? $('#compRangeTo').value : '';
    curData = comprehensiveData(lesson, from, to);
    if(!curData){
      $('#compTableWrap').innerHTML = '<p class="muted">لا توجد شهور مؤرشفة ولا حصص سابقة في هذه الفترة.</p>';
      return;
    }
    const { months, rows } = curData;
    let t = '<div class="table-wrap" style="max-height:52vh;overflow:auto"><table class="stats-table comp-table"><thead><tr><th class="sticky-col">الطالب</th>';
    months.forEach(a => t += '<th>' + a.monthNumber + '/' + a.year + '</th>');
    t += '<th>النسبة الكلية</th></tr></thead><tbody>';
    rows.forEach(r => {
      t += '<tr><td class="sticky-col" style="text-align:right;font-weight:700">' + esc(r.st.name) + '<br><span style="font-weight:400;color:#64748b;direction:ltr">' + esc(localPhone(r.st.phone)) + '</span></td>';
      r.per.forEach(p => t += '<td><span class="comp-count">' + p.done + '/' + p.total + '</span><br><b>' + p.pct + '%</b></td>');
      t += '<td><b>' + r.pct + '%</b></td></tr>';
    });
    t += '</tbody></table></div>';
    $('#compTableWrap').innerHTML = t;
  }
  applyRange();
  if($('#compRangeFrom')) $('#compRangeFrom').onchange = applyRange;
  if($('#compRangeTo')) $('#compRangeTo').onchange = applyRange;

  $('#compCsv').onclick = () => { if(curData) exportComprehensiveCSV(lesson, curData); };
  $('#compPdf').onclick = () => { if(curData) printComprehensiveReport(lesson, curData); };
  $('#compClose').onclick = closeModal;
}

function exportComprehensiveCSV(lesson, data){
  const { months, rows } = data;
  const lines = [];
  const head = ['م', 'اسم الطالب (الرقم تحته)'];
  months.forEach(a => head.push('شهر ' + a.monthNumber + '/' + a.year));
  head.push('النسبة الكلية %');
  lines.push(head.join(','));
  rows.forEach((r, i) => {
    const row = [i + 1, '"' + String(r.st.name).replace(/"/g,'""') + '\n' + String(localPhone(r.st.phone)).replace(/"/g,'""') + '"'];
    r.per.forEach(p => row.push('"' + p.done + '/' + p.total + '\n' + p.pct + '%"'));
    row.push('"' + r.pct + '%"');
    lines.push(row.join(','));
  });
  const safe = (lesson.name || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '');
  downloadBlob('\uFEFF' + lines.join('\r\n'), 'تقرير_شامل_' + safe + '_' + new Date().toISOString().slice(0,10) + '.csv', 'text/csv;charset=utf-8');
}

function printComprehensiveReport(lesson, data){
  const { months, rows } = data;
  $('#printPageRule').textContent = '@page{size:A4 portrait;margin:8mm}';
  let html = '<div class="report compact" dir="rtl">';
  html += '<div class="r-title">' + esc(APP_NAME) + '</div>';
  html += '<div class="r-sub">تقرير شامل - ' + esc(lesson.name) + ' - نسبة الحضور عبر ' + months.length + ' شهر' + (data.range && (data.range.from || data.range.to) ? ' (من ' + (data.range.from || 'البداية') + ' إلى ' + (data.range.to || 'الآن') + ')' : '') + '</div>';
  html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">الطالب</th>';
  months.forEach(a => html += '<th>' + a.monthNumber + '/' + a.year + '</th>');
  html += '<th>النسبة الكلية</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    html += '<tr><td class="ord-col">' + (i+1) + '</td><td class="r-name">' + esc(r.st.name) + '<br><span style="font-weight:400;font-size:7px;direction:ltr">' + esc(localPhone(r.st.phone)) + '</span></td>';
    r.per.forEach(p => html += '<td>' + p.done + '/' + p.total + '<br><b>' + p.pct + '%</b></td>');
    html += '<td><b>' + r.pct + '%</b></td></tr>';
  });
  html += '</tbody></table>';
  html += '<div class="r-foot">عدد الشهور: ' + months.length + ' · عدد الطلاب: ' + rows.length + '</div>';
  html += '</div>';
  $('#printArea').innerHTML = html;
  window.print();
  $('#printPageRule').textContent = '';
}

/* ---------- تصدير CSV ---------- */
function exportCSV(students, sessions, records, title, statuses){
  const sd = state.settings;
  const stList = statuses || state.settings.statuses;
  const rows = computeStats(students, sessions, records, statuses);
  const lines = [];
  let head = ['م', 'اسم الطالب (الرقم تحته)'];
  sd.customFields.forEach(f => head.push(f.label));
  sessions.forEach(s => head.push(s.label + (s.dateLabel ? ' ('+s.dateLabel+')' : '') + (s.event ? ' ['+s.event+']' : '')));
  head.push(sd.notesLabel);
  stList.forEach(s => head.push(s.label));
  head.push('نسبة الحضور %');
  lines.push(head.join(','));

  rows.forEach((r, i) => {
    const row = [i + 1, '"' + String(r.st.name).replace(/"/g,'""') + '\n' + String(localPhone(r.st.phone)).replace(/"/g,'""') + '"'];
    sd.customFields.forEach(f => row.push('"' + String((r.st.fields && r.st.fields[f.id]) || '').replace(/"/g,'""') + '"'));
    sessions.forEach(s => {
      const rec = (records[r.st.id] && records[r.st.id][s.id]) || {};
      const lbl = rec.status ? (stList.find(x=>x.id===rec.status)||{}).label || '' : '';
      const cell = lbl + (rec.note ? ' (' + rec.note + ')' : '');
      row.push('"' + String(cell).replace(/"/g,'""') + '"');
    });
    const note = (records[r.st.id] && records[r.st.id]['__note__']) || '';
    row.push('"' + String(note).replace(/"/g,'""') + '"');
    stList.forEach(s => row.push(r.counts[s.id]||0));
    row.push(r.pct);
    lines.push(row.join(','));
  });

  const csv = '\uFEFF' + lines.join('\r\n');
  downloadBlob(csv, 'تقرير_' + (title||'حضور').replace(/[^\w\u0600-\u06FF ]/g,'') + '.csv', 'text/csv;charset=utf-8');
}

/* ---------- طباعة A4 ---------- */
function printReport(students, sessions, records, title, statuses){
  const rows = computeStats(students, sessions, records, statuses);
  $('#printPageRule').textContent = '@page{size:A4 portrait;margin:8mm}';
  $('#printArea').innerHTML = buildReportHTML(students, sessions, records, rows, title, statuses);
  window.print();
  $('#printPageRule').textContent = '';
}

/* ---------- ورقة حضور فارغة جاهزة للطباعة ---------- */
function showBlankSheetOptions(){
  const L = curLesson();
  if(!L) return;
  const body = '<div style="text-align:center;padding:8px 0">'
    + '<p style="margin-bottom:12px;font-size:14px">اختر صيغة ورقة الحضور الفارغة:</p>'
    + '<div class="modal-actions" style="justify-content:center;gap:12px">'
    + '<button class="btn btn-primary" id="blankPdfBtn">🖨️ طباعة / PDF (A4)</button>'
    + '<button class="btn btn-outline" id="blankExcelBtn">⬇️ Excel (A4)</button>'
    + '<button class="btn" id="blankCloseBtn">إغلاق</button>'
    + '</div></div>';
  openModal('📄 ورقة حضور فارغة', body);
  $('#blankPdfBtn').onclick = () => { closeModal(); printBlankSheet(L); };
  $('#blankExcelBtn').onclick = () => { closeModal(); exportBlankSheetExcel(L); };
  $('#blankCloseBtn').onclick = closeModal;
}

function printBlankSheet(lesson){
  const sd = state.settings;
  const students = lesson.students || [];
  const sessions = lesson.sessions || [];
  const monthTitle = buildMonthTitle(lesson.monthNumber);
  const yearLabel = lesson.year || '';
  const scheduleStr = scheduleLabel(lesson);

  let html = '<div class="report" dir="rtl">';
  html += '<div class="r-title">أبنام حضور وغياب عن ' + esc(lesson.name) + ' - ' + esc(monthTitle) + (yearLabel ? ' ' + esc(String(yearLabel)) : '') + '</div>';
  if(scheduleStr) html += '<div style="text-align:center;font-size:10px;color:#475569;margin-bottom:6px">' + esc(scheduleStr) + '</div>';

  /* جدول الحضور الفارغ — عمودي، رفيع، 15 طالب في الصفحة */
  html += '<table class="r-table blank-sheet"><thead><tr>';
  html += '<th class="ord-col">م</th>';
  html += '<th class="r-name">الاسم</th>';
  sessions.forEach(s => {
    const dayLabel = s.dateLabel || '';
    html += '<th>' + (dayLabel ? esc(dayLabel) : esc(s.label));
    if(s.event) html += '<br><span style="color:#b45309;font-size:7px">📝 ' + esc(s.event) + '</span>';
    html += '</th>';
  });
  html += '<th>ملاحظات</th>';
  html += '</tr></thead><tbody>';

  students.forEach((st, i) => {
    html += '<tr>';
    html += '<td class="ord-col"><span class="ord-num">' + (i + 1) + '</span></td>';
    html += '<td class="r-name"><span class="st-name">' + esc(st.name) + '</span><br><span class="st-phone">' + esc(localPhone(st.phone || '')) + '</span></td>';
    sessions.forEach(() => {
      html += '<td class="blank-cell"></td>';
    });
    html += '<td></td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  html += '<div class="r-foot">عدد الطلاب: ' + students.length + ' · عدد الحصص: ' + sessions.length + '</div>';
  html += '</div>';

  /* عمودي (portrait) — 15 طالب في الصفحة */
  $('#printPageRule').textContent = '@page{size:A4 portrait;margin:8mm}';
  $('#printArea').innerHTML = html;
  window.print();
  $('#printPageRule').textContent = '';
}

function exportBlankSheetExcel(lesson){
  const sd = state.settings;
  const students = lesson.students || [];
  const sessions = lesson.sessions || [];
  const monthTitle = buildMonthTitle(lesson.monthNumber);
  const yearLabel = lesson.year || '';
  const title = lesson.name + ' - ' + monthTitle + (yearLabel ? ' ' + yearLabel : '');

  const lines = [];
  /* صف العنوان */
  const totalCols = 2 + sessions.length + 1;
  lines.push('"' + title + '",'.repeat(totalCols - 1) + '""');
  lines.push('');

  /* رأس الجدول */
  let head = ['م', 'اسم الطالب'];
  sessions.forEach(s => {
    let col = s.label;
    if(s.dateLabel) col += ' (' + s.dateLabel + ')';
    if(s.event) col += ' [' + s.event + ']';
    head.push(col);
  });
  head.push(sd.notesLabel);
  lines.push(head.join(','));

  /* صفوف الطلاب - الحضور فارغ */
  students.forEach((st, i) => {
    const row = [i + 1, '"' + String(st.name).replace(/"/g,'""') + '\n' + String(localPhone(st.phone || '')).replace(/"/g,'""') + '"'];
    sessions.forEach(() => row.push(''));
    row.push('');
    lines.push(row.join(','));
  });

  const csv = '\uFEFF' + lines.join('\r\n');
  downloadBlob(csv, 'ورقة_حضور_' + title.replace(/[^\w\u0600-\u06FF ]/g,'') + '.csv', 'text/csv;charset=utf-8');
}

function buildReportHTML(students, sessions, records, rows, title, statuses){
  const sd = state.settings;
  const stList = statuses || state.settings.statuses;
  let html = '<div class="report compact" dir="rtl">';
  html += '<div class="r-title">' + esc(APP_NAME) + '</div>';
  html += '<div class="r-sub">' + esc(title) + '</div>';

  html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">'+esc(sd.studentLabel)+'</th>';
  sd.customFields.forEach(f => html += '<th>'+esc(f.label)+'</th>');
  sessions.forEach(s => html += '<th>'+esc(s.label)+'<br><span>'+esc(s.dateLabel||'')+'</span>' + (s.event ? '<br><span style="color:#b45309;font-size:7px">📝 '+esc(s.event)+'</span>' : '') + '</th>');
  html += '<th>'+esc(sd.notesLabel)+'</th></tr></thead><tbody>';
  students.forEach((st, i) => {
    html += '<tr><td class="ord-col">'+(i+1)+'</td><td class="r-name">'+esc(st.name)+'<br><span style="font-weight:400;font-size:7px;color:#64748b;direction:ltr">'+esc(localPhone(st.phone))+'</span></td>';
    sd.customFields.forEach(f => html += '<td>'+esc((st.fields && st.fields[f.id]) || '')+'</td>');
    sessions.forEach(s => {
      const rec = (records[st.id] && records[st.id][s.id]) || {};
      const lbl = rec.status ? (stList.find(x=>x.id===rec.status)||{}).label || '' : '';
      html += '<td>'+esc(lbl||'-') + (rec.note ? '<br><span style="font-size:7px;color:#b45309">'+esc(rec.note)+'</span>' : '') + '</td>';
    });
    const note = (records[st.id] && records[st.id]['__note__']) || '';
    html += '<td>'+esc(note)+'</td></tr>';
  });
  html += '</tbody></table>';

  html += '<div class="r-section">تحليل الحضور</div>';
  html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">'+esc(sd.studentLabel)+'</th>';
  stList.forEach(s => html += '<th>'+esc(s.label)+'</th>');
  html += '<th>نسبة الحضور</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    html += '<tr><td class="ord-col">'+(i+1)+'</td><td class="r-name">'+esc(r.st.name)+'</td>';
    stList.forEach(s => html += '<td>'+(r.counts[s.id]||0)+'</td>');
    html += '<td><b>'+r.pct+'%</b></td></tr>';
  });
  html += '</tbody></table>';

  const curL = curLesson();
  if(curL && Array.isArray(curL.exams) && curL.exams.length > 0){
    html += '<div class="r-section">نتائج ودرجات الاختبارات</div>';
    html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">'+esc(sd.studentLabel)+'</th>';
    curL.exams.forEach(ex => html += '<th>' + esc(ex.name) + '<br><span style="font-size:7px">(' + ex.maxScore + ')</span></th>');
    html += '<th>المتوسط</th></tr></thead><tbody>';
    students.forEach((st, i) => {
      html += '<tr><td class="ord-col">'+(i+1)+'</td><td class="r-name">'+esc(st.name)+'</td>';
      let tot = 0, ecnt = 0;
      curL.exams.forEach(ex => {
        const sc = (curL.examScores && curL.examScores[st.id] && curL.examScores[st.id][ex.id]);
        if(sc !== undefined && sc !== '' && !isNaN(Number(sc))){
          tot += (Number(sc) / ex.maxScore) * 100;
          ecnt++;
          html += '<td>' + sc + '</td>';
        } else {
          html += '<td>-</td>';
        }
      });
      const avg = ecnt > 0 ? Math.round(tot / ecnt) + '%' : '-';
      html += '<td><b>' + avg + '</b></td></tr>';
    });
    html += '</tbody></table>';
  }

  html += '<div class="r-foot">إجمالي الحصص: ' + sessions.length + ' · عدد الطلاب: ' + students.length + '</div>';
  html += '</div>';
  return html;
}

async function downloadBlob(content, filename, mime){
  /* أولوية: File System Access API (يخلي المستخدم يختار المكان) */
  if('showSaveFilePicker' in window){
    try{
      const ext = filename.includes('.') ? '.' + filename.split('.').pop() : '';
      const types = ext ? [{ description: ext.toUpperCase().slice(1) + ' ملف', accept: { [mime]: [ext] } }] : [];
      const handle = await window.showSaveFilePicker({ suggestedName: filename, types });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      showToastMessage('✅ تم حفظ الملف: ' + filename);
      return;
    }catch(e){
      if(e.name === 'AbortError') return; /* ألغى المستخدم */
      /* فشل API → رجوع للطريقة العادية */
    }
  }
  /* طريقة التنزيلات العادية (fallback) */
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 50);
}

/* ---------- ملف البيانات ---------- */
function applyLoadedData(data){
  if(!data || !Array.isArray(data.lessons) || !data.settings){
    alert('الملف غير صالح (لا يحتوي على بيانات الدروس المطلوبة).');
    return false;
  }
  if(!window.confirm('سيتم استبدال كل البيانات الحالية بمحتوى الملف. متابعة؟')) return false;
  state = normalizeState(data);
  moneyUnlocked = false;
  saveState();
  renderAll();
  return true;
}

async function saveToFile(){
  if('showSaveFilePicker' in window){
    try{
      const handle = await window.showSaveFilePicker({
        suggestedName: 'بيانات_الحضور.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(state, null, 2));
      await writable.close();
      alert('تم حفظ البيانات في الملف بنجاح.');
      return;
    }catch(e){
      if(e && e.name === 'AbortError') return;
    }
  }
  exportBackup();
}

async function openFromFile(){
  if('showOpenFilePicker' in window){
    try{
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });
      const file = await handle.getFile();
      const text = await file.text();
      applyLoadedData(JSON.parse(text));
      return;
    }catch(e){
      if(e && e.name === 'AbortError') return;
    }
  }
  $('#importFile').click();
}

function exportBackup(){
  downloadBlob(JSON.stringify(state, null, 2), 'نسخة_احتياطية_Daftar_' + new Date().toISOString().slice(0,10) + '.json', 'application/json');
}
function importArchiveMonth(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      const A = data && data.archive;
      if(!A || typeof A !== 'object' || !A.monthNumber || !Array.isArray(A.sessions)){ alert('ملف الشهر غير صالح.'); return; }
      const norm = normalizeState({ settings: state.settings, lessons: [], archive: [A] }).archive[0];
      state.archive.push(norm);
      saveState(); renderAll();
      alert('تم استيراد الشهر «' + norm.lessonName + ' - ' + norm.monthNumber + '/' + norm.year + '» بنجاح (دمج دون حذف الباقي).');
    }catch(e){ alert('تعذّر قراءة الملف.'); }
  };
  reader.readAsText(file);
}

function exportArchiveMonth(a){
  const payload = { type: 'daftar-archive', version: 6, archive: JSON.parse(JSON.stringify(a)) };
  const safe = (a.lessonName || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '').replace(/\s+/g, '_');
  const now = new Date();
  const stamp = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + '_' + String(now.getHours()).padStart(2,'0') + '-' + String(now.getMinutes()).padStart(2,'0');
  downloadBlob(JSON.stringify(payload, null, 2), 'شهر_' + safe + '_' + a.monthNumber + '-' + a.year + '_' + stamp + '.json', 'application/json');
  const L = state.lessons.find(x => x.id === a.lessonId);
  if(L){ L.lastExportAt = Date.now(); saveState(); updateExportReminder(); }
}

function importBackup(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{ applyLoadedData(JSON.parse(reader.result)); }
    catch(e){ alert('تعذّر قراءة الملف. تأكد أنه ملف JSON صحيح.'); }
  };
  reader.readAsText(file);
}

/* ---------- تصدير/استيراد درس واحد (دمج) ---------- */
function exportLesson(lesson){
  if(!lesson) return;
  const payload = { type: 'daftar-lesson', version: 6, lesson: JSON.parse(JSON.stringify(lesson)), archives: state.archive.filter(a => a.lessonId === lesson.id).map(a => JSON.parse(JSON.stringify(a))) };
  const safe = (lesson.name || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '').replace(/\s+/g, '_');
  const now = new Date();
  const stamp = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + '_' + String(now.getHours()).padStart(2,'0') + '-' + String(now.getMinutes()).padStart(2,'0');
  downloadBlob(JSON.stringify(payload, null, 2), 'درس_' + safe + '_شهر' + lesson.monthNumber + '_' + lesson.year + '_' + stamp + '.json', 'application/json');
  lesson.lastExportAt = Date.now();
  saveState();
  updateExportReminder();
}
function importLesson(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      const L = data && data.lesson;
      if(!L || typeof L !== 'object' || !L.name){ alert('ملف الدرس غير صالح.'); return; }
      const norm = normalizeState({ settings: state.settings, lessons: [L], archive: [] }).lessons[0];
      const normArchives = normalizeState({ settings: state.settings, lessons: [L], archive: Array.isArray(data.archives) ? data.archives : [] }).archive;
      const existing = state.lessons.findIndex(x => x.id === L.id);
      if(existing >= 0){
        if(!window.confirm('يوجد درس بنفس المعرّف («'+L.name+'»). استبداله بمحتوى الملف؟')) return;
        state.lessons[existing] = norm;
      } else {
        state.lessons.push(norm);
      }
      state.archive = state.archive.filter(x => x.lessonId !== norm.id).concat(normArchives);
      saveState(); renderAll();
      alert('تم استيراد الدرس «'+L.name+'» بنجاح مع ' + normArchives.length + ' شهر مؤرشف (دمج دون حذف بقية الدروس).');
    }catch(e){ alert('تعذّر قراءة الملف.'); }
  };
  reader.readAsText(file);
}

/* ---------- التشفير ---------- */
function cryptoAvailable(){
  return !!(window.crypto && window.crypto.subtle);
}
function askPassword(title){
  return new Promise((resolve) => {
    openModal(title,
      '<div class="form-row"><label>كلمة المرور<input id="pwd" type="password" autocomplete="new-password"></label></div>'
      + '<div class="modal-actions"><button class="btn" id="pwd_ok">موافق</button><button class="btn btn-outline" id="pwd_cancel">إلغاء</button></div>');
    $('#pwd_ok').onclick = () => { const v = $('#pwd').value; closeModal(); resolve(v); };
    $('#pwd_cancel').onclick = () => { closeModal(); resolve(null); };
  });
}

async function encryptExport(){
  if(!cryptoAvailable()){
    alert('التشفير يتطلب اتصالاً آمناً (HTTPS). سيتم التصدير كنسخة عادية بدلاً من ذلك.');
    exportBackup();
    return;
  }
  const pwd = await askPassword('🔒 أدخل كلمة مرور لتشفير النسخة:');
  if(!pwd){ return; }
  if(pwd.length < 4){ alert('استخدم كلمة مرور أطول (4 أحرف على الأقل).'); return; }
  try{
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const km = await crypto.subtle.importKey('raw', enc.encode(pwd), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:150000, hash:'SHA-256'}, km, {name:'AES-GCM', length:256}, false, ['encrypt']);
    const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(JSON.stringify(state)));
    const payload = { v:1, salt: b64(salt), iv: b64(iv), data: b64(ct) };
    downloadBlob(JSON.stringify(payload), 'نسخة_مشفرة_' + new Date().toISOString().slice(0,10) + '.json', 'application/json');
    alert('تم إنشاء النسخة المشفّرة. احفظ كلمة المرور جيداً - لا يمكن الاسترجاع بدونها.');
  }catch(e){
    alert('تعذّر التشفير: ' + e.message);
  }
}

async function decryptImport(file){
  if(!cryptoAvailable()){
    alert('فك التشفير يتطلب اتصالاً آمناً (HTTPS).');
    return;
  }
  const pwd = await askPassword('🔓 أدخل كلمة مرور فك التشفير:');
  if(!pwd) return;
  try{
    const text = await file.text();
    const payload = JSON.parse(text);
    if(!payload.salt || !payload.iv || !payload.data){ alert('ملف مشفّر غير صالح.'); return; }
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey('raw', enc.encode(pwd), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt: unb64(payload.salt), iterations:150000, hash:'SHA-256'}, km, {name:'AES-GCM', length:256}, false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv: unb64(payload.iv)}, key, unb64(payload.data));
    const json = new TextDecoder().decode(pt);
    applyLoadedData(JSON.parse(json));
  }catch(e){
    alert('كلمة المرور غير صحيحة أو الملف تالف.');
  }
}

/* ---------- الحفظ التلقائي في ملف ---------- */
function idbOpen(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('attendance-app', 1);
    req.onupgradeneeded = () => {
      if(!req.result.objectStoreNames.contains('handles')) req.result.createObjectStore('handles');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, val){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readonly');
    const r = tx.objectStore('handles').get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function idbDel(key){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
function autoSaveSupported(){
  return ('showSaveFilePicker' in window) && ('indexedDB' in window);
}
async function writeToFile(){
  if(!fileHandle) return false;
  try{
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(state, null, 2));
    await writable.close();
    autoSaveReady = true;
    return true;
  }catch(e){
    autoSaveReady = false;
    return false;
  }
}
function scheduleAutoSave(){
  if(!fileHandle || !autoSaveReady) return;
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    const ok = await writeToFile();
    if(!ok) updateAutoSaveStatus();
  }, 800);
}
async function enableAutoSave(){
  if(!autoSaveSupported()){
    alert('هذه الخاصية تتطلب متصفح Chrome أو Edge (تعمل على أندرويد والكمبيوتر). الحفظ داخل المتصفح يعمل تلقائياً على أي متصفح.');
    updateAutoSaveStatus();
    return;
  }
  try{
    if(!fileHandle){
      fileHandle = await window.showSaveFilePicker({
        suggestedName: 'بيانات_الحضور.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });
    }
    let perm;
    try{ perm = await fileHandle.requestPermission({ mode: 'readwrite' }); }
    catch(e){ perm = 'granted'; }
    if(perm !== 'granted'){
      alert('لم تمنح صلاحية الكتابة للملف. لم يتم التفعيل.');
      updateAutoSaveStatus();
      return;
    }
    await idbSet('fileHandle', fileHandle);
    const ok = await writeToFile();
    if(!ok){ alert('تعذّرت الكتابة للملف المحدد.'); }
    updateAutoSaveStatus();
  }catch(e){
    if(e && e.name === 'AbortError') return;
    alert('تعذّر تفعيل الحفظ التلقائي: ' + e.message);
    updateAutoSaveStatus();
  }
}
async function disableAutoSave(){
  if(!window.confirm('إيقاف الحفظ التلقائي في الملف؟ (سيستمر الحفظ داخل المتصفح)')) return;
  fileHandle = null;
  autoSaveReady = false;
  try{ await idbDel('fileHandle'); }catch(e){}
  updateAutoSaveStatus();
}
function updateAutoSaveStatus(){
  const badge = $('#autosaveBadge');
  const statusEl = $('#autosaveStatus');
  const en = $('#enableAutoSaveBtn');
  const dis = $('#disableAutoSaveBtn');
  if(!badge && !statusEl) return;
  let badgeText, badgeCls, html;
  if(!autoSaveSupported()){
    badgeText = '💾 ملف: غير مدعوم';
    badgeCls = 'as-off';
    html = '⚠️ الحفظ التلقائي في ملف غير مدعوم في هذا المتصفح (يتطلب Chrome/Edge). لكن الحفظ داخل المتصفح يعمل تلقائياً دائماً.';
  } else if(fileHandle && autoSaveReady){
    badgeText = '💾 حفظ تلقائي: مفعّل';
    badgeCls = 'as-on';
    html = '✅ الحفظ التلقائي مفعّل - كل تغيير يُحفظ تلقائياً في الملف الذي اخترته.';
  } else if(fileHandle && !autoSaveReady){
    badgeText = '🔗 اضغط لتفعيل الحفظ';
    badgeCls = 'as-off';
    html = 'يوجد ملف محفوظ لكن الصلاحية تحتاج إعادة تفعيل. اضغط «تفعيل الحفظ التلقائي».';
  } else {
    badgeText = '💾 حفظ تلقائي: غير مفعّل';
    badgeCls = 'as-off';
    html = 'الحفظ التلقائي في ملف غير مفعّل. اضغط «تفعيل الحفظ التلقائي» واختر ملفاً على هاتفك.';
  }
  if(badge){ badge.textContent = badgeText; badge.className = 'autosave-status ' + badgeCls; }
  if(statusEl){ statusEl.textContent = html; }
  if(en) en.style.display = (autoSaveSupported() && !(fileHandle && autoSaveReady)) ? '' : 'none';
  if(dis) dis.style.display = (fileHandle && autoSaveReady) ? '' : 'none';
  const asSw = $('#set_enableAutoSave');
  if(asSw){
    asSw.disabled = !autoSaveSupported();
    asSw.checked = !!(fileHandle && autoSaveReady);
  }
}
function maybePromptAutoSave(){
  if(!autoSaveSupported()) return;
  try{ if(localStorage.getItem(AUTOSAVE_FLAG) === '1') return; }catch(e){ return; }
  openModal('🔗 فعّل الحفظ التلقائي في ملف',
    '<p class="muted" style="margin-top:0">لضمان عدم فقدان البيانات حتى لو مُسحت بيانات المتصفح، اختر ملفاً على هاتفك يُحفظ فيه كل شيء تلقائياً.</p>'
    + '<div class="modal-actions"><button class="btn" id="prompt_yes">اختيار ملف</button><button class="btn btn-outline" id="prompt_later">لاحقاً</button></div>');
  $('#prompt_yes').onclick = () => { closeModal(); enableAutoSave(); };
  $('#prompt_later').onclick = () => { closeModal(); try{ localStorage.setItem(AUTOSAVE_FLAG, '1'); }catch(e){} };
}
async function initAutoSave(){
  if(!autoSaveSupported()){
    updateAutoSaveStatus();
    return;
  }
  try{
    const handle = await idbGet('fileHandle');
    if(handle){
      fileHandle = handle;
      autoSaveReady = false;
      try{
        const perm = await handle.requestPermission({ mode: 'readwrite' });
        if(perm === 'granted'){ await writeToFile(); }
      }catch(e){}
    }
  }catch(e){}
  updateAutoSaveStatus();
  maybePromptAutoSave();
}

/* ---------- أرشفة شهر درس (مستقل) ---------- */
function archiveLessonMonth(lesson){
  if(!lesson) return;
  const mn = lesson.monthNumber, yr = lesson.year;
  if(!window.confirm('أرشفة شهر ' + mn + '/' + yr + ' لدرس «' + lesson.name + '»؟ سيبدأ شهر جديد فارغ لهذا الدرس فقط.')) return;

  state.archive.push({
    id: uid('a'),
    lessonId: lesson.id,
    lessonName: lesson.name,
    monthNumber: mn,
    year: yr,
    subscription: lesson.subscription,
    students: JSON.parse(JSON.stringify(lesson.students)),
    sessions: JSON.parse(JSON.stringify(lesson.sessions)),
    records: JSON.parse(JSON.stringify(lesson.records || {})),
    archivedAt: new Date().toISOString()
  });

  let m = mn + 1, y = yr;
  if(m > 12){ m = 1; y++; }
  lesson.monthNumber = m;
  lesson.year = y;
  lesson.records = {};
  lesson.students.forEach(st => st.paid = false);
  fillSessions(lesson);
  saveState();
  renderAll();
}

/* ---------- استعادة شهر مؤرشف للتعديل ---------- */
function restoreArchiveMonth(idx){
  const a = state.archive[idx];
  if(!a) return;
  const L = state.lessons.find(x => x.id === a.lessonId);
  if(!L){ alert('الدرس المرتبط بهذا الأرشيف غير موجود.'); return; }
  const hasCurrent = Object.keys(L.records||{}).some(sid => Object.keys(L.records[sid]||{}).length > 0);
  if(hasCurrent){
    if(!window.confirm('الشهر الحالي للدرس «'+L.name+'» يحتوي على تسجيلات حضور.\nسيتم أرشفته تلقائياً قبل استعادة الشهر المؤرشف. متابعة؟')) return;
    state.archive.push({
      id: uid('a'),
      lessonId: L.id,
      lessonName: L.name,
      monthNumber: L.monthNumber,
      year: L.year,
      subscription: L.subscription,
      students: JSON.parse(JSON.stringify(L.students)),
      sessions: JSON.parse(JSON.stringify(L.sessions)),
      records: JSON.parse(JSON.stringify(L.records || {})),
      archivedAt: new Date().toISOString()
    });
  } else {
    if(!window.confirm('استعادة شهر ' + a.monthNumber + '/' + a.year + ' لدرس «' + L.name + '»؟\nسيستبدل الشهر الحالي (الفارغ) بالمؤرشف، ويمكنك تعديل الترتيب ثم إعادة الأرشفة. متابعة؟')) return;
  }
  L.monthNumber = a.monthNumber;
  L.year = a.year;
  L.subscription = a.subscription;
  L.sessions = JSON.parse(JSON.stringify(a.sessions));
  L.records = JSON.parse(JSON.stringify(a.records || {}));
  const orderMap = {};
  (a.students||[]).forEach((st, i) => { orderMap[st.id] = i; });
  const paidMap = {};
  (a.students||[]).forEach(st => { paidMap[st.id] = !!st.paid; });
  const curIdx = {};
  L.students.forEach((st, i) => { curIdx[st.id] = i; });
  L.students.sort((x, y) => {
    const ix = (orderMap[x.id] !== undefined) ? orderMap[x.id] : 1000000 + curIdx[x.id];
    const iy = (orderMap[y.id] !== undefined) ? orderMap[y.id] : 1000000 + curIdx[y.id];
    return ix - iy;
  });
  L.students.forEach(st => { st.paid = !!paidMap[st.id]; });
  state.archive.splice(idx, 1);
  currentLessonId = L.id;
  saveState();
  renderAll();
  switchTab('lessons');
  showToastMessage('♻️ تم استعادة الشهر ' + a.monthNumber + '/' + a.year + ' - عدّل الترتيب ثم أرشف من جديد.');
}

function changeMonth(lesson){
  openModal('🗓️ تغيير شهر «' + esc(lesson.name) + '»',
    '<div class="grid2">'
    + '<label>رقم الشهر<input id="m_num" type="number" min="1" max="12" value="'+lesson.monthNumber+'"></label>'
    + '<label>السنة<input id="m_year" type="number" min="2000" max="2100" value="'+lesson.year+'"></label>'
    + '</div>'
    + '<div class="modal-actions"><button class="btn" id="m_save">تطبيق وتوليد الحصص</button><button class="btn btn-outline" id="m_cancel">إلغاء</button></div>');
  $('#m_save').onclick = () => {
    const m = parseInt($('#m_num').value, 10);
    const y = parseInt($('#m_year').value, 10);
    if(!m || m<1 || m>12){ alert('رقم الشهر بين 1 و 12.'); return; }
    if(!y || y<2000 || y>2100){ alert('أدخل سنة صحيحة.'); return; }
    lesson.monthNumber = m;
    lesson.year = y;
    genSessions(lesson, true);
    closeModal();
    renderAll();
  };
  $('#m_cancel').onclick = closeModal;
}

/* ---------- الرسالة الأسبوعية ---------- */
function waTargetOptions(){
  const sd = state.settings;
  const targets = [{ id:'', label:'📱 الرقم العام (' + sd.whatsappNumber + ')' }];
  state.lessons.forEach(L => {
    if(L.waGroup) targets.push({ id: L.id, label: '💬 ' + L.name });
    (L.groups||[]).forEach(g => {
      if(g.waGroup) targets.push({ id: 'group:' + L.id + ':' + g.id, label: '👥 ' + L.name + ' - ' + g.name });
    });
  });
  return targets;
}

function resolveWaTarget(tid, text, type){
  const sd = state.settings;
  if(tid){
    if(tid.indexOf('group:') === 0){
      const parts = tid.split(':');
      const L = state.lessons.find(x => x.id === parts[1]);
      const g = L && (L.groups||[]).find(x => x.id === parts[2]);
      if(g && g.waGroup){
        if(/^https?:\/\//i.test(g.waGroup)) return { href: g.waGroup, isGroup: true, text };
        return { href: waHrefNumber(g.waGroup, text, type), isGroup: false, text };
      }
    } else {
      const L = state.lessons.find(x => x.id === tid);
      if(L && L.waGroup){
        if(/^https?:\/\//i.test(L.waGroup)) return { href: L.waGroup, isGroup: true, text };
        return { href: waHrefNumber(L.waGroup, text, type), isGroup: false, text };
      }
    }
  }
  return { href: waHrefNumber(sd.whatsappNumber, text, type), isGroup: false, text };
}

function weeklyMessage(){
  const sd = state.settings;
  const defType = (sd.whatsappType === 'business') ? 'business' : 'normal';
  const targets = waTargetOptions();
  const targetSel = '<select id="msgTarget">' + targets.map(x => '<option value="'+esc(x.id)+'">'+esc(x.label)+'</option>').join('') + '</select>';

  const body =
    '<div class="form-row"><label>الوجهة (رقم عام أو جروب درس)' + targetSel + '</label></div>'
    + '<div class="form-row"><label>وقت الحصة (مثال: 7 مساءً)<input id="msgTime" type="text" placeholder="7 مساءً" dir="rtl"></label></div>'
    + '<div class="form-row"><label>نوع الواتساب<select id="msgType"><option value="normal"'+(defType==='normal'?' selected':'')+'>واتساب عادي</option><option value="business"'+(defType==='business'?' selected':'')+'>واتساب أعمال</option></select></label></div>'
    + '<div class="form-row"><label>معاينة الرسالة<textarea id="msgPreview" rows="6" dir="rtl" readonly></textarea></label></div>'
    + '<div class="modal-actions">'
    + '<a class="btn btn-whatsapp" id="msgSend" href="#" target="_blank" rel="noopener">📨 فتح واتساب</a>'
    + '<button class="btn btn-outline" id="msgCopy">📋 نسخ الرسالة</button>'
    + '<button class="btn btn-outline" id="msgCancel">إلغاء</button>'
    + '</div>';
  openModal('📨 الرسالة الأسبوعية', body);

  const timeInput = $('#msgTime');
  const preview = $('#msgPreview');
  const link = $('#msgSend');

  function currentType(){ return $('#msgType').value === 'business' ? 'business' : 'normal'; }
  function currentText(){
    const time = timeInput.value.trim();
    return sd.messageTemplate.replace(/\{time\}/g, time || '');
  }
  function buildTarget(){
    return resolveWaTarget($('#msgTarget').value, currentText(), currentType());
  }
  function update(){
    preview.value = currentText();
    const t = buildTarget();
    link.href = t.href;
    link.dataset.isgroup = t.isGroup ? '1' : '';
    link.dataset.text = encodeURIComponent(t.text);
  }
  timeInput.addEventListener('input', update);
  $('#msgTarget').addEventListener('change', update);
  $('#msgType').addEventListener('change', update);
  $('#msgCopy').onclick = () => {
    const text = currentText();
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(() => alert('تم نسخ الرسالة.')).catch(() => fallbackCopy(text)); }
    else fallbackCopy(text);
  };
  link.addEventListener('click', () => {
    const t = buildTarget();
    if(t.isGroup){
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(t.text).then(() => showToastMessage('📋 تم نسخ الرسالة - افتح الجروب والصقها في صندوق الدردشة.')).catch(() => {});
      } else {
        fallbackCopy(t.text);
      }
    }
  });
  update();
  $('#msgCancel').onclick = closeModal;
}
function waHrefNumber(phone, text, type){
  const num = digits(phone);
  if(type === 'business') return 'https://api.whatsapp.com/send?phone=' + num + (text ? '&text=' + encodeURIComponent(text) : '');
  return 'https://wa.me/' + num + (text ? '?text=' + encodeURIComponent(text) : '');
}

/* ---------- تقرير الشهر كرسالة واتساب ---------- */
function buildMonthReportText(name, monthNumber, year, students, sessions, records, statuses){
  const ps = pastSessions(sessions);
  const rows = computeStats(students, ps, records, statuses).slice().sort((a,b) => b.pct - a.pct);
  let text = '📊 تقرير شهر ' + monthNumber + '/' + year + ' - ' + name + '\n';
  text += 'عدد الحصص: ' + sessions.length + ' · عدد الطلاب: ' + students.length + '\n';
  text += '\n📈 نسب الحضور:';
  rows.forEach((r, i) => {
    text += '\n' + (i+1) + '. ' + r.st.name + ' - ' + r.pct + '% (' + r.done + '/' + r.total + ')';
  });
  const low = rows.filter(r => r.pct < 50);
  if(low.length){
    text += '\n\n⚠️ نسبة أقل من 50% (يحتاجون متابعة):';
    low.forEach(r => { text += '\n• ' + r.st.name + ' - ' + r.pct + '%'; });
  }
  const events = (sessions||[]).filter(s => s.event);
  if(events.length){
    text += '\n\n📝 أحداث الشهر:';
    events.forEach(s => { text += '\n• ' + s.label + (s.dateLabel ? ' (' + s.dateLabel + ')' : '') + ': ' + s.event + (s.eventNote ? ' - ' + s.eventNote : ''); });
  }
  return text.trim();
}

function showReportMessageModal(text){
  const targets = waTargetOptions();
  const targetSel = '<select id="mr_target">' + targets.map(x => '<option value="'+esc(x.id)+'">'+esc(x.label)+'</option>').join('') + '</select>';
  openModal('📨 تقرير الشهر كرسالة',
    '<div class="form-row"><label>إرسال إلى' + targetSel + '</label></div>'
    + '<div class="form-row"><label>نوع الواتساب<select id="mr_type"><option value="normal">واتساب عادي</option><option value="business">واتساب أعمال</option></select></label></div>'
    + '<div class="form-row"><label>نص التقرير<textarea id="mr_preview" rows="12" dir="rtl" readonly></textarea></label></div>'
    + '<div class="modal-actions"><a class="btn btn-whatsapp" id="mr_send" href="#" target="_blank" rel="noopener">📨 فتح واتساب</a><button class="btn btn-outline" id="mr_copy">📋 نسخ</button><button class="btn btn-outline" id="mr_close">إغلاق</button></div>');
  const preview = $('#mr_preview');
  const link = $('#mr_send');
  function upd(){
    preview.value = text;
    const type = $('#mr_type').value === 'business' ? 'business' : 'normal';
    const t = resolveWaTarget($('#mr_target').value, text, type);
    link.href = t.href;
  }
  $('#mr_target').addEventListener('change', upd);
  $('#mr_type').addEventListener('change', upd);
  upd();
  $('#mr_copy').onclick = () => {
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(() => showToastMessage('📋 تم نسخ التقرير.')); }
    else fallbackCopy(text);
  };
  $('#mr_close').onclick = closeModal;
}

function monthlyReportMessage(lesson){
  showReportMessageModal(buildMonthReportText(lesson.name, lesson.monthNumber, lesson.year, lesson.students, lesson.sessions, lesson.records, effectiveStatuses(lesson)));
}

function archiveMonthlyMessage(a){
  const L = state.lessons.find(x => x.id === a.lessonId);
  showReportMessageModal(buildMonthReportText(a.lessonName, a.monthNumber, a.year, archiveStudents(a), a.sessions, a.records, L ? effectiveStatuses(L) : null));
}
function fallbackCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); alert('تم نسخ الرسالة.'); }catch(e){ alert('تعذّر النسخ التلقائي.'); }
  document.body.removeChild(ta);
}

/* ---------- حدث الحصة وملخص الحصة ---------- */
function editSessionEvent(session, after){
  const done = after || (() => renderLessonDetail());
  openModal('📝 حدث في ' + (session.dateLabel || session.label),
    '<div class="form-row"><label>نوع الحدث (مثال: اختبار، مراجعة، نشاط)<input id="ev_name" type="text" value="'+esc(session.event||'')+'" placeholder="مثال: اختبار شهري"></label></div>'
    + '<div class="form-row"><label>تفاصيل إضافية (اختياري)<input id="ev_note" type="text" value="'+esc(session.eventNote||'')+'" placeholder="مثال: من 20 درجة"></label></div>'
    + '<div class="modal-actions"><button class="btn" id="ev_save">حفظ</button><button class="btn btn-outline" id="ev_clear">مسح الحدث</button><button class="btn btn-outline" id="ev_cancel">إلغاء</button></div>');
  $('#ev_save').onclick = () => {
    session.event = $('#ev_name').value.trim();
    session.eventNote = $('#ev_note').value.trim();
    saveState(); done(); closeModal();
  };
  $('#ev_clear').onclick = () => { delete session.event; delete session.eventNote; saveState(); done(); closeModal(); };
  $('#ev_cancel').onclick = closeModal;
}

function sessionSummary(lesson, session, statuses){
  const sd = state.settings;
  const eff = statuses || state.settings.statuses;
  const labelOf = (id) => { const st = eff.find(x => x.id === id); return st ? st.label : id; };
  const groups = {};
  lesson.students.forEach(st => {
    const rec = (lesson.records[st.id] && lesson.records[st.id][session.id]) || {};
    const key = rec.status || '__none__';
    if(!groups[key]) groups[key] = [];
    groups[key].push(st.name);
  });
  const orderKeys = ['st_done','st_apology','st_noanswer'];
  const iconMap = { st_done:'✅ ' + labelOf('st_done'), st_apology:'😢 ' + labelOf('st_apology'), st_noanswer:'❌ ' + labelOf('st_noanswer') };
  let text = '📋 ملخص حصة: ' + session.label + (session.dateLabel ? ' (' + session.dateLabel + ')' : '') + '\n';
  text += '📍 ' + lesson.name + '\n';
  if(session.event) text += '📝 ' + session.event + (session.eventNote ? ' - ' + session.eventNote : '') + '\n';
  const printed = {};
  orderKeys.forEach(k => {
    const list = groups[k] || [];
    if(!list.length) return;
    text += '\n' + (iconMap[k] || '❓') + ' (' + list.length + '):\n' + list.map(n => '• ' + n).join('\n');
    printed[k] = true;
  });
  Object.keys(groups).forEach(k => {
    if(k === '__none__' || printed[k] || orderKeys.indexOf(k) >= 0) return;
    const list = groups[k];
    text += '\n\n' + labelOf(k) + ' (' + list.length + '):\n' + list.map(n => '• ' + n).join('\n');
    printed[k] = true;
  });
  const un = groups['__none__'] || [];
  if(un.length) text += '\n\n➖ بدون تسجيل (' + un.length + '):\n' + un.map(n => '• ' + n).join('\n');
  text = text.trim();
  const typeSel = '<select id="ss_type"><option value="normal">واتساب عادي</option><option value="business">واتساب أعمال</option></select>';
  openModal('📤 ملخص الحصة',
    '<div class="form-row"><label>إرسال إلى (المشرف)<input id="ss_phone" type="text" dir="ltr" value="'+esc(sd.whatsappNumber)+'"></label></div>'
    + '<div class="form-row"><label>نوع الواتساب' + typeSel + '</label></div>'
    + '<div class="form-row"><label>نص الملخص<textarea id="ss_preview" rows="10" dir="rtl" readonly></textarea></label></div>'
    + '<div class="modal-actions"><a class="btn btn-whatsapp" id="ss_send" href="#" target="_blank" rel="noopener">📨 فتح واتساب</a><button class="btn btn-outline" id="ss_copy">📋 نسخ</button><button class="btn btn-outline" id="ss_close">إغلاق</button></div>');
  const preview = $('#ss_preview');
  const link = $('#ss_send');
  function upd(){
    preview.value = text;
    const type = $('#ss_type').value === 'business' ? 'business' : 'normal';
    link.href = waHrefNumber($('#ss_phone').value, text, type);
  }
  $('#ss_type').addEventListener('change', upd);
  $('#ss_phone').addEventListener('input', upd);
  upd();
  $('#ss_copy').onclick = () => {
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(() => showToastMessage('📋 تم نسخ الملخص.')); }
    else fallbackCopy(text);
  };
  $('#ss_close').onclick = closeModal;
}

/* ---------- ملخص حضور الطالب ---------- */
function buildStudentSummaryText(lesson, student, includeAll){
  const eff = effectiveStatuses(lesson);
  const labelOf = (id) => { const st = eff.find(x => x.id === id); return st ? st.label : id; };
  const iconMap = { st_done:'✅ ' + labelOf('st_done'), st_apology:'😢 ' + labelOf('st_apology'), st_noanswer:'❌ ' + labelOf('st_noanswer') };
  const months = [];
  if(includeAll){
    state.archive.filter(a => a.lessonId === lesson.id)
      .sort((a,b) => (a.year - b.year) || (a.monthNumber - b.monthNumber))
      .forEach(a => {
        months.push({ title: 'شهر ' + a.monthNumber + '/' + a.year, sessions: pastSessions(a.sessions), records: (a.records && a.records[student.id]) || {} });
      });
  }
  months.push({ title: 'شهر ' + lesson.monthNumber + '/' + lesson.year, sessions: pastSessions(lesson.sessions), records: (lesson.records && lesson.records[student.id]) || {} });
  let text = '📋 ملخص حضور الطالب: ' + student.name + '\n';
  text += '📍 ' + lesson.name + '\n';
  let totalDone = 0, totalSessions = 0;
  months.forEach(m => {
    const groups = {};
    let done = 0;
    m.sessions.forEach(s => {
      const rec = m.records[s.id] || {};
      const key = rec.status || '__none__';
      if(!groups[key]) groups[key] = [];
      groups[key].push(s.label + (s.dateLabel ? ' (' + s.dateLabel + ')' : ''));
      if(rec.status === 'st_done') done++;
    });
    totalDone += done; totalSessions += m.sessions.length;
    text += '\n━━━ ' + m.title + ' ━━━\n';
    const orderKeys = ['st_done','st_apology','st_noanswer'];
    const printed = {};
    orderKeys.forEach(k => {
      const list = groups[k] || [];
      if(!list.length) return;
      text += (iconMap[k] || '❓') + ' (' + list.length + '):\n' + list.map(x => '• ' + x).join('\n') + '\n';
      printed[k] = true;
    });
    Object.keys(groups).forEach(k => {
      if(k === '__none__' || printed[k] || orderKeys.indexOf(k) >= 0) return;
      text += labelOf(k) + ' (' + groups[k].length + '):\n' + groups[k].map(x => '• ' + x).join('\n') + '\n';
    });
    const un = groups['__none__'] || [];
    if(un.length) text += 'بدون تسجيل (' + un.length + ')\n';
  });
  const pct = totalSessions ? Math.round(totalDone / totalSessions * 100) : 0;
  text += '\n📊 نسبة الحضور الكلية: ' + pct + '% (' + totalDone + ' من ' + totalSessions + ' حصة)';
  return text.trim();
}

function studentSummary(lesson, student){
  const sd = state.settings;
  const scopeSel = '<select id="st_scope"><option value="month">هذا الشهر فقط</option><option value="all">كل الشهور (المؤرشفة + الحالي)</option></select>';
  const typeSel = '<select id="st_type"><option value="normal">واتساب عادي</option><option value="business">واتساب أعمال</option></select>';
  openModal('📤 ملخص الطالب - ' + esc(student.name),
    '<div class="form-row"><label>نطاق الملخص' + scopeSel + '</label></div>'
    + '<div class="form-row"><label>إرسال إلى<input id="st_phone" type="text" dir="ltr" value="'+esc(student.phone || sd.whatsappNumber)+'"></label></div>'
    + '<div class="form-row"><label>نوع الواتساب' + typeSel + '</label></div>'
    + '<div class="form-row"><label>نص الملخص<textarea id="st_preview" rows="10" dir="rtl" readonly></textarea></label></div>'
    + '<div class="modal-actions"><a class="btn btn-whatsapp" id="st_send" href="#" target="_blank" rel="noopener">📨 فتح واتساب</a><button class="btn btn-outline" id="st_copy">📋 نسخ</button><button class="btn btn-outline" id="st_close">إغلاق</button></div>');
  const preview = $('#st_preview');
  const link = $('#st_send');
  function upd(){
    preview.value = buildStudentSummaryText(lesson, student, $('#st_scope').value === 'all');
    const type = $('#st_type').value === 'business' ? 'business' : 'normal';
    link.href = waHrefNumber($('#st_phone').value, preview.value, type);
  }
  $('#st_scope').addEventListener('change', upd);
  $('#st_type').addEventListener('change', upd);
  $('#st_phone').addEventListener('input', upd);
  upd();
  $('#st_copy').onclick = () => {
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(preview.value).then(() => showToastMessage('📋 تم نسخ الملخص.')); }
    else fallbackCopy(preview.value);
  };
  $('#st_close').onclick = closeModal;
}

function updateStatusCellUI(sel){
  const cur = sel.value;
  sel.className = 'status-select ' + (cur === 'st_done' ? 's-done' : cur === 'st_apology' ? 's-apology' : cur === 'st_noanswer' ? 's-noanswer' : cur ? 's-custom' : 's-empty');
}

function updateSessionCounterUI(ssid){
  const L = curLesson();
  if(!L) return;
  let c = 0;
  L.students.forEach(st => {
    const rec = (L.records[st.id] && L.records[st.id][ssid]) || {};
    if(rec.status === 'st_done') c++;
  });
  const sIdx = L.sessions.findIndex(s => s.id === ssid);
  if(sIdx < 0) return;
  const col = 1 + state.settings.customFields.length + sIdx;
  const cells = $$('#tableFoot .count-row td');
  if(cells[col]) cells[col].innerHTML = '<b>' + c + ' / ' + L.students.length + '</b>';
}

/* ---------- المودال ---------- */
function openModal(title, bodyHTML){
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = bodyHTML;
  $('#modalOverlay').hidden = false;
}
function closeModal(){
  $('#modalOverlay').hidden = true;
  $('#modalBody').innerHTML = '';
}

/* ---------- محرر المجموعات (مستوى الوحدة) ---------- */
let editingGroups = [];
function editingGroupsHTML(){
  if(editingGroups.length === 0) return '<p class="muted" style="margin:4px 0 0">لا توجد مجموعات - الدرس كله مجموعة واحدة.</p>';
  return '<div class="groups-box">' + editingGroups.map((g, gi) =>
    '<div class="group-row">'
    + '<div class="g-line">'
    + '<input type="text" value="'+esc(g.name)+'" placeholder="اسم المجموعة" oninput="editingGroups['+gi+'].name=this.value">'
    + '<input type="time" value="'+esc(g.time)+'" oninput="editingGroups['+gi+'].time=this.value">'
    + groupReminderHTML(g, gi)
    + '<button class="mini-btn mini-del" type="button" onclick="removeEditingGroup('+gi+')">✕</button>'
    + '</div>'
    + '<input type="text" class="g-wa" value="'+esc(g.waGroup||'')+'" placeholder="🔗 رابط جروب واتساب خاص بالمجموعة (اختياري)" dir="ltr" oninput="editingGroups['+gi+'].waGroup=this.value">'
    + '</div>'
  ).join('') + '</div>';
}
function renderEditingGroupsBox(){
  const b = $('#groupsBox');
  if(b) b.innerHTML = editingGroupsHTML();
}
function removeEditingGroup(gi){
  editingGroups.splice(gi, 1);
  renderEditingGroupsBox();
}
function addEditingGroup(){
  const t = ($('#l_time') ? $('#l_time').value : '') || '18:00';
  let rem = 0;
  const lrem = $('#l_rem');
  if(lrem){
    if(lrem.value === 'custom'){ rem = parseInt((($('#l_rem_custom')||{}).value),10) || 0; }
    else { rem = parseInt(lrem.value,10) || 0; }
  }
  editingGroups.push({ id: uid('g'), name: 'المجموعة (' + (GROUP_LETTERS[editingGroups.length % GROUP_LETTERS.length]) + ')', time: t, reminderMinutes: rem, waGroup: '' });
  renderEditingGroupsBox();
}

/* ---------- نماذج ---------- */
/* ---------- اختيار رقم من جهات الاتصال (Contact Picker API) ---------- */
const CONTACTS_API_SUPPORTED = ('contacts' in navigator) && typeof navigator.contacts.select === 'function';
function contactPickerBtn(inputId){
  if(!CONTACTS_API_SUPPORTED) return '';
  return '<button type="button" class="btn btn-outline btn-picker" data-pick="'+inputId+'" title="اختيار رقم من جهات الاتصال">📖 جهات الاتصال</button>';
}
function bindContactPickers(){
  if(!CONTACTS_API_SUPPORTED) return;
  $$('#modalBody [data-pick]').forEach(btn => {
    btn.onclick = async () => {
      try{
        const cs = await navigator.contacts.select(['tel'], { multiple:false });
        if(cs && cs.length && cs[0].tel && cs[0].tel.length){
          const inp = document.getElementById(btn.dataset.pick);
          if(inp) inp.value = cs[0].tel[0];
        }
      }catch(err){ /* ألغى المستخدم الاختيار */ }
    };
  });
}
function phoneRow(labelText, inputId, value){
  return '<div class="phone-row"><label style="flex:1;min-width:0">'+esc(labelText)
    + '<input id="'+inputId+'" type="text" value="'+esc(value||'')+'" dir="ltr" placeholder="+20..."></label>'
    + contactPickerBtn(inputId) + '</div>';
}

function openStudentProfile(student, lesson){
  if(!student || !lesson) return;
  const g = (lesson.groups||[]).find(x => x.id === student.groupId);
  const ps = pastSessions(lesson.sessions);
  const doneCount = ps.filter(s => (lesson.records[student.id]||{})[s.id] && lesson.records[student.id][s.id].status === 'st_done').length;
  const apolCount = ps.filter(s => (lesson.records[student.id]||{})[s.id] && lesson.records[student.id][s.id].status === 'st_apology').length;
  const noansCount = ps.filter(s => (lesson.records[student.id]||{})[s.id] && lesson.records[student.id][s.id].status === 'st_noanswer').length;
  const pct = ps.length ? Math.round((doneCount / ps.length) * 100) : 0;
  const ind = ps.length > 0 ? attendanceIndicator(pct) : null;

  const avatarHTML = student.photo
    ? '<img src="'+student.photo+'" class="profile-avatar" alt="'+esc(student.name)+'">'
    : '<div class="profile-avatar-ph">'+esc((student.name||'').trim().charAt(0) || '👤')+'</div>';

  let contactsHTML = '';
  if(student.phone){
    contactsHTML += '<div class="profile-row"><span class="profile-label">📱 هاتف الطالب</span><span class="profile-val">' + esc(localPhone(student.phone)) + ' <a class="mini-btn mini-call" href="tel:'+esc(student.phone)+'">📞</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+student.id+'" data-phone="'+esc(student.phone)+'">واتساب</button></span></div>';
  }
  (student.extraPhones || []).forEach(p => {
    contactsHTML += '<div class="profile-row"><span class="profile-label">📱 هاتف إضافي</span><span class="profile-val">' + esc(localPhone(p)) + ' <a class="mini-btn mini-call" href="tel:'+esc(p)+'">📞</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+student.id+'" data-phone="'+esc(p)+'">واتساب</button></span></div>';
  });
  if(student.guardianPhone){
    contactsHTML += '<div class="profile-row"><span class="profile-label">👨 ولي الأمر</span><span class="profile-val">' + esc(localPhone(student.guardianPhone)) + ' <a class="mini-btn mini-call" href="tel:'+esc(student.guardianPhone)+'">📞</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+student.id+'" data-phone="'+esc(student.guardianPhone)+'">واتساب</button></span></div>';
  }
  (student.guardianExtraPhones || []).forEach(p => {
    contactsHTML += '<div class="profile-row"><span class="profile-label">👨 هاتف إضافي لولي الأمر</span><span class="profile-val">' + esc(localPhone(p)) + ' <a class="mini-btn mini-call" href="tel:'+esc(p)+'">📞</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+student.id+'" data-phone="'+esc(p)+'">واتساب</button></span></div>';
  });

  let personalHTML = '';
  if(student.job) personalHTML += '<div class="profile-row"><span class="profile-label">💼 المهنة / الوظيفة</span><span class="profile-val">' + esc(student.job) + '</span></div>';
  if(student.age) personalHTML += '<div class="profile-row"><span class="profile-label">🎂 العمر</span><span class="profile-val">' + esc(student.age) + ' سنة</span></div>';
  if(student.address) personalHTML += '<div class="profile-row"><span class="profile-label">📍 السكن / العنوان</span><span class="profile-val">' + esc(student.address) + '</span></div>';
  if(student.email) personalHTML += '<div class="profile-row"><span class="profile-label">✉️ البريد الإلكتروني</span><span class="profile-val"><a href="mailto:'+esc(student.email)+'" dir="ltr">' + esc(student.email) + '</a></span></div>';
  (state.settings.customFields || []).forEach(cf => {
    const v = (student.fields || {})[cf.id];
    if(v) personalHTML += '<div class="profile-row"><span class="profile-label">📋 ' + esc(cf.label) + '</span><span class="profile-val">' + esc(v) + '</span></div>';
  });

  let notesHTML = '';
  if(student.profileNotes){
    notesHTML = '<div class="profile-section"><div class="profile-sec-title">📝 ملاحظات خاصة بالطالب</div><div style="font-size:13px;line-height:1.6;white-space:pre-wrap">' + esc(student.profileNotes) + '</div></div>';
  }

  let paymentsHTML = '';
  if(lesson.subscription){
    const payments = student.payments || [];
    const subPrice = lesson.price || 0;
    const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0) + (student.paid && payments.length === 0 ? subPrice : 0);
    const remaining = Math.max(0, subPrice - totalPaid);
    const typeLabel = { subscription: 'اشتراك شهري', book: 'مذكرة / كتاب', other: 'أخرى' };
    const typeClass = { subscription: 'lt-sub', book: 'lt-book', other: 'lt-other' };

    paymentsHTML = '<div class="profile-section">'
      + '<div class="profile-sec-title" style="display:flex;justify-content:space-between;align-items:center">'
      +   '<span>💰 سجل المدفوعات والاشتراكات</span>'
      +   '<button class="btn btn-sm btn-primary" id="prof_add_payment" style="font-size:11px;padding:3px 8px">➕ إضافة دفعة</button>'
      + '</div>'
      + '<div class="pay-summary-box">'
      +   '<div class="ps-row"><span>سعر الاشتراك الشهري:</span><span>' + moneyDisplay(subPrice) + ' ج.م</span></div>'
      +   '<div class="ps-row" style="color:#15803d"><span>إجمالي المدفوع:</span><span>' + moneyDisplay(totalPaid) + ' ج.م</span></div>'
      +   '<div class="ps-row" style="color:' + (remaining > 0 ? '#b91c1c' : '#15803d') + '"><span>المتبقي:</span><span>' + (remaining > 0 ? moneyDisplay(remaining) + ' ج.م' : 'تم السداد بالكامل ✅') + '</span></div>'
      + '</div>'
      + '<div class="payments-ledger">';

    if(payments.length === 0){
      paymentsHTML += '<div class="muted" style="font-size:11px;padding:6px 0;text-align:center">' + (student.paid ? 'تم تحديد دفع كامل الاشتراك من الجدول.' : 'لا توجد حركات دفع مسجلة بعد.') + '</div>';
    } else {
      payments.forEach(p => {
        paymentsHTML += '<div class="ledger-item">'
          + '<div class="ledger-meta">'
          +   '<span class="ledger-type ' + (typeClass[p.type]||'lt-other') + '">' + esc(typeLabel[p.type]||p.type) + '</span>'
          +   '<span style="font-weight:800;color:#15803d">' + moneyDisplay(p.amount) + ' ج.م</span>'
          +   '<span class="muted" style="font-size:11px">(' + esc(p.date) + ')</span>'
          +   (p.note ? '<span style="font-size:11px;color:var(--muted)">- ' + esc(p.note) + '</span>' : '')
          + '</div>'
          + '<button class="btn btn-danger btn-sm" style="padding:2px 6px;font-size:10px" data-del-pay="' + p.id + '" title="حذف هذه الدفعة">🗑️</button>'
          + '</div>';
      });
    }
    paymentsHTML += '</div></div>';
  }

  const html = '<div class="profile-card">'
    + '<div class="profile-avatar-wrap">' + avatarHTML + '</div>'
    + '<div class="profile-name">' + esc(student.name) + '</div>'
    + '<div class="profile-badges">'
    +   (g ? '<span class="badge-group">' + esc(g.name) + '</span>' : '')
    +   (lesson.subscription ? '<span class="paid-toggle" style="margin:0">' + (student.paid ? '✅ مسدد الاشتراك' : '❌ لم يسدد') + '</span>' : '')
    +   (ind ? '<span class="badge-indicator" style="background:'+ind.color+'">' + esc(ind.label) + ' (' + pct + '%)</span>' : '')
    + '</div>'
    + '<div class="profile-section">'
    +   '<div class="profile-sec-title">📊 إحصائيات الحضور (الشهر الحالي)</div>'
    +   '<div class="profile-stats-grid">'
    +     '<div class="profile-stat-box"><div class="ps-num">' + ps.length + '</div><div class="ps-lbl">الحصص</div></div>'
    +     '<div class="profile-stat-box"><div class="ps-num" style="color:#15803d">' + doneCount + '</div><div class="ps-lbl">حضور</div></div>'
    +     '<div class="profile-stat-box"><div class="ps-num" style="color:#b45309">' + apolCount + '</div><div class="ps-lbl">اعتذار</div></div>'
    +     '<div class="profile-stat-box"><div class="ps-num" style="color:#b91c1c">' + noansCount + '</div><div class="ps-lbl">غياب</div></div>'
    +   '</div>'
    + '</div>'
    + (contactsHTML ? '<div class="profile-section"><div class="profile-sec-title">📞 معلومات الاتصال</div>' + contactsHTML + '</div>' : '')
    + (personalHTML ? '<div class="profile-section"><div class="profile-sec-title">👤 البيانات الشخصية</div>' + personalHTML + '</div>' : '')
    + paymentsHTML
    + notesHTML
    + '</div>'
    + '<div class="modal-actions">'
    +   '<button class="btn btn-primary" id="prof_edit">✏️ تعديل بيانات الطالب</button>'
    +   '<button class="btn btn-outline" id="prof_close">إغلاق</button>'
    + '</div>';

  openModal('الملف الشخصي للطالب', html);
  $('#prof_close').onclick = closeModal;
  $('#prof_edit').onclick = () => {
    closeModal();
    studentForm(lesson, student);
  };

  const addPayBtn = $('#prof_add_payment');
  if(addPayBtn){
    addPayBtn.onclick = () => {
      closeModal();
      openAddPaymentModal(student, lesson);
    };
  }
  $$('#modalBody [data-del-pay]').forEach(btn => {
    btn.onclick = (e) => {
      const payId = e.currentTarget.dataset.delPay;
      if(!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
      student.payments = (student.payments || []).filter(x => x.id !== payId);
      const newTotal = (student.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
      if(lesson.price > 0) student.paid = (newTotal >= lesson.price);
      saveState();
      renderLessonDetail();
      openStudentProfile(student, lesson);
      showToastMessage('تم حذف الدفعة.');
    };
  });
}

function studentForm(lesson, student){
  const isEdit = !!student;
  const isSub = lesson ? !!lesson.subscription : false;
  let photoBase64 = (student && student.photo) || '';

  let groupSel = '';
  if(lesson.groups && lesson.groups.length){
    groupSel = '<div class="form-row"><label>المجموعة<select id="f_group">'
      + '<option value="">بدون مجموعة</option>'
      + lesson.groups.map(g => '<option value="'+esc(g.id)+'"'+(student&&student.groupId===g.id?' selected':'')+'>'+esc(g.name)+'</option>').join('')
      + '</select></label></div>';
  }
  let fieldInputs = '';
  (state.settings.customFields||[]).forEach(f => {
    fieldInputs += '<div class="form-row"><label>'+esc(f.label)+'<input type="text" class="f-field" data-fid="'+f.id+'" value="'+esc((student && student.fields && student.fields[f.id]) || '')+'"></label></div>';
  });

  const guardianHTML = isSub
    ? phoneRow('رقم ولي الأمر', 'f_guardian', student ? student.guardianPhone : '')
      + '<div class="form-row"><label>أرقام إضافية لولي الأمر (اختياري)</label>'
      + '<div id="guardianExtraWrap"></div>'
      + '<button type="button" class="btn btn-outline" id="addGuardianExtra" style="margin-top:6px">➕ إضافة رقم آخر لولي الأمر</button>'
      + '</div>'
    : '';
  const extrasHTML = '<div class="form-row"><label>أرقام إضافية للطالب (اختياري)</label>'
      + '<div id="extraPhonesWrap"></div>'
      + '<button type="button" class="btn btn-outline" id="addExtraPhone" style="margin-top:6px">➕ إضافة رقم آخر للطالب</button>'
      + '</div>';

  const photoHTML = '<div class="form-row"><label>صورة الطالب (اختياري - تُضغط كرمز شخصي)'
    + '<div class="photo-picker-wrap">'
    + '<input type="file" id="f_photo" accept="image/*" style="display:none">'
    + '<div id="photoPreviewWrap">' + (photoBase64 ? '<img src="'+photoBase64+'" class="photo-preview">' : '<div class="photo-preview-empty">👤</div>') + '</div>'
    + '<button type="button" class="btn btn-outline btn-sm" id="btnPickPhoto">📷 اختيار صورة</button>'
    + '<button type="button" class="btn btn-danger btn-sm" id="btnRemovePhoto" style="display:'+(photoBase64?'':'none')+'">حذف الصورة</button>'
    + '</div></label></div>';

  const profileExtraHTML = '<div class="grid2">'
    + '<label>المهنة / الوظيفة (اختياري)<input id="f_job" type="text" value="'+esc(student?student.job||'':'')+'" placeholder="مثال: مهندس / محاسب / طالب..."></label>'
    + '<label>العمر (اختياري)<input id="f_age" type="number" min="3" max="100" value="'+esc(student?student.age||'':'')+'" placeholder="مثال: 16"></label>'
    + '</div>'
    + '<div class="grid2">'
    + '<label>مكان السكن / العنوان (اختياري)<input id="f_address" type="text" value="'+esc(student?student.address||'':'')+'" placeholder="مثال: المنصورة - حي الجامعة"></label>'
    + '<label>البريد الإلكتروني (اختياري)<input id="f_email" type="email" value="'+esc(student?student.email||'':'')+'" placeholder="student@example.com" dir="ltr"></label>'
    + '</div>'
    + '<div class="form-row"><label>ملاحظات في الملف الشخصي (اختياري)<textarea id="f_profileNotes" rows="2" placeholder="ملاحظات وسلوك ومستوى الطالب...">'+esc(student?student.profileNotes||'':'')+'</textarea></label></div>';

  openModal(isEdit ? 'تعديل عضو' : 'إضافة عضو جديد',
    photoHTML
    + '<div class="form-row"><label>الاسم<input id="f_name" type="text" value="'+esc(student?student.name:'')+'"></label></div>'
    + phoneRow('رقم هاتف الطالب', 'f_phone', student ? student.phone : '')
    + guardianHTML
    + extrasHTML
    + groupSel
    + profileExtraHTML
    + fieldInputs
    + '<div class="modal-actions"><button class="btn" id="f_save">حفظ</button><button class="btn btn-outline" id="f_cancel">إلغاء</button></div>');

  $('#btnPickPhoto').onclick = () => $('#f_photo').click();
  $('#btnRemovePhoto').onclick = () => {
    photoBase64 = '';
    $('#f_photo').value = '';
    $('#photoPreviewWrap').innerHTML = '<div class="photo-preview-empty">👤</div>';
    $('#btnRemovePhoto').style.display = 'none';
  };
  $('#f_photo').onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 150;
        let w = img.width, h = img.height;
        if(w > h){ if(w > maxDim){ h = Math.round(h * maxDim / w); w = maxDim; } }
        else { if(h > maxDim){ w = Math.round(w * maxDim / h); h = maxDim; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        photoBase64 = canvas.toDataURL('image/jpeg', 0.85);
        $('#photoPreviewWrap').innerHTML = '<img src="'+photoBase64+'" class="photo-preview">';
        $('#btnRemovePhoto').style.display = '';
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
  };

  let extraIdx = 0, gExtraIdx = 0;
  function addExtraRow(val){
    const wrap = $('#extraPhonesWrap');
    if(!wrap) return;
    const id = 'f_extra_' + (extraIdx++);
    const row = document.createElement('div');
    row.className = 'phone-row extra-phone-row';
    row.innerHTML = '<input id="'+id+'" type="text" class="extra-phone-input" value="'+esc(val||'')+'" dir="ltr" placeholder="+20...">'
      + '<button type="button" class="btn btn-danger btn-picker" data-del-row title="حذف الرقم">🗑️</button>'
      + contactPickerBtn(id);
    wrap.appendChild(row);
    row.querySelector('[data-del-row]').onclick = () => row.remove();
    bindContactPickers();
  }
  function addGuardianExtraRow(val){
    const wrap = $('#guardianExtraWrap');
    if(!wrap) return;
    const id = 'f_gextra_' + (gExtraIdx++);
    const row = document.createElement('div');
    row.className = 'phone-row extra-phone-row';
    row.innerHTML = '<input id="'+id+'" type="text" class="guardian-extra-input" value="'+esc(val||'')+'" dir="ltr" placeholder="+20...">'
      + '<button type="button" class="btn btn-danger btn-picker" data-del-row title="حذف الرقم">🗑️</button>'
      + contactPickerBtn(id);
    wrap.appendChild(row);
    row.querySelector('[data-del-row]').onclick = () => row.remove();
    bindContactPickers();
  }
  ((student && student.extraPhones) || []).forEach(p => addExtraRow(p));
  if($('#addExtraPhone')) $('#addExtraPhone').onclick = () => addExtraRow('');
  if(isSub){
    ((student && student.guardianExtraPhones) || []).forEach(p => addGuardianExtraRow(p));
    if($('#addGuardianExtra')) $('#addGuardianExtra').onclick = () => addGuardianExtraRow('');
  }
  bindContactPickers();

  $('#f_save').onclick = () => {
    const nm = $('#f_name').value.trim();
    const ph = normalizePhone($('#f_phone').value);
    const grp = $('#f_group') ? $('#f_group').value : '';
    const job = ($('#f_job') ? $('#f_job').value : '').trim();
    const addr = ($('#f_address') ? $('#f_address').value : '').trim();
    const age = ($('#f_age') ? $('#f_age').value : '').trim();
    const eml = ($('#f_email') ? $('#f_email').value : '').trim();
    const pNotes = ($('#f_profileNotes') ? $('#f_profileNotes').value : '').trim();
    const fields = {};
    $$('#modalBody .f-field').forEach(inp => { fields[inp.dataset.fid] = inp.value; });
    if(!nm){ alert('اكتب الاسم.'); return; }
    const dup = lesson.students.some(x => x.id !== (student ? student.id : null) && normalizeForSearch(x.name) === normalizeForSearch(nm));
    if(dup){ alert('يوجد طالب بهذا الاسم بالفعل في هذا الدرس. (يمكن تكرار رقم الهاتف فقط).'); return; }
    const gp = isSub && $('#f_guardian') ? normalizePhone($('#f_guardian').value) : (student ? student.guardianPhone : '');
    const gExtras = isSub ? $$('#modalBody .guardian-extra-input').map(i => normalizePhone(i.value)).filter(Boolean) : (student ? student.guardianExtraPhones : []);
    const extras = $$('#modalBody .extra-phone-input').map(i => normalizePhone(i.value)).filter(Boolean);

    if(isEdit){
      student.name = nm;
      if(ph) student.phone = ph;
      student.guardianPhone = gp;
      student.guardianExtraPhones = gExtras;
      student.extraPhones = extras;
      student.groupId = grp;
      student.fields = fields;
      student.job = job;
      student.address = addr;
      student.age = age;
      student.email = eml;
      student.profileNotes = pNotes;
      student.photo = photoBase64;
    } else {
      lesson.students.push({
        id: uid('s'),
        name: nm,
        phone: ph || '',
        guardianPhone: gp,
        guardianExtraPhones: gExtras,
        extraPhones: extras,
        paid: false,
        groupId: grp,
        fields,
        job,
        address: addr,
        age,
        email: eml,
        profileNotes: pNotes,
        photo: photoBase64
      });
    }
    saveState(); renderAll(); closeModal();
  };
  $('#f_cancel').onclick = closeModal;
}

function lessonForm(lesson){
  const isEdit = !!lesson;
  const schedule = lesson ? lesson.schedule.slice() : [5];
  const subscription = lesson ? !!lesson.subscription : false;
  const price = lesson ? (lesson.price || 0) : 0;
  const waGroup = lesson ? (lesson.waGroup || '') : '';
  const time = lesson ? (lesson.time || '18:00') : '18:00';
  const reminderMinutes = lesson ? (typeof lesson.reminderMinutes === 'number' ? lesson.reminderMinutes : 60) : 60;
  const remindHeadOnly = lesson ? !!lesson.remindHeadOnly : false;
  editingGroups = lesson && lesson.groups ? lesson.groups.map(g => ({ id: g.id, name: g.name, time: g.time || '18:00', reminderMinutes: (typeof g.reminderMinutes==='number'?g.reminderMinutes:60), waGroup: g.waGroup || '' })) : [];

  let daysHTML = DAY_NAMES.map((d,i) =>
    '<label class="chk"><input type="checkbox" class="day-chk" value="'+i+'"' + (schedule.includes(i)?' checked':'') + '> '+d+'</label>'
  ).join('');

  openModal(isEdit ? 'تعديل الدرس' : 'درس جديد',
    '<div class="form-row"><label>اسم الدرس<input id="l_name" type="text" value="'+esc(lesson?lesson.name:'')+'" placeholder="مثال: درس الفقه"></label></div>'
    + '<div class="form-row"><label>أيام الحصة في الأسبوع<div class="days-grid">'+daysHTML+'</div></label></div>'
    + '<div class="grid2">'
    +   '<label>وقت الحصة الافتراضي<input id="l_time" type="time" value="'+esc(time)+'"></label>'
    +   '<label>التذكير قبل الحصة<select id="l_rem">'+reminderOptionsHTML(reminderMinutes)+'</select><input id="l_rem_custom" type="number" min="1" placeholder="عدد الدقائق" value="'+(REMINDER_PRESETS.includes(reminderMinutes)?'':reminderMinutes)+'" style="display:'+(REMINDER_PRESETS.includes(reminderMinutes)?'none':'')+'"></label>'
    + '</div>'
    + '<div class="grid2">'
    +   '<label>سعر الاشتراك الشهري (ج.م)<input id="l_price" type="number" min="0" step="0.5" value="'+esc(price)+'"></label>'
    +   '<label>رابط/رقم جروب الواتساب<input id="l_waGroup" type="text" dir="ltr" value="'+esc(waGroup)+'" placeholder="https://chat.whatsapp.com/..."></label>'
    + '</div>'
    + '<div class="form-row"><label>المجموعات (لتقسيم عدد كبير إلى مجموعات صغيرة)<div id="groupsBox">'+editingGroupsHTML()+'</div>'
    +   '<button class="btn btn-sm btn-outline" id="addGroupBtn" type="button" style="margin-top:8px">➕ إضافة مجموعة</button></label></div>'
    + '<div class="switch-row" style="margin-top:10px;margin-bottom:8px">'
    +   '<label class="switch"><input type="checkbox" id="l_sub"'+(subscription?' checked':'')+'><span class="switch-slider"></span></label>'
    +   '<span class="switch-label">هذا الدرس باشتراك شهري (يظهر حالة الدفع وسعر الاشتراك)</span>'
    + '</div>'
    + '<div class="switch-row" style="margin-bottom:12px">'
    +   '<label class="switch"><input type="checkbox" id="l_headOnly"'+(remindHeadOnly?' checked':'')+'><span class="switch-slider"></span></label>'
    +   '<span class="switch-label">التذكير برأس الدرس فقط (دون تفاصيل المجموعات)</span>'
    + '</div>'
    + '<div class="modal-actions"><button class="btn" id="l_save">حفظ</button><button class="btn btn-outline" id="l_cancel">إلغاء</button></div>');

  $('#addGroupBtn').onclick = addEditingGroup;
  $('#l_rem').onchange = () => {
    $('#l_rem_custom').style.display = ($('#l_rem').value === 'custom') ? '' : 'none';
  };

  $('#l_save').onclick = () => {
    const nm = $('#l_name').value.trim();
    if(!nm){ alert('اكتب اسم الدرس.'); return; }
    const days = $$('#modalBody .day-chk:checked').map(c => parseInt(c.value,10));
    if(days.length === 0){ alert('اختر يوم حصة واحداً على الأقل.'); return; }
    days.sort((a,b)=>a-b);
    const isSub = $('#l_sub').checked;
    const t = $('#l_time').value || '18:00';
    let rem;
    if($('#l_rem').value === 'custom'){ rem = parseInt($('#l_rem_custom').value,10) || 0; }
    else { rem = parseInt($('#l_rem').value,10) || 0; }
    const pr = parseFloat($('#l_price').value) || 0;
    const wg = $('#l_waGroup').value.trim();
    const headOnly = $('#l_headOnly').checked;
    const cleanGroups = editingGroups.map(g => ({ id: g.id, name: (g.name || '').trim() || 'مجموعة', time: g.time || t, reminderMinutes: g.reminderMinutes, waGroup: (g.waGroup || '').trim() }));
    if(isEdit){
      lesson.name = nm;
      lesson.schedule = days;
      lesson.subscription = isSub;
      lesson.time = t;
      lesson.reminderMinutes = rem;
      lesson.price = pr;
      lesson.waGroup = wg;
      lesson.remindHeadOnly = headOnly;
      lesson.groups = cleanGroups;
    } else {
      const m = nowMonth();
      const L = { id: uid('L'), name: nm, schedule: days, subscription: isSub, price: pr, waGroup: wg, time: t, reminderMinutes: rem, remindHeadOnly: headOnly, groups: cleanGroups, students: [], monthNumber: m.monthNumber, year: m.year, sessions: [], records: {}, lastExportAt: null };
      state.lessons.push(L);
      fillSessions(L);
    }
    saveState(); renderAll(); closeModal();
  };
  $('#l_cancel').onclick = closeModal;
}

function addStatusForm(){
  openModal('إضافة حالة جديدة',
    '<div class="form-row"><label>اسم الحالة<input id="st_name" type="text" placeholder="مثال: متأخر"></label></div>'
    + '<div class="form-row"><label>اللون<input id="st_color" type="color" value="' + STATUS_COLORS[state.settings.statuses.length % STATUS_COLORS.length] + '"></label></div>'
    + '<div class="modal-actions"><button class="btn" id="st_save">حفظ</button><button class="btn btn-outline" id="st_cancel">إلغاء</button></div>');
  $('#st_save').onclick = () => {
    const nm = $('#st_name').value.trim();
    if(!nm){ alert('اكتب اسم الحالة.'); return; }
    state.settings.statuses.push({ id: uid('st'), label: nm, color: $('#st_color').value });
    saveState(); renderAll(); closeModal();
  };
  $('#st_cancel').onclick = closeModal;
}

/* ---------- تبديل التبويبات ---------- */
function switchTab(name){
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
}

/* ---------- ربط الأحداث ---------- */
function bindEvents(){
  $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  $('#addLessonBtn').onclick = () => lessonForm(null);
  $('#brandHome').onclick = () => {
    switchTab('lessons');
    currentLessonId = null;
    lessonFilterQuery = '';
    groupFilterQuery = '';
    globalSearchQuery = '';
    $('#lessonSearch').value = '';
    $('#globalSearch').value = '';
    renderLessonsHome();
    renderLessonDetail();
  };

  $('#backToListBtn').onclick = () => {
    currentLessonId = null;
    lessonFilterQuery = '';
    groupFilterQuery = '';
    $('#lessonSearch').value = '';
    renderLessonsHome();
    renderLessonDetail();
  };

  $('#globalSearch').addEventListener('input', (e) => { globalSearchQuery = e.target.value; renderGlobalSearch(); });

  $('#lessonSearch').addEventListener('input', (e) => { lessonFilterQuery = e.target.value; renderLessonDetail(); });
  $('#groupFilter').addEventListener('change', (e) => { groupFilterQuery = e.target.value; renderLessonDetail(); });

  $('#addStudentBtn').onclick = () => { const L = curLesson(); if(L) studentForm(L, null); };
  $('#addSessionBtn').onclick = () => { const L = curLesson(); if(L){ addSessionModal(L); } };
  $('#regenSessionsBtn').onclick = () => { const L = curLesson(); if(L){ genSessions(L, true); renderAll(); } };
  $('#lessonReportBtn').onclick = () => { const L = curLesson(); if(L) showAnalytics(L.students, pastSessions(L.sessions), L.records, L.name + ' - ' + buildMonthTitle(L.monthNumber), effectiveStatuses(L)); };
  $('#sortAttendanceBtn').onclick = () => sortByAttendance();
  $('#lessonStatusesBtn').onclick = () => { const L = curLesson(); if(L) lessonStatusesEditor(L); };
  $('#compReportBtn').onclick = () => { const L = curLesson(); if(L) showComprehensiveReport(L); };
  $('#changeMonthBtn').onclick = () => { const L = curLesson(); if(L) changeMonth(L); };
  $('#editLessonBtn').onclick = () => { const L = curLesson(); if(L) lessonForm(L); };
  $('#exportLessonBtn').onclick = () => { const L = curLesson(); if(L) exportLesson(L); };
  $('#archiveLessonBtn').onclick = () => { const L = curLesson(); if(L) archiveLessonMonth(L); };

  /* v30: تبويبات الحضور والاختبارات */
  if($('#subtabAttendance')) $('#subtabAttendance').onclick = () => { currentLessonSubtab = 'attendance'; renderLessonDetail(); };
  if($('#subtabExams')) $('#subtabExams').onclick = () => { currentLessonSubtab = 'exams'; renderLessonDetail(); };

  /* v30: التحديد المتعدد */
  if($('#bulkSelectBtn')) $('#bulkSelectBtn').onclick = () => {
    isBulkSelecting = !isBulkSelecting;
    if(!isBulkSelecting) selectedStudentIds.clear();
    renderLessonDetail();
  };
  if($('#bulkCancelBtn')) $('#bulkCancelBtn').onclick = () => {
    isBulkSelecting = false;
    selectedStudentIds.clear();
    renderLessonDetail();
  };
  if($('#bulkMoveBtn')) $('#bulkMoveBtn').onclick = () => { const L = curLesson(); if(L) bulkMoveStudentsModal(L, false); };
  if($('#bulkCopyBtn')) $('#bulkCopyBtn').onclick = () => { const L = curLesson(); if(L) bulkMoveStudentsModal(L, true); };

  /* v30: المراسلة التسلسلية وإضافة الاختبار والنسخ السحابي */
  if($('#seqMsgBtn')) $('#seqMsgBtn').onclick = () => { const L = curLesson(); if(L) openSequentialMessagingModal(L); };
  if($('#addExamBtn')) $('#addExamBtn').onclick = () => { const L = curLesson(); if(L) addExamModal(L, null); };
  if($('#cloudShareBtn')) $('#cloudShareBtn').onclick = cloudShareBackup;
  if($('#tgBackupBtn')) $('#tgBackupBtn').onclick = telegramBackup;
  if($('#set_tgBotToken')) $('#set_tgBotToken').addEventListener('change', (e) => { state.settings.tgBotToken = e.target.value.trim(); saveState(); });
  if($('#set_tgChatId')) $('#set_tgChatId').addEventListener('change', (e) => { state.settings.tgChatId = e.target.value.trim(); saveState(); });
  if($('#openAnalyticsBtn')) $('#openAnalyticsBtn').onclick = openAnalyticsModal;
  if($('#openResetBtn')) $('#openResetBtn').onclick = openResetModal;

  $('#weeklyMsgBtn').onclick = weeklyMessage;
  $('#monthlyMsgBtn').onclick = () => { const L = curLesson(); if(L) monthlyReportMessage(L); };
  $('#blankSheetBtn').onclick = showBlankSheetOptions;

  if($('#enableNotifBtn')) $('#enableNotifBtn').onclick = requestNotifications;
  const notifSw = $('#set_enableNotif');
  if(notifSw){
    notifSw.addEventListener('change', () => {
      if(notifSw.checked){
        requestNotifications();
      } else {
        showToastMessage('تم إيقاف التذكيرات.');
        updateNotifStatus();
      }
    });
  }
  $('#notifBtn').onclick = (e) => { e.stopPropagation(); const p = $('#notifPanel'); renderNotifPanel(); p.hidden = !p.hidden; };
  $('#notifPanel').addEventListener('click', (e) => {
    const del = e.target.closest('[data-wn-del]');
    if(del){ e.stopPropagation(); removeWhatsNew(del.dataset.wnDel); renderNotifPanel(); renderToday(); return; }
    const clr = e.target.closest('[data-wn-clear]');
    if(clr){ e.stopPropagation(); removeAllWhatsNew(); renderNotifPanel(); renderToday(); return; }
    const item = e.target.closest('[data-wn]');
    if(item){ e.stopPropagation(); $('#notifPanel').hidden = true; whatsNewModal(item.dataset.wn); }
  });
  document.addEventListener('click', (e) => {
    const p = $('#notifPanel');
    if(p && !p.hidden && !e.target.closest('.notif-wrap')) p.hidden = true;
  });

  $('#toastDone').onclick = hideToast;
  $('#toastDismiss').onclick = hideToast;

  $('#addStatusBtn').onclick = addStatusForm;
  $('#addFieldBtn').onclick = () => {
    state.settings.customFields.push({ id: uid('f'), label: 'عمود جديد' });
    saveState(); renderAll();
  };
  /* القوائم المنسدلة */
  function toggleDropdown(menuId, btnId){
    const menu = document.getElementById(menuId);
    const btn = document.getElementById(btnId);
    if(!menu || !btn) return;
    const wasOpen = !menu.hidden;
    /* أغلق كل القوائم وأعد ضبط الأنماط */
    $$('.dropdown-menu').forEach(m => { m.hidden = true; m.style.maxHeight = ''; m.style.bottom = ''; m.style.top = ''; });
    if(wasOpen) return;
    const rect = btn.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - rect.bottom - 14;
    const spaceAbove = rect.top - 14;
    /* محاذاة أفقية: من اليمين مع حماية من الخروج من الشاشة */
    const rightPx = Math.max(8, Math.min(vw - rect.right, vw - 208));
    menu.style.right = rightPx + 'px';
    menu.style.left = 'auto';
    if(spaceBelow >= 180 || spaceBelow >= spaceAbove){
      /* افتح لتحت بارتفاع يناسب المساحة */
      menu.style.top = (rect.bottom + 4) + 'px';
      menu.style.bottom = 'auto';
      menu.style.maxHeight = Math.max(140, spaceBelow) + 'px';
    } else {
      /* افتح لفوق */
      menu.style.bottom = (vh - rect.top + 4) + 'px';
      menu.style.top = 'auto';
      menu.style.maxHeight = Math.max(140, spaceAbove) + 'px';
    }
    menu.hidden = false;
  }
  $('#reportsMenuBtn').onclick = () => toggleDropdown('reportsMenu', 'reportsMenuBtn');
  $('#manageMenuBtn').onclick = () => toggleDropdown('manageMenu', 'manageMenuBtn');
  /* إغلاق عند الضغط خارج القائمة */
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.toolbar-dropdown') && !e.target.closest('.dropdown-menu')){
      $$('.dropdown-menu').forEach(m => m.hidden = true);
    }
  });
  /* إغلاق بعد اختيار عنصر */
  $$('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      $$('.dropdown-menu').forEach(m => m.hidden = true);
    });
  });
  $('#exportBackupBtn').onclick = exportBackup;
  $('#importBackupBtn').onclick = () => $('#importFile').click();
  $('#importLessonBtn').onclick = () => $('#importLessonFile').click();
  $('#importArchiveBtn').onclick = () => $('#importArchiveFile').click();
  $('#openFileBtn').onclick = openFromFile;
  $('#saveFileBtn').onclick = saveToFile;
  $('#encryptExportBtn').onclick = encryptExport;
  $('#encryptImportBtn').onclick = () => $('#encryptImportFile').click();
  if($('#enableAutoSaveBtn')) $('#enableAutoSaveBtn').onclick = enableAutoSave;
  if($('#disableAutoSaveBtn')) $('#disableAutoSaveBtn').onclick = disableAutoSave;
  const asSw = $('#set_enableAutoSave');
  if(asSw){
    asSw.addEventListener('change', () => {
      if(asSw.checked){
        enableAutoSave();
      } else {
        disableAutoSave();
      }
    });
  }
  $('#importFile').onchange = (e) => { if(e.target.files[0]) importBackup(e.target.files[0]); e.target.value=''; };
  $('#encryptImportFile').onchange = (e) => { if(e.target.files[0]) decryptImport(e.target.files[0]); e.target.value=''; };
  $('#importLessonFile').onchange = (e) => { if(e.target.files[0]) importLesson(e.target.files[0]); e.target.value=''; };
  $('#importArchiveFile').onchange = (e) => { if(e.target.files[0]) importArchiveMonth(e.target.files[0]); e.target.value=''; };

  [['set_appTitle','appTitle'],['set_monthTitle','monthTitleTemplate'],
   ['set_studentLabel','studentLabel'],['set_notesLabel','notesLabel'],
   ['set_whatsappNumber','whatsappNumber'],['set_messageTemplate','messageTemplate']].forEach(([id,key]) => {
    const el = $('#'+id);
    if(el){
      el.addEventListener('change', (e) => {
        state.settings[key] = e.target.value;
        saveState(); renderHeader(); renderFooter(); renderLessonDetail();
      });
    }
  });
  if($('#set_whatsappType')){
    $('#set_whatsappType').addEventListener('change', (e) => {
      state.settings.whatsappType = e.target.value;
      saveState(); renderLessonDetail();
    });
  }
  if($('#set_warnFuture')){
    $('#set_warnFuture').addEventListener('change', (e) => {
      state.settings.warnFutureAttendance = e.target.checked;
      saveState();
    });
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if(!t) return;
    const act = t.dataset.act;
    const id = t.dataset.id;
    const idx = t.dataset.idx;
    const lessonId = t.dataset.lesson;

    if(act === 'open-lesson'){ currentLessonId = id; lessonFilterQuery = ''; groupFilterQuery = ''; $('#lessonSearch').value = ''; renderLessonDetail(); }
    else if(act === 'view-student'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      if(L && st) openStudentProfile(st, L);
    }
    else if(act === 'open-student'){
      currentLessonId = lessonId;
      const st = state.lessons.find(x=>x.id===lessonId)?.students.find(x=>x.id===id);
      lessonFilterQuery = st ? st.name : '';
      groupFilterQuery = '';
      $('#lessonSearch').value = lessonFilterQuery;
      renderLessonDetail();
    }
    else if(act === 'edit-session-label'){
      const L = curLesson();
      const s = L && L.sessions.find(x => x.id === id);
      if(!s) return;
      const val = prompt('اسم أو مسمى الحصة (مثال: حصة إضافية، مراجعة، اختبار):', s.label || '');
      if(val !== null && val.trim()){
        s.label = val.trim();
        saveState();
        renderLessonDetail();
      }
    }
    else if(act === 'shift-session-left'){
      const L = curLesson();
      if(L) shiftSession(L, id, -1);
    }
    else if(act === 'shift-session-right'){
      const L = curLesson();
      if(L) shiftSession(L, id, 1);
    }
    else if(act === 'field-move-up'){
      const flds = state.settings.customFields;
      const fIdx = flds.findIndex(x => x.id === id);
      if(fIdx > 0){
        const tmp = flds[fIdx]; flds[fIdx] = flds[fIdx - 1]; flds[fIdx - 1] = tmp;
        saveState(); renderSettings(); renderLessonDetail();
      }
    }
    else if(act === 'field-move-down'){
      const flds = state.settings.customFields;
      const fIdx = flds.findIndex(x => x.id === id);
      if(fIdx >= 0 && fIdx < flds.length - 1){
        const tmp = flds[fIdx]; flds[fIdx] = flds[fIdx + 1]; flds[fIdx + 1] = tmp;
        saveState(); renderSettings(); renderLessonDetail();
      }
    }
    else if(act === 'edit-lesson'){ lessonForm(state.lessons.find(x => x.id === id)); }
    else if(act === 'del-lesson'){
      const L = state.lessons.find(x => x.id === id);
      if(L && window.confirm('حذف الدرس «'+L.name+'» وكل بياناته الحالية؟ سيبقى أرشيفه محفوظاً.')){
        state.lessons = state.lessons.filter(x => x.id !== id);
        if(currentLessonId === id) currentLessonId = null;
        saveState(); renderAll();
      }
    }
    else if(act === 'wa'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      const targetPhone = t.dataset.phone || (st && st.phone);
      if(st && targetPhone) openWhatsApp(targetPhone, '', st.name);
    }
    else if(act === 'student-summary'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      if(L && st) studentSummary(L, st);
    }
    else if(act === 'quick-export'){
      const L = curLesson();
      if(L) exportLesson(L);
    }
    else if(act === 'edit-student'){
      const L = curLesson();
      if(L) studentForm(L, L.students.find(x => x.id === id));
    }
    else if(act === 'del-student'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      if(st && window.confirm('حذف العضو «'+st.name+'» من هذا الدرس؟')){
        L.students = L.students.filter(x => x.id !== id);
        delete L.records[id];
        saveState(); renderAll();
      }
    }
    else if(act === 'move-student'){
      const L = curLesson();
      if(!L) return;
      const i = L.students.findIndex(x => x.id === id);
      const dir = t.dataset.dir;
      const j = dir === 'up' ? i-1 : i+1;
      if(i < 0 || j < 0 || j >= L.students.length) return;
      const tmp = L.students[i]; L.students[i] = L.students[j]; L.students[j] = tmp;
      saveState(); renderLessonDetail();
    }
    else if(act === 'reveal-money'){ revealMoney(); }
    else if(act === 'lock-money'){ lockMoney(); }
    else if(act === 'day-note'){
      const archIdx = t.dataset.arch !== undefined ? parseInt(t.dataset.arch,10) : null;
      let container, students, sessions;
      if(archIdx !== null){
        container = state.archive[archIdx];
        if(!container) return;
        students = archiveStudents(container);
        sessions = container.sessions;
      } else {
        container = curLesson();
        if(!container) return;
        students = container.students;
        sessions = container.sessions;
      }
      const st = students.find(x => x.id === t.dataset.sid);
      const s = sessions.find(x => x.id === t.dataset.ssid);
      if(!st || !s) return;
      if(!container.records[st.id]) container.records[st.id] = {};
      const rec = container.records[st.id][s.id] || {};
      openModal('ملاحظة يوم ' + (s.dateLabel || s.label) + ' - ' + st.name,
        '<div class="form-row"><label>سبب الغياب / الملاحظة<textarea id="dn_text" rows="4" dir="rtl" placeholder="مثال: مريض / سفر / ظرف طارئ...">'+esc(rec.note||'')+'</textarea></label></div>'
        + '<div class="modal-actions"><button class="btn" id="dn_save">حفظ</button><button class="btn btn-outline" id="dn_clear">مسح</button><button class="btn btn-outline" id="dn_cancel">إلغاء</button></div>');
      $('#dn_save').onclick = () => {
        if(!container.records[st.id][s.id]) container.records[st.id][s.id] = {};
        container.records[st.id][s.id].note = $('#dn_text').value;
        saveState();
        if(archIdx !== null) renderArchiveDetail(archIdx); else renderLessonDetail();
        closeModal();
      };
      $('#dn_clear').onclick = () => {
        if(container.records[st.id] && container.records[st.id][s.id]) container.records[st.id][s.id].note = '';
        saveState();
        if(archIdx !== null) renderArchiveDetail(archIdx); else renderLessonDetail();
        closeModal();
      };
      $('#dn_cancel').onclick = closeModal;
    }
    else if(act === 'edit-session-event'){
      const archIdx = t.dataset.arch !== undefined ? parseInt(t.dataset.arch,10) : null;
      let sessions, after;
      if(archIdx !== null){
        const a = state.archive[archIdx];
        if(!a) return;
        sessions = a.sessions;
        after = () => renderArchiveDetail(archIdx);
      } else {
        const L = curLesson();
        if(!L) return;
        sessions = L.sessions;
        after = () => renderLessonDetail();
      }
      const s = sessions.find(x => x.id === id);
      if(s) editSessionEvent(s, after);
    }
    else if(act === 'session-summary'){
      if(t.dataset.arch !== undefined){
        const a = state.archive[parseInt(t.dataset.arch,10)];
        if(!a) return;
        const s = a.sessions.find(x => x.id === id);
        if(!s) return;
        const L = state.lessons.find(x => x.id === a.lessonId);
        sessionSummary({ name: a.lessonName, students: archiveStudents(a), records: a.records }, s, L ? effectiveStatuses(L) : null);
        return;
      }
      const L = curLesson();
      const s = L && L.sessions.find(x => x.id === id);
      if(L && s) sessionSummary(L, s, effectiveStatuses(L));
    }
    else if(act === 'edit-session-date'){
      const archIdx = t.dataset.arch !== undefined ? parseInt(t.dataset.arch,10) : null;
      let sessions, after;
      if(archIdx !== null){
        const a = state.archive[archIdx];
        if(!a) return;
        sessions = a.sessions;
        after = () => renderArchiveDetail(archIdx);
      } else {
        const L = curLesson();
        if(!L) return;
        sessions = L.sessions;
        after = () => renderLessonDetail();
      }
      const s = sessions.find(x => x.id === id);
      if(!s) return;
      const val = prompt('تاريخ الحصة (صيغة YYYY-MM-DD):', s.date || '');
      if(val === null) return;
      s.date = val.trim();
      const d = new Date(val.trim());
      s.dateLabel = isNaN(d) ? s.date : formatDate(d);
      if(s.date && archIdx === null){
        const curL = curLesson();
        if(curL) sortLessonSessions(curL);
      }
      saveState(); after();
    }
    else if(act === 'del-session'){
      const archIdx = t.dataset.arch !== undefined ? parseInt(t.dataset.arch,10) : null;
      let container, after;
      if(archIdx !== null){
        container = state.archive[archIdx];
        if(!container) return;
        after = () => renderArchiveDetail(archIdx);
      } else {
        container = curLesson();
        if(!container) return;
        after = () => renderAll();
      }
      const s = container.sessions.find(x => x.id === id);
      if(s && window.confirm('حذف «'+s.label+'» وكل تسجيلاته؟')){
        container.sessions = container.sessions.filter(x => x.id !== id);
        Object.keys(container.records).forEach(k => delete container.records[k][id]);
        container.sessions.forEach((x,i) => x.label = 'حصة ' + (i+1));
        saveState(); after();
      }
    }
    else if(act === 'bulk-attendance'){
      const L = curLesson();
      const s = L && L.sessions.find(x => x.id === id);
      if(L && s) openBulkAttendanceModal(L, s);
    }
    else if(act === 'open-payments'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      if(L && st) openStudentProfile(st, L);
    }
    else if(act === 'edit-exam'){
      const L = curLesson();
      const ex = L && (L.exams||[]).find(x => x.id === id);
      if(L && ex) addExamModal(L, ex);
    }
    else if(act === 'del-exam'){
      const L = curLesson();
      const ex = L && (L.exams||[]).find(x => x.id === id);
      if(L && ex && window.confirm('حذف «' + ex.name + '» وكل درجات الطلاب فيه؟')){
        L.exams = L.exams.filter(x => x.id !== id);
        if(L.examScores){
          Object.keys(L.examScores).forEach(sid => { delete L.examScores[sid][id]; });
        }
        saveState();
        renderExamsTable(L);
      }
    }
    else if(act === 'open-archive'){ renderArchiveDetail(parseInt(idx,10)); }
    else if(act === 'analytics'){
      const a = state.archive[parseInt(idx,10)];
      const L = state.lessons.find(x => x.id === a.lessonId);
      showAnalytics(archiveStudents(a), pastSessions(a.sessions), a.records, a.lessonName + ' - ' + buildMonthTitle(a.monthNumber), L ? effectiveStatuses(L) : null);
    }
    else if(act === 'csv'){
      const a = state.archive[parseInt(idx,10)];
      const L = state.lessons.find(x => x.id === a.lessonId);
      exportCSV(archiveStudents(a), a.sessions, a.records, a.lessonName, L ? effectiveStatuses(L) : null);
    }
    else if(act === 'pdf'){
      const a = state.archive[parseInt(idx,10)];
      const L = state.lessons.find(x => x.id === a.lessonId);
      printReport(archiveStudents(a), a.sessions, a.records, a.lessonName + ' - ' + buildMonthTitle(a.monthNumber), L ? effectiveStatuses(L) : null);
    }
    else if(act === 'archive-report-msg'){
      const a = state.archive[parseInt(idx,10)];
      if(a) archiveMonthlyMessage(a);
    }
    else if(act === 'archive-seq-msg'){
      const a = state.archive[parseInt(idx,10)];
      if(a) openSequentialMessagingModal(a);
    }
    else if(act === 'export-archive'){
      const a = state.archive[parseInt(idx,10)];
      if(a) exportArchiveMonth(a);
    }
    else if(act === 'arch-add-session'){
      const a = state.archive[parseInt(idx,10)];
      if(!a) return;
      a.sessions.push({ id: uid('ss'), label: 'حصة ' + (a.sessions.length + 1), date: '', dateLabel: '' });
      saveState(); renderArchiveDetail(idx);
    }
    else if(act === 'restore-archive'){
      restoreArchiveMonth(parseInt(idx,10));
    }
    else if(act === 'del-archive'){
      if(window.confirm('حذف هذا الشهر من الأرشيف نهائياً؟')){
        state.archive.splice(parseInt(idx,10), 1);
        saveState(); renderArchive();
      }
    }
    else if(act === 'del-field'){
      if(window.confirm('حذف هذا العمود وقيمه من كل الطلاب؟')){
        state.settings.customFields = state.settings.customFields.filter(x => x.id !== id);
        state.lessons.forEach(L => L.students.forEach(st => { if(st.fields) delete st.fields[id]; }));
        state.archive.forEach(a => a.students.forEach(st => { if(st.fields) delete st.fields[id]; }));
        saveState(); renderAll();
      }
    }
    else if(act === 'del-status'){
      const s = state.settings.statuses.find(x => x.id === id);
      if(!s) return;
      if(state.settings.statuses.length <= 1){ alert('يجب أن تبقى حالة واحدة على الأقل.'); return; }
      if(window.confirm('حذف الحالة «'+s.label+'»؟')){
        state.settings.statuses = state.settings.statuses.filter(x => x.id !== id);
        const clearIn = (records) => {
          Object.keys(records||{}).forEach(k => {
            Object.keys(records[k]||{}).forEach(ssid => {
              if(records[k][ssid].status === id) records[k][ssid].status = '';
            });
          });
        };
        state.lessons.forEach(L => clearIn(L.records));
        state.archive.forEach(a => clearIn(a.records));
        saveState(); renderAll();
      }
    }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if(t.matches('[data-act="status-label"], [data-act="status-color"], [data-act="field-label"], [data-act="ind-label"], [data-act="ind-color"], [data-act="ind-pct"]')){
      if(t.dataset.act === 'status-label'){
        const s = state.settings.statuses.find(x => x.id === t.dataset.id);
        if(s){ s.label = t.value; saveState(); renderLessonDetail(); renderArchive(); }
      } else if(t.dataset.act === 'status-color'){
        const s = state.settings.statuses.find(x => x.id === t.dataset.id);
        if(s){ s.color = t.value; saveState(); renderLessonDetail(); }
      } else if(t.dataset.act === 'field-label'){
        const f = state.settings.customFields.find(x => x.id === t.dataset.id);
        if(f){ f.label = t.value; saveState(); renderLessonDetail(); }
      } else if(t.dataset.act === 'ind-label'){
        const ind = (state.settings.attendanceIndicators||[]).find(x => x.id === t.dataset.id);
        if(ind){ ind.label = t.value; saveState(); renderLessonDetail(); }
      } else if(t.dataset.act === 'ind-color'){
        const ind = (state.settings.attendanceIndicators||[]).find(x => x.id === t.dataset.id);
        if(ind){ ind.color = t.value; saveState(); renderLessonDetail(); }
      } else if(t.dataset.act === 'ind-pct'){
        const ind = (state.settings.attendanceIndicators||[]).find(x => x.id === t.dataset.id);
        if(ind){ ind.minPct = Math.max(0, Math.min(100, parseInt(t.value)||0)); saveState(); renderLessonDetail(); }
      }
      return;
    }
    if(t.matches('[data-act="field"]')){
      const L = curLesson();
      if(!L) return;
      const st = L.students.find(x => x.id === t.dataset.id);
      if(st){ if(!st.fields) st.fields = {}; st.fields[t.dataset.fid] = t.value; }
      clearTimeout(fieldSaveTimer);
      fieldSaveTimer = setTimeout(() => saveState(), 400);
    }
  });

  document.addEventListener('change', (e) => {
    const st = e.target.closest('[data-act="status"]');
    if(st){
      const sid = st.dataset.sid, ssid = st.dataset.ssid;
      if(st.dataset.arch !== undefined){
        const a = state.archive[parseInt(st.dataset.arch,10)];
        if(!a) return;
        if(!a.records[sid]) a.records[sid] = {};
        if(!a.records[sid][ssid]) a.records[sid][ssid] = {};
        a.records[sid][ssid].status = st.value;
        saveState();
        updateStatusCellUI(st);
        let c = 0;
        const sts = archiveStudents(a);
        sts.forEach(s2 => { const rec = (a.records[s2.id] && a.records[s2.id][ssid]) || {}; if(rec.status === 'st_done') c++; });
        const sIdx = a.sessions.findIndex(s => s.id === ssid);
        const detailEl = $('#archiveDetail');
        if(detailEl && sIdx >= 0){
          const cells = detailEl.querySelectorAll('tfoot .count-row td');
          const col = 1 + state.settings.customFields.length + sIdx;
          if(cells[col]) cells[col].innerHTML = '<b>' + c + ' / ' + sts.length + '</b>';
        }
      } else {
        const L = curLesson();
        if(!L) return;
        if(!L.records[sid]) L.records[sid] = {};
        if(!L.records[sid][ssid]) L.records[sid][ssid] = {};
        L.records[sid][ssid].status = st.value;
        saveState();
        updateStatusCellUI(st);
        updateSessionCounterUI(ssid);
        warnIfFutureSession(L, ssid);
      }
    }
    else if(e.target.matches('[data-act="paid"]')){
      if(e.target.dataset.arch !== undefined){
        const a = state.archive[parseInt(e.target.dataset.arch,10)];
        if(!a) return;
        const st2 = a.students.find(x => x.id === e.target.dataset.id);
        if(st2){ st2.paid = e.target.checked; saveState(); }
        return;
      }
      const L = curLesson();
      if(!L) return;
      const st = L.students.find(x => x.id === e.target.dataset.id);
      if(st){ st.paid = e.target.checked; saveState(); renderLessonDetail(); }
    }
    else if(e.target.matches('[data-act="note"]')){
      if(e.target.dataset.arch !== undefined){
        const a = state.archive[parseInt(e.target.dataset.arch,10)];
        if(!a) return;
        if(!a.records[e.target.dataset.id]) a.records[e.target.dataset.id] = {};
        a.records[e.target.dataset.id]['__note__'] = e.target.value;
        saveState();
        return;
      }
      const L = curLesson();
      if(!L) return;
      const sid = e.target.dataset.id;
      if(!L.records[sid]) L.records[sid] = {};
      L.records[sid]['__note__'] = e.target.value;
      saveState();
    }
    else if(e.target.matches('[data-act="order"]')){
      const L = curLesson();
      if(!L) return;
      const pos = parseInt(e.target.value, 10);
      if(pos && pos >= 1 && pos <= L.students.length){
        moveStudentTo(L, e.target.dataset.id, pos);
      } else {
        renderLessonDetail();
      }
    }
    else if(e.target.id === 'bulkSelectAll'){
      const L = curLesson();
      if(!L) return;
      if(e.target.checked){
        L.students.forEach(st => selectedStudentIds.add(st.id));
      } else {
        selectedStudentIds.clear();
      }
      renderLessonDetail();
    }
    else if(e.target.matches('.bulk-student-check')){
      const sid = e.target.dataset.id;
      if(e.target.checked){
        selectedStudentIds.add(sid);
      } else {
        selectedStudentIds.delete(sid);
      }
      const cntEl = $('#bulkSelectedCount');
      if(cntEl) cntEl.textContent = selectedStudentIds.size;
      const allChk = $('#bulkSelectAll');
      const L = curLesson();
      if(allChk && L){
        allChk.checked = L.students.length > 0 && L.students.every(st => selectedStudentIds.has(st.id));
      }
    }
    else if(e.target.matches('.exam-input')){
      const L = curLesson();
      if(!L) return;
      const sid = e.target.dataset.sid;
      const eid = e.target.dataset.eid;
      const ex = (L.exams||[]).find(x => x.id === eid);
      const val = e.target.value.trim();

      if(!L.examScores) L.examScores = {};
      if(!L.examScores[sid]) L.examScores[sid] = {};

      if(val === '' || isNaN(Number(val))){
        delete L.examScores[sid][eid];
      } else {
        let num = Number(val);
        if(ex && ex.maxScore > 0){
          if(num < 0) num = 0;
          if(num > ex.maxScore) num = ex.maxScore;
        }
        L.examScores[sid][eid] = num;
        e.target.value = num;
      }
      saveState();
      renderExamsTable(L);
    }
  });

  $('#modalClose').onclick = closeModal;
  $('#modalOverlay').addEventListener('click', (e) => {
    if(e.target === $('#modalOverlay')) closeModal();
  });
}

function curLesson(){
  return state.lessons.find(x => x.id === currentLessonId) || null;
}

/* ---------- إعادة ترتيب الطلاب بالسحب ---------- */
function reorderStudent(lesson, fromId, toId){
  const from = lesson.students.findIndex(s => s.id === fromId);
  const to = lesson.students.findIndex(s => s.id === toId);
  if(from < 0 || to < 0 || from === to) return;
  const [moved] = lesson.students.splice(from, 1);
  lesson.students.splice(to, 0, moved);
  saveState();
  renderLessonDetail();
}

function moveStudentTo(lesson, studentId, pos){
  const from = lesson.students.findIndex(s => s.id === studentId);
  if(from < 0) return;
  let to = pos - 1;
  if(to < 0) to = 0;
  if(to >= lesson.students.length) to = lesson.students.length - 1;
  if(to === from) return;
  const [moved] = lesson.students.splice(from, 1);
  lesson.students.splice(to, 0, moved);
  saveState();
  renderLessonDetail();
}

function beginTouchDrag(row, t){
  dragState.touchActive = true;
  dragState.touchTimer = null;
  dragState.dragId = row.dataset.dragId;
  row.classList.add('dragging');
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  const nameEl = row.querySelector('.student-name');
  ghost.textContent = nameEl ? nameEl.textContent.replace(/^\d+\s*/, '') : 'طالب';
  document.body.appendChild(ghost);
  dragState.ghost = ghost;
  moveTouchDrag(t);
}

function moveTouchDrag(t){
  autoScrollOnDrag(t.clientY);
  if(dragState.ghost){
    dragState.ghost.style.left = (t.clientX + 10) + 'px';
    dragState.ghost.style.top = (t.clientY - 22) + 'px';
  }
  const el = document.elementFromPoint(t.clientX, t.clientY);
  const row = el ? el.closest('tr.student-row') : null;
  $$('tr.student-row').forEach(r => r.classList.remove('drop-target'));
  if(row && row.dataset.dragId !== dragState.dragId) row.classList.add('drop-target');
}

function endTouchDrag(){
  clearTimeout(dragState.touchTimer);
  dragState.touchTimer = null;
  if(dragState.touchActive){
    const L = curLesson();
    const targetRow = document.querySelector('tr.student-row.drop-target');
    if(L && dragState.dragId && targetRow && targetRow.dataset.dragId !== dragState.dragId){
      reorderStudent(L, dragState.dragId, targetRow.dataset.dragId);
    }
  }
  if(dragState.ghost){ dragState.ghost.remove(); dragState.ghost = null; }
  $$('tr.student-row').forEach(r => r.classList.remove('dragging','drop-target'));
  dragState.touchActive = false;
  dragState.dragId = null;
  dragState.row = null;
}

function autoScrollOnDrag(clientY){
  const edge = 90, step = 16;
  if(clientY < edge){ window.scrollBy(0, -step); }
  else if(clientY > window.innerHeight - edge){ window.scrollBy(0, step); }
}

function initDragReorder(){
  /* الماوس - سحب وإفلات أصلي (الطلاب والحصص) */
  let dragSessionId = null;
  document.addEventListener('dragstart', (e) => {
    const th = e.target.closest('th.session-col-drag');
    if(th){
      if(e.target.closest('button,a,input,select,textarea')) { e.preventDefault(); return; }
      dragSessionId = th.dataset.sessionId;
      th.classList.add('col-dragging');
      if(e.dataTransfer){
        e.dataTransfer.effectAllowed = 'move';
        try{ e.dataTransfer.setData('text/plain', dragSessionId); }catch(_){}
      }
      return;
    }
    if(dragState.suppressNative){ e.preventDefault(); return; }
    if(e.target.closest('button,a,input,select,textarea,label')){ e.preventDefault(); return; }
    const row = e.target.closest('tr.student-row');
    if(!row) return;
    dragState.dragId = row.dataset.dragId;
    row.classList.add('dragging');
    if(e.dataTransfer){
      e.dataTransfer.effectAllowed = 'move';
      try{ e.dataTransfer.setData('text/plain', row.dataset.dragId); }catch(_){}
    }
  });
  document.addEventListener('dragend', () => {
    if(dragSessionId){
      $$('th.session-col-drag').forEach(t => t.classList.remove('col-dragging','col-drop-target-left','col-drop-target-right'));
      dragSessionId = null;
    }
    $$('tr.student-row').forEach(r => r.classList.remove('dragging','drop-target'));
    dragState.dragId = null;
  });
  document.addEventListener('dragover', (e) => {
    if(dragSessionId){
      const th = e.target.closest('th.session-col-drag');
      if(!th || th.dataset.sessionId === dragSessionId) return;
      e.preventDefault();
      if(e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      $$('th.session-col-drag').forEach(t => t.classList.remove('col-drop-target-left','col-drop-target-right'));
      const rect = th.getBoundingClientRect();
      if(e.clientX < rect.left + rect.width / 2){
        th.classList.add('col-drop-target-left');
      } else {
        th.classList.add('col-drop-target-right');
      }
      return;
    }
    if(!dragState.dragId) return;
    autoScrollOnDrag(e.clientY);
    const row = e.target.closest('tr.student-row');
    if(!row) return;
    e.preventDefault();
    if(e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    $$('tr.student-row').forEach(r => r.classList.remove('drop-target'));
    if(row.dataset.dragId !== dragState.dragId) row.classList.add('drop-target');
  });
  document.addEventListener('drop', (e) => {
    if(dragSessionId){
      const th = e.target.closest('th.session-col-drag');
      const L = curLesson();
      if(th && L && th.dataset.sessionId !== dragSessionId){
        e.preventDefault();
        const fromIdx = L.sessions.findIndex(x => x.id === dragSessionId);
        const toIdx = L.sessions.findIndex(x => x.id === th.dataset.sessionId);
        if(fromIdx >= 0 && toIdx >= 0){
          const [moved] = L.sessions.splice(fromIdx, 1);
          L.sessions.splice(toIdx, 0, moved);
          saveState();
          renderLessonDetail();
        }
      }
      $$('th.session-col-drag').forEach(t => t.classList.remove('col-dragging','col-drop-target-left','col-drop-target-right'));
      dragSessionId = null;
      return;
    }
    const row = e.target.closest('tr.student-row');
    const L = curLesson();
    if(!L || !dragState.dragId) return;
    e.preventDefault();
    if(row && row.dataset.dragId !== dragState.dragId){
      reorderStudent(L, dragState.dragId, row.dataset.dragId);
    }
    $$('tr.student-row').forEach(r => r.classList.remove('dragging','drop-target'));
    dragState.dragId = null;
  });

  /* السحب الأفقي للجدول (يمين/يسار) بالماوس */
  document.addEventListener('mousedown', (e) => {
    if(e.button !== 0) return;
    const wrap = e.target.closest('.table-wrap');
    if(!wrap) return;
    if(e.target.closest('button,a,input,select,textarea,label')) return;
    hScroll.active = true;
    hScroll.wrap = wrap;
    hScroll.startX = e.clientX;
    hScroll.startY = e.clientY;
    hScroll.startScroll = wrap.scrollLeft;
    hScroll.horiz = false;
  }, true);
  document.addEventListener('mousemove', (e) => {
    if(!hScroll.active) return;
    const dx = e.clientX - hScroll.startX;
    const dy = e.clientY - hScroll.startY;
    if(!hScroll.horiz){
      if(Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy) && hScroll.wrap.scrollWidth > hScroll.wrap.clientWidth){
        hScroll.horiz = true;
        hScroll.wrap.classList.add('h-grabbing');
      } else if(Math.abs(dy) > 5 && Math.abs(dy) > Math.abs(dx)){
        hScroll.active = false;
      }
    }
    if(hScroll.horiz){
      dragState.suppressNative = true;
      hScroll.wrap.scrollLeft = hScroll.startScroll - dx;
    }
  });
  document.addEventListener('mouseup', () => {
    if(hScroll.horiz && hScroll.wrap) hScroll.wrap.classList.remove('h-grabbing');
    hScroll.active = false;
    hScroll.horiz = false;
    hScroll.wrap = null;
    dragState.suppressNative = false;
  }, true);

  /* اللمس - ضغطة مطوّلة ثم سحب */
  document.addEventListener('touchstart', (e) => {
    if(e.target.closest('button,a,input,select,textarea,label')) return;
    const row = e.target.closest('tr.student-row');
    if(!row) return;
    const t = e.touches[0];
    dragState.row = row;
    dragState.startX = t.clientX;
    dragState.startY = t.clientY;
    clearTimeout(dragState.touchTimer);
    dragState.touchTimer = setTimeout(() => beginTouchDrag(row, t), 480);
  }, {passive:true});

  document.addEventListener('touchmove', (e) => {
    if(dragState.touchActive){
      e.preventDefault();
      moveTouchDrag(e.touches[0]);
      return;
    }
    if(dragState.touchTimer && e.touches[0]){
      const t = e.touches[0];
      if(Math.abs(t.clientX - dragState.startX) > 10 || Math.abs(t.clientY - dragState.startY) > 10){
        clearTimeout(dragState.touchTimer);
        dragState.touchTimer = null;
        dragState.row = null;
      }
    }
  }, {passive:false});

  document.addEventListener('touchend', endTouchDrag);
  document.addEventListener('touchcancel', endTouchDrag);

  document.addEventListener('wheel', (e) => {
    if(dragState.dragId || dragState.touchActive){
      window.scrollBy(0, e.deltaY);
    }
  }, {passive:true});
}

/* ---------- تشغيل ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  bindEvents();
  initDragReorder();
  initAutoSave();
  renderToday();
  scheduleReminders();
  maybeShowChangelog(() => maybePromptNotifications());
  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
});

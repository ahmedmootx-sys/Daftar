'use strict';

/* =====================================================================
   Daftar — متابعة حضور وغياب الدروس (متعدد الأقسام، كل درس شهره المستقل)
   مجموعات + ملاحظات يومية + تذكيرات + أعمدة إضافية + دخل + تصدير/استيراد دروس
   ===================================================================== */

const STORAGE_KEY = '***';

/* ---------- بيانات المسؤول الثابتة ---------- */
const ADMIN_NAME = 'Ahmed Saber Sayed Hamed';
const ADMIN_PHONE = '+20 12 83279337';
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
const APP_VERSION = 'v15';
const CHANGELOG = {
  v15: [
    '📤 ملخص حضور الطالب: يوضح أي حصص حضر / اعتذر / لم يحضر + نسبة الحضور، مع إرساله واتساب (الشهر أو كل الشهور)',
    '⚡ تحسين سرعة التطبيق على الموبايل: تغيير الحالة أصبح فورياً بدون إعادة رسم الجدول كاملاً'
  ],
  v14: [
    '📝 إضافة حدث لحصة معينة (مثل: اختبار) ويظهر في تقرير الشهر/الطباعة',
    '📤 زر ملخص الحصة: من حضر / لم يحضر / اعتذر — يُرسل للمشرف واتساب',
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
function waHref(phone, text){
  const num = digits(phone);
  const business = (state && state.settings && state.settings.whatsappType === 'business');
  if(business){
    return 'https://api.whatsapp.com/send?phone=' + num + (text ? '&text=' + encodeURIComponent(text) : '');
  }
  return 'https://wa.me/' + num + (text ? '?text=' + encodeURIComponent(text) : '');
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
    + '<option value="custom"'+(custom?' selected':'')+'>مخصص…</option>';
}
function groupReminderHTML(g, gi){
  const val = g.reminderMinutes;
  const custom = !REMINDER_PRESETS.includes(val);
  return '<select class="g-rem" data-gi="'+gi+'" onchange="groupRemChanged('+gi+', this.value, this)">'
    + REMINDERS.map(r => '<option value="'+r.value+'"'+(String(r.value)===String(val)?' selected':'')+'>'+r.label+'</option>').join('')
    + '<option value="custom"'+(custom?' selected':'')+'>مخصص…</option>'
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
      messageTemplate: 'السلام عليكم ورحمة الله وبركاته\n\nأخباركم إن شاء الله تكونو بخير\n\nبنأكد على معاد النهاردة الساعة {time} وجزاكم الله خيراً',
      ownerName: ADMIN_NAME,
      ownerPhone: ADMIN_PHONE
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
function normalizeStudent(st){
  return { id: st.id || uid('s'), name: st.name || '', phone: normalizePhone(st.phone), paid: !!st.paid, groupId: st.groupId || '', fields: (st.fields && typeof st.fields === 'object') ? st.fields : {} };
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
  settings.ownerName = ADMIN_NAME;
  settings.ownerPhone = ADMIN_PHONE;

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
        groups: Array.isArray(L.groups) ? L.groups.map(normalizeGroup) : [],
        students: Array.isArray(L.students) ? L.students.map(normalizeStudent) : [],
        monthNumber, year,
        sessions: (Array.isArray(L.sessions) ? L.sessions : (Array.isArray(cur.sessions) ? cur.sessions : [])),
        records: (L.records && typeof L.records === 'object') ? L.records : ((cur.records && typeof cur.records === 'object') ? cur.records : {})
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
function addSession(lesson){
  const n = lesson.sessions.length + 1;
  lesson.sessions.push({ id: uid('ss'), label: 'حصة ' + n, date:'', dateLabel:'' });
  saveState();
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
    + '<div class="form-row"><label>سؤال الأمان (اختياري — للاسترجاع لو نسيت)<input id="mp_q" type="text" placeholder="مثال: ما اسم أول مدرسة؟"></label></div>'
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
    alert('لم يتم إعداد سؤال أمان، فلا يمكن استرجاع كلمة السر تلقائياً.');
    return;
  }
  openModal('🔑 استرجاع كلمة السر',
    '<p class="muted">سؤال الأمان: <b>' + esc(state.moneySecurityQ) + '</b></p>'
    + '<div class="form-row"><label>إجابتك<input id="mp_ans" type="text"></label></div>'
    + '<div class="modal-actions"><button class="btn" id="mp_verify">تحقق</button><button class="btn btn-outline" id="mp_cancel">إلغاء</button></div>');
  const ans = await new Promise(resolve => {
    $('#mp_verify').onclick = () => { const v = $('#mp_ans').value; closeModal(); resolve(v); };
    $('#mp_cancel').onclick = () => { closeModal(); resolve(null); };
  });
  if(ans == null) return;
  const h = await sha256Hex(normalizeForSearch(ans));
  if(h !== state.moneySecurityA){ alert('الإجابة غير صحيحة.'); return; }
  await setNewMoneyPassword();
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
  openModal('📱 اختر نوع الواتساب' + (label ? ' — ' + esc(label) : ''),
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

/* ---------- شاشة الدروس ---------- */
function renderLessonsHome(){
  const list = $('#lessonsList');
  if(state.lessons.length === 0){
    list.innerHTML = '<div class="empty-state">لا توجد دروس بعد — اضغط «درس جديد» لإضافة أول درس.</div>';
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
      if(normalizeForSearch(st.name).includes(qN) || (st.phone||'').includes(q) || (qN && String(sidx+1) === qN)){
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
      const cnt = L.students.length, paid = L.students.filter(s=>s.paid).length;
      const total = cnt * L.price, coll = paid * L.price;
      incEl.innerHTML = '💰 الدخل: <b>' + moneyDisplay(coll) + ' / ' + moneyDisplay(total) + ' ج.م</b>';
      incEl.style.display = '';
    } else {
      incEl.style.display = 'none';
    }
  }

  renderGroupFilter(L);

  const sd = state.settings;
  const head = $('#tableHead');
  const body = $('#tableBody');

  let h = '<tr><th class="sticky-col">' + esc(sd.studentLabel) + '</th>';
  sd.customFields.forEach(f => { h += '<th class="field-col">' + esc(f.label) + '</th>'; });
  L.sessions.forEach(s => {
    h += '<th><div class="week-head">'
       + '<span>' + esc(s.label) + '</span>'
       + '<span class="week-date" title="اضغط لتعديل التاريخ" data-act="edit-session-date" data-id="'+s.id+'">' + (s.dateLabel ? esc(s.dateLabel) : 'بدون تاريخ') + '</span>'
       + (s.event ? '<span class="week-event" title="اضغط لتعديل الحدث" data-act="edit-session-event" data-id="'+s.id+'">📝 ' + esc(s.event) + '</span>' : '')
       + '<button class="del-week" data-act="del-session" data-id="'+s.id+'" title="حذف الحصة">حذف</button>'
       + '<div class="week-tools">'
       + '<button class="mini-btn mini-edit" data-act="edit-session-event" data-id="'+s.id+'">📝 حدث</button>'
       + '<button class="mini-btn mini-wa" data-act="session-summary" data-id="'+s.id+'">📤 ملخص</button>'
       + '</div>'
       + '</div></th>';
  });
  h += '<th>' + esc(sd.notesLabel) + '</th></tr>';
  head.innerHTML = h;

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
      return normalizeForSearch(st.name).includes(fqN) || (st.phone||'').includes(fq);
    });
  }

  let b = '';
  students.forEach(st => {
    const realIdx = L.students.findIndex(x => x.id === st.id);
    const g = (L.groups||[]).find(x => x.id === st.groupId);
    b += '<tr class="student-row" draggable="true" data-drag-id="'+st.id+'">'
       + '<td class="sticky-col student-cell">'
       +   '<div class="student-name"><input class="order-input" type="number" min="1" max="'+L.students.length+'" value="'+(realIdx+1)+'" data-act="order" data-id="'+st.id+'" title="اكتب رقم الترتيب الجديد ثم اضغط Enter"> ' + esc(st.name) + (g ? ' <span class="badge-group">'+esc(g.name)+'</span>' : '') + '</div>'
       +   '<div class="student-phone">' + esc(st.phone) + '</div>'
       +   '<div class="student-actions">'
       +     '<button class="mini-btn mini-move" data-act="move-student" data-id="'+st.id+'" data-dir="up"'+(realIdx===0?' disabled':'')+' title="تحريك لأعلى">▲</button>'
       +     '<button class="mini-btn mini-move" data-act="move-student" data-id="'+st.id+'" data-dir="down"'+(realIdx===L.students.length-1?' disabled':'')+' title="تحريك لأسفل">▼</button>'
       +     (st.phone ? '<a class="mini-btn mini-call" href="tel:' + esc(st.phone) + '">📞 اتصال</a>' : '')
       +     (st.phone ? '<button class="mini-btn mini-wa" data-act="wa" data-id="'+st.id+'">واتساب</button>' : '')
       +     '<button class="mini-btn mini-wa" data-act="student-summary" data-id="'+st.id+'" title="ملخص حضور الطالب وإرساله له">📤 ملخص</button>'
       +     '<button class="mini-btn mini-edit" data-act="edit-student" data-id="'+st.id+'">✏️</button>'
       +     '<button class="mini-btn mini-del" data-act="del-student" data-id="'+st.id+'">🗑️</button>'
       +   '</div>'
       +   (L.subscription ? '<label class="paid-toggle"><input type="checkbox" data-act="paid" data-id="'+st.id+'"'+(st.paid?' checked':'')+'> دفع الاشتراك</label>' : '')
       + '</td>';

    sd.customFields.forEach(f => {
      b += '<td class="field-cell"><input type="text" class="field-input" data-act="field" data-id="'+st.id+'" data-fid="'+f.id+'" value="'+esc((st.fields||{})[f.id]||'')+'" placeholder="…"></td>';
    });

    L.sessions.forEach(s => {
      const rec = (L.records[st.id] && L.records[st.id][s.id]) || {};
      b += '<td><div class="cell-wrap">'
         + statusSelectHTML(st.id, s.id, rec.status || '')
         + dayNoteHTML(st.id, s.id, rec.note || '')
         + '</div></td>';
    });

    const note = (L.records[st.id] && L.records[st.id]['__note__']) || '';
    b += '<td><textarea class="note-input" data-act="note" data-id="'+st.id+'" placeholder="…">' + esc(note) + '</textarea></td></tr>';
  });

  if(students.length === 0){
    b = '<tr><td colspan="' + (L.sessions.length + 2 + sd.customFields.length) + '"><div class="empty-state">' + (fq ? 'لا نتائج مطابقة للبحث.' : 'لا يوجد أعضاء — اضغط «عضو جديد» لإضافة أول اسم.') + '</div></td></tr>';
  }
  let tf = '<tr class="count-row"><td class="sticky-col">حضور الحصة</td>';
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

  $('#statusLegend').innerHTML = sd.statuses.map(s =>
    '<span><span class="dot" style="background:'+esc(s.color)+'"></span>'+esc(s.label)+'</span>'
  ).join('');
}

function statusSelectHTML(studentId, sessionId, current){
  const sd = state.settings;
  let cls = 'status-select s-empty';
  if(current){
    if(current === 'st_done') cls = 'status-select s-done';
    else if(current === 'st_apology') cls = 'status-select s-apology';
    else if(current === 'st_noanswer') cls = 'status-select s-noanswer';
    else cls = 'status-select s-custom';
  }
  let opts = '<option value="">—</option>';
  sd.statuses.forEach(s => {
    opts += '<option value="'+esc(s.id)+'"' + (s.id===current?' selected':'') + '>'+esc(s.label)+'</option>';
  });
  return '<select class="'+cls+'" data-act="status" data-sid="'+studentId+'" data-ssid="'+sessionId+'">'+opts+'</select>';
}

function dayNoteHTML(studentId, sessionId, note){
  const has = note && note.trim();
  return '<button class="day-note-btn' + (has ? ' has-note' : '') + '" data-act="day-note" data-sid="'+studentId+'" data-ssid="'+sessionId+'" title="' + (has ? 'عرض/تعديل ملاحظة اليوم' : 'إضافة ملاحظة لهذا اليوم') + '">' + (has ? '💬 ملاحظة' : '📝 ملاحظة') + '</button>';
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
        + '<div class="m-meta">' + esc(buildMonthTitle(a.monthNumber)) + ' — ' + a.monthNumber + '/' + a.year + ' · ' + a.sessions.length + ' حصة</div>'
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
  const container = $('#archiveDetail');
  container.innerHTML =
    '<div class="detail-card">'
    + '<h3 style="margin-top:0">'+esc(a.lessonName)+' — '+esc(buildMonthTitle(a.monthNumber))+'</h3>'
    + '<p class="muted">'+a.monthNumber+'/'+a.year+' · '+a.sessions.length+' حصة · أُرشف في '+new Date(a.archivedAt).toLocaleString('ar-EG')+'</p>'
    + '<div class="detail-actions">'
    +   '<button class="btn" data-act="analytics" data-idx="'+idx+'">📊 التحليل والتقرير</button>'
    +   '<button class="btn btn-outline" data-act="csv" data-idx="'+idx+'">⬇️ Excel (CSV)</button>'
    +   '<button class="btn btn-outline" data-act="pdf" data-idx="'+idx+'">🖨️ PDF (A4)</button>'
    +   '<button class="btn btn-danger" data-act="del-archive" data-idx="'+idx+'">🗑️ حذف</button>'
    + '</div>'
    + archiveTableHTML(a)
    + '</div>';
  container.scrollIntoView({behavior:'smooth'});
}

function archiveTableHTML(a){
  const sd = state.settings;
  const students = archiveStudents(a);
  let h = '<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th class="sticky-col">'+esc(sd.studentLabel)+'</th>';
  sd.customFields.forEach(f => { h += '<th class="field-col">'+esc(f.label)+'</th>'; });
  a.sessions.forEach(s => {
    h += '<th>'+esc(s.label)+'<br><span class="week-date">'+esc(s.dateLabel||'')+'</span>' + (s.event ? '<br><span class="week-event">📝 '+esc(s.event)+'</span>' : '') + '</th>';
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
      const lbl = rec.status ? (sd.statuses.find(x=>x.id===rec.status)||{}).label || '' : '';
      h += '<td>'+esc(lbl||'—') + (rec.note ? '<div class="day-note-mini">'+esc(rec.note)+'</div>' : '') + '</td>';
    });
    const note = (a.records[sid] && a.records[sid]['__note__']) || '';
    h += '<td>'+esc(note)+'</td>';
    if(a.subscription) h += '<td>' + (st && st.paid ? '✓' : '✗') + '</td>';
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
  $('#set_appTitle').value = sd.appTitle;
  $('#set_monthTitle').value = sd.monthTitleTemplate;
  $('#set_studentLabel').value = sd.studentLabel;
  $('#set_notesLabel').value = sd.notesLabel;
  $('#set_whatsappNumber').value = sd.whatsappNumber;
  $('#set_whatsappType').value = sd.whatsappType;
  $('#set_messageTemplate').value = sd.messageTemplate;

  $('#customFieldsList').innerHTML = sd.customFields.map(f =>
    '<div class="status-edit-row">'
    + '<input type="text" value="'+esc(f.label)+'" data-act="field-label" data-id="'+f.id+'">'
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
}

/* ---------- الإشعارات والتذكيرات ---------- */
let notifTimers = [];
function notifSupported(){ return ('Notification' in window); }
function updateNotifStatus(){
  const el = $('#notifStatus');
  if(!el) return;
  if(!notifSupported()){
    el.textContent = '⚠️ الإشعارات غير مدعومة في هذا المتصفح.';
    return;
  }
  if(Notification.permission === 'granted'){
    el.textContent = '✅ الإشعارات مفعّلة — سيصلك تذكير قبل موعد كل حصة حسب الإعداد.';
  } else if(Notification.permission === 'denied'){
    el.textContent = '⛔ تم حظر الإشعارات من المتصفح. فعّلها من إعدادات الموقع.';
  } else {
    el.textContent = '🔕 الإشعارات غير مفعّلة بعد. اضغط «تفعيل الإشعارات».';
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
function maybeShowChangelog(next){
  let seen = 0;
  try{ seen = versionNum(localStorage.getItem('daftar_seen_version') || ''); }catch(e){}
  const current = versionNum(APP_VERSION);
  const isFirst = !seen;
  const entries = [];
  Object.keys(CHANGELOG)
    .filter(v => versionNum(v) > seen && versionNum(v) <= current)
    .sort((a,b) => versionNum(a) - versionNum(b))
    .forEach(v => { if(!isFirst || versionNum(v) === current) entries.push({ v: v, items: CHANGELOG[v] }); });
  if(entries.length === 0){ if(next) next(); return; }
  try{ localStorage.setItem('daftar_seen_version', APP_VERSION); }catch(e){}
  const html = entries.map(en =>
    '<div class="changelog-ver"><b>🆕 التحديث ' + esc(en.v) + '</b><ul>' + en.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>'
  ).join('');
  openModal('ما الجديد؟', html + '<div class="modal-actions"><button class="btn" id="cl_ok">تمام</button></div>');
  $('#cl_ok').onclick = () => { closeModal(); if(next) setTimeout(next, 400); };
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
  if(items.length){
    banner.hidden = false;
    banner.innerHTML = '<div class="tb-title">📅 جدول اليوم والتذكيرات</div>'
      + items.map(it => '<div class="tb-item"><span>'+esc(it.lesson)+(it.group?' — '+esc(it.group):'')+'</span><span class="tb-time">🕐 '+formatTime12(it.time)+'</span>'+(it.reminderMinutes?'<span class="muted">('+reminderLabel(it.reminderMinutes)+')</span>':'')+'</div>').join('');
    if(dot) dot.hidden = false;
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
      html += '<div class="np-item">'+esc(it.lesson)+(it.group?' — '+esc(it.group):'')+'<br><span class="np-time">🕐 '+formatTime12(it.time)+'</span>'+(it.reminderMinutes?' · '+reminderLabel(it.reminderMinutes):'')+'</div>';
    });
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
      const label = it.lesson + (it.group ? ' — ' + it.group : '');
      notifTimers.push(setTimeout(() => {
        notify('⏰ تذكير: ' + label, 'موعد الحصة اليوم الساعة ' + formatTime12(it.time));
        showReminderToast(label, it.time);
        renderToday();
      }, delay));
    }
  });
}

/* ---------- التحليل ---------- */
function computeStats(students, sessions, records){
  const sd = state.settings;
  return students.map(st => {
    const recs = records[st.id] || {};
    const counts = {};
    sd.statuses.forEach(s => counts[s.id] = 0);
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

function sortByAttendance(){
  const L = curLesson();
  if(!L) return;
  if(L.students.length < 2){ showToastMessage('لا يوجد عدد كافٍ من الطلاب للترتيب.'); return; }
  const pct = {};
  L.students.forEach(st => {
    const recs = L.records[st.id] || {};
    let done = 0;
    (L.sessions||[]).forEach(s => { if(recs[s.id] && recs[s.id].status === 'st_done') done++; });
    pct[st.id] = L.sessions.length ? (done / L.sessions.length * 100) : 0;
  });
  L.students.sort((a,b) => (pct[b.id]||0) - (pct[a.id]||0));
  saveState();
  renderLessonDetail();
  showToastMessage('📈 تم ترتيب الطلاب حسب نسبة الحضور (الأعلى أولاً).');
}

function showAnalytics(students, sessions, records, title){
  const rows = computeStats(students, sessions, records);
  const sd = state.settings;

  let body = '<div class="table-wrap"><table class="stats-table"><thead><tr><th>الطالب</th>';
  sd.statuses.forEach(s => body += '<th>'+esc(s.label)+'</th>');
  body += '<th>نسبة الحضور</th></tr></thead><tbody>';
  rows.forEach(r => {
    body += '<tr><td style="text-align:right;font-weight:700">'+esc(r.st.name)+'</td>';
    sd.statuses.forEach(s => body += '<td>'+(r.counts[s.id]||0)+'</td>');
    body += '<td><div class="bar" style="display:inline-block"><i style="width:'+r.pct+'%"></i></div> <b>'+r.pct+'%</b></td></tr>';
  });
  body += '</tbody></table></div>';

  openModal('📊 تحليل ' + title, body);
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.innerHTML =
    '<button class="btn btn-outline" id="analyticsCsv">⬇️ Excel (CSV)</button>'
    + '<button class="btn btn-outline" id="analyticsPdf">🖨️ PDF (A4)</button>'
    + '<button class="btn" id="analyticsClose">إغلاق</button>';
  $('#modalBody').appendChild(actions);

  $('#analyticsCsv').onclick = () => exportCSV(students, sessions, records, title);
  $('#analyticsPdf').onclick = () => printReport(students, sessions, records, title);
  $('#analyticsClose').onclick = closeModal;
}

/* ---------- التقرير الشامل عبر الشهور المؤرشفة ---------- */
function comprehensiveData(lesson){
  const months = state.archive
    .filter(a => a.lessonId === lesson.id)
    .sort((a,b) => (a.year - b.year) || (a.monthNumber - b.monthNumber));
  if(!months.length) return null;
  const studentMap = {};
  months.forEach(a => {
    archiveStudents(a).forEach(st => {
      if(!studentMap[st.id]) studentMap[st.id] = { id: st.id, name: st.name, phone: st.phone };
      else { if(st.name) studentMap[st.id].name = st.name; if(st.phone) studentMap[st.id].phone = st.phone; }
    });
  });
  const rows = Object.keys(studentMap).map(id => {
    const st = studentMap[id];
    const per = months.map(a => {
      const recs = (a.records && a.records[st.id]) || {};
      let done = 0;
      (a.sessions||[]).forEach(s => { if(recs[s.id] && recs[s.id].status === 'st_done') done++; });
      return { done: done, total: (a.sessions||[]).length };
    });
    const tot = per.reduce((acc,p) => ({ done: acc.done + p.done, total: acc.total + p.total }), { done:0, total:0 });
    const pct = tot.total ? Math.round(tot.done / tot.total * 100) : 0;
    return { st: st, per: per, tot: tot, pct: pct };
  });
  rows.sort((x,y) => y.pct - x.pct);
  return { months: months, rows: rows };
}

function showComprehensiveReport(lesson){
  const data = comprehensiveData(lesson);
  if(!data){ showToastMessage('لا توجد شهور مؤرشفة لهذا الدرس بعد.'); return; }
  const { months, rows } = data;
  let t = '<div class="table-wrap" style="max-height:52vh;overflow:auto"><table class="stats-table"><thead><tr><th class="sticky-col">الطالب</th>';
  months.forEach(a => t += '<th>شهر ' + a.monthNumber + '/' + a.year + '</th>');
  t += '<th>نسبة الحضور الكلية</th></tr></thead><tbody>';
  rows.forEach(r => {
    t += '<tr><td class="sticky-col" style="text-align:right;font-weight:700">' + esc(r.st.name) + '<br><span style="font-weight:400;color:#64748b">' + esc(r.st.phone) + '</span></td>';
    r.per.forEach(p => t += '<td>' + p.done + '/' + p.total + '</td>');
    t += '<td><b>' + r.pct + '%</b></td></tr>';
  });
  t += '</tbody></table></div>';
  openModal('📊 تقرير شامل — ' + esc(lesson.name), t);
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.innerHTML = '<button class="btn btn-outline" id="compCsv">⬇️ Excel (CSV)</button><button class="btn btn-outline" id="compPdf">🖨️ PDF (A4)</button><button class="btn" id="compClose">إغلاق</button>';
  $('#modalBody').appendChild(actions);
  $('#compCsv').onclick = () => exportComprehensiveCSV(lesson, data);
  $('#compPdf').onclick = () => printComprehensiveReport(lesson, data);
  $('#compClose').onclick = closeModal;
}

function exportComprehensiveCSV(lesson, data){
  const { months, rows } = data;
  const lines = [];
  const head = ['اسم الطالب (الرقم تحته)'];
  months.forEach(a => head.push('حضور ' + a.monthNumber + '/' + a.year));
  head.push('نسبة الحضور الكلية %');
  lines.push(head.join(','));
  rows.forEach(r => {
    const row = ['"' + String(r.st.name).replace(/"/g,'""') + '\n' + String(r.st.phone).replace(/"/g,'""') + '"'];
    r.per.forEach(p => row.push(p.done + '/' + p.total));
    row.push(r.pct);
    lines.push(row.join(','));
  });
  const safe = (lesson.name || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '');
  downloadBlob('\uFEFF' + lines.join('\r\n'), 'تقرير_شامل_' + safe + '_' + new Date().toISOString().slice(0,10) + '.csv', 'text/csv;charset=utf-8');
}

function printComprehensiveReport(lesson, data){
  const { months, rows } = data;
  $('#printPageRule').textContent = '@page{size:A4 landscape;margin:10mm}';
  let html = '<div class="report" dir="rtl">';
  html += '<div class="r-title">' + esc(APP_NAME) + '</div>';
  html += '<div class="r-sub">تقرير شامل — ' + esc(lesson.name) + ' — نسبة الحضور عبر ' + months.length + ' شهر مؤرشف</div>';
  html += '<table class="r-table"><thead><tr><th class="r-name">الطالب</th>';
  months.forEach(a => html += '<th>شهر ' + a.monthNumber + '/' + a.year + '</th>');
  html += '<th>النسبة الكلية</th></tr></thead><tbody>';
  rows.forEach(r => {
    html += '<tr><td class="r-name">' + esc(r.st.name) + '<br><span style="font-weight:400;font-size:9px">' + esc(r.st.phone) + '</span></td>';
    r.per.forEach(p => html += '<td>' + p.done + '/' + p.total + '</td>');
    html += '<td><b>' + r.pct + '%</b></td></tr>';
  });
  html += '</tbody></table>';
  html += '<div class="r-foot">عدد الشهور المؤرشفة: ' + months.length + ' · عدد الطلاب: ' + rows.length + '</div>';
  html += '</div>';
  $('#printArea').innerHTML = html;
  window.print();
  $('#printPageRule').textContent = '';
}

/* ---------- تصدير CSV ---------- */
function exportCSV(students, sessions, records, title){
  const sd = state.settings;
  const rows = computeStats(students, sessions, records);
  const lines = [];
  let head = ['اسم الطالب (الرقم تحته)'];
  sd.customFields.forEach(f => head.push(f.label));
  sessions.forEach(s => head.push(s.label + (s.dateLabel ? ' ('+s.dateLabel+')' : '') + (s.event ? ' ['+s.event+']' : '')));
  head.push(sd.notesLabel);
  sd.statuses.forEach(s => head.push(s.label));
  head.push('نسبة الحضور %');
  lines.push(head.join(','));

  rows.forEach(r => {
    const row = ['"' + String(r.st.name).replace(/"/g,'""') + '\n' + String(r.st.phone).replace(/"/g,'""') + '"'];
    sd.customFields.forEach(f => row.push('"' + String((r.st.fields && r.st.fields[f.id]) || '').replace(/"/g,'""') + '"'));
    sessions.forEach(s => {
      const rec = (records[r.st.id] && records[r.st.id][s.id]) || {};
      const lbl = rec.status ? (sd.statuses.find(x=>x.id===rec.status)||{}).label || '' : '';
      const cell = lbl + (rec.note ? ' (' + rec.note + ')' : '');
      row.push('"' + String(cell).replace(/"/g,'""') + '"');
    });
    const note = (records[r.st.id] && records[r.st.id]['__note__']) || '';
    row.push('"' + String(note).replace(/"/g,'""') + '"');
    sd.statuses.forEach(s => row.push(r.counts[s.id]||0));
    row.push(r.pct);
    lines.push(row.join(','));
  });

  const csv = '\uFEFF' + lines.join('\r\n');
  downloadBlob(csv, 'تقرير_' + (title||'حضور').replace(/[^\w\u0600-\u06FF ]/g,'') + '.csv', 'text/csv;charset=utf-8');
}

/* ---------- طباعة A4 ---------- */
function printReport(students, sessions, records, title){
  const rows = computeStats(students, sessions, records);
  const orientation = sessions.length > 6 ? 'landscape' : 'portrait';
  $('#printPageRule').textContent = '@page{size:A4 ' + orientation + ';margin:10mm}';
  $('#printArea').innerHTML = buildReportHTML(students, sessions, records, rows, title);
  window.print();
  $('#printPageRule').textContent = '';
}

function buildReportHTML(students, sessions, records, rows, title){
  const sd = state.settings;
  let html = '<div class="report" dir="rtl">';
  html += '<div class="r-title">' + esc(APP_NAME) + '</div>';
  html += '<div class="r-sub">' + esc(title) + '</div>';

  html += '<table class="r-table"><thead><tr><th class="r-name">'+esc(sd.studentLabel)+'</th>';
  sd.customFields.forEach(f => html += '<th>'+esc(f.label)+'</th>');
  sessions.forEach(s => html += '<th>'+esc(s.label)+'<br><span>'+esc(s.dateLabel||'')+'</span>' + (s.event ? '<br><span style="color:#b45309;font-size:9px">📝 '+esc(s.event)+'</span>' : '') + '</th>');
  html += '<th>'+esc(sd.notesLabel)+'</th></tr></thead><tbody>';
  students.forEach(st => {
    html += '<tr><td class="r-name">'+esc(st.name)+'<br><span style="font-weight:400;font-size:9px;color:#64748b">'+esc(st.phone)+'</span></td>';
    sd.customFields.forEach(f => html += '<td>'+esc((st.fields && st.fields[f.id]) || '')+'</td>');
    sessions.forEach(s => {
      const rec = (records[st.id] && records[st.id][s.id]) || {};
      const lbl = rec.status ? (sd.statuses.find(x=>x.id===rec.status)||{}).label || '' : '';
      html += '<td>'+esc(lbl||'—') + (rec.note ? '<br><span style="font-size:8px;color:#b45309">'+esc(rec.note)+'</span>' : '') + '</td>';
    });
    const note = (records[st.id] && records[st.id]['__note__']) || '';
    html += '<td>'+esc(note)+'</td></tr>';
  });
  html += '</tbody></table>';

  html += '<div class="r-section">تحليل الحضور</div>';
  html += '<table class="r-table"><thead><tr><th class="r-name">'+esc(sd.studentLabel)+'</th>';
  sd.statuses.forEach(s => html += '<th>'+esc(s.label)+'</th>');
  html += '<th>نسبة الحضور</th></tr></thead><tbody>';
  rows.forEach(r => {
    html += '<tr><td class="r-name">'+esc(r.st.name)+'</td>';
    sd.statuses.forEach(s => html += '<td>'+(r.counts[s.id]||0)+'</td>');
    html += '<td><b>'+r.pct+'%</b></td></tr>';
  });
  html += '</tbody></table>';

  html += '<div class="r-foot">إجمالي الحصص: ' + sessions.length + ' · عدد الطلاب: ' + students.length + '</div>';
  html += '</div>';
  return html;
}

function downloadBlob(content, filename, mime){
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
  const payload = { type: 'daftar-lesson', version: 6, lesson: JSON.parse(JSON.stringify(lesson)) };
  const safe = (lesson.name || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '').replace(/\s+/g, '_');
  const now = new Date();
  const stamp = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + '_' + String(now.getHours()).padStart(2,'0') + '-' + String(now.getMinutes()).padStart(2,'0');
  downloadBlob(JSON.stringify(payload, null, 2), 'درس_' + safe + '_شهر' + lesson.monthNumber + '_' + lesson.year + '_' + stamp + '.json', 'application/json');
}
function importLesson(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      const L = data && data.lesson;
      if(!L || typeof L !== 'object' || !L.name){ alert('ملف الدرس غير صالح.'); return; }
      const norm = normalizeState({ settings: state.settings, lessons: [L], archive: [] }).lessons[0];
      const existing = state.lessons.findIndex(x => x.id === L.id);
      if(existing >= 0){
        if(!window.confirm('يوجد درس بنفس المعرّف («'+L.name+'»). استبداله بمحتوى الملف؟')) return;
        state.lessons[existing] = norm;
      } else {
        state.lessons.push(norm);
      }
      saveState(); renderAll();
      alert('تم استيراد الدرس «'+L.name+'» بنجاح (دمج دون حذف بقية الدروس).');
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
    alert('تم إنشاء النسخة المشفّرة. احفظ كلمة المرور جيداً — لا يمكن الاسترجاع بدونها.');
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
    html = '✅ الحفظ التلقائي مفعّل — كل تغيير يُحفظ تلقائياً في الملف الذي اخترته.';
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
function weeklyMessage(){
  const sd = state.settings;
  const defType = (sd.whatsappType === 'business') ? 'business' : 'normal';
  const targets = [{ id:'', label:'📱 الرقم العام (' + sd.whatsappNumber + ')' }];
  state.lessons.forEach(L => {
    if(L.waGroup) targets.push({ id: L.id, label: '💬 ' + L.name });
    (L.groups||[]).forEach(g => {
      if(g.waGroup) targets.push({ id: 'group:' + L.id + ':' + g.id, label: '👥 ' + L.name + ' — ' + g.name });
    });
  });
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
    const tid = $('#msgTarget').value;
    const text = currentText();
    if(tid){
      if(tid.indexOf('group:') === 0){
        const parts = tid.split(':');
        const L = state.lessons.find(x => x.id === parts[1]);
        const g = L && (L.groups||[]).find(x => x.id === parts[2]);
        if(g && g.waGroup){
          if(/^https?:\/\//i.test(g.waGroup)) return { href: g.waGroup, isGroup: true, text };
          return { href: waHrefNumber(g.waGroup, text, currentType()), isGroup: false, text };
        }
      } else {
        const L = state.lessons.find(x => x.id === tid);
        if(L && L.waGroup){
          if(/^https?:\/\//i.test(L.waGroup)) return { href: L.waGroup, isGroup: true, text };
          return { href: waHrefNumber(L.waGroup, text, currentType()), isGroup: false, text };
        }
      }
    }
    return { href: waHrefNumber(sd.whatsappNumber, text, currentType()), isGroup: false, text };
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
        navigator.clipboard.writeText(t.text).then(() => showToastMessage('📋 تم نسخ الرسالة — افتح الجروب والصقها في صندوق الدردشة.')).catch(() => {});
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
function fallbackCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); alert('تم نسخ الرسالة.'); }catch(e){ alert('تعذّر النسخ التلقائي.'); }
  document.body.removeChild(ta);
}

/* ---------- حدث الحصة وملخص الحصة ---------- */
function editSessionEvent(session){
  openModal('📝 حدث في ' + (session.dateLabel || session.label),
    '<div class="form-row"><label>نوع الحدث (مثال: اختبار، مراجعة، نشاط)<input id="ev_name" type="text" value="'+esc(session.event||'')+'" placeholder="مثال: اختبار شهري"></label></div>'
    + '<div class="form-row"><label>تفاصيل إضافية (اختياري)<input id="ev_note" type="text" value="'+esc(session.eventNote||'')+'" placeholder="مثال: من 20 درجة"></label></div>'
    + '<div class="modal-actions"><button class="btn" id="ev_save">حفظ</button><button class="btn btn-outline" id="ev_clear">مسح الحدث</button><button class="btn btn-outline" id="ev_cancel">إلغاء</button></div>');
  $('#ev_save').onclick = () => {
    session.event = $('#ev_name').value.trim();
    session.eventNote = $('#ev_note').value.trim();
    saveState(); renderLessonDetail(); closeModal();
  };
  $('#ev_clear').onclick = () => { delete session.event; delete session.eventNote; saveState(); renderLessonDetail(); closeModal(); };
  $('#ev_cancel').onclick = closeModal;
}

function sessionSummary(lesson, session){
  const sd = state.settings;
  const groups = {};
  lesson.students.forEach(st => {
    const rec = (lesson.records[st.id] && lesson.records[st.id][session.id]) || {};
    const key = rec.status || '__none__';
    if(!groups[key]) groups[key] = [];
    groups[key].push(st.name);
  });
  const labelOf = (id) => { const st = sd.statuses.find(x => x.id === id); return st ? st.label : id; };
  const orderKeys = ['st_done','st_apology','st_noanswer'];
  const iconMap = { st_done:'✅ حاضر', st_apology:'😢 اعتذار', st_noanswer:'❌ لم يحضر' };
  let text = '📋 ملخص حصة: ' + session.label + (session.dateLabel ? ' (' + session.dateLabel + ')' : '') + '\n';
  text += '📍 ' + lesson.name + '\n';
  if(session.event) text += '📝 ' + session.event + (session.eventNote ? ' — ' + session.eventNote : '') + '\n';
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
  const sd = state.settings;
  const labelOf = (id) => { const st = sd.statuses.find(x => x.id === id); return st ? st.label : id; };
  const iconMap = { st_done:'✅ حضر', st_apology:'😢 اعتذار', st_noanswer:'❌ لم يحضر' };
  const months = [];
  if(includeAll){
    state.archive.filter(a => a.lessonId === lesson.id)
      .sort((a,b) => (a.year - b.year) || (a.monthNumber - b.monthNumber))
      .forEach(a => {
        months.push({ title: 'شهر ' + a.monthNumber + '/' + a.year, sessions: a.sessions, records: (a.records && a.records[student.id]) || {} });
      });
  }
  months.push({ title: 'شهر ' + lesson.monthNumber + '/' + lesson.year, sessions: lesson.sessions, records: (lesson.records && lesson.records[student.id]) || {} });
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
  openModal('📤 ملخص الطالب — ' + esc(student.name),
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
  if(editingGroups.length === 0) return '<p class="muted" style="margin:4px 0 0">لا توجد مجموعات — الدرس كله مجموعة واحدة.</p>';
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
function studentForm(lesson, student){
  const isEdit = !!student;
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

  openModal(isEdit ? 'تعديل عضو' : 'إضافة عضو جديد',
    '<div class="form-row"><label>الاسم<input id="f_name" type="text" value="'+esc(student?student.name:'')+'"></label></div>'
    + '<div class="form-row"><label>رقم الهاتف<input id="f_phone" type="text" value="'+esc(student?student.phone:'')+'" dir="ltr" placeholder="+20..."></label></div>'
    + groupSel
    + fieldInputs
    + '<div class="modal-actions"><button class="btn" id="f_save">حفظ</button><button class="btn btn-outline" id="f_cancel">إلغاء</button></div>');
  $('#f_save').onclick = () => {
    const nm = $('#f_name').value.trim();
    const ph = normalizePhone($('#f_phone').value);
    const grp = $('#f_group') ? $('#f_group').value : '';
    const fields = {};
    $$('#modalBody .f-field').forEach(inp => { fields[inp.dataset.fid] = inp.value; });
    if(!nm){ alert('اكتب الاسم.'); return; }
    const dup = lesson.students.some(x => x.id !== (student ? student.id : null) && normalizeForSearch(x.name) === normalizeForSearch(nm));
    if(dup){ alert('يوجد طالب بهذا الاسم بالفعل في هذا الدرس. (يمكن تكرار رقم الهاتف فقط).'); return; }
    if(isEdit){ student.name = nm; if(ph) student.phone = ph; student.groupId = grp; student.fields = fields; }
    else { lesson.students.push({ id: uid('s'), name: nm, phone: ph || '', paid: false, groupId: grp, fields }); }
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
    + '<div class="form-row"><label class="chk" style="width:auto;display:inline-flex"><input type="checkbox" id="l_sub"'+(subscription?' checked':'')+'> هذا الدرس باشتراك شهري (يظهر حالة الدفع وسعر الاشتراك)</label></div>'
    + '<div class="form-row"><label class="chk" style="width:auto;display:inline-flex"><input type="checkbox" id="l_headOnly"'+(remindHeadOnly?' checked':'')+'> التذكير برأس الدرس فقط (دون تفاصيل المجموعات)</label></div>'
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
      const L = { id: uid('L'), name: nm, schedule: days, subscription: isSub, price: pr, waGroup: wg, time: t, reminderMinutes: rem, remindHeadOnly: headOnly, groups: cleanGroups, students: [], monthNumber: m.monthNumber, year: m.year, sessions: [], records: {} };
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
  $('#addSessionBtn').onclick = () => { const L = curLesson(); if(L){ addSession(L); renderAll(); } };
  $('#regenSessionsBtn').onclick = () => { const L = curLesson(); if(L){ genSessions(L, true); renderAll(); } };
  $('#lessonReportBtn').onclick = () => { const L = curLesson(); if(L) showAnalytics(L.students, L.sessions, L.records, L.name + ' — ' + buildMonthTitle(L.monthNumber)); };
  $('#sortAttendanceBtn').onclick = () => sortByAttendance();
  $('#compReportBtn').onclick = () => { const L = curLesson(); if(L) showComprehensiveReport(L); };
  $('#changeMonthBtn').onclick = () => { const L = curLesson(); if(L) changeMonth(L); };
  $('#editLessonBtn').onclick = () => { const L = curLesson(); if(L) lessonForm(L); };
  $('#exportLessonBtn').onclick = () => { const L = curLesson(); if(L) exportLesson(L); };
  $('#archiveLessonBtn').onclick = () => { const L = curLesson(); if(L) archiveLessonMonth(L); };

  $('#weeklyMsgBtn').onclick = weeklyMessage;

  $('#enableNotifBtn').onclick = requestNotifications;
  $('#notifBtn').onclick = (e) => { e.stopPropagation(); const p = $('#notifPanel'); renderNotifPanel(); p.hidden = !p.hidden; };
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
  $('#moreActionsBtn').onclick = () => {
    const m = $('#moreActions');
    if(m) m.hidden = !m.hidden;
  };
  $('#exportBackupBtn').onclick = exportBackup;
  $('#importBackupBtn').onclick = () => $('#importFile').click();
  $('#importLessonBtn').onclick = () => $('#importLessonFile').click();
  $('#openFileBtn').onclick = openFromFile;
  $('#saveFileBtn').onclick = saveToFile;
  $('#encryptExportBtn').onclick = encryptExport;
  $('#encryptImportBtn').onclick = () => $('#encryptImportFile').click();
  $('#enableAutoSaveBtn').onclick = enableAutoSave;
  $('#disableAutoSaveBtn').onclick = disableAutoSave;
  $('#importFile').onchange = (e) => { if(e.target.files[0]) importBackup(e.target.files[0]); e.target.value=''; };
  $('#encryptImportFile').onchange = (e) => { if(e.target.files[0]) decryptImport(e.target.files[0]); e.target.value=''; };
  $('#importLessonFile').onchange = (e) => { if(e.target.files[0]) importLesson(e.target.files[0]); e.target.value=''; };

  [['set_appTitle','appTitle'],['set_monthTitle','monthTitleTemplate'],
   ['set_studentLabel','studentLabel'],['set_notesLabel','notesLabel'],
   ['set_whatsappNumber','whatsappNumber'],['set_messageTemplate','messageTemplate']].forEach(([id,key]) => {
    $('#'+id).addEventListener('change', (e) => {
      state.settings[key] = e.target.value;
      saveState(); renderHeader(); renderFooter(); renderLessonDetail();
    });
  });
  $('#set_whatsappType').addEventListener('change', (e) => {
    state.settings.whatsappType = e.target.value;
    saveState(); renderLessonDetail();
  });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if(!t) return;
    const act = t.dataset.act;
    const id = t.dataset.id;
    const idx = t.dataset.idx;
    const lessonId = t.dataset.lesson;

    if(act === 'open-lesson'){ currentLessonId = id; lessonFilterQuery = ''; groupFilterQuery = ''; $('#lessonSearch').value = ''; renderLessonDetail(); }
    else if(act === 'open-student'){
      currentLessonId = lessonId;
      const st = state.lessons.find(x=>x.id===lessonId)?.students.find(x=>x.id===id);
      lessonFilterQuery = st ? st.name : '';
      groupFilterQuery = '';
      $('#lessonSearch').value = lessonFilterQuery;
      renderLessonDetail();
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
      if(st && st.phone) openWhatsApp(st.phone, '', st.name);
    }
    else if(act === 'student-summary'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      if(L && st) studentSummary(L, st);
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
      const L = curLesson();
      const st = L && L.students.find(x => x.id === t.dataset.sid);
      const s = L && L.sessions.find(x => x.id === t.dataset.ssid);
      if(!st || !s) return;
      if(!L.records[st.id]) L.records[st.id] = {};
      const rec = L.records[st.id][s.id] || {};
      openModal('ملاحظة يوم ' + (s.dateLabel || s.label) + ' — ' + st.name,
        '<div class="form-row"><label>سبب الغياب / الملاحظة<textarea id="dn_text" rows="4" dir="rtl" placeholder="مثال: مريض / سفر / ظرف طارئ…">'+esc(rec.note||'')+'</textarea></label></div>'
        + '<div class="modal-actions"><button class="btn" id="dn_save">حفظ</button><button class="btn btn-outline" id="dn_clear">مسح</button><button class="btn btn-outline" id="dn_cancel">إلغاء</button></div>');
      $('#dn_save').onclick = () => {
        if(!L.records[st.id][s.id]) L.records[st.id][s.id] = {};
        L.records[st.id][s.id].note = $('#dn_text').value;
        saveState(); renderLessonDetail(); closeModal();
      };
      $('#dn_clear').onclick = () => {
        if(L.records[st.id] && L.records[st.id][s.id]) L.records[st.id][s.id].note = '';
        saveState(); renderLessonDetail(); closeModal();
      };
      $('#dn_cancel').onclick = closeModal;
    }
    else if(act === 'edit-session-event'){
      const L = curLesson();
      const s = L && L.sessions.find(x => x.id === id);
      if(s) editSessionEvent(s);
    }
    else if(act === 'session-summary'){
      const L = curLesson();
      const s = L && L.sessions.find(x => x.id === id);
      if(L && s) sessionSummary(L, s);
    }
    else if(act === 'edit-session-date'){
      const L = curLesson();
      const s = L && L.sessions.find(x => x.id === id);
      if(!s) return;
      const val = prompt('تاريخ الحصة (صيغة YYYY-MM-DD):', s.date || '');
      if(val === null) return;
      s.date = val.trim();
      const d = new Date(val.trim());
      s.dateLabel = isNaN(d) ? s.date : formatDate(d);
      saveState(); renderLessonDetail();
    }
    else if(act === 'del-session'){
      const L = curLesson();
      const s = L && L.sessions.find(x => x.id === id);
      if(s && window.confirm('حذف «'+s.label+'» وكل تسجيلاته؟')){
        L.sessions = L.sessions.filter(x => x.id !== id);
        Object.keys(L.records).forEach(k => delete L.records[k][id]);
        L.sessions.forEach((x,i) => x.label = 'حصة ' + (i+1));
        saveState(); renderAll();
      }
    }
    else if(act === 'open-archive'){ renderArchiveDetail(parseInt(idx,10)); }
    else if(act === 'analytics'){
      const a = state.archive[parseInt(idx,10)];
      showAnalytics(archiveStudents(a), a.sessions, a.records, a.lessonName + ' — ' + buildMonthTitle(a.monthNumber));
    }
    else if(act === 'csv'){
      const a = state.archive[parseInt(idx,10)];
      exportCSV(archiveStudents(a), a.sessions, a.records, a.lessonName);
    }
    else if(act === 'pdf'){
      const a = state.archive[parseInt(idx,10)];
      printReport(archiveStudents(a), a.sessions, a.records, a.lessonName + ' — ' + buildMonthTitle(a.monthNumber));
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
    if(t.matches('[data-act="status-label"], [data-act="status-color"], [data-act="field-label"]')){
      if(t.dataset.act === 'status-label'){
        const s = state.settings.statuses.find(x => x.id === t.dataset.id);
        if(s){ s.label = t.value; saveState(); renderLessonDetail(); renderArchive(); }
      } else if(t.dataset.act === 'status-color'){
        const s = state.settings.statuses.find(x => x.id === t.dataset.id);
        if(s){ s.color = t.value; saveState(); renderLessonDetail(); }
      } else if(t.dataset.act === 'field-label'){
        const f = state.settings.customFields.find(x => x.id === t.dataset.id);
        if(f){ f.label = t.value; saveState(); renderLessonDetail(); }
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
      const L = curLesson();
      if(!L) return;
      const sid = st.dataset.sid, ssid = st.dataset.ssid;
      if(!L.records[sid]) L.records[sid] = {};
      if(!L.records[sid][ssid]) L.records[sid][ssid] = {};
      L.records[sid][ssid].status = st.value;
      saveState();
      updateStatusCellUI(st);
      updateSessionCounterUI(ssid);
    }
    else if(e.target.matches('[data-act="paid"]')){
      const L = curLesson();
      if(!L) return;
      const st = L.students.find(x => x.id === e.target.dataset.id);
      if(st){ st.paid = e.target.checked; saveState(); renderLessonDetail(); }
    }
    else if(e.target.matches('[data-act="note"]')){
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
  /* الماوس — سحب وإفلات أصلي */
  document.addEventListener('dragstart', (e) => {
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
    $$('tr.student-row').forEach(r => r.classList.remove('dragging','drop-target'));
    dragState.dragId = null;
  });
  document.addEventListener('dragover', (e) => {
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

  /* اللمس — ضغطة مطوّلة ثم سحب */
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

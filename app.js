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

/* ---------- حماية الذاكرة من المسح التلقائي على الهواتف (Persistent Storage) ---------- */
try {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(persistent => {
      if (persistent) console.log('Daftar persistent storage is granted.');
    }).catch(() => {});
  }
} catch (e) {}

/* ==================== محرك الأيقونات السادة (Modern Clean SVG Icons) ==================== */
const ICONS = {
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
  archive: '<rect x="2" y="4" width="20" height="5" rx="2"></rect><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"></path><path d="M10 13h4"></path>',
  settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"></line>',
  search: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
  x: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
  check: '<polyline points="20 6 9 17 4 12"></polyline>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
  trash: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>',
  share: '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  'user-x': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
  whatsapp: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>',
  send: '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>',
  qr: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="3" height="3"></rect><rect x="18" y="18" width="3" height="3"></rect><rect x="14" y="18" width="3" height="3"></rect><rect x="18" y="14" width="3" height="3"></rect>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
  unlock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v14a2 2 0 0 0 2 2h14v-4"></path><rect x="16" y="12" width="6" height="6" rx="1"></rect>',
  alert: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>',
  refresh: '<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
  'eye-off': '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>',
  'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
  'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>',
  'chevron-down': '<polyline points="6 9 12 15 18 9"></polyline>',
  'chevron-right': '<polyline points="9 18 15 12 9 6"></polyline>',
  'chevron-left': '<polyline points="15 18 9 12 15 6"></polyline>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line>',
  clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
  'check-square': '<polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>',
  info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
  bot: '<rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8.01" y2="16"></line><line x1="16" y1="16" x2="16.01" y2="16"></line>',
  key: '<path d="M21 2l-2 2m-1.5 1.5L16 7l-1.5-1.5-3.5 3.5a5 5 0 1 0 2 2l3.5-3.5L15 6l1.5-1.5 2 2 2.5-2.5z"></path>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
  smartphone: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>',
  'bar-chart-2': '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>',
  'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>',
  'dollar-sign': '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
  clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>',
  'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
  'alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
  'share-2': '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>',
  'message-circle': '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>',
  'edit-2': '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>',
  'x-circle': '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
};

function formatTitleWithIcon(title){
  if(!title) return '';
  let t = String(title).trim();
  const iconMap = [
    { prefix: '➕', icon: 'plus' },
    { prefix: '🔒', icon: 'lock' },
    { prefix: '🔓', icon: 'unlock' },
    { prefix: '🔑', icon: 'key' },
    { prefix: '📱', icon: 'smartphone' },
    { prefix: '📊', icon: 'bar-chart-2' },
    { prefix: '📈', icon: 'trending-up' },
    { prefix: '🚫', icon: 'user-x' },
    { prefix: '⚡', icon: 'zap' },
    { prefix: '✨', icon: 'zap' },
    { prefix: '👥', icon: 'users' },
    { prefix: '📝', icon: 'edit' },
    { prefix: '✏️', icon: 'edit-2' },
    { prefix: '⚙️', icon: 'settings' },
    { prefix: '🏷️', icon: 'tag' },
    { prefix: '📦', icon: 'archive' },
    { prefix: '📥', icon: 'download' },
    { prefix: '📤', icon: 'share-2' },
    { prefix: '⬇️', icon: 'download' },
    { prefix: '🤖', icon: 'bot' },
    { prefix: '🛡️', icon: 'shield' },
    { prefix: '💬', icon: 'message-circle' },
    { prefix: 'ℹ️', icon: 'info' },
    { prefix: '⚠️', icon: 'alert' },
    { prefix: '🗑️', icon: 'trash' },
    { prefix: '📷', icon: 'camera' },
    { prefix: '🔄', icon: 'refresh' },
    { prefix: '📋', icon: 'clipboard' },
    { prefix: '🔍', icon: 'search' },
    { prefix: '💰', icon: 'dollar-sign' },
    { prefix: '📅', icon: 'calendar' },
    { prefix: '🕒', icon: 'clock' },
    { prefix: '📞', icon: 'phone' },
    { prefix: '👤', icon: 'user' },
    { prefix: '🗓️', icon: 'calendar' },
    { prefix: '🔑', icon: 'key' },
    { prefix: '🚀', icon: 'send' },
    { prefix: '📊', icon: 'bar-chart-2' },
    { prefix: '🔔', icon: 'bell' },
    { prefix: '💡', icon: 'info' },
    { prefix: '✅', icon: 'check-circle' },
    { prefix: '🎉', icon: 'check-circle' },
    { prefix: '🖨️', icon: 'printer' }
  ];
  for(const item of iconMap){
    if(t.startsWith(item.prefix)){
      return appIcon(item.icon, 18, 'modal-title-icon') + ' <span>' + t.slice(item.prefix.length).trim() + '</span>';
    }
  }
  return '<span>' + t + '</span>';
}

function appIcon(name, size = 15, extraClass = '') {
  const content = ICONS[name] || ICONS['info'];
  const cls = 'app-icon' + (extraClass ? ' ' + extraClass : '');
  return '<svg class="' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + content + '</svg>';
}
if (typeof window !== 'undefined') {
  window.appIcon = appIcon;
}

/* ---------- أدوات مساعدة ---------- */

/* ---------- تجزئة الجداول الكبيرة (Pagination for 1000+ Students) ---------- */
let tablePageSize = 50;
let lessonCurrentPage = 1;
let archiveCurrentPage = 1;
let examsCurrentPage = 1;
let archExamsCurrentPage = 1;

function renderPaginationBarHTML(currentPage, totalPages, totalCount, pageSize, prefixId){
  if(totalCount <= 25) return '';
  const startIdx = (pageSize > 0 && totalCount > 0) ? (currentPage - 1) * pageSize + 1 : (totalCount > 0 ? 1 : 0);
  const endIdx = (pageSize > 0 && totalCount > 0) ? Math.min(totalCount, currentPage * pageSize) : totalCount;

  let pageOptions = '';
  if(totalPages > 1){
    for(let p = 1; p <= totalPages; p++){
      pageOptions += '<option value="' + p + '"' + (p === currentPage ? ' selected' : '') + '>صفحة ' + p + ' من ' + totalPages + '</option>';
    }
  }

  const currentSizeVal = (pageSize > 0) ? pageSize : totalCount;

  return '<div class="pagination-bar" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--card-bg,#f8fafc);border:1px solid var(--border);border-radius:8px;margin:8px 0;flex-wrap:wrap;gap:8px;direction:rtl">'
    + '<div style="font-size:12px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px">'
    +   appIcon('file-text', 13) + ' عرض <b>' + (totalCount ? startIdx + ' - ' + endIdx : 0) + '</b> من إجمالي <span class="badge-count" style="background:#e0e7ff;color:#3730a3;padding:2px 7px;border-radius:999px;font-weight:800">' + totalCount + ' طالب</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    +   '<div style="display:flex;align-items:center;gap:5px">'
    +     '<label style="font-size:11.5px;font-weight:700">عدد الصفوف:</label>'
    +     '<select class="page-size-select" data-prefix="' + prefixId + '" style="padding:4px 8px;font-size:11.5px;font-weight:700;border-radius:6px;border:1px solid var(--border);background:#fff;cursor:pointer">'
    +       '<option value="25"' + (pageSize === 25 ? ' selected' : '') + '>25 طالب</option>'
    +       '<option value="50"' + (pageSize === 50 ? ' selected' : '') + '>50 طالب</option>'
    +       '<option value="100"' + (pageSize === 100 ? ' selected' : '') + '>100 طالب</option>'
    +       '<option value="200"' + (pageSize === 200 ? ' selected' : '') + '>200 طالب</option>'
    +       '<option value="0"' + (pageSize === 0 ? ' selected' : '') + '>عرض الكل (' + totalCount + ')</option>'
    +     '</select>'
    +     '<span style="font-size:11px;color:var(--muted)">أو مخصص:</span>'
    +     '<input type="number" class="page-size-custom-input" data-prefix="' + prefixId + '" min="1" max="' + totalCount + '" value="' + currentSizeVal + '" style="width:65px;padding:3px 6px;text-align:center;font-weight:700;border:1px solid var(--border);border-radius:6px;font-size:11.5px" title="اكتب عدد الطلاب واضغط Enter">'
    +     '<span style="font-size:11px;font-weight:700">طالب</span>'
    +   '</div>'
    +   (totalPages > 1 ? '<div style="display:flex;align-items:center;gap:4px">'
    +     '<button class="btn btn-outline btn-sm page-nav-btn" data-prefix="' + prefixId + '" data-dir="prev" ' + (currentPage <= 1 ? 'disabled' : '') + ' style="padding:3px 10px;font-size:12px;font-weight:700" title="الصفحة السابقة">' + appIcon('chevron-right', 12) + ' السابق</button>'
    +     '<select class="page-jump-select" data-prefix="' + prefixId + '" style="padding:3px 8px;font-size:11.5px;font-weight:700;border-radius:6px;border:1px solid var(--border);background:#fff;cursor:pointer">' + pageOptions + '</select>'
    +     '<button class="btn btn-outline btn-sm page-nav-btn" data-prefix="' + prefixId + '" data-dir="next" ' + (currentPage >= totalPages ? 'disabled' : '') + ' style="padding:3px 10px;font-size:12px;font-weight:700" title="الصفحة التالية">التالي ' + appIcon('chevron-left', 12) + '</button>'
    +   '</div>' : '')
    + '</div>'
    + '</div>';
}

function downloadReportPrintableHTML(title, innerReportHTML){
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Cairo', system-ui, -apple-system, sans-serif; margin: 0; padding: 12px; direction: rtl; background: #fff; color: #0f172a; }
    .report { width: 100%; max-width: 900px; margin: 0 auto; }
    .r-title { font-size: 16px; font-weight: 900; text-align: center; color: #2E3A87; margin-bottom: 4px; }
    .r-sub { font-size: 13px; font-weight: 700; text-align: center; color: #475569; margin-bottom: 12px; }
    .r-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 12px; }
    .r-table th, .r-table td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: center; }
    .r-table th { background: #f1f5f9; font-weight: 800; }
    .r-table .r-name { text-align: right; font-weight: 700; }
    .r-table .ord-col { width: 30px; font-weight: 800; background: #fef08a; }
    .r-section { font-size: 12px; font-weight: 800; margin: 10px 0 4px; color: #2E3A87; }
    .r-foot { font-size: 11px; text-align: center; color: #64748b; margin-top: 8px; }
    @media print { body { padding: 0; } }
  `;
  const doc = '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="UTF-8">\n<title>' + esc(title) + '</title>\n<style>' + css + '</style>\n</head>\n<body>\n' + innerReportHTML + '\n</body>\n</html>';
  const safe = (title || 'تقرير').replace(/[^\w\u0600-\u06FF ]/g, '');
  downloadBlob(doc, 'تقرير_' + safe + '.html', 'text/html;charset=utf-8');
}


/* ---------- دوال فحص وتحديد نوع الحالة (حاضر / اعتذار / غائب) ---------- */

function hexToRgba(hex, alpha){
  if(!hex || typeof hex !== 'string') return hex;
  let c = hex.replace('#', '').trim();
  if(c.length === 3) c = c.split('').map(x => x + x).join('');
  if(c.length !== 6) return hex;
  const num = parseInt(c, 16);
  if(isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function isPresentStatus(statusId, statuses){
  if(!statusId) return false;
  const list = statuses || (typeof state !== 'undefined' && state.settings && state.settings.statuses) || [];
  const s = list.find(x => x.id === statusId);
  if(s){
    if(s.type === 'present') return true;
    if(s.type === 'apology' || s.type === 'absent') return false;
  }
  return statusId === 'st_done';
}

function isApologyStatus(statusId, statuses){
  if(!statusId) return false;
  const list = statuses || (typeof state !== 'undefined' && state.settings && state.settings.statuses) || [];
  const s = list.find(x => x.id === statusId);
  if(s){
    if(s.type === 'apology') return true;
    if(s.type === 'present' || s.type === 'absent') return false;
  }
  return statusId === 'st_apology';
}

function isAbsentStatus(statusId, statuses){
  if(!statusId) return false;
  return !isPresentStatus(statusId, statuses);
}

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
const APP_VERSION = 'v41';
const CHANGELOG = {
  v41: [
    '🔢 كتابة عدد صفوف الصفحة يدوياً: إمكانية كتابة أي رقم مخصص لعدد الطلاب المعروضين في الصفحة الواحدة في الدروس التي تزيد عن 25 طالباً',
    '📊 تقارير مخصصة لطلاب محددين (شهري وشامل): خيارات فلترة ذكية لإنشاء وتصدير تقرير الشهر والتقرير الشامل للحاضرين فقط أو اختيار وتحديد طلاب معينين بالاسم (PDF / Excel) في الدروس والشهور المؤرشفة',
    '🚫 حجب الطلاب المنقطعين عن الحضور: إمكانية حجب وإخفاء الطلاب الذين انقطعوا أو لم يحضروا لفترات طويلة عبر الشهور الماضية، لعزلهم عن المراسلة الجماعية والجداول، مع زر إدارة واستعادة مخصص',
    '🔄 دمج ومشاركة الحضور بالكاميرا والملفات: إصلاح شامل وتام لمسح كود QR بكاميرا الهاتف الآخر والتقاطه فورياً، مع دعم استيراد ومشاركة ملفات الحضور (.daftar-att) والإضافة التلقائية للطلاب الجدد بنظام الحاضر يغلب',
    '🔍 بحث شامل وموحد في الدروس والشهور المؤرشفة: شريط البحث الرئيسي في الواجهة أصبح يبحث تلقائياً في كافة الشهور المؤرشفة والدروس الحالية مع تمييز الشهور برابط انتقال مباشر للأرشيف'
  ],
  v40: [
    '📄 عرض الجداول الضخمة عبر التجزئة والتنقل بالصفحات: دعم كامل لأكثر من 1000 طالب مع تجزئة ذكية (25 / 50 / 100 / 200 / عرض الكل) في جداول الحضور والاختبارات الحالية والمؤرشفة وسلاسة تامة بالـ DOM',
    '🏷️ تخصيص حالات وأزرار الحضور لكل درس: إمكانية إضافة وتعديل حالات حضور مخصصة لكل درس وتحديد نوع ومعنى كل حالة (حاضر / غائب / اعتذار) لاحتسابها تلقائياً وبدقة في نسب الحضور والإحصائيات والتحضير السريع (⚡) وكافة التقارير',
    '📦 أرشفة درجات واختبارات الشهر تلقائياً: عند الضغط على زر «أرشفة وإنهاء الشهر» يتم نقل كافة الاختبارات والدرجات والملاحظات ومجموعات الاختبار وحفظها داخل الشهر المؤرشف وتصفيرها للشهر الجديد',
    '⚡ التحضير السريع الجماعي في الشهور المؤرشفة: إضافة زر (⚡) في عناوين حصص الأرشيف لتحضير أو تغييب أو تسجيل اعتذار لجميع الطلاب بنقرة واحدة',
    '📥 دعم استيراد الشهور المصدرة عبر تيليجرام: إمكانية استيراد ملفات الشهور الفردية المصدرة من بوت تيليجرام وفتحها في الأرشيف مباشرة دون أي أخطاء',
    '📝 سلاسة كتابة الملاحظات: تسريع ومنع أي تعليق أو بطء عند كتابة الملاحظات في عمود ملاحظات الطالب داخل الشهور المؤرشفة',
    '⬇️ إصلاح زر تصدير الشهر: تفعيل زر تصدير أي شهر مؤرشف لوحده كملف مستقل (.daftar-month)',
    '➕ إصلاح زر إضافة اختبار جديد في الشهور المؤرشفة ورصد درجاته',
    '🔔 ضبط إشعار التحديثات لعدم التكرار عند فتح التطبيق مع الاحتفاظ بفتحه من الإشعارات',
    '🔍 البحث اللحظي الفوري داخل الشهور المؤرشفة'
  ],
  v39: [
    '🔍 إصلاح شريط البحث السريع عن أسماء الطلاب داخل الشهور المؤرشفة (بالاسم أو الهاتف أو رقم الترتيب #)',
    '📈 إصلاح ترتيب الطلاب حسب الحضور وزر حذف الطالب داخل الشهر المؤرشف مع العزل التام',
    '🗑️ إصلاح زر حذف الشهر من الأرشيف وزر استعادة الشهر للرئيسية بسلاسة تامة',
    '📤 إصلاح ملخص الطالب ومشاركته عبر واتساب من داخل الشهور المؤرشفة',
    '✏️ إصلاح تعديل بيانات وبطاقة الطالب داخل الشهر المؤرشف',
    '🏷️ تصفير مجموعات الاختبار تلقائياً عند إنشاء شهر مؤرشف قديم ليكون مستقلاً تماماً',
    '📱 إغلاق القوائم المنسدلة تلقائياً بمجرد النقر على أي عنصر داخلها لمنع تغطيتها للنوافذ',
    '📊 تحسين تجربة وتجاوب جداول التقارير الشاملة وفلاتر التواريخ على شاشات الهواتف',
    '🚀 إمكانية تصدير أي شهر مؤرشف بشكل منفرد إلى تيليجرام عبر البوت',
    '🔔 تصميم مدمج وخفيف لشريط الإشعارات المؤقتة مع زر إغلاق فوري (✕)',
    '📝 إصلاح حفظ ملاحظات الحصص اليومية للطلاب داخل الشهور المؤرشفة'
  ],
  v38: [
    '📤 تصدير واستيراد شهر مؤرشف منفرد: إمكانية تصدير أي شهر مؤرشف لوحده كملف مستقل (.daftar-month) واستيراده في أي حساب دون التأثير على باقي الشهور',
    '☑️ نقل ونسخ الطلاب بالتحديد المتعدد من وإلى الأرشيف: دعم نقل أو نسخ الطلاب بين الدروس الحالية والشهور المؤرشفة بسلاسة تامة مع تخطي التكرار',
    '🛡️ عزل تام لحذف الطلاب في الأرشيف: حذف الطالب من شهر مؤرشف قديم لا يؤثر نهائياً على وجوده في الشهور التالية أو الشهر الحالي',
    '📈 ترتيب وخواص الشهر المؤرشف بالكامل: إتاحة كافة أزرار وخواص وإدارة الشهر العادي داخل الشهر المؤرشف (ترتيب حسب الحضور، سحب يدوي، تحريك ▲/▼، كتابة رقم الترتيب #، وتعديل الحصص)',
    '📱 دعم مثالي لزر الرجوع وإيماءات سحب الهاتف: إغلاق النوافذ والقوائم المفتوحة أولاً ثم الرجوع للرئيسية وحماية الخروج بضغطة مزدوجة'
  ],
  v37: [
    '📥 تنزيل وحفظ التقارير كملف PDF جاهز للطباعة والمطبعة: إمكانية حفظ أي تقرير (حضور، اختبارات، شامل، ورقة حضور) كملف PDF على جهازك لإرساله للمطبعة، مع توجيه ذكي يرشد المعلم لاختيار «حفظ بتنسيق PDF» وزر مخصص لتنزيل نسخة ويب جاهزة للمطبعة بصيغة HTML',
    '🗂️ تقسيم المجاميع عبر كافة التقارير والرسائل: خيار تفاعلي للاختيار بين مجموعات الدرس ومجموعات الاختبار في تقارير الاختبارات والتقرير الشامل، وتقسيم منسق بالمجموعات في رسائل واتساب لتقرير الشهر وتقرير الاختبارات',
    '📚 تصفية وتنظيم الأرشيف حسب الدرس وترتيبه زمنياً: شريط تبويبات أعلى الأرشيف لتصفية شهور كل درس على حدة، مع ترتيب زمني تلقائي (الأحدث أولاً) وأزرار تحريك يدوي',
    '⚡ إصلاح شامل لربط الأحداث واستقرار الأرشيف: إصلاح القوائم المنسدلة في الأرشيف، واستقرار شاشة الشهر المؤرشف عند تعديل بيانات الطالب دون اختفاء، وتأكيد الحذف الآمن'
  ],
  v36: [
    '📦 إضافة شهور قديمة للأرشيف: إمكانية تسجيل وتوثيق شهور قديمة ماضية لأي درس في الأرشيف دون المساس بالدرس الحالي مع التوليد التلقائي لحصصها',
    '🔄 نقل ونسخ الطلاب للأرشيف: دعم نقل أو نسخ الطلاب وسجلات الحضور من وإلى أي شهر مؤرشف عبر التحديد المتعدد',
    '👤 مزامنة بيانات الطالب: تحديث بيانات الطالب (الاسم/الهاتف/العنوان...) تلقائياً في الشهر الحالي وبقية الشهور عند تعديلها في أي شهر مؤرشف',
    '📑 طباعة وتصدير المجاميع مقسمة بملف واحد (PDF و Excel): خيار لتصدير أو طباعة ورقة واحدة تضم كافة الطلاب مرتبين ومقسمين تحت عنوان كل مجموعة لمجاميع الحضور ومجاميع الاختبارات',
    '⚡ بحث لحظي فائق السرعة: تصفية فورية بالاسم ورقم الترتيب والهاتف مع زر مسح سريع ✕ دون أي تعليق على الأجهزة القوية',
    '🏛️ شاشة شهر مؤرشف متكاملة: تحويل الشهر المؤرشف لبيئة عمل كاملة (تبويبات حضور واختبارات، بحث لحظي، شريط تقارير وإدارة كامل، إضافة طلاب وتعديل درجات) دون الحاجة لاستعادته',
    '📱 دعم زر الرجوع وسحب الشاشة بالهاتف: إغلاق النوافذ والرجوع للقائمة ومنع الخروج المفاجئ إلا بضغطة رجوع مزدوجة'
  ],
  v35: [
    '⚡ وضع الأداء القياسي (Lite Mode): مفتاح سويتش في الإعدادات لتخفيف التعليق والبطء فورياً على الهواتف محدودة الأداء عبر إلغاء الرسوم والظلال والشفافيات وتسريع التمرير',
    '📨 تقرير درجات الاختبار كرسالة (واتساب / نسخ): إرسال نتائج الاختبارات للطلاب الحاضرين فقط واستبعاد غير المشاركين، مع خيار إرسال كل اختبارات الشهر أو اختبار محدد',
    '👤 اسم المُصدّر لتيليجرام: إظهار اسم المعلم/المُرسل في رسالة البوت بتيليجرام لتمييز من قام برفع النسخة عند تناوب أكثر من معلم',
    '🛡️ إصلاح استيراد وتصدير الدروس وحجب البوتات: حل مشكلة "ملف الدرس غير صالح"، وإتاحة استيراد واختيار أي درس مدمج من أي ملف، وحجب بيانات وتوكنات البوتات عن النسخ المصدّرة تماماً',
    '👥 مجموعات مستقلة لقسم الاختبارات + طباعة وتصدير للمجاميع: تقسيم مجاميع داخل قسم الاختبارات وتصفيتها وطباعتها وتصديرها لـ Excel مع إبراز اسم المجموعة، ودعم طباعة وتصدير مجاميع الدرس الأساسية'
  ],
  v34: [
    '🚫 استبعاد وإخفاء الطلاب من قسم الاختبارات: إمكانية إخفاء أي طالب لا يشارك في الاختبارات تماماً من جدول الاختبارات حتى لا يشغل مساحة، مع زر إدارة واستعادة للطلاب المستبعدين في أي وقت دون المساس بسجلات الحضور',
    '📊 التقرير الشامل التفاعلي مع درجات الاختبارات: شريط تبديل ثلاثي (نسب الحضور / درجات الاختبارات / عرض مدمج) لعرض وتحليل أداء الطلاب في الشهور السابقة والحالية مع دعم التصدير',
    '📄 تصدير تقرير الاختبارات المنفرد (PDF و Excel): أزرار مخصصة لطباعة وتصدير درجات الاختبارات والملاحظات كتقرير مستقل تماماً أو مدمج مع تقرير الشهر'
  ],
  v33: [
    '🤖 إدارة بوتات تيليجرام المتعددة: حفظ قائمة بالبوتات والمحادثات بالأسماء مع إمكانية التبديل السريع وتحديد الوجهة مباشرة من نافذة الإرسال',
    '📝 ملاحظات الاختبارات واستبعاد الطلاب: تدوين ملاحظات تفصيلية لكل طالب في كل اختبار مع خيار استبعاد الطالب (لم يدخل الاختبار 🚫) من حساب المتوسط وتوثيقه',
    '⚡ تسريع التطبيق وتخفيف التعليق على الهواتف: تصفية فورية بالـ DOM أثناء البحث دون إعادة بناء الجداول، وتحديث الخلايا موضعياً، وحفظ تلقائي ذكي آمن 100%',
    '📊 درجات الاختبارات في التقارير والرسائل: قسم وجدول منسق لنتائج الاختبارات في تقرير الشهر المطبوع (PDF)، وبند مفصل في رسالة الواتساب، ومتوسط الاختبارات بالشامل، ومتغير {exams} بالأسبوعية',
    '🛡️ نوافذ تأكيد الحذف المخصصة والآمنة: نافذة تحذيرية موحدة وأنيقة توضح تفاصيل وعواقب الحذف قبل حذف أي طالب أو حصة أو درس أو شهر أو اختبار أو مدفوعات',
    '📱 إصلاح وتجاوب التقرير الشامل وبطاقات المراسلة على الهواتف'
  ],
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
    { id:'st_done',     label:'تم',          color:'#15803d', type:'present' },
    { id:'st_apology',  label:'اعتذار',       color:'#b45309', type:'apology' },
    { id:'st_noanswer', label:'لم يتم الرد',   color:'#dc2626', type:'absent' }
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
      liteMode: false,
      lastTgExporter: '',
      tgBotToken: '',
      tgChatId: '',
      tgBots: [],
      activeTgBotId: '',
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
    examGroupId: typeof st.examGroupId === 'string' ? st.examGroupId : '',
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
  settings.liteMode = !!settings.liteMode;
  settings.lastTgExporter = typeof settings.lastTgExporter === 'string' ? settings.lastTgExporter : '';
  settings.tgBotToken = (raw.settings && typeof raw.settings.tgBotToken === 'string') ? raw.settings.tgBotToken : '';
  settings.tgChatId = (raw.settings && typeof raw.settings.tgChatId === 'string') ? raw.settings.tgChatId : '';

  /* إدارة بوتات ومحادثات تيليجرام المتعددة */
  if(!Array.isArray(settings.tgBots)) settings.tgBots = [];
  settings.tgBots = settings.tgBots.map(b => ({
    id: b.id || uid('bot'),
    name: (b.name || 'بوت تيليجرام').trim(),
    token: (b.token || '').trim(),
    chatId: (b.chatId || '').trim()
  })).filter(b => b.token || b.chatId);

  // ترحيل القيم القديمة تلقائياً إن كانت قائمة البوتات فارغة
  if(settings.tgBots.length === 0 && (settings.tgBotToken || settings.tgChatId)){
    const defBot = {
      id: uid('bot'),
      name: 'البوت الأساسي',
      token: settings.tgBotToken,
      chatId: settings.tgChatId
    };
    settings.tgBots.push(defBot);
    settings.activeTgBotId = defBot.id;
  }
  if(!settings.activeTgBotId && settings.tgBots.length > 0){
    settings.activeTgBotId = settings.tgBots[0].id;
  }
  const curActBot = settings.tgBots.find(b => b.id === settings.activeTgBotId) || settings.tgBots[0];
  if(curActBot){
    settings.tgBotToken = curActBot.token;
    settings.tgChatId = curActBot.chatId;
  }

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
        statuses: Array.isArray(L.statuses) ? L.statuses.map(s => ({
          id: s.id || uid('st'),
          label: s.label || 'حالة',
          color: s.color || '#2563eb',
          type: s.type || (s.id === 'st_done' ? 'present' : s.id === 'st_apology' ? 'apology' : 'absent')
        })) : undefined,
        groups: Array.isArray(L.groups) ? L.groups.map(normalizeGroup) : [],
        examGroups: Array.isArray(L.examGroups) ? L.examGroups.map(normalizeGroup) : [],
        students: Array.isArray(L.students) ? L.students.map(normalizeStudent) : [],
        monthNumber, year,
        sessions: (Array.isArray(L.sessions) ? L.sessions : (Array.isArray(cur.sessions) ? cur.sessions : [])),
        records: (L.records && typeof L.records === 'object') ? L.records : ((cur.records && typeof cur.records === 'object') ? cur.records : {}),
        exams: Array.isArray(L.exams) ? L.exams.map(normalizeExam) : [],
        examScores: (L.examScores && typeof L.examScores === 'object') ? L.examScores : {},
        examNotes: (L.examNotes && typeof L.examNotes === 'object') ? L.examNotes : {},
        examExclusions: (L.examExclusions && typeof L.examExclusions === 'object') ? L.examExclusions : {},
        hiddenExamStudents: Array.isArray(L.hiddenExamStudents) ? L.hiddenExamStudents : [],
        hiddenStudents: Array.isArray(L.hiddenStudents) ? L.hiddenStudents : [],
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
      examGroups: [],
      students: raw.students.map(normalizeStudent),
      monthNumber: (raw.currentMonth && raw.currentMonth.monthNumber) || m.monthNumber,
      year: (raw.currentMonth && raw.currentMonth.year) || m.year,
      sessions: (raw.currentMonth && raw.currentMonth.weeks) || [],
      records: (raw.currentMonth && raw.currentMonth.records) || {},
      exams: [],
      examScores: {},
      examNotes: {},
      examExclusions: {},
      hiddenExamStudents: []
    }];
  }
  if(lessons.length === 0) lessons = JSON.parse(JSON.stringify(base.lessons));

  lessons.forEach(L => {
    if(!Array.isArray(L.students)) L.students = [];
    if(!Array.isArray(L.sessions)) L.sessions = [];
    if(!Array.isArray(L.groups)) L.groups = [];
    if(!Array.isArray(L.examGroups)) L.examGroups = [];
    if(!L.records || typeof L.records !== 'object') L.records = {};
    if(!Array.isArray(L.hiddenExamStudents)) L.hiddenExamStudents = [];
    if(!Array.isArray(L.hiddenStudents)) L.hiddenStudents = [];
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
      exams: Array.isArray(a.exams) ? a.exams.map(normalizeExam) : [],
      examScores: (a.examScores && typeof a.examScores === 'object') ? a.examScores : {},
      examNotes: (a.examNotes && typeof a.examNotes === 'object') ? a.examNotes : {},
      examExclusions: (a.examExclusions && typeof a.examExclusions === 'object') ? a.examExclusions : {},
      hiddenExamStudents: Array.isArray(a.hiddenExamStudents) ? a.hiddenExamStudents : [],
      hiddenStudents: Array.isArray(a.hiddenStudents) ? a.hiddenStudents : [],
      examGroups: Array.isArray(a.examGroups) ? a.examGroups.map(normalizeGroup) : [],
      statuses: Array.isArray(a.statuses) ? a.statuses.map(s => ({
        id: s.id || uid('st'),
        label: s.label || 'حالة',
        color: s.color || '#2563eb',
        type: s.type || (s.id === 'st_done' ? 'present' : s.id === 'st_apology' ? 'apology' : 'absent')
      })) : undefined,
      statusLabels: (a.statusLabels && typeof a.statusLabels === 'object') ? a.statusLabels : {},
      archivedAt: a.archivedAt || new Date().toISOString()
    }));
  }

  return { version: 6, settings, moneyPasswordHash: (typeof raw.moneyPasswordHash === 'string') ? raw.moneyPasswordHash : '', moneySecurityQ: (typeof raw.moneySecurityQ === 'string') ? raw.moneySecurityQ : '', moneySecurityA: (typeof raw.moneySecurityA === 'string') ? raw.moneySecurityA : '', lessons, archive };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      try{
        const s = JSON.parse(raw);
        if(s && typeof s === 'object'){
          const norm = normalizeState(s);
          if(norm && ((norm.lessons && norm.lessons.length > 0) || (norm.archive && norm.archive.length > 0))){
            try{ localStorage.setItem('daftar_emergency_backup', raw); }catch(e){}
            return norm;
          }
        }
      }catch(err){
        console.error('loadState parse error:', err);
        try{ localStorage.setItem('daftar_corrupt_rescue', raw); }catch(e){}
      }
    }

    // فحص مفتاح الطوارئ في localStorage إن كان المفتاح الأساسي فارغاً أو تالفاً
    const emRaw = localStorage.getItem('daftar_emergency_backup');
    if(emRaw){
      try{
        const emObj = JSON.parse(emRaw);
        if(emObj && typeof emObj === 'object'){
          const emNorm = normalizeState(emObj);
          if(emNorm && ((emNorm.lessons && emNorm.lessons.length > 0) || (emNorm.archive && emNorm.archive.length > 0))){
            console.log('Restored from emergency localStorage backup');
            return emNorm;
          }
        }
      }catch(e){}
    }

    return null;
  }catch(e){
    console.error('loadState fatal error:', e);
    return null;
  }
}

let stateSaveTimer = null;
function saveState(immediate = false){
  const doLocalStorageSave = () => {
    try{
      const json = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, json);
      if(state && ((state.lessons && state.lessons.length > 0) || (state.archive && state.archive.length > 0))){
        try{ localStorage.setItem('daftar_emergency_backup', json); }catch(e){}
      }
    }catch(e){
      console.error('saveState localStorage error:', e);
    }
  };

  const doIdbSave = () => {
    if(typeof idbSaveAppState === 'function'){
      idbSaveAppState(state);
    }
  };

  if(immediate){
    clearTimeout(stateSaveTimer);
    doLocalStorageSave();
    doIdbSave();
    scheduleAutoSave();
    return;
  }
  clearTimeout(stateSaveTimer);
  stateSaveTimer = setTimeout(() => {
    doLocalStorageSave();
    doIdbSave();
    scheduleAutoSave();
  }, 250);
}
window.addEventListener('beforeunload', () => saveState(true));
window.addEventListener('pagehide', () => saveState(true));

/* ---------- نافذة تأكيد الحذف المخصصة والآمنة ---------- */
function confirmDangerModal(options){
  const title = options.title || 'تأكيد الحذف';
  const msg = options.message || 'هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟';
  const item = options.itemName || '';
  const note = options.dangerNote || 'لا يمكن التراجع عن هذا الإجراء بعد إتمامه.';
  const confirmText = options.confirmText || 'نعم، تأكيد الحذف';
  const cancelText = options.cancelText || 'إلغاء وتراجع';

  const html = '<div class="danger-modal-box">'
    + '<div class="danger-modal-icon">' + appIcon('alert-triangle', 32) + '</div>'
    + '<div class="danger-modal-title">' + esc(title) + '</div>'
    + '<div class="danger-modal-desc">' + esc(msg) + '</div>'
    + (item ? '<div class="danger-modal-item">' + esc(item) + '</div>' : '')
    + '<p class="muted" style="font-size:11.5px;margin-bottom:16px;color:#dc2626;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px">' + appIcon('info', 13) + ' ' + esc(note) + '</p>'
    + '<div class="danger-modal-actions">'
    +   '<button class="btn btn-danger" id="cfm_danger_ok">' + esc(confirmText) + '</button>'
    +   '<button class="btn btn-outline" id="cfm_danger_cancel">' + esc(cancelText) + '</button>'
    + '</div>'
    + '</div>';

  openModal(title, html);

  $('#cfm_danger_cancel').onclick = closeModal;
  $('#cfm_danger_ok').onclick = () => {
    closeModal();
    if(typeof options.onConfirm === 'function') options.onConfirm();
  };
}

let state = loadState() || defaultState();
if(state && ((state.lessons && state.lessons.length > 0) || (state.archive && state.archive.length > 0))){
  saveState(true);
}

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
let examGroupFilterQuery = '';
let currentArchiveIdx = null;
let currentArchiveSubtab = 'attendance';
let archiveFilterQuery = '';
let archiveGroupFilterQuery = '';
let lastBackPressTime = 0;

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
  el.innerHTML = '<span>' + appIcon('wallet', 14) + ' إجمالي الدخل: <b>' + moneyDisplay(d.collected) + ' / ' + moneyDisplay(d.total) + ' ج.م</b></span>'
    + '<button class="mini-btn ' + (moneyMasked() ? 'mini-lock' : 'mini-add') + '" data-act="' + (moneyMasked() ? 'reveal-money' : 'lock-money') + '">' + (moneyMasked() ? appIcon('eye', 13) + ' عرض' : appIcon('lock', 13) + ' إخفاء') + '</button>';
}

/* ---------- عرض عام ---------- */
function renderAll(){
  applyLiteModeUI();
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
          if(isPresentStatus(rec.status, effectiveStatuses(L))) totalPastAttended++;
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
    todayListHTML = '<div class="dash-today-list"><b>' + appIcon('calendar', 14) + ' حصص اليوم:</b> '
      + todayItems.map(item => '<span class="dash-today-item">' + appIcon('clock', 12) + ' ' + esc(item.label) + ' (' + formatTime12(item.time) + ')</span>').join('')
      + '</div>';
  } else {
    todayListHTML = '<div class="dash-today-list muted">لا توجد حصص مجدولة لليوم.</div>';
  }

  wrap.innerHTML = '<div class="dash-head">'
    + '<div class="dash-title">' + appIcon('bar-chart-2', 16) + ' لوحة المؤشرات السريعة</div>'
    + '<div style="display:flex;gap:6px">'
    +   (hasSub ? '<button class="btn btn-outline btn-sm" id="btnToggleDashMoney" title="إخفاء/إظهار المبالغ" style="padding:2px 8px;font-size:12px">' + (hideMoney ? appIcon('eye', 13) + ' إظهار' : appIcon('eye-off', 13) + ' إخفاء') + '</button>' : '')
    +   '<button class="btn btn-outline btn-sm" id="btnDashAnalytics" style="padding:2px 8px;font-size:12px">' + appIcon('trending-up', 13) + ' التحليلات</button>'
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
          if((L.records[st.id] && L.records[st.id][s.id] && isPresentStatus(L.records[st.id][s.id].status, effectiveStatuses(L)))) done++;
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
    +   '<div class="lesson-meta">شهر ' + L.monthNumber + '/' + L.year + ((L.groups && L.groups.length) ? ' · ' + L.groups.length + ' مجموعة' : '') + '</div>'
    + '</div>'
    + '<div class="lesson-actions">'
    +   '<button class="btn btn-sm" data-act="open-lesson" data-id="'+L.id+'">' + appIcon('book', 13) + ' فتح</button>'
    +   '<button class="btn btn-sm btn-outline" data-act="edit-lesson" data-id="'+L.id+'">' + appIcon('edit', 13) + ' تعديل</button>'
    +   '<button class="btn btn-sm btn-danger" data-act="del-lesson" data-id="'+L.id+'">' + appIcon('trash', 13) + ' حذف</button>'
    + '</div>'
    + '</div>'
  ).join('');
}

/* ---------- البحث العام (يشمل الدروس الحالية والشهور المؤرشفة) ---------- */
function renderGlobalSearch(){
  const q = globalSearchQuery.trim();
  const qN = normalizeForSearch(q);
  const box = $('#globalSearchResults');
  const clearBtn = $('#clearGlobalSearch');
  if(clearBtn) clearBtn.style.display = q ? 'block' : 'none';
  if(!q){ box.innerHTML = ''; box.style.display = 'none'; return; }
  const matches = [];

  // 1. الدروس الحالية
  state.lessons.forEach(L => {
    (L.students || []).forEach((st, sidx) => {
      const nameMatch = qN ? normalizeForSearch(st.name).includes(qN) : false;
      if(nameMatch || (st.phone||'').includes(q) || (st.guardianPhone||'').includes(q) || (st.extraPhones||[]).some(p => p.includes(q)) || (st.guardianExtraPhones||[]).some(p => p.includes(q)) || (q && String(sidx+1) === q)){
        matches.push({ isArchive: false, lesson: L, student: st, sidx: sidx });
      }
    });
  });

  // 2. الشهور المؤرشفة
  (state.archive || []).forEach((A, aIdx) => {
    const aStudents = A.students || archiveStudents(A) || [];
    aStudents.forEach((st, sidx) => {
      const nameMatch = qN ? normalizeForSearch(st.name).includes(qN) : false;
      if(nameMatch || (st.phone||'').includes(q) || (st.guardianPhone||'').includes(q) || (st.extraPhones||[]).some(p => p.includes(q)) || (st.guardianExtraPhones||[]).some(p => p.includes(q)) || (q && String(sidx+1) === q)){
        matches.push({ isArchive: true, arch: A, archIdx: aIdx, student: st, sidx: sidx });
      }
    });
  });

  if(matches.length === 0){
    box.innerHTML = '<div class="empty-state">لا توجد نتائج مطابقة (في الدروس الحالية أو الأرشيف).</div>';
  } else {
    const sliceMatches = matches.length > 50 ? matches.slice(0, 50) : matches;
    box.innerHTML = sliceMatches.map(m => {
      if(m.isArchive){
        const lName = m.arch.lessonName || m.arch.name || 'درس';
        const mNum = m.arch.monthNumber ? ('شهر ' + m.arch.monthNumber) : (m.arch.name || 'شهر مؤرشف');
        const yStr = m.arch.year ? ('/' + m.arch.year) : '';
        return '<div class="search-item" style="border-right: 3px solid #6366f1; background: #faf5ff">'
          + '<div style="display:flex;flex-direction:column;gap:2px;flex:1">'
          +   '<span class="s-name" style="font-weight:700">' + esc(m.student.name) + '</span>'
          +   '<span class="s-meta" style="color:#6366f1;font-weight:700;font-size:11.5px">'
          +     appIcon('archive', 13) + ' شهر مؤرشف: «' + esc(lName) + '» (' + esc(mNum + yStr) + ')'
          +   '</span>'
          + '</div>'
          + '<button class="btn btn-sm btn-outline" data-act="open-archived-student" data-arch-idx="' + m.archIdx + '" data-id="' + m.student.id + '" style="color:#6366f1;border-color:#c7d2fe;font-weight:700">' + appIcon('archive', 12) + ' فتح في الأرشيف</button>'
          + '</div>';
      } else {
        return '<div class="search-item">'
          + '<div style="display:flex;flex-direction:column;gap:2px;flex:1">'
          +   '<span class="s-name" style="font-weight:700">' + esc(m.student.name) + '</span>'
          +   '<span class="s-meta">في درس «' + esc(m.lesson.name) + '»</span>'
          + '</div>'
          + '<button class="btn btn-sm btn-outline" data-act="open-student" data-lesson="' + m.lesson.id + '" data-id="' + m.student.id + '">' + appIcon('book', 12) + ' فتح</button>'
          + '</div>';
      }
    }).join('') + (matches.length > 50 ? '<div style="text-align:center;padding:6px;font-size:11px;color:var(--muted)">تم عرض أول 50 نتيجة من إجمالي ' + matches.length + ' نتيجة لتسريع الأداء.</div>' : '');
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
   v41: إدارة وحجب الطلاب المنقطعين عن الحضور (Smart Dropout Hiding)
   ===================================================================== */
function getStudentOverallAttendance(studentId, lessonId){
  const lid = lessonId;
  let totalAttended = 0, totalSessions = 0;
  const targetArchs = (state.archive || []).filter(a => a.lessonId === lid || a.id === lid);
  targetArchs.forEach(a => {
    const ps = pastSessions(a.sessions || []);
    totalSessions += ps.length;
    const recs = (a.records && a.records[studentId]) || {};
    ps.forEach(s => {
      const rec = recs[s.id] || {};
      if(isPresentStatus(rec.status, effectiveStatuses(a))) totalAttended++;
    });
  });
  const curL = state.lessons.find(x => x.id === lid);
  if(curL){
    const ps = pastSessions(curL.sessions || []);
    totalSessions += ps.length;
    const recs = (curL.records && curL.records[studentId]) || {};
    ps.forEach(s => {
      const rec = recs[s.id] || {};
      if(isPresentStatus(rec.status, effectiveStatuses(curL))) totalAttended++;
    });
  }
  const pct = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;
  return { totalAttended, totalSessions, pct, archiveMonthCount: targetArchs.length };
}

function openHiddenStudentsModal(lesson, isArchive = false, archIdx = null){
  if(!lesson) return;
  if(!Array.isArray(lesson.hiddenStudents)) lesson.hiddenStudents = [];
  const hiddenIds = lesson.hiddenStudents;
  const allStudents = lesson.students || [];
  const hiddenStudents = allStudents.filter(st => hiddenIds.includes(st.id));

  let listHtml = '';
  if(hiddenStudents.length === 0){
    listHtml = '<div class="empty-state" style="padding:30px 10px;text-align:center"><p class="muted">لا يوجد طلاب محجوبون في هذا الدرس حالياً.</p></div>';
  } else {
    listHtml = '<div style="max-height:340px;overflow-y:auto;padding:2px;display:flex;flex-direction:column;gap:8px">'
      + hiddenStudents.map((st, i) => {
        const stats = getStudentOverallAttendance(st.id, lesson.lessonId || lesson.id);
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8fafc;border:1px solid var(--border);border-radius:8px;flex-wrap:wrap;gap:8px">'
          + '<div>'
          +   '<div style="font-weight:700;font-size:13.5px">' + (i + 1) + '. ' + esc(st.name) + '</div>'
          +   '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + appIcon('phone', 11) + ' ' + esc(localPhone(st.phone)) + ' · نسبة الحضور الكلية عبر الشهور: <b style="color:' + (stats.pct >= 50 ? '#15803d' : '#b91c1c') + '">' + stats.pct + '% (' + stats.totalAttended + '/' + stats.totalSessions + ')</b></div>'
          + '</div>'
          + '<button class="btn btn-outline btn-sm unhide-st-btn" data-id="' + st.id + '" style="color:#15803d;border-color:#86efac;font-weight:700">' + appIcon('check', 13) + ' استعادة للجدول</button>'
          + '</div>';
      }).join('')
      + '</div>';
  }

  const modalHtml = '<div style="text-align:right;direction:rtl">'
    + '<p class="muted" style="margin-top:0;font-size:12.5px;line-height:1.6">'
    +   'الطلاب المحجوبون يتم إخفاؤهم من جدول الحضور والمراسلة الجماعية حتى لا يشغلوا مساحة أو يتم إرسال رسائل لهم بالخطأ، مع إمكانية استعادتهم في أي وقت.'
    + '</p>'
    + '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">'
    +   '<button class="btn btn-primary btn-sm" id="btn_smart_dropout_hide" style="font-size:12px;font-weight:700">' + appIcon('zap', 13) + ' حجب ذكي للمنقطعين عن الشهور السابقة</button>'
    +   (hiddenStudents.length > 0 ? '<button class="btn btn-outline btn-sm" id="btn_unhide_all" style="font-size:12px;font-weight:700;color:#15803d">' + appIcon('check-square', 13) + ' استعادة الكل للجدول</button>' : '')
    + '</div>'
    + listHtml
    + '<div class="modal-actions" style="margin-top:14px">'
    +   '<button class="btn" id="btn_hidden_close">إغلاق</button>'
    + '</div>'
    + '</div>';

  openModal('🚫 إدارة الطلاب المحجوبين (' + hiddenStudents.length + ' طالب)', modalHtml);

  $$('.unhide-st-btn').forEach(btn => {
    btn.onclick = () => {
      const sid = btn.dataset.id;
      lesson.hiddenStudents = (lesson.hiddenStudents || []).filter(x => x !== sid);
      saveState();
      if(isArchive && archIdx !== null) renderArchiveDetail(archIdx);
      else renderLessonDetail();
      openHiddenStudentsModal(lesson, isArchive, archIdx);
      showToastMessage('✅ تم استعادة الطالب للجدول بنجاح.');
    };
  });

  if($('#btn_unhide_all')){
    $('#btn_unhide_all').onclick = () => {
      if(!window.confirm('هل تريد استعادة جميع الطلاب المحجوبين إلى الجدول؟')) return;
      lesson.hiddenStudents = [];
      saveState();
      if(isArchive && archIdx !== null) renderArchiveDetail(archIdx);
      else renderLessonDetail();
      closeModal();
      showToastMessage('✅ تم استعادة جميع الطلاب للجدول بنجاح.');
    };
  }

  if($('#btn_smart_dropout_hide')){
    $('#btn_smart_dropout_hide').onclick = () => {
      openSmartDropoutHidingModal(lesson, isArchive, archIdx);
    };
  }

  if($('#btn_hidden_close')) $('#btn_hidden_close').onclick = closeModal;
}

function openSmartDropoutHidingModal(lesson, isArchive = false, archIdx = null){
  if(!lesson) return;
  const allStudents = lesson.students || [];
  if(!Array.isArray(lesson.hiddenStudents)) lesson.hiddenStudents = [];

  let candidates = allStudents.map(st => {
    const stats = getStudentOverallAttendance(st.id, lesson.lessonId || lesson.id);
    const isAlreadyHidden = lesson.hiddenStudents.includes(st.id);
    return { student: st, stats, isAlreadyHidden };
  });

  function renderCandidates(thresholdPct){
    const filtered = candidates.filter(c => !c.isAlreadyHidden && c.stats.totalSessions > 0 && c.stats.pct <= thresholdPct);
    const listWrap = $('#dropout_candidates_list');
    if(!listWrap) return;
    if(filtered.length === 0){
      listWrap.innerHTML = '<div class="empty-state" style="padding:20px 10px;text-align:center"><p class="muted">لا يوجد طلاب تنطبق عليهم نسبة الحضور المحددة (أقل من أو تساوي ' + thresholdPct + '% عبر كافة الشهور).</p></div>';
      if($('#btn_apply_smart_hide')) $('#btn_apply_smart_hide').disabled = true;
      return;
    }
    if($('#btn_apply_smart_hide')) $('#btn_apply_smart_hide').disabled = false;
    listWrap.innerHTML = '<div style="display:flex;flex-direction:column;gap:6px">'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px">'
      +   '<span>تم العثور على <b>' + filtered.length + '</b> طالب منقطع:</span>'
      +   '<label style="cursor:pointer;display:inline-flex;align-items:center;gap:4px"><input type="checkbox" id="chk_sel_all_dropouts" checked> تحديد الكل</label>'
      + '</div>'
      + filtered.map(c => {
        return '<label style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#fff;border:1px solid var(--border);border-radius:6px;cursor:pointer">'
          + '<div style="display:flex;align-items:center;gap:8px">'
          +   '<input type="checkbox" class="dropout-chk" value="' + c.student.id + '" checked>'
          +   '<div>'
          +     '<span style="font-weight:700;font-size:13px">' + esc(c.student.name) + '</span>'
          +     '<span style="font-size:11px;color:var(--muted);margin-right:8px">' + appIcon('phone', 11) + ' ' + esc(localPhone(c.student.phone)) + '</span>'
          +   '</div>'
          + '</div>'
          + '<span style="font-size:11.5px;font-weight:800;color:#b91c1c;background:#fee2e2;padding:2px 8px;border-radius:999px">' + c.stats.pct + '% حضور (' + c.stats.totalAttended + '/' + c.stats.totalSessions + ' حصة)</span>'
          + '</label>';
      }).join('')
      + '</div>';

    const chkAll = $('#chk_sel_all_dropouts');
    if(chkAll){
      chkAll.onchange = (e) => {
        $$('.dropout-chk').forEach(cb => { cb.checked = e.target.checked; });
      };
    }
  }

  const modalHtml = '<div style="text-align:right;direction:rtl">'
    + '<p style="font-size:13px;line-height:1.6;color:var(--text);margin-top:0">'
    +   'يقوم الحجب الذكي بحساب نسبة حضور كل طالب <b>عبر كافة الشهور الماضية والحالية</b> لعزل الطلاب المنقطعين عن الحضور نهائياً.'
    + '</p>'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 10px;background:#f8fafc;border:1px solid var(--border);border-radius:8px;flex-wrap:wrap">'
    +   '<label style="font-size:12px;font-weight:700">حجب الطلاب بنسبة حضور أقل من أو تساوي:</label>'
    +   '<select id="sel_dropout_threshold" style="padding:4px 10px;font-size:12px;font-weight:700;border-radius:6px;border:1px solid var(--border);background:#fff;cursor:pointer">'
    +     '<option value="0">0% (لم يحضر أي حصة نهائياً)</option>'
    +     '<option value="15" selected>15% فأقل (حضور نادر جداً)</option>'
    +     '<option value="25">25% فأقل (حضور ربع الحصص فقط)</option>'
    +     '<option value="40">40% فأقل</option>'
    +   '</select>'
    + '</div>'
    + '<div id="dropout_candidates_list" style="max-height:300px;overflow-y:auto;padding:2px"></div>'
    + '<div class="modal-actions" style="margin-top:16px">'
    +   '<button class="btn btn-primary" id="btn_apply_smart_hide" style="background:#b91c1c;border-color:#b91c1c">' + appIcon('user-x', 13) + ' حجب الطلاب المحددين</button>'
    +   '<button class="btn btn-outline" id="btn_cancel_smart_hide">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('⚡ الحجب الذكي للمنقطعين عن الحضور', modalHtml);
  renderCandidates(15);

  const selThresh = $('#sel_dropout_threshold');
  if(selThresh){
    selThresh.onchange = (e) => {
      renderCandidates(parseInt(e.target.value, 10) || 0);
    };
  }

  $('#btn_apply_smart_hide').onclick = () => {
    const checkedIds = $$('.dropout-chk:checked').map(cb => cb.value);
    if(checkedIds.length === 0){
      alert('يرجى تحديد طالب واحد على الأقل لحجبه.');
      return;
    }
    checkedIds.forEach(id => {
      if(!lesson.hiddenStudents.includes(id)) lesson.hiddenStudents.push(id);
    });
    saveState();
    if(isArchive && archIdx !== null) renderArchiveDetail(archIdx);
    else renderLessonDetail();
    closeModal();
    showToastMessage('🚫 تم حجب ' + checkedIds.length + ' طالب منقطع بنجاح.');
  };

  $('#btn_cancel_smart_hide').onclick = () => openHiddenStudentsModal(lesson, isArchive, archIdx);
}

/* =====================================================================
   v30: المتغيرات العامة والدوال الجديدة
   ===================================================================== */
let currentLessonSubtab = 'attendance'; // 'attendance' | 'exams'
let isBulkSelecting = false;
let selectedStudentIds = new Set();

/* ---------- 1. التحضير السريع الجماعي (Bulk Attendance) ---------- */
function openBulkAttendanceModal(container, session, isArch = false, archIdx = null){
  if(!container || !session) return;
  const isArchive = isArch || (archIdx !== null && archIdx !== undefined) || (state.archive && state.archive.includes(container)) || currentArchiveIdx !== null;
  const eff = effectiveStatuses(container);

  const statusBtns = eff.map(s => {
    const bg = s.color || (s.type === 'present' ? '#15803d' : s.type === 'apology' ? '#b45309' : '#b91c1c');
    return '<button class="btn" data-bulk-st="' + esc(s.id) + '" style="background:' + bg + ';color:#fff;justify-content:center">' + appIcon('check', 14) + ' تعيين الكل: ' + esc(s.label) + '</button>';
  }).join('');

  const html = '<div style="text-align:center;padding:8px">'
    + '<p style="font-size:14px;font-weight:700;margin-bottom:14px">تعيين حالة لجميع طلاب الحصة:<br><b style="color:var(--primary);font-size:15px">' + esc(session.label) + (session.dateLabel ? ' (' + esc(session.dateLabel) + ')' : '') + '</b></p>'
    + '<div style="display:flex;flex-direction:column;gap:10px;max-width:300px;margin:0 auto" id="bulk_btns_wrap">'
    +   statusBtns
    +   '<button class="btn btn-outline" id="bulk_set_clear" style="justify-content:center">' + appIcon('refresh', 14) + ' تفريغ سجلات الحصة للجميع</button>'
    + '</div>'
    + '</div>';

  openModal('التحضير السريع الجماعي', html);

  function applyStatus(stCode){
    let targetStudents = Array.isArray(container.students) && container.students.length ? container.students : archiveStudents(container);
    const filterQuery = isArchive ? archiveGroupFilterQuery : groupFilterQuery;
    if(filterQuery && filterQuery !== '__none__'){
      targetStudents = targetStudents.filter(st => st.groupId === filterQuery);
    } else if(filterQuery === '__none__'){
      targetStudents = targetStudents.filter(st => !st.groupId);
    }
    if(!container.records) container.records = {};
    targetStudents.forEach(st => {
      if(!container.records[st.id]) container.records[st.id] = {};
      if(stCode === null){
        delete container.records[st.id][session.id];
      } else {
        container.records[st.id][session.id] = {
          status: stCode,
          note: (container.records[st.id][session.id] && container.records[st.id][session.id].note) || ''
        };
      }
    });
    saveState();
    if(isArchive){
      const effectiveIdx = (archIdx !== null && archIdx !== undefined) ? archIdx : (currentArchiveIdx !== null ? currentArchiveIdx : state.archive.indexOf(container));
      if(effectiveIdx >= 0) renderArchiveDetail(effectiveIdx);
    } else {
      renderLessonDetail();
    }
    closeModal();
    showToastMessage('✅ تم تطبيق الحالة على ' + targetStudents.length + ' طالب.');
  }

  $$('#bulk_btns_wrap button[data-bulk-st]').forEach(btn => {
    btn.onclick = () => applyStatus(btn.dataset.bulkSt);
  });
  if($('#bulk_set_clear')) $('#bulk_set_clear').onclick = () => applyStatus(null);
}

/* ---------- 2. المراسلة التسلسلية الذكية (Sequential WhatsApp) ---------- */
function openSequentialMessagingModal(initialSource){
  const sources = [];
  (state.lessons || []).forEach(l => {
    const activeStudents = (l.students || []).filter(st => !(l.hiddenStudents || []).includes(st.id));
    sources.push({
      id: 'lesson_' + l.id,
      type: 'lesson',
      name: l.name,
      label: '📚 درس: ' + l.name + ' (الشهر الحالي ' + l.monthNumber + '/' + l.year + ')',
      studentCount: activeStudents.length,
      raw: { ...l, students: activeStudents }
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
            return '<label class="seq-source-item">'
              + '<input type="checkbox" class="seq-source-cb" value="' + s.id + '" ' + (isDef ? 'checked' : '') + '>'
              + '<span class="seq-source-label">' + esc(s.label) + '</span>'
              + '<span class="seq-source-count">(' + s.studentCount + ' طالب)</span>'
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

      itemsHTML += '<label class="seq-st-item" data-name="' + normalizeForSearch(st.name) + '" data-phone="' + digits(ph) + '">'
        + '<input type="checkbox" class="seq-st-cb" value="' + item.uniqueId + '" data-status="' + stStatus + '" ' + (checked ? 'checked' : '') + '>'
        + '<div class="seq-st-info">'
        +   '<div class="seq-st-top">'
        +     '<span class="seq-st-name">' + esc(st.name) + '</span>'
        +     statusBadge
        +   '</div>'
        +   '<div class="seq-st-bottom">'
        +     '<div class="seq-st-badges">'
        +       sourceBadge
        +       groupBadge
        +     '</div>'
        +     '<span class="seq-st-phone">' + esc(localPhone(ph)) + '</span>'
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

/* ---------- 4. درجات الاختبارات (Exams View - v33) ---------- */
function renderExamsTable(lesson, filteredStudents){
  const exams = lesson.exams || [];
  const head = $('#examsHead');
  const body = $('#examsBody');
  const foot = $('#examsFoot');
  const meta = $('#examsMeta');
  if(!head || !body) return;

  renderExamGroupFilter(lesson);

  if(!Array.isArray(lesson.hiddenExamStudents)) lesson.hiddenExamStudents = [];
  const hiddenList = lesson.hiddenExamStudents;
  const hiddenBtn = $('#hiddenExamStudentsBtn');
  const hiddenCountEl = $('#hiddenExamCount');
  if(hiddenBtn && hiddenCountEl){
    if(hiddenList.length > 0){
      hiddenBtn.style.display = 'inline-flex';
      hiddenCountEl.textContent = hiddenList.length;
    } else {
      hiddenBtn.style.display = 'none';
    }
  }

  if(meta) meta.textContent = exams.length + ' اختبار مسجل';

  let h = '<tr><th class="sticky-col">اسم الطالب</th>';
  exams.forEach(ex => {
    h += '<th><div style="font-size:12px;font-weight:800">' + esc(ex.name) + '</div>'
      + '<span class="exam-max-badge">الدرجة: ' + ex.maxScore + ' (' + esc(ex.date) + ')</span>'
      + '<div style="display:flex;gap:4px;justify-content:center;margin-top:3px">'
      +   '<button class="mini-btn mini-edit" data-act="edit-exam" data-id="' + ex.id + '" title="تعديل الاختبار">' + appIcon('edit', 11) + '</button>'
      +   '<button class="mini-btn mini-del" data-act="del-exam" data-id="' + ex.id + '" title="حذف الاختبار">✕</button>'
      + '</div>'
      + '</th>';
  });
  h += '<th>المتوسط %</th></tr>';
  head.innerHTML = h;

  let students = (filteredStudents || lesson.students).filter(st => !hiddenList.includes(st.id));
  if(examGroupFilterQuery && examGroupFilterQuery !== '__none__'){
    students = students.filter(st => st.examGroupId === examGroupFilterQuery);
  } else if(examGroupFilterQuery === '__none__'){
    students = students.filter(st => !st.examGroupId);
  }

  // Pagination for exams
  const totalExamsStudentsCount = students.length;
  let pagedExamsStudents = students;
  let totalExamsPages = 1;
  if(tablePageSize > 0 && totalExamsStudentsCount > tablePageSize){
    totalExamsPages = Math.ceil(totalExamsStudentsCount / tablePageSize);
    if(examsCurrentPage > totalExamsPages) examsCurrentPage = totalExamsPages;
    if(examsCurrentPage < 1) examsCurrentPage = 1;
    const startIdx = (examsCurrentPage - 1) * tablePageSize;
    pagedExamsStudents = students.slice(startIdx, startIdx + tablePageSize);
  } else {
    examsCurrentPage = 1;
  }

  const examsPagTop = $('#examsPagWrapTop') || $('#examsPagWrap');
  const examsPagBottom = $('#examsPagWrapBottom');
  const examsPagHtml = renderPaginationBarHTML(examsCurrentPage, totalExamsPages, totalExamsStudentsCount, tablePageSize, 'exams');
  if(examsPagTop) examsPagTop.innerHTML = examsPagHtml;
  if(examsPagBottom) examsPagBottom.innerHTML = examsPagHtml;

  let b = '';
  pagedExamsStudents.forEach((st, idx) => {
    const studentScores = (lesson.examScores && lesson.examScores[st.id]) || {};
    const exclusions = (lesson.examExclusions && lesson.examExclusions[st.id]) || {};
    const notes = (lesson.examNotes && lesson.examNotes[st.id]) || {};
    let totalPct = 0, examCount = 0;

    const eg = (lesson.examGroups || []).find(g => g.id === st.examGroupId);
    const egBadge = eg ? '<span class="exam-group-badge" title="مجموعة الاختبار: ' + esc(eg.name) + '">' + esc(eg.name) + '</span>' : '';

    b += '<tr data-sid="' + st.id + '"><td class="sticky-col student-cell">'
      +   '<div class="student-name">'
      +     '<span class="student-num">' + (idx + 1) + '.</span> '
      +     '<span class="st-name-click" data-act="view-student" data-id="' + st.id + '">' + esc(st.name) + '</span>'
      +     egBadge
      +   '</div>'
      + '</td>';

    exams.forEach(ex => {
      const isExcluded = !!exclusions[ex.id];
      const noteText = notes[ex.id] || '';
      const scoreVal = studentScores[ex.id] !== undefined ? studentScores[ex.id] : '';
      const pct = (!isExcluded && scoreVal !== '' && ex.maxScore > 0) ? Math.round((Number(scoreVal) / ex.maxScore) * 100) : null;
      if(pct !== null){ totalPct += pct; examCount++; }

      b += '<td class="exam-td" data-sid="' + st.id + '" data-eid="' + ex.id + '" style="text-align:center">'
        +   buildExamCellHTML(st.id, ex.id, scoreVal, isExcluded, noteText, ex.maxScore, pct)
        + '</td>';
    });

    const avgPct = examCount > 0 ? Math.round(totalPct / examCount) : null;
    b += '<td class="exam-row-avg" data-sid="' + st.id + '" style="text-align:center;font-weight:800;color:' + (avgPct !== null ? (avgPct >= 50 ? '#15803d' : '#b91c1c') : 'var(--muted)') + '">'
      + (avgPct !== null ? avgPct + '%' : '-')
      + '</td></tr>';
  });

  if(students.length === 0){
    b = '<tr><td colspan="' + (exams.length + 2) + '" class="empty-state">لا يوجد طلاب لعرض درجاتهم.</td></tr>';
  }
  body.innerHTML = b;

  renderExamsFoot(lesson);
}

function buildExamCellHTML(sid, eid, scoreVal, isExcluded, noteText, maxScore, pct){
  if(isExcluded){
    return '<div class="exam-cell-wrap">'
      + '<span class="exam-excluded-badge" data-act="exam-note" data-sid="' + sid + '" data-eid="' + eid + '" title="اضغط لتعديل الملاحظة أو إلغاء الاستبعاد">' + appIcon('user-x', 11) + ' لم يدخل</span>'
      + (noteText ? '<span class="exam-note-text-preview" title="' + esc(noteText) + '">' + appIcon('file-text', 11) + ' ' + esc(noteText) + '</span>' : '')
      + '</div>';
  }

  return '<div class="exam-cell-wrap">'
    + '<div class="exam-input-row">'
    +   '<input type="number" step="0.5" min="0" max="' + maxScore + '" value="' + (scoreVal !== '' ? scoreVal : '') + '" class="exam-input" data-sid="' + sid + '" data-eid="' + eid + '" placeholder="-">'
    +   '<button type="button" class="exam-note-btn ' + (noteText ? 'has-note' : '') + '" data-act="exam-note" data-sid="' + sid + '" data-eid="' + eid + '" title="' + (noteText ? esc(noteText) : 'إضافة ملاحظة / استبعاد') + '">' + appIcon('edit-2', 12) + '</button>'
    + '</div>'
    + (pct !== null ? '<span class="exam-pct" style="color:' + (pct >= 50 ? '#15803d' : '#b91c1c') + '">' + pct + '%</span>' : '')
    + (noteText ? '<span class="exam-note-text-preview" title="' + esc(noteText) + '">' + esc(noteText) + '</span>' : '')
    + '</div>';
}

function renderExamsFoot(lesson){
  const foot = $('#examsFoot');
  if(!foot) return;
  const exams = lesson.exams || [];
  const hiddenList = lesson.hiddenExamStudents || [];
  let activeStudents = (lesson.students || []).filter(st => !hiddenList.includes(st.id));
  if(examGroupFilterQuery && examGroupFilterQuery !== '__none__'){
    activeStudents = activeStudents.filter(st => st.examGroupId === examGroupFilterQuery);
  } else if(examGroupFilterQuery === '__none__'){
    activeStudents = activeStudents.filter(st => !st.examGroupId);
  }

  let f = '<tr class="count-row"><td class="sticky-col">متوسط درجات الطلاب</td>';
  exams.forEach(ex => {
    let sum = 0, cnt = 0;
    activeStudents.forEach(st => {
      const isExcluded = (lesson.examExclusions && lesson.examExclusions[st.id] && lesson.examExclusions[st.id][ex.id]);
      if(isExcluded) return;
      const v = (lesson.examScores && lesson.examScores[st.id] && lesson.examScores[st.id][ex.id]);
      if(v !== undefined && v !== '' && !isNaN(Number(v))){ sum += Number(v); cnt++; }
    });
    const avg = cnt > 0 ? (sum / cnt).toFixed(1) : '-';
    f += '<td data-foot-eid="' + ex.id + '"><b>' + avg + (cnt > 0 ? ' / ' + ex.maxScore : '') + '</b></td>';
  });
  f += '<td></td></tr>';
  foot.innerHTML = f;
}

/* تحديث خلية الاختبار ومتوسط الطالب ومعدل العمود موضعياً بالـ DOM بدون إعادة بناء الجدول */
function updateExamCellUI(sid, eid, lesson){
  const td = document.querySelector('.exam-td[data-sid="' + sid + '"][data-eid="' + eid + '"]');
  const ex = (lesson.exams || []).find(x => x.id === eid);
  if(!td || !ex) return;

  const scoreVal = (lesson.examScores && lesson.examScores[sid] && lesson.examScores[sid][eid]) !== undefined ? lesson.examScores[sid][eid] : '';
  const isExcluded = !!(lesson.examExclusions && lesson.examExclusions[sid] && lesson.examExclusions[sid][eid]);
  const noteText = (lesson.examNotes && lesson.examNotes[sid] && lesson.examNotes[sid][eid]) || '';
  const pct = (!isExcluded && scoreVal !== '' && ex.maxScore > 0) ? Math.round((Number(scoreVal) / ex.maxScore) * 100) : null;

  td.innerHTML = buildExamCellHTML(sid, eid, scoreVal, isExcluded, noteText, ex.maxScore, pct);

  // تحديث متوسط الطالب في نهاية الصف
  updateStudentExamRowAvg(sid, lesson);

  // تحديث متوسط العمود في تذييل الجدول
  updateExamColFootAvg(eid, lesson);
}

function updateStudentExamRowAvg(sid, lesson){
  const avgCell = document.querySelector('.exam-row-avg[data-sid="' + sid + '"]');
  if(!avgCell) return;
  const exams = lesson.exams || [];
  let totalPct = 0, examCount = 0;
  exams.forEach(ex => {
    const isExcluded = !!(lesson.examExclusions && lesson.examExclusions[sid] && lesson.examExclusions[sid][ex.id]);
    if(isExcluded) return;
    const scoreVal = (lesson.examScores && lesson.examScores[sid] && lesson.examScores[sid][ex.id]);
    if(scoreVal !== undefined && scoreVal !== '' && !isNaN(Number(scoreVal)) && ex.maxScore > 0){
      totalPct += Math.round((Number(scoreVal) / ex.maxScore) * 100);
      examCount++;
    }
  });
  const avgPct = examCount > 0 ? Math.round(totalPct / examCount) : null;
  avgCell.textContent = (avgPct !== null ? avgPct + '%' : '-');
  avgCell.style.color = (avgPct !== null ? (avgPct >= 50 ? '#15803d' : '#b91c1c') : 'var(--muted)');
}

function updateExamColFootAvg(eid, lesson){
  const footCell = document.querySelector('td[data-foot-eid="' + eid + '"]');
  const ex = (lesson.exams || []).find(x => x.id === eid);
  if(!footCell || !ex) return;
  let sum = 0, cnt = 0;
  const hiddenList = lesson.hiddenExamStudents || [];
  const activeStudents = (lesson.students || []).filter(st => !hiddenList.includes(st.id));

  activeStudents.forEach(st => {
    const isExcluded = (lesson.examExclusions && lesson.examExclusions[st.id] && lesson.examExclusions[st.id][eid]);
    if(isExcluded) return;
    const v = (lesson.examScores && lesson.examScores[st.id] && lesson.examScores[st.id][eid]);
    if(v !== undefined && v !== '' && !isNaN(Number(v))){ sum += Number(v); cnt++; }
  });
  const avg = cnt > 0 ? (sum / cnt).toFixed(1) : '-';
  footCell.innerHTML = '<b>' + avg + (cnt > 0 ? ' / ' + ex.maxScore : '') + '</b>';
}

function openExamNoteModal(student, exam, lesson){
  if(!student || !exam || !lesson) return;
  const sid = student.id;
  const eid = exam.id;

  if(!lesson.examExclusions) lesson.examExclusions = {};
  if(!lesson.examNotes) lesson.examNotes = {};

  const curExcluded = !!(lesson.examExclusions[sid] && lesson.examExclusions[sid][eid]);
  const curNote = (lesson.examNotes[sid] && lesson.examNotes[sid][eid]) || '';

  const html = '<div class="reset-box" style="text-align:right">'
    + '<p style="font-size:13px;font-weight:700;margin-bottom:12px">الطالب: <b style="color:var(--primary)">' + esc(student.name) + '</b> · الاختبار: <b>' + esc(exam.name) + '</b></p>'
    + '<div class="form-row" style="margin-bottom:12px">'
    +   '<label class="switch-row" style="padding:6px 0;background:#fff;border:1px solid var(--border);border-radius:10px;padding:10px 12px">'
    +     '<div>'
    +       '<div class="switch-label" style="color:#dc2626;font-weight:800">🚫 لم يدخل هذا الاختبار (استبعاد مؤقت)</div>'
    +       '<div class="muted" style="font-size:11px">استبعاد الطالب من هذا الاختبار تحديداً وتوثيق الحالة دون التأثير على متوسطه.</div>'
    +     '</div>'
    +     '<label class="switch"><input type="checkbox" id="ex_note_excluded"' + (curExcluded ? ' checked' : '') + '><span class="switch-slider"></span></label>'
    +   '</label>'
    + '</div>'
    + '<div class="form-row">'
    +   '<label>الملاحظة على درجة الطالب أو سبب الاستبعاد (اختياري)'
    +     '<textarea id="ex_note_text" rows="3" placeholder="مثال: غائب بعذر مرضي، حل المسائل بتميز، يحتاج مراجعة القوانين...">' + esc(curNote) + '</textarea>'
    +   '</label>'
    + '</div>'
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px dashed var(--border);display:flex;justify-content:space-between;align-items:center">'
    +   '<div>'
    +     '<div style="font-size:12px;font-weight:800;color:#dc2626">🗑️ إخفاء الطالب من قسم الاختبارات بالكامل</div>'
    +     '<div class="muted" style="font-size:11px">إخفاء هذا الطالب من جدول الاختبارات حتى لا يأخذ مساحة (سيبقى مسجلاً في جدول الحضور).</div>'
    +   '</div>'
    +   '<button type="button" class="btn btn-sm btn-danger" id="ex_hide_student" style="font-size:11px;padding:4px 10px">إخفاء من الاختبارات 🚫</button>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:16px">'
    +   '<button class="btn btn-primary" id="ex_note_save">حفظ الملاحظة</button>'
    +   (curNote || curExcluded ? '<button class="btn btn-outline" id="ex_note_clear">مسح الملاحظة وإلغاء الاستبعاد</button>' : '')
    +   '<button class="btn btn-outline" id="ex_note_cancel">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('📝 ملاحظات ودرجة الاختبار', html);
  $('#ex_note_cancel').onclick = closeModal;

  $('#ex_note_save').onclick = () => {
    const isExc = $('#ex_note_excluded').checked;
    const txt = ($('#ex_note_text').value || '').trim();

    if(!lesson.examExclusions[sid]) lesson.examExclusions[sid] = {};
    if(!lesson.examNotes[sid]) lesson.examNotes[sid] = {};

    if(isExc){
      lesson.examExclusions[sid][eid] = true;
    } else {
      delete lesson.examExclusions[sid][eid];
    }

    if(txt){
      lesson.examNotes[sid][eid] = txt;
    } else {
      delete lesson.examNotes[sid][eid];
    }

    saveState();
    updateExamCellUI(sid, eid, lesson);
    closeModal();
    showToastMessage('✅ تم حفظ ملاحظة الاختبار بنجاح.');
  };

  if($('#ex_note_clear')){
    $('#ex_note_clear').onclick = () => {
      if(lesson.examExclusions && lesson.examExclusions[sid]) delete lesson.examExclusions[sid][eid];
      if(lesson.examNotes && lesson.examNotes[sid]) delete lesson.examNotes[sid][eid];
      saveState();
      updateExamCellUI(sid, eid, lesson);
      closeModal();
      showToastMessage('✅ تم مسح الملاحظة وإلغاء الاستبعاد.');
    };
  }

  if($('#ex_hide_student')){
    $('#ex_hide_student').onclick = () => {
      confirmDangerModal({
        title: '⚠️ إخفاء الطالب من قسم الاختبارات',
        message: 'هل أنت متأكد من رغبتك في إخفاء الطالب «' + student.name + '» من قسم الاختبارات؟',
        itemName: student.name + ' (سيبقى مسجلاً في جدول الحضور طبيعياً)',
        dangerNote: 'يمكنك استعادة الطالب إلى جدول الاختبارات في أي وقت عبر زر «👥 المستبعدون».',
        confirmText: 'نعم، إخفاء من الاختبارات 🚫',
        onConfirm: () => {
          if(!Array.isArray(lesson.hiddenExamStudents)) lesson.hiddenExamStudents = [];
          if(!lesson.hiddenExamStudents.includes(sid)){
            lesson.hiddenExamStudents.push(sid);
          }
          saveState();
          closeModal();
          renderExamsTable(lesson);
          showToastMessage('🚫 تم إخفاء الطالب من جدول الاختبارات.');
        }
      });
    };
  }
}

function openHiddenExamStudentsModal(lesson){
  if(!lesson) return;
  if(!Array.isArray(lesson.hiddenExamStudents)) lesson.hiddenExamStudents = [];
  const hiddenList = lesson.hiddenExamStudents;
  const hiddenStudents = (lesson.students || []).filter(st => hiddenList.includes(st.id));

  let html = '<div class="reset-box" style="text-align:right">';
  if(hiddenStudents.length === 0){
    html += '<p class="muted" style="text-align:center;padding:12px 0">لا يوجد طلاب مستبعدون من قسم الاختبارات حالياً.</p>';
  } else {
    html += '<p style="font-size:12.5px;color:var(--text);margin-bottom:12px">قائمة الطلاب المخفيين من جدول الاختبارات في هذا الدرس:</p>'
      + '<div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;padding:2px">'
      + hiddenStudents.map((st, i) =>
          '<div style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid var(--border);border-radius:10px;padding:8px 12px">'
          + '<div>'
          +   '<div style="font-weight:800;font-size:13px">' + (i+1) + '. ' + esc(st.name) + '</div>'
          +   (st.phone ? '<div class="muted" style="font-size:11px;direction:ltr;text-align:right">' + esc(localPhone(st.phone)) + '</div>' : '')
          + '</div>'
          + '<button class="btn btn-sm btn-outline" data-act="restore-exam-student" data-id="' + st.id + '" style="font-size:11px;color:#15803d;border-color:#86efac">🔄 استعادة للاختبارات</button>'
          + '</div>'
        ).join('')
      + '</div>'
      + '<div style="margin-top:14px;text-align:center">'
      +   '<button class="btn btn-outline btn-sm" id="restore_all_exam_students" style="font-size:11.5px">🔄 استعادة جميع الطلاب المستبعدين</button>'
      + '</div>';
  }
  html += '<div class="modal-actions" style="margin-top:16px">'
    + '<button class="btn" id="hidden_ex_close">إغلاق</button>'
    + '</div></div>';

  openModal('👥 الطلاب المستبعدون من الاختبارات', html);
  $('#hidden_ex_close').onclick = closeModal;

  if($('#restore_all_exam_students')){
    $('#restore_all_exam_students').onclick = () => {
      lesson.hiddenExamStudents = [];
      saveState();
      renderExamsTable(lesson);
      closeModal();
      showToastMessage('✅ تم استعادة جميع الطلاب إلى جدول الاختبارات.');
    };
  }

  $$('#modalBody [data-act="restore-exam-student"]').forEach(btn => {
    btn.onclick = (e) => {
      const sid = e.currentTarget.dataset.id;
      lesson.hiddenExamStudents = (lesson.hiddenExamStudents || []).filter(x => x !== sid);
      saveState();
      renderExamsTable(lesson);
      openHiddenExamStudentsModal(lesson);
      showToastMessage('✅ تمت استعادة الطالب إلى جدول الاختبارات.');
    };
  });
}


/* ---------- إدارة مجموعات الاختبارات ورسائل الاختبارات (v35) ---------- */
function renderExamGroupFilter(lesson){
  const sel = $('#examGroupFilter');
  if(!sel || !lesson) return;
  const groups = lesson.examGroups || [];
  let opts = '<option value="">كل مجموعات الاختبار (' + groups.length + ')</option>';
  groups.forEach(g => {
    opts += '<option value="' + esc(g.id) + '"' + (examGroupFilterQuery === g.id ? ' selected' : '') + '>' + esc(g.name) + '</option>';
  });
  opts += '<option value="__none__"' + (examGroupFilterQuery === '__none__' ? ' selected' : '') + '>بدون مجموعة</option>';
  sel.innerHTML = opts;
}

function openExamGroupsModal(lesson){
  if(!lesson) lesson = curLesson();
  if(!lesson) return;
  if(!Array.isArray(lesson.examGroups)) lesson.examGroups = [];

  function renderList(){
    const listEl = $('#exam_groups_list');
    if(!listEl) return;
    if(lesson.examGroups.length === 0){
      listEl.innerHTML = '<p class="muted" style="text-align:center;padding:10px 0;font-size:12px">لا توجد مجموعات اختبار مخصصة حالياً.</p>';
      return;
    }
    listEl.innerHTML = lesson.examGroups.map((g) => {
      const studentCount = (lesson.students || []).filter(st => st.examGroupId === g.id).length;
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#fff;border:1px solid var(--border);border-radius:8px;gap:8px">'
        + '<div style="font-weight:700;font-size:13px">'
        +   appIcon('tag', 12) + ' ' + esc(g.name) + ' <small class="muted">(' + studentCount + ' طالب)</small>'
        + '</div>'
        + '<div style="display:flex;gap:6px">'
        +   '<button type="button" class="btn btn-sm btn-outline" data-act="assign-eg" data-gid="' + g.id + '" style="font-size:11px;padding:3px 8px">' + appIcon('users', 11) + ' تخصيص الطلاب</button>'
        +   '<button type="button" class="btn btn-sm btn-outline" data-act="edit-eg" data-gid="' + g.id + '" style="font-size:11px;padding:3px 8px">' + appIcon('edit', 11) + '</button>'
        +   '<button type="button" class="btn btn-sm btn-outline" data-act="del-eg" data-gid="' + g.id + '" style="font-size:11px;padding:3px 8px;color:#b91c1c;border-color:#fca5a5">✕</button>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  const modalHTML = '<div class="reset-box" style="text-align:right;line-height:1.6">'
    + '<p style="font-size:13px;color:var(--text);margin-bottom:12px">'
    +   'إدارة مجموعات قسم الاختبارات المستقلة لتوزيع الطلاب وتصفية وطباعة وتصدير درجات كل مجموعة على حدة:'
    + '</p>'
    + '<div style="display:flex;gap:8px;margin-bottom:14px">'
    +   '<input type="text" id="new_exam_group_name" placeholder="اسم مجموعة الاختبار الجديدة (مثال: مجموعة أ)..." style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;font-weight:700">'
    +   '<button type="button" class="btn btn-primary" id="btn_add_exam_group">' + appIcon('plus', 12) + ' إضافة</button>'
    + '</div>'
    + '<div id="exam_groups_list" style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;background:var(--bg);padding:8px;border-radius:8px;border:1px solid var(--border)"></div>'
    + '<div class="modal-actions" style="margin-top:14px">'
    +   '<button class="btn" id="btn_close_exam_groups">إغلاق</button>'
    + '</div>'
    + '</div>';

  openModal('🏷️ مجموعات قسم الاختبارات', modalHTML);
  renderList();

  $('#btn_add_exam_group').onclick = () => {
    const inp = $('#new_exam_group_name');
    const name = inp ? inp.value.trim() : '';
    if(!name){ alert('يرجى كتابة اسم المجموعة.'); return; }
    lesson.examGroups.push({ id: uid('eg'), name });
    inp.value = '';
    saveState();
    renderList();
    renderExamGroupFilter(lesson);
    showToastMessage('✅ تم إضافة مجموعة الاختبار بنجاح.');
  };

  const listEl = $('#exam_groups_list');
  listEl.onclick = (e) => {
    const btn = e.target.closest('button[data-act]');
    if(!btn) return;
    const act = btn.dataset.act;
    const gid = btn.dataset.gid;
    const grp = lesson.examGroups.find(x => x.id === gid);
    if(!grp) return;

    if(act === 'assign-eg'){
      closeModal();
      openAssignExamGroupStudentsModal(lesson, grp.id);
    } else if(act === 'edit-eg'){
      const newName = prompt('تعديل اسم مجموعة الاختبار:', grp.name);
      if(newName && newName.trim()){
        grp.name = newName.trim();
        saveState();
        renderList();
        renderExamGroupFilter(lesson);
        renderExamsTable(lesson);
      }
    } else if(act === 'del-eg'){
      confirmDangerModal({
        title: '⚠️ حذف مجموعة الاختبار',
        message: 'هل أنت متأكد من حذف مجموعة الاختبار «' + grp.name + '»؟ لن يتم حذف الطلاب ولكن سيتم إلغاء انتسابهم لهذه المجموعة في الاختبارات.',
        itemName: grp.name,
        onConfirm: () => {
          lesson.examGroups = lesson.examGroups.filter(x => x.id !== gid);
          (lesson.students || []).forEach(st => {
            if(st.examGroupId === gid) st.examGroupId = '';
          });
          if(examGroupFilterQuery === gid) examGroupFilterQuery = '';
          saveState();
          renderList();
          renderExamGroupFilter(lesson);
          renderExamsTable(lesson);
          showToastMessage('🗑️ تم حذف مجموعة الاختبار.');
        }
      });
    }
  };

  $('#btn_close_exam_groups').onclick = closeModal;
}

function openAssignExamGroupStudentsModal(lesson, groupId){
  if(!lesson) lesson = curLesson();
  const grp = (lesson.examGroups || []).find(g => g.id === groupId);
  if(!grp) return;

  const hiddenList = lesson.hiddenExamStudents || [];
  const activeStudents = (lesson.students || []).filter(st => !hiddenList.includes(st.id));

  const modalHTML = '<div class="reset-box" style="text-align:right;line-height:1.6">'
    + '<p style="font-size:13px;color:var(--text);margin-bottom:10px">'
    +   'حدد الطلاب المنتمين لمجموعة الاختبار: <b>' + esc(grp.name) + '</b>'
    + '</p>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    +   '<input type="text" id="assign_eg_search" placeholder="🔍 تصفية بالاسم..." style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:12px;width:140px">'
    +   '<div style="display:flex;gap:6px">'
    +     '<button type="button" class="btn btn-sm btn-outline" id="assign_eg_select_all" style="font-size:11px;padding:2px 8px">تحديد الكل</button>'
    +     '<button type="button" class="btn btn-sm btn-outline" id="assign_eg_deselect_all" style="font-size:11px;padding:2px 8px">إلغاء التحديد</button>'
    +   '</div>'
    + '</div>'
    + '<div id="assign_eg_container" style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;background:var(--bg);padding:8px;border-radius:8px;border:1px solid var(--border)">'
    +   activeStudents.map(st => {
          const isChecked = st.examGroupId === groupId;
          return '<label class="assign-eg-row" data-name="' + esc(st.name) + '" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;background:#fff;border:1px solid var(--border);cursor:pointer">'
            + '<input type="checkbox" class="assign-eg-cb" value="' + st.id + '"' + (isChecked ? ' checked' : '') + '>'
            + '<span style="font-size:12.5px;font-weight:700">' + esc(st.name)
            +   (st.phone ? ' <small class="muted" style="direction:ltr">(' + esc(localPhone(st.phone)) + ')</small>' : '')
            +   (st.examGroupId && st.examGroupId !== groupId ? ' <small style="color:#b45309">[في مجموعة أخرى]</small>' : '')
            + '</span>'
            + '</label>';
        }).join('')
    + '</div>'
    + '<div class="modal-actions" style="margin-top:14px">'
    +   '<button class="btn btn-primary" id="btn_save_assign_eg">💾 حفظ التوزيع</button>'
    +   '<button class="btn btn-outline" id="btn_back_to_eg_modal">← رجوع للمجموعات</button>'
    + '</div>'
    + '</div>';

  openModal('👥 تخصيص طلاب مجموعة: ' + grp.name, modalHTML);

  const searchInp = $('#assign_eg_search');
  if(searchInp){
    searchInp.oninput = () => {
      const q = normalizeForSearch(searchInp.value);
      $$('.assign-eg-row').forEach(row => {
        const name = normalizeForSearch(row.dataset.name);
        row.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
      });
    };
  }

  $('#assign_eg_select_all').onclick = () => {
    $$('.assign-eg-cb').forEach(cb => {
      if(cb.closest('.assign-eg-row').style.display !== 'none') cb.checked = true;
    });
  };
  $('#assign_eg_deselect_all').onclick = () => {
    $$('.assign-eg-cb').forEach(cb => {
      if(cb.closest('.assign-eg-row').style.display !== 'none') cb.checked = false;
    });
  };

  $('#btn_save_assign_eg').onclick = () => {
    const checkedIds = $$('.assign-eg-cb:checked').map(cb => cb.value);
    activeStudents.forEach(st => {
      if(checkedIds.includes(st.id)){
        st.examGroupId = groupId;
      } else if(st.examGroupId === groupId){
        st.examGroupId = '';
      }
    });
    saveState();
    renderExamsTable(lesson);
    closeModal();
    showToastMessage('💾 تم حفظ توزيع الطلاب في مجموعة «' + esc(grp.name) + '» بنجاح.');
  };

  $('#btn_back_to_eg_modal').onclick = () => {
    closeModal();
    openExamGroupsModal(lesson);
  };
}

function openExamReportMessageModal(lesson){
  if(!lesson) lesson = curLesson();
  if(!lesson){
    showToastMessage('⚠️ يرجى فتح درس أولاً لعرض تقرير الاختبارات.');
    return;
  }
  const exams = lesson.exams || [];
  if(exams.length === 0){
    showToastMessage('⚠️ لا توجد أي اختبارات مسجلة في هذا الدرس.');
    return;
  }

  const lessonGroups = lesson.groups || [];
  const examGroups = lesson.examGroups || [];

  let modalHTML = '<div class="reset-box" style="text-align:right;line-height:1.6">'
    + '<p style="font-size:13px;color:var(--text);margin-bottom:12px">'
    +   'صياغة تقرير درجات الاختبارات كرسالة منسقة جاهزة للمشاركة عبر واتساب أو النسخ، <b>للطلاب الذين حضروا وسجلت درجاتهم فقط</b> (استبعاد غير المشاركين تلقائياً):'
    + '</p>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">'
    +   '<div style="flex:1;min-width:180px">'
    +     '<label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px">📝 اختر الاختبار:</label>'
    +     '<select id="msg_exam_select" style="width:100%;padding:7px 10px;border-radius:8px;border:1px solid var(--border);font-weight:700">'
    +       '<option value="all">📊 تقرير كل اختبارات الشهر مجمعة</option>'
    +       exams.map(e => '<option value="' + e.id + '">' + esc(e.name) + ' (الدرجة من ' + e.maxScore + (e.date ? ' · ' + esc(e.date) : '') + ')</option>').join('')
    +     '</select>'
    +   '</div>'
    +   (examGroups.length > 0 ? ('<div style="flex:1;min-width:140px">'
    +     '<label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px">👥 فلترة بمجموعة اختبار:</label>'
    +     '<select id="msg_group_select" style="width:100%;padding:7px 10px;border-radius:8px;border:1px solid var(--border);font-weight:700">'
    +       '<option value="">كل المجموعات</option>'
    +       examGroups.map(g => '<option value="' + g.id + '">' + esc(g.name) + '</option>').join('')
    +     '</select>'
    +   '</div>') : '')
    + '</div>'
    + '<div style="margin-bottom:12px;padding:8px 10px;background:var(--card-bg,#f8fafc);border:1px solid var(--border);border-radius:8px">'
    +   '<label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px">🗂️ تقسيم نص الرسالة حسب المجموعات:</label>'
    +   '<select id="msg_group_mode" style="width:100%;padding:6px 10px;border-radius:6px;border:1px solid var(--border);font-size:12px;font-weight:700">'
    +     '<option value="none">بدون تقسيم (سرد عام)</option>'
    +     (lessonGroups.length > 0 ? '<option value="lesson">تقسيم حسب مجموعات الدرس الأساسية (' + lessonGroups.length + ')</option>' : '')
    +     (examGroups.length > 0 ? '<option value="exam">تقسيم حسب مجموعات الاختبار (' + examGroups.length + ')</option>' : '')
    +   '</select>'
    + '</div>'
    + '<div class="form-row" style="margin-bottom:10px">'
    +   '<label style="font-size:12px;font-weight:800;display:flex;justify-content:space-between;align-items:center">'
    +     '<span>📄 معاينة نص الرسالة:</span>'
    +     '<span id="msg_students_count_badge" class="badge" style="background:#e0e7ff;color:#3730a3;font-size:11px">0 طالب حاضر</span>'
    +   '</label>'
    +   '<textarea id="exam_msg_text" rows="10" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);font-size:12.5px;line-height:1.6;font-family:inherit;direction:rtl" readonly></textarea>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:14px;gap:8px;flex-wrap:wrap">'
    +   '<button class="btn btn-primary" id="btn_send_wa_exam_msg">📲 إرسال لواتساب الجروب</button>'
    +   '<button class="btn btn-outline" id="btn_copy_exam_msg">📋 نسخ الرسالة للحافظة</button>'
    +   '<button class="btn" id="btn_close_exam_msg">إغلاق</button>'
    + '</div>'
    + '</div>';

  openModal('📨 تقرير درجات الاختبار كرسالة', modalHTML);

  const selExam = $('#msg_exam_select');
  const selGroup = $('#msg_group_select');
  const selMode = $('#msg_group_mode');
  const txtArea = $('#exam_msg_text');
  const countBadge = $('#msg_students_count_badge');

  function updateMsg(){
    const targetExamId = selExam ? selExam.value : 'all';
    const targetGroupId = selGroup ? selGroup.value : '';
    const groupByMode = selMode ? selMode.value : 'none';
    const res = generateExamReportMessageText(lesson, targetExamId, targetGroupId, groupByMode);
    if(txtArea) txtArea.value = res.text;
    if(countBadge) countBadge.textContent = res.count + ' طالب حاضر ومسجل';
  }

  if(selExam) selExam.onchange = updateMsg;
  if(selGroup) selGroup.onchange = updateMsg;
  if(selMode) selMode.onchange = updateMsg;

  updateMsg();

  $('#btn_copy_exam_msg').onclick = () => {
    if(!txtArea || !txtArea.value){ showToastMessage('⚠️ لا توجد رسالة للنسخ.'); return; }
    navigator.clipboard.writeText(txtArea.value).then(() => {
      showToastMessage('📋 تم نسخ تقرير الاختبار للحافظة بنجاح.');
    }).catch(() => {
      fallbackCopy(txtArea.value);
    });
  };

  $('#btn_send_wa_exam_msg').onclick = () => {
    if(!txtArea || !txtArea.value){ showToastMessage('⚠️ لا توجد رسالة للإرسال.'); return; }
    openWhatsApp(lesson.waGroup, txtArea.value);
  };

  $('#btn_close_exam_msg').onclick = closeModal;
}

function generateExamReportMessageText(lesson, targetExamId, targetGroupId){
  const hiddenList = lesson.hiddenExamStudents || [];
  let students = (lesson.students || []).filter(st => !hiddenList.includes(st.id));
  if(targetGroupId){
    students = students.filter(st => st.examGroupId === targetGroupId);
  }

  const exams = lesson.exams || [];
  const targetGroup = (lesson.examGroups || []).find(g => g.id === targetGroupId);
  const groupLabel = targetGroup ? ('\n👥 المجموعة: ' + targetGroup.name) : '';
  const monthTitle = buildMonthTitle(lesson.monthNumber);

  let text = '';
  let count = 0;

  if(targetExamId !== 'all'){
    const ex = exams.find(e => e.id === targetExamId);
    if(!ex) return { text: '', count: 0 };

    text += '📊 تقرير درجات الاختبار\n';
    text += '📚 الدرس: ' + lesson.name + ' - ' + monthTitle + (lesson.year ? ' ' + lesson.year : '') + '\n';
    text += '📝 الاختبار: ' + ex.name + ' (الدرجة من ' + ex.maxScore + ')' + groupLabel + '\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n';

    students.forEach(st => {
      const isExcluded = !!(lesson.examExclusions && lesson.examExclusions[st.id] && lesson.examExclusions[st.id][ex.id]);
      if(isExcluded) return;
      const scoreVal = lesson.examScores && lesson.examScores[st.id] && lesson.examScores[st.id][ex.id];
      if(scoreVal === undefined || scoreVal === '' || isNaN(Number(scoreVal))) return;

      const sNum = Number(scoreVal);
      const pct = ex.maxScore > 0 ? Math.round((sNum / ex.maxScore) * 100) : 0;
      const note = (lesson.examNotes && lesson.examNotes[st.id] && lesson.examNotes[st.id][ex.id]) || '';

      count++;
      text += count + '. ' + st.name + ' ⬅️ ' + sNum + ' من ' + ex.maxScore + ' (' + pct + '%)' + (note ? ' 📝 [' + note + ']' : '') + '\n';
    });

    if(count === 0){
      text += 'لا توجد درجات مسجلة لطلاب حاضرين في هذا الاختبار حتى الآن.\n';
    }

    text += '━━━━━━━━━━━━━━━━━━━━\n';
    text += '👥 إجمالي الطلاب الحاضرين: ' + count + '\n';
    if(state.settings && state.settings.ownerName) text += 'مع تحيات: ' + state.settings.ownerName;
  } else {
    text += '📊 تقرير درجات اختبارات الشهر\n';
    text += '📚 الدرس: ' + lesson.name + ' - ' + monthTitle + (lesson.year ? ' ' + lesson.year : '') + groupLabel + '\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n';

    students.forEach(st => {
      const studentScores = (lesson.examScores && lesson.examScores[st.id]) || {};
      const exclusions = (lesson.examExclusions && lesson.examExclusions[st.id]) || {};
      const notes = (lesson.examNotes && lesson.examNotes[st.id]) || {};

      let totalScore = 0, totalMax = 0, totalPct = 0, attendedCount = 0;
      const examLines = [];

      exams.forEach(ex => {
        if(exclusions[ex.id]) return;
        const val = studentScores[ex.id];
        if(val !== undefined && val !== '' && !isNaN(Number(val))){
          const sNum = Number(val);
          const pct = ex.maxScore > 0 ? Math.round((sNum / ex.maxScore) * 100) : 0;
          const note = notes[ex.id] || '';
          totalScore += sNum;
          totalMax += ex.maxScore;
          totalPct += pct;
          attendedCount++;
          examLines.push('   ▫️ ' + ex.name + ': ' + sNum + ' من ' + ex.maxScore + ' (' + pct + '%)' + (note ? ' 📝 [' + note + ']' : ''));
        }
      });

      if(attendedCount === 0) return;

      count++;
      const avgPct = Math.round(totalPct / attendedCount);
      text += count + '. ' + st.name + ':\n';
      text += examLines.join('\n') + '\n';
      if(attendedCount > 1){
        text += '   ⬅️ المجموع: ' + totalScore + ' من ' + totalMax + ' (المتوسط ' + avgPct + '%)\n';
      }
      text += '\n';
    });

    if(count === 0){
      text += 'لا توجد درجات مسجلة للطلاب حتى الآن.\n';
    }

    text += '━━━━━━━━━━━━━━━━━━━━\n';
    text += '👥 إجمالي الطلاب المشاركين: ' + count + '\n';
    if(state.settings && state.settings.ownerName) text += 'مع تحيات: ' + state.settings.ownerName;
  }

  return { text: text.trim(), count };
}

function addExamModal(lesson, examToEdit, isArch = false, archIdx = null){
  if(!lesson) lesson = curLesson();
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
    const effectiveArchIdx = (archIdx !== null && archIdx !== undefined) ? archIdx : ((isArch || currentArchiveIdx !== null) ? (Array.isArray(state.archive) ? state.archive.indexOf(lesson) : -1) : -1);
    if(effectiveArchIdx !== -1 && effectiveArchIdx !== null && effectiveArchIdx !== undefined){
      currentArchiveIdx = effectiveArchIdx;
      currentArchiveSubtab = 'exams';
      renderArchiveDetail(effectiveArchIdx);
    } else if(currentArchiveIdx !== null){
      currentArchiveSubtab = 'exams';
      renderArchiveDetail(currentArchiveIdx);
    } else {
      renderExamsTable(lesson);
    }
    closeModal();
    showToastMessage('✅ تم حفظ بيانات الاختبار.');
  };
}
const openAddExamModal = (lesson, examToEdit, isArch, archIdx) => addExamModal(lesson, examToEdit, isArch, archIdx);
try { window.openAddExamModal = openAddExamModal; window.addExamModal = addExamModal; } catch(e){}

/* ---------- 5. التحديد المتعدد ونقل/تكرار الطلاب (Bulk Move / Copy) ---------- */
function bulkMoveStudentsModal(sourceContainer, isCopy, isFromArchive = false, archIdx = null){
  if(!sourceContainer || selectedStudentIds.size === 0) return;
  const isArch = isFromArchive || (archIdx !== null && archIdx !== undefined);
  const sourceName = isArch ? (sourceContainer.lessonName + ' (شهر ' + sourceContainer.monthNumber + '/' + sourceContainer.year + ' - أرشيف)') : sourceContainer.name;

  const activeLessons = (state.lessons || []).map(l => ({
    type: 'lesson',
    id: l.id,
    obj: l,
    label: '📚 ' + l.name + ' (شهر ' + l.monthNumber + '/' + l.year + ')'
  })).filter(item => isArch || item.id !== sourceContainer.id);

  const archiveMonths = (state.archive || []).map((a, aIndex) => ({
    type: 'archive',
    id: 'arch_' + aIndex,
    aIdx: aIndex,
    obj: a,
    label: '📦 ' + (a.lessonName || 'درس') + ' — شهر ' + a.monthNumber + '/' + a.year + ' (' + (a.students ? a.students.length : 0) + ' طالب)'
  })).filter(item => !isArch || item.aIdx !== archIdx);

  const allDestinations = [...activeLessons, ...archiveMonths];

  if(allDestinations.length === 0){
    alert('لا توجد دروس أو شهور أخرى متاحة للنقل أو التكرار إليها.');
    return;
  }

  let html = '<p style="font-size:13px;font-weight:700;margin-bottom:12px">تم تحديد <b style="color:var(--primary)">' + selectedStudentIds.size + '</b> طالب من «' + esc(sourceName) + '».</p>'
    + '<div class="form-row"><label>الوجهة المستهدفة (درس حالي أو شهر مؤرشف)'
    +   '<select id="bm_target_destination" style="font-weight:700;padding:8px">'
    +     (activeLessons.length > 0 ? ('<optgroup label="📚 الدروس الحالية">' + activeLessons.map(d => '<option value="' + d.id + '">' + esc(d.label) + '</option>').join('') + '</optgroup>') : '')
    +     (archiveMonths.length > 0 ? ('<optgroup label="📦 الشهور المؤرشفة">' + archiveMonths.map(d => '<option value="' + d.id + '">' + esc(d.label) + '</option>').join('') + '</optgroup>') : '')
    +   '</select>'
    + '</label></div>'
    + '<div class="form-row" id="bm_group_row"><label>المجموعة في الوجهة المستهدفة'
    +   '<select id="bm_target_group"><option value="">بدون مجموعة</option></select>'
    + '</label></div>'
    + '<div class="form-row" style="margin-top:10px">'
    +   '<label class="switch-row" style="padding:4px 0">'
    +     '<div>'
    +       '<div class="switch-label">ترحيل سجل حضور الشهر أيضاً</div>'
    +       '<div class="muted" style="font-size:11px">إن كانت الحصص متطابقة، تُنقل حالات الحضور والغياب مع الطالب.</div>'
    +     '</div>'
    +     '<label class="switch"><input type="checkbox" id="bm_inc_att"><span class="switch-slider"></span></label>'
    +   '</label>'
    + '</div>'
    + '<div class="modal-actions">'
    +   '<button class="btn btn-primary" id="bm_submit">' + (isCopy ? appIcon('copy', 13) + ' نسخ الطلاب للوجهة المحددة' : appIcon('refresh', 13) + ' نقل الطلاب وحذفهم من الحالي') + '</button>'
    +   '<button class="btn btn-outline" id="bm_cancel">إلغاء</button>'
    + '</div>';

  openModal(isCopy ? '📋 نسخ وتكرار الطلاب' : '🔄 نقل الطلاب بين الدروس والشهور', html);

  function getSelectedDestination(){
    const val = $('#bm_target_destination') ? $('#bm_target_destination').value : '';
    return allDestinations.find(d => d.id === val);
  }

  function updateGroups(){
    const dest = getSelectedDestination();
    const grpSel = $('#bm_target_group');
    if(!dest || !grpSel) return;
    const targetObj = dest.obj;
    const groups = (targetObj.groups || (dest.type === 'archive' && state.lessons.find(l => l.id === targetObj.lessonId)?.groups)) || [];
    let opts = '<option value="">بدون مجموعة</option>';
    groups.forEach(g => {
      opts += '<option value="' + esc(g.id) + '">' + esc(g.name) + '</option>';
    });
    grpSel.innerHTML = opts;
  }

  if($('#bm_target_destination')) $('#bm_target_destination').onchange = updateGroups;
  updateGroups();

  $('#bm_cancel').onclick = closeModal;

  $('#bm_submit').onclick = () => {
    const dest = getSelectedDestination();
    if(!dest) return;
    const targetObj = dest.obj;
    const isTargetArchive = dest.type === 'archive';
    const targetGid = $('#bm_target_group').value;
    const incAtt = $('#bm_inc_att') ? $('#bm_inc_att').checked : false;

    const sourceStudents = Array.isArray(sourceContainer.students) ? sourceContainer.students : archiveStudents(sourceContainer);
    const toProcess = sourceStudents.filter(st => selectedStudentIds.has(st.id));
    if(toProcess.length === 0){
      alert('لم يتم تحديد أي طلاب.');
      return;
    }

    if(!Array.isArray(targetObj.students)){
      targetObj.students = JSON.parse(JSON.stringify(archiveStudents(targetObj)));
    }

    // فحص الأسماء المكررة في الوجهة المستهدفة
    const existingDuplicates = [];
    const studentsToTransfer = [];

    toProcess.forEach(st => {
      const isDup = targetObj.students.some(x => normalizeForSearch(x.name) === normalizeForSearch(st.name));
      if(isDup){
        existingDuplicates.push(st.name);
      } else {
        studentsToTransfer.push(st);
      }
    });

    if(studentsToTransfer.length === 0){
      alert('⚠️ تعذّر النقل / النسخ:\nجميع الطلاب المحددين موجودون بالفعل بنفس الأسماء في الوجهة المستهدفة (' + existingDuplicates.join('، ') + ').');
      return;
    }

    if(existingDuplicates.length > 0){
      const proceed = confirm('تنبيه: تم تخطي (' + existingDuplicates.length + ') طالب لأنهم موجودون بالفعل في الوجهة المستهدفة:\n' + existingDuplicates.join('، ') + '\n\nهل ترغب في متابعة نقل / نسخ باقي الطلاب (' + studentsToTransfer.length + ' طالب)؟');
      if(!proceed) return;
    }

    // إتمام النقل أو النسخ
    studentsToTransfer.forEach(st => {
      const cloned = JSON.parse(JSON.stringify(st));
      cloned.id = uid('st');
      cloned.groupId = targetGid || '';
      targetObj.students.push(cloned);

      if(!targetObj.records) targetObj.records = {};
      targetObj.records[cloned.id] = {};

      if(incAtt && sourceContainer.records && sourceContainer.records[st.id]){
        (targetObj.sessions || []).forEach(ts => {
          const matchingSourceSession = (sourceContainer.sessions || []).find(ss => ss.date === ts.date || ss.label === ts.label);
          if(matchingSourceSession && sourceContainer.records[st.id][matchingSourceSession.id]){
            targetObj.records[cloned.id][ts.id] = JSON.parse(JSON.stringify(sourceContainer.records[st.id][matchingSourceSession.id]));
          }
        });
      }
    });

    // إذا كان نقل وليس نسخ: حذف من المصدر
    if(!isCopy){
      const movedIds = new Set(studentsToTransfer.map(s => s.id));
      sourceContainer.students = sourceContainer.students.filter(s => !movedIds.has(s.id));
      if(sourceContainer.records){
        movedIds.forEach(sid => {
          delete sourceContainer.records[sid];
          if(sourceContainer.examScores) delete sourceContainer.examScores[sid];
          if(sourceContainer.examNotes) delete sourceContainer.examNotes[sid];
          if(sourceContainer.examExclusions) delete sourceContainer.examExclusions[sid];
        });
      }
    }

    selectedStudentIds.clear();
    isBulkSelecting = false;
    saveState();
    closeModal();

    if(isArch && archIdx !== null) renderArchiveDetail(archIdx);
    else renderAll();

    showToastMessage('✅ تم ' + (isCopy ? 'نسخ' : 'نقل') + ' (' + studentsToTransfer.length + ') طالب إلى «' + dest.label + '» بنجاح.');
  };
}

function renderTgBotsList(){
  const container = $('#tgBotsList');
  if(!container) return;
  const bots = state.settings.tgBots || [];
  if(bots.length === 0){
    container.innerHTML = '<p class="muted" style="font-size:12px;margin:6px 0">لم يتم حفظ أي بوتات إضافية بعد. يمكنك إضافة بوت تيليجرام لإرسال النسخ الاحتياطية إليه مباشرة.</p>';
    return;
  }
  const activeId = state.settings.activeTgBotId || (bots[0] ? bots[0].id : null);
  container.innerHTML = bots.map(b => {
    const isAct = b.id === activeId;
    return '<div class="tg-bot-item' + (isAct ? ' active' : '') + '" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border:1px solid ' + (isAct ? 'var(--primary)' : 'var(--border)') + ';border-radius:8px;margin-bottom:6px;background:' + (isAct ? '#f0f4ff' : '#fff') + '">'
      + '<div>'
      +   '<div style="font-weight:800;font-size:13px">' + (isAct ? '⭐ ' : '') + esc(b.name) + '</div>'
      +   '<div class="muted" style="font-size:11px">Chat ID: ' + esc(b.chatId) + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:6px">'
      +   (!isAct ? '<button class="btn btn-sm btn-outline" data-act="set-active-bot" data-id="' + b.id + '" style="font-size:11px;padding:2px 8px">تعيين كافتراضي</button>' : '<span class="badge" style="font-size:11px;background:var(--primary);color:#fff;padding:2px 8px;border-radius:4px">الافتراضي</span>')
      +   '<button class="btn btn-sm btn-outline" data-act="edit-bot" data-id="' + b.id + '" style="font-size:11px;padding:2px 6px" title="تعديل">✏️</button>'
      +   '<button class="btn btn-sm btn-outline" data-act="del-bot" data-id="' + b.id + '" style="font-size:11px;padding:2px 6px;color:#b91c1c" title="حذف">🗑️</button>'
      + '</div>'
      + '</div>';
  }).join('');
}

function addTgBotModal(botToEdit){
  const isEdit = !!botToEdit;
  const html = '<div class="form-row"><label>اسم البوت أو الدردشة<input id="bot_name" type="text" value="' + esc(isEdit ? botToEdit.name : '') + '" placeholder="مثال: بوت الحصص الأساسي / محادثة المشرف..."></label></div>'
    + '<div class="form-row"><label>Telegram Bot Token<input id="bot_token" type="text" dir="ltr" value="' + esc(isEdit ? botToEdit.token : '') + '" placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"></label></div>'
    + '<div class="form-row"><label>Chat ID (معرف الدردشة أو القناة)<input id="bot_chat" type="text" dir="ltr" value="' + esc(isEdit ? botToEdit.chatId : '') + '" placeholder="مثال: 987654321 أو -100123456789"></label></div>'
    + '<div class="modal-actions">'
    +   '<button class="btn btn-primary" id="bot_save">' + (isEdit ? 'حفظ التعديلات' : 'إضافة البوت') + '</button>'
    +   '<button class="btn btn-outline" id="bot_cancel">إلغاء</button>'
    + '</div>';

  openModal(isEdit ? '✏️ تعديل بوت تيليجرام' : '➕ إضافة بوت / محادثة تيليجرام', html);
  $('#bot_cancel').onclick = closeModal;

  $('#bot_save').onclick = () => {
    const name = ($('#bot_name').value || '').trim();
    const token = ($('#bot_token').value || '').trim();
    const chatId = ($('#bot_chat').value || '').trim();

    if(!name){ alert('يرجى كتابة اسم تعريفي للبوت أو الدردشة.'); return; }
    if(!token || !chatId){ alert('يرجى إدخال كل من Bot Token و Chat ID.'); return; }

    if(!Array.isArray(state.settings.tgBots)) state.settings.tgBots = [];

    if(isEdit){
      botToEdit.name = name;
      botToEdit.token = token;
      botToEdit.chatId = chatId;
    } else {
      const newBot = { id: uid('bot'), name, token, chatId };
      state.settings.tgBots.push(newBot);
      if(state.settings.tgBots.length === 1 || !state.settings.activeTgBotId){
        state.settings.activeTgBotId = newBot.id;
      }
    }

    const curAct = state.settings.tgBots.find(b => b.id === state.settings.activeTgBotId) || state.settings.tgBots[0];
    if(curAct){
      state.settings.tgBotToken = curAct.token;
      state.settings.tgChatId = curAct.chatId;
    }

    saveState();
    renderTgBotsList();
    closeModal();
    showToastMessage('✅ تم حفظ بيانات البوت بنجاح.');
  };
}

async function cloudShareBackup(){
  const safeState = sanitizeExportState(state);
  const jsonStr = JSON.stringify(safeState, null, 2);
  const fileName = 'نسخة_احتياطية_Daftar_' + todayStr() + '.json';
  
  if(typeof navigator !== 'undefined' && navigator.share && navigator.canShare){
    try {
      const file = new File([jsonStr], fileName, { type: 'application/json' });
      if(navigator.canShare({ files: [file] })){
        await navigator.share({
          title: 'نسخة احتياطية - تطبيق دفتر',
          text: 'ملف النسخة الاحتياطية لتطبيق دفتر بتاريخ ' + todayStr(),
          files: [file]
        });
        showToastMessage('✅ تمت المشاركة بنجاح.');
        return;
      }
    } catch(e){
      if(e.name !== 'AbortError'){
        console.error(e);
      } else {
        return;
      }
    }
  }
  
  exportBackup();
  showToastMessage('⬇️ تم تنزيل النسخة الاحتياطية على جهازك لمشاركتها.');
}

async function telegramBackup(){
  const bots = state.settings.tgBots || [];
  if(bots.length === 0 && (!state.settings.tgBotToken || !state.settings.tgChatId)){
    addTgBotModal();
    return;
  }

  let activeBot = bots.find(b => b.id === state.settings.activeTgBotId) || bots[0];
  if(!activeBot && state.settings.tgBotToken && state.settings.tgChatId){
    activeBot = { id: 'default', name: 'البوت الأساسي', token: state.settings.tgBotToken, chatId: state.settings.tgChatId };
  }

  const lessons = state.lessons || [];
  const archives = state.archive || [];
  const totalStudents = lessons.reduce((sum, l) => sum + (l.students ? l.students.length : 0), 0);

  let botSelectorHTML = '';
  if(bots.length > 0){
    botSelectorHTML = '<div class="form-row" style="margin-bottom:12px">'
      + '<label style="font-weight:800;font-size:12.5px;display:flex;justify-content:space-between;align-items:center">'
      +   '<span>' + appIcon('bot', 14) + ' إرسال عبر البوت / المحادثة:</span>'
      +   '<button type="button" class="btn btn-sm btn-outline" id="tg_modal_add_bot" style="font-size:11px;padding:2px 8px">' + appIcon('plus', 11) + ' إضافة بوت آخر</button>'
      + '</label>'
      + '<select id="tg_modal_bot_select" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-weight:700">'
      +   bots.map(b => '<option value="' + b.id + '"' + (b.id === (activeBot ? activeBot.id : '') ? ' selected' : '') + '>' + esc(b.name) + ' (Chat ID: ' + esc(b.chatId) + ')</option>').join('')
      + '</select>'
      + '</div>';
  }

  const expName = state.settings.lastTgExporter || state.settings.ownerName || '';
  let modalHTML = '<div class="reset-box" style="line-height:1.6;text-align:right">'
    + botSelectorHTML
    + '<div class="form-row" style="margin-bottom:12px">'
    +   '<label style="font-weight:800;font-size:12.5px;display:block;margin-bottom:4px">'
    +     appIcon('user', 13) + ' اسم المُصدِّر / المعلم (يظهر في رسالة تيليجرام):'
    +   '</label>'
    +   '<input type="text" id="tg_exporter_name" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-weight:700" placeholder="مثال: أ/ أحمد صابر" value="' + esc(expName) + '">'
    + '</div>'
    + '<p style="font-size:13px;color:var(--text);margin-bottom:12px">'
    +   'حدد البيانات التي ترغب في تصديرها وإرسالها إلى محادثتك على تيليجرام:'
    + '</p>'
    + '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">'
    +   '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;background:#fff;border:1px solid var(--border);border-radius:10px;padding:10px 12px">'
    +     '<input type="radio" name="tg_scope" value="all" checked id="tg_scope_all" style="margin-top:3px">'
    +     '<div>'
    +       '<div style="font-weight:800;font-size:13px;color:var(--text)">' + appIcon('archive', 13) + ' النسخة الكاملة للتطبيق</div>'
    +       '<div class="muted" style="font-size:11px;margin-top:2px">تشمل كل الدروس (' + lessons.length + ')، وجميع الطلاب (' + totalStudents + ')، والأرشيف، والإعدادات.</div>'
    +     '</div>'
    +   '</label>'
    +   '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;background:#fff;border:1px solid var(--border);border-radius:10px;padding:10px 12px">'
    +     '<input type="radio" name="tg_scope" value="selected" id="tg_scope_selected" style="margin-top:3px">'
    +     '<div>'
    +       '<div style="font-weight:800;font-size:13px;color:var(--text)">' + appIcon('book', 13) + ' تحديد درس أو دروس حالية معينة</div>'
    +       '<div class="muted" style="font-size:11px;margin-top:2px">اختر درساً محدداً أو عدة دروس مع خيار تصدير الشهر الحالي فقط أو مع الأرشيف.</div>'
    +     '</div>'
    +   '</label>'
    +   '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;background:#fff;border:1px solid var(--border);border-radius:10px;padding:10px 12px">'
    +     '<input type="radio" name="tg_scope" value="archive" id="tg_scope_archive" style="margin-top:3px">'
    +     '<div>'
    +       '<div style="font-weight:800;font-size:13px;color:var(--text)">' + appIcon('folder', 13) + ' تصدير شهر مؤرشف معين (من الأرشيف)</div>'
    +       '<div class="muted" style="font-size:11px;margin-top:2px">اختر شهراً مؤرشفاً مستقلاً لإرساله كملف .daftar-month عبر بوت تيليجرام.</div>'
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
            +   '<button type="button" class="btn btn-sm btn-outline" id="tg_btn_deselect_all" style="font-size:11px;padding:2px 8px">إلغاء</button>'
            + '</div>'
            + '</div>'
            + '<div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto;padding-right:4px">'
            +   lessons.map(l => {
                  const lArchCount = archives.filter(a => a.lessonId === l.id).length;
                  return '<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;cursor:pointer;background:#fff;padding:6px 8px;border-radius:6px;border:1px solid var(--border)">'
                    + '<input type="checkbox" class="tg-lesson-cb" value="' + l.id + '" checked style="accent-color:var(--primary)">'
                    + '<span>' + esc(l.name) + ' <small class="muted">(' + (l.students ? l.students.length : 0) + ' طالب' + (lArchCount > 0 ? ' · ' + lArchCount + ' أرشيف' : '') + ')</small></span>'
                    + '</label>';
                }).join('')
            + '</div>'
            + '<div style="margin-top:10px;padding:8px 10px;background:#fff;border:1px solid var(--border);border-radius:8px">'
            +   '<div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:6px">' + appIcon('archive', 13) + ' خيارات الشهور المؤرشفة للدروس المحددة:</div>'
            +   '<div style="display:flex;flex-direction:column;gap:6px">'
            +     '<label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;cursor:pointer">'
            +       '<input type="radio" name="tg_lesson_archive_choice" value="current_only" checked style="accent-color:var(--primary)">'
            +       '<span>' + appIcon('file-text', 13) + ' تصدير الشهر الحالي فقط (ملف خفيف بدون الشهور المؤرشفة)</span>'
            +     '</label>'
            +     '<label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;cursor:pointer">'
            +       '<input type="radio" name="tg_lesson_archive_choice" value="with_archives" style="accent-color:var(--primary)">'
            +       '<span>' + appIcon('archive', 13) + ' تصدير شامل (الشهر الحالي + كافة الشهور المؤرشفة المتاحة)</span>'
            +     '</label>'
            +   '</div>'
            + '</div>'
        )
    + '</div>'
    + '<div id="tg_archive_picker" style="display:none;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:14px">'
    +   (archives.length === 0
          ? '<p class="muted" style="font-size:12px;margin:0">لا توجد شهور مؤرشفة حالياً في الأرشيف.</p>'
          : '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
            + '<span style="font-size:12px;font-weight:800">اختر الشهر المؤرشف:</span>'
            + '</div>'
            + '<div style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;padding-right:4px">'
            +   archives.map((a, aIdx) => '<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;cursor:pointer;background:#fff;padding:8px 10px;border-radius:6px;border:1px solid var(--border)">'
                  + '<input type="radio" name="tg_arch_radio" value="' + aIdx + '"' + (aIdx === 0 ? ' checked' : '') + ' style="accent-color:var(--primary)">'
                  + '<span>' + appIcon('folder', 13) + ' ' + esc(a.lessonName || 'درس') + ' — شهر ' + a.monthNumber + '/' + a.year + ' (' + (a.students ? a.students.length : 0) + ' طالب · ' + (a.sessions ? a.sessions.length : 0) + ' حصص)</span>'
                  + '</label>').join('')
            + '</div>'
        )
    + '</div>'
    + '<div class="modal-actions">'
    +   '<button class="btn btn-primary" id="tg_btn_proceed">' + appIcon('send', 13) + ' إرسال إلى تيليجرام الآن</button>'
    +   '<button class="btn btn-outline" id="tg_btn_cancel">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('🚀 إرسال نسخة إلى تيليجرام الآن', modalHTML);

  if($('#tg_modal_add_bot')){
    $('#tg_modal_add_bot').onclick = () => {
      closeModal();
      addTgBotModal();
    };
  }

  const scopeAll = $('#tg_scope_all');
  const scopeSel = $('#tg_scope_selected');
  const scopeArch = $('#tg_scope_archive');
  const picker = $('#tg_lessons_picker');
  const archPicker = $('#tg_archive_picker');

  function updatePickerVis(){
    if(picker) picker.style.display = (scopeSel && scopeSel.checked) ? 'block' : 'none';
    if(archPicker) archPicker.style.display = (scopeArch && scopeArch.checked) ? 'block' : 'none';
  }
  if(scopeAll) scopeAll.onchange = updatePickerVis;
  if(scopeSel) scopeSel.onchange = updatePickerVis;
  if(scopeArch) scopeArch.onchange = updatePickerVis;

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
    let chosenToken = state.settings.tgBotToken || '';
    let chosenChatId = state.settings.tgChatId || '';

    const botSel = $('#tg_modal_bot_select');
    if(botSel && botSel.value){
      const foundBot = bots.find(b => b.id === botSel.value);
      if(foundBot){
        chosenToken = foundBot.token;
        chosenChatId = foundBot.chatId;
        state.settings.activeTgBotId = foundBot.id;
        state.settings.tgBotToken = foundBot.token;
        state.settings.tgChatId = foundBot.chatId;
        saveState();
      }
    }

    if(!chosenToken || !chosenChatId){
      alert('يرجى تحديد أو إضافة بوت صالح به Bot Token و Chat ID.');
      return;
    }

    const expNameInput = $('#tg_exporter_name');
    const exporterName = expNameInput ? expNameInput.value.trim() : '';
    if(exporterName){
      state.settings.lastTgExporter = exporterName;
      saveState();
    }
    const exporterLine = exporterName ? ('\n👤 تم التصدير بواسطة: ' + exporterName) : '';

    const isSelected = scopeSel && scopeSel.checked;
    const isArchive = scopeArch && scopeArch.checked;
    let exportData, fn, caption;

    if(isArchive){
      const checkedArchRadio = $('input[name="tg_arch_radio"]:checked');
      if(!checkedArchRadio || !archives.length){
        alert('يرجى اختيار شهر مؤرشف لتصديره.');
        return;
      }
      const aIdx = parseInt(checkedArchRadio.value, 10);
      const singleA = archives[aIdx];
      if(!singleA){
        alert('الشهر المؤرشف غير موجود.');
        return;
      }
      exportData = {
        type: 'daftar_single_month',
        app: 'Daftar',
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        isSingleMonthExport: true,
        archiveMonth: singleA,
        archive: singleA,
        settings: {
          statuses: state.settings.statuses,
          customFields: state.settings.customFields
        }
      };
      const safeName = (singleA.lessonName || 'lesson').replace(/[\s\/\\:?*"<>|]+/g, '_');
      fn = 'daftar-month-' + safeName + '-M' + singleA.monthNumber + '_' + singleA.year + '-' + todayStr() + '.daftar-month';
      caption = '📁 تصدير شهر مؤرشف من تطبيق دفتر: ' + (singleA.lessonName || 'درس')
        + '\n📅 الشهر: ' + singleA.monthNumber + '/' + singleA.year
        + '\n👥 عدد الطلاب: ' + (singleA.students ? singleA.students.length : 0)
        + '\n🗓️ عدد الحصص: ' + (singleA.sessions ? singleA.sessions.length : 0)
        + exporterLine;
    } else if(isSelected){
      const checkedIds = $$('.tg-lesson-cb:checked').map(cb => cb.value);
      if(checkedIds.length === 0){
        alert('يرجى تحديد درس واحد على الأقل لتصديره إلى تيليجرام.');
        return;
      }
      const archiveChoice = $('input[name="tg_lesson_archive_choice"]:checked') ? $('input[name="tg_lesson_archive_choice"]:checked').value : 'current_only';
      const includeArchives = (archiveChoice === 'with_archives');
      const selectedLessons = lessons.filter(l => checkedIds.includes(l.id));

      if(selectedLessons.length === 1){
        const singleL = selectedLessons[0];
        const singleArchives = includeArchives ? (state.archive || []).filter(a => a.lessonId === singleL.id) : [];
        exportData = {
          type: 'daftar-lesson',
          version: state.version || 6,
          exportedAt: new Date().toISOString(),
          includeArchives: includeArchives,
          lesson: singleL,
          archives: singleArchives,
          settings: sanitizeExportState(state.settings)
        };
        const safeName = (singleL.name || 'lesson').replace(/[\s\/\\:?*"<>|]+/g, '_');
        fn = (includeArchives ? 'daftar-lesson-' + safeName + '-full-archive-' : 'daftar-lesson-' + safeName + '-month' + singleL.monthNumber + '_') + todayStr() + '.json';
        caption = '📦 نسخة درس من تطبيق دفتر: ' + singleL.name
          + '\n📅 التاريخ: ' + todayStr()
          + '\n👥 عدد الطلاب: ' + (singleL.students ? singleL.students.length : 0)
          + '\n🗓️ عدد الحصص: ' + (singleL.sessions ? singleL.sessions.length : 0)
          + (includeArchives ? ('\n📁 الشهور المؤرشفة: ' + singleArchives.length + ' شهر') : '\n📄 نوع التصدير: الشهر الحالي فقط (بدون أرشيف)')
          + exporterLine;
      } else {
        const checkedLessonIds = selectedLessons.map(l => l.id);
        const selectedArchives = includeArchives ? (state.archive || []).filter(a => checkedLessonIds.includes(a.lessonId)) : [];
        exportData = {
          type: 'daftar_lessons_export',
          version: state.version || 6,
          exportedAt: new Date().toISOString(),
          includeArchives: includeArchives,
          lessons: selectedLessons,
          archives: selectedArchives,
          archive: selectedArchives,
          settings: sanitizeExportState(state.settings)
        };
        fn = 'daftar-' + selectedLessons.length + '-lessons-' + (includeArchives ? 'with-archive-' : 'current-only-') + todayStr() + '.json';
        caption = '📦 نسخة دروس مختارة من تطبيق دفتر (' + selectedLessons.length + ' دروس)'
          + '\n📅 التاريخ: ' + todayStr()
          + '\n📚 الدروس: ' + selectedLessons.map(l => l.name).join('، ')
          + (includeArchives ? ('\n📁 تم تضمين ' + selectedArchives.length + ' شهر مؤرشف') : '\n📄 نوع التصدير: الشهور الحالية فقط (بدون أرشيف)')
          + exporterLine;
      }
    } else {
      // الحفظ الكامل في تيليجرام يحتفظ بكافة البوتات لتمكين استعادتها
      exportData = state;
      fn = 'daftar-backup-' + todayStr() + '.json';
      caption = '📦 نسخة احتياطية كاملة من تطبيق دفتر'
        + '\n📅 التاريخ: ' + todayStr()
        + '\n📚 عدد الدروس: ' + lessons.length
        + '\n👥 إجمالي الطلاب: ' + totalStudents
        + exporterLine;
    }

    closeModal();
    executeTelegramUpload(chosenToken, chosenChatId, JSON.stringify(exportData, null, 2), fn, caption);
  };
}
async function executeTelegramUpload(token, chatId, content, filename, caption){
  const cleanToken = (token || '').trim();
  const cleanChatId = (chatId || '').trim();
  if(!cleanToken || !cleanChatId){
    showToastMessage('❌ خطأ: يرجى التأكد من كتابة Bot Token و Chat ID بشكل صحيح.');
    return;
  }
  showToastMessage('⏳ جاري إرسال النسخة عبر بوت تيليجرام...');
  try {
    const blob = new Blob([content], { type: 'application/json' });
    const formData = new FormData();
    formData.append('chat_id', cleanChatId);
    formData.append('document', blob, filename);
    if(caption) formData.append('caption', caption);

    const res = await fetch('https://api.telegram.org/bot' + encodeURIComponent(cleanToken) + '/sendDocument', {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if(result && result.ok){
      showToastMessage('🚀 تم إرسال الملف بنجاح إلى تيليجرام!');
      if($('#tgStatus')) $('#tgStatus').textContent = '✅ تم الإرسال بنجاح في ' + new Date().toLocaleTimeString('ar-EG');
    } else {
      const errMsg = (result && result.description) ? result.description : 'فشل الإرسال';
      alert('❌ فشل الإرسال إلى تيليجرام:\n' + errMsg + '\n\nتأكد من صحة التوكن ورقم المحادثة (Chat ID) وأن البوت مضاف في المحادثة أو الجروب ومعه صلاحية الإرسال.');
      if($('#tgStatus')) $('#tgStatus').textContent = '❌ فشل الإرسال: ' + errMsg;
    }
  } catch(err) {
    console.error(err);
    alert('❌ تعذّر الاتصال بخوادم تيليجرام. تأكد من اتصال الإنترنت وصلاحيات البوت.');
    if($('#tgStatus')) $('#tgStatus').textContent = '❌ تعذّر الاتصال بالإنترنت';
  }
}

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
    +     '<div class="reset-opt-title">' + appIcon('key', 14) + ' تصفير كلمة سر قسم الدخل والأمان</div>'
    +     '<button class="btn btn-sm btn-outline" id="btnResetPassword">تصفير كلمة السر</button>'
    +   '</div>'
    +   '<div class="reset-opt-desc">يتطلب إدخال كود التفعيل المعتمد (من المطور) لمحو كلمة سر الدخل الحالية وسؤال الأمان، دون المساس بأي من الدروس أو الطلاب.</div>'
    + '</div>'

    // 2. ريست درس محدد
    + '<div class="reset-opt-card">'
    +   '<div class="reset-opt-title">' + appIcon('book', 14) + ' تصفير درس محدد بالكامل</div>'
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
    +     '<div class="reset-opt-title">' + appIcon('settings', 14) + ' إعادة ضبط الإعدادات فقط</div>'
    +     '<button class="btn btn-sm btn-outline" id="btnResetSettings">استرجاع الإعدادات الافتراضية</button>'
    +   '</div>'
    +   '<div class="reset-opt-desc">يسترجع الحالات الافتراضية والألوان ومؤشرات الغياب وعناوين الأعمدة الأصلية، مع الحفاظ الكامل على كافة الدروس والطلاب والأرشيف.</div>'
    + '</div>'

    // 4. ريست شامل للتطبيق
    + '<div class="reset-opt-card" style="border-color:#fca5a5;background:#fff5f5">'
    +   '<div class="reset-opt-head">'
    +     '<div class="reset-opt-title" style="color:#b91c1c">' + appIcon('alert', 14) + ' إعادة ضبط المصنع الشاملة</div>'
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

/* تصفية فورية وسريعة لجدول الدرس مع دعم إعادة البناء وتحديث التصفح */
function fastFilterLessonSearch(){
  const rawVal = (lessonFilterQuery || '').trim();
  const clearBtn = $('#clearLessonSearch');
  if(clearBtn){
    clearBtn.style.display = rawVal ? 'block' : 'none';
  }
  lessonCurrentPage = 1;
  renderLessonDetail();
}

function fastFilterArchiveSearch(){
  const rawVal = (archiveFilterQuery || '').trim();
  const fqN = normalizeForSearch(rawVal);
  const clearBtn = $('#clearArchiveSearch');
  if(clearBtn){
    clearBtn.style.display = rawVal ? 'block' : 'none';
  }

  const isNumSearch = /^\d+$/.test(rawVal);
  const searchNum = isNumSearch ? parseInt(rawVal, 10) : null;

  // حدد الجدول المناسب حسب التابّ
  const tableId = (currentArchiveSubtab === 'exams') ? '#archExamsTable' : '#archAttendanceTable';
  const rows = $$(tableId + ' tbody tr[data-sid]');

  rows.forEach((tr, i) => {
    if(!rawVal){
      tr.style.display = '';
      return;
    }
    // البحث بالرقم (ترتيب)
    const numMatch = (searchNum !== null && (i + 1) === searchNum);
    // البحث بالنص مباشرة من data-attributes المضافة في الصف
    const nameNorm = tr.dataset.nameNorm || '';
    const phone = tr.dataset.phone || '';
    const textMatch = (nameNorm && nameNorm.includes(fqN)) ||
      (phone && phone.includes(rawVal.toLowerCase()));
    tr.style.display = (numMatch || textMatch) ? '' : 'none';
  });
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
  $('#lessonMeta').textContent = esc(scheduleLabel(L)) + ' · ' + L.students.length + ' طالب · شهر ' + L.monthNumber + '/' + L.year + (L.subscription ? ' · اشتراك شهري' : '') + ((L.groups && L.groups.length) ? ' · ' + L.groups.length + ' مجموعة' : '');

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
      incEl.innerHTML = appIcon('wallet', 13) + ' التحصيل: <b>' + moneyDisplay(totalCollected) + ' / ' + moneyDisplay(total) + ' ج.م</b>';
      incEl.style.display = '';
    } else {
      incEl.style.display = 'none';
    }
  }

  renderGroupFilter(L);

  // فلترة حسب البحث الداخلي والمجموعة
  if(!Array.isArray(L.hiddenStudents)) L.hiddenStudents = [];
  const hiddenStudentList = L.hiddenStudents || [];
  const hiddenBtn = $('#hiddenStudentsBtn');
  if(hiddenBtn){
    if(hiddenStudentList.length > 0){
      hiddenBtn.style.display = 'inline-flex';
      const countEl = $('#hiddenCount');
      if(countEl) countEl.textContent = hiddenStudentList.length;
    } else {
      hiddenBtn.style.display = 'none';
    }
  }
  let students = L.students.filter(st => !hiddenStudentList.includes(st.id));
  if(groupFilterQuery === '__none__') students = students.filter(st => !st.groupId);
  else if(groupFilterQuery) students = students.filter(st => st.groupId === groupFilterQuery);
  const fq = lessonFilterQuery.trim().toLowerCase();
  const fqN = normalizeForSearch(lessonFilterQuery);
  if(fq){
    const numQ = parseInt(fq, 10);
    const isNum = !isNaN(numQ) && String(numQ) === fq;
    students = students.filter(st => {
      if(isNum && (L.students.findIndex(x => x.id === st.id) + 1) === numQ) return true;
      const nameMatch = fqN ? normalizeForSearch(st.name).includes(fqN) : false;
      return nameMatch || (st.phone||'').includes(fq) || (st.guardianPhone||'').includes(fq) || (st.extraPhones||[]).some(p => p.includes(fq)) || (st.guardianExtraPhones||[]).some(p => p.includes(fq));
    });
  }
  const clearLessonBtn = $('#clearLessonSearch');
  if(clearLessonBtn) clearLessonBtn.style.display = fq ? 'block' : 'none';

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
    bulkBtn.innerHTML = isBulkSelecting ? (appIcon('check-square', 13) + ' إنهاء التحديد') : (appIcon('check-square', 13) + ' تحديد متعدد');
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

  // Pagination for large student list
  const totalStudentsCount = students.length;
  let pagedStudents = students;
  let totalPages = 1;
  if(tablePageSize > 0 && totalStudentsCount > tablePageSize){
    totalPages = Math.ceil(totalStudentsCount / tablePageSize);
    if(lessonCurrentPage > totalPages) lessonCurrentPage = totalPages;
    if(lessonCurrentPage < 1) lessonCurrentPage = 1;
    const startIdx = (lessonCurrentPage - 1) * tablePageSize;
    pagedStudents = students.slice(startIdx, startIdx + tablePageSize);
  } else {
    lessonCurrentPage = 1;
  }

  const pagWrapTop = $('#lessonPagWrapTop');
  const pagWrapBottom = $('#lessonPagWrapBottom');
  const pagHtml = renderPaginationBarHTML(lessonCurrentPage, totalPages, totalStudentsCount, tablePageSize, 'lesson');
  if(pagWrapTop) pagWrapTop.innerHTML = pagHtml;
  if(pagWrapBottom) pagWrapBottom.innerHTML = pagHtml;

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
       + (s.event ? '<span class="week-event" title="اضغط لتعديل الحدث" data-act="edit-session-event" data-id="'+s.id+'">' + appIcon('file-text', 11) + ' ' + esc(s.event) + '</span>' : '')
       + '<div class="week-tools">'
       + (sIdx > 0 ? '<button class="mini-btn" data-act="shift-session-left" data-id="'+s.id+'" title="تحريك لليمين (سابق)">' + appIcon('chevron-right', 11) + '</button>' : '')
       + (sIdx < L.sessions.length - 1 ? '<button class="mini-btn" data-act="shift-session-right" data-id="'+s.id+'" title="تحريك لليسار (تالي)">' + appIcon('chevron-left', 11) + '</button>' : '')
       + '<button class="mini-btn" data-act="bulk-attendance" data-id="'+s.id+'" title="التحضير السريع الجماعي للحصة">' + appIcon('zap', 11) + '</button>'
       + '<button class="mini-btn mini-edit" data-act="edit-session-event" data-id="'+s.id+'" title="حدث الحصة">' + appIcon('file-text', 11) + '</button>'
       + '<button class="mini-btn mini-wa" data-act="session-summary" data-id="'+s.id+'" title="ملخص واتساب">' + appIcon('share', 11) + '</button>'
       + '<button class="del-week" data-act="del-session" data-id="'+s.id+'" title="حذف الحصة">' + appIcon('x', 11) + '</button>'
       + '</div>'
       + '</div></th>';
  });
  h += '<th>' + esc(sd.notesLabel) + '</th></tr>';
  head.innerHTML = h;

  let b = '';
  pagedStudents.forEach(st => {
    const realIdx = L.students.findIndex(x => x.id === st.id);
    const g = (L.groups||[]).find(x => x.id === st.groupId);
    const ps = pastSessions(L.sessions);
    const stPct = ps.length ? Math.round(ps.filter(s => (L.records[st.id]||{})[s.id] && isPresentStatus(L.records[st.id][s.id].status, eff)).length / ps.length * 100) : 0;
    const ind = ps.length > 0 ? attendanceIndicator(stPct) : null;

    let payPillHTML = '';
    if(L.subscription){
      const subPrice = L.price || 0;
      const payments = st.payments || [];
      const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) + (st.paid && payments.length === 0 ? subPrice : 0);
      const remaining = Math.max(0, subPrice - totalPaid);
      let pillClass = 'pay-pill-none', pillText = appIcon('x', 11) + ' غير مسدد';
      if(totalPaid >= subPrice && subPrice > 0){
        pillClass = 'pay-pill-full';
        pillText = appIcon('check', 11) + ' مسدد (' + totalPaid + ')';
      } else if(totalPaid > 0){
        pillClass = 'pay-pill-part';
        pillText = appIcon('clock', 11) + ' مدفوع ' + totalPaid + (remaining > 0 ? ' (باقي ' + remaining + ')' : '');
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
       +   (L.subscription && st.guardianPhone ? '<div class="student-phone">ولي الأمر: ' + esc(st.guardianPhone) + ' <a class="mini-btn mini-call" href="tel:'+esc(st.guardianPhone)+'">' + appIcon('phone', 11) + ' اتصال</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+st.id+'" data-phone="'+esc(st.guardianPhone)+'">' + appIcon('whatsapp', 11) + ' واتساب</button></div>' : '')
       +   ((st.guardianExtraPhones||[]).map(p => '<div class="student-phone">' + esc(p) + ' <a class="mini-btn mini-call" href="tel:'+esc(p)+'">' + appIcon('phone', 11) + ' اتصال</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+st.id+'" data-phone="'+esc(p)+'">' + appIcon('whatsapp', 11) + ' واتساب</button></div>').join(''))
       +   ((st.extraPhones||[]).map(p => '<div class="student-phone">' + esc(p) + ' <a class="mini-btn mini-call" href="tel:'+esc(p)+'">' + appIcon('phone', 11) + ' اتصال</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+st.id+'" data-phone="'+esc(p)+'">' + appIcon('whatsapp', 11) + ' واتساب</button></div>').join(''))
       +   '<div class="student-actions">'
       +     '<button class="mini-btn mini-move" data-act="move-student" data-id="'+st.id+'" data-dir="up"'+(realIdx===0?' disabled':'')+' title="تحريك لأعلى">' + appIcon('chevron-down', 11, 'rotate-180') + '</button>'
       +     '<button class="mini-btn mini-move" data-act="move-student" data-id="'+st.id+'" data-dir="down"'+(realIdx===L.students.length-1?' disabled':'')+' title="تحريك لأسفل">' + appIcon('chevron-down', 11) + '</button>'
       +     (st.phone ? '<a class="mini-btn mini-call" href="tel:' + esc(st.phone) + '">' + appIcon('phone', 11) + ' اتصال</a>' : '')
       +     (st.phone ? '<button class="mini-btn mini-wa" data-act="wa" data-id="'+st.id+'">' + appIcon('whatsapp', 11) + ' واتساب</button>' : '')
       +     '<button class="mini-btn mini-wa" data-act="student-summary" data-id="'+st.id+'" title="ملخص حضور الطالب وإرساله له">' + appIcon('share', 11) + ' ملخص</button>'
       +     (L.subscription ? '<button class="mini-btn" data-act="open-payments" data-id="'+st.id+'" title="سجل مدفوعات ومصروفات الطالب">' + appIcon('wallet', 11) + ' المصروفات</button>' : '')
       +     '<button class="mini-btn mini-edit" data-act="edit-student" data-id="'+st.id+'" title="تعديل بيانات الطالب">' + appIcon('edit', 11) + '</button>'
       +     '<button class="mini-btn mini-del" data-act="del-student" data-id="'+st.id+'" title="حذف الطالب">' + appIcon('trash', 11) + '</button>'
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
      if(isPresentStatus(rec.status, eff)) c++;
    });
    tf += '<td title="عدد الطلاب الحاضرين من إجمالي الطلاب"><b>' + c + ' / ' + L.students.length + '</b></td>';
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
  let inlineStyle = '';
  if(current){
    const sObj = sd ? sd.find(x => x.id === current) : null;
    if(sObj && sObj.color){
      cls = 'status-select s-custom';
      inlineStyle = ' style="background:' + hexToRgba(sObj.color, 0.15) + ';border-color:' + hexToRgba(sObj.color, 0.4) + ';color:' + sObj.color + ';"';
    } else if(isPresentStatus(current, sd)){
      cls = 'status-select s-done';
    } else if(isApologyStatus(current, sd)){
      cls = 'status-select s-apology';
    } else if(isAbsentStatus(current, sd)){
      cls = 'status-select s-noanswer';
    } else {
      cls = 'status-select s-custom';
    }
  }
  let opts = '<option value="">-</option>';
  sd.forEach(s => {
    opts += '<option value="'+esc(s.id)+'"' + (s.id===current?' selected':'') + '>'+esc(s.label)+'</option>';
  });
  const archAttr = (archIdx !== undefined && archIdx !== null) ? ' data-arch="'+archIdx+'"' : '';
  return '<select class="'+cls+'"'+inlineStyle+' data-act="status"'+archAttr+' data-sid="'+studentId+'" data-ssid="'+sessionId+'">'+opts+'</select>';
}

function dayNoteHTML(studentId, sessionId, note, archIdx){
  const has = note && note.trim();
  const archAttr = (archIdx !== undefined && archIdx !== null) ? ' data-arch="'+archIdx+'"' : '';
  return '<button class="day-note-btn' + (has ? ' has-note' : '') + '" data-act="day-note"'+archAttr+' data-sid="'+studentId+'" data-ssid="'+sessionId+'" title="' + (has ? 'عرض/تعديل ملاحظة اليوم' : 'إضافة ملاحظة لهذا اليوم') + '">' + (has ? (appIcon('message', 13) + ' ملاحظة') : (appIcon('file-text', 13) + ' ملاحظة')) + '</button>';
}

/* ---------- الأرشيف ---------- */

/* ---------- 📦 إضافة شهور قديمة لأرشيف الدرس (v36) ---------- */
function genSessionsForOldMonth(lesson, monthNumber, year){
  const days = Array.isArray(lesson.schedule) && lesson.schedule.length ? lesson.schedule : [5];
  const dates = [];
  const totalDays = new Date(year, monthNumber, 0).getDate();
  for(let d = 1; d <= totalDays; d++){
    const dt = new Date(year, monthNumber - 1, d);
    if(days.includes(dt.getDay())){
      const iso = year + '-' + String(monthNumber).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      dates.push({ date: iso, dayName: DAY_NAMES[dt.getDay()], dayNum: d });
    }
  }
  if(dates.length === 0){
    for(let w = 1; w <= 4; w++){
      dates.push({ date: '', dayName: 'الأسبوع ' + w, dayNum: w });
    }
  }
  return dates.map((it, idx) => ({
    id: uid('ss'),
    label: 'حصة ' + (idx + 1),
    date: it.date,
    dateLabel: it.date ? (it.dayName + ' ' + it.dayNum + '/' + monthNumber) : it.dayName,
    event: '',
    eventNote: ''
  }));
}

function addOldMonthModal(preselectedLessonId){
  const lessons = state.lessons || [];
  if(lessons.length === 0){
    alert('يرجى إضافة درس أولاً.');
    return;
  }
  const curYear = new Date().getFullYear();
  const curM = new Date().getMonth() + 1;

  const html = '<div class="reset-box" style="text-align:right;line-height:1.6">'
    + '<p style="font-size:13px;color:var(--text);margin-bottom:12px">'
    +   'إضافة شهر قديم مضى مباشرة في أرشيف الدرس لتسجيل بياناته دون التأثير على الشهر الحالي:'
    + '</p>'
    + '<div class="form-row"><label>الدرس التابع له هذا الشهر'
    +   '<select id="aom_lesson" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-weight:700">'
    +     lessons.map(l => '<option value="' + l.id + '"' + (l.id === preselectedLessonId ? ' selected' : '') + '>' + esc(l.name) + '</option>').join('')
    +   '</select>'
    + '</label></div>'
    + '<div class="grid2" style="margin-top:10px">'
    +   '<label>رقم الشهر (1 - 12)<input id="aom_month" type="number" min="1" max="12" value="' + (curM === 1 ? 12 : curM - 1) + '" style="font-weight:700"></label>'
    +   '<label>السنة<input id="aom_year" type="number" min="2020" max="2099" value="' + (curM === 1 ? curYear - 1 : curYear) + '" style="font-weight:700"></label>'
    + '</div>'
    + '<div class="form-row" style="margin-top:12px">'
    +   '<label class="switch-row" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:#fff">'
    +     '<div>'
    +       '<div class="switch-label">نسخ طلاب الشهر الحالي إلى هذا الشهر القديم</div>'
    +       '<div class="muted" style="font-size:11px;margin-top:2px">نسخ قائمة الطلاب الحالية لتسهيل رصد حضورهم دون إعادة إدخال أسمائهم من الصفر.</div>'
    +     '</div>'
    +     '<label class="switch"><input type="checkbox" id="aom_copy_students" checked><span class="switch-slider"></span></label>'
    +   '</label>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:16px">'
    +   '<button class="btn btn-primary" id="aom_save">➕ إنشاء وإضافة الشهر للأرشيف</button>'
    +   '<button class="btn btn-outline" id="aom_cancel">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('📦 إضافة شهر قديم لأرشيف الدرس', html);
  $('#aom_cancel').onclick = closeModal;

  $('#aom_save').onclick = () => {
    const lid = $('#aom_lesson').value;
    const mNum = parseInt($('#aom_month').value, 10);
    const yNum = parseInt($('#aom_year').value, 10);
    const copySt = $('#aom_copy_students') ? $('#aom_copy_students').checked : true;

    if(!mNum || mNum < 1 || mNum > 12){ alert('رقم الشهر غير صالح.'); return; }
    if(!yNum || yNum < 2020){ alert('السنة غير صالحة.'); return; }

    const L = state.lessons.find(x => x.id === lid);
    if(!L) return;

    if(L.monthNumber === mNum && L.year === yNum){
      alert('هذا الشهر مسجل حالياً كـ "الشهر النشط" لهذا الدرس في الصفحة الرئيسية.');
      return;
    }
    const existsInArchive = (state.archive || []).some(a => a.lessonId === lid && a.monthNumber === mNum && a.year === yNum);
    if(existsInArchive){
      alert('هذا الشهر (' + mNum + '/' + yNum + ') مسجل وموجود بالفعل في أرشيف هذا الدرس.');
      return;
    }

    const sessions = genSessionsForOldMonth(L, mNum, yNum);
    const studentsToCopy = copySt ? L.students.map(st => {
      const s = normalizeStudent(JSON.parse(JSON.stringify(st)));
      s.examGroupId = ''; // تفريغ مجموعة الاختبار للشهر القديم (v38)
      return s;
    }) : [];

    const newArchive = {
      id: uid('a'),
      lessonId: L.id,
      lessonName: L.name,
      monthNumber: mNum,
      year: yNum,
      subscription: !!L.subscription,
      students: studentsToCopy,
      sessions: sessions,
      records: {},
      exams: [],
      examScores: {},
      examNotes: {},
      examExclusions: {},
      hiddenExamStudents: [],
      hiddenStudents: [],
      examGroups: [], // مجاميع اختبار فارغة ومستقلة للشهر القديم (v38)
      archivedAt: new Date().toISOString()
    };

    if(!Array.isArray(state.archive)) state.archive = [];
    state.archive.unshift(newArchive);
    saveState();
    renderArchive();
    closeModal();
    showToastMessage('✅ تم إضافة شهر ' + mNum + '/' + yNum + ' لأرشيف درس «' + L.name + '» بنجاح.');

    switchTab('archive');
    renderArchiveDetail(0);
  };
}

let archiveLessonFilter = '__all__';

function moveArchiveItem(fromIdx, toIdx){
  if(fromIdx < 0 || fromIdx >= state.archive.length || toIdx < 0 || toIdx >= state.archive.length) return;
  const item = state.archive.splice(fromIdx, 1)[0];
  state.archive.splice(toIdx, 0, item);
  saveState();
  renderArchive();
  showToastMessage('↕️ تم تعديل ترتيب الشهور المؤرشفة.');
}

function sortArchiveChronologically(){
  state.archive.sort((a, b) => {
    const yA = Number(a.year) || 0, yB = Number(b.year) || 0;
    if(yB !== yA) return yB - yA;
    const mA = Number(a.monthNumber) || 0, mB = Number(b.monthNumber) || 0;
    if(mB !== mA) return mB - mA;
    return new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0);
  });
  saveState();
  renderArchive();
  showToastMessage('🔄 تم ترتيب الأرشيف زمنياً (الأحدث أولاً).');
}

function renderArchive(){
  const list = $('#archiveList');
  const detail = $('#archiveDetail');
  if(!list) return;

  if(currentArchiveIdx === null){
    list.style.display = '';
    if(detail){
      detail.style.display = 'none';
      detail.innerHTML = '';
    }
  }

  if(!Array.isArray(state.archive) || state.archive.length === 0){
    list.innerHTML = '<div class="empty-state">لا يوجد أرشيف بعد. عند أرشفة أي شهر لدرس أو إضافة شهر قديم سيظهر هنا.</div>';
    if(detail) detail.innerHTML = '';
    return;
  }

  // جمع قائمة الدروس التي لها أرشيف لعمل تبويبات/فلاتر
  const lessonMap = new Map();
  state.archive.forEach(a => {
    const lid = a.lessonId || '__unknown__';
    const lname = a.lessonName || 'درس بدون اسم';
    if(!lessonMap.has(lid)){
      lessonMap.set(lid, { id: lid, name: lname, count: 0 });
    }
    lessonMap.get(lid).count++;
  });

  // شريط فلترة الشهور حسب الدرس + زر الترتيب الزمني التلقائي
  let filterBarHTML = '<div class="archive-filter-bar" style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;padding:8px 12px;background:var(--card-bg,#fff);border:1px solid var(--border);border-radius:10px">';
  filterBarHTML += '<span style="font-size:12px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:4px">' + appIcon('book', 14) + ' تصفية حسب الدرس:</span>';
  filterBarHTML += '<button class="btn btn-sm ' + (archiveLessonFilter === '__all__' ? 'btn-primary' : 'btn-outline') + '" data-arch-filter="__all__">كل الدروس (' + state.archive.length + ')</button>';
  
  lessonMap.forEach(item => {
    const isActive = archiveLessonFilter === item.id;
    filterBarHTML += '<button class="btn btn-sm ' + (isActive ? 'btn-primary' : 'btn-outline') + '" data-arch-filter="' + esc(item.id) + '">' + esc(item.name) + ' (' + item.count + ')</button>';
  });

  filterBarHTML += '<button id="btnSortArchiveAuto" class="btn btn-outline btn-sm" style="margin-right:auto" title="ترتيب كل الشهور المؤرشفة تلقائياً من الأحدث إلى الأقدم">' + appIcon('refresh', 13) + ' ترتيب زمني تلقائي</button>';
  filterBarHTML += '</div>';

  // تصفية الشهور المعروضة
  const itemsWithIdx = state.archive.map((a, idx) => ({ a, idx }));
  const filtered = archiveLessonFilter === '__all__'
    ? itemsWithIdx
    : itemsWithIdx.filter(item => (item.a.lessonId || '__unknown__') === archiveLessonFilter);

  if(filtered.length === 0){
    list.innerHTML = filterBarHTML + '<div style="grid-column:1/-1" class="empty-state">لا توجد شهور مؤرشفة لهذا الدرس المحدد.</div>';
  } else {
    list.innerHTML = filterBarHTML + filtered.map(({ a, idx }, fIdx) => {
      const sessCount = (a.sessions || []).length;
      const stCount = (a.students || archiveStudents(a) || []).length;
      const exCount = (a.exams || []).length;
      const canMoveUp = idx > 0;
      const canMoveDown = idx < state.archive.length - 1;

      return '<div class="archive-card" data-act="open-archive" data-idx="' + idx + '" style="position:relative;cursor:pointer">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">'
        +   '<div class="m-title" style="margin:0;font-weight:800;font-size:15px">' + esc(a.lessonName) + (a.subscription ? ' <span class="badge-sub">اشتراك</span>' : '') + '</div>'
        +   '<div style="display:flex;gap:4px" onclick="event.stopPropagation()">'
        +     '<button class="btn btn-icon btn-sm" style="padding:2px 6px;font-size:11px" title="تحريك لأعلى" onclick="moveArchiveItem(' + idx + ',' + (idx - 1) + ')"' + (canMoveUp ? '' : ' disabled') + '>' + appIcon('chevron-down', 11, 'rotate-180') + '</button>'
        +     '<button class="btn btn-icon btn-sm" style="padding:2px 6px;font-size:11px" title="تحريك لأسفل" onclick="moveArchiveItem(' + idx + ',' + (idx + 1) + ')"' + (canMoveDown ? '' : ' disabled') + '>' + appIcon('chevron-down', 11) + '</button>'
        +   '</div>'
        + '</div>'
        + '<div class="m-meta" style="margin-top:6px;font-size:12.5px;font-weight:700;color:var(--primary)">' + esc(buildMonthTitle(a.monthNumber)) + ' - شهر ' + a.monthNumber + '/' + a.year + '</div>'
        + '<div style="display:flex;gap:12px;margin-top:8px;font-size:11.5px;color:var(--muted);flex-wrap:wrap">'
        +   '<span style="display:flex;align-items:center;gap:4px">' + appIcon('calendar', 12) + ' ' + sessCount + ' حصة</span>'
        +   '<span style="display:flex;align-items:center;gap:4px">' + appIcon('users', 12) + ' ' + stCount + ' طالب</span>'
        +   (exCount > 0 ? '<span style="color:#2563eb;font-weight:700;display:flex;align-items:center;gap:4px">' + appIcon('file-text', 12) + ' ' + exCount + ' اختبار</span>' : '')
        + '</div>'
        + '</div>';
    }).join('');
  }

  // ربط أزرار الفلترة
  $$('[data-arch-filter]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      archiveLessonFilter = btn.dataset.archFilter;
      renderArchive();
    };
  });

  const sortBtn = $('#btnSortArchiveAuto');
  if(sortBtn){
    sortBtn.onclick = (e) => {
      e.stopPropagation();
      sortArchiveChronologically();
    };
  }

  $('#archiveDetail').innerHTML = '';
}


/* ---------- 📤 تصدير واستيراد شهر مؤرشف منفرد (v38) ---------- */
function exportSingleArchiveMonth(idx){
  const a = state.archive[idx];
  if(!a){
    showToastMessage('⚠️ تعذر العثور على الشهر المؤرشف.');
    return;
  }
  const payload = {
    type: 'daftar-single-month',
    version: 40,
    exportedAt: new Date().toISOString(),
    archive: JSON.parse(JSON.stringify(a))
  };
  const safeName = (a.lessonName || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '').replace(/\s+/g, '_');
  const filename = 'شهر_' + safeName + '_' + a.monthNumber + '-' + a.year + '.daftar-month';
  downloadBlob(JSON.stringify(payload, null, 2), filename, 'application/json');
  showToastMessage('📤 تم تصدير شهر «' + a.lessonName + ' (' + a.monthNumber + '/' + a.year + ')» كملف منفصل بنجاح.');
}
const exportSingleArchivedMonth = exportSingleArchiveMonth;
try { window.exportSingleArchiveMonth = exportSingleArchiveMonth; window.exportSingleArchivedMonth = exportSingleArchivedMonth; } catch(e){}

function extractArchiveObjectsFromData(data){
  if(!data || typeof data !== 'object') return [];
  
  // 1. ملف تصدير تيليجرام أو ملفات الشهور الفردية (archiveMonth / singleMonth / archivedMonth / month)
  if(data.archiveMonth && typeof data.archiveMonth === 'object'){
    return Array.isArray(data.archiveMonth) ? data.archiveMonth : [data.archiveMonth];
  }
  if(data.archivedMonth && typeof data.archivedMonth === 'object'){
    return Array.isArray(data.archivedMonth) ? data.archivedMonth : [data.archivedMonth];
  }
  if(data.singleMonth && typeof data.singleMonth === 'object'){
    return Array.isArray(data.singleMonth) ? data.singleMonth : [data.singleMonth];
  }
  if(data.singleArchive && typeof data.singleArchive === 'object'){
    return Array.isArray(data.singleArchive) ? data.singleArchive : [data.singleArchive];
  }

  // 2. كائن أرشيف ملف فردي مغلف (data.archive ككائن)
  if(data.archive && typeof data.archive === 'object' && !Array.isArray(data.archive)){
    return [data.archive];
  }
  // 3. مصفوفة شهور مؤرشفة داخل data.archive أو data.archives
  if(Array.isArray(data.archive) && data.archive.length > 0){
    return data.archive;
  }
  if(Array.isArray(data.archives) && data.archives.length > 0){
    return data.archives;
  }
  // 4. مصفوفة شهور مباشرة في الجذر
  if(Array.isArray(data) && data.length > 0){
    return data;
  }
  // 5. ملف درس فردي { lesson: {...}, archives: [...] }
  if(data.lesson && typeof data.lesson === 'object'){
    const list = Array.isArray(data.archives) ? data.archives.slice() : (Array.isArray(data.archive) ? data.archive.slice() : []);
    const lName = data.lesson.name || data.lesson.lessonName;
    if(lName && (data.lesson.monthNumber !== undefined || data.lesson.month !== undefined || Array.isArray(data.lesson.sessions))){
      list.push({
        id: uid('a'),
        lessonId: data.lesson.id || uid('l'),
        lessonName: lName,
        monthNumber: parseInt(data.lesson.monthNumber || data.lesson.month || 1, 10),
        year: parseInt(data.lesson.year || new Date().getFullYear(), 10),
        subscription: !!data.lesson.subscription,
        students: Array.isArray(data.lesson.students) ? data.lesson.students : [],
        sessions: Array.isArray(data.lesson.sessions) ? data.lesson.sessions : [],
        records: (data.lesson.records && typeof data.lesson.records === 'object') ? data.lesson.records : {},
        exams: Array.isArray(data.lesson.exams) ? data.lesson.exams : [],
        examScores: (data.lesson.examScores && typeof data.lesson.examScores === 'object') ? data.lesson.examScores : {},
        examNotes: (data.lesson.examNotes && typeof data.lesson.examNotes === 'object') ? data.lesson.examNotes : {},
        examExclusions: (data.lesson.examExclusions && typeof data.lesson.examExclusions === 'object') ? data.lesson.examExclusions : {},
        hiddenExamStudents: Array.isArray(data.lesson.hiddenExamStudents) ? data.lesson.hiddenExamStudents : [],
        examGroups: Array.isArray(data.lesson.examGroups) ? data.lesson.examGroups : [],
        groups: Array.isArray(data.lesson.groups) ? data.lesson.groups : [],
        archivedAt: new Date().toISOString()
      });
    }
    if(list.length > 0) return list;
  }
  // 6. كائن شهر مباشر
  if((data.lessonName || data.name || data.title) && (data.monthNumber !== undefined || data.month !== undefined || Array.isArray(data.sessions) || Array.isArray(data.students))){
    return [data];
  }
  // 7. نسخة احتياطية كاملة تضم دروساً { lessons: [...], archive: [...] }
  if(Array.isArray(data.lessons) && data.lessons.length > 0){
    return data.lessons.map(L => ({
      id: uid('a'),
      lessonId: L.id || uid('l'),
      lessonName: L.name || 'درس',
      monthNumber: parseInt(L.monthNumber || 1, 10),
      year: parseInt(L.year || new Date().getFullYear(), 10),
      subscription: !!L.subscription,
      students: Array.isArray(L.students) ? L.students : [],
      sessions: Array.isArray(L.sessions) ? L.sessions : [],
      records: (L.records && typeof L.records === 'object') ? L.records : {},
      exams: Array.isArray(L.exams) ? L.exams : [],
      examScores: (L.examScores && typeof L.examScores === 'object') ? L.examScores : {},
      examNotes: (L.examNotes && typeof L.examNotes === 'object') ? L.examNotes : {},
      examExclusions: (L.examExclusions && typeof L.examExclusions === 'object') ? L.examExclusions : {},
      hiddenExamStudents: Array.isArray(L.hiddenExamStudents) ? L.hiddenExamStudents : [],
      examGroups: Array.isArray(L.examGroups) ? L.examGroups : [],
      groups: Array.isArray(L.groups) ? L.groups : [],
      archivedAt: new Date().toISOString()
    }));
  }
  return [];
}

function normalizeImportedArchiveMonth(archObj){
  const lessonName = archObj.lessonName || archObj.name || archObj.title || 'درس بدون اسم';
  const monthNum = parseInt(archObj.monthNumber || archObj.month || archObj.mNum || 1, 10) || 1;
  const yearNum = parseInt(archObj.year || new Date().getFullYear(), 10) || new Date().getFullYear();
  return {
    id: archObj.id || uid('a'),
    lessonId: archObj.lessonId || uid('l'),
    lessonName: lessonName,
    monthNumber: monthNum,
    year: yearNum,
    subscription: !!archObj.subscription,
    students: Array.isArray(archObj.students) ? archObj.students.map(normalizeStudent) : (Array.isArray(archObj.rawStudents) ? archObj.rawStudents.map(normalizeStudent) : []),
    sessions: Array.isArray(archObj.sessions) ? archObj.sessions : [],
    records: (archObj.records && typeof archObj.records === 'object') ? archObj.records : {},
    exams: Array.isArray(archObj.exams) ? archObj.exams : [],
    examScores: (archObj.examScores && typeof archObj.examScores === 'object') ? archObj.examScores : {},
    examNotes: (archObj.examNotes && typeof archObj.examNotes === 'object') ? archObj.examNotes : {},
    examExclusions: (archObj.examExclusions && typeof archObj.examExclusions === 'object') ? archObj.examExclusions : {},
    hiddenExamStudents: Array.isArray(archObj.hiddenExamStudents) ? archObj.hiddenExamStudents : [],
    examGroups: Array.isArray(archObj.examGroups) ? archObj.examGroups : [],
    groups: Array.isArray(archObj.groups) ? archObj.groups : [],
    archivedAt: archObj.archivedAt || new Date().toISOString()
  };
}

function importSingleArchiveMonth(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      let parsed = null;
      try {
        parsed = JSON.parse(e.target.result);
      } catch(parseErr){
        alert('تعذّر قراءة الملف: تأكد من اختيار ملف JSON أو .daftar-month صالح.');
        return;
      }

      const rawList = extractArchiveObjectsFromData(parsed);
      if(!rawList || rawList.length === 0){
        alert('الملف غير صالح أو لم يتم العثور على أي بيانات شهور صالحة بداخله.');
        return;
      }

      const normalizedList = rawList.map(normalizeImportedArchiveMonth);
      if(!Array.isArray(state.archive)) state.archive = [];

      if(normalizedList.length === 1){
        const normalizedMonth = normalizedList[0];
        const existingIdx = state.archive.findIndex(a => (a.lessonId === normalizedMonth.lessonId || a.lessonName === normalizedMonth.lessonName) && a.monthNumber === normalizedMonth.monthNumber && a.year === normalizedMonth.year);
        if(existingIdx !== -1){
          if(!confirm('الشهر (' + normalizedMonth.monthNumber + '/' + normalizedMonth.year + ') لـ «' + normalizedMonth.lessonName + '» موجود بالفعل في الأرشيف.\nهل تريد استبداله بالنسخة المستوردة؟')) return;
          state.archive[existingIdx] = normalizedMonth;
        } else {
          state.archive.unshift(normalizedMonth);
        }
        saveState();
        currentArchiveIdx = null;
        renderArchive();
        showToastMessage('📥 تم استيراد شهر «' + normalizedMonth.lessonName + ' (' + normalizedMonth.monthNumber + '/' + normalizedMonth.year + ')» للأرشيف بنجاح.');
        switchTab('archive');
      } else {
        let addedCount = 0;
        let replacedCount = 0;
        normalizedList.forEach(m => {
          const exIdx = state.archive.findIndex(a => (a.lessonId === m.lessonId || a.lessonName === m.lessonName) && a.monthNumber === m.monthNumber && a.year === m.year);
          if(exIdx !== -1){
            state.archive[exIdx] = m;
            replacedCount++;
          } else {
            state.archive.unshift(m);
            addedCount++;
          }
        });
        saveState();
        currentArchiveIdx = null;
        renderArchive();
        showToastMessage('📥 تم استيراد ' + (addedCount + replacedCount) + ' شهر إلى الأرشيف بنجاح.');
        switchTab('archive');
      }
    } catch(err){
      console.error(err);
      alert('حدث خطأ أثناء استيراد الشهر: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function archiveStudents(a){
  if(Array.isArray(a.students) && a.students.length) return a.students;
  const L = state.lessons.find(x => x.id === a.lessonId);
  return L ? L.students : [];
}

/* ---------- 🏛️ ترقية شاشة الشهر المؤرشف بالكامل (v36) ---------- */

function sortArchiveMonthByAttendance(idx){
  const a = state.archive[idx];
  if(!a || !Array.isArray(a.students) || a.students.length === 0){
    showToastMessage('⚠️ لا يوجد طلاب لترتيبهم.');
    return;
  }
  const ps = pastSessions(a.sessions || []);
  const eff = effectiveStatuses(a);

  const stats = computeStats(a.students, ps.length ? ps : a.sessions, a.records || {}, eff);
  // ترتيب الطلاب بناء على نسبة الحضور من الأعلى للأقل
  stats.sort((s1, s2) => {
    if(s2.pct !== s1.pct) return s2.pct - s1.pct;
    return s2.done - s1.done;
  });

  const orderedIds = stats.map(s => s.st.id);
  a.students.sort((stA, stB) => {
    const idxA = orderedIds.indexOf(stA.id);
    const idxB = orderedIds.indexOf(stB.id);
    return idxA - idxB;
  });

  saveState();
  renderArchiveDetail(idx);
  showToastMessage('📈 تم ترتيب الطلاب حسب الحضور (الأعلى أولاً).');
}

function renderArchiveDetail(idx){
  currentArchiveIdx = idx;
  const a = state.archive[idx];
  if(!a) return;
  if(!Array.isArray(a.students)) a.students = JSON.parse(JSON.stringify(archiveStudents(a)));
  if(!Array.isArray(a.sessions)) a.sessions = [];
  if(!a.records) a.records = {};
  if(!Array.isArray(a.exams)) a.exams = [];
  if(!a.examScores) a.examScores = {};
  if(!a.examExclusions) a.examExclusions = {};
  if(!a.examNotes) a.examNotes = {};
  if(!Array.isArray(a.hiddenExamStudents)) a.hiddenExamStudents = [];

  const L = state.lessons.find(x => x.id === a.lessonId);
  const eff = L ? effectiveStatuses(L) : state.settings.statuses;
  const groups = (L && L.groups) || a.groups || [];

  const list = $('#archiveList');
  const container = $('#archiveDetail');
  if(list) list.style.display = 'none';
  if(container) container.style.display = 'block';

  if(!Array.isArray(a.hiddenStudents)) a.hiddenStudents = [];
  const hiddenArchList = a.hiddenStudents || [];
  let displayStudents = a.students.slice().filter(st => !hiddenArchList.includes(st.id));
  if(archiveGroupFilterQuery && archiveGroupFilterQuery !== '__none__'){
    displayStudents = displayStudents.filter(st => st.groupId === archiveGroupFilterQuery);
  } else if(archiveGroupFilterQuery === '__none__'){
    displayStudents = displayStudents.filter(st => !st.groupId);
  }

  let html = '<div class="detail-top">'
    + '<button id="backToArchiveListBtn" class="btn btn-outline btn-sm">' + appIcon('arrow-right', 14) + ' رجوع لقائمة الأرشيف</button>'
    + '<div class="lesson-head">'
    +   '<h2>' + esc(a.lessonName) + ' - ' + esc(buildMonthTitle(a.monthNumber)) + ' (' + a.monthNumber + '/' + a.year + ')</h2>'
    +   '<div class="lesson-meta">' + a.sessions.length + ' حصة · ' + a.students.length + ' طالب · أُرشف في ' + new Date(a.archivedAt).toLocaleString('ar-EG') + (a.subscription ? ' · اشتراك' : '') + '</div>'
    + '</div>'
    + '</div>';

  // التابات الفرعية
  html += '<div class="lesson-subtabs">'
    + '<button id="subtabArchAttendance" class="subtab-btn' + (currentArchiveSubtab === 'attendance' ? ' active' : '') + '">' + appIcon('calendar', 14) + ' جدول الحضور</button>'
    + '<button id="subtabArchExams" class="subtab-btn' + (currentArchiveSubtab === 'exams' ? ' active' : '') + '">' + appIcon('file-text', 14) + ' درجات الاختبارات</button>'
    + '</div>';

  // شريط الأدوات
  html += '<div class="toolbar">'
    + '<button id="archAddStudentBtn" class="btn btn-primary">' + appIcon('plus', 14) + ' عضو جديد</button>'
    + '<button id="archBulkSelectBtn" class="btn ' + (isBulkSelecting ? 'btn-primary' : 'btn-outline') + '">' + appIcon('check-square', 14) + (isBulkSelecting ? ' إنهاء التحديد' : ' تحديد متعدد') + '</button>'
    + '<button id="archSeqMsgBtn" class="btn btn-outline" title="مراسلة تسلسلية عبر واتساب">' + appIcon('whatsapp', 14) + ' مراسلة جماعية</button>'
    + (hiddenArchList.length > 0 ? '<button id="archHiddenStudentsBtn" class="btn btn-outline" style="color:#b91c1c;border-color:#fca5a5;font-weight:700">' + appIcon('user-x', 14) + ' المحجوبون (' + hiddenArchList.length + ')</button>' : '')
    + '<div class="toolbar-dropdown">'
    +   '<button class="btn btn-outline" id="archReportsMenuBtn">' + appIcon('chart', 14) + ' التقارير ' + appIcon('chevron-down', 11) + '</button>'
    +   '<div class="dropdown-menu" id="archReportsMenu" hidden>'
    +     '<button id="archRepMonthBtn" class="dropdown-item">' + appIcon('chart', 14) + ' تقرير الشهر</button>'
    +     '<button id="archRepExamsBtn" class="dropdown-item">' + appIcon('file-text', 14) + ' تقرير درجات الاختبارات</button>'
    +     '<button id="archRepExamMsgBtn" class="dropdown-item">' + appIcon('message', 14) + ' تقرير الاختبار كرسالة</button>'
    +     '<button id="archRepMsgBtn" class="dropdown-item">' + appIcon('message', 14) + ' تقرير كرسالة</button>'
    +     '<button id="archRepCompBtn" class="dropdown-item">' + appIcon('chart', 14) + ' تقرير شامل (كل الشهور)</button>'
    +     '<button id="archBlankSheetBtn" class="dropdown-item">' + appIcon('file-text', 14) + ' ورقة حضور</button>'
    +     '<button id="archExportCsvBtn" class="dropdown-item">' + appIcon('download', 14) + ' Excel (CSV)</button>'
    +     '<button id="archPrintPdfBtn" class="dropdown-item">' + appIcon('printer', 14) + ' PDF (A4)</button>'
    +   '</div>'
    + '</div>'
    + '<div class="toolbar-dropdown">'
    +   '<button class="btn btn-outline" id="archManageMenuBtn">' + appIcon('settings', 14) + ' إدارة ' + appIcon('chevron-down', 11) + '</button>'
    +   '<div class="dropdown-menu" id="archManageMenu" hidden>'
    +     '<button id="archAddSessionBtn" class="dropdown-item">' + appIcon('plus', 14) + ' حصة جديدة</button>'
    +     '<button id="archAddExamBtn" class="dropdown-item">' + appIcon('plus', 14) + ' اختبار جديد</button>'
    +     '<button id="archExamGroupsBtn" class="dropdown-item">' + appIcon('users', 14) + ' مجموعات الاختبار</button>'
    +     '<button id="archSortAttendanceBtn" class="dropdown-item">' + appIcon('chart', 14) + ' ترتيب حسب الحضور</button>'
    +     '<button id="archHiddenStudentsMenuBtn" class="dropdown-item">' + appIcon('user-x', 14) + ' إدارة الطلاب المحجوبين' + (hiddenArchList.length > 0 ? ' (' + hiddenArchList.length + ')' : '') + '</button>'
    +     '<button id="archSmartDropoutHideBtn" class="dropdown-item">' + appIcon('zap', 14) + ' حجب المنقطعين ذكياً</button>'
    +     '<button id="archMergeAttendanceMenuBtn" class="dropdown-item">' + appIcon('refresh', 14) + ' دمج ومشاركة الحضور</button>'
    +     '<button id="archEditMonthBtn" class="dropdown-item">' + appIcon('calendar', 14) + ' تعديل بيانات الشهر</button>'
    +     '<button id="archExportSingleMonthBtn" class="dropdown-item">' + appIcon('download', 14) + ' تصدير الشهر</button>'
    +     '<button id="archRestoreBtn" class="dropdown-item">' + appIcon('refresh', 14) + ' استعادة الشهر للرئيسية</button>'
    +     '<button id="archDeleteBtn" class="dropdown-item" style="color:var(--danger)">' + appIcon('trash', 14) + ' حذف الشهر من الأرشيف</button>'
    +   '</div>'
    + '</div>'
    + '</div>';

  // شريط البحث والفلتر
  html += '<div class="detail-filters">'
    + '<div class="search-input-wrap" style="position:relative;flex:1;display:flex;align-items:center">'
    +   '<input type="text" id="archiveSearch" class="lesson-search" placeholder="بحث بالاسم أو الهاتف أو رقم الترتيب (#)…" value="' + esc(archiveFilterQuery) + '" style="padding-left:32px;width:100%">'
    +   '<button id="clearArchiveSearch" type="button" class="search-clear-btn" style="position:absolute;left:8px;background:none;border:none;color:#94a3b8;font-size:14px;cursor:pointer;display:' + (archiveFilterQuery ? 'block' : 'none') + '" title="مسح البحث">' + appIcon('x', 14) + '</button>'
    + '</div>'
    + (groups.length ? '<select id="archGroupFilter" class="group-filter" title="تصفية حسب المجموعة"><option value="">كل المجموعات</option>' + groups.map(g => '<option value="' + esc(g.id) + '"' + (archiveGroupFilterQuery === g.id ? ' selected' : '') + '>' + esc(g.name) + '</option>').join('') + '<option value="__none__"' + (archiveGroupFilterQuery === '__none__' ? ' selected' : '') + '>بدون مجموعة</option></select>' : '')
    + '</div>';

  // شريط التحديد المتعدد
  html += '<div id="archBulkActionBar" class="bulk-action-bar" style="display:' + (isBulkSelecting ? 'flex' : 'none') + ';margin-bottom:12px">'
    + '<div class="bulk-info"><span id="archBulkSelectedCount">' + selectedStudentIds.size + '</span> طالب محدد</div>'
    + '<div class="bulk-btns">'
    +   '<button id="archBulkMoveBtn" class="btn btn-primary btn-sm">' + appIcon('refresh', 12) + ' نقل إلى درس/شهر...</button>'
    +   '<button id="archBulkCopyBtn" class="btn btn-outline btn-sm">' + appIcon('copy', 12) + ' نسخ إلى درس/شهر...</button>'
    +   '<button id="archBulkCancelBtn" class="btn btn-outline btn-sm">إلغاء التحديد</button>'
    + '</div>'
    + '</div>';

  // الحاوية: إما جدول الحضور أو الاختبارات
  if(currentArchiveSubtab === 'exams'){
    html += '<div id="archExamsWrap">' + renderArchExamsTable(a, idx, displayStudents) + '</div>';
  } else {
    html += '<div id="archAttendanceWrap">' + archiveTableHTML(a, idx, eff, displayStudents) + '</div>';
  }

  container.innerHTML = html;

  // ربط أحداث شاشة الأرشيف
  $('#backToArchiveListBtn').onclick = () => {
    currentArchiveIdx = null;
    isBulkSelecting = false;
    selectedStudentIds.clear();
    archiveFilterQuery = '';
    archiveGroupFilterQuery = '';
    renderArchive();
    $('#archiveList').style.display = 'block';
    $('#archiveDetail').style.display = 'none';
  };

  $('#subtabArchAttendance').onclick = () => {
    currentArchiveSubtab = 'attendance';
    renderArchiveDetail(idx);
  };
  $('#subtabArchExams').onclick = () => {
    currentArchiveSubtab = 'exams';
    renderArchiveDetail(idx);
  };

  $('#archAddStudentBtn').onclick = () => {
    studentForm(a, null, true, idx);
  };

  $('#archBulkSelectBtn').onclick = () => {
    isBulkSelecting = !isBulkSelecting;
    if(!isBulkSelecting) selectedStudentIds.clear();
    renderArchiveDetail(idx);
  };

  if($('#archBulkCancelBtn')){
    $('#archBulkCancelBtn').onclick = () => {
      isBulkSelecting = false;
      selectedStudentIds.clear();
      renderArchiveDetail(idx);
    };
  }

  if($('#archBulkMoveBtn')){
    $('#archBulkMoveBtn').onclick = () => bulkMoveStudentsModal(a, false, true, idx);
  }
  if($('#archBulkCopyBtn')){
    $('#archBulkCopyBtn').onclick = () => bulkMoveStudentsModal(a, true, true, idx);
  }

  $('#archSeqMsgBtn').onclick = () => openSequentialMessagingModal(a);

  // القوائم المنسدلة
  $('#archReportsMenuBtn').onclick = (e) => {
    e.stopPropagation();
    toggleDropdown('archReportsMenu', 'archReportsMenuBtn');
  };
  $('#archManageMenuBtn').onclick = (e) => {
    e.stopPropagation();
    toggleDropdown('archManageMenu', 'archManageMenuBtn');
  };

  // تقارير
  $('#archRepMonthBtn').onclick = () => showAnalytics(archiveStudents(a), pastSessions(a.sessions), a.records, a.lessonName, eff);
  $('#archRepExamsBtn').onclick = () => openExamReportModal(a);
  $('#archRepExamMsgBtn').onclick = () => openExamMessageReportModal(a);
  $('#archRepMsgBtn').onclick = () => archiveMonthlyMessage(a);
  $('#archRepCompBtn').onclick = () => {
    const origL = state.lessons.find(x => x.id === a.lessonId);
    showComprehensiveReport(origL || { id: a.lessonId, name: a.lessonName, students: a.students, sessions: a.sessions, records: a.records });
  };
  $('#archBlankSheetBtn').onclick = () => printBlankSheet(a);
  $('#archExportCsvBtn').onclick = () => exportCSV(archiveStudents(a), a.sessions, a.records, a.lessonName, eff);
  $('#archPrintPdfBtn').onclick = () => printReport(archiveStudents(a), a.sessions, a.records, a.lessonName + ' - شهر ' + a.monthNumber, eff);

  // إدارة
  $('#archAddSessionBtn').onclick = () => {
    const lbl = prompt('مسمى الحصة الجديدة (مثال: حصة 5):', 'حصة ' + (a.sessions.length + 1));
    if(!lbl) return;
    a.sessions.push({ id: uid('ss'), label: lbl.trim(), date: '', dateLabel: '' });
    saveState();
    renderArchiveDetail(idx);
    showToastMessage('✅ تم إضافة الحصة للأرشيف بنجاح.');
  };
  $('#archAddExamBtn').onclick = () => addExamModal(a, null, true, idx);
  $('#archExamGroupsBtn').onclick = () => openExamGroupsModal(a);
  if($('#archStatusesBtn')) $('#archStatusesBtn').onclick = () => {
    $$('.dropdown-menu').forEach(m => { m.hidden = true; });
    lessonStatusesEditor(a, true, idx);
  };
  if($('#archSortAttendanceBtn')) $('#archSortAttendanceBtn').onclick = () => {
    $$('.dropdown-menu').forEach(m => { m.hidden = true; });
    sortArchiveMonthByAttendance(idx);
  };
  if($('#archHiddenStudentsBtn')) $('#archHiddenStudentsBtn').onclick = () => openHiddenStudentsModal(a, true, idx);
  if($('#archHiddenStudentsMenuBtn')) $('#archHiddenStudentsMenuBtn').onclick = () => {
    $$('.dropdown-menu').forEach(m => { m.hidden = true; });
    openHiddenStudentsModal(a, true, idx);
  };
  if($('#archSmartDropoutHideBtn')) $('#archSmartDropoutHideBtn').onclick = () => {
    $$('.dropdown-menu').forEach(m => { m.hidden = true; });
    openSmartDropoutHidingModal(a, true, idx);
  };
  if($('#archMergeAttendanceMenuBtn')) $('#archMergeAttendanceMenuBtn').onclick = () => {
    $$('.dropdown-menu').forEach(m => { m.hidden = true; });
    openAttendanceMergeModal(a, null, true, idx);
  };
  $('#archEditMonthBtn').onclick = () => {
    openModal('🗓️ تعديل بيانات الشهر المؤرشف',
      '<div class="form-row"><label>رقم الشهر (1-12)<input id="arch_mNum" type="number" min="1" max="12" value="' + a.monthNumber + '"></label></div>'
      + '<div class="form-row"><label>السنة<input id="arch_year" type="number" min="2020" max="2050" value="' + a.year + '"></label></div>'
      + '<div class="modal-actions"><button class="btn" id="arch_mSave">حفظ</button><button class="btn btn-outline" id="arch_mCancel">إلغاء</button></div>');
    $('#arch_mSave').onclick = () => {
      a.monthNumber = parseInt($('#arch_mNum').value, 10) || a.monthNumber;
      a.year = parseInt($('#arch_year').value, 10) || a.year;
      saveState();
      closeModal();
      renderArchiveDetail(idx);
      showToastMessage('✅ تم تحديث بيانات الشهر.');
    };
    $('#arch_mCancel').onclick = closeModal;
  };
  if($('#archExportSingleMonthBtn')) $('#archExportSingleMonthBtn').onclick = () => exportSingleArchiveMonth(idx);
  if($('#archExportMonthBtn')) $('#archExportMonthBtn').onclick = () => exportSingleArchiveMonth(idx);
  if($('#archRestoreBtn')) $('#archRestoreBtn').onclick = () => restoreArchiveMonth(idx);
  if($('#archDeleteBtn')) $('#archDeleteBtn').onclick = () => {
    confirmDangerModal({
      title: '⚠️ حذف شهر من الأرشيف',
      message: 'هل أنت متأكد تماماً من حذف شهر (' + a.monthNumber + '/' + a.year + ') لـ «' + esc(a.lessonName) + '» من الأرشيف نهائياً؟',
      itemName: a.lessonName + ' - شهر ' + a.monthNumber + '/' + a.year,
      dangerNote: 'سيتم مسح سجلات هذا الشهر ودرجاته وطلابه بالأرشيف نهائياً ولا يمكن استرجاعها.',
      confirmText: 'نعم، احذف الشهر',
      onConfirm: () => {
        state.archive.splice(idx, 1);
        saveState();
        currentArchiveIdx = null;
        renderArchive();
        $('#archiveList').style.display = 'grid';
        $('#archiveDetail').style.display = 'none';
        showToastMessage('🗑️ تم حذف الشهر من الأرشيف بنجاح.');
      }
    });
  };

  // البحث والفلتر
  const sInp = $('#archiveSearch');
  if(sInp){
    sInp.oninput = () => {
      archiveFilterQuery = sInp.value;
      fastFilterArchiveSearch();
    };
  }
  const clrBtn = $('#clearArchiveSearch');
  if(clrBtn){
    clrBtn.onclick = () => {
      if(sInp) sInp.value = '';
      archiveFilterQuery = '';
      fastFilterArchiveSearch();
      if(sInp) sInp.focus();
    };
  }
  const gFil = $('#archGroupFilter');
  if(gFil){
    gFil.onchange = () => {
      archiveGroupFilterQuery = gFil.value;
      renderArchiveDetail(idx);
    };
  }

  // checkbox تحديد الكل في الأرشيف
  const chkAll = $('#archBulkSelectAll');
  if(chkAll){
    chkAll.onchange = () => {
      const allChecked = chkAll.checked;
      displayStudents.forEach(st => {
        if(allChecked) selectedStudentIds.add(st.id);
        else selectedStudentIds.delete(st.id);
      });
      renderArchiveDetail(idx);
    };
  }
  $$('.arch-bulk-chk').forEach(chk => {
    chk.onchange = () => {
      const sid = chk.dataset.id;
      if(chk.checked) selectedStudentIds.add(sid);
      else selectedStudentIds.delete(sid);
      const cntEl = $('#archBulkSelectedCount');
      if(cntEl) cntEl.textContent = selectedStudentIds.size;
    };
  });
}

function archiveTableHTML(a, idx, statuses, displayStudents){
  const sd = state.settings;
  const students = displayStudents || archiveStudents(a);
  const ps = pastSessions(a.sessions);
  const L = state.lessons.find(x => x.id === a.lessonId);
  const eff = statuses || effectiveStatuses(a);

  // Pagination for archive
  const totalArchStudentsCount = students.length;
  let pagedArchStudents = students;
  let totalArchPages = 1;
  if(tablePageSize > 0 && totalArchStudentsCount > tablePageSize){
    totalArchPages = Math.ceil(totalArchStudentsCount / tablePageSize);
    if(archiveCurrentPage > totalArchPages) archiveCurrentPage = totalArchPages;
    if(archiveCurrentPage < 1) archiveCurrentPage = 1;
    const startIdx = (archiveCurrentPage - 1) * tablePageSize;
    pagedArchStudents = students.slice(startIdx, startIdx + tablePageSize);
  } else {
    archiveCurrentPage = 1;
  }
  const archPagHtml = renderPaginationBarHTML(archiveCurrentPage, totalArchPages, totalArchStudentsCount, tablePageSize, 'arch');
  const archStartIdx = (tablePageSize > 0 && totalArchStudentsCount > 0) ? (archiveCurrentPage - 1) * tablePageSize : 0;

  let h = archPagHtml + '<div class="table-wrap" style="margin-top:12px"><table id="archAttendanceTable"><thead><tr>';
  if(isBulkSelecting){
    const allChecked = students.length > 0 && students.every(st => selectedStudentIds.has(st.id));
    h += '<th class="bulk-select-cell"><input type="checkbox" id="archBulkSelectAll"' + (allChecked ? ' checked' : '') + ' title="تحديد/إلغاء الكل"></th>';
  }
  h += '<th class="sticky-col">' + esc(sd.studentLabel) + '</th>';
  sd.customFields.forEach(f => { h += '<th class="field-col">' + esc(f.label) + '</th>'; });
  a.sessions.forEach(s => {
    h += '<th><div class="week-head">'
       + '<span>' + esc(s.label) + '</span>'
       + '<span class="week-date" title="اضغط لتعديل التاريخ" data-act="edit-session-date" data-arch="' + idx + '" data-id="' + s.id + '">' + esc(s.dateLabel || 'بدون تاريخ') + '</span>'
       + (s.event ? '<span class="week-event" data-act="edit-session-event" data-arch="' + idx + '" data-id="' + s.id + '">' + appIcon('file-text', 11) + ' ' + esc(s.event) + '</span>' : '')
       + '<button class="del-week" data-act="del-session" data-arch="' + idx + '" data-id="' + s.id + '" title="حذف الحصة">' + appIcon('x', 11) + '</button>'
       + '<div class="week-tools">'
       + '<button class="mini-btn" data-act="bulk-attendance" data-arch="' + idx + '" data-id="' + s.id + '" title="التحضير السريع الجماعي للحصة">' + appIcon('zap', 11) + '</button>'
       + '<button class="mini-btn mini-edit" data-act="edit-session-event" data-arch="' + idx + '" data-id="' + s.id + '" title="حدث الحصة">' + appIcon('file-text', 11) + '</button>'
       + '<button class="mini-btn mini-wa" data-act="session-summary" data-arch="' + idx + '" data-id="' + s.id + '" title="ملخص واتساب">' + appIcon('share', 11) + '</button>'
       + '</div></div></th>';
  });
  h += '<th>' + esc(sd.notesLabel) + '</th>';
  if(a.subscription) h += '<th>دفع الاشتراك</th>';
  h += '</tr></thead><tbody>';

  pagedArchStudents.forEach((st, i) => {
    const stPct = ps.length ? Math.round(ps.filter(s => (a.records[st.id] || {})[s.id] && isPresentStatus(a.records[st.id][s.id].status, eff)).length / ps.length * 100) : 0;
    const ind = ps.length > 0 ? attendanceIndicator(stPct) : null;
    const grp = ((L && L.groups) || a.groups || []).find(g => g.id === st.groupId);

    const _nameNorm = normalizeForSearch(st.name || '');
    const _phone = ((st.phone || '') + ' ' + (st.guardianPhone || '') + ' ' + (st.extraPhones||[]).join(' ')).toLowerCase();
    h += '<tr class="student-row" draggable="true" data-drag-id="' + st.id + '" data-arch-idx="' + idx + '" data-sid="' + st.id + '" data-name-norm="' + esc(_nameNorm) + '" data-phone="' + esc(_phone) + '">';
    if(isBulkSelecting){
      h += '<td class="bulk-select-cell"><input type="checkbox" class="arch-bulk-chk" data-id="' + st.id + '"' + (selectedStudentIds.has(st.id) ? ' checked' : '') + '></td>';
    }
    h += '<td class="sticky-col student-cell">'
       +   '<div class="student-name">'
       +     '<input class="order-input" type="number" min="1" max="' + students.length + '" value="' + (archStartIdx + i + 1) + '" data-act="order" data-arch="' + idx + '" data-id="' + st.id + '" title="اكتب رقم الترتيب الجديد ثم اضغط Enter للنقل المباشر"> '
       +     (st.photo ? '<img src="' + st.photo + '" class="st-avatar-mini" alt="">' : '<span class="st-avatar-initial">' + esc((st.name||'').trim().charAt(0) || '👤') + '</span>')
       +     ' <span class="st-name-click" data-act="view-arch-student" data-id="' + st.id + '" data-arch="' + idx + '" style="cursor:pointer;font-weight:700;color:var(--primary);text-decoration:underline" title="اضغط لعرض وتعديل بطاقة الطالب">' + esc(st.name) + '</span>'
       +     (grp ? ' <span class="badge-group">' + esc(grp.name) + '</span>' : '')
       +     (ind ? ' <span class="badge-indicator" style="background:' + ind.color + '" title="' + esc(ind.label) + ' (' + stPct + '%)">' + esc(ind.label) + '</span>' : '')
       +   '</div>'
       +   '<div class="student-phone">' + esc(st.phone) + '</div>'
       +   ((st.extraPhones||[]).map(p => '<div class="student-phone">' + esc(p) + ' <a class="mini-btn mini-call" href="tel:' + esc(p) + '">' + appIcon('phone', 11) + ' اتصال</a> <button class="mini-btn mini-wa" data-act="wa" data-arch="' + idx + '" data-id="' + st.id + '" data-phone="' + esc(p) + '">' + appIcon('whatsapp', 11) + ' واتساب</button></div>').join(''))
       +   '<div class="student-actions">'
       +     '<button class="mini-btn mini-move" data-act="move-student" data-arch="' + idx + '" data-id="' + st.id + '" data-dir="up"' + (i === 0 ? ' disabled' : '') + ' title="تحريك لأعلى">' + appIcon('chevron-down', 11, 'rotate-180') + '</button>'
       +     '<button class="mini-btn mini-move" data-act="move-student" data-arch="' + idx + '" data-id="' + st.id + '" data-dir="down"' + (i === students.length - 1 ? ' disabled' : '') + ' title="تحريك لأسفل">' + appIcon('chevron-down', 11) + '</button>'
       +     (st.phone ? '<a class="mini-btn mini-call" href="tel:' + esc(st.phone) + '">' + appIcon('phone', 11) + ' اتصال</a>' : '')
       +     (st.phone ? '<button class="mini-btn mini-wa" data-act="wa" data-arch="' + idx + '" data-id="' + st.id + '">' + appIcon('whatsapp', 11) + ' واتساب</button>' : '')
       +     '<button class="mini-btn mini-wa" data-act="student-summary" data-arch="' + idx + '" data-id="' + st.id + '" title="ملخص حضور واختبارات الطالب عبر واتساب">' + appIcon('share', 11) + ' ملخص</button>'
       +     '<button class="mini-btn mini-edit" data-act="view-arch-student" data-arch="' + idx + '" data-id="' + st.id + '" title="تعديل بيانات الطالب">' + appIcon('edit', 11) + '</button>'
       +     '<button class="mini-btn mini-del" data-act="del-arch-student" data-arch="' + idx + '" data-id="' + st.id + '" title="حذف الطالب من هذا الشهر المؤرشف فقط">' + appIcon('trash', 11) + '</button>'
       +   '</div>'
       + '</td>';

    sd.customFields.forEach(f => { h += '<td>' + esc((st && st.fields && st.fields[f.id]) || '') + '</td>'; });

    a.sessions.forEach(s => {
      const rec = (a.records[st.id] && a.records[st.id][s.id]) || {};
      h += '<td><div class="cell-wrap">'
         + statusSelectHTML(st.id, s.id, rec.status || '', idx, statuses)
         + dayNoteHTML(st.id, s.id, rec.note || '', idx)
         + '</div></td>';
    });

    const note = (a.records[st.id] && a.records[st.id]['__note__']) || '';
    h += '<td><textarea class="note-input" data-act="note" data-arch="' + idx + '" data-id="' + st.id + '" placeholder="...">' + esc(note) + '</textarea></td>';
    if(a.subscription) h += '<td><label class="paid-toggle"><input type="checkbox" data-act="paid" data-arch="' + idx + '" data-id="' + st.id + '"' + (st && st.paid ? ' checked' : '') + '> دفع</label></td>';
    h += '</tr>';
  });

  h += '</tbody><tfoot><tr class="count-row">';
  if(isBulkSelecting) h += '<td></td>';
  h += '<td class="sticky-col">حضور الحصة</td>';
  sd.customFields.forEach(() => h += '<td></td>');
  a.sessions.forEach(s => {
    let c = 0;
    students.forEach(st => { const rec = (a.records[st.id] && a.records[st.id][s.id]) || {}; if(isPresentStatus(rec.status, eff)) c++; });
    h += '<td><b>' + c + ' / ' + students.length + '</b></td>';
  });
  h += '<td></td>';
  if(a.subscription) h += '<td></td>';
  h += '</tr></tfoot></table></div>';
  return h;
}

function renderArchExamsTable(a, idx, displayStudents){
  const exams = a.exams || [];
  const hiddenList = a.hiddenExamStudents || [];
  let students = (displayStudents || archiveStudents(a)).filter(st => !hiddenList.includes(st.id));

  if(exams.length === 0){
    return '<div class="empty-state" style="padding:24px;text-align:center;background:var(--card);border-radius:12px;margin-top:12px">'
      + '<h3>' + appIcon('file-text', 18) + ' لا توجد اختبارات مسجلة في هذا الشهر المؤرشف</h3>'
      + '<p class="muted">يمكنك إضافة اختبارات ورصد درجاتها مباشرة لهذا الشهر دون الحاجة لاستعادته.</p>'
      + '<button class="btn btn-primary" onclick="addExamModal(state.archive[' + idx + '], null, true, ' + idx + ')" style="margin-top:10px">' + appIcon('plus', 13) + ' إضافة اختبار جديد</button>'
      + '</div>';
  }

  let h = '<div class="table-wrap" style="margin-top:12px"><table id="archExamsTable"><thead><tr>';
  h += '<th class="sticky-col">اسم الطالب</th>';
  exams.forEach(ex => {
    h += '<th><div style="font-size:12px;font-weight:800">' + esc(ex.name) + '</div>'
      + '<span class="exam-max-badge">الدرجة: ' + ex.maxScore + (ex.date ? ' (' + esc(ex.date) + ')' : '') + '</span>'
      + '<div style="display:flex;gap:4px;justify-content:center;margin-top:3px">'
      +   '<button class="mini-btn mini-edit" data-act="edit-exam" data-arch="' + idx + '" data-id="' + ex.id + '" title="تعديل الاختبار">' + appIcon('edit', 11) + '</button>'
      +   '<button class="mini-btn mini-del" data-act="del-exam" data-arch="' + idx + '" data-id="' + ex.id + '" title="حذف الاختبار">✕</button>'
      + '</div>'
      + '</th>';
  });
  h += '<th>المتوسط %</th></tr></thead><tbody>';

  pagedStudents.forEach((st, i) => {
    const studentScores = (a.examScores && a.examScores[st.id]) || {};
    const exclusions = (a.examExclusions && a.examExclusions[st.id]) || {};
    const notes = (a.examNotes && a.examNotes[st.id]) || {};
    let totalPct = 0, examCount = 0;
    const _exNameNorm = normalizeForSearch(st.name || '');
    const _exPhone = ((st.phone || '') + ' ' + (st.guardianPhone || '') + ' ' + (st.extraPhones||[]).join(' ')).toLowerCase();

    h += '<tr data-sid="' + st.id + '" data-name-norm="' + esc(_exNameNorm) + '" data-phone="' + esc(_exPhone) + '"><td class="sticky-col student-cell">'
      +   '<div class="student-name">'
      +     '<span class="student-num">' + (startIdx + i + 1) + '.</span> '
      +     '<span class="st-name-click" data-act="view-arch-student" data-id="' + st.id + '" data-arch="' + idx + '" style="cursor:pointer;font-weight:700;color:var(--primary);text-decoration:underline">' + esc(st.name) + '</span>'
      +   '</div>'
      +   '<div style="font-size:10px;color:#64748b;direction:ltr;margin-top:2px">' + esc(localPhone(st.phone)) + '</div>'
      + '</td>';

    exams.forEach(ex => {
      const isExcluded = !!exclusions[ex.id];
      const noteText = notes[ex.id] || '';
      const scoreVal = studentScores[ex.id] !== undefined ? studentScores[ex.id] : '';
      const pct = (!isExcluded && scoreVal !== '' && ex.maxScore > 0) ? Math.round((Number(scoreVal) / ex.maxScore) * 100) : null;
      if(pct !== null){ totalPct += pct; examCount++; }

      h += '<td class="exam-td" data-sid="' + st.id + '" data-eid="' + ex.id + '" style="text-align:center">'
        +   buildExamCellHTML(st.id, ex.id, scoreVal, isExcluded, noteText, ex.maxScore, pct)
        + '</td>';
    });

    const avgPct = examCount > 0 ? Math.round(totalPct / examCount) : null;
    h += '<td class="exam-avg-cell" style="text-align:center;font-weight:bold">' + (avgPct !== null ? avgPct + '%' : '-') + '</td>';
    h += '</tr>';
  });

  h += '</tbody></table></div>' + archExamsPagHtml;
  return h;
}


/* ---------- ⚡ وضع الأداء القياسي للهواتف الضعيفة ---------- */
function applyLiteModeUI(){
  if(state && state.settings && state.settings.liteMode){
    document.body.classList.add('lite-mode');
  } else {
    document.body.classList.remove('lite-mode');
  }
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

  const lm = $('#set_liteMode');
  if(lm) lm.checked = !!sd.liteMode;

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

  $('#statusList').innerHTML = sd.statuses.map(s => {
    const type = s.type || (s.id === 'st_done' ? 'present' : s.id === 'st_apology' ? 'apology' : 'absent');
    return '<div class="status-edit-row">'
      + '<input type="color" value="'+esc(s.color)+'" data-act="status-color" data-id="'+s.id+'">'
      + '<input type="text" value="'+esc(s.label)+'" data-act="status-label" data-id="'+s.id+'">'
      + '<select data-act="status-type" data-id="'+s.id+'" style="font-size:12px;font-weight:700;padding:4px 6px;border-radius:6px;border:1px solid var(--border)">'
      +   '<option value="present"' + (type === 'present' ? ' selected' : '') + '>🟢 حاضر</option>'
      +   '<option value="apology"' + (type === 'apology' ? ' selected' : '') + '>🟡 اعتذار</option>'
      +   '<option value="absent"' + (type === 'absent' ? ' selected' : '') + '>🔴 غائب</option>'
      + '</select>'
      + '<button class="del-status" data-act="del-status" data-id="'+s.id+'">حذف</button>'
      + '</div>';
  }).join('');

  /* مؤشرات خطر الغياب */
  const indicators = sd.attendanceIndicators || [];
  $('#indicatorList').innerHTML = indicators.map(ind =>
    '<div class="status-edit-row">'
    + '<input type="color" value="'+esc(ind.color)+'" data-act="ind-color" data-id="'+ind.id+'">'
    + '<input type="text" value="'+esc(ind.label)+'" data-act="ind-label" data-id="'+ind.id+'" style="width:90px">'
    + '<input type="number" value="'+ind.minPct+'" data-act="ind-pct" data-id="'+ind.id+'" min="0" max="100" style="width:55px" title="الحد الأدنى لنسبة الحضور %">%'
    + '</div>'
  ).join('') || '<p class="muted">لا توجد مؤشرات.</p>';

  renderTgBotsList();
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
  // تم إيقاف المطالبة المنبثقة التلقائية عند فتح التطبيق مع بقاء إمكانية التفعيل اليدوي من الإعدادات
  return;
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
  let dedicatedSeen = 0;
  try { dedicatedSeen = versionNum(localStorage.getItem('daftar_popup_seen_version') || ''); }catch(e){}
  const popupSeen = Math.max(versionNum(saved.popupSeenVersion || ''), dedicatedSeen);

  if(popupSeen >= current){
    if(next) next();
    return;
  }

  // حفظ الإصدار فوراً لمنع تكرار النافذة المنبثقة حتى لو تم إغلاقها بالنقر بالخارج أو الرجوع أو التحديث
  saved.popupSeenVersion = APP_VERSION;
  try{
    localStorage.setItem(CHANGELOG_STORE_KEY, JSON.stringify(saved));
    localStorage.setItem('daftar_popup_seen_version', APP_VERSION);
  }catch(e){}

  const entries = whatsNewList();
  if(entries.length === 0){
    if(next) next();
    return;
  }
  const html = entries.map(en =>
    '<div class="changelog-ver"><b>🆕 التحديث ' + esc(en.v) + '</b><ul>' + en.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>'
  ).join('');
  openModal('ما الجديد في ' + APP_VERSION + '؟', html + '<div class="modal-actions"><button class="btn" id="cl_ok">تمام</button></div>');
  $('#cl_ok').onclick = () => {
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
let toastHideTimer = null;
function showToastMessage(msg){
  const toast = $('#toast');
  if(!toast) return;
  const body = $('#toastBody');
  if(body) {
    let cleanMsg = String(msg || '');
    if (cleanMsg.startsWith('✅')) {
      cleanMsg = appIcon('check-circle', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('⚠️')) {
      cleanMsg = appIcon('alert', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('🗑️') || cleanMsg.startsWith('🗑')) {
      cleanMsg = appIcon('trash', 16, 'toast-icon') + ' ' + cleanMsg.replace(/^🗑️?/, '').trim();
    } else if (cleanMsg.startsWith('💾')) {
      cleanMsg = appIcon('save', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('❌')) {
      cleanMsg = appIcon('x-circle', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('🚫')) {
      cleanMsg = appIcon('user-x', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('⚡') || cleanMsg.startsWith('✨')) {
      cleanMsg = appIcon('zap', 16, 'toast-icon') + ' ' + cleanMsg.slice(cleanMsg.startsWith('⚡') ? 1 : 2).trim();
    } else if (cleanMsg.startsWith('📦')) {
      cleanMsg = appIcon('archive', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('🔔')) {
      cleanMsg = appIcon('bell', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('📱')) {
      cleanMsg = appIcon('smartphone', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('🚀')) {
      cleanMsg = appIcon('send', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('📋')) {
      cleanMsg = appIcon('copy', 16, 'toast-icon') + ' ' + cleanMsg.slice(2).trim();
    } else if (cleanMsg.startsWith('💡') || cleanMsg.startsWith('ℹ️')) {
      cleanMsg = appIcon('info', 16, 'toast-icon') + ' ' + cleanMsg.replace(/^(💡|ℹ️)/, '').trim();
    }
    body.innerHTML = cleanMsg;
  }
  toast.hidden = false;
  clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => {
    if(toast) toast.hidden = true;
  }, 3500);
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
/* ---------- حالات الدرس (تخصيص كامل لكل درس) ---------- */
function effectiveStatuses(lesson){
  const base = state.settings.statuses;
  if(!lesson) return base;
  if(Array.isArray(lesson.statuses) && lesson.statuses.length > 0){
    return lesson.statuses.map(s => ({
      id: s.id || uid('st'),
      label: s.label || 'حالة',
      color: s.color || '#2563eb',
      type: s.type || (s.id === 'st_done' ? 'present' : s.id === 'st_apology' ? 'apology' : 'absent')
    }));
  }
  if(lesson.statusLabels && typeof lesson.statusLabels === 'object' && Object.keys(lesson.statusLabels).length > 0){
    return base.map(s => ({
      id: s.id,
      label: lesson.statusLabels[s.id] || s.label,
      color: s.color,
      type: s.type || (s.id === 'st_done' ? 'present' : s.id === 'st_apology' ? 'apology' : 'absent')
    }));
  }
  return base;
}

function lessonStatusesEditor(lesson, isArchive = false, archIdx = null){
  const eff = effectiveStatuses(lesson);
  let localStatuses = JSON.parse(JSON.stringify(eff));

  function renderRows(){
    const container = $('#ls_rows_container');
    if(!container) return;
    container.innerHTML = localStatuses.map((s, idx) => {
      const type = s.type || (s.id === 'st_done' ? 'present' : s.id === 'st_apology' ? 'apology' : 'absent');
      return '<div class="status-edit-row" data-idx="' + idx + '" style="background:#f8fafc;padding:8px 10px;border-radius:8px;border:1px solid var(--border);margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
        + '<input type="color" class="ls-color" value="' + esc(s.color || '#2563eb') + '" title="اختر لون الزر بحرية" style="width:40px;height:36px;border:1px solid var(--border);border-radius:6px;cursor:pointer;padding:2px">'
        + '<input type="text" class="ls-label" value="' + esc(s.label) + '" placeholder="اسم الحالة (مثال: استماع صوتي)" style="flex:2;min-width:130px;font-weight:700;padding:6px 10px;border-radius:6px;border:1px solid var(--border)">'
        + '<select class="ls-type" style="flex:1.5;min-width:140px;font-size:12px;font-weight:700;padding:6px 8px;border-radius:6px;border:1px solid var(--border);background:#fff">'
        +   '<option value="present"' + (type === 'present' ? ' selected' : '') + '>حاضر (يُحسب حضور)</option>'
        +   '<option value="apology"' + (type === 'apology' ? ' selected' : '') + '>اعتذار (غياب بعذر)</option>'
        +   '<option value="absent"' + (type === 'absent' ? ' selected' : '') + '>غائب (غياب بدون عذر)</option>'
        + '</select>'
        + (localStatuses.length > 1 ? '<button class="del-status ls-del" data-idx="' + idx + '" title="حذف الحالة" style="padding:6px 10px;font-size:12px;border:none;border-radius:6px;background:#fee2e2;color:#991b1b;cursor:pointer;font-weight:700">✕</button>' : '')
        + '</div>';
    }).join('');

    $$('#ls_rows_container .ls-color').forEach((inp, i) => {
      inp.oninput = (e) => { if(localStatuses[i]) localStatuses[i].color = e.target.value; };
    });
    $$('#ls_rows_container .ls-label').forEach((inp, i) => {
      inp.oninput = (e) => { if(localStatuses[i]) localStatuses[i].label = e.target.value; };
    });
    $$('#ls_rows_container .ls-type').forEach((sel, i) => {
      sel.onchange = (e) => { if(localStatuses[i]) localStatuses[i].type = e.target.value; };
    });
    $$('#ls_rows_container .ls-del').forEach((btn) => {
      btn.onclick = () => {
        const i = parseInt(btn.dataset.idx, 10);
        if(!isNaN(i) && localStatuses.length > 1){
          localStatuses.splice(i, 1);
          renderRows();
        }
      };
    });
  }

  const modalHtml = '<div style="text-align:right;direction:rtl">'
    + '<p class="muted" style="margin-top:0;font-size:12.5px;line-height:1.6">'
    +   'يمكنك إضافة أو تعديل حالات الحضور واختيار لون الزر بحرية كاملة، مع تحديد معنى كل حالة حسابياً (حاضر أم غائب أم اعتذار) دون أن يتغير لون الزر الذي اخترته للأخضر.'
    + '</p>'
    + '<div id="ls_rows_container" style="max-height:340px;overflow-y:auto;padding:2px"></div>'
    + '<button class="btn btn-outline btn-sm" id="ls_add_btn" style="margin-top:6px;width:100%;justify-content:center;font-weight:700">' + appIcon('plus', 14) + ' إضافة حالة جديدة للدرس</button>'
    + '<div class="modal-actions" style="margin-top:16px">'
    +   '<button class="btn btn-primary" id="ls_save_btn">' + appIcon('save', 14) + ' حفظ التخصيص للدرس</button>'
    +   '<button class="btn btn-outline" id="ls_reset_btn">' + appIcon('refresh', 14) + ' استخدام العام (الافتراضي)</button>'
    +   '<button class="btn btn-outline" id="ls_cancel_btn">إلغاء</button>'
    + '</div>'
    + '</div>';

  const lessonDisplayName = lesson.lessonName || lesson.name || 'الدرس';
  openModal('تخصيص حالات الحضور لدرس «' + esc(lessonDisplayName) + '»', modalHtml);
  renderRows();

  $('#ls_add_btn').onclick = () => {
    const newId = 'st_custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    localStatuses.push({
      id: newId,
      label: 'حالة جديدة',
      color: STATUS_COLORS[localStatuses.length % STATUS_COLORS.length] || '#2563eb',
      type: 'present'
    });
    renderRows();
  };

  $('#ls_reset_btn').onclick = () => {
    if(!window.confirm('هل تريد إلغاء التخصيص والعودة لاستخدام الحالات العامة لجميع الدروس؟')) return;
    delete lesson.statuses;
    delete lesson.statusLabels;
    saveState();
    if(isArchive && archIdx !== null && archIdx !== undefined){
      renderArchiveDetail(archIdx);
    } else {
      renderLessonDetail();
    }
    closeModal();
    showToastMessage('✅ تم استعادة الحالات الافتراضية للدرس.');
  };

  $('#ls_save_btn').onclick = () => {
    const cleaned = localStatuses.map(s => ({
      id: s.id || uid('st'),
      label: (s.label || '').trim() || 'حالة',
      color: s.color || '#2563eb',
      type: s.type || 'present'
    }));
    if(cleaned.length === 0){
      alert('يجب أن يحتوي الدرس على حالة واحدة على الأقل.');
      return;
    }
    lesson.statuses = cleaned;
    delete lesson.statusLabels;
    saveState();
    if(isArchive && archIdx !== null && archIdx !== undefined){
      renderArchiveDetail(archIdx);
    } else {
      renderLessonDetail();
    }
    closeModal();
    showToastMessage('✅ تم حفظ تخصيص حالات الدرس بنجاح.');
  };

  $('#ls_cancel_btn').onclick = closeModal;
}

function computeStats(students, sessions, records, statuses){
  const stList = statuses || state.settings.statuses;
  return students.map(st => {
    const recs = records[st.id] || {};
    const counts = {};
    stList.forEach(s => counts[s.id] = 0);
    let marked = 0;
    let done = 0;
    sessions.forEach(s => {
      const status = recs[s.id] && recs[s.id].status;
      if(status){
        marked++;
        counts[status] = (counts[status] || 0) + 1;
        if(isPresentStatus(status, stList)) done++;
      }
    });
    const total = sessions.length;
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
    ps.forEach(s => { if(recs[s.id] && isPresentStatus(recs[s.id].status, effectiveStatuses(lesson))) done++; });
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

  let selectedCustomStudentIds = new Set(students.map(st => st.id));

  const filterHTML = dated.length
    ? '<div class="range-filter"><span>📅 فترة التقرير:</span>'
      + '<label>من <input type="date" id="rangeFrom" value="'+minDate+'"></label>'
      + '<label>إلى <input type="date" id="rangeTo" value="'+maxDate+'"></label>'
      + '</div>'
    : '';

  const studentFilterHTML = '<div style="background:var(--card-bg,#f8fafc);border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin:8px 0">'
    + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    +   '<label style="font-size:12px;font-weight:700">👥 تضمين الطلاب في التقرير:</label>'
    +   '<select id="rep_student_scope" style="padding:4px 8px;font-size:12px;font-weight:700;border-radius:6px;border:1px solid var(--border);background:#fff;cursor:pointer">'
    +     '<option value="all">جميع الطلاب (' + students.length + ')</option>'
    +     '<option value="attended">الطلاب الحاضرون فقط (نسبة > 0%)</option>'
    +     '<option value="regular">الطلاب المنتظمون (نسبة ≥ 50%)</option>'
    +     (selectedStudentIds.size > 0 ? '<option value="current_selection">الطلاب المحددون حالياً (' + selectedStudentIds.size + ')</option>' : '')
    +     '<option value="custom">تحديد مخصص بالأسماء...</option>'
    +   '</select>'
    + '</div>'
    + '<div id="rep_custom_picker_wrap" style="display:none;margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
    +     '<span style="font-size:11.5px;font-weight:700;color:var(--primary)">اختر الطلاب المراد تضمينهم في التقرير:</span>'
    +     '<label style="cursor:pointer;font-size:11.5px;font-weight:700"><input type="checkbox" id="chk_picker_all" checked> تحديد / إلغاء الكل</label>'
    +   '</div>'
    +   '<div style="max-height:160px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;padding:2px">'
    +     students.map((st, i) => '<label style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#fff;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:12px">'
    +       '<input type="checkbox" class="rep-custom-st-chk" value="' + st.id + '" checked>'
    +       '<span style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (i + 1) + '. ' + esc(st.name) + '</span>'
    +     '</label>').join('')
    +   '</div>'
    + '</div>'
    + '</div>';

  openModal('📊 تقرير وتحليل ' + title, filterHTML + studentFilterHTML + '<div id="analyticsTableWrap"></div>');
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.innerHTML =
    '<div style="width:100%;margin-bottom:8px;text-align:right">'
    + '<label class="switch-row" style="font-size:12px;font-weight:700;display:inline-flex;align-items:center;cursor:pointer">'
    +   '<input type="checkbox" id="rep_group_by_groups" style="margin-left:6px">'
    +   '<span>🗂️ تقسيم وترتيب حسب المجموعات في ورقة واحدة</span>'
    + '</label>'
    + '</div>'
    + '<button class="btn btn-outline" id="analyticsCsv">⬇️ Excel (CSV)</button>'
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

    let targetStudents = students;
    const scope = $('#rep_student_scope') ? $('#rep_student_scope').value : 'all';
    const allRows = computeStats(students, curSessions, records, statuses);
    if(scope === 'attended'){
      targetStudents = allRows.filter(r => r.pct > 0).map(r => r.st);
    } else if(scope === 'regular'){
      targetStudents = allRows.filter(r => r.pct >= 50).map(r => r.st);
    } else if(scope === 'current_selection'){
      targetStudents = students.filter(st => selectedStudentIds.has(st.id));
    } else if(scope === 'custom'){
      targetStudents = students.filter(st => selectedCustomStudentIds.has(st.id));
    }

    const rows = computeStats(targetStudents, curSessions, records, statuses);
    let body = '<div class="table-wrap"><table class="stats-table"><thead><tr><th>الطالب</th>';
    stList.forEach(s => body += '<th>'+esc(s.label)+'</th>');
    body += '<th>نسبة الحضور</th></tr></thead><tbody>';
    rows.forEach(r => {
      body += '<tr><td style="text-align:right;font-weight:700">'+esc(r.st.name)+'</td>';
      stList.forEach(s => body += '<td>'+(r.counts[s.id]||0)+'</td>');
      body += '<td><div class="bar" style="display:inline-block"><i style="width:'+r.pct+'%"></i></div> <b>'+r.pct+'%</b></td></tr>';
    });
    body += '</tbody></table></div>';
    body += '<p class="muted" style="font-size:12px;margin:6px 0 0">الطلاب المعروضون: <b>' + targetStudents.length + '</b> من إجمالي ' + students.length + ' طالب' + (dated.length ? ' · الحصص المحسوبة: ' + curSessions.filter(s => s.date).length + ' من ' + sessions.length : '') + '</p>';
    $('#analyticsTableWrap').innerHTML = body;

    $('#analyticsCsv').onclick = () => { const gMode = $('#rep_group_by_groups') ? $('#rep_group_by_groups').checked : false; exportCSV(targetStudents, curSessions, records, title, statuses, gMode); };
    $('#analyticsPdf').onclick = () => { const gMode = $('#rep_group_by_groups') ? $('#rep_group_by_groups').checked : false; printReport(targetStudents, curSessions, records, title, statuses, gMode); };
  }
  applyRange();
  if($('#rangeFrom')) $('#rangeFrom').onchange = applyRange;
  if($('#rangeTo')) $('#rangeTo').onchange = applyRange;

  const scopeSel = $('#rep_student_scope');
  const customWrap = $('#rep_custom_picker_wrap');
  if(scopeSel){
    scopeSel.onchange = () => {
      if(scopeSel.value === 'custom'){
        if(customWrap) customWrap.style.display = 'block';
      } else {
        if(customWrap) customWrap.style.display = 'none';
      }
      applyRange();
    };
  }

  const chkAll = $('#chk_picker_all');
  if(chkAll){
    chkAll.onchange = (e) => {
      const isChecked = e.target.checked;
      $$('.rep-custom-st-chk').forEach(cb => { cb.checked = isChecked; });
      selectedCustomStudentIds.clear();
      if(isChecked){
        students.forEach(st => selectedCustomStudentIds.add(st.id));
      }
      applyRange();
    };
  }

  $$('.rep-custom-st-chk').forEach(cb => {
    cb.onchange = () => {
      if(cb.checked) selectedCustomStudentIds.add(cb.value);
      else selectedCustomStudentIds.delete(cb.value);
      if(chkAll) chkAll.checked = (selectedCustomStudentIds.size === students.length);
      applyRange();
    };
  });

  $('#analyticsClose').onclick = closeModal;
}

/* ---------- التقرير الشامل عبر الشهور المؤرشفة والدرجات (v34) ---------- */
function comprehensiveData(lesson, fromDate, toDate){
  const inRange = (s) => {
    if(!s.date) return true;
    if(fromDate && s.date < fromDate) return false;
    if(toDate && s.date > toDate) return false;
    return true;
  };
  const inRangeExam = (ex) => {
    if(!ex.date) return true;
    if(fromDate && ex.date < fromDate) return false;
    if(toDate && ex.date > toDate) return false;
    return true;
  };

  const months = state.archive
    .filter(a => a.lessonId === lesson.id)
    .sort((a,b) => (a.year - b.year) || (a.monthNumber - b.monthNumber))
    .map(a => ({
      label: 'شهر ' + a.monthNumber + '/' + a.year,
      monthNumber: a.monthNumber,
      year: a.year,
      sessions: (a.sessions||[]).filter(inRange),
      records: a.records||{},
      students: archiveStudents(a),
      exams: (a.exams || []).filter(inRangeExam),
      examScores: a.examScores || {},
      examNotes: a.examNotes || {},
      examExclusions: a.examExclusions || {},
      hiddenExamStudents: a.hiddenExamStudents || []
    }))
    .filter(m => pastSessions(m.sessions).length > 0 || m.exams.length > 0);

  /* الشهر الحالي (إلى لحظة توقف الدرس) */
  if(lesson && (pastSessions((lesson.sessions||[]).filter(inRange)).length || (lesson.exams||[]).filter(inRangeExam).length)){
    months.push({
      label: 'شهر ' + lesson.monthNumber + '/' + lesson.year,
      monthNumber: lesson.monthNumber,
      year: lesson.year,
      sessions: (lesson.sessions||[]).filter(inRange),
      records: lesson.records||{},
      students: lesson.students||[],
      exams: (lesson.exams || []).filter(inRangeExam),
      examScores: lesson.examScores || {},
      examNotes: lesson.examNotes || {},
      examExclusions: lesson.examExclusions || {},
      hiddenExamStudents: lesson.hiddenExamStudents || []
    });
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
    let totalExamPctSum = 0;
    let totalExamCount = 0;

    const per = months.map(m => {
      // 1. Attendance stats
      const recs = (m.records && m.records[st.id]) || {};
      const ps = pastSessions(m.sessions);
      let done = 0;
      ps.forEach(s => { if(recs[s.id] && isPresentStatus(recs[s.id].status, effectiveStatuses(lesson))) done++; });
      const total = ps.length;
      const pct = total ? Math.round(done / total * 100) : 0;

      // 2. Exam stats for this month
      let mExamPctSum = 0;
      let mExamCount = 0;
      const isHidden = (m.hiddenExamStudents || []).includes(st.id);
      if(!isHidden){
        (m.exams || []).forEach(ex => {
          const isExcluded = !!(m.examExclusions && m.examExclusions[st.id] && m.examExclusions[st.id][ex.id]);
          if(isExcluded) return;
          const scoreVal = (m.examScores && m.examScores[st.id] && m.examScores[st.id][ex.id]);
          if(scoreVal !== undefined && scoreVal !== '' && !isNaN(Number(scoreVal)) && ex.maxScore > 0){
            mExamPctSum += Math.round((Number(scoreVal) / ex.maxScore) * 100);
            mExamCount++;
          }
        });
      }
      const examAvgPct = mExamCount > 0 ? Math.round(mExamPctSum / mExamCount) : null;
      if(examAvgPct !== null){
        totalExamPctSum += examAvgPct;
        totalExamCount++;
      }

      return {
        done: done,
        total: total,
        pct: pct,
        examAvgPct: examAvgPct,
        examCount: mExamCount,
        isHiddenFromExams: isHidden
      };
    });

    const tot = per.reduce((acc,p) => ({ done: acc.done + p.done, total: acc.total + p.total }), { done:0, total:0 });
    const pct = tot.total ? Math.round(tot.done / tot.total * 100) : 0;
    const totExamPct = totalExamCount > 0 ? Math.round(totalExamPctSum / totalExamCount) : null;

    return { st: st, per: per, tot: tot, pct: pct, totExamPct: totExamPct, totalExamCount: totalExamCount };
  });

  rows.sort((x,y) => y.pct - x.pct);
  return { months: months, rows: rows, range: { from: fromDate || '', to: toDate || '' } };
}

function showComprehensiveReport(lesson, initialMode){
  const allDates = [];
  state.archive.filter(a => a.lessonId === lesson.id).forEach(a => {
    (a.sessions||[]).forEach(s => { if(s.date) allDates.push(s.date); });
    (a.exams||[]).forEach(ex => { if(ex.date) allDates.push(ex.date); });
  });
  (lesson.sessions||[]).forEach(s => { if(s.date) allDates.push(s.date); });
  (lesson.exams||[]).forEach(ex => { if(ex.date) allDates.push(ex.date); });

  const minDate = allDates.length ? allDates.reduce((a,b) => a < b ? a : b) : '';
  const maxDate = allDates.length ? allDates.reduce((a,b) => a > b ? a : b) : '';
  const hasDates = allDates.length > 0;

  let currentCompMode = initialMode || 'attendance'; // 'attendance' | 'exams' | 'combined'
  const allLessonStudents = lesson.students || [];
  let compCustomStudentIds = new Set(allLessonStudents.map(st => st.id));

  const filterHTML = hasDates
    ? '<div class="range-filter"><span>' + appIcon('calendar', 13) + ' فترة التقرير:</span>'
      + '<label>من <input type="date" id="compRangeFrom" value="'+minDate+'"></label>'
      + '<label>إلى <input type="date" id="compRangeTo" value="'+maxDate+'"></label>'
      + '</div>'
    : '';

  const modeTabsHTML = '<div class="comp-mode-tabs">'
    + '<button type="button" class="comp-mode-btn' + (currentCompMode === 'attendance' ? ' active' : '') + '" data-mode="attendance">' + appIcon('calendar', 13) + ' نسب الحضور</button>'
    + '<button type="button" class="comp-mode-btn' + (currentCompMode === 'exams' ? ' active' : '') + '" data-mode="exams">' + appIcon('file-text', 13) + ' درجات الاختبارات</button>'
    + '<button type="button" class="comp-mode-btn' + (currentCompMode === 'combined' ? ' active' : '') + '" data-mode="combined">' + appIcon('bar-chart-2', 13) + ' عرض مدمج (حضور + اختبارات)</button>'
    + '</div>';

  const studentFilterHTML = '<div style="background:var(--card-bg,#f8fafc);border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin:8px 0">'
    + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    +   '<label style="font-size:12px;font-weight:700">' + appIcon('users', 13) + ' تضمين الطلاب في التقرير الشامل:</label>'
    +   '<select id="comp_student_scope" style="padding:4px 8px;font-size:12px;font-weight:700;border-radius:6px;border:1px solid var(--border);background:#fff;cursor:pointer">'
    +     '<option value="all">جميع طلاب الدرس (' + allLessonStudents.length + ')</option>'
    +     '<option value="attended">الطلاب الحاضرون فقط (نسبة > 0%)</option>'
    +     '<option value="regular">الطلاب المنتظمون (نسبة ≥ 50%)</option>'
    +     (selectedStudentIds.size > 0 ? '<option value="current_selection">الطلاب المحددون حالياً (' + selectedStudentIds.size + ')</option>' : '')
    +     '<option value="custom">تحديد مخصص بالأسماء...</option>'
    +   '</select>'
    + '</div>'
    + '<div id="comp_custom_picker_wrap" style="display:none;margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
    +     '<span style="font-size:11.5px;font-weight:700;color:var(--primary)">اختر الطلاب المراد تضمينهم في التقرير الشامل:</span>'
    +     '<label style="cursor:pointer;font-size:11.5px;font-weight:700"><input type="checkbox" id="chk_comp_picker_all" checked> تحديد / إلغاء الكل</label>'
    +   '</div>'
    +   '<div style="max-height:160px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;padding:2px">'
    +     allLessonStudents.map((st, i) => '<label style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#fff;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:12px">'
    +       '<input type="checkbox" class="comp-custom-st-chk" value="' + st.id + '" checked>'
    +       '<span style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (i + 1) + '. ' + esc(st.name) + '</span>'
    +     '</label>').join('')
    +   '</div>'
    + '</div>'
    + '</div>';

  const groupToggleHTML = (Array.isArray(lesson.groups) && lesson.groups.length > 0)
    ? '<div style="margin:8px 0;padding:6px 10px;background:var(--card-bg,#f8fafc);border:1px solid var(--border);border-radius:8px">'
      + '<label class="switch-row" style="font-size:12px;font-weight:700;display:flex;align-items:center;cursor:pointer">'
      +   '<input type="checkbox" id="comp_group_by_groups" style="margin-left:6px">'
      +   '<span>' + appIcon('folder', 13) + ' تقسيم وترتيب الطلاب حسب مجموعات الدرس في ورقة واحدة (PDF / Excel)</span>'
      + '</label>'
      + '</div>'
    : '';

  openModal('📊 تقرير شامل - ' + esc(lesson.name), filterHTML + modeTabsHTML + studentFilterHTML + groupToggleHTML + '<div id="compTableWrap"></div>');
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.innerHTML = '<button class="btn btn-outline" id="compCsv">' + appIcon('download', 14) + ' Excel (CSV)</button><button class="btn btn-primary" id="compPdf">' + appIcon('printer', 14) + ' حفظ كـ PDF / طباعة A4</button><button class="btn btn-outline" id="compDownloadHtml" title="تنزيل نسخة ويب للطباعة جاهزة للمطبعة">' + appIcon('download', 14) + ' تنزيل للطباعة (للمطبعة)</button><button class="btn" id="compClose">إغلاق</button>';
  $('#modalBody').appendChild(actions);

  let curData = null;
  let activeFilteredData = null;

  function applyRange(){
    const from = $('#compRangeFrom') ? $('#compRangeFrom').value : '';
    const to = $('#compRangeTo') ? $('#compRangeTo').value : '';
    curData = comprehensiveData(lesson, from, to);
    if(!curData){
      $('#compTableWrap').innerHTML = '<p class="muted">لا توجد شهور مؤرشفة ولا حصص أو اختبارات في هذه الفترة.</p>';
      return;
    }
    let { months, rows } = curData;
    const compScope = $('#comp_student_scope') ? $('#comp_student_scope').value : 'all';
    if(compScope === 'attended'){
      rows = rows.filter(r => r.pct > 0 || (r.totExamPct !== null && r.totExamPct > 0));
    } else if(compScope === 'regular'){
      rows = rows.filter(r => r.pct >= 50);
    } else if(compScope === 'current_selection'){
      rows = rows.filter(r => selectedStudentIds.has(r.st.id));
    } else if(compScope === 'custom'){
      rows = rows.filter(r => compCustomStudentIds.has(r.st.id));
    }

    activeFilteredData = { months, rows, range: curData.range };

    let t = '<div class="table-wrap" style="max-height:55vh;overflow:auto"><table class="stats-table comp-table"><thead><tr><th class="sticky-col">الطالب</th>';
    months.forEach(a => t += '<th>' + a.monthNumber + '/' + a.year + '</th>');
    
    if(currentCompMode === 'attendance'){
      t += '<th>النسبة الكلية</th></tr></thead><tbody>';
      rows.forEach(r => {
        t += '<tr><td class="sticky-col"><span class="comp-st-name">' + esc(r.st.name) + '</span><span class="comp-st-phone">' + esc(localPhone(r.st.phone)) + '</span></td>';
        r.per.forEach(p => t += '<td><span class="comp-count">' + p.done + '/' + p.total + '</span><b>' + p.pct + '%</b></td>');
        t += '<td><b>' + r.pct + '%</b></td></tr>';
      });
    } else if(currentCompMode === 'exams'){
      t += '<th>متوسط الاختبارات</th></tr></thead><tbody>';
      rows.forEach(r => {
        t += '<tr><td class="sticky-col"><span class="comp-st-name">' + esc(r.st.name) + '</span><span class="comp-st-phone">' + esc(localPhone(r.st.phone)) + '</span></td>';
        r.per.forEach(p => {
          if(p.isHiddenFromExams){
            t += '<td><span class="muted" style="font-size:10px">🚫 مستبعد</span></td>';
          } else if(p.examAvgPct !== null){
            const clr = p.examAvgPct >= 50 ? '#15803d' : '#b91c1c';
            t += '<td><span class="comp-count">' + p.examCount + ' اختبار</span><b style="color:' + clr + '">' + p.examAvgPct + '%</b></td>';
          } else {
            t += '<td><span class="muted">-</span></td>';
          }
        });
        const totClr = r.totExamPct !== null ? (r.totExamPct >= 50 ? '#15803d' : '#b91c1c') : 'var(--muted)';
        t += '<td><b style="color:' + totClr + '">' + (r.totExamPct !== null ? r.totExamPct + '%' : '-') + '</b></td></tr>';
      });
    } else { // combined
      t += '<th>الإجمالي (حضور / اختبارات)</th></tr></thead><tbody>';
      rows.forEach(r => {
        t += '<tr><td class="sticky-col"><span class="comp-st-name">' + esc(r.st.name) + '</span><span class="comp-st-phone">' + esc(localPhone(r.st.phone)) + '</span></td>';
        r.per.forEach(p => {
          const exText = p.isHiddenFromExams ? '<span class="muted" style="font-size:10px">🚫 مستبعد</span>' : (p.examAvgPct !== null ? '<b style="color:' + (p.examAvgPct >= 50 ? '#15803d' : '#b91c1c') + '">' + p.examAvgPct + '%</b>' : '<span class="muted">-</span>');
          t += '<td>'
            + '<div class="comp-combined-cell">'
            +   '<span class="comp-comb-att"><span class="comp-count">' + p.done + '/' + p.total + '</span><b>' + p.pct + '%</b></span>'
            +   '<span class="comp-comb-exam">' + exText + '</span>'
            + '</div>'
            + '</td>';
        });
        const combExamText = r.totExamPct !== null ? (r.totExamPct >= 50 ? '#15803d' : '#b91c1c') : 'var(--muted)';
        t += '<td>'
          + '<div class="comp-combined-cell">'
          +   '<span class="comp-comb-att"><b>' + r.pct + '%</b></span>'
          +   '<span class="comp-comb-exam"><b style="color:' + combExamText + '">' + (r.totExamPct !== null ? r.totExamPct + '%' : '-') + '</b></span>'
          + '</div>'
          + '</td></tr>';
      });
    }
    t += '</tbody></table></div>';
    t += '<p class="muted" style="font-size:12px;margin:6px 0 0">الطلاب المعروضون: <b>' + rows.length + '</b> من إجمالي ' + allLessonStudents.length + ' طالب</p>';
    $('#compTableWrap').innerHTML = t;
  }
  applyRange();

  $$('.comp-mode-btn').forEach(btn => {
    btn.onclick = () => {
      $$('.comp-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCompMode = btn.dataset.mode;
      applyRange();
    };
  });

  if($('#compRangeFrom')) $('#compRangeFrom').onchange = applyRange;
  if($('#compRangeTo')) $('#compRangeTo').onchange = applyRange;

  const compScopeSel = $('#comp_student_scope');
  const compCustomWrap = $('#comp_custom_picker_wrap');
  if(compScopeSel){
    compScopeSel.onchange = () => {
      if(compScopeSel.value === 'custom'){
        if(compCustomWrap) compCustomWrap.style.display = 'block';
      } else {
        if(compCustomWrap) compCustomWrap.style.display = 'none';
      }
      applyRange();
    };
  }

  const compChkAll = $('#chk_comp_picker_all');
  if(compChkAll){
    compChkAll.onchange = (e) => {
      const isChecked = e.target.checked;
      $$('.comp-custom-st-chk').forEach(cb => { cb.checked = isChecked; });
      compCustomStudentIds.clear();
      if(isChecked){
        allLessonStudents.forEach(st => compCustomStudentIds.add(st.id));
      }
      applyRange();
    };
  }

  $$('.comp-custom-st-chk').forEach(cb => {
    cb.onchange = () => {
      if(cb.checked) compCustomStudentIds.add(cb.value);
      else compCustomStudentIds.delete(cb.value);
      if(compChkAll) compChkAll.checked = (compCustomStudentIds.size === allLessonStudents.length);
      applyRange();
    };
  });

  $('#compCsv').onclick = () => {
    const isGrouped = $('#comp_group_by_groups') ? $('#comp_group_by_groups').checked : false;
    if(activeFilteredData) exportComprehensiveCSV(lesson, activeFilteredData, currentCompMode, isGrouped);
  };
  $('#compPdf').onclick = () => {
    const isGrouped = $('#comp_group_by_groups') ? $('#comp_group_by_groups').checked : false;
    if(activeFilteredData) printComprehensiveReport(lesson, activeFilteredData, currentCompMode, isGrouped);
  };
  if($('#compDownloadHtml')){
    $('#compDownloadHtml').onclick = () => {
      if(!activeFilteredData) return;
      downloadComprehensivePrintableHTML(lesson, activeFilteredData, currentCompMode);
    };
  }
  $('#compClose').onclick = closeModal;
}

function exportComprehensiveCSV(lesson, data, mode, groupByGroups){
  const compMode = mode || 'attendance';
  const { months, rows } = data;
  const lines = [];
  const head = ['م', 'اسم الطالب (الرقم تحته)'];
  if(groupByGroups) head.push('المجموعة');
  
  if(compMode === 'attendance'){
    months.forEach(a => head.push('شهر ' + a.monthNumber + '/' + a.year));
    head.push('النسبة الكلية %');
  } else if(compMode === 'exams'){
    months.forEach(a => head.push('اختبارات ' + a.monthNumber + '/' + a.year));
    head.push('متوسط الاختبارات الكلي %');
  } else {
    months.forEach(a => head.push('شهر ' + a.monthNumber + '/' + a.year + ' (حضور / اختبارات)'));
    head.push('الإجمالي (حضور % / اختبارات %)');
  }
  lines.push(head.join(','));

  let groupsToIterate = [];
  if(groupByGroups && Array.isArray(lesson.groups) && lesson.groups.length > 0){
    lesson.groups.forEach(g => {
      groupsToIterate.push({ name: g.name, list: rows.filter(r => r.st && r.st.groupId === g.id) });
    });
    const noGrp = rows.filter(r => !r.st || !r.st.groupId);
    if(noGrp.length > 0) groupsToIterate.push({ name: 'بدون مجموعة', list: noGrp });
  } else {
    groupsToIterate = [{ name: '', list: rows }];
  }

  let globalOrderIdx = 0;
  groupsToIterate.forEach(sec => {
    if(sec.list.length === 0) return;
    if(groupByGroups && sec.name){
      lines.push('"-- [مجموعة: ' + sec.name.replace(/"/g,'""') + ' (' + sec.list.length + ' طالب)] --"');
    }
    sec.list.forEach((r) => {
      globalOrderIdx++;
      const row = [globalOrderIdx, '"' + String(r.st.name).replace(/"/g,'""') + '\n' + String(localPhone(r.st.phone)).replace(/"/g,'""') + '"'];
      if(groupByGroups) row.push('"' + String(sec.name || '-').replace(/"/g,'""') + '"');
      if(compMode === 'attendance'){
        r.per.forEach(p => row.push('"' + p.done + ' من ' + p.total + '\n' + p.pct + '%"'));
        row.push('"' + r.pct + '%"');
      } else if(compMode === 'exams'){
        r.per.forEach(p => {
          if(p.isHiddenFromExams) row.push('"🚫 مستبعد"');
          else if(p.examAvgPct !== null) row.push('"' + p.examAvgPct + '%\n(' + p.examCount + ' اختبار)"');
          else row.push('"-"');
        });
        row.push('"' + (r.totExamPct !== null ? r.totExamPct + '%' : '-') + '"');
      } else {
        r.per.forEach(p => {
          const exStr = p.isHiddenFromExams ? 'مستبعد' : (p.examAvgPct !== null ? p.examAvgPct + '%' : '-');
          row.push('"حضور: ' + p.done + ' من ' + p.total + ' (' + p.pct + '%)\nاختبارات: ' + exStr + '"');
        });
        row.push('"حضور: ' + r.pct + '%\nاختبارات: ' + (r.totExamPct !== null ? r.totExamPct + '%' : '-') + '"');
      }
      lines.push(row.join(','));
    });
  });

  const safe = (lesson.name || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '');
  const modeSuffix = compMode === 'exams' ? '_اختبارات' : (compMode === 'combined' ? '_مدمج' : '_حضور');
  downloadBlob('\uFEFF' + lines.join('\r\n'), 'تقرير_شامل_' + safe + modeSuffix + '_' + new Date().toISOString().slice(0,10) + '.csv', 'text/csv;charset=utf-8');
}

function printComprehensiveReport(lesson, data, mode, groupByGroups){
  const compMode = mode || 'attendance';
  const { months, rows } = data;
  $('#printPageRule').textContent = '@page{size:A4 portrait;margin:8mm}';
  let html = '<div class="report compact" dir="rtl">';
  html += '<div class="r-title">' + esc(APP_NAME) + '</div>';
  
  const modeTitle = compMode === 'exams' ? 'درجات ومتوسط الاختبارات' : (compMode === 'combined' ? 'نسب الحضور ودرجات الاختبارات (مدمج)' : 'نسبة الحضور');
  html += '<div class="r-sub">تقرير شامل - ' + esc(lesson.name) + ' - ' + modeTitle + ' عبر ' + months.length + ' شهر' + (data.range && (data.range.from || data.range.to) ? ' (من ' + (data.range.from || 'البداية') + ' إلى ' + (data.range.to || 'الآن') + ')' : '') + '</div>';
  
  html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">الطالب</th>';
  months.forEach(a => html += '<th>' + a.monthNumber + '/' + a.year + '</th>');
  
  const lastColTitle = compMode === 'attendance' ? 'النسبة الكلية' : (compMode === 'exams' ? 'متوسط الاختبارات' : 'الإجمالي');
  html += '<th>' + lastColTitle + '</th></tr></thead><tbody>';

  // تقسيم المجموعات
  let groupsToIterate = [];
  if(groupByGroups && Array.isArray(lesson.groups) && lesson.groups.length > 0){
    lesson.groups.forEach(g => {
      groupsToIterate.push({ name: g.name, list: rows.filter(r => r.st && r.st.groupId === g.id) });
    });
    const noGrp = rows.filter(r => !r.st || !r.st.groupId);
    if(noGrp.length > 0) groupsToIterate.push({ name: 'بدون مجموعة', list: noGrp });
  } else {
    groupsToIterate = [{ name: '', list: rows }];
  }

  let globalOrderIdx = 0;
  groupsToIterate.forEach(sec => {
    if(sec.list.length === 0) return;
    if(groupByGroups && sec.name){
      html += '<tr class="group-header-row" style="background:#f1f5f9;font-weight:800;color:var(--primary,#1e293b)"><td colspan="' + (months.length + 3) + '" style="text-align:right;padding:5px 8px;font-size:10px">👥 ' + esc(sec.name) + ' (' + sec.list.length + ' طالب)</td></tr>';
    }

    sec.list.forEach((r) => {
      globalOrderIdx++;
      html += '<tr><td class="ord-col">' + globalOrderIdx + '</td><td class="r-name">' + esc(r.st.name) + '<br><span style="font-weight:400;font-size:7px;direction:ltr">' + esc(localPhone(r.st.phone)) + '</span></td>';

      if(compMode === 'attendance'){
        r.per.forEach(p => html += '<td>' + p.done + '/' + p.total + '<br><b>' + p.pct + '%</b></td>');
        html += '<td><b>' + r.pct + '%</b></td>';
      } else if(compMode === 'exams'){
        r.per.forEach(p => {
          if(p.isHiddenFromExams) html += '<td><span style="font-size:7px;color:#b91c1c">مستبعد</span></td>';
          else if(p.examAvgPct !== null) html += '<td><b>' + p.examAvgPct + '%</b><br><span style="font-size:6.5px;color:#64748b">' + p.examCount + ' اخت.</span></td>';
          else html += '<td><span style="color:#94a3b8">-</span></td>';
        });
        html += '<td><b>' + (r.totExamPct !== null ? r.totExamPct + '%' : '-') + '</b></td>';
      } else { // combined
        r.per.forEach(p => {
          const exHtml = p.isHiddenFromExams ? '<span style="font-size:6.5px;color:#b91c1c">مستبعد</span>' : (p.examAvgPct !== null ? '<b style="color:#15803d">' + p.examAvgPct + '%</b>' : '<span style="color:#94a3b8">-</span>');
          html += '<td style="line-height:1.2">ح: ' + p.done + '/' + p.total + ' (<b>' + p.pct + '%</b>)<br>اخت: ' + exHtml + '</td>';
        });
        const totExHtml = r.totExamPct !== null ? '<b style="color:#15803d">' + r.totExamPct + '%</b>' : '<span style="color:#94a3b8">-</span>';
        html += '<td style="line-height:1.2">ح: <b>' + r.pct + '%</b><br>اخت: ' + totExHtml + '</td>';
      }
      html += '</tr>';
    });
  });

  html += '</tbody></table>';
  html += '<div class="r-foot">عدد الشهور: ' + months.length + ' · عدد الطلاب: ' + rows.length + '</div>';
  html += '</div>';
  $('#printArea').innerHTML = html;
  showToastMessage('💡 لحفظ التقرير كـ PDF وإرساله للمطبعة: اختر من شاشة الطباعة «حفظ بتنسيق PDF» أو «Save as PDF» ثم اضغط حفظ.', 6000);
  setTimeout(() => {
    window.print();
    $('#printPageRule').textContent = '';
  }, 150);
}

function downloadComprehensivePrintableHTML(lesson, data, mode){
  const compMode = mode || 'attendance';
  const { months, rows } = data;
  let html = '<div class="report compact" dir="rtl">';
  html += '<div class="r-title">' + esc(APP_NAME) + '</div>';
  const modeTitle = compMode === 'exams' ? 'درجات ومتوسط الاختبارات' : (compMode === 'combined' ? 'نسب الحضور ودرجات الاختبارات (مدمج)' : 'نسبة الحضور');
  html += '<div class="r-sub">تقرير شامل - ' + esc(lesson.name) + ' - ' + modeTitle + ' عبر ' + months.length + ' شهر' + (data.range && (data.range.from || data.range.to) ? ' (من ' + (data.range.from || 'البداية') + ' إلى ' + (data.range.to || 'الآن') + ')' : '') + '</div>';
  html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">الطالب</th>';
  months.forEach(a => html += '<th>' + a.monthNumber + '/' + a.year + '</th>');
  if(compMode === 'attendance'){
    html += '<th>النسبة الكلية</th></tr></thead><tbody>';
    rows.forEach((r, i) => {
      html += '<tr><td class="ord-col">' + (i + 1) + '</td><td class="r-name">' + esc(r.st.name) + '<br><span style="font-size:7px;color:#64748b;direction:ltr">' + esc(localPhone(r.st.phone)) + '</span></td>';
      r.per.forEach(p => html += '<td>' + p.done + '/' + p.total + '<br><b>' + p.pct + '%</b></td>');
      html += '<td><b>' + r.pct + '%</b></td></tr>';
    });
  } else if(compMode === 'exams'){
    html += '<th>متوسط الاختبارات</th></tr></thead><tbody>';
    rows.forEach((r, i) => {
      html += '<tr><td class="ord-col">' + (i + 1) + '</td><td class="r-name">' + esc(r.st.name) + '<br><span style="font-size:7px;color:#64748b;direction:ltr">' + esc(localPhone(r.st.phone)) + '</span></td>';
      r.per.forEach(p => {
        if(p.isHiddenFromExams) html += '<td><span style="font-size:7px;color:#dc2626">🚫 مستبعد</span></td>';
        else if(p.examAvgPct !== null) html += '<td><b>' + p.examAvgPct + '%</b><br><span style="font-size:7px;color:#64748b">(' + p.examCount + ' اخت)</span></td>';
        else html += '<td><span style="color:#94a3b8">-</span></td>';
      });
      html += '<td><b>' + (r.totExamPct !== null ? r.totExamPct + '%' : '-') + '</b></td></tr>';
    });
  } else {
    html += '<th>الإجمالي</th></tr></thead><tbody>';
    rows.forEach((r, i) => {
      html += '<tr><td class="ord-col">' + (i + 1) + '</td><td class="r-name">' + esc(r.st.name) + '<br><span style="font-size:7px;color:#64748b;direction:ltr">' + esc(localPhone(r.st.phone)) + '</span></td>';
      r.per.forEach(p => {
        const exStr = p.isHiddenFromExams ? '🚫' : (p.examAvgPct !== null ? p.examAvgPct + '%' : '-');
        html += '<td style="line-height:1.2">ح: ' + p.pct + '%<br>اخت: ' + exStr + '</td>';
      });
      const totExHtml = r.totExamPct !== null ? '<b style="color:#15803d">' + r.totExamPct + '%</b>' : '<span style="color:#94a3b8">-</span>';
      html += '<td style="line-height:1.2">ح: <b>' + r.pct + '%</b><br>اخت: ' + totExHtml + '</td></tr>';
    });
  }
  html += '</tbody></table>';
  html += '<div class="r-foot">عدد الشهور: ' + months.length + ' · عدد الطلاب: ' + rows.length + '</div>';
  html += '</div>';

  downloadPrintableReportHTML(html, 'تقرير_شامل_' + lesson.name);
}

/* ---------- تصدير وطباعة تقرير الاختبارات المنفرد (v34) ---------- */
function exportExamsCSV(lesson, groupMode){
  if(!lesson) return;
  const exams = lesson.exams || [];
  if(exams.length === 0){
    showToastMessage('⚠️ لا توجد اختبارات مسجلة لتصديرها.');
    return;
  }
  const hiddenList = lesson.hiddenExamStudents || [];
  let activeStudents = (lesson.students || []).filter(st => !hiddenList.includes(st.id));
  let groupSuffix = '';
  if(examGroupFilterQuery && examGroupFilterQuery !== '__none__'){
    const grp = (lesson.examGroups || []).find(g => g.id === examGroupFilterQuery);
    if(grp){
      activeStudents = activeStudents.filter(st => st.examGroupId === examGroupFilterQuery);
      groupSuffix = '_مجموعة_' + grp.name.replace(/[^\w\u0600-\u06FF ]/g, '');
    }
  } else if(examGroupFilterQuery === '__none__'){
    activeStudents = activeStudents.filter(st => !st.examGroupId);
    groupSuffix = '_بدون_مجموعة';
  }
  if(activeStudents.length === 0){
    showToastMessage('⚠️ لا يوجد طلاب مطابقون في قسم الاختبارات.');
    return;
  }

  let groupsToIterate = [];
  const isLessonGroupMode = groupMode === 'lesson';
  const isExamGroupMode = groupMode === 'exam' || groupMode === true;
  const isGrouped = isLessonGroupMode || isExamGroupMode;

  if(isLessonGroupMode && Array.isArray(lesson.groups) && lesson.groups.length > 0){
    lesson.groups.forEach(g => {
      groupsToIterate.push({ name: g.name, list: activeStudents.filter(st => st.groupId === g.id) });
    });
    const noGrp = activeStudents.filter(st => !st.groupId);
    if(noGrp.length > 0) groupsToIterate.push({ name: 'بدون مجموعة درس', list: noGrp });
  } else if(isExamGroupMode && Array.isArray(lesson.examGroups) && lesson.examGroups.length > 0){
    lesson.examGroups.forEach(g => {
      groupsToIterate.push({ name: g.name, list: activeStudents.filter(st => st.examGroupId === g.id) });
    });
    const noGrp = activeStudents.filter(st => !st.examGroupId);
    if(noGrp.length > 0) groupsToIterate.push({ name: 'بدون مجموعة اختبار', list: noGrp });
  } else {
    groupsToIterate = [{ name: '', list: activeStudents }];
  }

  const lines = [];
  const head = ['م', 'اسم الطالب (الرقم تحته)'];
  if(isGrouped) head.push('المجموعة');
  exams.forEach(ex => head.push(ex.name + ' (من ' + ex.maxScore + ')'));
  head.push('إجمالي المجموع (المتوسط %)');
  head.push('ملاحظات الاختبارات');
  lines.push(head.join(','));

  let globalExIdx = 0;
  groupsToIterate.forEach(sec => {
    if(sec.list.length === 0) return;
    if(isGrouped && sec.name){
      lines.push('"-- [مجموعة: ' + sec.name.replace(/"/g,'""') + ' (' + sec.list.length + ' طالب)] --"');
    }
    sec.list.forEach((st) => {
      globalExIdx++;
      const studentScores = (lesson.examScores && lesson.examScores[st.id]) || {};
      const exclusions = (lesson.examExclusions && lesson.examExclusions[st.id]) || {};
      const notes = (lesson.examNotes && lesson.examNotes[st.id]) || {};

      const row = [globalExIdx, '"' + String(st.name).replace(/"/g,'""') + '\n' + String(localPhone(st.phone)).replace(/"/g,'""') + '"'];
      if(isGrouped) row.push('"' + String(sec.name || '-').replace(/"/g,'""') + '"');
      let totalScoreSum = 0, totalMaxSum = 0, totalPct = 0, count = 0;
      const studentNotes = [];

      exams.forEach(ex => {
        const isExcluded = !!exclusions[ex.id];
        const noteText = notes[ex.id] || '';
        const scoreVal = studentScores[ex.id];

        if(noteText) studentNotes.push(ex.name + ': ' + noteText);

        if(isExcluded){
          row.push('"🚫 لم يدخل الاختبار"');
        } else if(scoreVal !== undefined && scoreVal !== '' && !isNaN(Number(scoreVal))){
          const sNum = Number(scoreVal);
          const pct = ex.maxScore > 0 ? Math.round((sNum / ex.maxScore) * 100) : 0;
          if(ex.maxScore > 0){
            totalScoreSum += sNum;
            totalMaxSum += ex.maxScore;
            totalPct += pct;
            count++;
          }
          row.push('"' + sNum + ' من ' + ex.maxScore + ' (' + pct + '%)' + (noteText ? '\n[ملاحظة: ' + noteText + ']' : '') + '"');
        } else {
          row.push('"-"');
        }
      });

      if(count > 0){
        const avgPct = Math.round(totalPct / count);
        row.push('"' + totalScoreSum + ' من ' + totalMaxSum + ' (' + avgPct + '%)"');
      } else {
        row.push('"-"');
      }

      row.push('"' + String(studentNotes.join(' | ') || '-').replace(/"/g,'""') + '"');
      lines.push(row.join(','));
    });
  });

  const safe = (lesson.name || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '');
  downloadBlob('\uFEFF' + lines.join('\r\n'), 'درجات_اختبارات_' + safe + '_شهر_' + lesson.monthNumber + '_' + lesson.year + groupSuffix + '.csv', 'text/csv;charset=utf-8');
}

function printExamsReport(lesson, groupMode){
  if(!lesson) return;
  const exams = lesson.exams || [];
  if(exams.length === 0){
    showToastMessage('⚠️ لا توجد اختبارات مسجلة للطباعة.');
    return;
  }
  const hiddenList = lesson.hiddenExamStudents || [];
  let activeStudents = (lesson.students || []).filter(st => !hiddenList.includes(st.id));
  let groupTitle = '';
  if(examGroupFilterQuery && examGroupFilterQuery !== '__none__'){
    const grp = (lesson.examGroups || []).find(g => g.id === examGroupFilterQuery);
    if(grp){
      activeStudents = activeStudents.filter(st => st.examGroupId === examGroupFilterQuery);
      groupTitle = ' - مجموعة: ' + grp.name;
    }
  } else if(examGroupFilterQuery === '__none__'){
    activeStudents = activeStudents.filter(st => !st.examGroupId);
    groupTitle = ' - بدون مجموعة';
  }
  if(activeStudents.length === 0){
    showToastMessage('⚠️ لا يوجد طلاب مطابقون في قسم الاختبارات.');
    return;
  }

  // تقسيم المجموعات
  let groupsToIterate = [];
  const isLessonGroupMode = groupMode === 'lesson';
  const isExamGroupMode = groupMode === 'exam' || groupMode === true;

  if(isLessonGroupMode && Array.isArray(lesson.groups) && lesson.groups.length > 0){
    lesson.groups.forEach(g => {
      groupsToIterate.push({ name: g.name, list: activeStudents.filter(st => st.groupId === g.id) });
    });
    const noGrp = activeStudents.filter(st => !st.groupId);
    if(noGrp.length > 0) groupsToIterate.push({ name: 'بدون مجموعة درس', list: noGrp });
  } else if(isExamGroupMode && Array.isArray(lesson.examGroups) && lesson.examGroups.length > 0){
    lesson.examGroups.forEach(g => {
      groupsToIterate.push({ name: g.name, list: activeStudents.filter(st => st.examGroupId === g.id) });
    });
    const noGrp = activeStudents.filter(st => !st.examGroupId);
    if(noGrp.length > 0) groupsToIterate.push({ name: 'بدون مجموعة اختبار', list: noGrp });
  } else {
    groupsToIterate = [{ name: '', list: activeStudents }];
  }

  $('#printPageRule').textContent = '@page{size:A4 portrait;margin:8mm}';
  let html = '<div class="report compact" dir="rtl">';
  html += '<div class="r-title">' + esc(APP_NAME) + '</div>';
  html += '<div class="r-sub">تقرير درجات وملاحظات الاختبارات - ' + esc(lesson.name) + ' - شهر ' + lesson.monthNumber + '/' + lesson.year + esc(groupTitle) + '</div>';
  
  html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">الطالب</th>';
  exams.forEach(ex => {
    html += '<th>' + esc(ex.name) + '<br><span style="font-size:7px;font-weight:400">من ' + ex.maxScore + (ex.date ? ' (' + esc(ex.date) + ')' : '') + '</span></th>';
  });
  html += '<th>المتوسط</th><th>الملاحظات</th></tr></thead><tbody>';

  let globalOrderIdx = 0;
  groupsToIterate.forEach(sec => {
    if(sec.list.length === 0) return;
    if(sec.name){
      html += '<tr class="group-header-row" style="background:#f1f5f9;font-weight:800;color:var(--primary,#1e293b)"><td colspan="' + (exams.length + 4) + '" style="text-align:right;padding:5px 8px;font-size:10px">👥 ' + esc(sec.name) + ' (' + sec.list.length + ' طالب)</td></tr>';
    }

    sec.list.forEach((st) => {
      globalOrderIdx++;
      const studentScores = (lesson.examScores && lesson.examScores[st.id]) || {};
      const exclusions = (lesson.examExclusions && lesson.examExclusions[st.id]) || {};
      const notes = (lesson.examNotes && lesson.examNotes[st.id]) || {};

      let totalPct = 0, count = 0;
      const studentNotes = [];

      html += '<tr><td class="ord-col">' + globalOrderIdx + '</td><td class="r-name">' + esc(st.name) + '<br><span style="font-weight:400;font-size:7px;direction:ltr">' + esc(localPhone(st.phone)) + '</span></td>';

      exams.forEach(ex => {
        const isExcluded = !!exclusions[ex.id];
        const noteText = notes[ex.id] || '';
        const scoreVal = studentScores[ex.id];

        if(noteText) studentNotes.push('<span class="r-exam-note"><b>' + esc(ex.name) + ':</b> ' + esc(noteText) + '</span>');

        if(isExcluded){
          html += '<td><span class="r-exam-exc">🚫 لم يدخل</span></td>';
        } else if(scoreVal !== undefined && scoreVal !== '' && !isNaN(Number(scoreVal))){
          const sNum = Number(scoreVal);
          if(ex.maxScore > 0){
            totalPct += Math.round((sNum / ex.maxScore) * 100);
            count++;
          }
          const pct = ex.maxScore > 0 ? Math.round((sNum / ex.maxScore) * 100) : 0;
          const clr = pct >= 50 ? '#15803d' : '#b91c1c';
          html += '<td><b style="color:' + clr + '">' + sNum + '</b><br><span style="font-size:6.5px;color:#64748b">' + pct + '%</span></td>';
        } else {
          html += '<td><span style="color:#94a3b8">-</span></td>';
        }
      });

      const avgPct = count > 0 ? Math.round(totalPct / count) : null;
      const avgClr = avgPct !== null ? (avgPct >= 50 ? '#15803d' : '#b91c1c') : 'var(--muted)';
      html += '<td><b style="color:' + avgClr + '">' + (avgPct !== null ? avgPct + '%' : '-') + '</b></td>';
      html += '<td style="text-align:right;font-size:7.5px;max-width:140px">' + (studentNotes.length > 0 ? studentNotes.join('') : '<span style="color:#94a3b8">-</span>') + '</td></tr>';
    });
  });

  // Footer row for averages
  html += '<tr style="background:#f8fafc;font-weight:800"><td colspan="2" style="text-align:center">متوسط درجات الاختبار</td>';
  exams.forEach(ex => {
    let sum = 0, cnt = 0;
    activeStudents.forEach(st => {
      const isExcluded = (lesson.examExclusions && lesson.examExclusions[st.id] && lesson.examExclusions[st.id][ex.id]);
      if(isExcluded) return;
      const v = (lesson.examScores && lesson.examScores[st.id] && lesson.examScores[st.id][ex.id]);
      if(v !== undefined && v !== '' && !isNaN(Number(v))){ sum += Number(v); cnt++; }
    });
    const avg = cnt > 0 ? (sum / cnt).toFixed(1) : '-';
    html += '<td>' + avg + (cnt > 0 ? '<br><span style="font-size:6.5px;font-weight:400">/ ' + ex.maxScore + '</span>' : '') + '</td>';
  });
  html += '<td colspan="2"></td></tr>';

  html += '</tbody></table>';
  html += '<div class="r-foot">عدد الاختبارات: ' + exams.length + ' · عدد الطلاب: ' + activeStudents.length + '</div>';
  html += '</div>';

  $('#printArea').innerHTML = html;
  showToastMessage('💡 لحفظ التقرير كـ PDF وإرساله للمطبعة: اختر من شاشة الطباعة «حفظ بتنسيق PDF» أو «Save as PDF» ثم اضغط حفظ.', 6000);
  setTimeout(() => {
    window.print();
    $('#printPageRule').textContent = '';
  }, 150);
}

function openExamReportModal(lesson){
  if(!lesson) return;
  const exams = lesson.exams || [];
  if(exams.length === 0){
    showToastMessage('⚠️ لا توجد اختبارات مسجلة في هذا الشهر.');
    return;
  }
  const lessonGroups = lesson.groups || [];
  const examGroups = lesson.examGroups || [];

  const html = '<div class="reset-box" style="text-align:right">'
    + '<p style="font-size:13px;font-weight:700;margin-bottom:12px">اختر صيغة أو نوع التقرير المطلوب لدرجات الاختبارات:</p>'
    + '<div style="display:flex;flex-direction:column;gap:10px">'
    +   '<button class="btn btn-outline" id="ex_rep_pdf" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;font-weight:800">'
    +     '<span>' + appIcon('printer', 14) + ' طباعة تقرير الاختبارات (PDF منفرد)</span>'
    +     '<span class="muted" style="font-size:11px;font-weight:400">ورقي A4 مضغوط</span>'
    +   '</button>'
    +   '<button class="btn btn-outline" id="ex_rep_csv" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;font-weight:800">'
    +     '<span>' + appIcon('download', 14) + ' تصدير درجات الاختبارات (Excel CSV منفرد)</span>'
    +     '<span class="muted" style="font-size:11px;font-weight:400">ملف جاهز للتعديل</span>'
    +   '</button>'
    +   '<button class="btn btn-outline" id="ex_rep_comp" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;font-weight:800">'
    +     '<span>' + appIcon('bar-chart-2', 14) + ' التقرير الشامل لدرجات الاختبارات (عبر كل الشهور)</span>'
    +     '<span class="muted" style="font-size:11px;font-weight:400">تفاعلي + تصدير</span>'
    +   '</button>'
    +   '<button class="btn btn-outline" id="ex_rep_msg" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;font-weight:800">'
    +     '<span>' + appIcon('message', 14) + ' تقرير درجات الاختبار كرسالة (واتساب / نسخ)</span>'
    +     '<span class="muted" style="font-size:11px;font-weight:400">للحاضرين فقط</span>'
    +   '</button>'
    + '</div>'
    + '<div style="margin-top:14px;padding:10px 12px;background:var(--card-bg,#f8fafc);border:1px solid var(--border);border-radius:8px">'
    +   '<label style="font-size:12px;font-weight:800;display:block;margin-bottom:6px">' + appIcon('folder', 13) + ' خيار تقسيم وترتيب المجموعات (في PDF و Excel):</label>'
    +   '<select id="ex_rep_group_mode" style="width:100%;padding:6px 10px;border-radius:6px;border:1px solid var(--border);font-size:12px;font-weight:700">'
    +     '<option value="none">بدون تقسيم (ترتيب عام)</option>'
    +     (lessonGroups.length > 0 ? '<option value="lesson" selected>تقسيم حسب مجموعات الدرس الأساسية (' + lessonGroups.length + ')</option>' : '')
    +     (examGroups.length > 0 ? '<option value="exam"' + (lessonGroups.length === 0 ? ' selected' : '') + '>تقسيم حسب مجموعات الاختبار (' + examGroups.length + ')</option>' : '')
    +   '</select>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:16px">'
    +   '<button class="btn" id="ex_rep_close">إغلاق</button>'
    + '</div></div>';

  openModal('📝 تقارير درجات الاختبارات - ' + esc(lesson.name), html);
  $('#ex_rep_close').onclick = closeModal;
  $('#ex_rep_pdf').onclick = () => {
    const gMode = $('#ex_rep_group_mode') ? $('#ex_rep_group_mode').value : 'none';
    closeModal();
    printExamsReport(lesson, gMode);
  };
  $('#ex_rep_csv').onclick = () => {
    const gMode = $('#ex_rep_group_mode') ? $('#ex_rep_group_mode').value : 'none';
    closeModal();
    exportExamsCSV(lesson, gMode);
  };
  $('#ex_rep_comp').onclick = () => { closeModal(); showComprehensiveReport(lesson, 'exams'); };
  $('#ex_rep_msg').onclick = () => { closeModal(); openExamReportMessageModal(lesson); };
}

/* ---------- تصدير CSV ---------- */
function exportCSV(students, sessions, records, title, statuses, groupByGroups){
  const sd = state.settings;
  const stList = statuses || state.settings.statuses;
  const curL = curLesson();
  const groups = (curL && curL.groups) ? curL.groups : [];

  let groupsToIterate = [];
  if(groupByGroups && groups.length > 0){
    groups.forEach(g => {
      groupsToIterate.push({ name: g.name, list: students.filter(st => st.groupId === g.id) });
    });
    const noGrp = students.filter(st => !st.groupId);
    if(noGrp.length > 0) groupsToIterate.push({ name: 'بدون مجموعة', list: noGrp });
  } else {
    groupsToIterate = [{ name: '', list: students }];
  }

  const lines = [];
  let head = ['م', 'اسم الطالب (الرقم تحته)'];
  if(groupByGroups) head.push('المجموعة');
  sd.customFields.forEach(f => head.push(f.label));
  sessions.forEach(s => head.push(s.label + (s.dateLabel ? ' ('+s.dateLabel+')' : '') + (s.event ? ' ['+s.event+']' : '')));
  head.push(sd.notesLabel);
  stList.forEach(s => head.push(s.label));
  head.push('نسبة الحضور %');
  lines.push(head.join(','));

  let globalIdx = 0;
  groupsToIterate.forEach(sec => {
    if(sec.list.length === 0) return;
    if(groupByGroups && sec.name){
      lines.push('"-- [مجموعة: ' + sec.name.replace(/"/g,'""') + ' (' + sec.list.length + ' طالب)] --"');
    }
    const rows = computeStats(sec.list, sessions, records, statuses);
    rows.forEach((r) => {
      globalIdx++;
      const row = [globalIdx, '"' + String(r.st.name).replace(/"/g,'""') + '\n' + String(localPhone(r.st.phone)).replace(/"/g,'""') + '"'];
      if(groupByGroups) row.push('"' + String(sec.name || '-').replace(/"/g,'""') + '"');
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
  });

  const csv = '\uFEFF' + lines.join('\r\n');
  const safe = (title||'حضور').replace(/[^\w\u0600-\u06FF ]/g,'');
  downloadBlob(csv, 'تقرير_' + safe + (groupByGroups ? '_مقسم_بالمجموعات' : '') + '.csv', 'text/csv;charset=utf-8');
}

/* ---------- طباعة A4 ---------- */
/* ===== 💾 حفظ PDF للطباعة (v37) ===== */
/**
 * يعرض نافذة توجيه جميلة تشرح للمستخدم كيف يحفظ الصفحة كـ PDF،
 * ثم يشغّل دالة الطباعة المطلوبة بعد النقر على "طباعة / حفظ PDF".
 */
function showSavePdfGuide(printCallback, reportTitle, reportHTML){
  openModal('💾 حفظ التقرير كملف PDF / مستند',
    '<div style="text-align:right;direction:rtl">'
    + '<p style="font-size:14px;font-weight:700;margin-bottom:14px;color:var(--primary)">' + appIcon('file-text', 15) + ' اختر الطريقة المفضلة لحفظ أو طباعة التقرير:</p>'
    + '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">'
    +   (reportHTML ? '<button class="btn btn-primary" id="pdf_saveDirectBtn" style="font-size:14px;padding:12px 14px;justify-content:space-between;display:flex;align-items:center">'
    +     '<span>' + appIcon('save', 14) + ' حفظ واختيار مكان الملف (مستند للطباعة)</span>'
    +     '<span style="font-size:11px;opacity:0.9;font-weight:400">تحديد المجلد وحفظه</span>'
    +   '</button>' : '')
    +   '<button class="btn ' + (reportHTML ? 'btn-outline' : 'btn-primary') + '" id="pdf_printNow" style="font-size:14px;padding:12px 14px;justify-content:space-between;display:flex;align-items:center;font-weight:800">'
    +     '<span>' + appIcon('printer', 14) + ' طباعة / حفظ بتنسيق PDF عبر المتصفح</span>'
    +     '<span class="muted" style="font-size:11px;font-weight:400">A4 للمطبعة والورق</span>'
    +   '</button>'
    + '</div>'
    + '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;font-size:12px;color:#166534;line-height:1.6">'
    +   '<b>ملاحظة:</b> يمكنك اختيار مكان حفظ الملف على جهازك وتحديد المجلد المناسب، أو اختيار الطباعة والحفظ كـ PDF مباشرة.'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:16px">'
    +   '<button class="btn btn-outline" id="pdf_cancel">إلغاء</button>'
    + '</div>'
    + '</div>');

  if($('#pdf_saveDirectBtn')){
    $('#pdf_saveDirectBtn').onclick = () => {
      closeModal();
      downloadReportPrintableHTML(reportTitle || 'تقرير', reportHTML);
    };
  }
  $('#pdf_printNow').onclick = () => { closeModal(); setTimeout(() => printCallback(), 200); };
  $('#pdf_cancel').onclick = closeModal;
}

/**
 * طباعة جدول الحضور الحالي وعرض دليل حفظه كـ PDF
 */
function saveCurrentLessonAsPdf(){
  const L = curLesson();
  if(!L) return;
  let students = L.students;
  let reportTitle = L.name + ' - ' + buildMonthTitle(L.monthNumber);
  if(groupFilterQuery && groupFilterQuery !== '__none__'){
    const grp = (L.groups || []).find(g => g.id === groupFilterQuery);
    if(grp){ students = students.filter(st => st.groupId === groupFilterQuery); reportTitle += ' (مجموعة: ' + grp.name + ')'; }
  } else if(groupFilterQuery === '__none__'){
    students = students.filter(st => !st.groupId); reportTitle += ' (بدون مجموعة)';
  }
  const eff = effectiveStatuses(L);
  printReport(students, L.sessions, L.records, reportTitle, eff);
}

function printReport(students, sessions, records, title, statuses, groupByGroups){
  const rows = computeStats(students, sessions, records, statuses);
  const html = buildReportHTML(students, sessions, records, rows, title, statuses, groupByGroups);
  showSavePdfGuide(() => {
    $('#printPageRule').textContent = '@page{size:A4 portrait;margin:8mm}';
    $('#printArea').innerHTML = html;
    window.print();
    $('#printPageRule').textContent = '';
  }, title, html);
}

/* ---------- ورقة حضور فارغة جاهزة للطباعة ---------- */
function showBlankSheetOptions(){
  const L = curLesson();
  if(!L) return;
  const body = '<div style="text-align:center;padding:8px 0">'
    + '<p style="margin-bottom:12px;font-size:14px">اختر صيغة ورقة الحضور الفارغة:</p>'
    + '<div class="modal-actions" style="justify-content:center;gap:12px">'
    + '<button class="btn btn-primary" id="blankPdfBtn">' + appIcon('printer', 14) + ' حفظ كـ PDF / طباعة A4</button>'
    + '<button class="btn btn-outline" id="blankDownloadHtml">' + appIcon('download', 14) + ' تنزيل للطباعة (للمطبعة)</button>'
    + '<button class="btn btn-outline" id="blankExcelBtn">' + appIcon('download', 14) + ' Excel (A4)</button>'
    + '<button class="btn" id="blankCloseBtn">إغلاق</button>'
    + '</div></div>';
  openModal('📄 ورقة حضور فارغة', body);
  $('#blankPdfBtn').onclick = () => { closeModal(); printBlankSheet(L); };
  if($('#blankDownloadHtml')){
    $('#blankDownloadHtml').onclick = () => {
      closeModal();
      downloadBlankSheetPrintableHTML(L);
    };
  }
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
  showToastMessage('💡 لحفظ ورقة الحضور كـ PDF وإرسالها للمطبعة: اختر من شاشة الطباعة «حفظ بتنسيق PDF» أو «Save as PDF» ثم اضغط حفظ.', 6000);
  setTimeout(() => {
    window.print();
    $('#printPageRule').textContent = '';
  }, 150);
}

function downloadBlankSheetPrintableHTML(lesson){
  const sd = state.settings;
  const students = lesson.students || [];
  const sessions = lesson.sessions || [];
  const monthTitle = buildMonthTitle(lesson.monthNumber);
  const yearLabel = lesson.year || '';
  const scheduleStr = scheduleLabel(lesson);

  let html = '<div class="report" dir="rtl">';
  html += '<div class="r-title">كشف حضور وغياب عن ' + esc(lesson.name) + ' - ' + esc(monthTitle) + (yearLabel ? ' ' + esc(String(yearLabel)) : '') + '</div>';
  if(scheduleStr) html += '<div style="text-align:center;font-size:10px;color:#475569;margin-bottom:6px">' + esc(scheduleStr) + '</div>';

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
    sessions.forEach(() => { html += '<td class="blank-cell"></td>'; });
    html += '<td></td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  html += '<div class="r-foot">عدد الطلاب: ' + students.length + ' · عدد الحصص: ' + sessions.length + '</div>';
  html += '</div>';

  downloadPrintableReportHTML(html, 'ورقة_حضور_فارغة_' + lesson.name);
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

function buildReportHTML(students, sessions, records, rows, title, statuses, groupByGroups){
  const sd = state.settings;
  const stList = statuses || state.settings.statuses;
  const curL = curLesson();
  const groups = (curL && curL.groups) ? curL.groups : [];

  let groupsToIterate = [];
  if(groupByGroups && groups.length > 0){
    groups.forEach(g => {
      groupsToIterate.push({ name: g.name, list: students.filter(st => st.groupId === g.id) });
    });
    const noGrp = students.filter(st => !st.groupId);
    if(noGrp.length > 0) groupsToIterate.push({ name: 'بدون مجموعة', list: noGrp });
  } else {
    groupsToIterate = [{ name: '', list: students }];
  }

  let html = '<div class="report compact" dir="rtl">';
  html += '<div class="r-title">' + esc(APP_NAME) + '</div>';
  html += '<div class="r-sub">' + esc(title) + (groupByGroups ? ' (مقسم حسب المجموعات)' : '') + '</div>';

  html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">'+esc(sd.studentLabel)+'</th>';
  sd.customFields.forEach(f => html += '<th>'+esc(f.label)+'</th>');
  sessions.forEach(s => html += '<th>'+esc(s.label)+'<br><span>'+esc(s.dateLabel||'')+'</span>' + (s.event ? '<br><span style="color:#b45309;font-size:7px">📝 '+esc(s.event)+'</span>' : '') + '</th>');
  html += '<th>'+esc(sd.notesLabel)+'</th></tr></thead><tbody>';
  
  let globalRepIdx = 0;
  groupsToIterate.forEach(sec => {
    if(sec.list.length === 0) return;
    if(groupByGroups && sec.name){
      html += '<tr class="r-group-section"><td colspan="' + (2 + sd.customFields.length + sessions.length + 1) + '" style="background:#f1f5f9;font-weight:bold;padding:4px 8px;border-top:2px solid #cbd5e1;color:#1e293b">👥 مجموعة: ' + esc(sec.name) + ' (' + sec.list.length + ' طالب)</td></tr>';
    }
    sec.list.forEach(st => {
      globalRepIdx++;
      html += '<tr><td class="ord-col">'+globalRepIdx+'</td><td class="r-name">'+esc(st.name)+'<br><span style="font-weight:400;font-size:7px;color:#64748b;direction:ltr">'+esc(localPhone(st.phone))+'</span></td>';
      sd.customFields.forEach(f => html += '<td>'+esc((st.fields && st.fields[f.id]) || '')+'</td>');
      sessions.forEach(s => {
        const rec = (records[st.id] && records[st.id][s.id]) || {};
        const lbl = rec.status ? (stList.find(x=>x.id===rec.status)||{}).label || '' : '';
        html += '<td>'+esc(lbl||'-') + (rec.note ? '<br><span style="font-size:7px;color:#b45309">'+esc(rec.note)+'</span>' : '') + '</td>';
      });
      const note = (records[st.id] && records[st.id]['__note__']) || '';
      html += '<td>'+esc(note)+'</td></tr>';
    });
  });
  html += '</tbody></table>';

  html += '<div class="r-section">تحليل الحضور</div>';
  html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">'+esc(sd.studentLabel)+'</th>';
  stList.forEach(s => html += '<th>'+esc(s.label)+'</th>');
  html += '<th>نسبة الحضور</th></tr></thead><tbody>';
  let globalAnalysisIdx = 0;
  groupsToIterate.forEach(sec => {
    if(sec.list.length === 0) return;
    if(groupByGroups && sec.name){
      html += '<tr class="r-group-section"><td colspan="' + (2 + stList.length + 1) + '" style="background:#f1f5f9;font-weight:bold;padding:4px 8px;border-top:2px solid #cbd5e1;color:#1e293b">👥 مجموعة: ' + esc(sec.name) + ' (' + sec.list.length + ' طالب)</td></tr>';
    }
    sec.list.forEach(st => {
      const r = rows.find(x => x.st && x.st.id === st.id);
      if(!r) return;
      globalAnalysisIdx++;
      html += '<tr><td class="ord-col">'+globalAnalysisIdx+'</td><td class="r-name">'+esc(r.st.name)+'</td>';
      stList.forEach(s => html += '<td>'+(r.counts[s.id]||0)+'</td>');
      html += '<td><b>'+r.pct+'%</b></td></tr>';
    });
  });
  html += '</tbody></table>';

  if(curL && Array.isArray(curL.exams) && curL.exams.length > 0){
    html += '<div class="r-section">نتائج ودرجات الاختبارات</div>';
    html += '<table class="r-table"><thead><tr><th class="ord-col">م</th><th class="r-name">'+esc(sd.studentLabel)+'</th>';
    curL.exams.forEach(ex => html += '<th>' + esc(ex.name) + '<br><span style="font-size:7px">(' + ex.maxScore + ')</span></th>');
    html += '<th>المتوسط</th></tr></thead><tbody>';
    let globalExamIdx = 0;
    groupsToIterate.forEach(sec => {
      if(sec.list.length === 0) return;
      if(groupByGroups && sec.name){
        html += '<tr class="r-group-section"><td colspan="' + (2 + curL.exams.length + 1) + '" style="background:#f1f5f9;font-weight:bold;padding:4px 8px;border-top:2px solid #cbd5e1;color:#1e293b">👥 مجموعة: ' + esc(sec.name) + ' (' + sec.list.length + ' طالب)</td></tr>';
      }
      sec.list.forEach(st => {
        globalExamIdx++;
        html += '<tr><td class="ord-col">'+globalExamIdx+'</td><td class="r-name">'+esc(st.name)+'</td>';
        let tot = 0, ecnt = 0;
        curL.exams.forEach(ex => {
          const isExcluded = (curL.examExclusions && curL.examExclusions[st.id] && curL.examExclusions[st.id][ex.id]);
          const note = (curL.examNotes && curL.examNotes[st.id] && curL.examNotes[st.id][ex.id]) || '';
          const sc = (curL.examScores && curL.examScores[st.id] && curL.examScores[st.id][ex.id]);
          if(isExcluded){
            html += '<td style="color:#dc2626;font-size:7px;font-weight:700">🚫 لم يدخل' + (note ? '<br><span style="color:#64748b;font-weight:normal">📝 '+esc(note)+'</span>' : '') + '</td>';
          } else if(sc !== undefined && sc !== '' && !isNaN(Number(sc))){
            const numSc = Number(sc);
            tot += (numSc / ex.maxScore) * 100;
            ecnt++;
            const isPass = (numSc / ex.maxScore) >= 0.5;
            html += '<td style="color:' + (isPass ? '#15803d' : '#b91c1c') + ';font-weight:700">' + sc + (note ? '<br><span style="color:#64748b;font-weight:normal;font-size:7px">📝 '+esc(note)+'</span>' : '') + '</td>';
          } else {
            html += '<td style="color:#94a3b8">-' + (note ? '<br><span style="color:#64748b;font-size:7px">📝 '+esc(note)+'</span>' : '') + '</td>';
          }
        });
        const avg = ecnt > 0 ? Math.round(tot / ecnt) + '%' : '-';
        html += '<td><b>' + avg + '</b></td></tr>';
      });
    });
    html += '</tbody></table>';
  }

  html += '<div class="r-foot">إجمالي الحصص: ' + sessions.length + ' · عدد الطلاب: ' + students.length + '</div>';
  html += '</div>';
  return html;
}

/* ---------- وظائف تصدير وتنزيل ومشاركة الملفات مباشرة (v42) ---------- */
function canShareBlob(blob, filename, mime) {
  try {
    if (!navigator.share || !navigator.canShare) return false;
    const file = new File([blob], filename, { type: mime });
    return navigator.canShare({ files: [file] });
  } catch (e) {
    return false;
  }
}

function formatExportFileSize(bytes) {
  if (!bytes || bytes < 0) return '0 بايت';
  if (bytes < 1024) return bytes + ' بايت';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' ك.ب';
  return (bytes / (1024 * 1024)).toFixed(2) + ' م.ب';
}

function getExportBadgeInfo(filename) {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.daftar-att')) return { text: 'حضور', bg: '#7c3aed' };
  if (lower.endsWith('.daftar-month')) return { text: 'شهر مؤرشف', bg: '#0891b2' };
  if (lower.endsWith('.json')) return { text: 'JSON', bg: '#2563eb' };
  if (lower.endsWith('.csv')) return { text: 'CSV', bg: '#059669' };
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return { text: 'HTML', bg: '#ea580c' };
  return { text: 'ملف', bg: '#475569' };
}

async function executeActualDownload(content, filename, mime) {
  /* أولوية: File System Access API (يخلي المستخدم يختار المكان) */
  if ('showSaveFilePicker' in window) {
    try {
      const ext = filename.includes('.') ? '.' + filename.split('.').pop() : '';
      const types = ext ? [{ description: ext.toUpperCase().slice(1) + ' ملف', accept: { [mime]: [ext] } }] : [];
      const handle = await window.showSaveFilePicker({ suggestedName: filename, types });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      showToastMessage('✅ تم حفظ الملف: ' + filename);
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; /* ألغى المستخدم */
      /* فشل API → رجوع للطريقة العادية */
    }
  }
  /* طريقة التنزيلات العادية (fallback) */
  const blob = (content instanceof Blob) ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  showToastMessage('⬇️ تم تنزيل الملف في الهاتف: ' + filename);
}

function openExportShareModal(content, filename, mime, opts = {}) {
  const blob = (content instanceof Blob) ? content : new Blob([content], { type: mime });
  const badge = getExportBadgeInfo(filename);
  const sizeStr = formatExportFileSize(blob.size);
  const captionText = opts.caption || ('ملف تصدير من تطبيق دفتر 📘 (' + filename + ')');

  const modalHTML = '<div style="text-align:right;direction:rtl;line-height:1.6">'
    + '<div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;gap:12px">'
    +   '<div style="width:42px;height:42px;border-radius:10px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:var(--primary);flex-shrink:0">'
    +     appIcon('file-text', 22)
    +   '</div>'
    +   '<div style="flex:1;min-width:0">'
    +     '<div style="font-size:13px;font-weight:800;color:var(--text);word-break:break-all;line-height:1.4">'
    +       esc(filename)
    +     '</div>'
    +     '<div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap">'
    +       '<span style="font-size:11px;font-weight:700;padding:1px 7px;border-radius:4px;background:' + badge.bg + ';color:#fff">' + badge.text + '</span>'
    +       '<span style="font-size:11.5px;color:var(--muted)">الحجم: ' + sizeStr + '</span>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '<p style="font-size:13px;color:var(--text);margin:0 0 12px;font-weight:700">'
    +   'اختر الطريقة المناسبة لإخراج الملف:'
    + '</p>'
    + '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">'
    +   '<button type="button" class="btn btn-primary" id="btn_modal_share_direct" style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-radius:10px;text-align:right;cursor:pointer">'
    +     '<div style="display:flex;align-items:center;gap:10px">'
    +       appIcon('share-2', 22)
    +       '<div>'
    +         '<div style="font-size:14px;font-weight:800">مشاركة مباشرة عبر التطبيقات</div>'
    +         '<div style="font-size:11.5px;opacity:0.92;font-weight:600">واتساب، تيليجرام، مسنجر، البريد، البلوتوث...</div>'
    +       '</div>'
    +     '</div>'
    +     appIcon('chevron-left', 16)
    +   '</button>'
    +   '<button type="button" class="btn btn-outline" id="btn_modal_save_local" style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-radius:10px;text-align:right;border-width:2px;cursor:pointer">'
    +     '<div style="display:flex;align-items:center;gap:10px">'
    +       appIcon('download', 22)
    +       '<div>'
    +         '<div style="font-size:14px;font-weight:800;color:var(--text)">حفظ وتنزيل في الهاتف</div>'
    +         '<div style="font-size:11.5px;color:var(--muted);font-weight:600">تنزيل الملف في مجلد التنزيلات بالجهاز (Downloads)</div>'
    +       '</div>'
    +     '</div>'
    +     appIcon('chevron-left', 16)
    +   '</button>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:10px">'
    +   '<button class="btn" id="btn_modal_cancel_export" style="width:100%">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('📤 خيارات تصدير ومشاركة الملف', modalHTML);

  if ($('#btn_modal_share_direct')) {
    $('#btn_modal_share_direct').onclick = async () => {
      try {
        const file = new File([blob], filename, { type: mime });
        await navigator.share({
          files: [file],
          title: filename,
          text: captionText
        });
        closeModal();
        showToastMessage('✅ تمت المشاركة بنجاح.');
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return;
        }
        closeModal();
        await executeActualDownload(content, filename, mime);
      }
    };
  }

  if ($('#btn_modal_save_local')) {
    $('#btn_modal_save_local').onclick = async () => {
      closeModal();
      await executeActualDownload(content, filename, mime);
    };
  }

  if ($('#btn_modal_cancel_export')) {
    $('#btn_modal_cancel_export').onclick = closeModal;
  }
}

async function downloadBlob(content, filename, mime, opts = {}) {
  const blob = (content instanceof Blob) ? content : new Blob([content], { type: mime });

  /* إذا كان الجهاز يدعم مشاركة الملفات ولم يتم طلب التنزيل الإجباري -> إظهار نافذة الاختيار */
  if (!opts.forceDownload && canShareBlob(blob, filename, mime)) {
    openExportShareModal(content, filename, mime, opts);
    return;
  }

  /* وإلا حفظ وتنزيل في الجهاز مباشرةً (مثل متصفحات الكمبيوتر) */
  await executeActualDownload(content, filename, mime);
}


/* ---------- حجب وحماية بيانات وتوكنات البوتات عند التصدير (v35) ---------- */
function sanitizeExportState(stateObj){
  const copy = JSON.parse(JSON.stringify(stateObj));
  if(copy.settings){
    copy.settings.tgBotToken = '';
    copy.settings.tgChatId = '';
    copy.settings.tgBots = [];
    copy.settings.activeTgBotId = '';
  }
  return copy;
}

/* ---------- ملف البيانات ---------- */
function applyLoadedData(data){
  if(!data || !Array.isArray(data.lessons) || !data.settings){
    alert('الملف غير صالح (لا يحتوي على بيانات الدروس المطلوبة).');
    return false;
  }
  if(!window.confirm('سيتم استبدال كل البيانات الحالية بمحتوى الملف. متابعة؟')) return false;

  const existingBots = (state && state.settings && state.settings.tgBots) ? JSON.parse(JSON.stringify(state.settings.tgBots)) : [];
  const existingBotToken = (state && state.settings && state.settings.tgBotToken) || '';
  const existingChatId = (state && state.settings && state.settings.tgChatId) || '';
  const existingActiveBotId = (state && state.settings && state.settings.activeTgBotId) || '';

  state = normalizeState(data);

  if(existingBots.length > 0 && (!state.settings.tgBots || state.settings.tgBots.length === 0)){
    state.settings.tgBots = existingBots;
    state.settings.tgBotToken = existingBotToken;
    state.settings.tgChatId = existingChatId;
    state.settings.activeTgBotId = existingActiveBotId;
  }

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
  // النسخة الاحتياطية الكاملة تحتفظ بكافة البوتات لتمكين استعادتها
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

/* ---------- تصدير/استيراد درس واحد (دمج مع خيارات الأرشيف) ---------- */
function exportLesson(lesson){
  if(!lesson) return;
  const lessonArchives = state.archive.filter(a => a.lessonId === lesson.id);

  // إذا لم يكن هناك شهور مؤرشفة، يتم تصدير الشهر الحالي مباشرة
  if(!lessonArchives || lessonArchives.length === 0){
    doExportLesson(lesson, false);
    return;
  }

  // إذا كان هناك شهور مؤرشفة، نتيح للمستخدم الاختيار بحرية تامة
  openLessonExportModal(lesson, lessonArchives);
}

function openLessonExportModal(lesson, lessonArchives){
  const archCount = lessonArchives.length;
  const modalHTML = '<div style="text-align:right;direction:rtl;line-height:1.6">'
    + '<p style="font-size:13.5px;color:var(--text);margin-top:0">'
    +   'يحتوي درس «<b>' + esc(lesson.name) + '</b>» على شهر حالي و <b>' + archCount + '</b> شهر مؤرشف في الأرشيف. اختر نوع التصدير المطلوب:'
    + '</p>'
    + '<div style="display:flex;flex-direction:column;gap:10px;margin:16px 0">'
    +   '<button type="button" class="btn btn-outline" id="btn_export_current_only" style="padding:12px 14px;text-align:right;display:flex;flex-direction:column;align-items:flex-start;gap:4px;border-width:2px;border-color:var(--primary);background:var(--card-bg,#f8fafc);cursor:pointer;border-radius:8px">'
    +     '<span style="font-size:14px;font-weight:800;color:var(--primary)">' + appIcon('file-text', 14) + ' تصدير الشهر الحالي فقط (بدون الأرشيف)</span>'
    +     '<span style="font-size:12px;color:var(--muted)">تصدير بيانات الشهر الجاري والطلاب والحصص فقط في ملف خفيف وسريع وصغير الحجم.</span>'
    +   '</button>'
    +   '<button type="button" class="btn btn-outline" id="btn_export_with_archives" style="padding:12px 14px;text-align:right;display:flex;flex-direction:column;align-items:flex-start;gap:4px;border-width:2px;border-color:var(--border);background:#fff;cursor:pointer;border-radius:8px">'
    +     '<span style="font-size:14px;font-weight:800;color:var(--text)">' + appIcon('archive', 14) + ' تصدير شامل (الشهر الحالي + كافة الشهور المؤرشفة ' + archCount + ' شهر)</span>'
    +     '<span style="font-size:12px;color:var(--muted)">تصدير نسخة كاملة تشمل الشهر الجاري وكافة الشهور السابقة المحفوظة في الأرشيف لهذا الدرس.</span>'
    +   '</button>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:12px">'
    +   '<button class="btn" id="btn_cancel_export">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('⬇️ خيارات تصدير الدرس', modalHTML);

  $('#btn_export_current_only').onclick = () => {
    closeModal();
    doExportLesson(lesson, false);
  };
  $('#btn_export_with_archives').onclick = () => {
    closeModal();
    doExportLesson(lesson, true);
  };
  $('#btn_cancel_export').onclick = closeModal;
}

function doExportLesson(lesson, includeArchives){
  const lessonArchives = includeArchives
    ? state.archive.filter(a => a.lessonId === lesson.id).map(a => JSON.parse(JSON.stringify(a)))
    : [];
  const payload = {
    type: 'daftar-lesson',
    version: 6,
    includeArchives: !!includeArchives,
    lesson: JSON.parse(JSON.stringify(lesson)),
    archives: lessonArchives
  };
  const safe = (lesson.name || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '').replace(/\s+/g, '_');
  const now = new Date();
  const stamp = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + '_' + String(now.getHours()).padStart(2,'0') + '-' + String(now.getMinutes()).padStart(2,'0');
  const filePrefix = includeArchives ? ('درس_' + safe + '_شامل_مع_الأرشيف_') : ('درس_' + safe + '_شهر' + lesson.monthNumber + '_' + lesson.year + '_');
  downloadBlob(JSON.stringify(payload, null, 2), filePrefix + stamp + '.json', 'application/json');
  lesson.lastExportAt = Date.now();
  saveState();
  updateExportReminder();
  showToastMessage(includeArchives
    ? ('📦 تم تصدير الدرس «' + esc(lesson.name) + '» شاملاً ' + lessonArchives.length + ' شهر مؤرشف.')
    : ('📄 تم تصدير الشهر الحالي لـ «' + esc(lesson.name) + '» بنجاح (بدون أرشيف).'));
}

function importLesson(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(!data || typeof data !== 'object'){
        alert('تعذّر قراءة الملف (صيغة غير صحيحة).');
        return;
      }

      // الحالة الأولى: ملف درس فردي { lesson: {...}, archives: [...] }
      if(data.lesson && typeof data.lesson === 'object' && data.lesson.name){
        const lessonArchives = Array.isArray(data.archives) ? data.archives : (Array.isArray(data.archive) ? data.archive : []);
        executeImportSingleLesson(data.lesson, lessonArchives);
        return;
      }

      // الحالة الثانية: ملف يحتوي على قائمة دروس (تصدير عدة دروس أو نسخة احتياطية كاملة)
      const lessonList = Array.isArray(data.lessons) ? data.lessons : [];
      if(lessonList.length === 1){
        const singleL = lessonList[0];
        const matchingArchives = Array.isArray(data.archive) ? data.archive.filter(a => a.lessonId === singleL.id) : (Array.isArray(data.archives) ? data.archives : []);
        executeImportSingleLesson(singleL, matchingArchives);
        return;
      } else if(lessonList.length > 1){
        openMultiLessonImportModal(lessonList, Array.isArray(data.archive) ? data.archive : (Array.isArray(data.archives) ? data.archives : []));
        return;
      }

      // الحالة الثالثة: ملف دمج حضور (.daftar-att)
      if(data.type === 'daftar-attendance-transfer' || (data.records && data.students && (data.lessonId || data.scope || data.sessions || data.session))){
        const normPayload = normalizeAttendancePayload(data) || data;
        handleGlobalImportAttendanceFile(normPayload);
        return;
      }

      // الحالة الرابعة: ملف شهر مؤرشف منفرد (.daftar-month)
      if(data.type === 'daftar-single-archive' || (data.archive && data.archive.monthNumber && data.archive.lessonId)){
        const archObj = data.archive || data;
        executeImportSingleArchiveMonth(archObj);
        return;
      }

      alert('ملف الدرس غير صالح (لم يتم العثور على أي دروس صالحة للاستيراد داخل هذا الملف).');
    }catch(e){
      console.error(e);
      alert('تعذّر قراءة الملف أو استخراج الدروس منه.');
    }
  };
  reader.readAsText(file);
}

function handleGlobalImportAttendanceFile(payload){
  if(!payload || !payload.records){
    alert('ملف الحضور غير صالح أو لا يحتوي على سجلات.');
    return;
  }
  const lName = payload.lessonName || 'درس';
  // إذا لم يكن لدى المستخدم أي دروس
  if(!state.lessons || state.lessons.length === 0){
    if(confirm('تم التعرف على ملف حضور طلاب لدرس «' + lName + '»، ولا يوجد لديك أي دروس مسجلة حالياً.\nهل ترغب في إنشاء هذا الدرس تلقائياً واستيراد الطلاب وسجلات الحضور إليه؟')){
      const newL = {
        id: payload.lessonId || ('lesson_' + Date.now()),
        name: lName,
        monthNumber: payload.monthNumber || (new Date().getMonth() + 1),
        year: payload.year || new Date().getFullYear(),
        students: payload.students || [],
        sessions: payload.sessions || (payload.session ? [payload.session] : []),
        records: payload.records || {},
        groups: []
      };
      state.lessons.push(newL);
      saveState();
      renderAll();
      showToastMessage('✅ تم إنشاء الدرس «' + esc(lName) + '» واستيراد الطلاب والحضور بنجاح.');
    }
    return;
  }

  // إذا كان هناك درس مطابق بالمعرف أو الاسم
  const exactMatch = state.lessons.find(l => (payload.lessonId && l.id === payload.lessonId) || (payload.lessonName && l.name === payload.lessonName));

  // إذا كان هناك درس واحد فقط، أو وُجد تطابق دقيق
  if(state.lessons.length === 1 || exactMatch){
    const targetL = exactMatch || state.lessons[0];
    const conf = confirm('تم التعرف على ملف دمج حضور وارد لـ «' + lName + '».\nهل ترغب في دمجه وتحديث حضور الطلاب في درس «' + targetL.name + '»؟');
    if(conf){
      processIncomingAttendancePayload(targetL, payload);
    }
    return;
  }

  // إذا كانت هناك عدة دروس متاحة، نعرض نافذة منبثقة لاختيار الدرس
  const opts = state.lessons.map(l => '<option value="' + l.id + '">' + esc(l.name) + ' (' + (l.students ? l.students.length : 0) + ' طالب)</option>').join('');
  const modalHTML = '<div style="text-align:right;direction:rtl;line-height:1.6">'
    + '<p style="font-size:13px;color:var(--text);margin-top:0">'
    +   'تم التعرف على ملف حضور وارد لدرس «<b>' + esc(lName) + '</b>».'
    + '</p>'
    + '<div class="form-row" style="margin:12px 0">'
    +   '<label style="font-size:12.5px;font-weight:700">اختر الدرس المراد دمج هذا الحضور إليه:</label>'
    +   '<select id="sel_global_merge_target" style="width:100%;padding:8px 10px;font-size:13px;font-weight:700;border-radius:8px;border:1px solid var(--border);background:#fff">'
    +     opts
    +   '</select>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">'
    +   '<button class="btn btn-primary" id="btn_confirm_global_merge" style="font-weight:700">' + appIcon('zap', 13) + ' دمج الحضور الآن</button>'
    +   '<button class="btn btn-outline" id="btn_cancel_global_merge">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('📥 استيراد ودمج ملف الحضور', modalHTML);
  if($('#btn_confirm_global_merge')){
    $('#btn_confirm_global_merge').onclick = () => {
      const selId = $('#sel_global_merge_target').value;
      const targetL = state.lessons.find(l => l.id === selId);
      closeModal();
      if(targetL){
        processIncomingAttendancePayload(targetL, payload);
      }
    };
  }
  if($('#btn_cancel_global_merge')) $('#btn_cancel_global_merge').onclick = closeModal;
}

function executeImportSingleLesson(L, archives){
  if(!L || !L.name){
    alert('بيانات الدرس غير مكتملة.');
    return;
  }
  const norm = normalizeState({ settings: state.settings, lessons: [L], archive: [] }).lessons[0];
  const incomingArchives = (Array.isArray(archives) && archives.length > 0)
    ? normalizeState({ settings: state.settings, lessons: [L], archive: archives }).archive
    : [];

  const existingIdx = state.lessons.findIndex(x => x.id === L.id);
  const existingArchives = state.archive.filter(x => x.lessonId === L.id);

  // سيناريو 1: الملف المستورد لا يحتوي على شهور مؤرشفة (شهر حالي فقط)
  if(incomingArchives.length === 0){
    if(existingIdx >= 0){
      const confirmMsg = existingArchives.length > 0
        ? 'يوجد درس بنفس المعرّف («' + L.name + '») وله ' + existingArchives.length + ' شهر مؤرشف.\n\nهل ترغب في تحديث بيانات الشهر الحالي بمحتوى هذا الملف؟\n(سيتم الحفاظ على كافة الشهور المؤرشفة السابقة دون أي مساس بها).'
        : 'يوجد درس بنفس المعرّف («' + L.name + '»). هل ترغب في تحديث بياناته بمحتوى هذا الملف؟';
      if(!window.confirm(confirmMsg)) return;
      state.lessons[existingIdx] = norm;
    } else {
      state.lessons.push(norm);
    }
    // ملاحظة حاسمة: لا نلمس state.archive على الإطلاق حتى تظل الشهور المؤرشفة محفوظة 100%
    saveState();
    renderAll();
    showToastMessage('✅ تم استيراد الشهر الحالي للدرس «' + esc(L.name) + '» بنجاح' + (existingArchives.length > 0 ? ' (مع الحفاظ على ' + existingArchives.length + ' شهر مؤرشف)' : '') + '.');
    return;
  }

  // سيناريو 2: الملف المستورد يحتوي على شهور مؤرشفة + المستخدم لديه بالفعل شهور مؤرشفة لهذا الدرس
  if(existingArchives.length > 0 && incomingArchives.length > 0){
    openImportArchiveChoiceModal(norm, incomingArchives, existingArchives, existingIdx);
    return;
  }

  // سيناريو 3: المستخدم ليس لديه شهور مؤرشفة لهذا الدرس والملف يحتوي على أرشيف
  if(existingIdx >= 0){
    if(!window.confirm('يوجد درس بنفس المعرّف («' + L.name + '»). هل ترغب في تحديث بياناته واستيراد ' + incomingArchives.length + ' شهر مؤرشف معه؟')) return;
    state.lessons[existingIdx] = norm;
  } else {
    state.lessons.push(norm);
  }
  state.archive = state.archive.filter(x => x.lessonId !== norm.id).concat(incomingArchives);
  saveState();
  renderAll();
  showToastMessage('✅ تم استيراد الدرس «' + esc(L.name) + '» مع ' + incomingArchives.length + ' شهر مؤرشف.');
}

function openImportArchiveChoiceModal(norm, incomingArchives, existingArchives, existingIdx){
  const modalHTML = '<div style="text-align:right;direction:rtl;line-height:1.6">'
    + '<p style="font-size:13px;color:var(--text);margin-top:0">'
    +   'يحتوي الملف المستورد لـ «<b>' + esc(norm.name) + '</b>» على <b>' + incomingArchives.length + '</b> شهر مؤرشف، ويوجد لديك حالياً <b>' + existingArchives.length + '</b> شهر مؤرشف لنفس الدرس.'
    + '</p>'
    + '<p style="font-size:12.5px;font-weight:700;color:var(--primary);margin-bottom:12px">'
    +   'كيف ترغب في التعامل مع الشهور المؤرشفة؟'
    + '</p>'
    + '<div style="display:flex;flex-direction:column;gap:10px;margin:12px 0">'
    +   '<button type="button" class="btn btn-outline" id="btn_import_merge_archives" style="padding:12px 14px;text-align:right;display:flex;flex-direction:column;align-items:flex-start;gap:4px;border-width:2px;border-color:var(--primary);background:var(--card-bg,#f8fafc);cursor:pointer;border-radius:8px">'
    +     '<span style="font-size:13.5px;font-weight:800;color:var(--primary)">' + appIcon('download', 14) + ' استيراد الشهر الحالي + دمج الشهور المؤرشفة (موصى به)</span>'
    +     '<span style="font-size:11.5px;color:var(--muted)">إضافة الشهور المؤرشفة الجديدة وتحديث المتطابق مع الحفاظ الكامل على كافة الشهور القديمة في جهازك.</span>'
    +   '</button>'
    +   '<button type="button" class="btn btn-outline" id="btn_import_current_only" style="padding:12px 14px;text-align:right;display:flex;flex-direction:column;align-items:flex-start;gap:4px;border-width:2px;border-color:var(--border);background:#fff;cursor:pointer;border-radius:8px">'
    +     '<span style="font-size:13.5px;font-weight:800;color:var(--text)">' + appIcon('file-text', 14) + ' استيراد الشهر الحالي فقط (وتجاهل أرشيف الملف)</span>'
    +     '<span style="font-size:11.5px;color:var(--muted)">تحديث الشهر الحالي فقط والإبقاء على الـ ' + existingArchives.length + ' شهر مؤرشف المحفوظة في هذا الجهاز دون أي تعديل.</span>'
    +   '</button>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:12px">'
    +   '<button class="btn" id="btn_cancel_import_choice">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('📥 خيارات استيراد الدرس والأرشيف', modalHTML);

  $('#btn_import_merge_archives').onclick = () => {
    closeModal();
    if(existingIdx >= 0) state.lessons[existingIdx] = norm;
    else state.lessons.push(norm);

    // دمج ذكي للشهور المؤرشفة
    const mergedArchives = [...existingArchives];
    incomingArchives.forEach(inA => {
      const matchIdx = mergedArchives.findIndex(exA => exA.id === inA.id || (exA.monthNumber === inA.monthNumber && exA.year === inA.year));
      if(matchIdx >= 0){
        mergedArchives[matchIdx] = inA;
      } else {
        mergedArchives.push(inA);
      }
    });
    state.archive = state.archive.filter(x => x.lessonId !== norm.id).concat(mergedArchives);
    saveState();
    renderAll();
    showToastMessage('✅ تم استيراد الدرس «' + esc(norm.name) + '» ودمج أرشيفه بنجاح (إجمالي ' + mergedArchives.length + ' شهر مؤرشف).');
  };

  $('#btn_import_current_only').onclick = () => {
    closeModal();
    if(existingIdx >= 0) state.lessons[existingIdx] = norm;
    else state.lessons.push(norm);
    // الإبقاء على الأرشيف الحالي دون أي تعديل
    saveState();
    renderAll();
    showToastMessage('✅ تم استيراد الشهر الحالي لـ «' + esc(norm.name) + '» مع الحفاظ التام على ' + existingArchives.length + ' شهر مؤرشف بأرشيفك.');
  };

  $('#btn_cancel_import_choice').onclick = closeModal;
}

function openMultiLessonImportModal(lessons, allArchives){
  const modalHTML = '<div class="reset-box" style="text-align:right;line-height:1.6">'
    + '<p style="font-size:13px;color:var(--text);margin-bottom:10px">'
    +   'يحتوي هذا الملف على <b>' + lessons.length + '</b> دروس. حدد الدروس التي ترغب في استيرادها ودمجها مع دروسك الحالية دون حذف أي بيانات أرشيف:'
    + '</p>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    +   '<span style="font-size:12px;font-weight:800">قائمة الدروس المتاحة بالملف:</span>'
    +   '<div style="display:flex;gap:6px">'
    +     '<button type="button" class="btn btn-sm btn-outline" id="import_btn_select_all" style="font-size:11px;padding:2px 8px">تحديد الكل</button>'
    +     '<button type="button" class="btn btn-sm btn-outline" id="import_btn_deselect_all" style="font-size:11px;padding:2px 8px">إلغاء التحديد</button>'
    +   '</div>'
    + '</div>'
    + '<div style="max-height:190px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--bg)">'
    +   lessons.map(l => {
          const lArchs = (allArchives || []).filter(a => a.lessonId === l.id);
          return '<label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;background:#fff;border:1px solid var(--border);cursor:pointer">'
            + '<input type="checkbox" class="import-lesson-cb" value="' + l.id + '" checked>'
            + '<span style="font-size:12.5px;font-weight:700">' + esc(l.name)
            + ' <small class="muted">(' + (l.students ? l.students.length : 0) + ' طالب · ' + (l.sessions ? l.sessions.length : 0) + ' حصة' + (lArchs.length > 0 ? ' · ' + lArchs.length + ' أرشيف' : '') + ')</small>'
            + '</span>'
            + '</label>';
        }).join('')
    + '</div>'
    + '<div style="margin-top:10px;padding:8px 10px;background:var(--card-bg,#f8fafc);border:1px solid var(--border);border-radius:6px">'
    +   '<label class="switch-row" style="font-size:12px;font-weight:700;display:flex;align-items:center;cursor:pointer">'
    +     '<input type="checkbox" id="chk_multi_import_include_archives" checked style="margin-left:6px">'
    +     '<span>📦 استيراد ودمج الشهور المؤرشفة المرفقة مع كل درس (مع الحفاظ على أرشيفك الحالي)</span>'
    +   '</label>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:14px">'
    +   '<button class="btn btn-primary" id="import_btn_proceed">📥 استيراد ودمج الدروس المحددة</button>'
    +   '<button class="btn btn-outline" id="import_btn_cancel">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('📚 استيراد دروس من ملف مجمع', modalHTML);

  $('#import_btn_select_all').onclick = () => { $$('.import-lesson-cb').forEach(cb => cb.checked = true); };
  $('#import_btn_deselect_all').onclick = () => { $$('.import-lesson-cb').forEach(cb => cb.checked = false); };
  $('#import_btn_cancel').onclick = closeModal;

  $('#import_btn_proceed').onclick = () => {
    const checkedIds = $$('.import-lesson-cb:checked').map(cb => cb.value);
    if(checkedIds.length === 0){
      alert('يرجى تحديد درس واحد على الأقل للاستيراد.');
      return;
    }
    const importWithArchives = $('#chk_multi_import_include_archives') ? $('#chk_multi_import_include_archives').checked : true;
    const chosen = lessons.filter(l => checkedIds.includes(l.id));
    let importedCount = 0;
    chosen.forEach(L => {
      const incomingLArchs = (allArchives || []).filter(a => a.lessonId === L.id);
      const existingArchives = state.archive.filter(a => a.lessonId === L.id);
      const norm = normalizeState({ settings: state.settings, lessons: [L], archive: [] }).lessons[0];
      const normArchives = normalizeState({ settings: state.settings, lessons: [L], archive: incomingLArchs }).archive;
      
      const existing = state.lessons.findIndex(x => x.id === L.id);
      if(existing >= 0){
        state.lessons[existing] = norm;
      } else {
        state.lessons.push(norm);
      }

      if(importWithArchives && normArchives.length > 0){
        // دمج ذكي دون مساس بالشهور القديمة
        const mergedArchives = [...existingArchives];
        normArchives.forEach(inA => {
          const matchIdx = mergedArchives.findIndex(exA => exA.id === inA.id || (exA.monthNumber === inA.monthNumber && exA.year === inA.year));
          if(matchIdx >= 0) mergedArchives[matchIdx] = inA;
          else mergedArchives.push(inA);
        });
        state.archive = state.archive.filter(x => x.lessonId !== norm.id).concat(mergedArchives);
      }
      // في حال عدم الرغبة في استيراد الأرشيف أو normArchives فارغة: لا نعدل state.archive الخاصة بهذا الدرس أبداً
      importedCount++;
    });
    saveState();
    renderAll();
    closeModal();
    showToastMessage('✅ تم استيراد ودمج ' + importedCount + ' درس بنجاح مع الحفاظ الكامل على كافة الشهور المؤرشفة.');
  };
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
    // النسخة المشفرة تحتفظ بكافة البوتات لتمكين استعادتها
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

/* ---------- درع الحفظ التلقائي وقاعدة البيانات المقاومة للمسح (v42) ---------- */
function idbOpen(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('attendance-app', 2);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if(!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
      if(!db.objectStoreNames.contains('appState')) db.createObjectStore('appState');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSetStore(storeName, key, val){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetStore(storeName, key){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const r = tx.objectStore(storeName).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function idbDelStore(storeName, key){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbSet(key, val){ return idbSetStore('handles', key, val); }
async function idbGet(key){ return idbGetStore('handles', key); }
async function idbDel(key){ return idbDelStore('handles', key); }

/* حفظ واسترجاع الحالة الكاملة في IndexedDB */
async function idbSaveAppState(stateObj){
  try{
    if(!stateObj) return;
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appState', 'readwrite');
      const store = tx.objectStore('appState');
      store.put(stateObj, 'latestState');
      if((stateObj.lessons && stateObj.lessons.length > 0) || (stateObj.archive && stateObj.archive.length > 0)){
        store.put({ state: stateObj, savedAt: new Date().toISOString() }, 'snapshot_backup');
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }catch(e){
    console.warn('idbSaveAppState error:', e);
  }
}
async function idbGetAppState(){
  try{
    const res = await idbGetStore('appState', 'latestState');
    return res || null;
  }catch(e){
    return null;
  }
}
async function idbGetSnapshotBackup(){
  try{
    const res = await idbGetStore('appState', 'snapshot_backup');
    return (res && res.state) ? res.state : null;
  }catch(e){
    return null;
  }
}

/* فحص واستعادة البيانات تلقائياً عند الدخول إن فُقدت من LocalStorage */
async function checkAndRestoreIndexedDBBackup(){
  if(!state || ((!state.lessons || state.lessons.length === 0) && (!state.archive || state.archive.length === 0))){
    try{
      const idbState = await idbGetAppState();
      let restored = null;
      if(idbState && ((idbState.lessons && idbState.lessons.length > 0) || (idbState.archive && idbState.archive.length > 0))){
        restored = normalizeState(idbState);
      } else {
        const snap = await idbGetSnapshotBackup();
        if(snap && ((snap.lessons && snap.lessons.length > 0) || (snap.archive && snap.archive.length > 0))){
          restored = normalizeState(snap);
        }
      }

      if(restored && ((restored.lessons && restored.lessons.length > 0) || (restored.archive && restored.archive.length > 0))){
        state = restored;
        saveState(true);
        renderAll();
        showToastMessage('🛡️ تم استعادة بياناتك وبوتاتك تلقائياً وبأمان من النسخة المحمية.');
        return true;
      }
    }catch(err){
      console.warn('Auto restore from IDB failed:', err);
    }
  }
  return false;
}

function autoSaveSupported(){
  return ('showSaveFilePicker' in window) && ('indexedDB' in window);
}

/* كتابة البيانات الحية في الملف المباشر (مع الحفاظ الكامل على البوتات والأرشيف) */
async function writeToFile(){
  if(!fileHandle) return false;
  try{
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(state, null, 2));
    await writable.close();
    autoSaveReady = true;
    return true;
  }catch(e){
    console.warn('writeToFile failed:', e);
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

/* تفعيل الحفظ التلقائي مع المعالجة الذكية للمقابض التالفة وإعادة التوجيه لاختيار ملف جديد */
async function enableAutoSave(forceNewPicker = false){
  if(!autoSaveSupported()){
    alert('هذه الخاصية تتطلب متصفح Chrome أو Edge. علماً بأن بياناتك وبوتاتك محفوظة بالكامل وتلقائياً وبشكل دائم داخل ذاكرة المتصفح وقاعدة بيانات IndexedDB المقاومة للمسح.');
    updateAutoSaveStatus();
    return;
  }
  try{
    let handle = forceNewPicker ? null : fileHandle;
    let writeSuccess = false;

    // 1. إذا كان لدينا مقبض سابق، نحاول اختباره أولاً
    if(handle){
      try{
        let perm = 'prompt';
        if(handle.queryPermission) perm = await handle.queryPermission({ mode: 'readwrite' });
        if(perm !== 'granted' && handle.requestPermission) {
          perm = await handle.requestPermission({ mode: 'readwrite' });
        }
        if(perm === 'granted'){
          fileHandle = handle;
          writeSuccess = await writeToFile();
        }
      }catch(e){
        writeSuccess = false;
      }
    }

    // 2. إذا لم يكن هناك مقبض سابق أو فشلت الكتابة للمقبض القديم (تلف المقبض): نطلب اختيار ملف جديد فوراً
    if(!writeSuccess){
      try{
        handle = await window.showSaveFilePicker({
          suggestedName: 'بيانات_تطبيق_دفتر.json',
          types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
        });
      }catch(pickErr){
        if(pickErr && pickErr.name === 'AbortError'){
          updateAutoSaveStatus();
          return;
        }
        throw pickErr;
      }

      if(!handle){
        updateAutoSaveStatus();
        return;
      }

      fileHandle = handle;
      try{
        if(handle.requestPermission) await handle.requestPermission({ mode: 'readwrite' });
      }catch(e){}

      writeSuccess = await writeToFile();
      if(!writeSuccess){
        // إذا تعذرت الكتابة حتى مع الملف المختار حديثاً (بسبب قيود نظام التشغيل على أندرويد):
        fileHandle = null;
        await idbDel('fileHandle');
        updateAutoSaveStatus();
        alert('⚠️ تعذّرت الكتابة المباشرة للملف على هذا المتصفح/الجهاز (بسبب قيود نظام التشغيل على حفظ الملفات التلقائي).\n\n💡 لا تقلق: بياناتك وبوتاتك محفوظة بالكامل وبشكل دائم داخل المتصفح وقاعدة بيانات الذاكرة الدائمة (IndexedDB) المقاومة للمسح، ويمكنك تنزيل نسخة احتياطية من زر «💾 حفظ نسخة احتياطية» متى أردت.');
        return;
      }
    }

    // نجحت العملية!
    await idbSet('fileHandle', fileHandle);
    autoSaveReady = true;
    updateAutoSaveStatus();
    showToastMessage('✅ تم تفعيل الحفظ التلقائي في الملف بنجاح.');
  }catch(e){
    if(e && e.name === 'AbortError') return;
    fileHandle = null;
    try{ await idbDel('fileHandle'); }catch(err){}
    updateAutoSaveStatus();
    alert('تعذّر تفعيل الحفظ التلقائي: ' + (e.message || e));
  }
}

async function disableAutoSave(){
  if(!window.confirm('إيقاف الحفظ التلقائي في الملف؟ (سيستمر الحفظ الدائم التلقائي داخل المتصفح وقاعدة IndexedDB)')) return;
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
    html = '⚠️ الحفظ التلقائي في ملف غير مدعوم في هذا المتصفح (يتطلب Chrome/Edge). لكن الحفظ التلقائي الآمن داخل المتصفح وقاعدة IndexedDB مفعّل دائماً.';
  } else if(fileHandle && autoSaveReady){
    badgeText = '💾 حفظ تلقائي: مفعّل';
    badgeCls = 'as-on';
    html = '✅ الحفظ التلقائي مفعّل - كل تغيير يُحفظ تلقائياً وفورياً في الملف الذي اخترته على جهازك.';
  } else if(fileHandle && !autoSaveReady){
    badgeText = '🔗 اضغط لتفعيل الحفظ';
    badgeCls = 'as-off';
    html = 'يوجد ملف محفوظ لكن الصلاحية تحتاج إعادة تنشيط. اضغط هنا أو على المفتاح لتنشيطها.';
  } else {
    badgeText = '💾 حفظ تلقائي: غير مفعّل';
    badgeCls = 'as-off';
    html = 'الحفظ التلقائي في ملف غير مفعّل. اضغط لتفعيل الحفظ واختر ملفاً على هاتفك.';
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
      // نتحقق من الصلاحية دون استدعاء طلب منبثق لمنع خطأ SecurityError
      try{
        if(handle.queryPermission){
          const q = await handle.queryPermission({ mode: 'readwrite' });
          if(q === 'granted'){
            const ok = await writeToFile();
            if(ok) autoSaveReady = true;
          }
        }
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
  if(!window.confirm('أرشفة شهر ' + mn + '/' + yr + ' لدرس «' + lesson.name + '»؟ سيبدأ شهر جديد فارغ لهذا الدرس فقط مع حفظ سجلات الحضور ودرجات الاختبارات في الأرشيف.')) return;

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
    exams: JSON.parse(JSON.stringify(lesson.exams || [])),
    examScores: JSON.parse(JSON.stringify(lesson.examScores || {})),
    examNotes: JSON.parse(JSON.stringify(lesson.examNotes || {})),
    examExclusions: JSON.parse(JSON.stringify(lesson.examExclusions || {})),
    hiddenExamStudents: JSON.parse(JSON.stringify(lesson.hiddenExamStudents || [])),
    examGroups: JSON.parse(JSON.stringify(lesson.examGroups || [])),
    groups: JSON.parse(JSON.stringify(lesson.groups || [])),
    statuses: lesson.statuses ? JSON.parse(JSON.stringify(lesson.statuses)) : (lesson.statusLabels ? effectiveStatuses(lesson) : undefined),
    statusLabels: lesson.statusLabels ? JSON.parse(JSON.stringify(lesson.statusLabels)) : {},
    archivedAt: new Date().toISOString()
  });

  let m = mn + 1, y = yr;
  if(m > 12){ m = 1; y++; }
  lesson.monthNumber = m;
  lesson.year = y;
  lesson.records = {};
  lesson.exams = [];
  lesson.examScores = {};
  lesson.examNotes = {};
  lesson.examExclusions = {};
  lesson.hiddenExamStudents = [];
  lesson.students.forEach(st => {
    st.paid = false;
    st.payments = [];
  });
  fillSessions(lesson);
  saveState();
  renderAll();
  showToastMessage('📦 تم أرشفة شهر ' + mn + '/' + yr + ' ونقل درجات واختبارات الشهر للأرشيف بنجاح.');
}

/* ---------- استعادة شهر مؤرشف للتعديل ---------- */
function restoreArchiveMonth(idx){
  const a = state.archive[idx];
  if(!a) return;
  let L = state.lessons.find(x => x.id === a.lessonId);
  if(!L){
    // إذا كان الدرس غير موجود في القائمة الحالية، يتم إعادة إنشائه تلقائياً (v38)
    L = {
      id: a.lessonId || uid('l'),
      name: a.lessonName || 'درس مستعاد',
      monthNumber: a.monthNumber || 1,
      year: a.year || new Date().getFullYear(),
      subscription: !!a.subscription,
      students: JSON.parse(JSON.stringify(a.students || [])),
      sessions: JSON.parse(JSON.stringify(a.sessions || [])),
      records: JSON.parse(JSON.stringify(a.records || {})),
      exams: JSON.parse(JSON.stringify(a.exams || [])),
      examScores: JSON.parse(JSON.stringify(a.examScores || {})),
      examNotes: JSON.parse(JSON.stringify(a.examNotes || {})),
      examExclusions: JSON.parse(JSON.stringify(a.examExclusions || {})),
      hiddenExamStudents: JSON.parse(JSON.stringify(a.hiddenExamStudents || [])),
      examGroups: JSON.parse(JSON.stringify(a.examGroups || [])),
      groups: JSON.parse(JSON.stringify(a.groups || []))
    };
    state.lessons.unshift(L);
  } else {
    const hasCurrent = Object.keys(L.records||{}).some(sid => Object.keys(L.records[sid]||{}).length > 0);
    if(hasCurrent){
      if(!window.confirm('الشهر الحالي للدرس «' + L.name + '» يحتوي على تسجيلات حضور.\nسيتم أرشفته تلقائياً قبل استعادة هذا الشهر. متابعة؟')) return;
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
        exams: JSON.parse(JSON.stringify(L.exams || [])),
        examScores: JSON.parse(JSON.stringify(L.examScores || {})),
        examNotes: JSON.parse(JSON.stringify(L.examNotes || {})),
        examExclusions: JSON.parse(JSON.stringify(L.examExclusions || {})),
        hiddenExamStudents: JSON.parse(JSON.stringify(L.hiddenExamStudents || [])),
        examGroups: JSON.parse(JSON.stringify(L.examGroups || [])),
        archivedAt: new Date().toISOString()
      });
    } else {
      if(!window.confirm('استعادة شهر ' + a.monthNumber + '/' + a.year + ' لدرس «' + L.name + '»؟\nسيستبدل الشهر الحالي الفارغ بالمؤرشف. متابعة؟')) return;
    }
    L.monthNumber = a.monthNumber;
    L.year = a.year;
    L.subscription = a.subscription;
    L.sessions = JSON.parse(JSON.stringify(a.sessions || []));
    L.records = JSON.parse(JSON.stringify(a.records || {}));
    L.exams = JSON.parse(JSON.stringify(a.exams || []));
    L.examScores = JSON.parse(JSON.stringify(a.examScores || {}));
    L.examNotes = JSON.parse(JSON.stringify(a.examNotes || {}));
    L.examExclusions = JSON.parse(JSON.stringify(a.examExclusions || {}));
    L.hiddenExamStudents = JSON.parse(JSON.stringify(a.hiddenExamStudents || []));
    if(Array.isArray(a.students) && a.students.length > 0){
      L.students = JSON.parse(JSON.stringify(a.students));
    }
  }

  state.archive.splice(idx, 1);
  currentLessonId = L.id;
  currentArchiveIdx = null;
  saveState();
  renderAll();
  switchTab('lessons');
  renderLessonDetail();
  showToastMessage('♻️ تم استعادة الشهر ' + a.monthNumber + '/' + a.year + ' للرئيسية بنجاح. لعرض شهورك المؤرشفة المتبقية، اضغط على تبويب الأرشيف مجدداً.');
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
    let txt = sd.messageTemplate.replace(/\{time\}/g, time || '');
    if(txt.includes('{exams}')){
      const curL = curLesson();
      let exText = '';
      if(curL && Array.isArray(curL.exams) && curL.exams.length > 0){
        const lastEx = curL.exams[curL.exams.length - 1];
        exText = 'آخر اختبار: ' + lastEx.name + ' (من ' + lastEx.maxScore + ')';
      }
      txt = txt.replace(/\{exams\}/g, exText);
    }
    return txt;
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
function buildMonthReportText(name, monthNumber, year, students, sessions, records, statuses, lessonObj, groupByGroups){
  const ps = pastSessions(sessions);
  const L = lessonObj || curLesson();
  const groups = (L && Array.isArray(L.groups)) ? L.groups : [];
  const isGrouped = groupByGroups && groups.length > 0;

  let text = '📊 تقرير شهر ' + monthNumber + '/' + year + ' - ' + name + '\n';
  text += 'عدد الحصص: ' + sessions.length + ' · عدد الطلاب: ' + students.length + '\n';

  if(isGrouped){
    text += '\n📈 نسب الحضور (مقسمة بالمجموعات):';
    groups.forEach(g => {
      const gStudents = students.filter(st => st.groupId === g.id);
      if(gStudents.length === 0) return;
      const gRows = computeStats(gStudents, ps, records, statuses).slice().sort((a,b) => b.pct - a.pct);
      text += '\n\n*👥 مجموعة: ' + g.name + ' (' + gStudents.length + ' طالب)*';
      gRows.forEach((r, i) => {
        text += '\n' + (i+1) + '. ' + r.st.name + ' ⬅️ ' + r.pct + '% (' + r.done + '/' + r.total + ')';
      });
    });
    const noGrp = students.filter(st => !st.groupId);
    if(noGrp.length > 0){
      const noRows = computeStats(noGrp, ps, records, statuses).slice().sort((a,b) => b.pct - a.pct);
      text += '\n\n*👥 بدون مجموعة (' + noGrp.length + ' طالب)*';
      noRows.forEach((r, i) => {
        text += '\n' + (i+1) + '. ' + r.st.name + ' ⬅️ ' + r.pct + '% (' + r.done + '/' + r.total + ')';
      });
    }
  } else {
    const rows = computeStats(students, ps, records, statuses).slice().sort((a,b) => b.pct - a.pct);
    text += '\n📈 نسب الحضور:';
    rows.forEach((r, i) => {
      text += '\n' + (i+1) + '. ' + r.st.name + ' - ' + r.pct + '% (' + r.done + '/' + r.total + ')';
    });
  }

  const allRows = computeStats(students, ps, records, statuses);
  const low = allRows.filter(r => r.pct < 50);
  if(low.length){
    text += '\n\n⚠️ نسبة أقل من 50% (يحتاجون متابعة):';
    low.forEach(r => { text += '\n• ' + r.st.name + ' - ' + r.pct + '%'; });
  }

  /* نتائج درجات الاختبارات */
  if(L && Array.isArray(L.exams) && L.exams.length > 0){
    text += '\n\n📝 نتائج درجات الاختبارات:';
    L.exams.forEach(ex => {
      text += '\n▪️ ' + ex.name + ' (من ' + ex.maxScore + '):';
      if(isGrouped){
        groups.forEach(g => {
          const gStudents = students.filter(st => st.groupId === g.id);
          if(gStudents.length === 0) return;
          text += '\n  *👥 مجموعة: ' + g.name + '*';
          gStudents.forEach(st => {
            const isExcluded = (L.examExclusions && L.examExclusions[st.id] && L.examExclusions[st.id][ex.id]);
            const note = (L.examNotes && L.examNotes[st.id] && L.examNotes[st.id][ex.id]);
            const sc = (L.examScores && L.examScores[st.id] && L.examScores[st.id][ex.id]);
            if(isExcluded){
              text += '\n    - ' + st.name + ': لم يدخل الاختبار 🚫' + (note ? ' (' + note + ')' : '');
            } else if(sc !== undefined && sc !== '' && !isNaN(Number(sc))){
              text += '\n    - ' + st.name + ': ' + sc + '/' + ex.maxScore + (note ? ' (' + note + ')' : '');
            }
          });
        });
        const noGrp = students.filter(st => !st.groupId);
        if(noGrp.length > 0){
          text += '\n  *👥 بدون مجموعة*';
          noGrp.forEach(st => {
            const isExcluded = (L.examExclusions && L.examExclusions[st.id] && L.examExclusions[st.id][ex.id]);
            const note = (L.examNotes && L.examNotes[st.id] && L.examNotes[st.id][ex.id]);
            const sc = (L.examScores && L.examScores[st.id] && L.examScores[st.id][ex.id]);
            if(isExcluded){
              text += '\n    - ' + st.name + ': لم يدخل الاختبار 🚫' + (note ? ' (' + note + ')' : '');
            } else if(sc !== undefined && sc !== '' && !isNaN(Number(sc))){
              text += '\n    - ' + st.name + ': ' + sc + '/' + ex.maxScore + (note ? ' (' + note + ')' : '');
            }
          });
        }
      } else {
        students.forEach(st => {
          const isExcluded = (L.examExclusions && L.examExclusions[st.id] && L.examExclusions[st.id][ex.id]);
          const note = (L.examNotes && L.examNotes[st.id] && L.examNotes[st.id][ex.id]);
          const sc = (L.examScores && L.examScores[st.id] && L.examScores[st.id][ex.id]);
          if(isExcluded){
            text += '\n  - ' + st.name + ': لم يدخل الاختبار 🚫' + (note ? ' (' + note + ')' : '');
          } else if(sc !== undefined && sc !== '' && !isNaN(Number(sc))){
            text += '\n  - ' + st.name + ': ' + sc + '/' + ex.maxScore + (note ? ' (' + note + ')' : '');
          }
        });
      }
    });
  }

  const events = (sessions||[]).filter(s => s.event);
  if(events.length){
    text += '\n\n📝 أحداث الشهر:';
    events.forEach(s => { text += '\n• ' + s.label + (s.dateLabel ? ' (' + s.dateLabel + ')' : '') + ': ' + s.event + (s.eventNote ? ' - ' + s.eventNote : ''); });
  }
  return text.trim();
}

function showReportMessageModal(textOrGetter, lessonObj){
  const targets = waTargetOptions();
  const targetSel = '<select id="mr_target">' + targets.map(x => '<option value="'+esc(x.id)+'">'+esc(x.label)+'</option>').join('') + '</select>';
  const L = lessonObj || curLesson();
  const hasGroups = L && Array.isArray(L.groups) && L.groups.length > 0;

  const groupToggleHTML = hasGroups
    ? '<div style="margin:6px 0 10px;padding:6px 10px;background:var(--card-bg,#f8fafc);border:1px solid var(--border);border-radius:8px">'
      + '<label class="switch-row" style="font-size:12px;font-weight:700;display:flex;align-items:center;cursor:pointer">'
      +   '<input type="checkbox" id="mr_group_by" style="margin-left:6px">'
      +   '<span>🗂️ تقسيم الطلاب وترتيبهم حسب المجموعات في نص الرسالة</span>'
      + '</label>'
      + '</div>'
    : '';

  openModal('📨 تقرير الشهر كرسالة',
    '<div class="form-row"><label>إرسال إلى' + targetSel + '</label></div>'
    + '<div class="form-row"><label>نوع الواتساب<select id="mr_type"><option value="normal">واتساب عادي</option><option value="business">واتساب أعمال</option></select></label></div>'
    + groupToggleHTML
    + '<div class="form-row"><label>نص التقرير<textarea id="mr_preview" rows="12" dir="rtl" readonly></textarea></label></div>'
    + '<div class="modal-actions"><a class="btn btn-whatsapp" id="mr_send" href="#" target="_blank" rel="noopener">📨 فتح واتساب</a><button class="btn btn-outline" id="mr_copy">📋 نسخ</button><button class="btn btn-outline" id="mr_close">إغلاق</button></div>');
  
  const preview = $('#mr_preview');
  const link = $('#mr_send');
  const groupChk = $('#mr_group_by');

  function getText(){
    const isGrouped = groupChk ? groupChk.checked : false;
    if(typeof textOrGetter === 'function'){
      return textOrGetter(isGrouped);
    }
    if(L){
      const isArch = !L.students && L.lessonId;
      const nm = L.lessonName || L.name;
      const sts = archiveStudents(L);
      const recs = L.records || {};
      const sess = L.sessions || [];
      const stss = effectiveStatuses(L);
      return buildMonthReportText(nm, L.monthNumber, L.year, sts, sess, recs, stss, L, isGrouped);
    }
    return typeof textOrGetter === 'string' ? textOrGetter : '';
  }

  function upd(){
    const currentText = getText();
    preview.value = currentText;
    const type = $('#mr_type').value === 'business' ? 'business' : 'normal';
    const t = resolveWaTarget($('#mr_target').value, currentText, type);
    link.href = t.href;
  }

  $('#mr_target').addEventListener('change', upd);
  $('#mr_type').addEventListener('change', upd);
  if(groupChk) groupChk.addEventListener('change', upd);
  upd();

  $('#mr_copy').onclick = () => {
    const curT = getText();
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(curT).then(() => showToastMessage('📋 تم نسخ التقرير.')); }
    else fallbackCopy(curT);
  };
  $('#mr_close').onclick = closeModal;
}

function monthlyReportMessage(lesson){
  showReportMessageModal(null, lesson);
}

function archiveMonthlyMessage(a){
  const L = state.lessons.find(x => x.id === a.lessonId);
  showReportMessageModal(null, a);
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
  const eff = statuses || (lesson ? effectiveStatuses(lesson) : state.settings.statuses);
  const labelOf = (id) => { const st = eff.find(x => x.id === id); return st ? st.label : id; };
  const iconOf = (id) => {
    const st = eff.find(x => x.id === id);
    if(!st) return '❓ ' + id;
    if(st.type === 'present' || id === 'st_done') return '✅ ' + st.label;
    if(st.type === 'apology' || id === 'st_apology') return '⚠️ ' + st.label;
    return '❌ ' + st.label;
  };
  const groups = {};
  lesson.students.forEach(st => {
    const rec = (lesson.records[st.id] && lesson.records[st.id][session.id]) || {};
    const key = rec.status || '__none__';
    if(!groups[key]) groups[key] = [];
    groups[key].push(st.name);
  });
  let text = '📋 ملخص حصة: ' + session.label + (session.dateLabel ? ' (' + session.dateLabel + ')' : '') + '\n';
  text += '📍 ' + (lesson.lessonName || lesson.name) + '\n';
  if(session.event) text += '📝 ' + session.event + (session.eventNote ? ' - ' + session.eventNote : '') + '\n';
  const printed = {};
  eff.forEach(stObj => {
    const k = stObj.id;
    const list = groups[k] || [];
    if(!list.length) return;
    text += '\n' + iconOf(k) + ' (' + list.length + '):\n' + list.map(n => '• ' + n).join('\n');
    printed[k] = true;
  });
  Object.keys(groups).forEach(k => {
    if(k === '__none__' || printed[k]) return;
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
  const lessonId = lesson.lessonId || lesson.id;
  const lessonName = lesson.lessonName || lesson.name || 'درس';
  const months = [];
  if(includeAll){
    (state.archive || []).filter(a => (a.lessonId === lessonId || a.id === lessonId))
      .sort((a,b) => (a.year - b.year) || (a.monthNumber - b.monthNumber))
      .forEach(a => {
        months.push({ title: 'شهر ' + a.monthNumber + '/' + a.year, sessions: pastSessions(a.sessions || []), records: (a.records && a.records[student.id]) || {} });
      });
    const curL = state.lessons.find(x => x.id === lessonId);
    if(curL && curL !== lesson){
      months.push({ title: 'شهر ' + curL.monthNumber + '/' + curL.year, sessions: pastSessions(curL.sessions || []), records: (curL.records && curL.records[student.id]) || {} });
    }
  }
  if(!includeAll || !months.some(m => m.title === ('شهر ' + lesson.monthNumber + '/' + lesson.year))){
    months.push({ title: 'شهر ' + lesson.monthNumber + '/' + lesson.year, sessions: pastSessions(lesson.sessions || []), records: (lesson.records && lesson.records[student.id]) || {} });
  }
  let text = '📋 ملخص حضور الطالب: ' + student.name + '\n';
  text += '📌 ' + lessonName + '\n';
  let totalDone = 0, totalSessions = 0;
  months.forEach(m => {
    const groups = {};
    let done = 0;
    (m.sessions || []).forEach(s => {
      let rec = m.records[s.id] || {};
      if(typeof rec === 'string') rec = { status: rec };
      const key = rec.status || '__none__';
      if(!groups[key]) groups[key] = [];
      groups[key].push(s.label + (s.dateLabel ? ' (' + s.dateLabel + ')' : ''));
      if(isPresentStatus(rec.status, eff)) done++;
    });
    totalDone += done; totalSessions += (m.sessions ? m.sessions.length : 0);
    text += '\n━━━━ ' + m.title + ' ━━━━\n';
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
  if($('#prof_toggle_hide')){
    $('#prof_toggle_hide').onclick = () => {
      if(!Array.isArray(lesson.hiddenStudents)) lesson.hiddenStudents = [];
      if(lesson.hiddenStudents.includes(student.id)){
        lesson.hiddenStudents = lesson.hiddenStudents.filter(x => x !== student.id);
        showToastMessage('✅ تم استعادة الطالب للجدول.');
      } else {
        lesson.hiddenStudents.push(student.id);
        showToastMessage('🚫 تم حجب الطالب من الجدول والمراسلة.');
      }
      saveState();
      closeModal();
      renderLessonDetail();
    };
  }
  $('#st_close').onclick = closeModal;
}

function updateStatusCellUI(sel, statuses){
  const cur = sel.value;
  const list = statuses || (typeof state !== 'undefined' && state.settings && state.settings.statuses);
  if(!cur){
    sel.className = 'status-select s-empty';
    sel.style.background = '';
    sel.style.borderColor = '';
    sel.style.color = '';
    return;
  }
  const sObj = list ? list.find(x => x.id === cur) : null;
  if(sObj && sObj.color){
    sel.className = 'status-select s-custom';
    sel.style.background = hexToRgba(sObj.color, 0.15);
    sel.style.borderColor = hexToRgba(sObj.color, 0.4);
    sel.style.color = sObj.color;
  } else if(isPresentStatus(cur, list)){
    sel.className = 'status-select s-done';
    sel.style.background = '';
    sel.style.borderColor = '';
    sel.style.color = '';
  } else if(isApologyStatus(cur, list)){
    sel.className = 'status-select s-apology';
    sel.style.background = '';
    sel.style.borderColor = '';
    sel.style.color = '';
  } else if(isAbsentStatus(cur, list)){
    sel.className = 'status-select s-noanswer';
    sel.style.background = '';
    sel.style.borderColor = '';
    sel.style.color = '';
  } else {
    sel.className = 'status-select s-custom';
    sel.style.background = '';
    sel.style.borderColor = '';
    sel.style.color = '';
  }
}

function updateSessionCounterUI(ssid){
  const L = curLesson();
  if(!L) return;
  const eff = effectiveStatuses(L);
  let c = 0;
  L.students.forEach(st => {
    const rec = (L.records[st.id] && L.records[st.id][ssid]) || {};
    if(isPresentStatus(rec.status, eff)) c++;
  });
  const sIdx = L.sessions.findIndex(s => s.id === ssid);
  if(sIdx < 0) return;
  const col = 1 + state.settings.customFields.length + sIdx;
  const cells = $$('#tableFoot .count-row td');
  if(cells[col]) cells[col].innerHTML = '<b>' + c + ' / ' + L.students.length + '</b>';
}


/* =====================================================================
   📷 محرك قراءة ومسح أكواد QR فائق السرعة أوفلاين (jsQR Engine)
   ===================================================================== */
var jsQR = (function() {
  var module = { exports: {} };
  var exports = module.exports;
/**
 * Minified by jsDelivr using Terser v5.39.0.
 * Original file: /npm/jsqr@1.4.0/dist/jsQR.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
!function(o,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.jsQR=e():o.jsQR=e()}("undefined"!=typeof self?self:this,(function(){return function(o){var e={};function r(t){if(e[t])return e[t].exports;var c=e[t]={i:t,l:!1,exports:{}};return o[t].call(c.exports,c,c.exports,r),c.l=!0,c.exports}return r.m=o,r.c=e,r.d=function(o,e,t){r.o(o,e)||Object.defineProperty(o,e,{configurable:!1,enumerable:!0,get:t})},r.n=function(o){var e=o&&o.__esModule?function(){return o.default}:function(){return o};return r.d(e,"a",e),e},r.o=function(o,e){return Object.prototype.hasOwnProperty.call(o,e)},r.p="",r(r.s=3)}([function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function o(o,e){this.width=e,this.height=o.length/e,this.data=o}return o.createEmpty=function(e,r){return new o(new Uint8ClampedArray(e*r),e)},o.prototype.get=function(o,e){return!(o<0||o>=this.width||e<0||e>=this.height)&&!!this.data[e*this.width+o]},o.prototype.set=function(o,e,r){this.data[e*this.width+o]=r?1:0},o.prototype.setRegion=function(o,e,r,t,c){for(var s=e;s<e+t;s++)for(var a=o;a<o+r;a++)this.set(a,s,!!c)},o}();e.BitMatrix=t},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(2);e.addOrSubtractGF=function(o,e){return o^e};var c=function(){function o(o,e,r){this.primitive=o,this.size=e,this.generatorBase=r,this.expTable=new Array(this.size),this.logTable=new Array(this.size);for(var c=1,s=0;s<this.size;s++)this.expTable[s]=c,(c*=2)>=this.size&&(c=(c^this.primitive)&this.size-1);for(s=0;s<this.size-1;s++)this.logTable[this.expTable[s]]=s;this.zero=new t.default(this,Uint8ClampedArray.from([0])),this.one=new t.default(this,Uint8ClampedArray.from([1]))}return o.prototype.multiply=function(o,e){return 0===o||0===e?0:this.expTable[(this.logTable[o]+this.logTable[e])%(this.size-1)]},o.prototype.inverse=function(o){if(0===o)throw new Error("Can't invert 0");return this.expTable[this.size-this.logTable[o]-1]},o.prototype.buildMonomial=function(o,e){if(o<0)throw new Error("Invalid monomial degree less than 0");if(0===e)return this.zero;var r=new Uint8ClampedArray(o+1);return r[0]=e,new t.default(this,r)},o.prototype.log=function(o){if(0===o)throw new Error("Can't take log(0)");return this.logTable[o]},o.prototype.exp=function(o){return this.expTable[o]},o}();e.default=c},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(1),c=function(){function o(o,e){if(0===e.length)throw new Error("No coefficients.");this.field=o;var r=e.length;if(r>1&&0===e[0]){for(var t=1;t<r&&0===e[t];)t++;if(t===r)this.coefficients=o.zero.coefficients;else{this.coefficients=new Uint8ClampedArray(r-t);for(var c=0;c<this.coefficients.length;c++)this.coefficients[c]=e[t+c]}}else this.coefficients=e}return o.prototype.degree=function(){return this.coefficients.length-1},o.prototype.isZero=function(){return 0===this.coefficients[0]},o.prototype.getCoefficient=function(o){return this.coefficients[this.coefficients.length-1-o]},o.prototype.addOrSubtract=function(e){var r;if(this.isZero())return e;if(e.isZero())return this;var c=this.coefficients,s=e.coefficients;c.length>s.length&&(c=(r=[s,c])[0],s=r[1]);for(var a=new Uint8ClampedArray(s.length),n=s.length-c.length,d=0;d<n;d++)a[d]=s[d];for(d=n;d<s.length;d++)a[d]=t.addOrSubtractGF(c[d-n],s[d]);return new o(this.field,a)},o.prototype.multiply=function(e){if(0===e)return this.field.zero;if(1===e)return this;for(var r=this.coefficients.length,t=new Uint8ClampedArray(r),c=0;c<r;c++)t[c]=this.field.multiply(this.coefficients[c],e);return new o(this.field,t)},o.prototype.multiplyPoly=function(e){if(this.isZero()||e.isZero())return this.field.zero;for(var r=this.coefficients,c=r.length,s=e.coefficients,a=s.length,n=new Uint8ClampedArray(c+a-1),d=0;d<c;d++)for(var l=r[d],i=0;i<a;i++)n[d+i]=t.addOrSubtractGF(n[d+i],this.field.multiply(l,s[i]));return new o(this.field,n)},o.prototype.multiplyByMonomial=function(e,r){if(e<0)throw new Error("Invalid degree less than 0");if(0===r)return this.field.zero;for(var t=this.coefficients.length,c=new Uint8ClampedArray(t+e),s=0;s<t;s++)c[s]=this.field.multiply(this.coefficients[s],r);return new o(this.field,c)},o.prototype.evaluateAt=function(o){var e=0;if(0===o)return this.getCoefficient(0);var r=this.coefficients.length;if(1===o)return this.coefficients.forEach((function(o){e=t.addOrSubtractGF(e,o)})),e;e=this.coefficients[0];for(var c=1;c<r;c++)e=t.addOrSubtractGF(this.field.multiply(o,e),this.coefficients[c]);return e},o}();e.default=c},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(4),c=r(5),s=r(11),a=r(12);function n(o){var e=a.locate(o);if(!e)return null;for(var r=0,t=e;r<t.length;r++){var n=t[r],d=s.extract(o,n),l=c.decode(d.matrix);if(l)return{binaryData:l.bytes,data:l.text,chunks:l.chunks,version:l.version,location:{topRightCorner:d.mappingFunction(n.dimension,0),topLeftCorner:d.mappingFunction(0,0),bottomRightCorner:d.mappingFunction(n.dimension,n.dimension),bottomLeftCorner:d.mappingFunction(0,n.dimension),topRightFinderPattern:n.topRight,topLeftFinderPattern:n.topLeft,bottomLeftFinderPattern:n.bottomLeft,bottomRightAlignmentPattern:n.alignmentPattern}}}return null}var d={inversionAttempts:"attemptBoth"};function l(o,e,r,c){void 0===c&&(c={});var s=d;Object.keys(s||{}).forEach((function(o){s[o]=c[o]||s[o]}));var a="attemptBoth"===s.inversionAttempts||"invertFirst"===s.inversionAttempts,l="onlyInvert"===s.inversionAttempts||"invertFirst"===s.inversionAttempts,i=t.binarize(o,e,r,a),B=i.binarized,k=i.inverted,u=n(l?k:B);return u||"attemptBoth"!==s.inversionAttempts&&"invertFirst"!==s.inversionAttempts||(u=n(l?B:k)),u}l.default=l,e.default=l},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(0);function c(o,e,r){return o<e?e:o>r?r:o}var s=function(){function o(o,e){this.width=o,this.data=new Uint8ClampedArray(o*e)}return o.prototype.get=function(o,e){return this.data[e*this.width+o]},o.prototype.set=function(o,e,r){this.data[e*this.width+o]=r},o}();e.binarize=function(o,e,r,a){if(o.length!==e*r*4)throw new Error("Malformed data passed to binarizer.");for(var n=new s(e,r),d=0;d<e;d++)for(var l=0;l<r;l++){var i=o[4*(l*e+d)+0],B=o[4*(l*e+d)+1],k=o[4*(l*e+d)+2];n.set(d,l,.2126*i+.7152*B+.0722*k)}for(var u=Math.ceil(e/8),C=Math.ceil(r/8),m=new s(u,C),f=0;f<C;f++)for(var w=0;w<u;w++){var P=0,v=1/0,h=0;for(l=0;l<8;l++)for(d=0;d<8;d++){var y=n.get(8*w+d,8*f+l);P+=y,v=Math.min(v,y),h=Math.max(h,y)}var p=P/Math.pow(8,2);if(h-v<=24&&(p=v/2,f>0&&w>0)){var b=(m.get(w,f-1)+2*m.get(w-1,f)+m.get(w-1,f-1))/4;v<b&&(p=b)}m.set(w,f,p)}var g=t.BitMatrix.createEmpty(e,r),x=null;for(a&&(x=t.BitMatrix.createEmpty(e,r)),f=0;f<C;f++)for(w=0;w<u;w++){for(var M=c(w,2,u-3),L=c(f,2,C-3),N=(P=0,-2);N<=2;N++)for(var I=-2;I<=2;I++)P+=m.get(M+N,L+I);var O=P/25;for(N=0;N<8;N++)for(I=0;I<8;I++){d=8*w+N,l=8*f+I;var z=n.get(d,l);g.set(d,l,z<=O),a&&x.set(d,l,!(z<=O))}}return a?{binarized:g,inverted:x}:{binarized:g}}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(0),c=r(6),s=r(9),a=r(10);function n(o,e){for(var r=o^e,t=0;r;)t++,r&=r-1;return t}function d(o,e){return e<<1|o}var l=[{bits:21522,formatInfo:{errorCorrectionLevel:1,dataMask:0}},{bits:20773,formatInfo:{errorCorrectionLevel:1,dataMask:1}},{bits:24188,formatInfo:{errorCorrectionLevel:1,dataMask:2}},{bits:23371,formatInfo:{errorCorrectionLevel:1,dataMask:3}},{bits:17913,formatInfo:{errorCorrectionLevel:1,dataMask:4}},{bits:16590,formatInfo:{errorCorrectionLevel:1,dataMask:5}},{bits:20375,formatInfo:{errorCorrectionLevel:1,dataMask:6}},{bits:19104,formatInfo:{errorCorrectionLevel:1,dataMask:7}},{bits:30660,formatInfo:{errorCorrectionLevel:0,dataMask:0}},{bits:29427,formatInfo:{errorCorrectionLevel:0,dataMask:1}},{bits:32170,formatInfo:{errorCorrectionLevel:0,dataMask:2}},{bits:30877,formatInfo:{errorCorrectionLevel:0,dataMask:3}},{bits:26159,formatInfo:{errorCorrectionLevel:0,dataMask:4}},{bits:25368,formatInfo:{errorCorrectionLevel:0,dataMask:5}},{bits:27713,formatInfo:{errorCorrectionLevel:0,dataMask:6}},{bits:26998,formatInfo:{errorCorrectionLevel:0,dataMask:7}},{bits:5769,formatInfo:{errorCorrectionLevel:3,dataMask:0}},{bits:5054,formatInfo:{errorCorrectionLevel:3,dataMask:1}},{bits:7399,formatInfo:{errorCorrectionLevel:3,dataMask:2}},{bits:6608,formatInfo:{errorCorrectionLevel:3,dataMask:3}},{bits:1890,formatInfo:{errorCorrectionLevel:3,dataMask:4}},{bits:597,formatInfo:{errorCorrectionLevel:3,dataMask:5}},{bits:3340,formatInfo:{errorCorrectionLevel:3,dataMask:6}},{bits:2107,formatInfo:{errorCorrectionLevel:3,dataMask:7}},{bits:13663,formatInfo:{errorCorrectionLevel:2,dataMask:0}},{bits:12392,formatInfo:{errorCorrectionLevel:2,dataMask:1}},{bits:16177,formatInfo:{errorCorrectionLevel:2,dataMask:2}},{bits:14854,formatInfo:{errorCorrectionLevel:2,dataMask:3}},{bits:9396,formatInfo:{errorCorrectionLevel:2,dataMask:4}},{bits:8579,formatInfo:{errorCorrectionLevel:2,dataMask:5}},{bits:11994,formatInfo:{errorCorrectionLevel:2,dataMask:6}},{bits:11245,formatInfo:{errorCorrectionLevel:2,dataMask:7}}],i=[function(o){return(o.y+o.x)%2==0},function(o){return o.y%2==0},function(o){return o.x%3==0},function(o){return(o.y+o.x)%3==0},function(o){return(Math.floor(o.y/2)+Math.floor(o.x/3))%2==0},function(o){return o.x*o.y%2+o.x*o.y%3==0},function(o){return(o.y*o.x%2+o.y*o.x%3)%2==0},function(o){return((o.y+o.x)%2+o.y*o.x%3)%2==0}];function B(o,e,r){for(var c=i[r.dataMask],s=o.height,a=function(o){var e=17+4*o.versionNumber,r=t.BitMatrix.createEmpty(e,e);r.setRegion(0,0,9,9,!0),r.setRegion(e-8,0,8,9,!0),r.setRegion(0,e-8,9,8,!0);for(var c=0,s=o.alignmentPatternCenters;c<s.length;c++)for(var a=s[c],n=0,d=o.alignmentPatternCenters;n<d.length;n++){var l=d[n];6===a&&6===l||6===a&&l===e-7||a===e-7&&6===l||r.setRegion(a-2,l-2,5,5,!0)}return r.setRegion(6,9,1,e-17,!0),r.setRegion(9,6,e-17,1,!0),o.versionNumber>6&&(r.setRegion(e-11,0,3,6,!0),r.setRegion(0,e-11,6,3,!0)),r}(e),n=[],l=0,B=0,k=!0,u=s-1;u>0;u-=2){6===u&&u--;for(var C=0;C<s;C++)for(var m=k?s-1-C:C,f=0;f<2;f++){var w=u-f;if(!a.get(w,m)){B++;var P=o.get(w,m);c({y:m,x:w})&&(P=!P),l=d(P,l),8===B&&(n.push(l),B=0,l=0)}}k=!k}return n}function k(o){var e=function(o){var e=o.height,r=Math.floor((e-17)/4);if(r<=6)return a.VERSIONS[r-1];for(var t=0,c=5;c>=0;c--)for(var s=e-9;s>=e-11;s--)t=d(o.get(s,c),t);var l=0;for(s=5;s>=0;s--)for(c=e-9;c>=e-11;c--)l=d(o.get(s,c),l);for(var i,B=1/0,k=0,u=a.VERSIONS;k<u.length;k++){var C=u[k];if(C.infoBits===t||C.infoBits===l)return C;var m=n(t,C.infoBits);m<B&&(i=C,B=m),(m=n(l,C.infoBits))<B&&(i=C,B=m)}return B<=3?i:void 0}(o);if(!e)return null;var r=function(o){for(var e=0,r=0;r<=8;r++)6!==r&&(e=d(o.get(r,8),e));for(var t=7;t>=0;t--)6!==t&&(e=d(o.get(8,t),e));var c=o.height,s=0;for(t=c-1;t>=c-7;t--)s=d(o.get(8,t),s);for(r=c-8;r<c;r++)s=d(o.get(r,8),s);for(var a=1/0,i=null,B=0,k=l;B<k.length;B++){var u=k[B],C=u.bits,m=u.formatInfo;if(C===e||C===s)return m;var f=n(e,C);f<a&&(i=m,a=f),e!==s&&(f=n(s,C))<a&&(i=m,a=f)}return a<=3?i:null}(o);if(!r)return null;var t=function(o,e,r){var t=e.errorCorrectionLevels[r],c=[],s=0;if(t.ecBlocks.forEach((function(o){for(var e=0;e<o.numBlocks;e++)c.push({numDataCodewords:o.dataCodewordsPerBlock,codewords:[]}),s+=o.dataCodewordsPerBlock+t.ecCodewordsPerBlock})),o.length<s)return null;o=o.slice(0,s);for(var a=t.ecBlocks[0].dataCodewordsPerBlock,n=0;n<a;n++)for(var d=0,l=c;d<l.length;d++)l[d].codewords.push(o.shift());if(t.ecBlocks.length>1){var i=t.ecBlocks[0].numBlocks,B=t.ecBlocks[1].numBlocks;for(n=0;n<B;n++)c[i+n].codewords.push(o.shift())}for(;o.length>0;)for(var k=0,u=c;k<u.length;k++)u[k].codewords.push(o.shift());return c}(B(o,e,r),e,r.errorCorrectionLevel);if(!t)return null;for(var i=t.reduce((function(o,e){return o+e.numDataCodewords}),0),k=new Uint8ClampedArray(i),u=0,C=0,m=t;C<m.length;C++){var f=m[C],w=s.decode(f.codewords,f.codewords.length-f.numDataCodewords);if(!w)return null;for(var P=0;P<f.numDataCodewords;P++)k[u++]=w[P]}try{return c.decode(k,e.versionNumber)}catch(o){return null}}e.decode=function(o){if(null==o)return null;var e=k(o);if(e)return e;for(var r=0;r<o.width;r++)for(var t=r+1;t<o.height;t++)o.get(r,t)!==o.get(t,r)&&(o.set(r,t,!o.get(r,t)),o.set(t,r,!o.get(t,r)));return k(o)}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t,c,s=r(7),a=r(8);function n(o,e){for(var r=[],t="",c=[10,12,14][e],s=o.readBits(c);s>=3;){if((l=o.readBits(10))>=1e3)throw new Error("Invalid numeric value above 999");var a=Math.floor(l/100),n=Math.floor(l/10)%10,d=l%10;r.push(48+a,48+n,48+d),t+=a.toString()+n.toString()+d.toString(),s-=3}if(2===s){if((l=o.readBits(7))>=100)throw new Error("Invalid numeric value above 99");a=Math.floor(l/10),n=l%10;r.push(48+a,48+n),t+=a.toString()+n.toString()}else if(1===s){var l;if((l=o.readBits(4))>=10)throw new Error("Invalid numeric value above 9");r.push(48+l),t+=l.toString()}return{bytes:r,text:t}}!function(o){o.Numeric="numeric",o.Alphanumeric="alphanumeric",o.Byte="byte",o.Kanji="kanji",o.ECI="eci"}(t=e.Mode||(e.Mode={})),function(o){o[o.Terminator=0]="Terminator",o[o.Numeric=1]="Numeric",o[o.Alphanumeric=2]="Alphanumeric",o[o.Byte=4]="Byte",o[o.Kanji=8]="Kanji",o[o.ECI=7]="ECI"}(c||(c={}));var d=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function l(o,e){for(var r=[],t="",c=[9,11,13][e],s=o.readBits(c);s>=2;){var a=o.readBits(11),n=Math.floor(a/45),l=a%45;r.push(d[n].charCodeAt(0),d[l].charCodeAt(0)),t+=d[n]+d[l],s-=2}if(1===s){n=o.readBits(6);r.push(d[n].charCodeAt(0)),t+=d[n]}return{bytes:r,text:t}}function i(o,e){for(var r=[],t="",c=[8,16,16][e],s=o.readBits(c),a=0;a<s;a++){var n=o.readBits(8);r.push(n)}try{t+=decodeURIComponent(r.map((function(o){return"%"+("0"+o.toString(16)).substr(-2)})).join(""))}catch(o){}return{bytes:r,text:t}}function B(o,e){for(var r=[],t="",c=[8,10,12][e],s=o.readBits(c),n=0;n<s;n++){var d=o.readBits(13),l=Math.floor(d/192)<<8|d%192;l+=l<7936?33088:49472,r.push(l>>8,255&l),t+=String.fromCharCode(a.shiftJISTable[l])}return{bytes:r,text:t}}e.decode=function(o,e){for(var r,a,d,k,u=new s.BitStream(o),C=e<=9?0:e<=26?1:2,m={text:"",bytes:[],chunks:[],version:e};u.available()>=4;){var f=u.readBits(4);if(f===c.Terminator)return m;if(f===c.ECI)0===u.readBits(1)?m.chunks.push({type:t.ECI,assignmentNumber:u.readBits(7)}):0===u.readBits(1)?m.chunks.push({type:t.ECI,assignmentNumber:u.readBits(14)}):0===u.readBits(1)?m.chunks.push({type:t.ECI,assignmentNumber:u.readBits(21)}):m.chunks.push({type:t.ECI,assignmentNumber:-1});else if(f===c.Numeric){var w=n(u,C);m.text+=w.text,(r=m.bytes).push.apply(r,w.bytes),m.chunks.push({type:t.Numeric,text:w.text})}else if(f===c.Alphanumeric){var P=l(u,C);m.text+=P.text,(a=m.bytes).push.apply(a,P.bytes),m.chunks.push({type:t.Alphanumeric,text:P.text})}else if(f===c.Byte){var v=i(u,C);m.text+=v.text,(d=m.bytes).push.apply(d,v.bytes),m.chunks.push({type:t.Byte,bytes:v.bytes,text:v.text})}else if(f===c.Kanji){var h=B(u,C);m.text+=h.text,(k=m.bytes).push.apply(k,h.bytes),m.chunks.push({type:t.Kanji,bytes:h.bytes,text:h.text})}}if(0===u.available()||0===u.readBits(u.available()))return m}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=function(){function o(o){this.byteOffset=0,this.bitOffset=0,this.bytes=o}return o.prototype.readBits=function(o){if(o<1||o>32||o>this.available())throw new Error("Cannot read "+o.toString()+" bits");var e=0;if(this.bitOffset>0){var r=8-this.bitOffset,t=o<r?o:r,c=255>>8-t<<(s=r-t);e=(this.bytes[this.byteOffset]&c)>>s,o-=t,this.bitOffset+=t,8===this.bitOffset&&(this.bitOffset=0,this.byteOffset++)}if(o>0){for(;o>=8;)e=e<<8|255&this.bytes[this.byteOffset],this.byteOffset++,o-=8;if(o>0){var s;c=255>>(s=8-o)<<s;e=e<<o|(this.bytes[this.byteOffset]&c)>>s,this.bitOffset+=o}}return e},o.prototype.available=function(){return 8*(this.bytes.length-this.byteOffset)-this.bitOffset},o}();e.BitStream=t},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.shiftJISTable={32:32,33:33,34:34,35:35,36:36,37:37,38:38,39:39,40:40,41:41,42:42,43:43,44:44,45:45,46:46,47:47,48:48,49:49,50:50,51:51,52:52,53:53,54:54,55:55,56:56,57:57,58:58,59:59,60:60,61:61,62:62,63:63,64:64,65:65,66:66,67:67,68:68,69:69,70:70,71:71,72:72,73:73,74:74,75:75,76:76,77:77,78:78,79:79,80:80,81:81,82:82,83:83,84:84,85:85,86:86,87:87,88:88,89:89,90:90,91:91,92:165,93:93,94:94,95:95,96:96,97:97,98:98,99:99,100:100,101:101,102:102,103:103,104:104,105:105,106:106,107:107,108:108,109:109,110:110,111:111,112:112,113:113,114:114,115:115,116:116,117:117,118:118,119:119,120:120,121:121,122:122,123:123,124:124,125:125,126:8254,33088:12288,33089:12289,33090:12290,33091:65292,33092:65294,33093:12539,33094:65306,33095:65307,33096:65311,33097:65281,33098:12443,33099:12444,33100:180,33101:65344,33102:168,33103:65342,33104:65507,33105:65343,33106:12541,33107:12542,33108:12445,33109:12446,33110:12291,33111:20189,33112:12293,33113:12294,33114:12295,33115:12540,33116:8213,33117:8208,33118:65295,33119:92,33120:12316,33121:8214,33122:65372,33123:8230,33124:8229,33125:8216,33126:8217,33127:8220,33128:8221,33129:65288,33130:65289,33131:12308,33132:12309,33133:65339,33134:65341,33135:65371,33136:65373,33137:12296,33138:12297,33139:12298,33140:12299,33141:12300,33142:12301,33143:12302,33144:12303,33145:12304,33146:12305,33147:65291,33148:8722,33149:177,33150:215,33152:247,33153:65309,33154:8800,33155:65308,33156:65310,33157:8806,33158:8807,33159:8734,33160:8756,33161:9794,33162:9792,33163:176,33164:8242,33165:8243,33166:8451,33167:65509,33168:65284,33169:162,33170:163,33171:65285,33172:65283,33173:65286,33174:65290,33175:65312,33176:167,33177:9734,33178:9733,33179:9675,33180:9679,33181:9678,33182:9671,33183:9670,33184:9633,33185:9632,33186:9651,33187:9650,33188:9661,33189:9660,33190:8251,33191:12306,33192:8594,33193:8592,33194:8593,33195:8595,33196:12307,33208:8712,33209:8715,33210:8838,33211:8839,33212:8834,33213:8835,33214:8746,33215:8745,33224:8743,33225:8744,33226:172,33227:8658,33228:8660,33229:8704,33230:8707,33242:8736,33243:8869,33244:8978,33245:8706,33246:8711,33247:8801,33248:8786,33249:8810,33250:8811,33251:8730,33252:8765,33253:8733,33254:8757,33255:8747,33256:8748,33264:8491,33265:8240,33266:9839,33267:9837,33268:9834,33269:8224,33270:8225,33271:182,33276:9711,33359:65296,33360:65297,33361:65298,33362:65299,33363:65300,33364:65301,33365:65302,33366:65303,33367:65304,33368:65305,33376:65313,33377:65314,33378:65315,33379:65316,33380:65317,33381:65318,33382:65319,33383:65320,33384:65321,33385:65322,33386:65323,33387:65324,33388:65325,33389:65326,33390:65327,33391:65328,33392:65329,33393:65330,33394:65331,33395:65332,33396:65333,33397:65334,33398:65335,33399:65336,33400:65337,33401:65338,33409:65345,33410:65346,33411:65347,33412:65348,33413:65349,33414:65350,33415:65351,33416:65352,33417:65353,33418:65354,33419:65355,33420:65356,33421:65357,33422:65358,33423:65359,33424:65360,33425:65361,33426:65362,33427:65363,33428:65364,33429:65365,33430:65366,33431:65367,33432:65368,33433:65369,33434:65370,33439:12353,33440:12354,33441:12355,33442:12356,33443:12357,33444:12358,33445:12359,33446:12360,33447:12361,33448:12362,33449:12363,33450:12364,33451:12365,33452:12366,33453:12367,33454:12368,33455:12369,33456:12370,33457:12371,33458:12372,33459:12373,33460:12374,33461:12375,33462:12376,33463:12377,33464:12378,33465:12379,33466:12380,33467:12381,33468:12382,33469:12383,33470:12384,33471:12385,33472:12386,33473:12387,33474:12388,33475:12389,33476:12390,33477:12391,33478:12392,33479:12393,33480:12394,33481:12395,33482:12396,33483:12397,33484:12398,33485:12399,33486:12400,33487:12401,33488:12402,33489:12403,33490:12404,33491:12405,33492:12406,33493:12407,33494:12408,33495:12409,33496:12410,33497:12411,33498:12412,33499:12413,33500:12414,33501:12415,33502:12416,33503:12417,33504:12418,33505:12419,33506:12420,33507:12421,33508:12422,33509:12423,33510:12424,33511:12425,33512:12426,33513:12427,33514:12428,33515:12429,33516:12430,33517:12431,33518:12432,33519:12433,33520:12434,33521:12435,33600:12449,33601:12450,33602:12451,33603:12452,33604:12453,33605:12454,33606:12455,33607:12456,33608:12457,33609:12458,33610:12459,33611:12460,33612:12461,33613:12462,33614:12463,33615:12464,33616:12465,33617:12466,33618:12467,33619:12468,33620:12469,33621:12470,33622:12471,33623:12472,33624:12473,33625:12474,33626:12475,33627:12476,33628:12477,33629:12478,33630:12479,33631:12480,33632:12481,33633:12482,33634:12483,33635:12484,33636:12485,33637:12486,33638:12487,33639:12488,33640:12489,33641:12490,33642:12491,33643:12492,33644:12493,33645:12494,33646:12495,33647:12496,33648:12497,33649:12498,33650:12499,33651:12500,33652:12501,33653:12502,33654:12503,33655:12504,33656:12505,33657:12506,33658:12507,33659:12508,33660:12509,33661:12510,33662:12511,33664:12512,33665:12513,33666:12514,33667:12515,33668:12516,33669:12517,33670:12518,33671:12519,33672:12520,33673:12521,33674:12522,33675:12523,33676:12524,33677:12525,33678:12526,33679:12527,33680:12528,33681:12529,33682:12530,33683:12531,33684:12532,33685:12533,33686:12534,33695:913,33696:914,33697:915,33698:916,33699:917,33700:918,33701:919,33702:920,33703:921,33704:922,33705:923,33706:924,33707:925,33708:926,33709:927,33710:928,33711:929,33712:931,33713:932,33714:933,33715:934,33716:935,33717:936,33718:937,33727:945,33728:946,33729:947,33730:948,33731:949,33732:950,33733:951,33734:952,33735:953,33736:954,33737:955,33738:956,33739:957,33740:958,33741:959,33742:960,33743:961,33744:963,33745:964,33746:965,33747:966,33748:967,33749:968,33750:969,33856:1040,33857:1041,33858:1042,33859:1043,33860:1044,33861:1045,33862:1025,33863:1046,33864:1047,33865:1048,33866:1049,33867:1050,33868:1051,33869:1052,33870:1053,33871:1054,33872:1055,33873:1056,33874:1057,33875:1058,33876:1059,33877:1060,33878:1061,33879:1062,33880:1063,33881:1064,33882:1065,33883:1066,33884:1067,33885:1068,33886:1069,33887:1070,33888:1071,33904:1072,33905:1073,33906:1074,33907:1075,33908:1076,33909:1077,33910:1105,33911:1078,33912:1079,33913:1080,33914:1081,33915:1082,33916:1083,33917:1084,33918:1085,33920:1086,33921:1087,33922:1088,33923:1089,33924:1090,33925:1091,33926:1092,33927:1093,33928:1094,33929:1095,33930:1096,33931:1097,33932:1098,33933:1099,33934:1100,33935:1101,33936:1102,33937:1103,33951:9472,33952:9474,33953:9484,33954:9488,33955:9496,33956:9492,33957:9500,33958:9516,33959:9508,33960:9524,33961:9532,33962:9473,33963:9475,33964:9487,33965:9491,33966:9499,33967:9495,33968:9507,33969:9523,33970:9515,33971:9531,33972:9547,33973:9504,33974:9519,33975:9512,33976:9527,33977:9535,33978:9501,33979:9520,33980:9509,33981:9528,33982:9538,34975:20124,34976:21782,34977:23043,34978:38463,34979:21696,34980:24859,34981:25384,34982:23030,34983:36898,34984:33909,34985:33564,34986:31312,34987:24746,34988:25569,34989:28197,34990:26093,34991:33894,34992:33446,34993:39925,34994:26771,34995:22311,34996:26017,34997:25201,34998:23451,34999:22992,35e3:34427,35001:39156,35002:32098,35003:32190,35004:39822,35005:25110,35006:31903,35007:34999,35008:23433,35009:24245,35010:25353,35011:26263,35012:26696,35013:38343,35014:38797,35015:26447,35016:20197,35017:20234,35018:20301,35019:20381,35020:20553,35021:22258,35022:22839,35023:22996,35024:23041,35025:23561,35026:24799,35027:24847,35028:24944,35029:26131,35030:26885,35031:28858,35032:30031,35033:30064,35034:31227,35035:32173,35036:32239,35037:32963,35038:33806,35039:34915,35040:35586,35041:36949,35042:36986,35043:21307,35044:20117,35045:20133,35046:22495,35047:32946,35048:37057,35049:30959,35050:19968,35051:22769,35052:28322,35053:36920,35054:31282,35055:33576,35056:33419,35057:39983,35058:20801,35059:21360,35060:21693,35061:21729,35062:22240,35063:23035,35064:24341,35065:39154,35066:28139,35067:32996,35068:34093,35136:38498,35137:38512,35138:38560,35139:38907,35140:21515,35141:21491,35142:23431,35143:28879,35144:32701,35145:36802,35146:38632,35147:21359,35148:40284,35149:31418,35150:19985,35151:30867,35152:33276,35153:28198,35154:22040,35155:21764,35156:27421,35157:34074,35158:39995,35159:23013,35160:21417,35161:28006,35162:29916,35163:38287,35164:22082,35165:20113,35166:36939,35167:38642,35168:33615,35169:39180,35170:21473,35171:21942,35172:23344,35173:24433,35174:26144,35175:26355,35176:26628,35177:27704,35178:27891,35179:27945,35180:29787,35181:30408,35182:31310,35183:38964,35184:33521,35185:34907,35186:35424,35187:37613,35188:28082,35189:30123,35190:30410,35191:39365,35192:24742,35193:35585,35194:36234,35195:38322,35196:27022,35197:21421,35198:20870,35200:22290,35201:22576,35202:22852,35203:23476,35204:24310,35205:24616,35206:25513,35207:25588,35208:27839,35209:28436,35210:28814,35211:28948,35212:29017,35213:29141,35214:29503,35215:32257,35216:33398,35217:33489,35218:34199,35219:36960,35220:37467,35221:40219,35222:22633,35223:26044,35224:27738,35225:29989,35226:20985,35227:22830,35228:22885,35229:24448,35230:24540,35231:25276,35232:26106,35233:27178,35234:27431,35235:27572,35236:29579,35237:32705,35238:35158,35239:40236,35240:40206,35241:40644,35242:23713,35243:27798,35244:33659,35245:20740,35246:23627,35247:25014,35248:33222,35249:26742,35250:29281,35251:20057,35252:20474,35253:21368,35254:24681,35255:28201,35256:31311,35257:38899,35258:19979,35259:21270,35260:20206,35261:20309,35262:20285,35263:20385,35264:20339,35265:21152,35266:21487,35267:22025,35268:22799,35269:23233,35270:23478,35271:23521,35272:31185,35273:26247,35274:26524,35275:26550,35276:27468,35277:27827,35278:28779,35279:29634,35280:31117,35281:31166,35282:31292,35283:31623,35284:33457,35285:33499,35286:33540,35287:33655,35288:33775,35289:33747,35290:34662,35291:35506,35292:22057,35293:36008,35294:36838,35295:36942,35296:38686,35297:34442,35298:20420,35299:23784,35300:25105,35301:29273,35302:30011,35303:33253,35304:33469,35305:34558,35306:36032,35307:38597,35308:39187,35309:39381,35310:20171,35311:20250,35312:35299,35313:22238,35314:22602,35315:22730,35316:24315,35317:24555,35318:24618,35319:24724,35320:24674,35321:25040,35322:25106,35323:25296,35324:25913,35392:39745,35393:26214,35394:26800,35395:28023,35396:28784,35397:30028,35398:30342,35399:32117,35400:33445,35401:34809,35402:38283,35403:38542,35404:35997,35405:20977,35406:21182,35407:22806,35408:21683,35409:23475,35410:23830,35411:24936,35412:27010,35413:28079,35414:30861,35415:33995,35416:34903,35417:35442,35418:37799,35419:39608,35420:28012,35421:39336,35422:34521,35423:22435,35424:26623,35425:34510,35426:37390,35427:21123,35428:22151,35429:21508,35430:24275,35431:25313,35432:25785,35433:26684,35434:26680,35435:27579,35436:29554,35437:30906,35438:31339,35439:35226,35440:35282,35441:36203,35442:36611,35443:37101,35444:38307,35445:38548,35446:38761,35447:23398,35448:23731,35449:27005,35450:38989,35451:38990,35452:25499,35453:31520,35454:27179,35456:27263,35457:26806,35458:39949,35459:28511,35460:21106,35461:21917,35462:24688,35463:25324,35464:27963,35465:28167,35466:28369,35467:33883,35468:35088,35469:36676,35470:19988,35471:39993,35472:21494,35473:26907,35474:27194,35475:38788,35476:26666,35477:20828,35478:31427,35479:33970,35480:37340,35481:37772,35482:22107,35483:40232,35484:26658,35485:33541,35486:33841,35487:31909,35488:21e3,35489:33477,35490:29926,35491:20094,35492:20355,35493:20896,35494:23506,35495:21002,35496:21208,35497:21223,35498:24059,35499:21914,35500:22570,35501:23014,35502:23436,35503:23448,35504:23515,35505:24178,35506:24185,35507:24739,35508:24863,35509:24931,35510:25022,35511:25563,35512:25954,35513:26577,35514:26707,35515:26874,35516:27454,35517:27475,35518:27735,35519:28450,35520:28567,35521:28485,35522:29872,35523:29976,35524:30435,35525:30475,35526:31487,35527:31649,35528:31777,35529:32233,35530:32566,35531:32752,35532:32925,35533:33382,35534:33694,35535:35251,35536:35532,35537:36011,35538:36996,35539:37969,35540:38291,35541:38289,35542:38306,35543:38501,35544:38867,35545:39208,35546:33304,35547:20024,35548:21547,35549:23736,35550:24012,35551:29609,35552:30284,35553:30524,35554:23721,35555:32747,35556:36107,35557:38593,35558:38929,35559:38996,35560:39e3,35561:20225,35562:20238,35563:21361,35564:21916,35565:22120,35566:22522,35567:22855,35568:23305,35569:23492,35570:23696,35571:24076,35572:24190,35573:24524,35574:25582,35575:26426,35576:26071,35577:26082,35578:26399,35579:26827,35580:26820,35648:27231,35649:24112,35650:27589,35651:27671,35652:27773,35653:30079,35654:31048,35655:23395,35656:31232,35657:32e3,35658:24509,35659:35215,35660:35352,35661:36020,35662:36215,35663:36556,35664:36637,35665:39138,35666:39438,35667:39740,35668:20096,35669:20605,35670:20736,35671:22931,35672:23452,35673:25135,35674:25216,35675:25836,35676:27450,35677:29344,35678:30097,35679:31047,35680:32681,35681:34811,35682:35516,35683:35696,35684:25516,35685:33738,35686:38816,35687:21513,35688:21507,35689:21931,35690:26708,35691:27224,35692:35440,35693:30759,35694:26485,35695:40653,35696:21364,35697:23458,35698:33050,35699:34384,35700:36870,35701:19992,35702:20037,35703:20167,35704:20241,35705:21450,35706:21560,35707:23470,35708:24339,35709:24613,35710:25937,35712:26429,35713:27714,35714:27762,35715:27875,35716:28792,35717:29699,35718:31350,35719:31406,35720:31496,35721:32026,35722:31998,35723:32102,35724:26087,35725:29275,35726:21435,35727:23621,35728:24040,35729:25298,35730:25312,35731:25369,35732:28192,35733:34394,35734:35377,35735:36317,35736:37624,35737:28417,35738:31142,35739:39770,35740:20136,35741:20139,35742:20140,35743:20379,35744:20384,35745:20689,35746:20807,35747:31478,35748:20849,35749:20982,35750:21332,35751:21281,35752:21375,35753:21483,35754:21932,35755:22659,35756:23777,35757:24375,35758:24394,35759:24623,35760:24656,35761:24685,35762:25375,35763:25945,35764:27211,35765:27841,35766:29378,35767:29421,35768:30703,35769:33016,35770:33029,35771:33288,35772:34126,35773:37111,35774:37857,35775:38911,35776:39255,35777:39514,35778:20208,35779:20957,35780:23597,35781:26241,35782:26989,35783:23616,35784:26354,35785:26997,35786:29577,35787:26704,35788:31873,35789:20677,35790:21220,35791:22343,35792:24062,35793:37670,35794:26020,35795:27427,35796:27453,35797:29748,35798:31105,35799:31165,35800:31563,35801:32202,35802:33465,35803:33740,35804:34943,35805:35167,35806:35641,35807:36817,35808:37329,35809:21535,35810:37504,35811:20061,35812:20534,35813:21477,35814:21306,35815:29399,35816:29590,35817:30697,35818:33510,35819:36527,35820:39366,35821:39368,35822:39378,35823:20855,35824:24858,35825:34398,35826:21936,35827:31354,35828:20598,35829:23507,35830:36935,35831:38533,35832:20018,35833:27355,35834:37351,35835:23633,35836:23624,35904:25496,35905:31391,35906:27795,35907:38772,35908:36705,35909:31402,35910:29066,35911:38536,35912:31874,35913:26647,35914:32368,35915:26705,35916:37740,35917:21234,35918:21531,35919:34219,35920:35347,35921:32676,35922:36557,35923:37089,35924:21350,35925:34952,35926:31041,35927:20418,35928:20670,35929:21009,35930:20804,35931:21843,35932:22317,35933:29674,35934:22411,35935:22865,35936:24418,35937:24452,35938:24693,35939:24950,35940:24935,35941:25001,35942:25522,35943:25658,35944:25964,35945:26223,35946:26690,35947:28179,35948:30054,35949:31293,35950:31995,35951:32076,35952:32153,35953:32331,35954:32619,35955:33550,35956:33610,35957:34509,35958:35336,35959:35427,35960:35686,35961:36605,35962:38938,35963:40335,35964:33464,35965:36814,35966:39912,35968:21127,35969:25119,35970:25731,35971:28608,35972:38553,35973:26689,35974:20625,35975:27424,35976:27770,35977:28500,35978:31348,35979:32080,35980:34880,35981:35363,35982:26376,35983:20214,35984:20537,35985:20518,35986:20581,35987:20860,35988:21048,35989:21091,35990:21927,35991:22287,35992:22533,35993:23244,35994:24314,35995:25010,35996:25080,35997:25331,35998:25458,35999:26908,36e3:27177,36001:29309,36002:29356,36003:29486,36004:30740,36005:30831,36006:32121,36007:30476,36008:32937,36009:35211,36010:35609,36011:36066,36012:36562,36013:36963,36014:37749,36015:38522,36016:38997,36017:39443,36018:40568,36019:20803,36020:21407,36021:21427,36022:24187,36023:24358,36024:28187,36025:28304,36026:29572,36027:29694,36028:32067,36029:33335,36030:35328,36031:35578,36032:38480,36033:20046,36034:20491,36035:21476,36036:21628,36037:22266,36038:22993,36039:23396,36040:24049,36041:24235,36042:24359,36043:25144,36044:25925,36045:26543,36046:28246,36047:29392,36048:31946,36049:34996,36050:32929,36051:32993,36052:33776,36053:34382,36054:35463,36055:36328,36056:37431,36057:38599,36058:39015,36059:40723,36060:20116,36061:20114,36062:20237,36063:21320,36064:21577,36065:21566,36066:23087,36067:24460,36068:24481,36069:24735,36070:26791,36071:27278,36072:29786,36073:30849,36074:35486,36075:35492,36076:35703,36077:37264,36078:20062,36079:39881,36080:20132,36081:20348,36082:20399,36083:20505,36084:20502,36085:20809,36086:20844,36087:21151,36088:21177,36089:21246,36090:21402,36091:21475,36092:21521,36160:21518,36161:21897,36162:22353,36163:22434,36164:22909,36165:23380,36166:23389,36167:23439,36168:24037,36169:24039,36170:24055,36171:24184,36172:24195,36173:24218,36174:24247,36175:24344,36176:24658,36177:24908,36178:25239,36179:25304,36180:25511,36181:25915,36182:26114,36183:26179,36184:26356,36185:26477,36186:26657,36187:26775,36188:27083,36189:27743,36190:27946,36191:28009,36192:28207,36193:28317,36194:30002,36195:30343,36196:30828,36197:31295,36198:31968,36199:32005,36200:32024,36201:32094,36202:32177,36203:32789,36204:32771,36205:32943,36206:32945,36207:33108,36208:33167,36209:33322,36210:33618,36211:34892,36212:34913,36213:35611,36214:36002,36215:36092,36216:37066,36217:37237,36218:37489,36219:30783,36220:37628,36221:38308,36222:38477,36224:38917,36225:39321,36226:39640,36227:40251,36228:21083,36229:21163,36230:21495,36231:21512,36232:22741,36233:25335,36234:28640,36235:35946,36236:36703,36237:40633,36238:20811,36239:21051,36240:21578,36241:22269,36242:31296,36243:37239,36244:40288,36245:40658,36246:29508,36247:28425,36248:33136,36249:29969,36250:24573,36251:24794,36252:39592,36253:29403,36254:36796,36255:27492,36256:38915,36257:20170,36258:22256,36259:22372,36260:22718,36261:23130,36262:24680,36263:25031,36264:26127,36265:26118,36266:26681,36267:26801,36268:28151,36269:30165,36270:32058,36271:33390,36272:39746,36273:20123,36274:20304,36275:21449,36276:21766,36277:23919,36278:24038,36279:24046,36280:26619,36281:27801,36282:29811,36283:30722,36284:35408,36285:37782,36286:35039,36287:22352,36288:24231,36289:25387,36290:20661,36291:20652,36292:20877,36293:26368,36294:21705,36295:22622,36296:22971,36297:23472,36298:24425,36299:25165,36300:25505,36301:26685,36302:27507,36303:28168,36304:28797,36305:37319,36306:29312,36307:30741,36308:30758,36309:31085,36310:25998,36311:32048,36312:33756,36313:35009,36314:36617,36315:38555,36316:21092,36317:22312,36318:26448,36319:32618,36320:36001,36321:20916,36322:22338,36323:38442,36324:22586,36325:27018,36326:32948,36327:21682,36328:23822,36329:22524,36330:30869,36331:40442,36332:20316,36333:21066,36334:21643,36335:25662,36336:26152,36337:26388,36338:26613,36339:31364,36340:31574,36341:32034,36342:37679,36343:26716,36344:39853,36345:31545,36346:21273,36347:20874,36348:21047,36416:23519,36417:25334,36418:25774,36419:25830,36420:26413,36421:27578,36422:34217,36423:38609,36424:30352,36425:39894,36426:25420,36427:37638,36428:39851,36429:30399,36430:26194,36431:19977,36432:20632,36433:21442,36434:23665,36435:24808,36436:25746,36437:25955,36438:26719,36439:29158,36440:29642,36441:29987,36442:31639,36443:32386,36444:34453,36445:35715,36446:36059,36447:37240,36448:39184,36449:26028,36450:26283,36451:27531,36452:20181,36453:20180,36454:20282,36455:20351,36456:21050,36457:21496,36458:21490,36459:21987,36460:22235,36461:22763,36462:22987,36463:22985,36464:23039,36465:23376,36466:23629,36467:24066,36468:24107,36469:24535,36470:24605,36471:25351,36472:25903,36473:23388,36474:26031,36475:26045,36476:26088,36477:26525,36478:27490,36480:27515,36481:27663,36482:29509,36483:31049,36484:31169,36485:31992,36486:32025,36487:32043,36488:32930,36489:33026,36490:33267,36491:35222,36492:35422,36493:35433,36494:35430,36495:35468,36496:35566,36497:36039,36498:36060,36499:38604,36500:39164,36501:27503,36502:20107,36503:20284,36504:20365,36505:20816,36506:23383,36507:23546,36508:24904,36509:25345,36510:26178,36511:27425,36512:28363,36513:27835,36514:29246,36515:29885,36516:30164,36517:30913,36518:31034,36519:32780,36520:32819,36521:33258,36522:33940,36523:36766,36524:27728,36525:40575,36526:24335,36527:35672,36528:40235,36529:31482,36530:36600,36531:23437,36532:38635,36533:19971,36534:21489,36535:22519,36536:22833,36537:23241,36538:23460,36539:24713,36540:28287,36541:28422,36542:30142,36543:36074,36544:23455,36545:34048,36546:31712,36547:20594,36548:26612,36549:33437,36550:23649,36551:34122,36552:32286,36553:33294,36554:20889,36555:23556,36556:25448,36557:36198,36558:26012,36559:29038,36560:31038,36561:32023,36562:32773,36563:35613,36564:36554,36565:36974,36566:34503,36567:37034,36568:20511,36569:21242,36570:23610,36571:26451,36572:28796,36573:29237,36574:37196,36575:37320,36576:37675,36577:33509,36578:23490,36579:24369,36580:24825,36581:20027,36582:21462,36583:23432,36584:25163,36585:26417,36586:27530,36587:29417,36588:29664,36589:31278,36590:33131,36591:36259,36592:37202,36593:39318,36594:20754,36595:21463,36596:21610,36597:23551,36598:25480,36599:27193,36600:32172,36601:38656,36602:22234,36603:21454,36604:21608,36672:23447,36673:23601,36674:24030,36675:20462,36676:24833,36677:25342,36678:27954,36679:31168,36680:31179,36681:32066,36682:32333,36683:32722,36684:33261,36685:33311,36686:33936,36687:34886,36688:35186,36689:35728,36690:36468,36691:36655,36692:36913,36693:37195,36694:37228,36695:38598,36696:37276,36697:20160,36698:20303,36699:20805,36700:21313,36701:24467,36702:25102,36703:26580,36704:27713,36705:28171,36706:29539,36707:32294,36708:37325,36709:37507,36710:21460,36711:22809,36712:23487,36713:28113,36714:31069,36715:32302,36716:31899,36717:22654,36718:29087,36719:20986,36720:34899,36721:36848,36722:20426,36723:23803,36724:26149,36725:30636,36726:31459,36727:33308,36728:39423,36729:20934,36730:24490,36731:26092,36732:26991,36733:27529,36734:28147,36736:28310,36737:28516,36738:30462,36739:32020,36740:24033,36741:36981,36742:37255,36743:38918,36744:20966,36745:21021,36746:25152,36747:26257,36748:26329,36749:28186,36750:24246,36751:32210,36752:32626,36753:26360,36754:34223,36755:34295,36756:35576,36757:21161,36758:21465,36759:22899,36760:24207,36761:24464,36762:24661,36763:37604,36764:38500,36765:20663,36766:20767,36767:21213,36768:21280,36769:21319,36770:21484,36771:21736,36772:21830,36773:21809,36774:22039,36775:22888,36776:22974,36777:23100,36778:23477,36779:23558,36780:23567,36781:23569,36782:23578,36783:24196,36784:24202,36785:24288,36786:24432,36787:25215,36788:25220,36789:25307,36790:25484,36791:25463,36792:26119,36793:26124,36794:26157,36795:26230,36796:26494,36797:26786,36798:27167,36799:27189,36800:27836,36801:28040,36802:28169,36803:28248,36804:28988,36805:28966,36806:29031,36807:30151,36808:30465,36809:30813,36810:30977,36811:31077,36812:31216,36813:31456,36814:31505,36815:31911,36816:32057,36817:32918,36818:33750,36819:33931,36820:34121,36821:34909,36822:35059,36823:35359,36824:35388,36825:35412,36826:35443,36827:35937,36828:36062,36829:37284,36830:37478,36831:37758,36832:37912,36833:38556,36834:38808,36835:19978,36836:19976,36837:19998,36838:20055,36839:20887,36840:21104,36841:22478,36842:22580,36843:22732,36844:23330,36845:24120,36846:24773,36847:25854,36848:26465,36849:26454,36850:27972,36851:29366,36852:30067,36853:31331,36854:33976,36855:35698,36856:37304,36857:37664,36858:22065,36859:22516,36860:39166,36928:25325,36929:26893,36930:27542,36931:29165,36932:32340,36933:32887,36934:33394,36935:35302,36936:39135,36937:34645,36938:36785,36939:23611,36940:20280,36941:20449,36942:20405,36943:21767,36944:23072,36945:23517,36946:23529,36947:24515,36948:24910,36949:25391,36950:26032,36951:26187,36952:26862,36953:27035,36954:28024,36955:28145,36956:30003,36957:30137,36958:30495,36959:31070,36960:31206,36961:32051,36962:33251,36963:33455,36964:34218,36965:35242,36966:35386,36967:36523,36968:36763,36969:36914,36970:37341,36971:38663,36972:20154,36973:20161,36974:20995,36975:22645,36976:22764,36977:23563,36978:29978,36979:23613,36980:33102,36981:35338,36982:36805,36983:38499,36984:38765,36985:31525,36986:35535,36987:38920,36988:37218,36989:22259,36990:21416,36992:36887,36993:21561,36994:22402,36995:24101,36996:25512,36997:27700,36998:28810,36999:30561,37e3:31883,37001:32736,37002:34928,37003:36930,37004:37204,37005:37648,37006:37656,37007:38543,37008:29790,37009:39620,37010:23815,37011:23913,37012:25968,37013:26530,37014:36264,37015:38619,37016:25454,37017:26441,37018:26905,37019:33733,37020:38935,37021:38592,37022:35070,37023:28548,37024:25722,37025:23544,37026:19990,37027:28716,37028:30045,37029:26159,37030:20932,37031:21046,37032:21218,37033:22995,37034:24449,37035:24615,37036:25104,37037:25919,37038:25972,37039:26143,37040:26228,37041:26866,37042:26646,37043:27491,37044:28165,37045:29298,37046:29983,37047:30427,37048:31934,37049:32854,37050:22768,37051:35069,37052:35199,37053:35488,37054:35475,37055:35531,37056:36893,37057:37266,37058:38738,37059:38745,37060:25993,37061:31246,37062:33030,37063:38587,37064:24109,37065:24796,37066:25114,37067:26021,37068:26132,37069:26512,37070:30707,37071:31309,37072:31821,37073:32318,37074:33034,37075:36012,37076:36196,37077:36321,37078:36447,37079:30889,37080:20999,37081:25305,37082:25509,37083:25666,37084:25240,37085:35373,37086:31363,37087:31680,37088:35500,37089:38634,37090:32118,37091:33292,37092:34633,37093:20185,37094:20808,37095:21315,37096:21344,37097:23459,37098:23554,37099:23574,37100:24029,37101:25126,37102:25159,37103:25776,37104:26643,37105:26676,37106:27849,37107:27973,37108:27927,37109:26579,37110:28508,37111:29006,37112:29053,37113:26059,37114:31359,37115:31661,37116:32218,37184:32330,37185:32680,37186:33146,37187:33307,37188:33337,37189:34214,37190:35438,37191:36046,37192:36341,37193:36984,37194:36983,37195:37549,37196:37521,37197:38275,37198:39854,37199:21069,37200:21892,37201:28472,37202:28982,37203:20840,37204:31109,37205:32341,37206:33203,37207:31950,37208:22092,37209:22609,37210:23720,37211:25514,37212:26366,37213:26365,37214:26970,37215:29401,37216:30095,37217:30094,37218:30990,37219:31062,37220:31199,37221:31895,37222:32032,37223:32068,37224:34311,37225:35380,37226:38459,37227:36961,37228:40736,37229:20711,37230:21109,37231:21452,37232:21474,37233:20489,37234:21930,37235:22766,37236:22863,37237:29245,37238:23435,37239:23652,37240:21277,37241:24803,37242:24819,37243:25436,37244:25475,37245:25407,37246:25531,37248:25805,37249:26089,37250:26361,37251:24035,37252:27085,37253:27133,37254:28437,37255:29157,37256:20105,37257:30185,37258:30456,37259:31379,37260:31967,37261:32207,37262:32156,37263:32865,37264:33609,37265:33624,37266:33900,37267:33980,37268:34299,37269:35013,37270:36208,37271:36865,37272:36973,37273:37783,37274:38684,37275:39442,37276:20687,37277:22679,37278:24974,37279:33235,37280:34101,37281:36104,37282:36896,37283:20419,37284:20596,37285:21063,37286:21363,37287:24687,37288:25417,37289:26463,37290:28204,37291:36275,37292:36895,37293:20439,37294:23646,37295:36042,37296:26063,37297:32154,37298:21330,37299:34966,37300:20854,37301:25539,37302:23384,37303:23403,37304:23562,37305:25613,37306:26449,37307:36956,37308:20182,37309:22810,37310:22826,37311:27760,37312:35409,37313:21822,37314:22549,37315:22949,37316:24816,37317:25171,37318:26561,37319:33333,37320:26965,37321:38464,37322:39364,37323:39464,37324:20307,37325:22534,37326:23550,37327:32784,37328:23729,37329:24111,37330:24453,37331:24608,37332:24907,37333:25140,37334:26367,37335:27888,37336:28382,37337:32974,37338:33151,37339:33492,37340:34955,37341:36024,37342:36864,37343:36910,37344:38538,37345:40667,37346:39899,37347:20195,37348:21488,37349:22823,37350:31532,37351:37261,37352:38988,37353:40441,37354:28381,37355:28711,37356:21331,37357:21828,37358:23429,37359:25176,37360:25246,37361:25299,37362:27810,37363:28655,37364:29730,37365:35351,37366:37944,37367:28609,37368:35582,37369:33592,37370:20967,37371:34552,37372:21482,37440:21481,37441:20294,37442:36948,37443:36784,37444:22890,37445:33073,37446:24061,37447:31466,37448:36799,37449:26842,37450:35895,37451:29432,37452:40008,37453:27197,37454:35504,37455:20025,37456:21336,37457:22022,37458:22374,37459:25285,37460:25506,37461:26086,37462:27470,37463:28129,37464:28251,37465:28845,37466:30701,37467:31471,37468:31658,37469:32187,37470:32829,37471:32966,37472:34507,37473:35477,37474:37723,37475:22243,37476:22727,37477:24382,37478:26029,37479:26262,37480:27264,37481:27573,37482:30007,37483:35527,37484:20516,37485:30693,37486:22320,37487:24347,37488:24677,37489:26234,37490:27744,37491:30196,37492:31258,37493:32622,37494:33268,37495:34584,37496:36933,37497:39347,37498:31689,37499:30044,37500:31481,37501:31569,37502:33988,37504:36880,37505:31209,37506:31378,37507:33590,37508:23265,37509:30528,37510:20013,37511:20210,37512:23449,37513:24544,37514:25277,37515:26172,37516:26609,37517:27880,37518:34411,37519:34935,37520:35387,37521:37198,37522:37619,37523:39376,37524:27159,37525:28710,37526:29482,37527:33511,37528:33879,37529:36015,37530:19969,37531:20806,37532:20939,37533:21899,37534:23541,37535:24086,37536:24115,37537:24193,37538:24340,37539:24373,37540:24427,37541:24500,37542:25074,37543:25361,37544:26274,37545:26397,37546:28526,37547:29266,37548:30010,37549:30522,37550:32884,37551:33081,37552:33144,37553:34678,37554:35519,37555:35548,37556:36229,37557:36339,37558:37530,37559:38263,37560:38914,37561:40165,37562:21189,37563:25431,37564:30452,37565:26389,37566:27784,37567:29645,37568:36035,37569:37806,37570:38515,37571:27941,37572:22684,37573:26894,37574:27084,37575:36861,37576:37786,37577:30171,37578:36890,37579:22618,37580:26626,37581:25524,37582:27131,37583:20291,37584:28460,37585:26584,37586:36795,37587:34086,37588:32180,37589:37716,37590:26943,37591:28528,37592:22378,37593:22775,37594:23340,37595:32044,37596:29226,37597:21514,37598:37347,37599:40372,37600:20141,37601:20302,37602:20572,37603:20597,37604:21059,37605:35998,37606:21576,37607:22564,37608:23450,37609:24093,37610:24213,37611:24237,37612:24311,37613:24351,37614:24716,37615:25269,37616:25402,37617:25552,37618:26799,37619:27712,37620:30855,37621:31118,37622:31243,37623:32224,37624:33351,37625:35330,37626:35558,37627:36420,37628:36883,37696:37048,37697:37165,37698:37336,37699:40718,37700:27877,37701:25688,37702:25826,37703:25973,37704:28404,37705:30340,37706:31515,37707:36969,37708:37841,37709:28346,37710:21746,37711:24505,37712:25764,37713:36685,37714:36845,37715:37444,37716:20856,37717:22635,37718:22825,37719:23637,37720:24215,37721:28155,37722:32399,37723:29980,37724:36028,37725:36578,37726:39003,37727:28857,37728:20253,37729:27583,37730:28593,37731:3e4,37732:38651,37733:20814,37734:21520,37735:22581,37736:22615,37737:22956,37738:23648,37739:24466,37740:26007,37741:26460,37742:28193,37743:30331,37744:33759,37745:36077,37746:36884,37747:37117,37748:37709,37749:30757,37750:30778,37751:21162,37752:24230,37753:22303,37754:22900,37755:24594,37756:20498,37757:20826,37758:20908,37760:20941,37761:20992,37762:21776,37763:22612,37764:22616,37765:22871,37766:23445,37767:23798,37768:23947,37769:24764,37770:25237,37771:25645,37772:26481,37773:26691,37774:26812,37775:26847,37776:30423,37777:28120,37778:28271,37779:28059,37780:28783,37781:29128,37782:24403,37783:30168,37784:31095,37785:31561,37786:31572,37787:31570,37788:31958,37789:32113,37790:21040,37791:33891,37792:34153,37793:34276,37794:35342,37795:35588,37796:35910,37797:36367,37798:36867,37799:36879,37800:37913,37801:38518,37802:38957,37803:39472,37804:38360,37805:20685,37806:21205,37807:21516,37808:22530,37809:23566,37810:24999,37811:25758,37812:27934,37813:30643,37814:31461,37815:33012,37816:33796,37817:36947,37818:37509,37819:23776,37820:40199,37821:21311,37822:24471,37823:24499,37824:28060,37825:29305,37826:30563,37827:31167,37828:31716,37829:27602,37830:29420,37831:35501,37832:26627,37833:27233,37834:20984,37835:31361,37836:26932,37837:23626,37838:40182,37839:33515,37840:23493,37841:37193,37842:28702,37843:22136,37844:23663,37845:24775,37846:25958,37847:27788,37848:35930,37849:36929,37850:38931,37851:21585,37852:26311,37853:37389,37854:22856,37855:37027,37856:20869,37857:20045,37858:20970,37859:34201,37860:35598,37861:28760,37862:25466,37863:37707,37864:26978,37865:39348,37866:32260,37867:30071,37868:21335,37869:26976,37870:36575,37871:38627,37872:27741,37873:20108,37874:23612,37875:24336,37876:36841,37877:21250,37878:36049,37879:32905,37880:34425,37881:24319,37882:26085,37883:20083,37884:20837,37952:22914,37953:23615,37954:38894,37955:20219,37956:22922,37957:24525,37958:35469,37959:28641,37960:31152,37961:31074,37962:23527,37963:33905,37964:29483,37965:29105,37966:24180,37967:24565,37968:25467,37969:25754,37970:29123,37971:31896,37972:20035,37973:24316,37974:20043,37975:22492,37976:22178,37977:24745,37978:28611,37979:32013,37980:33021,37981:33075,37982:33215,37983:36786,37984:35223,37985:34468,37986:24052,37987:25226,37988:25773,37989:35207,37990:26487,37991:27874,37992:27966,37993:29750,37994:30772,37995:23110,37996:32629,37997:33453,37998:39340,37999:20467,38e3:24259,38001:25309,38002:25490,38003:25943,38004:26479,38005:30403,38006:29260,38007:32972,38008:32954,38009:36649,38010:37197,38011:20493,38012:22521,38013:23186,38014:26757,38016:26995,38017:29028,38018:29437,38019:36023,38020:22770,38021:36064,38022:38506,38023:36889,38024:34687,38025:31204,38026:30695,38027:33833,38028:20271,38029:21093,38030:21338,38031:25293,38032:26575,38033:27850,38034:30333,38035:31636,38036:31893,38037:33334,38038:34180,38039:36843,38040:26333,38041:28448,38042:29190,38043:32283,38044:33707,38045:39361,38046:40614,38047:20989,38048:31665,38049:30834,38050:31672,38051:32903,38052:31560,38053:27368,38054:24161,38055:32908,38056:30033,38057:30048,38058:20843,38059:37474,38060:28300,38061:30330,38062:37271,38063:39658,38064:20240,38065:32624,38066:25244,38067:31567,38068:38309,38069:40169,38070:22138,38071:22617,38072:34532,38073:38588,38074:20276,38075:21028,38076:21322,38077:21453,38078:21467,38079:24070,38080:25644,38081:26001,38082:26495,38083:27710,38084:27726,38085:29256,38086:29359,38087:29677,38088:30036,38089:32321,38090:33324,38091:34281,38092:36009,38093:31684,38094:37318,38095:29033,38096:38930,38097:39151,38098:25405,38099:26217,38100:30058,38101:30436,38102:30928,38103:34115,38104:34542,38105:21290,38106:21329,38107:21542,38108:22915,38109:24199,38110:24444,38111:24754,38112:25161,38113:25209,38114:25259,38115:26e3,38116:27604,38117:27852,38118:30130,38119:30382,38120:30865,38121:31192,38122:32203,38123:32631,38124:32933,38125:34987,38126:35513,38127:36027,38128:36991,38129:38750,38130:39131,38131:27147,38132:31800,38133:20633,38134:23614,38135:24494,38136:26503,38137:27608,38138:29749,38139:30473,38140:32654,38208:40763,38209:26570,38210:31255,38211:21305,38212:30091,38213:39661,38214:24422,38215:33181,38216:33777,38217:32920,38218:24380,38219:24517,38220:30050,38221:31558,38222:36924,38223:26727,38224:23019,38225:23195,38226:32016,38227:30334,38228:35628,38229:20469,38230:24426,38231:27161,38232:27703,38233:28418,38234:29922,38235:31080,38236:34920,38237:35413,38238:35961,38239:24287,38240:25551,38241:30149,38242:31186,38243:33495,38244:37672,38245:37618,38246:33948,38247:34541,38248:39981,38249:21697,38250:24428,38251:25996,38252:27996,38253:28693,38254:36007,38255:36051,38256:38971,38257:25935,38258:29942,38259:19981,38260:20184,38261:22496,38262:22827,38263:23142,38264:23500,38265:20904,38266:24067,38267:24220,38268:24598,38269:25206,38270:25975,38272:26023,38273:26222,38274:28014,38275:29238,38276:31526,38277:33104,38278:33178,38279:33433,38280:35676,38281:36e3,38282:36070,38283:36212,38284:38428,38285:38468,38286:20398,38287:25771,38288:27494,38289:33310,38290:33889,38291:34154,38292:37096,38293:23553,38294:26963,38295:39080,38296:33914,38297:34135,38298:20239,38299:21103,38300:24489,38301:24133,38302:26381,38303:31119,38304:33145,38305:35079,38306:35206,38307:28149,38308:24343,38309:25173,38310:27832,38311:20175,38312:29289,38313:39826,38314:20998,38315:21563,38316:22132,38317:22707,38318:24996,38319:25198,38320:28954,38321:22894,38322:31881,38323:31966,38324:32027,38325:38640,38326:25991,38327:32862,38328:19993,38329:20341,38330:20853,38331:22592,38332:24163,38333:24179,38334:24330,38335:26564,38336:20006,38337:34109,38338:38281,38339:38491,38340:31859,38341:38913,38342:20731,38343:22721,38344:30294,38345:30887,38346:21029,38347:30629,38348:34065,38349:31622,38350:20559,38351:22793,38352:29255,38353:31687,38354:32232,38355:36794,38356:36820,38357:36941,38358:20415,38359:21193,38360:23081,38361:24321,38362:38829,38363:20445,38364:33303,38365:37610,38366:22275,38367:25429,38368:27497,38369:29995,38370:35036,38371:36628,38372:31298,38373:21215,38374:22675,38375:24917,38376:25098,38377:26286,38378:27597,38379:31807,38380:33769,38381:20515,38382:20472,38383:21253,38384:21574,38385:22577,38386:22857,38387:23453,38388:23792,38389:23791,38390:23849,38391:24214,38392:25265,38393:25447,38394:25918,38395:26041,38396:26379,38464:27861,38465:27873,38466:28921,38467:30770,38468:32299,38469:32990,38470:33459,38471:33804,38472:34028,38473:34562,38474:35090,38475:35370,38476:35914,38477:37030,38478:37586,38479:39165,38480:40179,38481:40300,38482:20047,38483:20129,38484:20621,38485:21078,38486:22346,38487:22952,38488:24125,38489:24536,38490:24537,38491:25151,38492:26292,38493:26395,38494:26576,38495:26834,38496:20882,38497:32033,38498:32938,38499:33192,38500:35584,38501:35980,38502:36031,38503:37502,38504:38450,38505:21536,38506:38956,38507:21271,38508:20693,38509:21340,38510:22696,38511:25778,38512:26420,38513:29287,38514:30566,38515:31302,38516:37350,38517:21187,38518:27809,38519:27526,38520:22528,38521:24140,38522:22868,38523:26412,38524:32763,38525:20961,38526:30406,38528:25705,38529:30952,38530:39764,38531:40635,38532:22475,38533:22969,38534:26151,38535:26522,38536:27598,38537:21737,38538:27097,38539:24149,38540:33180,38541:26517,38542:39850,38543:26622,38544:40018,38545:26717,38546:20134,38547:20451,38548:21448,38549:25273,38550:26411,38551:27819,38552:36804,38553:20397,38554:32365,38555:40639,38556:19975,38557:24930,38558:28288,38559:28459,38560:34067,38561:21619,38562:26410,38563:39749,38564:24051,38565:31637,38566:23724,38567:23494,38568:34588,38569:28234,38570:34001,38571:31252,38572:33032,38573:22937,38574:31885,38575:27665,38576:30496,38577:21209,38578:22818,38579:28961,38580:29279,38581:30683,38582:38695,38583:40289,38584:26891,38585:23167,38586:23064,38587:20901,38588:21517,38589:21629,38590:26126,38591:30431,38592:36855,38593:37528,38594:40180,38595:23018,38596:29277,38597:28357,38598:20813,38599:26825,38600:32191,38601:32236,38602:38754,38603:40634,38604:25720,38605:27169,38606:33538,38607:22916,38608:23391,38609:27611,38610:29467,38611:30450,38612:32178,38613:32791,38614:33945,38615:20786,38616:26408,38617:40665,38618:30446,38619:26466,38620:21247,38621:39173,38622:23588,38623:25147,38624:31870,38625:36016,38626:21839,38627:24758,38628:32011,38629:38272,38630:21249,38631:20063,38632:20918,38633:22812,38634:29242,38635:32822,38636:37326,38637:24357,38638:30690,38639:21380,38640:24441,38641:32004,38642:34220,38643:35379,38644:36493,38645:38742,38646:26611,38647:34222,38648:37971,38649:24841,38650:24840,38651:27833,38652:30290,38720:35565,38721:36664,38722:21807,38723:20305,38724:20778,38725:21191,38726:21451,38727:23461,38728:24189,38729:24736,38730:24962,38731:25558,38732:26377,38733:26586,38734:28263,38735:28044,38736:29494,38737:29495,38738:30001,38739:31056,38740:35029,38741:35480,38742:36938,38743:37009,38744:37109,38745:38596,38746:34701,38747:22805,38748:20104,38749:20313,38750:19982,38751:35465,38752:36671,38753:38928,38754:20653,38755:24188,38756:22934,38757:23481,38758:24248,38759:25562,38760:25594,38761:25793,38762:26332,38763:26954,38764:27096,38765:27915,38766:28342,38767:29076,38768:29992,38769:31407,38770:32650,38771:32768,38772:33865,38773:33993,38774:35201,38775:35617,38776:36362,38777:36965,38778:38525,38779:39178,38780:24958,38781:25233,38782:27442,38784:27779,38785:28020,38786:32716,38787:32764,38788:28096,38789:32645,38790:34746,38791:35064,38792:26469,38793:33713,38794:38972,38795:38647,38796:27931,38797:32097,38798:33853,38799:37226,38800:20081,38801:21365,38802:23888,38803:27396,38804:28651,38805:34253,38806:34349,38807:35239,38808:21033,38809:21519,38810:23653,38811:26446,38812:26792,38813:29702,38814:29827,38815:30178,38816:35023,38817:35041,38818:37324,38819:38626,38820:38520,38821:24459,38822:29575,38823:31435,38824:33870,38825:25504,38826:30053,38827:21129,38828:27969,38829:28316,38830:29705,38831:30041,38832:30827,38833:31890,38834:38534,38835:31452,38836:40845,38837:20406,38838:24942,38839:26053,38840:34396,38841:20102,38842:20142,38843:20698,38844:20001,38845:20940,38846:23534,38847:26009,38848:26753,38849:28092,38850:29471,38851:30274,38852:30637,38853:31260,38854:31975,38855:33391,38856:35538,38857:36988,38858:37327,38859:38517,38860:38936,38861:21147,38862:32209,38863:20523,38864:21400,38865:26519,38866:28107,38867:29136,38868:29747,38869:33256,38870:36650,38871:38563,38872:40023,38873:40607,38874:29792,38875:22593,38876:28057,38877:32047,38878:39006,38879:20196,38880:20278,38881:20363,38882:20919,38883:21169,38884:23994,38885:24604,38886:29618,38887:31036,38888:33491,38889:37428,38890:38583,38891:38646,38892:38666,38893:40599,38894:40802,38895:26278,38896:27508,38897:21015,38898:21155,38899:28872,38900:35010,38901:24265,38902:24651,38903:24976,38904:28451,38905:29001,38906:31806,38907:32244,38908:32879,38976:34030,38977:36899,38978:37676,38979:21570,38980:39791,38981:27347,38982:28809,38983:36034,38984:36335,38985:38706,38986:21172,38987:23105,38988:24266,38989:24324,38990:26391,38991:27004,38992:27028,38993:28010,38994:28431,38995:29282,38996:29436,38997:31725,38998:32769,38999:32894,39e3:34635,39001:37070,39002:20845,39003:40595,39004:31108,39005:32907,39006:37682,39007:35542,39008:20525,39009:21644,39010:35441,39011:27498,39012:36036,39013:33031,39014:24785,39015:26528,39016:40434,39017:20121,39018:20120,39019:39952,39020:35435,39021:34241,39022:34152,39023:26880,39024:28286,39025:30871,39026:33109,39071:24332,39072:19984,39073:19989,39074:20010,39075:20017,39076:20022,39077:20028,39078:20031,39079:20034,39080:20054,39081:20056,39082:20098,39083:20101,39084:35947,39085:20106,39086:33298,39087:24333,39088:20110,39089:20126,39090:20127,39091:20128,39092:20130,39093:20144,39094:20147,39095:20150,39096:20174,39097:20173,39098:20164,39099:20166,39100:20162,39101:20183,39102:20190,39103:20205,39104:20191,39105:20215,39106:20233,39107:20314,39108:20272,39109:20315,39110:20317,39111:20311,39112:20295,39113:20342,39114:20360,39115:20367,39116:20376,39117:20347,39118:20329,39119:20336,39120:20369,39121:20335,39122:20358,39123:20374,39124:20760,39125:20436,39126:20447,39127:20430,39128:20440,39129:20443,39130:20433,39131:20442,39132:20432,39133:20452,39134:20453,39135:20506,39136:20520,39137:20500,39138:20522,39139:20517,39140:20485,39141:20252,39142:20470,39143:20513,39144:20521,39145:20524,39146:20478,39147:20463,39148:20497,39149:20486,39150:20547,39151:20551,39152:26371,39153:20565,39154:20560,39155:20552,39156:20570,39157:20566,39158:20588,39159:20600,39160:20608,39161:20634,39162:20613,39163:20660,39164:20658,39232:20681,39233:20682,39234:20659,39235:20674,39236:20694,39237:20702,39238:20709,39239:20717,39240:20707,39241:20718,39242:20729,39243:20725,39244:20745,39245:20737,39246:20738,39247:20758,39248:20757,39249:20756,39250:20762,39251:20769,39252:20794,39253:20791,39254:20796,39255:20795,39256:20799,39257:20800,39258:20818,39259:20812,39260:20820,39261:20834,39262:31480,39263:20841,39264:20842,39265:20846,39266:20864,39267:20866,39268:22232,39269:20876,39270:20873,39271:20879,39272:20881,39273:20883,39274:20885,39275:20886,39276:20900,39277:20902,39278:20898,39279:20905,39280:20906,39281:20907,39282:20915,39283:20913,39284:20914,39285:20912,39286:20917,39287:20925,39288:20933,39289:20937,39290:20955,39291:20960,39292:34389,39293:20969,39294:20973,39296:20976,39297:20981,39298:20990,39299:20996,39300:21003,39301:21012,39302:21006,39303:21031,39304:21034,39305:21038,39306:21043,39307:21049,39308:21071,39309:21060,39310:21067,39311:21068,39312:21086,39313:21076,39314:21098,39315:21108,39316:21097,39317:21107,39318:21119,39319:21117,39320:21133,39321:21140,39322:21138,39323:21105,39324:21128,39325:21137,39326:36776,39327:36775,39328:21164,39329:21165,39330:21180,39331:21173,39332:21185,39333:21197,39334:21207,39335:21214,39336:21219,39337:21222,39338:39149,39339:21216,39340:21235,39341:21237,39342:21240,39343:21241,39344:21254,39345:21256,39346:30008,39347:21261,39348:21264,39349:21263,39350:21269,39351:21274,39352:21283,39353:21295,39354:21297,39355:21299,39356:21304,39357:21312,39358:21318,39359:21317,39360:19991,39361:21321,39362:21325,39363:20950,39364:21342,39365:21353,39366:21358,39367:22808,39368:21371,39369:21367,39370:21378,39371:21398,39372:21408,39373:21414,39374:21413,39375:21422,39376:21424,39377:21430,39378:21443,39379:31762,39380:38617,39381:21471,39382:26364,39383:29166,39384:21486,39385:21480,39386:21485,39387:21498,39388:21505,39389:21565,39390:21568,39391:21548,39392:21549,39393:21564,39394:21550,39395:21558,39396:21545,39397:21533,39398:21582,39399:21647,39400:21621,39401:21646,39402:21599,39403:21617,39404:21623,39405:21616,39406:21650,39407:21627,39408:21632,39409:21622,39410:21636,39411:21648,39412:21638,39413:21703,39414:21666,39415:21688,39416:21669,39417:21676,39418:21700,39419:21704,39420:21672,39488:21675,39489:21698,39490:21668,39491:21694,39492:21692,39493:21720,39494:21733,39495:21734,39496:21775,39497:21780,39498:21757,39499:21742,39500:21741,39501:21754,39502:21730,39503:21817,39504:21824,39505:21859,39506:21836,39507:21806,39508:21852,39509:21829,39510:21846,39511:21847,39512:21816,39513:21811,39514:21853,39515:21913,39516:21888,39517:21679,39518:21898,39519:21919,39520:21883,39521:21886,39522:21912,39523:21918,39524:21934,39525:21884,39526:21891,39527:21929,39528:21895,39529:21928,39530:21978,39531:21957,39532:21983,39533:21956,39534:21980,39535:21988,39536:21972,39537:22036,39538:22007,39539:22038,39540:22014,39541:22013,39542:22043,39543:22009,39544:22094,39545:22096,39546:29151,39547:22068,39548:22070,39549:22066,39550:22072,39552:22123,39553:22116,39554:22063,39555:22124,39556:22122,39557:22150,39558:22144,39559:22154,39560:22176,39561:22164,39562:22159,39563:22181,39564:22190,39565:22198,39566:22196,39567:22210,39568:22204,39569:22209,39570:22211,39571:22208,39572:22216,39573:22222,39574:22225,39575:22227,39576:22231,39577:22254,39578:22265,39579:22272,39580:22271,39581:22276,39582:22281,39583:22280,39584:22283,39585:22285,39586:22291,39587:22296,39588:22294,39589:21959,39590:22300,39591:22310,39592:22327,39593:22328,39594:22350,39595:22331,39596:22336,39597:22351,39598:22377,39599:22464,39600:22408,39601:22369,39602:22399,39603:22409,39604:22419,39605:22432,39606:22451,39607:22436,39608:22442,39609:22448,39610:22467,39611:22470,39612:22484,39613:22482,39614:22483,39615:22538,39616:22486,39617:22499,39618:22539,39619:22553,39620:22557,39621:22642,39622:22561,39623:22626,39624:22603,39625:22640,39626:27584,39627:22610,39628:22589,39629:22649,39630:22661,39631:22713,39632:22687,39633:22699,39634:22714,39635:22750,39636:22715,39637:22712,39638:22702,39639:22725,39640:22739,39641:22737,39642:22743,39643:22745,39644:22744,39645:22757,39646:22748,39647:22756,39648:22751,39649:22767,39650:22778,39651:22777,39652:22779,39653:22780,39654:22781,39655:22786,39656:22794,39657:22800,39658:22811,39659:26790,39660:22821,39661:22828,39662:22829,39663:22834,39664:22840,39665:22846,39666:31442,39667:22869,39668:22864,39669:22862,39670:22874,39671:22872,39672:22882,39673:22880,39674:22887,39675:22892,39676:22889,39744:22904,39745:22913,39746:22941,39747:20318,39748:20395,39749:22947,39750:22962,39751:22982,39752:23016,39753:23004,39754:22925,39755:23001,39756:23002,39757:23077,39758:23071,39759:23057,39760:23068,39761:23049,39762:23066,39763:23104,39764:23148,39765:23113,39766:23093,39767:23094,39768:23138,39769:23146,39770:23194,39771:23228,39772:23230,39773:23243,39774:23234,39775:23229,39776:23267,39777:23255,39778:23270,39779:23273,39780:23254,39781:23290,39782:23291,39783:23308,39784:23307,39785:23318,39786:23346,39787:23248,39788:23338,39789:23350,39790:23358,39791:23363,39792:23365,39793:23360,39794:23377,39795:23381,39796:23386,39797:23387,39798:23397,39799:23401,39800:23408,39801:23411,39802:23413,39803:23416,39804:25992,39805:23418,39806:23424,39808:23427,39809:23462,39810:23480,39811:23491,39812:23495,39813:23497,39814:23508,39815:23504,39816:23524,39817:23526,39818:23522,39819:23518,39820:23525,39821:23531,39822:23536,39823:23542,39824:23539,39825:23557,39826:23559,39827:23560,39828:23565,39829:23571,39830:23584,39831:23586,39832:23592,39833:23608,39834:23609,39835:23617,39836:23622,39837:23630,39838:23635,39839:23632,39840:23631,39841:23409,39842:23660,39843:23662,39844:20066,39845:23670,39846:23673,39847:23692,39848:23697,39849:23700,39850:22939,39851:23723,39852:23739,39853:23734,39854:23740,39855:23735,39856:23749,39857:23742,39858:23751,39859:23769,39860:23785,39861:23805,39862:23802,39863:23789,39864:23948,39865:23786,39866:23819,39867:23829,39868:23831,39869:23900,39870:23839,39871:23835,39872:23825,39873:23828,39874:23842,39875:23834,39876:23833,39877:23832,39878:23884,39879:23890,39880:23886,39881:23883,39882:23916,39883:23923,39884:23926,39885:23943,39886:23940,39887:23938,39888:23970,39889:23965,39890:23980,39891:23982,39892:23997,39893:23952,39894:23991,39895:23996,39896:24009,39897:24013,39898:24019,39899:24018,39900:24022,39901:24027,39902:24043,39903:24050,39904:24053,39905:24075,39906:24090,39907:24089,39908:24081,39909:24091,39910:24118,39911:24119,39912:24132,39913:24131,39914:24128,39915:24142,39916:24151,39917:24148,39918:24159,39919:24162,39920:24164,39921:24135,39922:24181,39923:24182,39924:24186,39925:40636,39926:24191,39927:24224,39928:24257,39929:24258,39930:24264,39931:24272,39932:24271,4e4:24278,40001:24291,40002:24285,40003:24282,40004:24283,40005:24290,40006:24289,40007:24296,40008:24297,40009:24300,40010:24305,40011:24307,40012:24304,40013:24308,40014:24312,40015:24318,40016:24323,40017:24329,40018:24413,40019:24412,40020:24331,40021:24337,40022:24342,40023:24361,40024:24365,40025:24376,40026:24385,40027:24392,40028:24396,40029:24398,40030:24367,40031:24401,40032:24406,40033:24407,40034:24409,40035:24417,40036:24429,40037:24435,40038:24439,40039:24451,40040:24450,40041:24447,40042:24458,40043:24456,40044:24465,40045:24455,40046:24478,40047:24473,40048:24472,40049:24480,40050:24488,40051:24493,40052:24508,40053:24534,40054:24571,40055:24548,40056:24568,40057:24561,40058:24541,40059:24755,40060:24575,40061:24609,40062:24672,40064:24601,40065:24592,40066:24617,40067:24590,40068:24625,40069:24603,40070:24597,40071:24619,40072:24614,40073:24591,40074:24634,40075:24666,40076:24641,40077:24682,40078:24695,40079:24671,40080:24650,40081:24646,40082:24653,40083:24675,40084:24643,40085:24676,40086:24642,40087:24684,40088:24683,40089:24665,40090:24705,40091:24717,40092:24807,40093:24707,40094:24730,40095:24708,40096:24731,40097:24726,40098:24727,40099:24722,40100:24743,40101:24715,40102:24801,40103:24760,40104:24800,40105:24787,40106:24756,40107:24560,40108:24765,40109:24774,40110:24757,40111:24792,40112:24909,40113:24853,40114:24838,40115:24822,40116:24823,40117:24832,40118:24820,40119:24826,40120:24835,40121:24865,40122:24827,40123:24817,40124:24845,40125:24846,40126:24903,40127:24894,40128:24872,40129:24871,40130:24906,40131:24895,40132:24892,40133:24876,40134:24884,40135:24893,40136:24898,40137:24900,40138:24947,40139:24951,40140:24920,40141:24921,40142:24922,40143:24939,40144:24948,40145:24943,40146:24933,40147:24945,40148:24927,40149:24925,40150:24915,40151:24949,40152:24985,40153:24982,40154:24967,40155:25004,40156:24980,40157:24986,40158:24970,40159:24977,40160:25003,40161:25006,40162:25036,40163:25034,40164:25033,40165:25079,40166:25032,40167:25027,40168:25030,40169:25018,40170:25035,40171:32633,40172:25037,40173:25062,40174:25059,40175:25078,40176:25082,40177:25076,40178:25087,40179:25085,40180:25084,40181:25086,40182:25088,40183:25096,40184:25097,40185:25101,40186:25100,40187:25108,40188:25115,40256:25118,40257:25121,40258:25130,40259:25134,40260:25136,40261:25138,40262:25139,40263:25153,40264:25166,40265:25182,40266:25187,40267:25179,40268:25184,40269:25192,40270:25212,40271:25218,40272:25225,40273:25214,40274:25234,40275:25235,40276:25238,40277:25300,40278:25219,40279:25236,40280:25303,40281:25297,40282:25275,40283:25295,40284:25343,40285:25286,40286:25812,40287:25288,40288:25308,40289:25292,40290:25290,40291:25282,40292:25287,40293:25243,40294:25289,40295:25356,40296:25326,40297:25329,40298:25383,40299:25346,40300:25352,40301:25327,40302:25333,40303:25424,40304:25406,40305:25421,40306:25628,40307:25423,40308:25494,40309:25486,40310:25472,40311:25515,40312:25462,40313:25507,40314:25487,40315:25481,40316:25503,40317:25525,40318:25451,40320:25449,40321:25534,40322:25577,40323:25536,40324:25542,40325:25571,40326:25545,40327:25554,40328:25590,40329:25540,40330:25622,40331:25652,40332:25606,40333:25619,40334:25638,40335:25654,40336:25885,40337:25623,40338:25640,40339:25615,40340:25703,40341:25711,40342:25718,40343:25678,40344:25898,40345:25749,40346:25747,40347:25765,40348:25769,40349:25736,40350:25788,40351:25818,40352:25810,40353:25797,40354:25799,40355:25787,40356:25816,40357:25794,40358:25841,40359:25831,40360:33289,40361:25824,40362:25825,40363:25260,40364:25827,40365:25839,40366:25900,40367:25846,40368:25844,40369:25842,40370:25850,40371:25856,40372:25853,40373:25880,40374:25884,40375:25861,40376:25892,40377:25891,40378:25899,40379:25908,40380:25909,40381:25911,40382:25910,40383:25912,40384:30027,40385:25928,40386:25942,40387:25941,40388:25933,40389:25944,40390:25950,40391:25949,40392:25970,40393:25976,40394:25986,40395:25987,40396:35722,40397:26011,40398:26015,40399:26027,40400:26039,40401:26051,40402:26054,40403:26049,40404:26052,40405:26060,40406:26066,40407:26075,40408:26073,40409:26080,40410:26081,40411:26097,40412:26482,40413:26122,40414:26115,40415:26107,40416:26483,40417:26165,40418:26166,40419:26164,40420:26140,40421:26191,40422:26180,40423:26185,40424:26177,40425:26206,40426:26205,40427:26212,40428:26215,40429:26216,40430:26207,40431:26210,40432:26224,40433:26243,40434:26248,40435:26254,40436:26249,40437:26244,40438:26264,40439:26269,40440:26305,40441:26297,40442:26313,40443:26302,40444:26300,40512:26308,40513:26296,40514:26326,40515:26330,40516:26336,40517:26175,40518:26342,40519:26345,40520:26352,40521:26357,40522:26359,40523:26383,40524:26390,40525:26398,40526:26406,40527:26407,40528:38712,40529:26414,40530:26431,40531:26422,40532:26433,40533:26424,40534:26423,40535:26438,40536:26462,40537:26464,40538:26457,40539:26467,40540:26468,40541:26505,40542:26480,40543:26537,40544:26492,40545:26474,40546:26508,40547:26507,40548:26534,40549:26529,40550:26501,40551:26551,40552:26607,40553:26548,40554:26604,40555:26547,40556:26601,40557:26552,40558:26596,40559:26590,40560:26589,40561:26594,40562:26606,40563:26553,40564:26574,40565:26566,40566:26599,40567:27292,40568:26654,40569:26694,40570:26665,40571:26688,40572:26701,40573:26674,40574:26702,40576:26803,40577:26667,40578:26713,40579:26723,40580:26743,40581:26751,40582:26783,40583:26767,40584:26797,40585:26772,40586:26781,40587:26779,40588:26755,40589:27310,40590:26809,40591:26740,40592:26805,40593:26784,40594:26810,40595:26895,40596:26765,40597:26750,40598:26881,40599:26826,40600:26888,40601:26840,40602:26914,40603:26918,40604:26849,40605:26892,40606:26829,40607:26836,40608:26855,40609:26837,40610:26934,40611:26898,40612:26884,40613:26839,40614:26851,40615:26917,40616:26873,40617:26848,40618:26863,40619:26920,40620:26922,40621:26906,40622:26915,40623:26913,40624:26822,40625:27001,40626:26999,40627:26972,40628:27e3,40629:26987,40630:26964,40631:27006,40632:26990,40633:26937,40634:26996,40635:26941,40636:26969,40637:26928,40638:26977,40639:26974,40640:26973,40641:27009,40642:26986,40643:27058,40644:27054,40645:27088,40646:27071,40647:27073,40648:27091,40649:27070,40650:27086,40651:23528,40652:27082,40653:27101,40654:27067,40655:27075,40656:27047,40657:27182,40658:27025,40659:27040,40660:27036,40661:27029,40662:27060,40663:27102,40664:27112,40665:27138,40666:27163,40667:27135,40668:27402,40669:27129,40670:27122,40671:27111,40672:27141,40673:27057,40674:27166,40675:27117,40676:27156,40677:27115,40678:27146,40679:27154,40680:27329,40681:27171,40682:27155,40683:27204,40684:27148,40685:27250,40686:27190,40687:27256,40688:27207,40689:27234,40690:27225,40691:27238,40692:27208,40693:27192,40694:27170,40695:27280,40696:27277,40697:27296,40698:27268,40699:27298,40700:27299,40768:27287,40769:34327,40770:27323,40771:27331,40772:27330,40773:27320,40774:27315,40775:27308,40776:27358,40777:27345,40778:27359,40779:27306,40780:27354,40781:27370,40782:27387,40783:27397,40784:34326,40785:27386,40786:27410,40787:27414,40788:39729,40789:27423,40790:27448,40791:27447,40792:30428,40793:27449,40794:39150,40795:27463,40796:27459,40797:27465,40798:27472,40799:27481,40800:27476,40801:27483,40802:27487,40803:27489,40804:27512,40805:27513,40806:27519,40807:27520,40808:27524,40809:27523,40810:27533,40811:27544,40812:27541,40813:27550,40814:27556,40815:27562,40816:27563,40817:27567,40818:27570,40819:27569,40820:27571,40821:27575,40822:27580,40823:27590,40824:27595,40825:27603,40826:27615,40827:27628,40828:27627,40829:27635,40830:27631,40832:40638,40833:27656,40834:27667,40835:27668,40836:27675,40837:27684,40838:27683,40839:27742,40840:27733,40841:27746,40842:27754,40843:27778,40844:27789,40845:27802,40846:27777,40847:27803,40848:27774,40849:27752,40850:27763,40851:27794,40852:27792,40853:27844,40854:27889,40855:27859,40856:27837,40857:27863,40858:27845,40859:27869,40860:27822,40861:27825,40862:27838,40863:27834,40864:27867,40865:27887,40866:27865,40867:27882,40868:27935,40869:34893,40870:27958,40871:27947,40872:27965,40873:27960,40874:27929,40875:27957,40876:27955,40877:27922,40878:27916,40879:28003,40880:28051,40881:28004,40882:27994,40883:28025,40884:27993,40885:28046,40886:28053,40887:28644,40888:28037,40889:28153,40890:28181,40891:28170,40892:28085,40893:28103,40894:28134,40895:28088,40896:28102,40897:28140,40898:28126,40899:28108,40900:28136,40901:28114,40902:28101,40903:28154,40904:28121,40905:28132,40906:28117,40907:28138,40908:28142,40909:28205,40910:28270,40911:28206,40912:28185,40913:28274,40914:28255,40915:28222,40916:28195,40917:28267,40918:28203,40919:28278,40920:28237,40921:28191,40922:28227,40923:28218,40924:28238,40925:28196,40926:28415,40927:28189,40928:28216,40929:28290,40930:28330,40931:28312,40932:28361,40933:28343,40934:28371,40935:28349,40936:28335,40937:28356,40938:28338,40939:28372,40940:28373,40941:28303,40942:28325,40943:28354,40944:28319,40945:28481,40946:28433,40947:28748,40948:28396,40949:28408,40950:28414,40951:28479,40952:28402,40953:28465,40954:28399,40955:28466,40956:28364,161:65377,162:65378,163:65379,164:65380,165:65381,166:65382,167:65383,168:65384,169:65385,170:65386,171:65387,172:65388,173:65389,174:65390,175:65391,176:65392,177:65393,178:65394,179:65395,180:65396,181:65397,182:65398,183:65399,184:65400,185:65401,186:65402,187:65403,188:65404,189:65405,190:65406,191:65407,192:65408,193:65409,194:65410,195:65411,196:65412,197:65413,198:65414,199:65415,200:65416,201:65417,202:65418,203:65419,204:65420,205:65421,206:65422,207:65423,208:65424,209:65425,210:65426,211:65427,212:65428,213:65429,214:65430,215:65431,216:65432,217:65433,218:65434,219:65435,220:65436,221:65437,222:65438,223:65439,57408:28478,57409:28435,57410:28407,57411:28550,57412:28538,57413:28536,57414:28545,57415:28544,57416:28527,57417:28507,57418:28659,57419:28525,57420:28546,57421:28540,57422:28504,57423:28558,57424:28561,57425:28610,57426:28518,57427:28595,57428:28579,57429:28577,57430:28580,57431:28601,57432:28614,57433:28586,57434:28639,57435:28629,57436:28652,57437:28628,57438:28632,57439:28657,57440:28654,57441:28635,57442:28681,57443:28683,57444:28666,57445:28689,57446:28673,57447:28687,57448:28670,57449:28699,57450:28698,57451:28532,57452:28701,57453:28696,57454:28703,57455:28720,57456:28734,57457:28722,57458:28753,57459:28771,57460:28825,57461:28818,57462:28847,57463:28913,57464:28844,57465:28856,57466:28851,57467:28846,57468:28895,57469:28875,57470:28893,57472:28889,57473:28937,57474:28925,57475:28956,57476:28953,57477:29029,57478:29013,57479:29064,57480:29030,57481:29026,57482:29004,57483:29014,57484:29036,57485:29071,57486:29179,57487:29060,57488:29077,57489:29096,57490:29100,57491:29143,57492:29113,57493:29118,57494:29138,57495:29129,57496:29140,57497:29134,57498:29152,57499:29164,57500:29159,57501:29173,57502:29180,57503:29177,57504:29183,57505:29197,57506:29200,57507:29211,57508:29224,57509:29229,57510:29228,57511:29232,57512:29234,57513:29243,57514:29244,57515:29247,57516:29248,57517:29254,57518:29259,57519:29272,57520:29300,57521:29310,57522:29314,57523:29313,57524:29319,57525:29330,57526:29334,57527:29346,57528:29351,57529:29369,57530:29362,57531:29379,57532:29382,57533:29380,57534:29390,57535:29394,57536:29410,57537:29408,57538:29409,57539:29433,57540:29431,57541:20495,57542:29463,57543:29450,57544:29468,57545:29462,57546:29469,57547:29492,57548:29487,57549:29481,57550:29477,57551:29502,57552:29518,57553:29519,57554:40664,57555:29527,57556:29546,57557:29544,57558:29552,57559:29560,57560:29557,57561:29563,57562:29562,57563:29640,57564:29619,57565:29646,57566:29627,57567:29632,57568:29669,57569:29678,57570:29662,57571:29858,57572:29701,57573:29807,57574:29733,57575:29688,57576:29746,57577:29754,57578:29781,57579:29759,57580:29791,57581:29785,57582:29761,57583:29788,57584:29801,57585:29808,57586:29795,57587:29802,57588:29814,57589:29822,57590:29835,57591:29854,57592:29863,57593:29898,57594:29903,57595:29908,57596:29681,57664:29920,57665:29923,57666:29927,57667:29929,57668:29934,57669:29938,57670:29936,57671:29937,57672:29944,57673:29943,57674:29956,57675:29955,57676:29957,57677:29964,57678:29966,57679:29965,57680:29973,57681:29971,57682:29982,57683:29990,57684:29996,57685:30012,57686:30020,57687:30029,57688:30026,57689:30025,57690:30043,57691:30022,57692:30042,57693:30057,57694:30052,57695:30055,57696:30059,57697:30061,57698:30072,57699:30070,57700:30086,57701:30087,57702:30068,57703:30090,57704:30089,57705:30082,57706:30100,57707:30106,57708:30109,57709:30117,57710:30115,57711:30146,57712:30131,57713:30147,57714:30133,57715:30141,57716:30136,57717:30140,57718:30129,57719:30157,57720:30154,57721:30162,57722:30169,57723:30179,57724:30174,57725:30206,57726:30207,57728:30204,57729:30209,57730:30192,57731:30202,57732:30194,57733:30195,57734:30219,57735:30221,57736:30217,57737:30239,57738:30247,57739:30240,57740:30241,57741:30242,57742:30244,57743:30260,57744:30256,57745:30267,57746:30279,57747:30280,57748:30278,57749:30300,57750:30296,57751:30305,57752:30306,57753:30312,57754:30313,57755:30314,57756:30311,57757:30316,57758:30320,57759:30322,57760:30326,57761:30328,57762:30332,57763:30336,57764:30339,57765:30344,57766:30347,57767:30350,57768:30358,57769:30355,57770:30361,57771:30362,57772:30384,57773:30388,57774:30392,57775:30393,57776:30394,57777:30402,57778:30413,57779:30422,57780:30418,57781:30430,57782:30433,57783:30437,57784:30439,57785:30442,57786:34351,57787:30459,57788:30472,57789:30471,57790:30468,57791:30505,57792:30500,57793:30494,57794:30501,57795:30502,57796:30491,57797:30519,57798:30520,57799:30535,57800:30554,57801:30568,57802:30571,57803:30555,57804:30565,57805:30591,57806:30590,57807:30585,57808:30606,57809:30603,57810:30609,57811:30624,57812:30622,57813:30640,57814:30646,57815:30649,57816:30655,57817:30652,57818:30653,57819:30651,57820:30663,57821:30669,57822:30679,57823:30682,57824:30684,57825:30691,57826:30702,57827:30716,57828:30732,57829:30738,57830:31014,57831:30752,57832:31018,57833:30789,57834:30862,57835:30836,57836:30854,57837:30844,57838:30874,57839:30860,57840:30883,57841:30901,57842:30890,57843:30895,57844:30929,57845:30918,57846:30923,57847:30932,57848:30910,57849:30908,57850:30917,57851:30922,57852:30956,57920:30951,57921:30938,57922:30973,57923:30964,57924:30983,57925:30994,57926:30993,57927:31001,57928:31020,57929:31019,57930:31040,57931:31072,57932:31063,57933:31071,57934:31066,57935:31061,57936:31059,57937:31098,57938:31103,57939:31114,57940:31133,57941:31143,57942:40779,57943:31146,57944:31150,57945:31155,57946:31161,57947:31162,57948:31177,57949:31189,57950:31207,57951:31212,57952:31201,57953:31203,57954:31240,57955:31245,57956:31256,57957:31257,57958:31264,57959:31263,57960:31104,57961:31281,57962:31291,57963:31294,57964:31287,57965:31299,57966:31319,57967:31305,57968:31329,57969:31330,57970:31337,57971:40861,57972:31344,57973:31353,57974:31357,57975:31368,57976:31383,57977:31381,57978:31384,57979:31382,57980:31401,57981:31432,57982:31408,57984:31414,57985:31429,57986:31428,57987:31423,57988:36995,57989:31431,57990:31434,57991:31437,57992:31439,57993:31445,57994:31443,57995:31449,57996:31450,57997:31453,57998:31457,57999:31458,58e3:31462,58001:31469,58002:31472,58003:31490,58004:31503,58005:31498,58006:31494,58007:31539,58008:31512,58009:31513,58010:31518,58011:31541,58012:31528,58013:31542,58014:31568,58015:31610,58016:31492,58017:31565,58018:31499,58019:31564,58020:31557,58021:31605,58022:31589,58023:31604,58024:31591,58025:31600,58026:31601,58027:31596,58028:31598,58029:31645,58030:31640,58031:31647,58032:31629,58033:31644,58034:31642,58035:31627,58036:31634,58037:31631,58038:31581,58039:31641,58040:31691,58041:31681,58042:31692,58043:31695,58044:31668,58045:31686,58046:31709,58047:31721,58048:31761,58049:31764,58050:31718,58051:31717,58052:31840,58053:31744,58054:31751,58055:31763,58056:31731,58057:31735,58058:31767,58059:31757,58060:31734,58061:31779,58062:31783,58063:31786,58064:31775,58065:31799,58066:31787,58067:31805,58068:31820,58069:31811,58070:31828,58071:31823,58072:31808,58073:31824,58074:31832,58075:31839,58076:31844,58077:31830,58078:31845,58079:31852,58080:31861,58081:31875,58082:31888,58083:31908,58084:31917,58085:31906,58086:31915,58087:31905,58088:31912,58089:31923,58090:31922,58091:31921,58092:31918,58093:31929,58094:31933,58095:31936,58096:31941,58097:31938,58098:31960,58099:31954,58100:31964,58101:31970,58102:39739,58103:31983,58104:31986,58105:31988,58106:31990,58107:31994,58108:32006,58176:32002,58177:32028,58178:32021,58179:32010,58180:32069,58181:32075,58182:32046,58183:32050,58184:32063,58185:32053,58186:32070,58187:32115,58188:32086,58189:32078,58190:32114,58191:32104,58192:32110,58193:32079,58194:32099,58195:32147,58196:32137,58197:32091,58198:32143,58199:32125,58200:32155,58201:32186,58202:32174,58203:32163,58204:32181,58205:32199,58206:32189,58207:32171,58208:32317,58209:32162,58210:32175,58211:32220,58212:32184,58213:32159,58214:32176,58215:32216,58216:32221,58217:32228,58218:32222,58219:32251,58220:32242,58221:32225,58222:32261,58223:32266,58224:32291,58225:32289,58226:32274,58227:32305,58228:32287,58229:32265,58230:32267,58231:32290,58232:32326,58233:32358,58234:32315,58235:32309,58236:32313,58237:32323,58238:32311,58240:32306,58241:32314,58242:32359,58243:32349,58244:32342,58245:32350,58246:32345,58247:32346,58248:32377,58249:32362,58250:32361,58251:32380,58252:32379,58253:32387,58254:32213,58255:32381,58256:36782,58257:32383,58258:32392,58259:32393,58260:32396,58261:32402,58262:32400,58263:32403,58264:32404,58265:32406,58266:32398,58267:32411,58268:32412,58269:32568,58270:32570,58271:32581,58272:32588,58273:32589,58274:32590,58275:32592,58276:32593,58277:32597,58278:32596,58279:32600,58280:32607,58281:32608,58282:32616,58283:32617,58284:32615,58285:32632,58286:32642,58287:32646,58288:32643,58289:32648,58290:32647,58291:32652,58292:32660,58293:32670,58294:32669,58295:32666,58296:32675,58297:32687,58298:32690,58299:32697,58300:32686,58301:32694,58302:32696,58303:35697,58304:32709,58305:32710,58306:32714,58307:32725,58308:32724,58309:32737,58310:32742,58311:32745,58312:32755,58313:32761,58314:39132,58315:32774,58316:32772,58317:32779,58318:32786,58319:32792,58320:32793,58321:32796,58322:32801,58323:32808,58324:32831,58325:32827,58326:32842,58327:32838,58328:32850,58329:32856,58330:32858,58331:32863,58332:32866,58333:32872,58334:32883,58335:32882,58336:32880,58337:32886,58338:32889,58339:32893,58340:32895,58341:32900,58342:32902,58343:32901,58344:32923,58345:32915,58346:32922,58347:32941,58348:20880,58349:32940,58350:32987,58351:32997,58352:32985,58353:32989,58354:32964,58355:32986,58356:32982,58357:33033,58358:33007,58359:33009,58360:33051,58361:33065,58362:33059,58363:33071,58364:33099,58432:38539,58433:33094,58434:33086,58435:33107,58436:33105,58437:33020,58438:33137,58439:33134,58440:33125,58441:33126,58442:33140,58443:33155,58444:33160,58445:33162,58446:33152,58447:33154,58448:33184,58449:33173,58450:33188,58451:33187,58452:33119,58453:33171,58454:33193,58455:33200,58456:33205,58457:33214,58458:33208,58459:33213,58460:33216,58461:33218,58462:33210,58463:33225,58464:33229,58465:33233,58466:33241,58467:33240,58468:33224,58469:33242,58470:33247,58471:33248,58472:33255,58473:33274,58474:33275,58475:33278,58476:33281,58477:33282,58478:33285,58479:33287,58480:33290,58481:33293,58482:33296,58483:33302,58484:33321,58485:33323,58486:33336,58487:33331,58488:33344,58489:33369,58490:33368,58491:33373,58492:33370,58493:33375,58494:33380,58496:33378,58497:33384,58498:33386,58499:33387,58500:33326,58501:33393,58502:33399,58503:33400,58504:33406,58505:33421,58506:33426,58507:33451,58508:33439,58509:33467,58510:33452,58511:33505,58512:33507,58513:33503,58514:33490,58515:33524,58516:33523,58517:33530,58518:33683,58519:33539,58520:33531,58521:33529,58522:33502,58523:33542,58524:33500,58525:33545,58526:33497,58527:33589,58528:33588,58529:33558,58530:33586,58531:33585,58532:33600,58533:33593,58534:33616,58535:33605,58536:33583,58537:33579,58538:33559,58539:33560,58540:33669,58541:33690,58542:33706,58543:33695,58544:33698,58545:33686,58546:33571,58547:33678,58548:33671,58549:33674,58550:33660,58551:33717,58552:33651,58553:33653,58554:33696,58555:33673,58556:33704,58557:33780,58558:33811,58559:33771,58560:33742,58561:33789,58562:33795,58563:33752,58564:33803,58565:33729,58566:33783,58567:33799,58568:33760,58569:33778,58570:33805,58571:33826,58572:33824,58573:33725,58574:33848,58575:34054,58576:33787,58577:33901,58578:33834,58579:33852,58580:34138,58581:33924,58582:33911,58583:33899,58584:33965,58585:33902,58586:33922,58587:33897,58588:33862,58589:33836,58590:33903,58591:33913,58592:33845,58593:33994,58594:33890,58595:33977,58596:33983,58597:33951,58598:34009,58599:33997,58600:33979,58601:34010,58602:34e3,58603:33985,58604:33990,58605:34006,58606:33953,58607:34081,58608:34047,58609:34036,58610:34071,58611:34072,58612:34092,58613:34079,58614:34069,58615:34068,58616:34044,58617:34112,58618:34147,58619:34136,58620:34120,58688:34113,58689:34306,58690:34123,58691:34133,58692:34176,58693:34212,58694:34184,58695:34193,58696:34186,58697:34216,58698:34157,58699:34196,58700:34203,58701:34282,58702:34183,58703:34204,58704:34167,58705:34174,58706:34192,58707:34249,58708:34234,58709:34255,58710:34233,58711:34256,58712:34261,58713:34269,58714:34277,58715:34268,58716:34297,58717:34314,58718:34323,58719:34315,58720:34302,58721:34298,58722:34310,58723:34338,58724:34330,58725:34352,58726:34367,58727:34381,58728:20053,58729:34388,58730:34399,58731:34407,58732:34417,58733:34451,58734:34467,58735:34473,58736:34474,58737:34443,58738:34444,58739:34486,58740:34479,58741:34500,58742:34502,58743:34480,58744:34505,58745:34851,58746:34475,58747:34516,58748:34526,58749:34537,58750:34540,58752:34527,58753:34523,58754:34543,58755:34578,58756:34566,58757:34568,58758:34560,58759:34563,58760:34555,58761:34577,58762:34569,58763:34573,58764:34553,58765:34570,58766:34612,58767:34623,58768:34615,58769:34619,58770:34597,58771:34601,58772:34586,58773:34656,58774:34655,58775:34680,58776:34636,58777:34638,58778:34676,58779:34647,58780:34664,58781:34670,58782:34649,58783:34643,58784:34659,58785:34666,58786:34821,58787:34722,58788:34719,58789:34690,58790:34735,58791:34763,58792:34749,58793:34752,58794:34768,58795:38614,58796:34731,58797:34756,58798:34739,58799:34759,58800:34758,58801:34747,58802:34799,58803:34802,58804:34784,58805:34831,58806:34829,58807:34814,58808:34806,58809:34807,58810:34830,58811:34770,58812:34833,58813:34838,58814:34837,58815:34850,58816:34849,58817:34865,58818:34870,58819:34873,58820:34855,58821:34875,58822:34884,58823:34882,58824:34898,58825:34905,58826:34910,58827:34914,58828:34923,58829:34945,58830:34942,58831:34974,58832:34933,58833:34941,58834:34997,58835:34930,58836:34946,58837:34967,58838:34962,58839:34990,58840:34969,58841:34978,58842:34957,58843:34980,58844:34992,58845:35007,58846:34993,58847:35011,58848:35012,58849:35028,58850:35032,58851:35033,58852:35037,58853:35065,58854:35074,58855:35068,58856:35060,58857:35048,58858:35058,58859:35076,58860:35084,58861:35082,58862:35091,58863:35139,58864:35102,58865:35109,58866:35114,58867:35115,58868:35137,58869:35140,58870:35131,58871:35126,58872:35128,58873:35148,58874:35101,58875:35168,58876:35166,58944:35174,58945:35172,58946:35181,58947:35178,58948:35183,58949:35188,58950:35191,58951:35198,58952:35203,58953:35208,58954:35210,58955:35219,58956:35224,58957:35233,58958:35241,58959:35238,58960:35244,58961:35247,58962:35250,58963:35258,58964:35261,58965:35263,58966:35264,58967:35290,58968:35292,58969:35293,58970:35303,58971:35316,58972:35320,58973:35331,58974:35350,58975:35344,58976:35340,58977:35355,58978:35357,58979:35365,58980:35382,58981:35393,58982:35419,58983:35410,58984:35398,58985:35400,58986:35452,58987:35437,58988:35436,58989:35426,58990:35461,58991:35458,58992:35460,58993:35496,58994:35489,58995:35473,58996:35493,58997:35494,58998:35482,58999:35491,59e3:35524,59001:35533,59002:35522,59003:35546,59004:35563,59005:35571,59006:35559,59008:35556,59009:35569,59010:35604,59011:35552,59012:35554,59013:35575,59014:35550,59015:35547,59016:35596,59017:35591,59018:35610,59019:35553,59020:35606,59021:35600,59022:35607,59023:35616,59024:35635,59025:38827,59026:35622,59027:35627,59028:35646,59029:35624,59030:35649,59031:35660,59032:35663,59033:35662,59034:35657,59035:35670,59036:35675,59037:35674,59038:35691,59039:35679,59040:35692,59041:35695,59042:35700,59043:35709,59044:35712,59045:35724,59046:35726,59047:35730,59048:35731,59049:35734,59050:35737,59051:35738,59052:35898,59053:35905,59054:35903,59055:35912,59056:35916,59057:35918,59058:35920,59059:35925,59060:35938,59061:35948,59062:35960,59063:35962,59064:35970,59065:35977,59066:35973,59067:35978,59068:35981,59069:35982,59070:35988,59071:35964,59072:35992,59073:25117,59074:36013,59075:36010,59076:36029,59077:36018,59078:36019,59079:36014,59080:36022,59081:36040,59082:36033,59083:36068,59084:36067,59085:36058,59086:36093,59087:36090,59088:36091,59089:36100,59090:36101,59091:36106,59092:36103,59093:36111,59094:36109,59095:36112,59096:40782,59097:36115,59098:36045,59099:36116,59100:36118,59101:36199,59102:36205,59103:36209,59104:36211,59105:36225,59106:36249,59107:36290,59108:36286,59109:36282,59110:36303,59111:36314,59112:36310,59113:36300,59114:36315,59115:36299,59116:36330,59117:36331,59118:36319,59119:36323,59120:36348,59121:36360,59122:36361,59123:36351,59124:36381,59125:36382,59126:36368,59127:36383,59128:36418,59129:36405,59130:36400,59131:36404,59132:36426,59200:36423,59201:36425,59202:36428,59203:36432,59204:36424,59205:36441,59206:36452,59207:36448,59208:36394,59209:36451,59210:36437,59211:36470,59212:36466,59213:36476,59214:36481,59215:36487,59216:36485,59217:36484,59218:36491,59219:36490,59220:36499,59221:36497,59222:36500,59223:36505,59224:36522,59225:36513,59226:36524,59227:36528,59228:36550,59229:36529,59230:36542,59231:36549,59232:36552,59233:36555,59234:36571,59235:36579,59236:36604,59237:36603,59238:36587,59239:36606,59240:36618,59241:36613,59242:36629,59243:36626,59244:36633,59245:36627,59246:36636,59247:36639,59248:36635,59249:36620,59250:36646,59251:36659,59252:36667,59253:36665,59254:36677,59255:36674,59256:36670,59257:36684,59258:36681,59259:36678,59260:36686,59261:36695,59262:36700,59264:36706,59265:36707,59266:36708,59267:36764,59268:36767,59269:36771,59270:36781,59271:36783,59272:36791,59273:36826,59274:36837,59275:36834,59276:36842,59277:36847,59278:36999,59279:36852,59280:36869,59281:36857,59282:36858,59283:36881,59284:36885,59285:36897,59286:36877,59287:36894,59288:36886,59289:36875,59290:36903,59291:36918,59292:36917,59293:36921,59294:36856,59295:36943,59296:36944,59297:36945,59298:36946,59299:36878,59300:36937,59301:36926,59302:36950,59303:36952,59304:36958,59305:36968,59306:36975,59307:36982,59308:38568,59309:36978,59310:36994,59311:36989,59312:36993,59313:36992,59314:37002,59315:37001,59316:37007,59317:37032,59318:37039,59319:37041,59320:37045,59321:37090,59322:37092,59323:25160,59324:37083,59325:37122,59326:37138,59327:37145,59328:37170,59329:37168,59330:37194,59331:37206,59332:37208,59333:37219,59334:37221,59335:37225,59336:37235,59337:37234,59338:37259,59339:37257,59340:37250,59341:37282,59342:37291,59343:37295,59344:37290,59345:37301,59346:37300,59347:37306,59348:37312,59349:37313,59350:37321,59351:37323,59352:37328,59353:37334,59354:37343,59355:37345,59356:37339,59357:37372,59358:37365,59359:37366,59360:37406,59361:37375,59362:37396,59363:37420,59364:37397,59365:37393,59366:37470,59367:37463,59368:37445,59369:37449,59370:37476,59371:37448,59372:37525,59373:37439,59374:37451,59375:37456,59376:37532,59377:37526,59378:37523,59379:37531,59380:37466,59381:37583,59382:37561,59383:37559,59384:37609,59385:37647,59386:37626,59387:37700,59388:37678,59456:37657,59457:37666,59458:37658,59459:37667,59460:37690,59461:37685,59462:37691,59463:37724,59464:37728,59465:37756,59466:37742,59467:37718,59468:37808,59469:37804,59470:37805,59471:37780,59472:37817,59473:37846,59474:37847,59475:37864,59476:37861,59477:37848,59478:37827,59479:37853,59480:37840,59481:37832,59482:37860,59483:37914,59484:37908,59485:37907,59486:37891,59487:37895,59488:37904,59489:37942,59490:37931,59491:37941,59492:37921,59493:37946,59494:37953,59495:37970,59496:37956,59497:37979,59498:37984,59499:37986,59500:37982,59501:37994,59502:37417,59503:38e3,59504:38005,59505:38007,59506:38013,59507:37978,59508:38012,59509:38014,59510:38017,59511:38015,59512:38274,59513:38279,59514:38282,59515:38292,59516:38294,59517:38296,59518:38297,59520:38304,59521:38312,59522:38311,59523:38317,59524:38332,59525:38331,59526:38329,59527:38334,59528:38346,59529:28662,59530:38339,59531:38349,59532:38348,59533:38357,59534:38356,59535:38358,59536:38364,59537:38369,59538:38373,59539:38370,59540:38433,59541:38440,59542:38446,59543:38447,59544:38466,59545:38476,59546:38479,59547:38475,59548:38519,59549:38492,59550:38494,59551:38493,59552:38495,59553:38502,59554:38514,59555:38508,59556:38541,59557:38552,59558:38549,59559:38551,59560:38570,59561:38567,59562:38577,59563:38578,59564:38576,59565:38580,59566:38582,59567:38584,59568:38585,59569:38606,59570:38603,59571:38601,59572:38605,59573:35149,59574:38620,59575:38669,59576:38613,59577:38649,59578:38660,59579:38662,59580:38664,59581:38675,59582:38670,59583:38673,59584:38671,59585:38678,59586:38681,59587:38692,59588:38698,59589:38704,59590:38713,59591:38717,59592:38718,59593:38724,59594:38726,59595:38728,59596:38722,59597:38729,59598:38748,59599:38752,59600:38756,59601:38758,59602:38760,59603:21202,59604:38763,59605:38769,59606:38777,59607:38789,59608:38780,59609:38785,59610:38778,59611:38790,59612:38795,59613:38799,59614:38800,59615:38812,59616:38824,59617:38822,59618:38819,59619:38835,59620:38836,59621:38851,59622:38854,59623:38856,59624:38859,59625:38876,59626:38893,59627:40783,59628:38898,59629:31455,59630:38902,59631:38901,59632:38927,59633:38924,59634:38968,59635:38948,59636:38945,59637:38967,59638:38973,59639:38982,59640:38991,59641:38987,59642:39019,59643:39023,59644:39024,59712:39025,59713:39028,59714:39027,59715:39082,59716:39087,59717:39089,59718:39094,59719:39108,59720:39107,59721:39110,59722:39145,59723:39147,59724:39171,59725:39177,59726:39186,59727:39188,59728:39192,59729:39201,59730:39197,59731:39198,59732:39204,59733:39200,59734:39212,59735:39214,59736:39229,59737:39230,59738:39234,59739:39241,59740:39237,59741:39248,59742:39243,59743:39249,59744:39250,59745:39244,59746:39253,59747:39319,59748:39320,59749:39333,59750:39341,59751:39342,59752:39356,59753:39391,59754:39387,59755:39389,59756:39384,59757:39377,59758:39405,59759:39406,59760:39409,59761:39410,59762:39419,59763:39416,59764:39425,59765:39439,59766:39429,59767:39394,59768:39449,59769:39467,59770:39479,59771:39493,59772:39490,59773:39488,59774:39491,59776:39486,59777:39509,59778:39501,59779:39515,59780:39511,59781:39519,59782:39522,59783:39525,59784:39524,59785:39529,59786:39531,59787:39530,59788:39597,59789:39600,59790:39612,59791:39616,59792:39631,59793:39633,59794:39635,59795:39636,59796:39646,59797:39647,59798:39650,59799:39651,59800:39654,59801:39663,59802:39659,59803:39662,59804:39668,59805:39665,59806:39671,59807:39675,59808:39686,59809:39704,59810:39706,59811:39711,59812:39714,59813:39715,59814:39717,59815:39719,59816:39720,59817:39721,59818:39722,59819:39726,59820:39727,59821:39730,59822:39748,59823:39747,59824:39759,59825:39757,59826:39758,59827:39761,59828:39768,59829:39796,59830:39827,59831:39811,59832:39825,59833:39830,59834:39831,59835:39839,59836:39840,59837:39848,59838:39860,59839:39872,59840:39882,59841:39865,59842:39878,59843:39887,59844:39889,59845:39890,59846:39907,59847:39906,59848:39908,59849:39892,59850:39905,59851:39994,59852:39922,59853:39921,59854:39920,59855:39957,59856:39956,59857:39945,59858:39955,59859:39948,59860:39942,59861:39944,59862:39954,59863:39946,59864:39940,59865:39982,59866:39963,59867:39973,59868:39972,59869:39969,59870:39984,59871:40007,59872:39986,59873:40006,59874:39998,59875:40026,59876:40032,59877:40039,59878:40054,59879:40056,59880:40167,59881:40172,59882:40176,59883:40201,59884:40200,59885:40171,59886:40195,59887:40198,59888:40234,59889:40230,59890:40367,59891:40227,59892:40223,59893:40260,59894:40213,59895:40210,59896:40257,59897:40255,59898:40254,59899:40262,59900:40264,59968:40285,59969:40286,59970:40292,59971:40273,59972:40272,59973:40281,59974:40306,59975:40329,59976:40327,59977:40363,59978:40303,59979:40314,59980:40346,59981:40356,59982:40361,59983:40370,59984:40388,59985:40385,59986:40379,59987:40376,59988:40378,59989:40390,59990:40399,59991:40386,59992:40409,59993:40403,59994:40440,59995:40422,59996:40429,59997:40431,59998:40445,59999:40474,6e4:40475,60001:40478,60002:40565,60003:40569,60004:40573,60005:40577,60006:40584,60007:40587,60008:40588,60009:40594,60010:40597,60011:40593,60012:40605,60013:40613,60014:40617,60015:40632,60016:40618,60017:40621,60018:38753,60019:40652,60020:40654,60021:40655,60022:40656,60023:40660,60024:40668,60025:40670,60026:40669,60027:40672,60028:40677,60029:40680,60030:40687,60032:40692,60033:40694,60034:40695,60035:40697,60036:40699,60037:40700,60038:40701,60039:40711,60040:40712,60041:30391,60042:40725,60043:40737,60044:40748,60045:40766,60046:40778,60047:40786,60048:40788,60049:40803,60050:40799,60051:40800,60052:40801,60053:40806,60054:40807,60055:40812,60056:40810,60057:40823,60058:40818,60059:40822,60060:40853,60061:40860,60062:40864,60063:22575,60064:27079,60065:36953,60066:29796,60067:20956,60068:29081}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(1),c=r(2);e.decode=function(o,e){var r=new Uint8ClampedArray(o.length);r.set(o);for(var s=new t.default(285,256,0),a=new c.default(s,r),n=new Uint8ClampedArray(e),d=!1,l=0;l<e;l++){var i=a.evaluateAt(s.exp(l+s.generatorBase));n[n.length-1-l]=i,0!==i&&(d=!0)}if(!d)return r;var B=new c.default(s,n),k=function(o,e,r,t){var c;e.degree()<r.degree()&&(e=(c=[r,e])[0],r=c[1]);for(var s=e,a=r,n=o.zero,d=o.one;a.degree()>=t/2;){var l=s,i=n;if(n=d,(s=a).isZero())return null;a=l;for(var B=o.zero,k=s.getCoefficient(s.degree()),u=o.inverse(k);a.degree()>=s.degree()&&!a.isZero();){var C=a.degree()-s.degree(),m=o.multiply(a.getCoefficient(a.degree()),u);B=B.addOrSubtract(o.buildMonomial(C,m)),a=a.addOrSubtract(s.multiplyByMonomial(C,m))}if(d=B.multiplyPoly(n).addOrSubtract(i),a.degree()>=s.degree())return null}var f=d.getCoefficient(0);if(0===f)return null;var w=o.inverse(f);return[d.multiply(w),a.multiply(w)]}(s,s.buildMonomial(e,1),B,e);if(null===k)return null;var u=function(o,e){var r=e.degree();if(1===r)return[e.getCoefficient(1)];for(var t=new Array(r),c=0,s=1;s<o.size&&c<r;s++)0===e.evaluateAt(s)&&(t[c]=o.inverse(s),c++);return c!==r?null:t}(s,k[0]);if(null==u)return null;for(var C=function(o,e,r){for(var c=r.length,s=new Array(c),a=0;a<c;a++){for(var n=o.inverse(r[a]),d=1,l=0;l<c;l++)a!==l&&(d=o.multiply(d,t.addOrSubtractGF(1,o.multiply(r[l],n))));s[a]=o.multiply(e.evaluateAt(n),o.inverse(d)),0!==o.generatorBase&&(s[a]=o.multiply(s[a],n))}return s}(s,k[1],u),m=0;m<u.length;m++){var f=r.length-1-s.log(u[m]);if(f<0)return null;r[f]=t.addOrSubtractGF(r[f],C[m])}return r}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.VERSIONS=[{infoBits:null,versionNumber:1,alignmentPatternCenters:[],errorCorrectionLevels:[{ecCodewordsPerBlock:7,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:19}]},{ecCodewordsPerBlock:10,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:16}]},{ecCodewordsPerBlock:13,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:13}]},{ecCodewordsPerBlock:17,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:9}]}]},{infoBits:null,versionNumber:2,alignmentPatternCenters:[6,18],errorCorrectionLevels:[{ecCodewordsPerBlock:10,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:34}]},{ecCodewordsPerBlock:16,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:28}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:22}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:16}]}]},{infoBits:null,versionNumber:3,alignmentPatternCenters:[6,22],errorCorrectionLevels:[{ecCodewordsPerBlock:15,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:55}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:44}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:17}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:13}]}]},{infoBits:null,versionNumber:4,alignmentPatternCenters:[6,26],errorCorrectionLevels:[{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:80}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:32}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:24}]},{ecCodewordsPerBlock:16,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:9}]}]},{infoBits:null,versionNumber:5,alignmentPatternCenters:[6,30],errorCorrectionLevels:[{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:108}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:43}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:15},{numBlocks:2,dataCodewordsPerBlock:16}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:11},{numBlocks:2,dataCodewordsPerBlock:12}]}]},{infoBits:null,versionNumber:6,alignmentPatternCenters:[6,34],errorCorrectionLevels:[{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:68}]},{ecCodewordsPerBlock:16,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:27}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:19}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:15}]}]},{infoBits:31892,versionNumber:7,alignmentPatternCenters:[6,22,38],errorCorrectionLevels:[{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:78}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:31}]},{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:14},{numBlocks:4,dataCodewordsPerBlock:15}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:13},{numBlocks:1,dataCodewordsPerBlock:14}]}]},{infoBits:34236,versionNumber:8,alignmentPatternCenters:[6,24,42],errorCorrectionLevels:[{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:97}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:38},{numBlocks:2,dataCodewordsPerBlock:39}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:18},{numBlocks:2,dataCodewordsPerBlock:19}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:14},{numBlocks:2,dataCodewordsPerBlock:15}]}]},{infoBits:39577,versionNumber:9,alignmentPatternCenters:[6,26,46],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:36},{numBlocks:2,dataCodewordsPerBlock:37}]},{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:16},{numBlocks:4,dataCodewordsPerBlock:17}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:12},{numBlocks:4,dataCodewordsPerBlock:13}]}]},{infoBits:42195,versionNumber:10,alignmentPatternCenters:[6,28,50],errorCorrectionLevels:[{ecCodewordsPerBlock:18,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:68},{numBlocks:2,dataCodewordsPerBlock:69}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:43},{numBlocks:1,dataCodewordsPerBlock:44}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:19},{numBlocks:2,dataCodewordsPerBlock:20}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:15},{numBlocks:2,dataCodewordsPerBlock:16}]}]},{infoBits:48118,versionNumber:11,alignmentPatternCenters:[6,30,54],errorCorrectionLevels:[{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:81}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:50},{numBlocks:4,dataCodewordsPerBlock:51}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:22},{numBlocks:4,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:12},{numBlocks:8,dataCodewordsPerBlock:13}]}]},{infoBits:51042,versionNumber:12,alignmentPatternCenters:[6,32,58],errorCorrectionLevels:[{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:92},{numBlocks:2,dataCodewordsPerBlock:93}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:36},{numBlocks:2,dataCodewordsPerBlock:37}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:20},{numBlocks:6,dataCodewordsPerBlock:21}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:14},{numBlocks:4,dataCodewordsPerBlock:15}]}]},{infoBits:55367,versionNumber:13,alignmentPatternCenters:[6,34,62],errorCorrectionLevels:[{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:107}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:37},{numBlocks:1,dataCodewordsPerBlock:38}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:20},{numBlocks:4,dataCodewordsPerBlock:21}]},{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:11},{numBlocks:4,dataCodewordsPerBlock:12}]}]},{infoBits:58893,versionNumber:14,alignmentPatternCenters:[6,26,46,66],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:115},{numBlocks:1,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:40},{numBlocks:5,dataCodewordsPerBlock:41}]},{ecCodewordsPerBlock:20,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:16},{numBlocks:5,dataCodewordsPerBlock:17}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:12},{numBlocks:5,dataCodewordsPerBlock:13}]}]},{infoBits:63784,versionNumber:15,alignmentPatternCenters:[6,26,48,70],errorCorrectionLevels:[{ecCodewordsPerBlock:22,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:87},{numBlocks:1,dataCodewordsPerBlock:88}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:41},{numBlocks:5,dataCodewordsPerBlock:42}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:24},{numBlocks:7,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:12},{numBlocks:7,dataCodewordsPerBlock:13}]}]},{infoBits:68472,versionNumber:16,alignmentPatternCenters:[6,26,50,74],errorCorrectionLevels:[{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:98},{numBlocks:1,dataCodewordsPerBlock:99}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:45},{numBlocks:3,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:19},{numBlocks:2,dataCodewordsPerBlock:20}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:15},{numBlocks:13,dataCodewordsPerBlock:16}]}]},{infoBits:70749,versionNumber:17,alignmentPatternCenters:[6,30,54,78],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:107},{numBlocks:5,dataCodewordsPerBlock:108}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:46},{numBlocks:1,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:22},{numBlocks:15,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:14},{numBlocks:17,dataCodewordsPerBlock:15}]}]},{infoBits:76311,versionNumber:18,alignmentPatternCenters:[6,30,56,82],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:120},{numBlocks:1,dataCodewordsPerBlock:121}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:9,dataCodewordsPerBlock:43},{numBlocks:4,dataCodewordsPerBlock:44}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:22},{numBlocks:1,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:14},{numBlocks:19,dataCodewordsPerBlock:15}]}]},{infoBits:79154,versionNumber:19,alignmentPatternCenters:[6,30,58,86],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:113},{numBlocks:4,dataCodewordsPerBlock:114}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:44},{numBlocks:11,dataCodewordsPerBlock:45}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:21},{numBlocks:4,dataCodewordsPerBlock:22}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:9,dataCodewordsPerBlock:13},{numBlocks:16,dataCodewordsPerBlock:14}]}]},{infoBits:84390,versionNumber:20,alignmentPatternCenters:[6,34,62,90],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:107},{numBlocks:5,dataCodewordsPerBlock:108}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:41},{numBlocks:13,dataCodewordsPerBlock:42}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:24},{numBlocks:5,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:15},{numBlocks:10,dataCodewordsPerBlock:16}]}]},{infoBits:87683,versionNumber:21,alignmentPatternCenters:[6,28,50,72,94],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:116},{numBlocks:4,dataCodewordsPerBlock:117}]},{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:42}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:22},{numBlocks:6,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:16},{numBlocks:6,dataCodewordsPerBlock:17}]}]},{infoBits:92361,versionNumber:22,alignmentPatternCenters:[6,26,50,74,98],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:111},{numBlocks:7,dataCodewordsPerBlock:112}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:24},{numBlocks:16,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:24,ecBlocks:[{numBlocks:34,dataCodewordsPerBlock:13}]}]},{infoBits:96236,versionNumber:23,alignmentPatternCenters:[6,30,54,74,102],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:121},{numBlocks:5,dataCodewordsPerBlock:122}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:47},{numBlocks:14,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:24},{numBlocks:14,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:16,dataCodewordsPerBlock:15},{numBlocks:14,dataCodewordsPerBlock:16}]}]},{infoBits:102084,versionNumber:24,alignmentPatternCenters:[6,28,54,80,106],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:117},{numBlocks:4,dataCodewordsPerBlock:118}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:45},{numBlocks:14,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:24},{numBlocks:16,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:30,dataCodewordsPerBlock:16},{numBlocks:2,dataCodewordsPerBlock:17}]}]},{infoBits:102881,versionNumber:25,alignmentPatternCenters:[6,32,58,84,110],errorCorrectionLevels:[{ecCodewordsPerBlock:26,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:106},{numBlocks:4,dataCodewordsPerBlock:107}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:47},{numBlocks:13,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:24},{numBlocks:22,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:22,dataCodewordsPerBlock:15},{numBlocks:13,dataCodewordsPerBlock:16}]}]},{infoBits:110507,versionNumber:26,alignmentPatternCenters:[6,30,58,86,114],errorCorrectionLevels:[{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:114},{numBlocks:2,dataCodewordsPerBlock:115}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:46},{numBlocks:4,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:28,dataCodewordsPerBlock:22},{numBlocks:6,dataCodewordsPerBlock:23}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:33,dataCodewordsPerBlock:16},{numBlocks:4,dataCodewordsPerBlock:17}]}]},{infoBits:110734,versionNumber:27,alignmentPatternCenters:[6,34,62,90,118],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:122},{numBlocks:4,dataCodewordsPerBlock:123}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:22,dataCodewordsPerBlock:45},{numBlocks:3,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:8,dataCodewordsPerBlock:23},{numBlocks:26,dataCodewordsPerBlock:24}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:15},{numBlocks:28,dataCodewordsPerBlock:16}]}]},{infoBits:117786,versionNumber:28,alignmentPatternCenters:[6,26,50,74,98,122],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:117},{numBlocks:10,dataCodewordsPerBlock:118}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:3,dataCodewordsPerBlock:45},{numBlocks:23,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:24},{numBlocks:31,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:15},{numBlocks:31,dataCodewordsPerBlock:16}]}]},{infoBits:119615,versionNumber:29,alignmentPatternCenters:[6,30,54,78,102,126],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:7,dataCodewordsPerBlock:116},{numBlocks:7,dataCodewordsPerBlock:117}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:21,dataCodewordsPerBlock:45},{numBlocks:7,dataCodewordsPerBlock:46}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:1,dataCodewordsPerBlock:23},{numBlocks:37,dataCodewordsPerBlock:24}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:15},{numBlocks:26,dataCodewordsPerBlock:16}]}]},{infoBits:126325,versionNumber:30,alignmentPatternCenters:[6,26,52,78,104,130],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:5,dataCodewordsPerBlock:115},{numBlocks:10,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:47},{numBlocks:10,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:15,dataCodewordsPerBlock:24},{numBlocks:25,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:23,dataCodewordsPerBlock:15},{numBlocks:25,dataCodewordsPerBlock:16}]}]},{infoBits:127568,versionNumber:31,alignmentPatternCenters:[6,30,56,82,108,134],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:13,dataCodewordsPerBlock:115},{numBlocks:3,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:46},{numBlocks:29,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:42,dataCodewordsPerBlock:24},{numBlocks:1,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:23,dataCodewordsPerBlock:15},{numBlocks:28,dataCodewordsPerBlock:16}]}]},{infoBits:133589,versionNumber:32,alignmentPatternCenters:[6,34,60,86,112,138],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:115}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:46},{numBlocks:23,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:24},{numBlocks:35,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:15},{numBlocks:35,dataCodewordsPerBlock:16}]}]},{infoBits:136944,versionNumber:33,alignmentPatternCenters:[6,30,58,86,114,142],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:115},{numBlocks:1,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:14,dataCodewordsPerBlock:46},{numBlocks:21,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:29,dataCodewordsPerBlock:24},{numBlocks:19,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:11,dataCodewordsPerBlock:15},{numBlocks:46,dataCodewordsPerBlock:16}]}]},{infoBits:141498,versionNumber:34,alignmentPatternCenters:[6,34,62,90,118,146],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:13,dataCodewordsPerBlock:115},{numBlocks:6,dataCodewordsPerBlock:116}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:14,dataCodewordsPerBlock:46},{numBlocks:23,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:44,dataCodewordsPerBlock:24},{numBlocks:7,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:59,dataCodewordsPerBlock:16},{numBlocks:1,dataCodewordsPerBlock:17}]}]},{infoBits:145311,versionNumber:35,alignmentPatternCenters:[6,30,54,78,102,126,150],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:121},{numBlocks:7,dataCodewordsPerBlock:122}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:12,dataCodewordsPerBlock:47},{numBlocks:26,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:39,dataCodewordsPerBlock:24},{numBlocks:14,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:22,dataCodewordsPerBlock:15},{numBlocks:41,dataCodewordsPerBlock:16}]}]},{infoBits:150283,versionNumber:36,alignmentPatternCenters:[6,24,50,76,102,128,154],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:121},{numBlocks:14,dataCodewordsPerBlock:122}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:6,dataCodewordsPerBlock:47},{numBlocks:34,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:46,dataCodewordsPerBlock:24},{numBlocks:10,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:2,dataCodewordsPerBlock:15},{numBlocks:64,dataCodewordsPerBlock:16}]}]},{infoBits:152622,versionNumber:37,alignmentPatternCenters:[6,28,54,80,106,132,158],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:17,dataCodewordsPerBlock:122},{numBlocks:4,dataCodewordsPerBlock:123}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:29,dataCodewordsPerBlock:46},{numBlocks:14,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:49,dataCodewordsPerBlock:24},{numBlocks:10,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:24,dataCodewordsPerBlock:15},{numBlocks:46,dataCodewordsPerBlock:16}]}]},{infoBits:158308,versionNumber:38,alignmentPatternCenters:[6,32,58,84,110,136,162],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:4,dataCodewordsPerBlock:122},{numBlocks:18,dataCodewordsPerBlock:123}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:13,dataCodewordsPerBlock:46},{numBlocks:32,dataCodewordsPerBlock:47}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:48,dataCodewordsPerBlock:24},{numBlocks:14,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:42,dataCodewordsPerBlock:15},{numBlocks:32,dataCodewordsPerBlock:16}]}]},{infoBits:161089,versionNumber:39,alignmentPatternCenters:[6,26,54,82,110,138,166],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:20,dataCodewordsPerBlock:117},{numBlocks:4,dataCodewordsPerBlock:118}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:40,dataCodewordsPerBlock:47},{numBlocks:7,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:43,dataCodewordsPerBlock:24},{numBlocks:22,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:10,dataCodewordsPerBlock:15},{numBlocks:67,dataCodewordsPerBlock:16}]}]},{infoBits:167017,versionNumber:40,alignmentPatternCenters:[6,30,58,86,114,142,170],errorCorrectionLevels:[{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:19,dataCodewordsPerBlock:118},{numBlocks:6,dataCodewordsPerBlock:119}]},{ecCodewordsPerBlock:28,ecBlocks:[{numBlocks:18,dataCodewordsPerBlock:47},{numBlocks:31,dataCodewordsPerBlock:48}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:34,dataCodewordsPerBlock:24},{numBlocks:34,dataCodewordsPerBlock:25}]},{ecCodewordsPerBlock:30,ecBlocks:[{numBlocks:20,dataCodewordsPerBlock:15},{numBlocks:61,dataCodewordsPerBlock:16}]}]}]},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(0);function c(o,e,r,t){var c=o.x-e.x+r.x-t.x,s=o.y-e.y+r.y-t.y;if(0===c&&0===s)return{a11:e.x-o.x,a12:e.y-o.y,a13:0,a21:r.x-e.x,a22:r.y-e.y,a23:0,a31:o.x,a32:o.y,a33:1};var a=e.x-r.x,n=t.x-r.x,d=e.y-r.y,l=t.y-r.y,i=a*l-n*d,B=(c*l-n*s)/i,k=(a*s-c*d)/i;return{a11:e.x-o.x+B*e.x,a12:e.y-o.y+B*e.y,a13:B,a21:t.x-o.x+k*t.x,a22:t.y-o.y+k*t.y,a23:k,a31:o.x,a32:o.y,a33:1}}e.extract=function(o,e){for(var r,s,a=function(o,e,r,t){var s=c(o,e,r,t);return{a11:s.a22*s.a33-s.a23*s.a32,a12:s.a13*s.a32-s.a12*s.a33,a13:s.a12*s.a23-s.a13*s.a22,a21:s.a23*s.a31-s.a21*s.a33,a22:s.a11*s.a33-s.a13*s.a31,a23:s.a13*s.a21-s.a11*s.a23,a31:s.a21*s.a32-s.a22*s.a31,a32:s.a12*s.a31-s.a11*s.a32,a33:s.a11*s.a22-s.a12*s.a21}}({x:3.5,y:3.5},{x:e.dimension-3.5,y:3.5},{x:e.dimension-6.5,y:e.dimension-6.5},{x:3.5,y:e.dimension-3.5}),n=c(e.topLeft,e.topRight,e.alignmentPattern,e.bottomLeft),d=(s=a,{a11:(r=n).a11*s.a11+r.a21*s.a12+r.a31*s.a13,a12:r.a12*s.a11+r.a22*s.a12+r.a32*s.a13,a13:r.a13*s.a11+r.a23*s.a12+r.a33*s.a13,a21:r.a11*s.a21+r.a21*s.a22+r.a31*s.a23,a22:r.a12*s.a21+r.a22*s.a22+r.a32*s.a23,a23:r.a13*s.a21+r.a23*s.a22+r.a33*s.a23,a31:r.a11*s.a31+r.a21*s.a32+r.a31*s.a33,a32:r.a12*s.a31+r.a22*s.a32+r.a32*s.a33,a33:r.a13*s.a31+r.a23*s.a32+r.a33*s.a33}),l=t.BitMatrix.createEmpty(e.dimension,e.dimension),i=function(o,e){var r=d.a13*o+d.a23*e+d.a33;return{x:(d.a11*o+d.a21*e+d.a31)/r,y:(d.a12*o+d.a22*e+d.a32)/r}},B=0;B<e.dimension;B++)for(var k=0;k<e.dimension;k++){var u=i(k+.5,B+.5);l.set(k,B,o.get(Math.floor(u.x),Math.floor(u.y)))}return{matrix:l,mappingFunction:i}}},function(o,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=function(o,e){return Math.sqrt(Math.pow(e.x-o.x,2)+Math.pow(e.y-o.y,2))};function c(o){return o.reduce((function(o,e){return o+e}))}function s(o,e,r,c){var s,a,n,d,l=[{x:Math.floor(o.x),y:Math.floor(o.y)}],i=Math.abs(e.y-o.y)>Math.abs(e.x-o.x);i?(s=Math.floor(o.y),a=Math.floor(o.x),n=Math.floor(e.y),d=Math.floor(e.x)):(s=Math.floor(o.x),a=Math.floor(o.y),n=Math.floor(e.x),d=Math.floor(e.y));for(var B=Math.abs(n-s),k=Math.abs(d-a),u=Math.floor(-B/2),C=s<n?1:-1,m=a<d?1:-1,f=!0,w=s,P=a;w!==n+C;w+=C){var v=i?P:w,h=i?w:P;if(r.get(v,h)!==f&&(f=!f,l.push({x:v,y:h}),l.length===c+1))break;if((u+=k)>0){if(P===d)break;P+=m,u-=B}}for(var y=[],p=0;p<c;p++)l[p]&&l[p+1]?y.push(t(l[p],l[p+1])):y.push(0);return y}function a(o,e,r,t){var c,a=e.y-o.y,n=e.x-o.x,d=s(o,e,r,Math.ceil(t/2)),l=s(o,{x:o.x-n,y:o.y-a},r,Math.ceil(t/2)),i=d.shift()+l.shift()-1;return(c=l.concat(i)).concat.apply(c,d)}function n(o,e){var r=c(o)/c(e),t=0;return e.forEach((function(e,c){t+=Math.pow(o[c]-e*r,2)})),{averageSize:r,error:t}}function d(o,e,r){try{var t=a(o,{x:-1,y:o.y},r,e.length),c=a(o,{x:o.x,y:-1},r,e.length),s=a(o,{x:Math.max(0,o.x-o.y)-1,y:Math.max(0,o.y-o.x)-1},r,e.length),d=a(o,{x:Math.min(r.width,o.x+o.y)+1,y:Math.min(r.height,o.y+o.x)+1},r,e.length),l=n(t,e),i=n(c,e),B=n(s,e),k=n(d,e),u=Math.sqrt(l.error*l.error+i.error*i.error+B.error*B.error+k.error*k.error),C=(l.averageSize+i.averageSize+B.averageSize+k.averageSize)/4;return u+(Math.pow(l.averageSize-C,2)+Math.pow(i.averageSize-C,2)+Math.pow(B.averageSize-C,2)+Math.pow(k.averageSize-C,2))/C}catch(o){return 1/0}}function l(o,e){for(var r=Math.round(e.x);o.get(r,Math.round(e.y));)r--;for(var t=Math.round(e.x);o.get(t,Math.round(e.y));)t++;for(var c=(r+t)/2,s=Math.round(e.y);o.get(Math.round(c),s);)s--;for(var a=Math.round(e.y);o.get(Math.round(c),a);)a++;return{x:c,y:(s+a)/2}}function i(o,e,r,s,n){var l,i,B;try{l=function(o,e,r,s){var n=(c(a(o,r,s,5))/7+c(a(o,e,s,5))/7+c(a(r,o,s,5))/7+c(a(e,o,s,5))/7)/4;if(n<1)throw new Error("Invalid module size");var d=Math.round(t(o,e)/n),l=Math.round(t(o,r)/n),i=Math.floor((d+l)/2)+7;switch(i%4){case 0:i++;break;case 2:i--}return{dimension:i,moduleSize:n}}(s,r,n,o),i=l.dimension,B=l.moduleSize}catch(o){return null}var k=r.x-s.x+n.x,u=r.y-s.y+n.y,C=(t(s,n)+t(s,r))/2/B,m=1-3/C,f={x:s.x+m*(k-s.x),y:s.y+m*(u-s.y)},w=e.map((function(e){var r=(e.top.startX+e.top.endX+e.bottom.startX+e.bottom.endX)/4,s=(e.top.y+e.bottom.y+1)/2;if(o.get(Math.floor(r),Math.floor(s))){var a=[e.top.endX-e.top.startX,e.bottom.endX-e.bottom.startX,e.bottom.y-e.top.y+1];c(a);return{x:r,y:s,score:d({x:Math.floor(r),y:Math.floor(s)},[1,1,1],o)+t({x:r,y:s},f)}}})).filter((function(o){return!!o})).sort((function(o,e){return o.score-e.score}));return{alignmentPattern:C>=15&&w.length?w[0]:f,dimension:i}}e.locate=function(o){for(var e=[],r=[],s=[],a=[],n=function(t){for(var n=0,d=!1,l=[0,0,0,0,0],i=function(e){var s=o.get(e,t);if(s===d)n++;else{l=[l[1],l[2],l[3],l[4],n],n=1,d=s;var i=c(l)/7,B=Math.abs(l[0]-i)<i&&Math.abs(l[1]-i)<i&&Math.abs(l[2]-3*i)<3*i&&Math.abs(l[3]-i)<i&&Math.abs(l[4]-i)<i&&!s,k=c(l.slice(-3))/3,u=Math.abs(l[2]-k)<k&&Math.abs(l[3]-k)<k&&Math.abs(l[4]-k)<k&&s;if(B){var C=e-l[3]-l[4],m=C-l[2],f={startX:m,endX:C,y:t};(w=r.filter((function(o){return m>=o.bottom.startX&&m<=o.bottom.endX||C>=o.bottom.startX&&m<=o.bottom.endX||m<=o.bottom.startX&&C>=o.bottom.endX&&l[2]/(o.bottom.endX-o.bottom.startX)<1.5&&l[2]/(o.bottom.endX-o.bottom.startX)>.5}))).length>0?w[0].bottom=f:r.push({top:f,bottom:f})}if(u){var w,P=e-l[4],v=P-l[3];f={startX:v,y:t,endX:P};(w=a.filter((function(o){return v>=o.bottom.startX&&v<=o.bottom.endX||P>=o.bottom.startX&&v<=o.bottom.endX||v<=o.bottom.startX&&P>=o.bottom.endX&&l[2]/(o.bottom.endX-o.bottom.startX)<1.5&&l[2]/(o.bottom.endX-o.bottom.startX)>.5}))).length>0?w[0].bottom=f:a.push({top:f,bottom:f})}}},B=-1;B<=o.width;B++)i(B);e.push.apply(e,r.filter((function(o){return o.bottom.y!==t&&o.bottom.y-o.top.y>=2}))),r=r.filter((function(o){return o.bottom.y===t})),s.push.apply(s,a.filter((function(o){return o.bottom.y!==t}))),a=a.filter((function(o){return o.bottom.y===t}))},B=0;B<=o.height;B++)n(B);e.push.apply(e,r.filter((function(o){return o.bottom.y-o.top.y>=2}))),s.push.apply(s,a);var k=e.filter((function(o){return o.bottom.y-o.top.y>=2})).map((function(e){var r=(e.top.startX+e.top.endX+e.bottom.startX+e.bottom.endX)/4,t=(e.top.y+e.bottom.y+1)/2;if(o.get(Math.round(r),Math.round(t))){var s=[e.top.endX-e.top.startX,e.bottom.endX-e.bottom.startX,e.bottom.y-e.top.y+1],a=c(s)/s.length;return{score:d({x:Math.round(r),y:Math.round(t)},[1,1,3,1,1],o),x:r,y:t,size:a}}})).filter((function(o){return!!o})).sort((function(o,e){return o.score-e.score})).map((function(o,e,r){if(e>4)return null;var t=r.filter((function(o,r){return e!==r})).map((function(e){return{x:e.x,y:e.y,score:e.score+Math.pow(e.size-o.size,2)/o.size,size:e.size}})).sort((function(o,e){return o.score-e.score}));if(t.length<2)return null;var c=o.score+t[0].score+t[1].score;return{points:[o].concat(t.slice(0,2)),score:c}})).filter((function(o){return!!o})).sort((function(o,e){return o.score-e.score}));if(0===k.length)return null;var u=function(o,e,r){var c,s,a,n,d,l,i,B=t(o,e),k=t(e,r),u=t(o,r);return k>=B&&k>=u?(d=(c=[e,o,r])[0],l=c[1],i=c[2]):u>=k&&u>=B?(d=(s=[o,e,r])[0],l=s[1],i=s[2]):(d=(a=[o,r,e])[0],l=a[1],i=a[2]),(i.x-l.x)*(d.y-l.y)-(i.y-l.y)*(d.x-l.x)<0&&(d=(n=[i,d])[0],i=n[1]),{bottomLeft:d,topLeft:l,topRight:i}}(k[0].points[0],k[0].points[1],k[0].points[2]),C=u.topRight,m=u.topLeft,f=u.bottomLeft,w=i(o,s,C,m,f),P=[];w&&P.push({alignmentPattern:{x:w.alignmentPattern.x,y:w.alignmentPattern.y},bottomLeft:{x:f.x,y:f.y},dimension:w.dimension,topLeft:{x:m.x,y:m.y},topRight:{x:C.x,y:C.y}});var v=l(o,C),h=l(o,m),y=l(o,f),p=i(o,s,v,h,y);return p&&P.push({alignmentPattern:{x:p.alignmentPattern.x,y:p.alignmentPattern.y},bottomLeft:{x:y.x,y:y.y},topLeft:{x:h.x,y:h.y},topRight:{x:v.x,y:v.y},dimension:p.dimension}),0===P.length?null:P}}]).default}));
//# sourceMappingURL=/sm/261261d91f249d4079ae119cfa50f739467d90fc365078a671172e0f499e862a.map
  return module.exports || (typeof jsQR !== 'undefined' ? jsQR : null);
})();
try { window.jsQR = jsQR; } catch(e) {}

/* =====================================================================
   🔄 محرك توليد أكواد QR ومحرك دمج الحضور بين الأجهزة (v42)
   ===================================================================== */
var qrcodegen = (function() {
  function QrCode(version, errorCorrectionLevel, dataCodewords, msk) {
    this.version = version;
    this.errorCorrectionLevel = errorCorrectionLevel;
    this.size = version * 4 + 17;
    var size = this.size;
    var modules = [];
    var isFunction = [];
    for (var y = 0; y < size; y++) {
      modules.push([]);
      isFunction.push([]);
      for (var x = 0; x < size; x++) {
        modules[y].push(false);
        isFunction[y].push(false);
      }
    }
    this.modules = modules;
    this.isFunction = isFunction;

    this.drawFunctionPatterns();
    var allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);

    if (msk == -1) {
      var minPenalty = 1e9;
      var bestMask = 0;
      for (var mask = 0; mask < 8; mask++) {
        this.applyMask(mask);
        this.drawFormatBits(mask);
        var penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestMask = mask;
        }
        this.applyMask(mask);
      }
      msk = bestMask;
    }
    this.mask = msk;
    this.applyMask(msk);
    this.drawFormatBits(msk);
    this.isFunction = [];
  }

  QrCode.prototype.getModule = function(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return false;
    return this.modules[y][x];
  };

  QrCode.prototype.setFunctionModule = function(x, y, isDark) {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  };

  QrCode.prototype.drawFunctionPatterns = function() {
    var size = this.size;
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(size - 4, 3);
    this.drawFinderPattern(3, size - 4);

    for (var i = 7; i < size - 7; i++) {
      this.setFunctionModule(6, i, i % 2 == 0);
      this.setFunctionModule(i, 6, i % 2 == 0);
    }

    var alignPos = QrCode.getAlignmentPatternPositions(this.version);
    var numAlign = alignPos.length;
    for (var i = 0; i < numAlign; i++) {
      for (var j = 0; j < numAlign; j++) {
        if ((i == 0 && j == 0) || (i == 0 && j == numAlign - 1) || (i == numAlign - 1 && j == 0)) continue;
        this.drawAlignmentPattern(alignPos[i], alignPos[j]);
      }
    }

    this.drawFormatBits(0);
    this.drawVersion();
  };

  QrCode.prototype.drawFinderPattern = function(x, y) {
    for (var dy = -4; dy <= 4; dy++) {
      for (var dx = -4; dx <= 4; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        var xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist != 2 && dist != 4);
        }
      }
    }
  };

  QrCode.prototype.drawAlignmentPattern = function(x, y) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) {
        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        this.setFunctionModule(x + dx, y + dy, dist != 1);
      }
    }
  };

  QrCode.prototype.drawFormatBits = function(mask) {
    var data = (this.errorCorrectionLevel.formatBits << 3) | mask;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;

    for (var i = 0; i <= 5; i++) this.setFunctionModule(8, i, ((bits >>> i) & 1) != 0);
    this.setFunctionModule(8, 7, ((bits >>> 6) & 1) != 0);
    this.setFunctionModule(8, 8, ((bits >>> 7) & 1) != 0);
    this.setFunctionModule(7, 8, ((bits >>> 8) & 1) != 0);
    for (var i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, ((bits >>> i) & 1) != 0);

    for (var i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, ((bits >>> i) & 1) != 0);
    for (var i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, ((bits >>> i) & 1) != 0);
    this.setFunctionModule(8, this.size - 8, true);
  };

  QrCode.prototype.drawVersion = function() {
    if (this.version < 7) return;
    var rem = this.version;
    for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    var bits = (this.version << 12) | rem;
    for (var i = 0; i < 18; i++) {
      var bit = ((bits >>> i) & 1) != 0;
      var a = this.size - 11 + (i % 3);
      var b = Math.floor(i / 3);
      this.setFunctionModule(a, b, bit);
      this.setFunctionModule(b, a, bit);
    }
  };

  QrCode.prototype.drawCodewords = function(data) {
    var bitLen = data.length * 8;
    var bitIndex = 0;
    var size = this.size;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right == 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j;
          var upwards = ((right + 1) & 2) == 0;
          var y = upwards ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && bitIndex < bitLen) {
            this.modules[y][x] = ((data[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) != 0;
            bitIndex++;
          }
        }
      }
    }
  };

  QrCode.prototype.applyMask = function(mask) {
    var size = this.size;
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        if (this.isFunction[y][x]) continue;
        var invert = false;
        switch (mask) {
          case 0: invert = (x + y) % 2 == 0; break;
          case 1: invert = y % 2 == 0; break;
          case 2: invert = x % 3 == 0; break;
          case 3: invert = (x + y) % 3 == 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) == 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 == 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 == 0; break;
        }
        if (invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  };

  QrCode.prototype.getPenaltyScore = function() {
    var size = this.size;
    var penalty = 0;
    for (var y = 0; y < size; y++) {
      var runColor = false, runLen = 0;
      for (var x = 0; x < size; x++) {
        if (this.modules[y][x] == runColor) {
          runLen++;
          if (runLen == 5) penalty += 3;
          else if (runLen > 5) penalty++;
        } else {
          runColor = this.modules[y][x];
          runLen = 1;
        }
      }
    }
    for (var x = 0; x < size; x++) {
      var runColor = false, runLen = 0;
      for (var y = 0; y < size; y++) {
        if (this.modules[y][x] == runColor) {
          runLen++;
          if (runLen == 5) penalty += 3;
          else if (runLen > 5) penalty++;
        } else {
          runColor = this.modules[y][x];
          runLen = 1;
        }
      }
    }
    return penalty;
  };

  QrCode.prototype.addEccAndInterleave = function(data) {
    var ver = this.version;
    var ecl = this.errorCorrectionLevel;
    var numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    var blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
    var rawCodewords = Math.floor(QrCode.getNumRawDataModules(ver) / 8);
    var numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    var shortBlockLen = Math.floor(rawCodewords / numBlocks);

    var blocks = [];
    var rsDiv = QrCode.reedSolomonComputeDivisor(blockEccLen);
    for (var i = 0, k = 0; i < numBlocks; i++) {
      var dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      var ecc = QrCode.reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }

    var result = [];
    for (var i = 0; i < blocks[0].length; i++) {
      for (var j = 0; j < blocks.length; j++) {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
          result.push(blocks[j][i]);
        }
      }
    }
    return result;
  };

  QrCode.prototype.toSvgString = function(border) {
    if (border === undefined) border = 2;
    var parts = [];
    var size = this.size;
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        if (this.modules[y][x]) {
          parts.push('M' + (x + border) + ',' + (y + border) + 'h1v1h-1z');
        }
      }
    }
    var fullSize = size + border * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + fullSize + ' ' + fullSize + '" width="100%" height="100%" shape-rendering="crispEdges" style="border-radius:8px">'
      + '<rect width="' + fullSize + '" height="' + fullSize + '" fill="#ffffff"/>'
      + '<path d="' + parts.join('') + '" fill="#1e293b"/>'
      + '</svg>';
  };

  QrCode.Ecc = {
    LOW: { ordinal: 0, formatBits: 1 },
    MEDIUM: { ordinal: 1, formatBits: 0 },
    QUARTILE: { ordinal: 2, formatBits: 3 },
    HIGH: { ordinal: 3, formatBits: 2 }
  };

  QrCode.getAlignmentPatternPositions = function(ver) {
    if (ver == 1) return [];
    var numAlign = Math.floor(ver / 7) + 2;
    var step = Math.floor((ver * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
    var size = ver * 4 + 17;
    var result = [6];
    for (var pos = size - 7; result.length < numAlign; pos -= step)
      result.splice(1, 0, pos);
    return result;
  };

  QrCode.getNumRawDataModules = function(ver) {
    var result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  };

  QrCode.reedSolomonComputeDivisor = function(degree) {
    var result = [];
    for (var i = 0; i < degree - 1; i++) result.push(0);
    result.push(1);
    var root = 1;
    for (var i = 0; i < degree; i++) {
      for (var j = 0; j < result.length; j++) {
        result[j] = QrCode.reedSolomonMultiply(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = QrCode.reedSolomonMultiply(root, 0x02);
    }
    return result;
  };

  QrCode.reedSolomonComputeRemainder = function(data, divisor) {
    var result = divisor.map(function() { return 0; });
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ result.shift();
      result.push(0);
      for (var j = 0; j < divisor.length; j++) result[j] ^= QrCode.reedSolomonMultiply(divisor[j], factor);
    }
    return result;
  };

  QrCode.reedSolomonMultiply = function(x, y) {
    if (x >>> 8 != 0 || y >>> 8 != 0) throw "Byte out of range";
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  };

  QrCode.ECC_CODEWORDS_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]
  ];

  QrCode.NUM_ERROR_CORRECTION_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
  ];

  function encodeText(text, ecl) {
    if (!ecl) ecl = QrCode.Ecc.LOW;
    var unescaped = unescape(encodeURIComponent(text));
    var bytes = [];
    for (var i = 0; i < unescaped.length; i++) bytes.push(unescaped.charCodeAt(i));

    for (var version = 1; version <= 40; version++) {
      var numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][version];
      var blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][version];
      var rawCodewords = Math.floor(QrCode.getNumRawDataModules(version) / 8);
      var capacity = rawCodewords - numBlocks * blockEccLen;
      var headerBits = 4 + (version <= 9 ? 8 : 16);
      if (bytes.length * 8 + headerBits <= capacity * 8) {
        var bitStream = [];
        pushBits(bitStream, 0x4, 4);
        pushBits(bitStream, bytes.length, version <= 9 ? 8 : 16);
        for (var b = 0; b < bytes.length; b++) pushBits(bitStream, bytes[b], 8);
        var termLen = Math.min(4, capacity * 8 - bitStream.length);
        pushBits(bitStream, 0, termLen);
        while (bitStream.length % 8 != 0) bitStream.push(0);
        var padByte = 0xEC;
        while (bitStream.length < capacity * 8) {
          pushBits(bitStream, padByte, 8);
          padByte ^= 0xEC ^ 0x11;
        }

        var codewords = [];
        for (var c = 0; c < bitStream.length; c += 8) {
          var val = 0;
          for (var b = 0; b < 8; b++) val = (val << 1) | bitStream[c + b];
          codewords.push(val);
        }

        return new QrCode(version, ecl, codewords, -1);
      }
    }
    throw "Data too long for QR Code";
  }

  function pushBits(stream, val, len) {
    for (var i = len - 1; i >= 0; i--) stream.push((val >>> i) & 1);
  }

  return { QrCode: QrCode, encodeText: encodeText };
})();

/* ---------- وظائف تصدير واستيراد ودمج الحضور ---------- */
function compressAttendancePayloadForQR(payload) {
  if (!payload) return '';
  const isSingle = (payload.scope === 'single_session' && payload.session);
  const targetSession = isSingle ? payload.session : (payload.sessions && payload.sessions[0]);
  const sessId = targetSession ? targetSession.id : 'sess_1';

  const stList = (payload.students || []).map(st => {
    const rec = (payload.records && payload.records[st.id] && payload.records[st.id][sessId]) || {};
    let sVal = 0;
    if (rec.status === 'present' || rec.status === 'st_done') sVal = 1;
    else if (rec.status === 'late') sVal = 2;
    else if (rec.status) sVal = rec.status;

    if (rec.note) {
      return [st.id, st.name, st.phone || '', sVal, rec.note];
    } else if (st.phone) {
      return [st.id, st.name, st.phone, sVal];
    } else {
      return [st.id, st.name, '', sVal];
    }
  });

  const compact = {
    _df: 1,
    lId: payload.lessonId,
    sId: sessId,
    lbl: targetSession ? targetSession.label : '',
    dt: targetSession ? (targetSession.date || '') : '',
    ch: payload.chunk ? [payload.chunk.part, payload.chunk.totalParts] : null,
    st: stList
  };

  return JSON.stringify(compact);
}

function normalizeAttendancePayload(p) {
  if (!p || typeof p !== 'object') return null;
  if (p.type === 'daftar-attendance-transfer' || (p.records && !p._df)) {
    return p;
  }
  if (p._df === 1) {
    const sessId = p.sId || 'sess_1';
    const sessObj = { id: sessId, label: p.lbl || 'حصة', date: p.dt || '' };
    const students = [];
    const records = {};

    (p.st || []).forEach(item => {
      const stId = item[0];
      const stName = item[1] || '';
      const stPhone = item[2] || '';
      const rawStatus = item[3];
      const note = item[4] || '';

      students.push({ id: stId, name: stName, phone: stPhone });

      let status = 'present';
      if (rawStatus === 1 || rawStatus === 'present' || rawStatus === '1') status = 'present';
      else if (rawStatus === 0 || rawStatus === 'absent' || rawStatus === '0') status = 'absent';
      else if (rawStatus === 2 || rawStatus === 'late' || rawStatus === '2') status = 'late';
      else if (typeof rawStatus === 'string') status = rawStatus;

      if (!records[stId]) records[stId] = {};
      records[stId][sessId] = { status: status, note: note };
    });

    return {
      type: 'daftar-attendance-transfer',
      version: 2,
      lessonId: p.lId,
      session: sessObj,
      sessions: [sessObj],
      students: students,
      records: records,
      chunk: p.ch ? { part: p.ch[0], totalParts: p.ch[1] } : null
    };
  }
  return null;
}

function computeAttendanceChunks(students, size) {
  if (!Array.isArray(students) || students.length === 0) return [[]];
  const s = parseInt(size, 10);
  if (!s || s >= students.length || s <= 0) return [students];
  const chunks = [];
  for (let i = 0; i < students.length; i += s) {
    chunks.push(students.slice(i, i + s));
  }
  return chunks;
}

function playQrBeepSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {}
}

function createAttendanceTransferPayload(lesson, sessionId, scope = 'single_session', studentSlice = null, chunkMeta = null) {
  if (!lesson) return null;
  const isSingle = (scope === 'single_session' && sessionId);
  const targetSessions = isSingle
    ? (lesson.sessions || []).filter(s => s.id === sessionId)
    : (lesson.sessions || []);

  const sessIds = targetSessions.map(s => s.id);
  const filteredRecords = {};

  const allStudents = lesson.students || [];
  const targetStudents = studentSlice || allStudents;

  targetStudents.forEach(st => {
    const stRec = lesson.records && lesson.records[st.id];
    if (stRec) {
      sessIds.forEach(sid => {
        if (stRec[sid] && stRec[sid].status) {
          if (!filteredRecords[st.id]) filteredRecords[st.id] = {};
          filteredRecords[st.id][sid] = {
            status: stRec[sid].status,
            ...(stRec[sid].note ? { note: stRec[sid].note } : {})
          };
        }
      });
    }
  });

  const payload = {
    type: 'daftar-attendance-transfer',
    version: 1,
    exportedAt: new Date().toISOString(),
    lessonId: lesson.lessonId || lesson.id,
    lessonName: lesson.lessonName || lesson.name,
    monthNumber: lesson.monthNumber || null,
    year: lesson.year || null,
    scope: isSingle ? 'single_session' : 'all_sessions',
    session: isSingle ? targetSessions[0] : null,
    sessions: targetSessions,
    students: targetStudents.map(st => ({ id: st.id, name: st.name, phone: st.phone || '' })),
    records: filteredRecords
  };

  if (chunkMeta) {
    payload.chunk = {
      part: chunkMeta.part,
      totalParts: chunkMeta.totalParts,
      chunkSize: chunkMeta.chunkSize,
      fromIndex: chunkMeta.fromIndex,
      toIndex: chunkMeta.toIndex,
      totalStudents: allStudents.length
    };
  }

  return payload;
}

function mergeAttendanceData(targetLesson, payload) {
  if (!targetLesson || !payload || !payload.records) {
    throw new Error('بيانات الحضور غير صالحة أو فارغة.');
  }

  const eff = effectiveStatuses(targetLesson);
  const incStudents = payload.students || [];
  const incSessions = payload.sessions || (payload.session ? [payload.session] : []);
  const incRecords = payload.records || {};

  if (!targetLesson.records) targetLesson.records = {};
  if (!targetLesson.students) targetLesson.students = [];
  if (!targetLesson.sessions) targetLesson.sessions = [];

  let updatedCount = 0;
  let newPresentCount = 0;
  let matchedStudentsCount = 0;
  let newStudentsAddedCount = 0;
  let unmatchedStudents = [];

  // 1. مطابقة الحصص (مرونة تامة مع التوليد التلقائي إن لزم)
  const sessionMap = {};
  incSessions.forEach((inSess, inSessIdx) => {
    // أ) مطابقة بالمعرّف
    let match = targetLesson.sessions.find(s => s.id === inSess.id);

    // ب) مطابقة بالتاريخ إن وُجد
    if (!match && inSess.date) {
      match = targetLesson.sessions.find(s => s.date && s.date === inSess.date);
    }

    // ج) مطابقة باسم الحصة بعد تنقيحه (Normalize)
    if (!match && inSess.label) {
      const normInLbl = normalizeForSearch(inSess.label);
      if (normInLbl) {
        match = targetLesson.sessions.find(s => normalizeForSearch(s.label) === normInLbl);
      }
    }

    // د) في حال تصدير حصة وحيدة، المطابقة بترتيب الحصة (Index) أو بالحصة الأولى
    if (!match && incSessions.length === 1) {
      if (targetLesson.sessions[inSessIdx]) {
        match = targetLesson.sessions[inSessIdx];
      } else if (targetLesson.sessions.length > 0) {
        match = targetLesson.sessions[0];
      }
    }

    // هـ) إذا لم توجد أي حصة مطابقة، ننشئ الحصة تلقائياً على الدرس حتى لا تضيع السجلات
    if (!match) {
      const newSessId = inSess.id || ('sess_' + Date.now() + '_' + inSessIdx);
      const newSess = {
        id: newSessId,
        label: inSess.label || ('حصة ' + (targetLesson.sessions.length + 1)),
        date: inSess.date || ''
      };
      targetLesson.sessions.push(newSess);
      match = newSess;
    }

    if (match) {
      sessionMap[inSess.id] = match;
    }
  });

  // 2. مطابقة الطلاب (مع إضافة الطلاب غير المسجلين تلقائياً لعدم إهدار الحضور)
  const studentMap = {};
  incStudents.forEach(inSt => {
    // أ) مطابقة بالمعرّف
    let match = targetLesson.students.find(st => st.id === inSt.id);

    // ب) مطابقة بالاسم المنقح
    if (!match && inSt.name) {
      const normName = normalizeForSearch(inSt.name);
      if (normName) {
        match = targetLesson.students.find(st => normalizeForSearch(st.name) === normName);
      }
    }

    // ج) مطابقة برقم الهاتف
    if (!match && inSt.phone) {
      const normP = normalizePhone(inSt.phone);
      if (normP) {
        match = targetLesson.students.find(st => normalizePhone(st.phone) === normP);
      }
    }

    // د) إن لم يُعثر على الطالب، نضيفه تلقائياً إلى طلاب الدرس الحالي
    if (!match) {
      const newStId = inSt.id || ('st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
      const newSt = {
        id: newStId,
        name: inSt.name || 'طالب جديد',
        phone: inSt.phone || '',
        guardianPhone: inSt.guardianPhone || '',
        extraPhones: inSt.extraPhones || [],
        guardianExtraPhones: inSt.guardianExtraPhones || [],
        address: inSt.address || '',
        notes: inSt.notes || ''
      };
      targetLesson.students.push(newSt);
      match = newSt;
      newStudentsAddedCount++;
    }

    if (match) {
      studentMap[inSt.id] = match;
      matchedStudentsCount++;
    }
  });

  // 3. تطبيق خوارزمية الدمج الذكي (الحاضر يغلب)
  Object.keys(incRecords).forEach(inStId => {
    const targetStudent = studentMap[inStId];
    if (!targetStudent) return;

    if (!targetLesson.records[targetStudent.id]) {
      targetLesson.records[targetStudent.id] = {};
    }

    const inStRecords = incRecords[inStId];
    Object.keys(inStRecords).forEach(inSessId => {
      const targetSess = sessionMap[inSessId];
      if (!targetSess) return;

      const curRec = targetLesson.records[targetStudent.id][targetSess.id] || {};
      const incRec = inStRecords[inSessId] || {};

      if (!incRec.status) return;

      const incIsPresent = isPresentStatus(incRec.status, eff);
      const curIsPresent = isPresentStatus(curRec.status, eff);

      let shouldUpdate = false;

      // أ) الوارد حاضر والحالي ليس حاضراً -> يُعتمد حاضراً
      if (incIsPresent && !curIsPresent) {
        shouldUpdate = true;
        newPresentCount++;
      }
      // ب) الحالي فارغ والوارد به حالة -> يُملأ بالحالة الواردة
      else if (!curRec.status && incRec.status) {
        shouldUpdate = true;
      }
      // ج) الحفاظ على الملاحظات إن كانت فارغة
      if (!curRec.note && incRec.note) {
        curRec.note = incRec.note;
      }

      if (shouldUpdate) {
        targetLesson.records[targetStudent.id][targetSess.id] = {
          ...curRec,
          status: incRec.status,
          note: curRec.note || incRec.note || ''
        };
        updatedCount++;
      }
    });
  });

  return {
    updatedCount,
    newPresentCount,
    matchedStudentsCount,
    newStudentsAddedCount,
    unmatchedStudents,
    sessionsCount: Object.keys(sessionMap).length,
    sessionLabel: payload.session ? payload.session.label : (incSessions.length + ' حصة'),
    chunk: payload.chunk || null
  };
}

function openAttendanceMergeModal(lesson, defaultSessionId = null, isArchive = false, archIdx = null) {
  if (!lesson) {
    alert('يرجى فتح درس أولاً لمشاركة ودمج الحضور.');
    return;
  }

  const sessions = lesson.sessions || [];
  const selectedSessionId = defaultSessionId || (sessions[0] ? sessions[0].id : null);
  const allStudents = lesson.students || [];

  let currentChunkSize = 15;
  let currentPart = 1;
  let currentPayload = null;

  const sessionOptions = sessions.length > 0
    ? sessions.map(s => '<option value="' + s.id + '"' + (s.id === selectedSessionId ? ' selected' : '') + '>' + esc(s.label) + (s.date ? ' (' + s.date + ')' : '') + '</option>').join('')
        + '<option value="__all__">📊 كل حصص الشهر دفعة واحدة (' + sessions.length + ' حصة)</option>'
    : '<option value="">لا توجد حصص</option>';

  const modalHTML = '<div style="text-align:right;direction:rtl;line-height:1.6">'
    + '<div class="lesson-subtabs" style="margin-bottom:14px">'
    +   '<button type="button" class="subtab-btn active" id="tab_att_share">' + appIcon('share-2', 13) + ' مشاركة حضور (تصدير / QR)</button>'
    +   '<button type="button" class="subtab-btn" id="tab_att_merge">' + appIcon('download', 13) + ' استيراد ودمج من جهاز آخر</button>'
    + '</div>'
    + '<div id="panel_att_share">'
    +   '<div class="form-row" style="margin-bottom:10px">'
    +     '<label style="font-size:12.5px;font-weight:700">اختر الحصة المراد مشاركتها مع الهاتف الآخر:</label>'
    +     '<select id="sel_att_share_session" style="width:100%;padding:8px 10px;font-size:13px;font-weight:700;border-radius:8px;border:1px solid var(--border);background:#fff">'
    +       sessionOptions
    +     '</select>'
    +   '</div>'
    +   '<div class="form-row" style="margin-bottom:12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px">'
    +     '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">'
    +       '<label style="font-size:12.5px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px">'
    +         appIcon('qr', 14) + ' تقسيم الطلاب لكل كود QR:'
    +       '</label>'
    +       '<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">'
    +         '<span style="font-size:11.5px;color:var(--muted)">العدد بالكود:</span>'
    +         '<input type="number" id="inp_att_chunk_size" value="15" min="5" max="250" style="width:52px;padding:3px 6px;text-align:center;font-weight:800;border:1px solid var(--border);border-radius:6px;font-size:12px">'
    +         '<div style="display:inline-flex;gap:3px">'
    +           '<button type="button" class="btn btn-outline btn-sm chunk-preset-btn" data-size="10" style="padding:2px 7px;font-size:11px">10</button>'
    +           '<button type="button" class="btn btn-primary btn-sm chunk-preset-btn" data-size="15" style="padding:2px 7px;font-size:11px">15</button>'
    +           '<button type="button" class="btn btn-outline btn-sm chunk-preset-btn" data-size="20" style="padding:2px 7px;font-size:11px">20</button>'
    +           '<button type="button" class="btn btn-outline btn-sm chunk-preset-btn" data-size="all" style="padding:2px 7px;font-size:11px">الكل</button>'
    +         '</div>'
    +       '</div>'
    +     '</div>'
    +     '<div id="att_chunk_info_bar" style="font-size:11.5px;color:var(--primary);font-weight:700;margin-top:4px"></div>'
    +   '</div>'
    +   '<div id="att_qr_wrap" style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:14px;margin:10px 0">'
    +     '<div id="att_qr_nav_bar" style="display:flex;align-items:center;justify-content:space-between;width:100%;max-width:320px;margin-bottom:8px;gap:6px">'
    +       '<button type="button" class="btn btn-outline btn-sm" id="btn_qr_prev_part" style="padding:4px 12px;font-weight:700">' + appIcon('chevron-right', 12) + ' السابق</button>'
    +       '<div style="text-align:center;flex:1">'
    +         '<span id="qr_part_badge" style="font-size:12.5px;font-weight:800;background:var(--primary);color:#fff;padding:3px 12px;border-radius:20px;display:inline-block">الجزء 1 من 1</span>'
    +       '</div>'
    +       '<button type="button" class="btn btn-outline btn-sm" id="btn_qr_next_part" style="padding:4px 12px;font-weight:700">التالي ' + appIcon('chevron-left', 12) + '</button>'
    +     '</div>'
    +     '<div id="att_qr_parts_pills" style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:8px"></div>'
    +     '<div id="att_qr_box" style="width:220px;height:220px;max-width:82vw;max-height:82vw;background:#fff;padding:8px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center"></div>'
    +     '<div id="att_qr_summary" style="font-size:12px;font-weight:700;color:var(--text);margin-top:10px;text-align:center"></div>'
    +     '<p class="muted" style="font-size:11.5px;margin:4px 0 0;text-align:center" id="att_qr_hint">افتح تطبيق دفتر على الهاتف الآخر، واضغط "دمج الحضور" ثم امسح هذا الكود بالكاميرا. ثم اضغط "التالي" لمسح الجزء التالي.</p>'
    +   '</div>'
    +   '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'
    +     '<button type="button" class="btn btn-outline btn-sm" id="btn_download_att_file" style="flex:1;min-width:140px">' + appIcon('share-2', 13) + ' تصدير / مشاركة ملف الحضور (.daftar-att)</button>'
    +     '<button type="button" class="btn btn-outline btn-sm" id="btn_copy_att_payload" style="flex:1;min-width:130px">' + appIcon('copy', 13) + ' نسخ كود هذا الجزء</button>'
    +   '</div>'
    + '</div>'
    + '<div id="panel_att_merge" style="display:none">'
    +   '<p style="font-size:13px;color:var(--text);margin-top:0">'
    +     'اختر الطريقة المناسبة لاستيراد ودمج حضور الطلاب المسجلين على الهاتف الآخر:'
    +   '</p>'
    +   '<div style="display:flex;flex-direction:column;gap:10px;margin:14px 0">'
    +     '<button type="button" class="btn btn-primary" id="btn_open_qr_camera" style="padding:12px 14px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:800">'
    +       appIcon('camera', 16) + ' مسح كود QR من شاشة الهاتف الآخر (كاميرا)'
    +     '</button>'
    +     '<button type="button" class="btn btn-outline" id="btn_pick_att_file" style="padding:12px 14px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:700">'
    +       appIcon('folder', 16) + ' اختيار ملف حضور (.daftar-att / .json)'
    +     '</button>'
    +     '<input type="file" id="inp_att_merge_file" accept=".daftar-att,application/json,.json" style="display:none">'
    +   '</div>'
    +   '<div style="border-top:1px dashed var(--border);padding-top:12px;margin-top:12px">'
    +     '<label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">أو الصق كود الحضور المنسوخ هنا:</label>'
    +     '<textarea id="txt_paste_att_payload" rows="3" placeholder="الصق كود الحضور المنسوخ هنا..." style="width:100%;font-size:11.5px;padding:6px;border-radius:6px;border:1px solid var(--border);font-family:monospace" dir="ltr"></textarea>'
    +     '<button type="button" class="btn btn-outline btn-sm" id="btn_apply_pasted_att" style="margin-top:6px;width:100%">' + appIcon('zap', 13) + ' دمج الكود المنسوخ الآن</button>'
    +   '</div>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:14px">'
    +   '<button class="btn" id="btn_close_att_modal">إغلاق</button>'
    + '</div>'
    + '</div>';

  openModal('🔄 دمج ومشاركة الحضور — ' + esc(lesson.lessonName || lesson.name), modalHTML);

  function updatePresetButtonsStyle() {
    $$('.chunk-preset-btn').forEach(b => {
      const sz = b.dataset.size;
      const isAct = (sz === 'all' && currentChunkSize >= allStudents.length) || (parseInt(sz, 10) === currentChunkSize);
      b.className = 'btn btn-sm chunk-preset-btn ' + (isAct ? 'btn-primary' : 'btn-outline');
    });
  }

  function updateQRCodeDisplay() {
    const selVal = $('#sel_att_share_session') ? $('#sel_att_share_session').value : '';
    const scope = (selVal === '__all__') ? 'all_sessions' : 'single_session';
    const sessId = (selVal === '__all__') ? null : selVal;

    const chunks = computeAttendanceChunks(allStudents, currentChunkSize);
    const totalParts = chunks.length;
    if (currentPart > totalParts) currentPart = totalParts;
    if (currentPart < 1) currentPart = 1;

    const currentSlice = (totalParts > 1) ? chunks[currentPart - 1] : allStudents;
    const fromIdx = (currentPart - 1) * currentChunkSize + 1;
    const toIdx = Math.min(currentPart * currentChunkSize, allStudents.length);

    const chunkMeta = (totalParts > 1) ? {
      part: currentPart,
      totalParts: totalParts,
      chunkSize: currentChunkSize,
      fromIndex: fromIdx,
      toIndex: toIdx
    } : null;

    currentPayload = createAttendanceTransferPayload(lesson, sessId, scope, currentSlice, chunkMeta);
    if (!currentPayload) return;

    const infoBar = $('#att_chunk_info_bar');
    if (infoBar) {
      if (totalParts > 1) {
        infoBar.innerHTML = '📊 مقسّم إلى <b>' + totalParts + ' أجزاء QR</b> (الطلاب من ' + fromIdx + ' إلى ' + toIdx + ' بهذا الكود)';
      } else {
        infoBar.innerHTML = '📊 كود QR موحد لكافة طلاب الدرس (' + allStudents.length + ' طالب)';
      }
    }

    const navBar = $('#att_qr_nav_bar');
    const prevBtn = $('#btn_qr_prev_part');
    const nextBtn = $('#btn_qr_next_part');
    const badge = $('#qr_part_badge');
    if (navBar) {
      navBar.style.display = (totalParts > 1) ? 'flex' : 'none';
    }
    if (prevBtn) {
      prevBtn.disabled = (currentPart <= 1);
      prevBtn.style.opacity = (currentPart <= 1) ? '0.45' : '1';
    }
    if (nextBtn) {
      nextBtn.disabled = (currentPart >= totalParts);
      nextBtn.style.opacity = (currentPart >= totalParts) ? '0.45' : '1';
    }
    if (badge) {
      badge.textContent = 'الجزء ' + currentPart + ' من ' + totalParts;
    }

    const pillsBox = $('#att_qr_parts_pills');
    if (pillsBox) {
      if (totalParts > 1 && totalParts <= 15) {
        pillsBox.innerHTML = chunks.map((_, idx) => {
          const pNum = idx + 1;
          const isActive = (pNum === currentPart);
          return '<button type="button" class="btn btn-sm ' + (isActive ? 'btn-primary' : 'btn-outline') + ' qr-pill-btn" data-part="' + pNum + '" style="padding:2px 8px;font-size:11px;font-weight:700;border-radius:12px">'
            + pNum
            + '</button>';
        }).join('');
        $$('.qr-pill-btn').forEach(pb => {
          pb.onclick = () => {
            currentPart = parseInt(pb.dataset.part, 10) || 1;
            updateQRCodeDisplay();
          };
        });
        pillsBox.style.display = 'flex';
      } else {
        pillsBox.style.display = 'none';
      }
    }

    const jsonStr = compressAttendancePayloadForQR(currentPayload);
    const summaryBox = $('#att_qr_summary');
    const qrBox = $('#att_qr_box');

    let recCount = 0;
    let presentCount = 0;
    const eff = effectiveStatuses(lesson);
    Object.values(currentPayload.records || {}).forEach(rMap => {
      Object.values(rMap || {}).forEach(r => {
        if (r && r.status) {
          recCount++;
          if (isPresentStatus(r.status, eff)) presentCount++;
        }
      });
    });

    if (summaryBox) {
      summaryBox.innerHTML = '📊 مسجلين في هذا الكود: <b>' + recCount + '</b> طالب (منهم <b style="color:#15803d">' + presentCount + ' حاضر</b>)'
        + (totalParts > 1 ? '<br><span style="font-size:11px;color:var(--muted)">[جزء ' + currentPart + ' من ' + totalParts + ']</span>' : '');
    }

    if (qrBox) {
      try {
        const qr = qrcodegen.encodeText(jsonStr, qrcodegen.QrCode.Ecc.LOW);
        qrBox.innerHTML = qr.toSvgString();
      } catch (err) {
        qrBox.innerHTML = '<div style="text-align:center;padding:12px;font-size:12px;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:8px">'
          + '⚠️ حجم بيانات الطلاب كبير على رمز QR واحد (' + currentSlice.length + ' طالب).<br>'
          + 'يرجى اختيار <b>10</b> أو <b>15</b> طالب لكل كود بالخيارات أعلاه لتقسيمهم، أو استخدام زر <b>تنزيل ملف الحضور</b>.'
          + '</div>';
      }
    }
  }

  updateQRCodeDisplay();

  if ($('#sel_att_share_session')) {
    $('#sel_att_share_session').onchange = () => {
      currentPart = 1;
      updateQRCodeDisplay();
    };
  }

  if ($('#inp_att_chunk_size')) {
    $('#inp_att_chunk_size').oninput = (e) => {
      const val = parseInt(e.target.value, 10);
      if (val && val > 0) {
        currentChunkSize = val;
        currentPart = 1;
        updatePresetButtonsStyle();
        updateQRCodeDisplay();
      }
    };
  }

  $$('.chunk-preset-btn').forEach(b => {
    b.onclick = () => {
      const sz = b.dataset.size;
      if (sz === 'all') {
        currentChunkSize = allStudents.length || 15;
      } else {
        currentChunkSize = parseInt(sz, 10) || 15;
      }
      if ($('#inp_att_chunk_size')) $('#inp_att_chunk_size').value = currentChunkSize;
      currentPart = 1;
      updatePresetButtonsStyle();
      updateQRCodeDisplay();
    };
  });

  if ($('#btn_qr_prev_part')) {
    $('#btn_qr_prev_part').onclick = () => {
      if (currentPart > 1) {
        currentPart--;
        updateQRCodeDisplay();
      }
    };
  }
  if ($('#btn_qr_next_part')) {
    $('#btn_qr_next_part').onclick = () => {
      const chunks = computeAttendanceChunks(allStudents, currentChunkSize);
      if (currentPart < chunks.length) {
        currentPart++;
        updateQRCodeDisplay();
      }
    };
  }

  // التبديل بين التابات
  const tabShare = $('#tab_att_share');
  const tabMerge = $('#tab_att_merge');
  const panelShare = $('#panel_att_share');
  const panelMerge = $('#panel_att_merge');

  if (tabShare && tabMerge) {
    tabShare.onclick = () => {
      tabShare.classList.add('active');
      tabMerge.classList.remove('active');
      panelShare.style.display = 'block';
      panelMerge.style.display = 'none';
    };
    tabMerge.onclick = () => {
      tabMerge.classList.add('active');
      tabShare.classList.remove('active');
      panelMerge.style.display = 'block';
      panelShare.style.display = 'none';
    };
  }

  // أزرار المشاركة
  if ($('#btn_download_att_file')) {
    $('#btn_download_att_file').onclick = () => {
      const selVal = $('#sel_att_share_session') ? $('#sel_att_share_session').value : '';
      const scope = (selVal === '__all__') ? 'all_sessions' : 'single_session';
      const sessId = (selVal === '__all__') ? null : selVal;
      const fullPayload = createAttendanceTransferPayload(lesson, sessId, scope, allStudents, null);
      if (!fullPayload) return;
      const safe = (lesson.name || lesson.lessonName || 'درس').replace(/[^\w\u0600-\u06FF ]/g, '').replace(/\s+/g, '_');
      const sName = fullPayload.session ? (fullPayload.session.label || 'حصة') : 'كل_الحصص';
      const fn = 'حضور_' + safe + '_' + sName + '_' + todayStr() + '.daftar-att';
      downloadBlob(JSON.stringify(fullPayload, null, 2), fn, 'application/json', { caption: 'ملف حضور طلاب من تطبيق دفتر 📘 (' + safe + ' - ' + sName + ')' });
    };
  }

  if ($('#btn_copy_att_payload')) {
    $('#btn_copy_att_payload').onclick = () => {
      if (!currentPayload) return;
      const str = JSON.stringify(currentPayload);
      const chunks = computeAttendanceChunks(allStudents, currentChunkSize);
      const partDesc = (chunks.length > 1) ? ' (الجزء ' + currentPart + ' من ' + chunks.length + ')' : '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(() => showToastMessage('📋 تم نسخ كود الحضور' + partDesc + ' إلى الحافظة.'));
      } else {
        fallbackCopy(str);
      }
    };
  }

  // أزرار الدمج والاستيراد
  if ($('#btn_pick_att_file')) {
    $('#btn_pick_att_file').onclick = () => {
      const inp = $('#inp_att_merge_file');
      if (inp) inp.click();
    };
  }

  if ($('#inp_att_merge_file')) {
    $('#inp_att_merge_file').onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          processIncomingAttendancePayload(lesson, normalizeAttendancePayload(parsed) || parsed, isArchive, archIdx);
        } catch (err) {
          alert('تعذّر قراءة ملف الحضور. يرجى التأكد من اختيار ملف صحيح.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    };
  }

  if ($('#btn_apply_pasted_att')) {
    $('#btn_apply_pasted_att').onclick = () => {
      const txt = $('#txt_paste_att_payload') ? $('#txt_paste_att_payload').value.trim() : '';
      if (!txt) {
        alert('يرجى لصق كود الحضور أولاً.');
        return;
      }
      try {
        const parsed = JSON.parse(txt);
        processIncomingAttendancePayload(lesson, normalizeAttendancePayload(parsed) || parsed, isArchive, archIdx);
      } catch (err) {
        alert('كود الحضور المنسوخ غير صالح أو غير مكتمل.');
      }
    };
  }

  if ($('#btn_open_qr_camera')) {
    $('#btn_open_qr_camera').onclick = () => {
      openCameraQRScannerModal(lesson, isArchive, archIdx);
    };
  }

  if ($('#btn_close_att_modal')) {
    $('#btn_close_att_modal').onclick = closeModal;
  }
}

function processIncomingAttendancePayload(lesson, payload, isArchive = false, archIdx = null) {
  try {
    const result = mergeAttendanceData(lesson, payload);
    saveState();
    if (isArchive && archIdx !== null) renderArchiveDetail(archIdx);
    else renderLessonDetail();
    closeModal();
    showMergeSuccessModal(lesson, result);
  } catch (err) {
    alert('حدث خطأ أثناء دمج الحضور: ' + (err.message || err));
  }
}

function showMergeSuccessModal(lesson, result) {
  const partsNotice = (result.partsCount && result.partsCount > 1)
    ? '<div style="background:#e0f2fe;border:1px solid #bae6fd;border-radius:8px;padding:8px;font-size:12px;color:#0369a1;margin-bottom:12px;text-align:center;font-weight:700">'
      + appIcon('qr', 13) + ' تم دمج ' + result.partsCount + ' أجزاء بنجاح عبر الكاميرا.'
      + '</div>'
    : (result.chunk
        ? '<div style="background:#e0f2fe;border:1px solid #bae6fd;border-radius:8px;padding:8px;font-size:12px;color:#0369a1;margin-bottom:12px;text-align:center;font-weight:700">'
          + appIcon('qr', 13) + ' تم دمج الجزء (' + result.chunk.part + ' من ' + result.chunk.totalParts + ') بنجاح.'
          + '</div>'
        : '');

  const addedNotice = (result.newStudentsAddedCount && result.newStudentsAddedCount > 0)
    ? '<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:8px 12px;font-size:12px;color:#065f46;margin-bottom:12px;text-align:center;font-weight:700">'
      + appIcon('plus', 13) + ' تم إضافة <b>' + result.newStudentsAddedCount + '</b> طالب جديد إلى قائمة طلاب الدرس تلقائياً ورصد حضورهم.'
      + '</div>'
    : '';

  const modalHTML = '<div style="text-align:right;direction:rtl;line-height:1.6">'
    + '<div style="text-align:center;margin-bottom:14px">'
    +   '<div style="margin-bottom:8px;color:#15803d">' + appIcon('check-circle', 42) + '</div>'
    +   '<h3 style="margin:0;color:var(--primary);font-size:17px">تم دمج الحضور بنجاح!</h3>'
    + '</div>'
    + partsNotice
    + addedNotice
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">'
    +   '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px;text-align:center">'
    +     '<div style="font-size:11.5px;color:#166534;font-weight:700">' + appIcon('check', 13) + ' حاضرون جدد تم اعتمادهم</div>'
    +     '<div style="font-size:20px;font-weight:800;color:#15803d;margin-top:2px">' + result.newPresentCount + '</div>'
    +   '</div>'
    +   '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">'
    +     '<div style="font-size:11.5px;color:var(--text);font-weight:700">' + appIcon('refresh', 13) + ' إجمالي السجلات المحدثة</div>'
    +     '<div style="font-size:20px;font-weight:800;color:var(--primary);margin-top:2px">' + result.updatedCount + '</div>'
    +   '</div>'
    + '</div>'
    + '<p style="font-size:12.5px;color:var(--text);margin:0 0 10px">'
    +   'تم شمول ومطابقة <b>' + result.matchedStudentsCount + '</b> طالب بنجاح، وتحديث الحصص بنظام «<b>الحاضر يغلب</b>» دون المساس بالحضور المسجل مسبقاً.'
    + '</p>'
    + (result.unmatchedStudents && result.unmatchedStudents.length > 0
        ? '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px;font-size:11px;color:#92400e;margin-bottom:10px">'
          + appIcon('alert', 12) + ' يوجد ' + result.unmatchedStudents.length + ' طالب في الملف لم يُعثر على أسمائهم في هذا الدرس: ' + esc(result.unmatchedStudents.slice(0, 5).join('، '))
          + '</div>'
        : '')
    + '<div class="modal-actions" style="margin-top:14px">'
    +   '<button class="btn btn-primary" id="btn_ack_merge_done">تم ومتابعة</button>'
    + '</div>'
    + '</div>';

  openModal('نتيجة دمج الحضور', modalHTML);
  if ($('#btn_ack_merge_done')) $('#btn_ack_merge_done').onclick = closeModal;
}

function openCameraQRScannerModal(lesson, isArchive = false, archIdx = null) {
  const modalHTML = '<div style="text-align:center;direction:rtl;line-height:1.6">'
    + '<p style="font-size:12.5px;color:var(--text);margin-top:0">'
    +   'وجّه الكاميرا نحو كود QR المعروض على شاشة الهاتف الآخر:'
    + '</p>'
    + '<div style="position:relative;width:100%;max-width:320px;height:240px;margin:0 auto;background:#000;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.15)">'
    +   '<video id="qr_camera_video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover"></video>'
    +   '<div id="qr_viewfinder_box" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:170px;height:170px;border:3px solid #22c55e;border-radius:14px;box-shadow:0 0 0 9999px rgba(0,0,0,0.45);transition:border-color .2s, box-shadow .2s;pointer-events:none">'
    +     '<div id="qr_laser_line" style="position:absolute;top:0;left:0;right:0;height:2px;background:#22c55e;box-shadow:0 0 10px #22c55e;animation:qrLaserAnim 2s infinite ease-in-out"></div>'
    +   '</div>'
    + '</div>'
    + '<style>@keyframes qrLaserAnim{0%{top:0%;opacity:0.8}50%{top:98%;opacity:1}100%{top:0%;opacity:0.8}}</style>'
    + '<div id="qr_scan_progress_wrap" style="margin-top:10px;min-height:48px">'
    +   '<div id="qr_scan_status" style="font-size:12px;color:var(--muted)">جاري تشغيل الكاميرا والبحث عن كود QR...</div>'
    +   '<div id="qr_parts_chips" style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-top:6px"></div>'
    + '</div>'
    + '<div class="modal-actions" style="margin-top:12px;display:flex;gap:8px;justify-content:center">'
    +   '<button class="btn btn-primary" id="btn_finish_qr_camera" style="font-weight:700">' + appIcon('check', 13) + ' إنهاء وعرض التقرير</button>'
    +   '<button class="btn btn-outline" id="btn_cancel_qr_camera">إلغاء</button>'
    + '</div>'
    + '</div>';

  openModal('📷 مسح كود QR الحضور', modalHTML);

  let stream = null;
  let animId = null;
  let isScanning = true;

  const scannedParts = new Set();
  let totalExpectedParts = null;
  const cumulativeResult = {
    updatedCount: 0,
    newPresentCount: 0,
    matchedStudentsCount: 0,
    unmatchedStudents: [],
    partsCount: 0,
    sessionLabel: ''
  };
  let lastScannedRaw = '';
  let lastScannedTime = 0;

  // In-memory canvas for fast pure JS decoding
  const scanCanvas = document.createElement('canvas');
  const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });

  let barcodeDetector = null;
  if ('BarcodeDetector' in window) {
    try {
      barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
    } catch (e) {
      barcodeDetector = null;
    }
  }

  function stopCamera() {
    isScanning = false;
    if (animId) cancelAnimationFrame(animId);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  function finishAndShowSummary() {
    stopCamera();
    closeModal();
    if (cumulativeResult.partsCount > 0) {
      showMergeSuccessModal(lesson, cumulativeResult);
    }
  }

  function cancelCameraScan() {
    stopCamera();
    closeModal();
  }

  if ($('#btn_finish_qr_camera')) {
    $('#btn_finish_qr_camera').onclick = finishAndShowSummary;
  }
  if ($('#btn_cancel_qr_camera')) {
    $('#btn_cancel_qr_camera').onclick = cancelCameraScan;
  }

  const modalCloseBtn = $('#modalClose');
  const onModalCloseCleanup = () => {
    stopCamera();
    window.removeEventListener('keydown', onEscKey);
  };
  const onEscKey = (e) => {
    if (e.key === 'Escape') onModalCloseCleanup();
  };
  window.addEventListener('keydown', onEscKey);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', onModalCloseCleanup, { once: true });

  const video = $('#qr_camera_video');
  const statusEl = $('#qr_scan_status');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (statusEl) statusEl.textContent = '❌ الكاميرا غير مدعومة في هذا المتصفح. يمكنك استخدام اختيار ملف الحضور أو لصق الكود.';
    return;
  }

  function handleDetectedRaw(raw, now) {
    if (!raw || !isScanning) return;

    // منع التكرار الفوري لنفس الكود خلال ثانيتين ونصف
    if (raw === lastScannedRaw && (now - lastScannedTime) < 2500) {
      if (isScanning) animId = requestAnimationFrame(scanFrame);
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      if (isScanning) animId = requestAnimationFrame(scanFrame);
      return;
    }

    const payload = normalizeAttendancePayload(parsed);
    if (!payload || !payload.records) {
      if (isScanning) animId = requestAnimationFrame(scanFrame);
      return;
    }

    // كود حضور صالح تم رصده!
    lastScannedRaw = raw;
    lastScannedTime = now;
    playQrBeepSound();

    // وميض أخضر لمحدد الكاميرا
    const vf = $('#qr_viewfinder_box');
    if (vf) {
      vf.style.borderColor = '#4ade80';
      vf.style.boxShadow = '0 0 24px #22c55e, 0 0 0 9999px rgba(0,0,0,0.55)';
      setTimeout(() => {
        if (vf) {
          vf.style.borderColor = '#22c55e';
          vf.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.45)';
        }
      }, 500);
    }

    try {
      const res = mergeAttendanceData(lesson, payload);
      saveState();
      if (isArchive && archIdx !== null) renderArchiveDetail(archIdx);
      else renderLessonDetail();

      cumulativeResult.updatedCount += res.updatedCount;
      cumulativeResult.newPresentCount += res.newPresentCount;
      cumulativeResult.matchedStudentsCount += res.matchedStudentsCount;
      (res.unmatchedStudents || []).forEach(u => {
        if (!cumulativeResult.unmatchedStudents.includes(u)) cumulativeResult.unmatchedStudents.push(u);
      });
      cumulativeResult.partsCount++;
      cumulativeResult.sessionLabel = res.sessionLabel || cumulativeResult.sessionLabel;

      if (payload.chunk) {
        const p = payload.chunk.part;
        const tot = payload.chunk.totalParts || 1;
        totalExpectedParts = tot;
        scannedParts.add(p);

        const stEl = $('#qr_scan_status');
        if (stEl) {
          stEl.innerHTML = '<div style="background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:8px;padding:6px 10px;font-size:12.5px;font-weight:700">'
            + '🟢 تم دمج الجزء (' + p + ' من ' + tot + ') بنجاح! (' + res.newPresentCount + ' حاضر جديد)<br>'
            + '<span style="font-size:11.5px;color:#15803d;font-weight:600">وجّه الكاميرا للجزء التالي على شاشة الهاتف الآخر...</span>'
            + '</div>';
        }

        const chipsEl = $('#qr_parts_chips');
        if (chipsEl && tot > 1) {
          let chHtml = '';
          for (let i = 1; i <= tot; i++) {
            const done = scannedParts.has(i);
            chHtml += '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;background:' + (done ? '#15803d' : '#e2e8f0') + ';color:' + (done ? '#fff' : '#64748b') + '">'
              + (done ? '✓ ' : '') + 'جزء ' + i
              + '</span>';
          }
          chipsEl.innerHTML = chHtml;
        }

        const finishBtn = $('#btn_finish_qr_camera');
        if (finishBtn) {
          finishBtn.textContent = '✅ إنهاء (تم دمج ' + scannedParts.size + ' من ' + tot + ')';
        }

        if (scannedParts.size >= tot) {
          if (stEl) {
            stEl.innerHTML = '<div style="background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:8px;padding:8px;font-size:13px;font-weight:800">'
              + '🎉 رائع! تم مسح ودمج جميع الأجزاء بالكامل (' + tot + ' من ' + tot + ')!'
              + '</div>';
          }
          setTimeout(() => {
            finishAndShowSummary();
          }, 1200);
          return;
        }
      } else {
        // كود كامل وحيد غير مقسم
        scannedParts.add(1);
        finishAndShowSummary();
        return;
      }
    } catch (err) {
      console.error('Merge error:', err);
    }

    if (isScanning) animId = requestAnimationFrame(scanFrame);
  }

  function scanWithJsQR(now) {
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw > 0 && vh > 0 && typeof jsQR === 'function') {
        let dw = vw;
        let dh = vh;
        if (dw > 640) {
          dw = 640;
          dh = Math.round((vh * 640) / vw);
        }
        if (scanCanvas.width !== dw || scanCanvas.height !== dh) {
          scanCanvas.width = dw;
          scanCanvas.height = dh;
        }
        scanCtx.drawImage(video, 0, 0, dw, dh);
        const imgData = scanCtx.getImageData(0, 0, dw, dh);
        let code = jsQR(imgData.data, dw, dh, { inversionAttempts: 'dontInvert' });
        if ((!code || !code.data) && isScanning) {
          code = jsQR(imgData.data, dw, dh, { inversionAttempts: 'attemptBoth' });
        }
        if (code && code.data && isScanning) {
          handleDetectedRaw(code.data, now);
          return;
        }
      }
    } catch (err) {}
    if (isScanning) animId = requestAnimationFrame(scanFrame);
  }

  function scanFrame() {
    if (!isScanning) return;
    if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
      const now = Date.now();
      if (barcodeDetector) {
        barcodeDetector.detect(video).then(barcodes => {
          if (barcodes && barcodes.length > 0 && isScanning) {
            handleDetectedRaw(barcodes[0].rawValue, now);
          } else if (isScanning) {
            scanWithJsQR(now);
          }
        }).catch(() => {
          if (isScanning) scanWithJsQR(now);
        });
      } else {
        scanWithJsQR(now);
      }
    } else {
      if (isScanning) animId = requestAnimationFrame(scanFrame);
    }
  }

  const cameraConstraints = {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 }
    }
  };

  navigator.mediaDevices.getUserMedia(cameraConstraints)
    .catch(() => navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }))
    .catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
    .then(mediaStream => {
      stream = mediaStream;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.play().catch(e => console.warn('Video play error:', e));
      }
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:var(--text);font-weight:700">📷 وجّه الكاميرا نحو كود QR...</span>';
      }
      animId = requestAnimationFrame(scanFrame);
    })
    .catch(err => {
      if (statusEl) {
        statusEl.textContent = '⚠️ تعذّر فتح الكاميرا (يرجى السماح بصلاحية الكاميرا أو استخدام رفع ملف الحضور).';
      }
    });
}
/* ---------- المودال ---------- */
function openModal(title, bodyHTML){
  $$('.dropdown-menu').forEach(m => { m.hidden = true; });
  pushAppHistory({ modal: true });
  $('#modalTitle').innerHTML = formatTitleWithIcon(title);
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
    + '<input type="text" class="g-wa" value="'+esc(g.waGroup||'')+'" placeholder="رابط جروب واتساب خاص بالمجموعة (اختياري)" dir="ltr" oninput="editingGroups['+gi+'].waGroup=this.value">'
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
  return '<button type="button" class="btn btn-outline btn-picker" data-pick="'+inputId+'" title="اختيار رقم من جهات الاتصال">' + appIcon('book-open', 12) + ' جهات الاتصال</button>';
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
  const eff = effectiveStatuses(lesson);
  const doneCount = ps.filter(s => (lesson.records[student.id]||{})[s.id] && isPresentStatus(lesson.records[student.id][s.id].status, eff)).length;
  const apolCount = ps.filter(s => (lesson.records[student.id]||{})[s.id] && isApologyStatus(lesson.records[student.id][s.id].status, eff)).length;
  const noansCount = ps.filter(s => (lesson.records[student.id]||{})[s.id] && isAbsentStatus(lesson.records[student.id][s.id].status, eff)).length;
  const pct = ps.length ? Math.round((doneCount / ps.length) * 100) : 0;
  const ind = ps.length > 0 ? attendanceIndicator(pct) : null;

  const avatarHTML = student.photo
    ? '<img src="'+student.photo+'" class="profile-avatar" alt="'+esc(student.name)+'">'
    : '<div class="profile-avatar-ph">'+esc((student.name||'').trim().charAt(0) || '👤')+'</div>';

  let contactsHTML = '';
  if(student.phone){
    contactsHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('smartphone', 13) + ' هاتف الطالب</span><span class="profile-val">' + esc(localPhone(student.phone)) + ' <a class="mini-btn mini-call" href="tel:'+esc(student.phone)+'">' + appIcon('phone', 11) + '</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+student.id+'" data-phone="'+esc(student.phone)+'">' + appIcon('whatsapp', 11) + ' واتساب</button></span></div>';
  }
  (student.extraPhones || []).forEach(p => {
    contactsHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('smartphone', 13) + ' هاتف إضافي</span><span class="profile-val">' + esc(localPhone(p)) + ' <a class="mini-btn mini-call" href="tel:'+esc(p)+'">' + appIcon('phone', 11) + '</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+student.id+'" data-phone="'+esc(p)+'">' + appIcon('whatsapp', 11) + ' واتساب</button></span></div>';
  });
  if(student.guardianPhone){
    contactsHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('user', 13) + ' ولي الأمر</span><span class="profile-val">' + esc(localPhone(student.guardianPhone)) + ' <a class="mini-btn mini-call" href="tel:'+esc(student.guardianPhone)+'">' + appIcon('phone', 11) + '</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+student.id+'" data-phone="'+esc(student.guardianPhone)+'">' + appIcon('whatsapp', 11) + ' واتساب</button></span></div>';
  }
  (student.guardianExtraPhones || []).forEach(p => {
    contactsHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('phone', 13) + ' هاتف إضافي لولي الأمر</span><span class="profile-val">' + esc(localPhone(p)) + ' <a class="mini-btn mini-call" href="tel:'+esc(p)+'">' + appIcon('phone', 11) + '</a> <button class="mini-btn mini-wa" data-act="wa" data-id="'+student.id+'" data-phone="'+esc(p)+'">' + appIcon('whatsapp', 11) + ' واتساب</button></span></div>';
  });

  let personalHTML = '';
  if(student.job) personalHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('briefcase', 13) + ' المهنة / الوظيفة</span><span class="profile-val">' + esc(student.job) + '</span></div>';
  if(student.age) personalHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('calendar', 13) + ' العمر</span><span class="profile-val">' + esc(student.age) + ' سنة</span></div>';
  if(student.address) personalHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('map-pin', 13) + ' السكن / العنوان</span><span class="profile-val">' + esc(student.address) + '</span></div>';
  const isHidden = (lesson.hiddenStudents || []).includes(student.id);
  personalHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('user-x', 13) + ' حالة الطالب</span><span class="profile-val">'
    + '<button class="btn btn-outline btn-sm" id="prof_toggle_hide" style="font-size:11.5px;font-weight:700;' + (isHidden ? 'color:#15803d;border-color:#86efac' : 'color:#b91c1c;border-color:#fca5a5') + '">'
    +   (isHidden ? appIcon('check', 11) + ' إلغاء الحجب واستعادة للجدول' : appIcon('user-x', 11) + ' حجب الطالب من الجدول والمراسلة')
    + '</button></span></div>';
  if(student.email) personalHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('mail', 13) + ' البريد الإلكتروني</span><span class="profile-val"><a href="mailto:'+esc(student.email)+'" dir="ltr">' + esc(student.email) + '</a></span></div>';
  (state.settings.customFields || []).forEach(cf => {
    const v = (student.fields || {})[cf.id];
    if(v) personalHTML += '<div class="profile-row"><span class="profile-label">' + appIcon('clipboard', 13) + ' ' + esc(cf.label) + '</span><span class="profile-val">' + esc(v) + '</span></div>';
  });

  let notesHTML = '';
  if(student.profileNotes){
    notesHTML = '<div class="profile-section"><div class="profile-sec-title">' + appIcon('file-text', 13) + ' ملاحظات خاصة بالطالب</div><div style="font-size:13px;line-height:1.6;white-space:pre-wrap">' + esc(student.profileNotes) + '</div></div>';
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
      +   '<span>' + appIcon('wallet', 13) + ' سجل المدفوعات والاشتراكات</span>'
      +   '<button class="btn btn-sm btn-primary" id="prof_add_payment" style="font-size:11px;padding:3px 8px">' + appIcon('plus', 11) + ' إضافة دفعة</button>'
      + '</div>'
      + '<div class="pay-summary-box">'
      +   '<div class="ps-row"><span>سعر الاشتراك الشهري:</span><span>' + moneyDisplay(subPrice) + ' ج.م</span></div>'
      +   '<div class="ps-row" style="color:#15803d"><span>إجمالي المدفوع:</span><span>' + moneyDisplay(totalPaid) + ' ج.م</span></div>'
      +   '<div class="ps-row" style="color:' + (remaining > 0 ? '#b91c1c' : '#15803d') + '"><span>المتبقي:</span><span>' + (remaining > 0 ? moneyDisplay(remaining) + ' ج.م' : 'تم السداد بالكامل ' + appIcon('check-circle', 12)) + '</span></div>'
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
          + '<button class="btn btn-danger btn-sm" style="padding:2px 6px;font-size:10px" data-del-pay="' + p.id + '" title="حذف هذه الدفعة">' + appIcon('trash', 11) + '</button>'
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
    +   (lesson.subscription ? '<span class="paid-toggle" style="margin:0">' + (student.paid ? appIcon('check', 11) + ' مسدد الاشتراك' : appIcon('x', 11) + ' لم يسدد') + '</span>' : '')
    +   (ind ? '<span class="badge-indicator" style="background:'+ind.color+'">' + esc(ind.label) + ' (' + pct + '%)</span>' : '')
    + '</div>'
    + '<div class="profile-section">'
    +   '<div class="profile-sec-title">' + appIcon('bar-chart-2', 13) + ' إحصائيات الحضور (الشهر الحالي)</div>'
    +   '<div class="profile-stats-grid">'
    +     '<div class="profile-stat-box"><div class="ps-num">' + ps.length + '</div><div class="ps-lbl">الحصص</div></div>'
    +     '<div class="profile-stat-box"><div class="ps-num" style="color:#15803d">' + doneCount + '</div><div class="ps-lbl">حضور</div></div>'
    +     '<div class="profile-stat-box"><div class="ps-num" style="color:#b45309">' + apolCount + '</div><div class="ps-lbl">اعتذار</div></div>'
    +     '<div class="profile-stat-box"><div class="ps-num" style="color:#b91c1c">' + noansCount + '</div><div class="ps-lbl">غياب</div></div>'
    +   '</div>'
    + '</div>'
    + (contactsHTML ? '<div class="profile-section"><div class="profile-sec-title">' + appIcon('phone', 13) + ' معلومات الاتصال</div>' + contactsHTML + '</div>' : '')
    + (personalHTML ? '<div class="profile-section"><div class="profile-sec-title">' + appIcon('user', 13) + ' البيانات الشخصية</div>' + personalHTML + '</div>' : '')
    + paymentsHTML
    + notesHTML
    + '</div>'
    + '<div class="modal-actions">'
    +   '<button class="btn btn-primary" id="prof_edit">' + appIcon('edit', 13) + ' تعديل بيانات الطالب</button>'
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
      const pay = (student.payments || []).find(x => x.id === payId);
      confirmDangerModal({
        title: '⚠️ حذف الدفعة',
        message: 'هل أنت متأكد من رغبتك في حذف هذه الدفعة من سجل الطالب؟',
        itemName: pay ? (pay.amount + ' ج.م بتاريخ ' + pay.date) : '',
        dangerNote: 'سيتم خصم هذه الدفعة من إجمالي تحصيلات الطالب.',
        onConfirm: () => {
          student.payments = (student.payments || []).filter(x => x.id !== payId);
          const newTotal = (student.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
          if(lesson.price > 0) student.paid = (newTotal >= lesson.price);
          saveState();
          renderLessonDetail();
          openStudentProfile(student, lesson);
          showToastMessage('🗑️ تم حذف الدفعة بنجاح.');
        }
      });
    };
  });
}

function studentForm(lesson, student, isArchive, archIdx){
  const isEdit = !!student;
  const isSub = lesson ? !!lesson.subscription : false;
  let photoBase64 = (student && student.photo) || '';
  const syncSwitchHTML = isArchive ? (
    '<div class="form-row" style="margin-top:10px;padding:8px 12px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0">'
    + '<label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-weight:bold;color:#166534">'
    +   '<span>🔄 تحديث هذه البيانات في الشهر الحالي تلقائياً</span>'
    +   '<input type="checkbox" id="f_syncCurrentMonth" checked style="width:20px;height:20px;accent-color:#15803d">'
    + '</label>'
    + '<div style="font-size:11px;color:#15803d;margin-top:4px">مزامنة الاسم والهاتف والعنوان وباقي البيانات الشخصية في الشهر الحالي للدرس وباقي الأرشيف.</div>'
    + '</div>'
  ) : '';

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
      + '<button type="button" class="btn btn-outline" id="addGuardianExtra" style="margin-top:6px">' + appIcon('plus', 12) + ' إضافة رقم آخر لولي الأمر</button>'
      + '</div>'
    : '';
  const extrasHTML = '<div class="form-row"><label>أرقام إضافية للطالب (اختياري)</label>'
      + '<div id="extraPhonesWrap"></div>'
      + '<button type="button" class="btn btn-outline" id="addExtraPhone" style="margin-top:6px">' + appIcon('plus', 12) + ' إضافة رقم آخر للطالب</button>'
      + '</div>';

  const photoHTML = '<div class="form-row"><label>صورة الطالب (اختياري - تُضغط كرمز شخصي)'
    + '<div class="photo-picker-wrap">'
    + '<input type="file" id="f_photo" accept="image/*" style="display:none">'
    + '<div id="photoPreviewWrap">' + (photoBase64 ? '<img src="'+photoBase64+'" class="photo-preview">' : '<div class="photo-preview-empty">👤</div>') + '</div>'
    + '<button type="button" class="btn btn-outline btn-sm" id="btnPickPhoto">' + appIcon('camera', 13) + ' اختيار صورة</button>'
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
    + syncSwitchHTML
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
      + '<button type="button" class="btn btn-danger btn-picker" data-del-row title="حذف الرقم">' + appIcon('trash', 12) + '</button>'
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
      + '<button type="button" class="btn btn-danger btn-picker" data-del-row title="حذف الرقم">' + appIcon('trash', 12) + '</button>'
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
      if(!Array.isArray(lesson.students)) lesson.students = [];
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

    // مزامنة البيانات الشخصية مع الشهر الحالي وباقي الشهور عند طلب المستخدم (v36/v37)
    if(isArchive && $('#f_syncCurrentMonth') && $('#f_syncCurrentMonth').checked){
      const lid = lesson.lessonId || lesson.id;
      const curL = state.lessons.find(x => x.id === lid);
      if(curL && Array.isArray(curL.students)){
        const match = curL.students.find(x => x.id === (student ? student.id : null) || normalizeForSearch(x.name) === normalizeForSearch(nm));
        if(match){
          match.name = nm;
          if(ph) match.phone = ph;
          match.guardianPhone = gp;
          match.guardianExtraPhones = gExtras;
          match.extraPhones = extras;
          match.job = job;
          match.address = addr;
          match.age = age;
          match.email = eml;
          match.profileNotes = pNotes;
          if(photoBase64) match.photo = photoBase64;
        }
      }
      (state.archive || []).forEach(otherA => {
        if(otherA !== lesson && (otherA.lessonId === lid)){
          if(Array.isArray(otherA.students)){
            const matchA = otherA.students.find(x => x.id === (student ? student.id : null) || normalizeForSearch(x.name) === normalizeForSearch(nm));
            if(matchA){
              matchA.name = nm;
              if(ph) matchA.phone = ph;
              matchA.guardianPhone = gp;
              matchA.guardianExtraPhones = gExtras;
              matchA.extraPhones = extras;
              matchA.job = job;
              matchA.address = addr;
              matchA.age = age;
              matchA.email = eml;
              matchA.profileNotes = pNotes;
              if(photoBase64) matchA.photo = photoBase64;
            }
          }
        }
      });
    }

    saveState();
    closeModal();
    if(isArchive && archIdx !== undefined && archIdx !== null){
      currentArchiveIdx = archIdx;
      renderArchiveDetail(archIdx);
    } else if(currentLessonId){
      renderLessonDetail();
    } else {
      renderAll();
    }
    showToastMessage(isEdit ? '✅ تم حفظ تعديل العضو بنجاح.' : '✅ تم إضافة العضو بنجاح.');
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
    +   '<button class="btn btn-sm btn-outline" id="addGroupBtn" type="button" style="margin-top:8px">' + appIcon('plus', 12) + ' إضافة مجموعة</button></label></div>'
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
  if(name === 'archive'){
    if(currentArchiveIdx === null){
      renderArchive();
    } else {
      renderArchiveDetail(currentArchiveIdx);
    }
  }
}

/* ---------- ربط الأحداث ---------- */
/* القوائم المنسدلة عامة ومتاحة لكافة الشاشات (v37) */
function toggleDropdown(menuIdOrEl, btnIdOrEl){
  const menu = typeof menuIdOrEl === 'string' ? document.getElementById(menuIdOrEl) : menuIdOrEl;
  const btn = typeof btnIdOrEl === 'string' ? document.getElementById(btnIdOrEl) : btnIdOrEl;
  if(!menu || !btn) return;
  const wasOpen = !menu.hidden;
  $$('.dropdown-menu').forEach(m => { m.hidden = true; m.style.maxHeight = ''; m.style.bottom = ''; m.style.top = ''; });
  if(wasOpen) return;
  const rect = btn.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const spaceBelow = vh - rect.bottom - 14;
  const spaceAbove = rect.top - 14;
  const rightPx = Math.max(8, Math.min(vw - rect.right, vw - 208));
  menu.style.right = rightPx + 'px';
  menu.style.left = 'auto';
  if(spaceBelow >= 180 || spaceBelow >= spaceAbove){
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.bottom = 'auto';
    menu.style.maxHeight = Math.max(140, spaceBelow) + 'px';
  } else {
    menu.style.bottom = (vh - rect.top + 4) + 'px';
    menu.style.top = 'auto';
    menu.style.maxHeight = Math.max(140, spaceAbove) + 'px';
  }
  menu.hidden = false;
}

function bindEvents(){
  window.addEventListener('popstate', handleAppBack);

  $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  if($('#clearLessonSearch')){
    $('#clearLessonSearch').onclick = () => {
      const inp = $('#lessonSearch');
      if(inp) inp.value = '';
      lessonFilterQuery = '';
      const clearBtn = $('#clearLessonSearch');
      if(clearBtn) clearBtn.style.display = 'none';
      lessonCurrentPage = 1;
      renderLessonDetail();
      if(inp) inp.focus();
    };
  }

  if($('#clearGlobalSearch')){
    $('#clearGlobalSearch').onclick = () => {
      const inp = $('#globalSearch');
      if(inp) inp.value = '';
      globalSearchQuery = '';
      const clearBtn = $('#clearGlobalSearch');
      if(clearBtn) clearBtn.style.display = 'none';
      renderGlobalSearch();
      if(inp) inp.focus();
    };
  }

  if($('#addOldMonthArchiveBtn')){
    $('#addOldMonthArchiveBtn').onclick = () => addOldMonthModal();
  }
  if($('#addOldMonthLessonBtn')){
    $('#addOldMonthLessonBtn').onclick = () => {
      const L = curLesson();
      addOldMonthModal(L ? L.id : null);
    };
  }

  if($('#addLessonBtn')) $('#addLessonBtn').onclick = () => lessonForm(null);
  if($('#brandHome')) $('#brandHome').onclick = () => {
    switchTab('lessons');
    currentLessonId = null;
    lessonFilterQuery = '';
    groupFilterQuery = '';
    globalSearchQuery = '';
    if($('#lessonSearch')) $('#lessonSearch').value = '';
    if($('#clearLessonSearch')) $('#clearLessonSearch').style.display = 'none';
    if($('#globalSearch')) $('#globalSearch').value = '';
    if($('#clearGlobalSearch')) $('#clearGlobalSearch').style.display = 'none';
    renderLessonsHome();
    renderLessonDetail();
  };

  if($('#backToListBtn')) $('#backToListBtn').onclick = () => {
    currentLessonId = null;
    lessonFilterQuery = '';
    groupFilterQuery = '';
    if($('#lessonSearch')) $('#lessonSearch').value = '';
    if($('#clearLessonSearch')) $('#clearLessonSearch').style.display = 'none';
    renderLessonsHome();
    renderLessonDetail();
  };

  let lessonSearchDebounceTimer = null;
  let lessonSearchRaf = null;
  function handleLessonSearchInput(val){
    lessonFilterQuery = val;
    const isLite = !!(state && state.settings && state.settings.liteMode);
    const clearBtn = $('#clearLessonSearch');
    if(clearBtn) clearBtn.style.display = val.trim() ? 'block' : 'none';

    if(!val.trim()){
      if(lessonSearchDebounceTimer) { clearTimeout(lessonSearchDebounceTimer); lessonSearchDebounceTimer = null; }
      if(lessonSearchRaf) { cancelAnimationFrame(lessonSearchRaf); lessonSearchRaf = null; }
      lessonCurrentPage = 1;
      renderLessonDetail();
      return;
    }

    if(isLite){
      if(lessonSearchDebounceTimer) clearTimeout(lessonSearchDebounceTimer);
      lessonSearchDebounceTimer = setTimeout(() => {
        lessonCurrentPage = 1;
        renderLessonDetail();
      }, 120);
    } else {
      if(lessonSearchRaf) cancelAnimationFrame(lessonSearchRaf);
      lessonSearchRaf = requestAnimationFrame(() => {
        lessonCurrentPage = 1;
        renderLessonDetail();
      });
    }
  }

  const lInp = $('#lessonSearch');
  if(lInp){
    lInp.addEventListener('input', (e) => handleLessonSearchInput(e.target.value));
    lInp.addEventListener('compositionend', (e) => handleLessonSearchInput(e.target.value));
  }

  let globalSearchDebounceTimer = null;
  let globalSearchRaf = null;
  function handleGlobalSearchInput(val){
    globalSearchQuery = val;
    const isLite = !!(state && state.settings && state.settings.liteMode);
    const clearBtn = $('#clearGlobalSearch');
    if(clearBtn) clearBtn.style.display = val.trim() ? 'block' : 'none';

    if(!val.trim()){
      if(globalSearchDebounceTimer) { clearTimeout(globalSearchDebounceTimer); globalSearchDebounceTimer = null; }
      if(globalSearchRaf) { cancelAnimationFrame(globalSearchRaf); globalSearchRaf = null; }
      renderGlobalSearch();
      return;
    }

    if(isLite){
      if(globalSearchDebounceTimer) clearTimeout(globalSearchDebounceTimer);
      globalSearchDebounceTimer = setTimeout(() => {
        renderGlobalSearch();
      }, 120);
    } else {
      if(globalSearchRaf) cancelAnimationFrame(globalSearchRaf);
      globalSearchRaf = requestAnimationFrame(() => {
        renderGlobalSearch();
      });
    }
  }

  const gInp = $('#globalSearch');
  if(gInp){
    gInp.addEventListener('input', (e) => handleGlobalSearchInput(e.target.value));
    gInp.addEventListener('compositionend', (e) => handleGlobalSearchInput(e.target.value));
  }
  if($('#groupFilter')) $('#groupFilter').addEventListener('change', (e) => { groupFilterQuery = e.target.value; renderLessonDetail(); });

  if($('#addStudentBtn')) $('#addStudentBtn').onclick = () => { const L = curLesson(); if(L) studentForm(L, null); };
  if($('#addSessionBtn')) $('#addSessionBtn').onclick = () => { const L = curLesson(); if(L){ addSessionModal(L); } };
  if($('#regenSessionsBtn')) $('#regenSessionsBtn').onclick = () => { const L = curLesson(); if(L){ genSessions(L, true); renderAll(); } };
  if($('#lessonReportBtn')) $('#lessonReportBtn').onclick = () => {
    const L = curLesson();
    if(!L) return;
    let students = L.students;
    let reportTitle = L.name + ' - ' + buildMonthTitle(L.monthNumber);
    if(groupFilterQuery && groupFilterQuery !== '__none__'){
      const grp = (L.groups || []).find(g => g.id === groupFilterQuery);
      if(grp){
        students = students.filter(st => st.groupId === groupFilterQuery);
        reportTitle += ' (مجموعة: ' + grp.name + ')';
      }
    } else if(groupFilterQuery === '__none__'){
      students = students.filter(st => !st.groupId);
      reportTitle += ' (بدون مجموعة)';
    }
    showAnalytics(students, pastSessions(L.sessions), L.records, reportTitle, effectiveStatuses(L));
  };
  if($('#examReportBtn')) $('#examReportBtn').onclick = () => { const L = curLesson(); if(L) openExamReportModal(L); };
  if($('#examMsgReportBtn')) $('#examMsgReportBtn').onclick = () => { const L = curLesson(); if(L) openExamReportMessageModal(L); };
  if($('#sortAttendanceBtn')) $('#sortAttendanceBtn').onclick = () => sortByAttendance();
  if($('#lessonStatusesBtn')) $('#lessonStatusesBtn').onclick = () => { const L = curLesson(); if(L) lessonStatusesEditor(L); };
  if($('#compReportBtn')) $('#compReportBtn').onclick = () => { const L = curLesson(); if(L) showComprehensiveReport(L); };
  if($('#changeMonthBtn')) $('#changeMonthBtn').onclick = () => { const L = curLesson(); if(L) changeMonth(L); };
  if($('#editLessonBtn')) $('#editLessonBtn').onclick = () => { const L = curLesson(); if(L) lessonForm(L); };
  if($('#exportLessonBtn')) $('#exportLessonBtn').onclick = () => { const L = curLesson(); if(L) exportLesson(L); };
  if($('#archiveLessonBtn')) $('#archiveLessonBtn').onclick = () => { const L = curLesson(); if(L) archiveLessonMonth(L); };

  /* v30: تبويبات الحضور والاختبارات */
  if($('#subtabAttendance')) $('#subtabAttendance').onclick = () => { currentLessonSubtab = 'attendance'; renderLessonDetail(); };
  if($('#subtabExams')) $('#subtabExams').onclick = () => { currentLessonSubtab = 'exams'; renderLessonDetail(); };

  /* v34: أزرار قسم الاختبارات والتقارير المنفردة */
  if($('#printExamsReportBtn')) $('#printExamsReportBtn').onclick = () => { const L = curLesson(); if(L) printExamsReport(L); };
  if($('#exportExamsCsvBtn')) $('#exportExamsCsvBtn').onclick = () => { const L = curLesson(); if(L) exportExamsCSV(L); };
  if($('#hiddenExamStudentsBtn')) $('#hiddenExamStudentsBtn').onclick = () => { const L = curLesson(); if(L) openHiddenExamStudentsModal(L); };
  if($('#hiddenStudentsBtn')) $('#hiddenStudentsBtn').onclick = () => { const L = curLesson(); if(L) openHiddenStudentsModal(L); };
  if($('#hiddenStudentsMenuBtn')) $('#hiddenStudentsMenuBtn').onclick = () => { const L = curLesson(); if(L) openHiddenStudentsModal(L); };
  if($('#smartDropoutHideBtn')) $('#smartDropoutHideBtn').onclick = () => { const L = curLesson(); if(L) openSmartDropoutHidingModal(L); };
  if($('#mergeAttendanceMenuBtn')) $('#mergeAttendanceMenuBtn').onclick = () => { const L = curLesson(); if(L) openAttendanceMergeModal(L); };
  if($('#examGroupsBtn')) $('#examGroupsBtn').onclick = () => { const L = curLesson(); if(L) openExamGroupsModal(L); };
  if($('#examGroupFilter')) $('#examGroupFilter').addEventListener('change', (e) => {
    examGroupFilterQuery = e.target.value;
    const L = curLesson();
    if(L) renderExamsTable(L);
  });

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
  if($('#addTgBotBtn')) $('#addTgBotBtn').onclick = () => addTgBotModal();
  if($('#set_tgBotToken')) $('#set_tgBotToken').addEventListener('change', (e) => { state.settings.tgBotToken = e.target.value.trim(); saveState(); });
  if($('#set_tgChatId')) $('#set_tgChatId').addEventListener('change', (e) => { state.settings.tgChatId = e.target.value.trim(); saveState(); });
  if($('#openAnalyticsBtn')) $('#openAnalyticsBtn').onclick = openAnalyticsModal;
  if($('#openResetBtn')) $('#openResetBtn').onclick = openResetModal;

  const liteSw = $('#set_liteMode');
  if(liteSw){
    liteSw.addEventListener('change', (e) => {
      state.settings.liteMode = !!e.target.checked;
      applyLiteModeUI();
      saveState();
      showToastMessage(state.settings.liteMode ? '⚡ تم تفعيل وضع الأداء القياسي لتخفيف التعليق والبطء.' : '✨ تم إيقاف وضع الأداء القياسي واستعادة المؤثرات.');
    });
  }

  if($('#weeklyMsgBtn')) $('#weeklyMsgBtn').onclick = weeklyMessage;
  if($('#monthlyMsgBtn')) $('#monthlyMsgBtn').onclick = () => { const L = curLesson(); if(L) monthlyReportMessage(L); };
  if($('#blankSheetBtn')) $('#blankSheetBtn').onclick = showBlankSheetOptions;

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
  if($('#notifBtn')){
    $('#notifBtn').onclick = (e) => { e.stopPropagation(); const p = $('#notifPanel'); if(p){ renderNotifPanel(); p.hidden = !p.hidden; } };
  }
  if($('#notifPanel')){
    $('#notifPanel').addEventListener('click', (e) => {
      const del = e.target.closest('[data-wn-del]');
      if(del){ e.stopPropagation(); removeWhatsNew(del.dataset.wnDel); renderNotifPanel(); renderToday(); return; }
      const clr = e.target.closest('[data-wn-clear]');
      if(clr){ e.stopPropagation(); removeAllWhatsNew(); renderNotifPanel(); renderToday(); return; }
      const item = e.target.closest('[data-wn]');
      if(item){ e.stopPropagation(); $('#notifPanel').hidden = true; whatsNewModal(item.dataset.wn); }
    });
  }
  document.addEventListener('click', (e) => {

    // معالجة التنقل بالصفحات وتغيير عدد الصفوف في الجداول الضخمة (v41)
    const navBtn = e.target.closest('.page-nav-btn');
    if(navBtn && !navBtn.disabled){
      const prefix = navBtn.dataset.prefix;
      const dir = navBtn.dataset.dir;
      const delta = (dir === 'next' ? 1 : -1);
      if(prefix === 'lesson'){
        lessonCurrentPage += delta;
        renderLessonDetail();
      } else if(prefix === 'exams'){
        examsCurrentPage += delta;
        const L = curLesson();
        if(L) renderExamsTable(L);
      } else if(prefix === 'arch'){
        archiveCurrentPage += delta;
        if(currentArchiveIdx !== null) renderArchiveDetail(currentArchiveIdx);
      } else if(prefix === 'archExams'){
        archExamsCurrentPage += delta;
        if(currentArchiveIdx !== null) renderArchiveDetail(currentArchiveIdx);
      }
      return;
    }

    const p = $('#notifPanel');
    if(p && !p.hidden && !e.target.closest('.notif-wrap')) p.hidden = true;
  });

  if($('#toastDone')) $('#toastDone').onclick = hideToast;
  if($('#toastDismiss')) $('#toastDismiss').onclick = hideToast;

  if($('#addStatusBtn')) $('#addStatusBtn').onclick = addStatusForm;
  if($('#addFieldBtn')) $('#addFieldBtn').onclick = () => {
    state.settings.customFields.push({ id: uid('f'), label: 'عمود جديد' });
    saveState(); renderAll();
  };
  /* القوائم المنسدلة */

  if($('#reportsMenuBtn')) $('#reportsMenuBtn').onclick = () => toggleDropdown('reportsMenu', 'reportsMenuBtn');
  if($('#manageMenuBtn')) $('#manageMenuBtn').onclick = () => toggleDropdown('manageMenu', 'manageMenuBtn');
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
  if($('#exportBackupBtn')) $('#exportBackupBtn').onclick = exportBackup;
  if($('#importBackupBtn')) $('#importBackupBtn').onclick = () => { const inp = $('#importFile'); if(inp) inp.click(); };
  if($('#importLessonBtn')) $('#importLessonBtn').onclick = () => { const inp = $('#importLessonFile'); if(inp) inp.click(); };
  if($('#importArchiveBtn')) $('#importArchiveBtn').onclick = () => { const inp = $('#importArchiveFile'); if(inp) inp.click(); };
  if($('#mergeAttendanceGlobalBtn')) $('#mergeAttendanceGlobalBtn').onclick = () => {
    const L = curLesson();
    if(L) openAttendanceMergeModal(L);
    else if(state.lessons && state.lessons.length > 0) openAttendanceMergeModal(state.lessons[0]);
    else alert('يرجى إنشاء درس أولاً لدمج الحضور إليه.');
  };
  if($('#importSingleMonthArchiveBtn')) {
    $('#importSingleMonthArchiveBtn').onclick = () => {
      const inp = $('#importSingleMonthInput') || $('#importArchiveFile');
      if(inp) inp.click();
    };
  }
  if($('#importSingleMonthInput')) {
    $('#importSingleMonthInput').onchange = (e) => {
      if(e.target.files && e.target.files[0]) importSingleArchiveMonth(e.target.files[0]);
      e.target.value = '';
    };
  }
  if($('#openFileBtn')) $('#openFileBtn').onclick = openFromFile;
  if($('#saveFileBtn')) $('#saveFileBtn').onclick = saveToFile;
  if($('#encryptExportBtn')) $('#encryptExportBtn').onclick = encryptExport;
  if($('#encryptImportBtn')) $('#encryptImportBtn').onclick = () => { const inp = $('#encryptImportFile'); if(inp) inp.click(); };
  if($('#enableAutoSaveBtn')) $('#enableAutoSaveBtn').onclick = () => enableAutoSave();
  if($('#disableAutoSaveBtn')) $('#disableAutoSaveBtn').onclick = disableAutoSave;
  const asBadge = $('#autosaveBadge');
  if(asBadge){
    asBadge.style.cursor = 'pointer';
    asBadge.onclick = () => enableAutoSave();
  }
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

    if(act === 'open-lesson'){
      pushAppHistory('lesson-detail', { lessonId: id });
      currentLessonId = id;
      lessonFilterQuery = '';
      groupFilterQuery = '';
      examGroupFilterQuery = '';
      lessonCurrentPage = 1;
      if($('#lessonSearch')) $('#lessonSearch').value = '';
      if($('#clearLessonSearch')) $('#clearLessonSearch').style.display = 'none';
      renderLessonDetail();
    }
    else if(act === 'view-student'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      if(L && st) openStudentProfile(st, L);
    }
    else if(act === 'view-arch-student'){
      const archIdx = (t.dataset.arch !== undefined) ? parseInt(t.dataset.arch, 10) : currentArchiveIdx;
      const a = (archIdx !== null && archIdx !== undefined) ? state.archive[archIdx] : null;
      if(!a) return;
      const st = (a.students || archiveStudents(a)).find(x => x.id === id);
      if(st){
        studentForm(a, st, true, archIdx);
      }
    }
    else if(act === 'open-student'){
      pushAppHistory('lesson-detail', { lessonId: lessonId });
      currentLessonId = lessonId;
      const st = state.lessons.find(x=>x.id===lessonId)?.students.find(x=>x.id===id);
      lessonFilterQuery = st ? st.name : '';
      groupFilterQuery = '';
      lessonCurrentPage = 1;
      if($('#lessonSearch')) $('#lessonSearch').value = lessonFilterQuery;
      if($('#clearLessonSearch')) $('#clearLessonSearch').style.display = lessonFilterQuery ? 'block' : 'none';
      renderLessonDetail();
    }
    else if(act === 'open-archived-student'){
      const aIdx = parseInt(t.dataset.archIdx, 10);
      const a = state.archive[aIdx];
      if(!a) return;
      pushAppHistory('archive-detail', { archIdx: aIdx });
      currentArchiveIndex = aIdx;
      const st = (a.students || archiveStudents(a) || []).find(x => x.id === id);
      archFilterQuery = st ? st.name : '';
      archGroupFilterQuery = '';
      archCurrentPage = 1;
      renderArchiveDetail(aIdx);
      if($('#archSearch')) $('#archSearch').value = archFilterQuery;
      if($('#clearArchSearch')) $('#clearArchSearch').style.display = archFilterQuery ? 'block' : 'none';
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
      if(L){
        confirmDangerModal({
          title: '⚠️ حذف الدرس',
          message: 'هل أنت متأكد من رغبتك في حذف هذا الدرس نهائياً؟',
          itemName: L.name + ' (' + L.students.length + ' طالب · شهر ' + L.monthNumber + '/' + L.year + ')',
          dangerNote: 'سيتم مسح بيانات الدرس الحالي وطلابه وسجلاته (سيبقى الأرشيف محفوظاً).',
          onConfirm: () => {
            state.lessons = state.lessons.filter(x => x.id !== id);
            if(currentLessonId === id) currentLessonId = null;
            saveState(); renderAll();
            showToastMessage('🗑️ تم حذف الدرس.');
          }
        });
      }
    }
    else if(act === 'wa'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      const targetPhone = t.dataset.phone || (st && st.phone);
      if(st && targetPhone) openWhatsApp(targetPhone, '', st.name);
    }
    else if(act === 'student-summary'){
      const archIdx = t.dataset.arch !== undefined ? parseInt(t.dataset.arch, 10) : (currentArchiveIdx !== null ? currentArchiveIdx : null);
      if(archIdx !== null){
        const a = state.archive[archIdx];
        const st = a && (a.students || []).find(x => x.id === id);
        if(a && st) studentSummary(a, st);
      } else {
        const L = curLesson();
        const st = L && L.students.find(x => x.id === id);
        if(L && st) studentSummary(L, st);
      }
    }
    else if(act === 'quick-export'){
      const L = curLesson();
      if(L) exportLesson(L);
    }
    else if(act === 'edit-student'){
      const L = curLesson();
      if(L) studentForm(L, L.students.find(x => x.id === id));
    }
    else if(act === 'del-arch-student'){
      const archAttr = t.dataset.arch;
      const archIdx = (archAttr !== undefined && archAttr !== '' && !isNaN(parseInt(archAttr, 10)))
        ? parseInt(archAttr, 10)
        : (currentArchiveIdx !== null ? currentArchiveIdx : null);
      if(archIdx === null || !state.archive[archIdx]) return;
      const a = state.archive[archIdx];
      if(!Array.isArray(a.students)) a.students = JSON.parse(JSON.stringify(archiveStudents(a)));
      const st = a.students.find(x => x.id === id);
      if(!st) return;

      confirmDangerModal({
        title: '⚠️ حذف الطالب من الشهر المؤرشف',
        message: 'هل أنت متأكد من حذف الطالب «' + esc(st.name) + '» من هذا الشهر المؤرشف (' + a.monthNumber + '/' + a.year + ') فقط؟',
        itemName: st.name + ' - شهر ' + a.monthNumber + '/' + a.year,
        dangerNote: 'لن يتأثر وجود الطالب أو درجاته في أي شهور أخرى أو في الشهر الحالي.',
        confirmText: 'نعم، احذف الطالب من هذا الشهر 🗑️',
        onConfirm: () => {
          a.students = a.students.filter(x => x.id !== id);
          if(a.records) delete a.records[id];
          if(a.examScores) delete a.examScores[id];
          if(a.examNotes) delete a.examNotes[id];
          if(a.examExclusions) delete a.examExclusions[id];
          saveState();
          renderArchiveDetail(archIdx);
          showToastMessage('🗑️ تم حذف الطالب من هذا الشهر المؤرشف فقط بنجاح.');
        }
      });
    }
    else if(act === 'del-student'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      if(L && st){
        confirmDangerModal({
          title: '⚠️ حذف العضو من الدرس',
          message: 'هل أنت متأكد من رغبتك في حذف هذا العضو من هذا الدرس؟',
          itemName: st.name + (st.phone ? ' (' + st.phone + ')' : ''),
          dangerNote: 'سيتم مسح سجلات حضور الطالب ودرجاته في هذا الشهر.',
          onConfirm: () => {
            L.students = L.students.filter(x => x.id !== id);
            delete L.records[id];
            if(L.examScores) delete L.examScores[id];
            if(L.examNotes) delete L.examNotes[id];
            if(L.examExclusions) delete L.examExclusions[id];
            saveState(); renderAll();
            showToastMessage('🗑️ تم حذف العضو من الدرس.');
          }
        });
      }
    }
    else if(act === 'move-student'){
      const archAttr = t.dataset.arch;
      const archIdx = (archAttr !== undefined && archAttr !== '' && !isNaN(parseInt(archAttr, 10)))
        ? parseInt(archAttr, 10)
        : (currentArchiveIdx !== null ? currentArchiveIdx : null);
      if(archIdx !== null && state.archive[archIdx]){
        const a = state.archive[archIdx];
        if(!Array.isArray(a.students)) a.students = JSON.parse(JSON.stringify(archiveStudents(a)));
        const i = a.students.findIndex(x => x.id === id);
        const dir = t.dataset.dir;
        const j = dir === 'up' ? i-1 : i+1;
        if(i < 0 || j < 0 || j >= a.students.length) return;
        const tmp = a.students[i]; a.students[i] = a.students[j]; a.students[j] = tmp;
        saveState(); renderArchiveDetail(archIdx);
      } else {
        const L = curLesson();
        if(!L) return;
        const i = L.students.findIndex(x => x.id === id);
        const dir = t.dataset.dir;
        const j = dir === 'up' ? i-1 : i+1;
        if(i < 0 || j < 0 || j >= L.students.length) return;
        const tmp = L.students[i]; L.students[i] = L.students[j]; L.students[j] = tmp;
        saveState(); renderLessonDetail();
      }
    }
    else if(act === 'reveal-money'){ revealMoney(); }
    else if(act === 'lock-money'){ lockMoney(); }
    else if(act === 'day-note'){
      const archAttr = t.dataset.arch;
      const archIdx = (archAttr !== undefined && archAttr !== '' && !isNaN(parseInt(archAttr, 10)))
        ? parseInt(archAttr, 10)
        : (currentArchiveIdx !== null ? currentArchiveIdx : null);
      let container, students, sessions;
      if(archIdx !== null){
        container = state.archive[archIdx];
        if(!container) return;
        students = Array.isArray(container.students) && container.students.length ? container.students : archiveStudents(container);
        sessions = container.sessions || [];
      } else {
        container = curLesson();
        if(!container) return;
        students = container.students || [];
        sessions = container.sessions || [];
      }
      const st = students.find(x => x.id === t.dataset.sid);
      const s = sessions.find(x => x.id === t.dataset.ssid);
      if(!st || !s) return;
      if(!container.records) container.records = {};
      if(!container.records[st.id]) container.records[st.id] = {};
      let rec = container.records[st.id][s.id];
      if(typeof rec === 'string'){
        rec = { status: rec, note: '' };
        container.records[st.id][s.id] = rec;
      } else if(!rec || typeof rec !== 'object'){
        rec = { status: '', note: '' };
        container.records[st.id][s.id] = rec;
      }
      openModal('ملاحظة يوم ' + (s.dateLabel || s.label) + ' - ' + st.name,
        '<div class="form-row"><label>سبب الغياب / الملاحظة<textarea id="dn_text" rows="4" dir="rtl" placeholder="مثال: مريض / سفر / ظرف طارئ...">' + esc(rec.note || '') + '</textarea></label></div>'
        + '<div class="modal-actions"><button class="btn" id="dn_save">حفظ</button><button class="btn btn-outline" id="dn_clear">مسح</button><button class="btn btn-outline" id="dn_cancel">إلغاء</button></div>');
      $('#dn_save').onclick = () => {
        if(!container.records[st.id]) container.records[st.id] = {};
        let r = container.records[st.id][s.id];
        if(typeof r === 'string') r = { status: r, note: '' };
        else if(!r || typeof r !== 'object') r = { status: '', note: '' };
        r.note = ($('#dn_text').value || '').trim();
        container.records[st.id][s.id] = r;
        saveState();
        if(archIdx !== null) renderArchiveDetail(archIdx); else renderLessonDetail();
        closeModal();
        showToastMessage('✅ تم حفظ الملاحظة بنجاح.');
      };
      $('#dn_clear').onclick = () => {
        if(container.records[st.id] && container.records[st.id][s.id]){
          if(typeof container.records[st.id][s.id] === 'object'){
            container.records[st.id][s.id].note = '';
          } else {
            container.records[st.id][s.id] = { status: String(container.records[st.id][s.id] || ''), note: '' };
          }
        }
        saveState();
        if(archIdx !== null) renderArchiveDetail(archIdx); else renderLessonDetail();
        closeModal();
        showToastMessage('🗑️ تم مسح الملاحظة.');
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
      if(s){
        confirmDangerModal({
          title: '⚠️ حذف الحصة',
          message: 'هل أنت متأكد من رغبتك في حذف هذه الحصة وجميع تسجيلات حضورها؟',
          itemName: s.label + (s.dateLabel ? ' (' + s.dateLabel + ')' : ''),
          dangerNote: 'سيتم مسح تسجيلات حضور وغياب كافة الطلاب في هذه الحصة.',
          onConfirm: () => {
            container.sessions = container.sessions.filter(x => x.id !== id);
            Object.keys(container.records).forEach(k => delete container.records[k][id]);
            container.sessions.forEach((x,i) => x.label = 'حصة ' + (i+1));
            saveState(); after();
            showToastMessage('🗑️ تم حذف الحصة بنجاح.');
          }
        });
      }
    }
    else if(act === 'bulk-attendance'){
      const archAttr = t.dataset.arch;
      const archIdx = (archAttr !== undefined && archAttr !== '' && !isNaN(parseInt(archAttr, 10)))
        ? parseInt(archAttr, 10)
        : (currentArchiveIdx !== null ? currentArchiveIdx : null);
      if(archIdx !== null && state.archive && state.archive[archIdx]){
        const a = state.archive[archIdx];
        const s = a && (a.sessions || []).find(x => x.id === id);
        if(a && s) openBulkAttendanceModal(a, s, true, archIdx);
      } else {
        const L = curLesson();
        const s = L && (L.sessions || []).find(x => x.id === id);
        if(L && s) openBulkAttendanceModal(L, s, false, null);
      }
    }
    else if(act === 'open-payments'){
      const L = curLesson();
      const st = L && L.students.find(x => x.id === id);
      if(L && st) openStudentProfile(st, L);
    }
    else if(act === 'edit-exam'){
      const archIdx = t.dataset.arch !== undefined ? parseInt(t.dataset.arch, 10) : (currentArchiveIdx !== null ? currentArchiveIdx : null);
      const targetObj = archIdx !== null ? state.archive[archIdx] : curLesson();
      const ex = targetObj && (targetObj.exams||[]).find(x => x.id === id);
      if(targetObj && ex) addExamModal(targetObj, ex, archIdx !== null, archIdx);
    }
    else if(act === 'del-exam'){
      const archIdx = t.dataset.arch !== undefined ? parseInt(t.dataset.arch, 10) : (currentArchiveIdx !== null ? currentArchiveIdx : null);
      const targetObj = archIdx !== null ? state.archive[archIdx] : curLesson();
      const ex = targetObj && (targetObj.exams||[]).find(x => x.id === id);
      if(targetObj && ex){
        confirmDangerModal({
          title: '⚠️ حذف الاختبار',
          message: 'هل أنت متأكد من رغبتك في حذف هذا الاختبار ورصد درجاته؟',
          itemName: ex.name + ' (الدرجة العظمى: ' + ex.maxScore + ')',
          dangerNote: 'سيتم مسح درجات وملاحظات جميع الطلاب في هذا الاختبار نهائياً.',
          onConfirm: () => {
            targetObj.exams = targetObj.exams.filter(x => x.id !== id);
            if(targetObj.examScores){
              Object.keys(targetObj.examScores).forEach(sid => { delete targetObj.examScores[sid][id]; });
            }
            if(targetObj.examNotes){
              Object.keys(targetObj.examNotes).forEach(sid => { delete targetObj.examNotes[sid][id]; });
            }
            if(targetObj.examExclusions){
              Object.keys(targetObj.examExclusions).forEach(sid => { delete targetObj.examExclusions[sid][id]; });
            }
            saveState();
            if(archIdx !== null) renderArchiveDetail(archIdx); else renderLessonDetail();
            showToastMessage('🗑️ تم حذف الاختبار بنجاح.');
          }
        });
      }
    }
    else if(act === 'exam-note'){
      const L = curLesson();
      const sid = t.dataset.sid || (t.closest('[data-sid]') && t.closest('[data-sid]').dataset.sid);
      const eid = t.dataset.eid || (t.closest('[data-eid]') && t.closest('[data-eid]').dataset.eid);
      const st = L && L.students.find(x => x.id === sid);
      const ex = L && (L.exams||[]).find(x => x.id === eid);
      if(L && st && ex) openExamNoteModal(st, ex, L);
    }
    else if(act === 'set-active-bot'){
      state.settings.activeTgBotId = id;
      const b = (state.settings.tgBots||[]).find(x => x.id === id);
      if(b){
        state.settings.tgBotToken = b.token;
        state.settings.tgChatId = b.chatId;
      }
      saveState();
      renderTgBotsList();
      showToastMessage('⭐ تم تعيين «' + (b ? b.name : '') + '» كبوت افتراضي للإرسال.');
    }
    else if(act === 'edit-bot'){
      const b = (state.settings.tgBots||[]).find(x => x.id === id);
      if(b) addTgBotModal(b);
    }
    else if(act === 'del-bot'){
      const b = (state.settings.tgBots||[]).find(x => x.id === id);
      if(b){
        confirmDangerModal({
          title: '⚠️ حذف بوت تيليجرام',
          message: 'هل أنت متأكد من رغبتك في حذف بيانات هذا البوت نهائياً؟',
          itemName: b.name + ' (Chat ID: ' + b.chatId + ')',
          dangerNote: 'سيتم مسح بيانات البوت من قائمة البوتات المحفوظة.',
          onConfirm: () => {
            state.settings.tgBots = (state.settings.tgBots||[]).filter(x => x.id !== id);
            if(state.settings.activeTgBotId === id){
              state.settings.activeTgBotId = (state.settings.tgBots[0] ? state.settings.tgBots[0].id : null);
              if(state.settings.tgBots[0]){
                state.settings.tgBotToken = state.settings.tgBots[0].token;
                state.settings.tgChatId = state.settings.tgBots[0].chatId;
              } else {
                state.settings.tgBotToken = '';
                state.settings.tgChatId = '';
              }
            }
            saveState();
            renderTgBotsList();
            showToastMessage('🗑️ تم حذف البوت بنجاح.');
          }
        });
      }
    }
    else if(act === 'open-archive'){
      const aIdx = parseInt(idx, 10);
      pushAppHistory('archive-detail', { archIdx: aIdx });
      renderArchiveDetail(aIdx);
    }
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
      const a = state.archive[parseInt(idx,10)];
      if(a){
        confirmDangerModal({
          title: '⚠️ حذف شهر من الأرشيف',
          message: 'هل أنت متأكد من رغبتك في حذف هذا الشهر المؤرشف نهائياً؟',
          itemName: (a.lessonName || 'درس') + ' - شهر ' + a.monthNumber + '/' + a.year,
          dangerNote: 'لا يمكن استرجاع هذا الشهر وسجلاته بعد الحذف.',
          onConfirm: () => {
            state.archive.splice(parseInt(idx,10), 1);
            saveState(); renderArchive();
            showToastMessage('🗑️ تم حذف الشهر من الأرشيف.');
          }
        });
      }
    }
    else if(act === 'del-field'){
      const f = state.settings.customFields.find(x => x.id === id);
      confirmDangerModal({
        title: '⚠️ حذف عمود مخصص',
        message: 'هل أنت متأكد من رغبتك في حذف هذا العمود من جميع الطلاب في كل الدروس والأرشيف؟',
        itemName: f ? f.label : '',
        dangerNote: 'سيتم مسح كافة البيانات المدخلة في هذا العمود لجميع الطلاب.',
        onConfirm: () => {
          state.settings.customFields = state.settings.customFields.filter(x => x.id !== id);
          state.lessons.forEach(L => L.students.forEach(st => { if(st.fields) delete st.fields[id]; }));
          state.archive.forEach(a => a.students.forEach(st => { if(st.fields) delete st.fields[id]; }));
          saveState(); renderAll();
          showToastMessage('🗑️ تم حذف العمود المخصص.');
        }
      });
    }
    else if(act === 'del-status'){
      const s = state.settings.statuses.find(x => x.id === id);
      if(!s) return;
      if(state.settings.statuses.length <= 1){ alert('يجب أن تبقى حالة واحدة على الأقل.'); return; }
      confirmDangerModal({
        title: '⚠️ حذف حالة حضور',
        message: 'هل أنت متأكد من رغبتك في حذف هذه الحالة؟',
        itemName: s.label,
        dangerNote: 'سيتم تفريغ هذه الحالة من كافة سجلات الحضور السابقة للطلاب.',
        onConfirm: () => {
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
          showToastMessage('🗑️ تم حذف الحالة.');
        }
      });
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
    if(t.matches('[data-act="note"]')){
      const sid = t.dataset.id;
      if(t.dataset.arch !== undefined){
        const a = state.archive && state.archive[parseInt(t.dataset.arch, 10)];
        if(a){
          if(!a.records) a.records = {};
          if(!a.records[sid]) a.records[sid] = {};
          a.records[sid]['__note__'] = t.value;
        }
      } else {
        const L = curLesson();
        if(L){
          if(!L.records) L.records = {};
          if(!L.records[sid]) L.records[sid] = {};
          L.records[sid]['__note__'] = t.value;
        }
      }
      clearTimeout(fieldSaveTimer);
      fieldSaveTimer = setTimeout(() => saveState(), 500);
    }
  });

  document.addEventListener('change', (e) => {

    // تغيير عدد صفوف الصفحة أو كتابة رقم مخصص أو القفز لصفحة محددة (v41)
    const customSizeInput = e.target.closest('.page-size-custom-input');
    if(customSizeInput){
      tablePageSize = Math.max(1, parseInt(customSizeInput.value, 10) || 50);
      lessonCurrentPage = 1;
      archiveCurrentPage = 1;
      examsCurrentPage = 1;
      archExamsCurrentPage = 1;
      if(currentArchiveIdx !== null && $('#archiveDetail') && $('#archiveDetail').style.display !== 'none'){
        renderArchiveDetail(currentArchiveIdx);
      } else {
        renderLessonDetail();
      }
      return;
    }
    // تغيير عدد صفوف الصفحة أو القفز لصفحة محددة (v41)
    const sizeSel = e.target.closest('.page-size-select');
    if(sizeSel){
      tablePageSize = parseInt(sizeSel.value, 10) || 0;
      lessonCurrentPage = 1;
      archiveCurrentPage = 1;
      examsCurrentPage = 1;
      archExamsCurrentPage = 1;
      if(currentArchiveIdx !== null && $('#archiveDetail') && $('#archiveDetail').style.display !== 'none'){
        renderArchiveDetail(currentArchiveIdx);
      } else {
        renderLessonDetail();
      }
      return;
    }
    const jumpSel = e.target.closest('.page-jump-select');
    if(jumpSel){
      const pNum = parseInt(jumpSel.value, 10) || 1;
      const prefix = jumpSel.dataset.prefix;
      if(prefix === 'lesson'){
        lessonCurrentPage = pNum;
        renderLessonDetail();
      } else if(prefix === 'exams'){
        examsCurrentPage = pNum;
        const L = curLesson();
        if(L) renderExamsTable(L);
      } else if(prefix === 'arch'){
        archiveCurrentPage = pNum;
        if(currentArchiveIdx !== null) renderArchiveDetail(currentArchiveIdx);
      } else if(prefix === 'archExams'){
        archExamsCurrentPage = pNum;
        if(currentArchiveIdx !== null) renderArchiveDetail(currentArchiveIdx);
      }
      return;
    }

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
        updateStatusCellUI(st, effectiveStatuses(a));
        let c = 0;
        const sts = archiveStudents(a);
        const effA = effectiveStatuses(a);
        sts.forEach(s2 => { const rec = (a.records[s2.id] && a.records[s2.id][ssid]) || {}; if(isPresentStatus(rec.status, effA)) c++; });
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
        updateStatusCellUI(st, effectiveStatuses(L));
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
      const archAttr = e.target.dataset.arch;
      const archIdx = (archAttr !== undefined && archAttr !== '' && !isNaN(parseInt(archAttr, 10)))
        ? parseInt(archAttr, 10)
        : (currentArchiveIdx !== null ? currentArchiveIdx : null);
      if(archIdx !== null && state.archive[archIdx]){
        const a = state.archive[archIdx];
        if(!Array.isArray(a.students)) a.students = JSON.parse(JSON.stringify(archiveStudents(a)));
        const pos = parseInt(e.target.value, 10);
        if(pos && pos >= 1 && pos <= a.students.length){
          moveStudentTo(a, e.target.dataset.id, pos, true, archIdx);
        } else {
          renderArchiveDetail(archIdx);
        }
      } else {
        const L = curLesson();
        if(!L) return;
        const pos = parseInt(e.target.value, 10);
        if(pos && pos >= 1 && pos <= L.students.length){
          moveStudentTo(L, e.target.dataset.id, pos, false, null);
        } else {
          renderLessonDetail();
        }
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
      const L = (currentArchiveIdx !== null ? state.archive[currentArchiveIdx] : curLesson());
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
      updateExamCellUI(sid, eid, L);
    }
  });

  if($('#modalClose')) $('#modalClose').onclick = closeModal;
  if($('#modalOverlay')) {
    $('#modalOverlay').addEventListener('click', (e) => {
      if(e.target === $('#modalOverlay')) closeModal();
    });
  }

  /* اختصارات لوحة المفاتيح للكمبيوتر واللابتوب (Desktop / Laptop Pro Shortcuts) */
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      if($('#modalOverlay') && !$('#modalOverlay').hidden){
        closeModal();
        e.preventDefault();
        return;
      }
      if($('#notifPanel') && !$('#notifPanel').hidden){
        $('#notifPanel').hidden = true;
        e.preventDefault();
        return;
      }
      $$('.dropdown-menu').forEach(m => { m.hidden = true; });
    }

    if((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')){
      if(currentLessonId && $('#lessonSearch')){
        e.preventDefault();
        $('#lessonSearch').focus();
        $('#lessonSearch').select();
      } else if($('#globalSearch')){
        e.preventDefault();
        $('#globalSearch').focus();
        $('#globalSearch').select();
      }
    }

    if((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')){
      e.preventDefault();
      saveState(true);
      if(fileHandle) saveToFile();
      showToastMessage('💾 تم حفظ جميع البيانات بنجاح.');
    }
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

function reorderArchiveStudent(archIdx, fromId, toId){
  const a = state.archive[archIdx];
  if(!a || !Array.isArray(a.students)) return;
  const from = a.students.findIndex(s => s.id === fromId);
  const to = a.students.findIndex(s => s.id === toId);
  if(from < 0 || to < 0 || from === to) return;
  const [moved] = a.students.splice(from, 1);
  a.students.splice(to, 0, moved);
  saveState();
  renderArchiveDetail(archIdx);
}

function moveStudentTo(container, studentId, pos, isArchive = false, archIdx = null){
  if(!container || !Array.isArray(container.students)) return;
  const from = container.students.findIndex(s => s.id === studentId);
  if(from < 0) return;
  let to = pos - 1;
  if(to < 0) to = 0;
  if(to >= container.students.length) to = container.students.length - 1;
  if(to === from) return;
  const [moved] = container.students.splice(from, 1);
  container.students.splice(to, 0, moved);
  saveState();
  if(isArchive && archIdx !== null) renderArchiveDetail(archIdx);
  else renderLessonDetail();
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
    const targetRow = document.querySelector('tr.student-row.drop-target');
    if(dragState.dragId && targetRow && targetRow.dataset.dragId !== dragState.dragId){
      const archIdx = targetRow.dataset.archIdx !== undefined ? parseInt(targetRow.dataset.archIdx, 10) : null;
      const fromArchIdx = dragState.archIdx !== undefined ? dragState.archIdx : null;
      if(archIdx !== null && fromArchIdx !== null && !isNaN(archIdx)){
        reorderArchiveStudent(archIdx, dragState.dragId, targetRow.dataset.dragId);
      } else {
        const L = curLesson();
        if(L) reorderStudent(L, dragState.dragId, targetRow.dataset.dragId);
      }
    }
  }
  if(dragState.ghost){ dragState.ghost.remove(); dragState.ghost = null; }
  $$('tr.student-row').forEach(r => r.classList.remove('dragging','drop-target'));
  dragState.touchActive = false;
  dragState.dragId = null;
  dragState.archIdx = undefined;
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
    dragState.archIdx = row.dataset.archIdx !== undefined ? parseInt(row.dataset.archIdx, 10) : undefined;
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
    if(!dragState.dragId) return;
    e.preventDefault();
    if(row && row.dataset.dragId !== dragState.dragId){
      // تحقق: هل السحب داخل الأرشيف أم الدرس العادي؟
      const archIdx = row.dataset.archIdx !== undefined ? parseInt(row.dataset.archIdx, 10) : null;
      const fromArchIdx = dragState.archIdx !== undefined ? dragState.archIdx : null;
      if(archIdx !== null && fromArchIdx !== null && !isNaN(archIdx)){
        reorderArchiveStudent(archIdx, dragState.dragId, row.dataset.dragId);
      } else {
        const L = curLesson();
        if(L) reorderStudent(L, dragState.dragId, row.dataset.dragId);
      }
    }
    $$('tr.student-row').forEach(r => r.classList.remove('dragging','drop-target'));
    dragState.dragId = null;
    dragState.archIdx = undefined;
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


/* ---------- 📱 إدارة زر الرجوع وسحب الهاتف (History API) ---------- */
function pushAppHistory(stateObj){
  try {
    window.history.pushState(stateObj || { app: 'daftar', time: Date.now() }, '');
  } catch(e){}
}

function handleAppBack(){
  // 1. إذا كان المودال مفتوحاً -> إغلاقه
  const overlay = $('#modalOverlay');
  if(overlay && !overlay.hidden && overlay.style.display !== 'none'){
    closeModal();
    return true;
  }

  // 2. إذا كانت لوحة الإشعارات مفتوحة -> إغلاقها
  const notifPanel = $('#notifPanel');
  if(notifPanel && !notifPanel.hidden){
    notifPanel.hidden = true;
    return true;
  }

  // 3. إذا كانت هناك قوائم منسدلة مفتوحة -> إغلاقها
  const openMenus = $$('.dropdown-menu').filter(m => !m.hidden);
  if(openMenus.length > 0){
    openMenus.forEach(m => { m.hidden = true; });
    return true;
  }

  // 4. إذا كان التحديد المتعدد مفعل -> إلغاؤه
  if(isBulkSelecting){
    isBulkSelecting = false;
    selectedStudentIds.clear();
    renderLessonDetail();
    return true;
  }

  // 5. إذا كان المستخدم داخل تفاصيل شهر مؤرشف -> الرجوع لقائمة الأرشيف
  const archDetail = $('#archiveDetail');
  const archList = $('#archiveList');
  if(archDetail && archDetail.style.display !== 'none' && currentArchiveIdx !== null){
    archDetail.style.display = 'none';
    archDetail.innerHTML = '';
    if(archList) archList.style.display = 'grid';
    currentArchiveIdx = null;
    return true;
  }

  // 6. إذا كان المستخدم داخل تفاصيل درس -> الرجوع لقائمة الدروس
  const detail = $('#lessonDetail');
  if(detail && detail.style.display !== 'none' && currentLessonId){
    currentLessonId = null;
    renderLessonsHome();
    return true;
  }

  // 7. إذا كان في تبويب غير الدروس -> الرجوع لتبويب الدروس
  const activeTab = $('.tab.active');
  if(activeTab && activeTab.dataset.tab !== 'lessons'){
    switchTab('lessons');
    return true;
  }

  // 8. في الشاشة الرئيسية -> منع الخروج إلا بضغطة مزدوجة
  const now = Date.now();
  if(now - lastBackPressTime < 2000){
    return false;
  } else {
    lastBackPressTime = now;
    showToastMessage('اضغط مرة أخرى للخروج من التطبيق');
    pushAppHistory({ root: true });
    return true;
  }
}

/* ---------- تشغيل ---------- */
function initApp(){
  try {
    pushAppHistory({ root: true });
    checkAndRestoreIndexedDBBackup().then(restored => {
      if(restored) renderAll();
    });
    renderAll();
    bindEvents();
    initDragReorder();
    initAutoSave();
    renderToday();
    scheduleReminders();
    maybeShowChangelog(() => maybePromptNotifications());
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  } catch(err) {
    console.error('Initialization error:', err);
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


/* global dropdown closer */
document.addEventListener('click', (e) => {
  if(e.target.closest('.dropdown-item') || e.target.closest('.subtab-btn') || e.target.closest('.tab')){
    $$('.dropdown-menu').forEach(m => { m.hidden = true; });
  }
});


  document.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && e.target.matches('.page-size-custom-input')){
      e.target.blur();
    }
  });

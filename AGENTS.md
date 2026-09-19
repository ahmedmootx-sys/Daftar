# Daftar — ملف السياق والتسليم الكامل (حتى v28)

> **لمن هذا الملف؟** لأي وكيل ذكي أو مطوّر سيكمل المشروع على محرر Antigravity (أو غيره).
> اقرأه **كاملًا** قبل أي تعديل. هو الخلاصة التراكمية لكل قرارات التصميم والتنفيذ من بداية المشروع حتى **v28** (17 سبتمبر 2026).
> أنشئ في الأصل بواسطة مساعد AutoClaw بناءً على طلب صاحب المشروع، وسيُحدَّث مع كل إصدار جديد.

---

## 1) بطاقة المشروع

| البند | القيمة |
|---|---|
| **اسم التطبيق** | Daftar (`APP_NAME`) |
| **الغرض** | تتبّع حضور وغياب الطلاب في الدروس + المتابعة الشهرية + تقارير وطباعة |
| **النوع** | تطبيق ويب PWA، يعمل أوفلاين، موبايل-أول |
| **اللغة/الاتجاه** | عربي بالكامل، RTL |
| **التخزين** | localStorage + حفظ تلقائي في ملف (File System Access API) + IndexedDB للحفظ التلقائي |
| **الإصدار الحالي** | `v30` (ثابت `APP_VERSION` في أول app.js) |
| **المالك / الدعم (ثابت في الكود)** | Ahmed Saber Sayed Hamed — `ADMIN_NAME` / `ADMIN_PHONE = '+20 12 83279337'` |
| **واتساب الافتراضي في الإعدادات** | `+201038805435` |
| **التيم اللوني** | أساسي `#2E3A87` (theme-color في manifest)، أزرار أخضر للحضور `#15803d` |

---

## 2) الملفات والبنية

مجلد المشروع (على جهاز المالك):
```
C:\Users\power tech\.openclaw-autoclaw\workspace\projects\website-e74bae0c11c6d8c32df5bfac\
├── app.js         ← كل المنطق (واحد فقط، ~3,470 سطر، بدون وحدات/موديولات)
├── index.html     ← هيكل الصفحة كاملًا (تابات + مودال + توست + printArea)
├── styles.css     ← كل التنسيقات (~420 سطر) بما فيها تنسيقات الطباعة
├── sw.js          ← Service Worker (كاش 'daftar-v1'، شبكة-أولًا مع fallback)
├── manifest.json  ← PWA manifest (standalone, rtl, أيقونة svg)
├── icon.svg       ← الأيقونة
└── nginx.conf     ← إعدادات استضافة ثابتة
```

- **سجل المشاريع:** `C:\Users\power tech\.openclaw-autoclaw\workspace\projects\projects.json` — فيه حقل `updatedAt` يجب تحديثه مع كل تعديل.
- **الحزم (ZIP):** تُبنى في جذر الـ workspace باسم `Daftar-v<رقم>.zip` وتُسلَّم للمستخدم كرابط مسار مطلق.
- **التطبيق لا يعتمد على أي build step** — لا npm، لا bundler. الملفات تُخدم كما هي. أي "بناء" = ضغط الملفات السبعة في ZIP فقط.

---

## 3) بروتوكول العمل الإلزامي مع كل تعديل

البيئة: **PowerShell على Windows** — المسارات فيها مسافات → علامات اقتباس إجبارية.

ترتيب الخطوات الثابت لأي تعديل:

1. عدّل الكود (`app.js` و/أو `styles.css` و/أو `index.html`).
2. **إن كانت الميزة ظاهرة للمستخدم:** ارفع `APP_VERSION` (v28 ← v29 ...) وأضف مفتاحًا جديدًا في `CHANGELOG` بنفس رقم الإصدار (نصوص عربية + إيموجي، أسلوب السطور الموجودة).
3. **تحقق:** `node --check '<مسار app.js>'` — لازم يمر قبل أي تسليم.
4. **ابنِ الحزمة** (السكربت الجاهز أدناه).
5. حدّث `updatedAt` في `projects.json`.
6. سلّم برابط المسار المطلق للـ ZIP في نهاية الرد.

سكربت بناء الحزمة (غيّر رقم الإصدار فقط):
```powershell
$projDir = "C:\Users\power tech\.openclaw-autoclaw\workspace\projects\website-e74bae0c11c6d8c32df5bfac"
$zipPath = "C:\Users\power tech\.openclaw-autoclaw\workspace\Daftar-v29.zip"
if(Test-Path $zipPath){Remove-Item $zipPath -Force}
Compress-Archive -Path (Join-Path $projDir 'app.js'),(Join-Path $projDir 'index.html'),(Join-Path $projDir 'styles.css'),(Join-Path $projDir 'sw.js'),(Join-Path $projDir 'manifest.json'),(Join-Path $projDir 'icon.svg'),(Join-Path $projDir 'nginx.conf') -DestinationPath $zipPath
```

---

## 4) نموذج البيانات ومفاتيح التخزين

### مفاتيح التخزين (مهم جدًا — لا تغيّرها)
| المفتاح | القيمة/النوع | الغرض |
|---|---|---|
| `STORAGE_KEY` | **قيمته الحرفية `'***'`** (ثابت في سطر 8 من app.js — غريب لكنه كذلك من بداية المشروع) | كل بيانات المستخدم (state كامل JSON). **لا تغيّره أبدًا — بيانات حية عند المستخدمين مخزّنة تحته** |
| `CHANGELOG_STORE_KEY` | `'daftar_whatsnew'` (v28) | إشعارات "ما الجديد" غير المحذوفة + `seenVersion` |
| `AUTOSAVE_FLAG` | `'attendance_autosave_prompted'` | حتى لا يتكرر سؤال تفعيل الحفظ التلقائي |
| IndexedDB | قاعدة `'attendance-app'` v1 | مقبض ملف الحفظ التلقائي |
| SW cache | `'daftar-v1'` | كاش Service Worker (network-first، fallback لـ index.html) |
| (قديم) `'daftar_seen_version'` | — | استُبدل في v28 بآلية `daftar_whatsnew`؛ لا يوجد كود يعتمده الآن |

### هيكل `state` (version: 6)
```
state = {
  version: 6,
  settings: {...},          // انظر أدناه
  moneyPasswordHash: '', moneySecurityQ: '', moneySecurityA: '',   // حماية قسم الدخل (sha256)
  lessons: [...],           // الدروس الجارية
  archive: [...]            // الشهور المؤرشفة/المقفلة
}
```

### `settings` (defaults في `defaultState()`)
- `appTitle` ('جدول حضور وغياب'), `monthTitleTemplate` ('...شهر {month}'), `studentLabel`, `notesLabel`
- `customFields[]` — أعمدة إضافية لكل طالب `{id, label}`
- `statuses[]` — حالات الحضور `{id, label, color}` (الافتراضية: `st_done` حضور، `st_apology`، `st_noanswer`)
- `whatsappNumber`, `whatsappType` ('normal'|'business'), `messageTemplate` (مع `{time}`)
- `ownerName`, `ownerPhone` — تُفرض دائمًا من ثوابت الكود في `normalizeState`
- `attendanceIndicators[]` — 3 مؤشرات خطر `{id, label, color, minPct}` (مثالي ≥90، متابعة ≥50، إنقاذ ≥0)
- `warnFutureAttendance` — **(v28)** bool، افتراضي `true`؛ مفتاح السويتش في الإعدادات

### `lesson`
```
{ id, name, monthNumber, year,
  students[], sessions[], records,        // السجلات
  schedule, groups[], reminderMinutes,    // الجدولة (أيام أسبوع + وقت + مجموعات لكل منها وقت/تذكير/جروب واتساب)
  statuses?,                              // حالات خاصة لهذا الدرس فقط (effectiveStatuses تدمجها)
  lastExportAt, paid... }
```

### `student`
```
{ id, name, phone, guardianPhone, extraPhones[], guardianExtraPhones[],
  paid, groupId, fields: {customFieldId: value},
  address, job, age, email, photo, profileNotes }
```

### `session`
```
{ id, label, date ('YYYY-MM-DD'), dateLabel, event, eventNote }
```

### `records[studentId][sessionId]` = `{ status, note }` — و `records[studentId]['__note__']` = ملاحظة عامة للطالب.

### `archive` (الشهر المؤرشف)
```
{ lessonId, monthNumber, year, sessions[], records{}, students[] }
```

### نقطة الامتداد للترقيات
`normalizeState()` هي **المكان الوحيد** لإضافة إعدادات جديدة أو ترقية بيانات قديمة — يجب أن تستوعب دائمًا بيانات ناقصة/قديمة بقيم افتراضية (نمط: `Object.assign({}, base.settings, raw.settings)` + تحققات Array). أي إعداد جديد = قيمة افتراضية في `defaultState()` + سطر تطبيع في `normalizeState()`.

---

## 5) خريطة app.js (174 دالة — الأهم مجمعة)

- **أدوات عامة:** `esc` (تهريب HTML إلزامي في كل HTML مُولَّد) · `uid(prefix)` · `digits` · `normalizePhone` · **`localPhone`** (إزالة رمز الدولة +20 — إلزامية في كل التصديرات) · `waHref` · `formatTime12` · `sha256Hex` · `normalizeForSearch`
- **الحالة:** `defaultState` · `normalizeState` · `loadState` · `saveState` (بعد كل تغيير) · `applyLoadedData`
- **العرض:** `renderAll` → `renderHeader/renderLessonsHome/renderLessonDetail/renderArchive/renderArchiveDetail/renderSettings` · `renderGlobalSearch` · `renderGroupFilter`
- **الجدولة:** `sessionDates` · `fillSessions` · `genSessions` · `addSession` · `lessonScheduleItems` · `todayScheduleItems` · `scheduleReminders` (تذكيرات Notification قبل الحصة)
- **تسجيل الحضور:** `statusSelectHTML` · `dayNoteHTML` · `updateStatusCellUI` · `updateSessionCounterUI` (تحديث فوري بدون إعادة رسم الجدول) · **`warnIfFutureSession` (v28)**
- **السحب وإعادة الترتيب:** `initDragReorder/reorderStudent/moveStudentTo/beginTouchDrag/moveTouchDrag/endTouchDrag/autoScrollOnDrag`
- **التقارير والحسابات:**
  - `computeStats` (counts+pct لكل طالب) · `pastSessions` (**يستبعد الحصص المستقبلية — تقارن `s.date <= todayStr`، الحصص بلا تاريخ تُحتسب**) · `effectiveStatuses` · `attendanceIndicator`
  - `showAnalytics` + `applyRange` — تقرير الشهر مع فلتر فترة (`#rangeFrom/#rangeTo`)
  - `comprehensiveData(lesson, from, to)` → `{months, rows, range}` · `showComprehensiveReport` + `applyRange` (`#compRangeFrom/#compRangeTo`)
  - تصدير: `exportCSV` (Excel الشهر) · `printReport` + `buildReportHTML` (PDF الشهر) · `exportComprehensiveCSV` · `printComprehensiveReport` · `printBlankSheet` · `exportBlankSheetExcel`
  - **كل التنزلات تمر عبر `downloadBlob`** (أولوية `showSaveFilePicker` ثم `<a download>`، CSV بـ BOM `\uFEFF`)
- **واتساب:** `openWhatsApp` · `waTargetOptions/resolveWaTarget` (طالب/ولي/جروب/رقم خارجي، عادي/بزنس) · `weeklyMessage` · `buildMonthReportText/showReportMessageModal` · `monthlyReportMessage` · `studentSummary` · `sessionSummary` — مع نسخ تلقائي للحاشة (`fallbackCopy`)
- **الدخل المحمي:** `moneyData/moneyMasked/moneyDisplay` · `askMoneyPassword/revealMoney/lockMoney` · `setupMoneyPassword/forgotMoneyPassword/setNewMoneyPassword`
- **الحفظ والنسخ:** `idbOpen/idbSet/idbGet/idbDel` · `autoSave*/initAutoSave` · `saveToFile/openFromFile` · `exportBackup/importBackup` · `encryptExport/decryptImport` (بكلمة مرور) · `exportLesson/importLesson` (دمج) · `exportArchiveMonth/importArchiveMonth` (دمج) · `archiveLessonMonth/restoreArchiveMonth/changeMonth`
- **"ما الجديد" (v28):** `versionNum` · `whatsNewList/whatsNewCount` · `removeWhatsNew` · `removeAllWhatsNew` · `whatsNewModal` · `maybeShowChangelog` · `renderNotifPanel` (يضم قسم ما الجديد) · `renderToday` (نقطة الجرس)
- **`bindEvents`:** كل ربط الأزرار والأحداث في مكان واحد — أضف ربط أي عنصر جديد هنا.

---

## 6) الواجهة (index.html)

- **الهيدر:** الشعار (زر رجوع للرئيسية) + **جرس الإشعارات** (`#notifBtn` + نقطة `#notifDot` + بانل `#notifPanel`) + زر الرسالة الأسبوعية + شارة الحفظ التلقائي.
- **3 تابات:** الدروس (الرئيسية + تفاصيل الدرس) / الأرشيف / الإعدادات.
- **تفاصيل الدرس:** شريط أدوات = `➕ عضو جديد` + قائمة `📊 التقارير ▾` (تقرير الشهر/تقرير كرسالة/الشامل/ورقة حضور) + قائمة `⚙️ إدارة ▾` (حصة/توليد/تغيير شهر/تعديل/حالات/ترتيب/تصدير/أرشفة). صف فلتر: تذكير التصدير + بحث داخل الدرس + فلتر المجموعة. ثم جدول `#attendanceTable` (thead/tbody/tfoot).
- **الإعدادات:** العناوين، أسماء الأعمدة، أعمدة إضافية، الحالات، مؤشرات الخطر، الإشعارات، **سويتش تنبيه الأيام المستقبلية `#set_warnFuture` (v28)**، الرسالة الأسبوعية، الحفظ التلقائي، النسخ الاحتياطي/التشفير/الاستيراد.
- **عناصر عامة:** مودال واحد (`#modalOverlay/#modalTitle/#modalBody` — تُستخدم لكل النوافذ عبر `openModal/closeModal`) · توست (`#toast/#toastBody` z-index 80 فوق المودال 50) · `#printArea` (مخفي، يُملأ عند الطباعة) · `<style id="printPageRule">` (يُضبط ديناميكيًا قبل كل `window.print()` ويُفرغ بعده).
- قاعدة CSS للطباعة: `body > *:not(#printArea){display:none!important}` داخل `@media print`.

---

## 7) التنسيق (styles.css) — أهم الكلاسات

- **القوائم المنسدلة:** `position:fixed` مع حساب مساحة وقلب لأعلى وتحديد `maxHeight` ديناميكي (`toggleDropdown`) — **تُغلق فقط بالنقر خارجها، لا بالتمرير**.
- **الطباعة:**
  - `.report` + `.r-title/.r-sub/.r-section/.r-foot`
  - `table.r-table` — `table-layout:fixed; width:100%`، `.ord-col` (عمود الترتيب 24px)، `.r-name`
  - `.report.compact` — **(v27)** الوضع المضغوط للطباعة: عنوان 14px، جدول 8px، حشو 2px/3px، لياقة أعلى
  - `.blank-sheet` — ورقة الحضور الفارغة (عمودية، 15 طالبًا/صفحة) + `.ord-num` (صندوق أصفر للرقم) + `.st-name/.st-phone` (اسم + هاتف مظلل أصفر `#fef9c3`)
- **v26 (إصلاح التداخل):** عمود `م` في ورقة الحضور 26px مع `overflow:hidden`، صندوق الرقم `white-space:nowrap; max-width:100%; box-sizing:border-box`، ومنع فيضان الهاتف.
- **v28:** `.np-news/.np-news-ver/.np-news-list/.np-news-del/.np-news-clear` (عناصر ما الجديد في البانل) + `.switch/.switch-slider/.switch-label` (سويتش iOS-style RTL: المقبض يمين = إيقاف، `translateX(-20px)` عند التفعيل، أخضر `#15803d`).

---

## 8) قواعد تصميمية ثابتة — لا تُخالف

1. **كل الردود والنصوص بالعربية** (لهجة المستخدم المصرية العامية مقبولة في الردود؛ نصوص الواجهة فصحى مبسطة).
2. **`localPhone` إلزامي** في كل تصدير/عرض أرقام في التقارير.
3. **الحصص المستقبلية مستبعدة** من كل التقارير والمؤشرات (`pastSessions`).
4. **لا أزرار جديدة** لو الميزة جزء من تقرير/شاشة موجودة (مثال: فلتر الفترة مدموج داخل تقرير الشهر والشامل).
5. **التصدير دائمًا عبر `downloadBlob`.**
6. **القوائم المنسدلة fixed ولا تُغلق بالتمرير.**
7. **الطباعة عمودية (portrait) ومضغوطة** (v27): الهامش 8mm وكلاس `compact` — لا ترجع للـ landscape إلا لو الحصص كثيرة جدًا (>12 عمود) وباتفاق مع المستخدم.
8. **مع كل ميزة ظاهرة:** `APP_VERSION++` + مدخل `CHANGELOG` + `node --check` + ZIP + `projects.json`.
9. **لا تلمس مفاتيح التخزين** (`STORAGE_KEY` بقيمته الحرفية `'***'`، وغيرها) — توافق البيانات الحية أولوية على نظافة الأسماء.
10. **`normalizeState` يجب أن يستوعب بيانات قديمة** دائمًا — لا تكسر الترقية السلسة.
11. **التحقق من القيم الحرفية عند الشك:** بعض مخرجات الطرفية قد تعرض نصًا مشوّهًا؛ استخدم `node -e` مع `[...str].map(c=>c.codePointAt(0))` للتأكد.

---

## 9) آخر ثلاثة إصدارات — تفاصيل التنفيذ

### v26 — إصلاح تداخل رقم الترتيب مع الاسم (ورقة الحضور PDF)
- المشكلة: عمود `م` بعرض 18px وكان صندوق الرقم الأصفر يفيض على خلية الاسم.
- الحل في styles.css: `.blank-sheet .ord-col{width:26px; overflow:hidden}` · `.ord-num` بحشو `0 3px` وخط 8px و`white-space:nowrap; max-width:100%; box-sizing:border-box` · `.st-name{display:block; word-wrap:break-word}` · `.st-phone` بمنع فيضان · `.r-table .ord-col` العام 24px.

### v27 — تقارير PDF عمودية مضغوطة (توفير ورق)
- `printComprehensiveReport`: من `landscape` إلى `@page{size:A4 portrait;margin:8mm}` + كلاس `compact` + خط الهاتف 7px.
- `printReport` (تقرير الشهر): **عمودي دائمًا** (أُلغي شرط landscape عند >6 حصص) + نفس الهامش.
- `buildReportHTML`: كلاس `compact` + خطوط inline صغرت (هاتف/حدث/ملاحظة = 7px).
- CSS: `.report.compact` — العناوين 14/11px، الجدول 8px، حشو 2px 3px، `.r-name` عرض 16%.
- النتيجة: ضِعف الطلاب تقريبًا في الصفحة الواحدة.

### v28 — مركز إشعارات التحديثات + تنبيه اليوم المستقبلي
**1) سجل "ما الجديد" داخل الجرس 🔔:**
- التخزين: `daftar_whatsnew` = `{ seenVersion: 'vNN', 'v26': [...], 'v27': [...] }` — كل إصدار غير محذوف مصفوفة نصوصه.
- `whatsNewList()`: تزامن تلقائية — أي مفتاح في `CHANGELOG` رقمه > `seenVersion` و≤ الإصدار الحالي يُنسخ للمخزن (مرة واحدة). الحذف يحذف مفتاح الإصدار فقط؛ `seenVersion` يمنع إعادة ظهوره عند الترقيات القادمة. يرجّع الإصدارات مرتبة تصاعديًا.
- العرض: داخل `renderNotifPanel` قسم "🆕 ما الجديد؟" — كل إصدار عنصر قابل للنقر يفتح `whatsNewModal(v)` (نافذة تفاصيل + زر حذف) + زر 🗑️ لكل إصدار + زر "حذف كل إشعارات التحديثات". الضغط على الإغلاق خارج البانل لا يتعارض (البانل داخل `.notif-wrap`).
- نقطة الجرس: تضيء إذا `whatsNewCount() > 0` حتى لو لا توجد حصص اليوم (تعديل `renderToday`).
- `maybeShowChangelog` (رسالة الترقية التلقائية): صارت تقرأ من المخزن نفسه وتستدعي `renderToday()` بعد الإغلاق. أول تشغيل (لا seenVersion) يضيف الإصدار الحالي فقط.
- **لا يزال `CHANGELOG` في الكود هو المصدر الأبدي** — الحذف من المخزن لا يمسّه.

**2) تنبيه اليوم الذي لم يأتي بعد:**
- `warnIfFutureSession(L, ssid)`: إن `settings.warnFutureAttendance !== false` والحصة لها `date > todayStr` → توست تحذيري "لم يأتي بعد... تم تسجيل الحضور" (لا يمنع، لا يتراجع).
- الربط: داخل معالج `document change` لـ `[data-act="status"]` في فرع الدرس الجاري فقط (بعد `updateSessionCounterUI`). الأرشيف لا يُنبَّه (ماضٍ بطبيعته).
- الإعدادات: سويتش `#set_warnFuture` (كلاس `.switch` RTL) — تفعيله الافتراضي `true`، تطبيع في `normalizeState` بـ `!== false`.
- التوست يستخدم `showToastMessage` الموجود (z-index 80 يظهر فوق المودالات).

---

## 10) سجل الإصدارات الكامل (من CHANGELOG)

- **v30:** 
  1. **التحضير السريع الجماعي (Bulk Attendance):** تعيين حالة حضور/غياب/اعتذار أو تفريغ لجميع طلاب الحصة بنقرة واحدة عبر زر `⚡` في رأس كل حصة.
  2. **المراسلة التسلسلية الذكية (Sequential WhatsApp):** محرك إرسال تتابعي للغائبين أو الحاضرين أو كل الطلاب مع قوالب متغيرة (`{name}`, `{lesson}`, `{date}`, `{group}`).
  3. **سجل مصروفات ومدفوعات الطالب:** تتبع الأقساط ورسوم الملازم/الكتب لدروس الاشتراك مع شارات سداد تفاعلية وسجل إيداعات تفصيلي.
  4. **جدول درجات الاختبارات المستقل:** تبويب فرعي مستقل للامتحانات وحساب المتوسط والنسبة المئوية لكل طالب مع إدراجها بالتقارير.
  5. **لوحة المؤشرات والتحليلات (Dashboard):** بطاقة ذكية بأعلى الرئيسية لإجمالي الطلاب والحصص ونسب الحضور مع زر لإخفاء المبالغ وتحليلات بيانية.
  6. **التحديد المتعدد ونقل الطلاب:** صندوق اختيار لكل طالب وشريط إجراءات جماعية لنقل أو تكرار عدة طلاب بين الدروس والمجموعات مع ترحيل الحضور.
  7. **النسخ الاحتياطي السحابي الهجين:** مشاركة مباشرة عبر Google Drive/تطبيقات الهاتف وإرسال تلقائي للنسخة إلى محادثة Telegram Bot.
- **v29:** بطاقة الطالب الشخصية المتكاملة، تحريك وترتيب الحصص، تجديد الإعدادات والسويتشات الحديثة، رسالة التحديث لمرة واحدة.
- **v28:** سجل "ما الجديد" داخل شريط الإشعارات (قراءة/حذف في أي وقت) · تنبيه عند تسجيل حضور في يوم لم يأتِ بعد (بدون منع، قابل للإيقاف).
- **v27:** تقارير PDF عمودية (Portrait) مضغوطة — صفوف أقصر وخط أصغر لاستيعاب طلاب أكثر وتوفير ورق.
- **v26:** إصلاح تداخل رقم الترتيب "م" مع اسم الطالب في ورقة الحضور المطبوعة.
- **v25:** عمود "م" في أول كل الجداول المصدّرة · ورقة الحضور عمودية بـ 15 طالبًا/صفحة · خلية الاسم (اسم بارز + هاتف مظلل أصفر).
- **v24:** فلتر فترة (من/إلى) في تقرير الشهر والشامل · Excel الشامل: خلية الشهر فيها `5/9` والنسبة تحتها.
- **v23:** حذف رمز الدولة (+20) من كل التصديرات · تقرير شامل جديد (طلاب × شهور) · إصلاح القوائم المنسدلة (تثبيت + سكرول داخلي).
- **v22:** مؤشرات خطر الغياب القابلة للتخصيص · اختيار مكان حفظ الملف · تذكير التصدير · تبسيط الشريط لقوائم · استبعاد الحصص المستقبلية من الحسابات.
- **v21:** هاتف طالب + ولي أمر + أرقام إضافية · منتقي جهات الاتصال (`navigator.contacts`) · إصلاح ملخص الحصة. *(لا يوجد مدخل v20 في CHANGELOG — ميزات v20 ذُكرت ضمن v21؛ هذا ليس خللًا)*
- **v19:** ورقة حضور فارغة PDF/Excel.
- **v18:** تصدير/استيراد شهر مؤرشف منفصل · تصدير درس بشهوره · حالات خاصة لدرس معين · صلاحيات كاملة للأرشيف.
- **v17:** استعادة شهر مؤرشف.
- **v16:** تقرير الشهر كرسالة واتساب · تعديل المؤرشف مباشرة.
- **v15:** ملخص حضور الطالب واتساب · تحديث فوري للحالة بدون إعادة رسم.
- **v14:** حدث للحصة (اختبار...) · ملخص الحصة · Excel: الاسم والرقم في خلية واحدة.
- **v13:** جروب واتساب لكل مجموعة · تقرير شامل PDF/Excel · عداد حضور لكل حصة.
- **v12:** بحث برقم الترتيب · تمرير الجدول بالماوس · ترتيب حسب الحضور · اسم ملف تصدير وصفي · رسالة التحديثات عند كل إصدار.
- **v11:** نسخ تلقائي للرسالة · تمرير تلقائي بالسحب · أوفلاين (SW) · طلب صلاحية الإشعارات.
- **v10:** واتساب عادي/بزنس · استرجاع كلمة سر الدخل بسؤال أمان · إصلاح فقدان سجلات عند تعديل المجموعات.
- *(ما قبل v10: التطوير الأولي — جدول الحضور، المجموعات، الأرشفة، الحفظ المحلي.)*

---

## 11) فخاخ معروفة وملاحظات بيئة

1. **أدوات تحليل الصور تفشل غالبًا** (خطأ 400 من الموديل) — اعتمد وصف المستخدم النصي أو جرّب مهارة `autoglm-image-recognition` ثم استسلم للنص.
2. **مخرجات الطرفية قد تُشوّه نصًا** (مثال حقيقي: مفتاح `daftar_whatsnew` ظهر في العرض كأنه `***` بينما الملف سليم) — تحقق دائمًا بـ char codes قبل الحكم على قيمة.
3. **`STORAGE_KEY` حرفيًا `'***'`** — قيمة صحيحة ومن اليوم الأول؛ أي محاولة "تنظيفها" تمحو بيانات كل المستخدمين.
4. **عنوان ورقة الحضور يحمل نصًا ثابتًا:** `"أبنام حضور وغياب عن <اسم الدرس>"` في `printBlankSheet` — قرار قائم من v19 (يبدو اسمًا مخصصًا). إن طُلب تعميمه: استبدل البادئة بـ `esc(sd.appTitle)` أو `esc(APP_NAME)`.
5. **PowerShell:** اقتبس كل مسار فيه مسافة؛ استخدم `Join-Path`.
6. **ZIP = 7 ملفات محددة فقط** (بدون projects.json أو أي ملف آخر).
7. **Service Worker:** cache `'daftar-v1'` network-first — لا يحتاج رفع رقم عند كل إصدار؛ لو تغيّرات بنية كبيرة يمكن رفعه لكسر الكاش نهائيًا.
8. **مقارنة الإصدارات رقمية** عبر `versionNum` (`'v28'` → 28) — لا تستخدم مقارنة نصية أبدًا.
9. **المودال والتوست عامّان** — أي نافذة جديدة تُبنى بـ `openModal(عنوان, html)` وأزرار تُربط بعد فتحها بـ `$('#id').onclick`.

---

## 12) عناصر مفتوحة / خطوات مقترحة تالية

- [ ] تحقق ميداني (على جهاز أندرويد للمستخدم) من v28: ظهور قسم "ما الجديد" في الجرس، حذف إشعار/حذف الكل، إضاءة النقطة، السويتش في الإعدادات، ورسالة التنبيه عند يوم مستقبلي.
- [ ] تحقق من القوائم المنسدلة على الموبايل بعد v23 (كل الخيارات ظاهرة، بلا قطع خلف شريط أندرويد).
- [ ] تأكيد أن ورقة الحضور تطبع 15 طالبًا فعلًا في الصفحة (مقارنة بالصورة المرجعية `WhatsApp Image 2026-09-03 at 6.15.20 PM.jpeg`).
- [ ] تأكيد `localPhone` في كل صادرات تقرير الشهر (كانت مكتملة حتى v25).
- [ ] أفكار لم تُنفذ بعد (من نقاشات سابقة، غير ملزمة): طباعة دفعة أوراق حضور لأكثر من درس، تقرير مالي شهري بصيغة PDF، إشعار "لم تصدّر" أقوى.

---

## 13) كيف يكمل الوكيل الجديد (سير العمل المقترح في Antigravity)

1. ضع هذا الملف بجوار `app.js` في مجلد المشروع (مثلًا باسم `CONTEXT.md` أو `AGENTS.md` ليُحمَّل تلقائيًا كقواعد).
2. قبل أي مهمة: اقرأ القسم (8) قواعد ثابتة + القسم (3) بروتوكول التعديل.
3. نفّذ: عدّل → `node --check` → `APP_VERSION`/`CHANGELOG` إن لزم → ZIP بالسكربت → حدّث `updatedAt` → سلّم الرابط.
4. لا تُنشئ ملفات بنية جديدة (frameworks) — التطبيق مقصود أن يبقى 3 ملفات بسيطة (html/css/js) تعمل بفتح `index.html`.
5. عند الشك في سلوك قديم: ابحث في app.js بالاسم الوظيفي (كل الدوال مسماة بوضوح) — لا تعيد الاختراع.

---

*آخر تحديث لهذا الملف: 18 سبتمبر 2026 — يغطي حتى الإصدار v28 (الحزمة `Daftar-v28.zip`، 60,202 بايت).*

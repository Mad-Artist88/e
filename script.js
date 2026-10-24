// ============================================================
// ⚠️ ВСТАВЬТЕ ПОЧТУ АДМИНИСТРАТОРА СЮДА
// На этот адрес будут уходить письма из формы «Обратная связь» пользователя.
// ============================================================
const FEEDBACK_EMAIL = 'admin@aeza.net'; // <-- ВСТАВТЕ ПОЧТУ ЗДЕСЬ

const API_CONFIG = {
  USE_BACKEND: false,
  BASE_URL: 'http://127.0.0.1:8000/api/v1',
  ENDPOINTS: {
    AUTH_LOGIN: '/auth/login',
    AUTH_ME: '/auth/me',
    AUTH_LOGOUT: '/auth/logout',
    DEPARTMENTS: '/departments',
    RECURRING_PAYMENTS: '/recurring-payments',
    PAYMENT_OCCURRENCES: '/payment-occurrences',
    PAYMENT_HISTORY: '/audit-log',
    USERS: '/users'
  }
};

function invoiceKeeperApp(pageRole = 'admin') {
  return {
    pageRole: pageRole,
    theme: localStorage.getItem('app-theme') || 'light',
    weekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    departments: JSON.parse(localStorage.getItem('ik-departments') || 'null') || ['Маркетинг', 'ИТ', 'Отдел продаж', 'Бухгалтерия', 'Логистика'],
    newDeptName: '',
    showAddDeptInput: false,
    isDeptMenuOpen: false,

    // Полный календарь
    isFullCalendarOpen: false,
    calYear: 2026,
    calMonth: 7,
    jump: { day: 1, month: 8, year: 2026 },
    monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],

    // Обратная связь (пользователь)
    isFeedbackModalOpen: false,
    feedbackForm: {
      employee: '',
      department: '',
      request: '',
      amount: '',
      currency: 'RUB',
      dueDate: '',
      periodicity: 'Ежемесячно',
      customDays: 7
    },

    // Подключение Telegram (все пользователи)
    isTelegramModalOpen: false,
    telegramForm: { login: '', code: '' },
    telegramLinks: JSON.parse(localStorage.getItem('ik-telegram') || '{}'),

    get isAdmin() {
      // Права админа: и страница админская, и аккаунт с ролью admin
      return this.pageRole === 'admin' && this.currentAccount.role === 'admin';
    },

    get telegramLogin() {
      const link = this.telegramLinks[(this.currentAccount.email || '').toLowerCase()];
      return link ? link.login : '';
    },

    get telegramLinked() {
      return !!this.telegramLogin;
    },

    planCurrency: 'RUB',
    budgetPlans: {
      RUB: { month: 450000, year: 5400000 },
      USD: { month: 5200, year: 62400 },
      EUR: { month: 4800, year: 57600 }
    },

    get currentMonthPlan() {
      const plan = this.budgetPlans[this.planCurrency] || this.budgetPlans['RUB'];
      return `${plan.month.toLocaleString('ru-RU')} ${this.currencySymbol(this.planCurrency)}`;
    },

    get currentYearPlan() {
      const plan = this.budgetPlans[this.planCurrency] || this.budgetPlans['RUB'];
      return `${plan.year.toLocaleString('ru-RU')} ${this.currencySymbol(this.planCurrency)}`;
    },

    referenceTodayISO: '2026-08-27',
    startMonday: new Date(2026, 7, 24),

    tableSearch: '',
    tableDeptFilter: '',
    tableStatusFilter: '',
    tableCurrencyFilter: '',
    showTableFilter: false,

    journalSearch: '',
    journalStatusFilter: '',
    isHistoryFilterOpen: false,

    isModalOpen: false,
    editingId: null, // id платежа в режиме редактирования (null — режим создания)
    selectedDateISO: '2026-08-24',
    customPeriodDays: 7, // для кастомной периодичности в N дней
    newRec: {
      description: '',
      department: 'Маркетинг',
      employee: '',
      amount: '',
      currency: 'RUB',
      periodicity: 'Ежемесячно',
      status: 'В ожидании',
      paidAt: '',
      receiptUrl: ''
    },

    isAccountMenuOpen: false,
    isAddAccountModalOpen: false,
    addAccForm: {
      email: '',
      password: ''
    },

    loginForm: {
      email: 'admin@aeza.net',
      password: ''
    },

    accounts: JSON.parse(localStorage.getItem('ik-accounts') || 'null') || [
      {
        email: 'admin@aeza.net',
        role: 'admin',
        label: 'Админ',
        fullName: 'Администратор Системы',
        token: ''
      }
    ],
    activeAccountIndex: Number(localStorage.getItem('ik-active-account-idx') || 0),

    get currentAccount() {
      return this.accounts[this.activeAccountIndex] || this.accounts[0] || {
        email: 'admin@aeza.net',
        role: 'admin',
        label: 'Админ',
        fullName: 'Администратор'
      };
    },

    records: JSON.parse(localStorage.getItem('ik-records') || 'null') || [
      {
        id: 101,
        createdAt: '20.08.2026 12:00',
        dueDate: '2026-08-24',
        paidAt: '2026-08-24',
        employee: 'Иванов Иван Иванович',
        department: 'Маркетинг',
        description: 'Аренда офисного помещения',
        amount: 100000,
        currency: 'RUB',
        periodicity: 'Ежемесячно',
        status: 'Одобрено',
        isDeleted: false
      },
      {
        id: 102,
        createdAt: '21.08.2026 14:30',
        dueDate: '2026-08-25',
        paidAt: '',
        employee: 'Кошкина Полина Андреевна',
        department: 'ИТ',
        description: 'Выделенный сервер инфраструктура',
        amount: 450,
        currency: 'USD',
        periodicity: 'Ежемесячно',
        status: 'Отказано',
        isDeleted: false
      },
      {
        id: 103,
        createdAt: '22.08.2026 09:15',
        dueDate: '2026-08-29',
        paidAt: '',
        employee: 'Коновалов Андрей Николаевич',
        department: 'Отдел продаж',
        description: 'Корпоративная подписка CRM',
        amount: 180,
        currency: 'EUR',
        periodicity: 'Ежемесячно',
        status: 'В ожидании',
        isDeleted: false
      },
      {
        id: 104,
        createdAt: '25.08.2026 11:00',
        dueDate: '2026-09-02',
        paidAt: '2026-09-01',
        employee: 'Смирнова Ольга Петровна',
        department: 'Бухгалтерия',
        description: 'Обслуживание облачной кассы',
        amount: 15000,
        currency: 'RUB',
        periodicity: 'Ежемесячно',
        status: 'Одобрено',
        isDeleted: false
      }
    ],

    paymentHistory: JSON.parse(localStorage.getItem('ik-payment-history') || 'null') || [
      {
        id: 9001,
        paymentId: 101,
        timestamp: '24.08.2026 10:15',
        action: 'Статус изменен: В ожидании → Одобрено (Факт: 24.08.2026)',
        employee: 'Иванов Иван Иванович',
        actor: 'admin@aeza.net',
        department: 'Маркетинг',
        description: 'Аренда офисного помещения',
        amount: 100000,
        currency: 'RUB',
        status: 'Одобрено',
        dueDate: '2026-08-24',
        paidAt: '2026-08-24'
      }
    ],

    async init() {
      // При закрытии модалки в режиме редактирования сбрасываем форму,
      // чтобы данные платежа не «протекли» в следующее создание записи
      this.$watch('isModalOpen', (open) => {
        if (!open && this.editingId !== null) {
          this.editingId = null;
          this.resetNewRec();
        }
      });

      this.syncTelegramReminders();

      if (this.pageRole === 'admin' || this.pageRole === 'user') {
        const idx = this.accounts.findIndex(a => a.role === this.pageRole);
        if (idx !== -1) {
          this.activeAccountIndex = idx;
          localStorage.setItem('ik-active-account-idx', String(idx));
        }
      }
    },

    saveRecordsLocal() {
      localStorage.setItem('ik-records', JSON.stringify(this.records));
    },

    saveDepartmentsLocal() {
      localStorage.setItem('ik-departments', JSON.stringify(this.departments));
    },

    saveHistoryLocal() {
      localStorage.setItem('ik-payment-history', JSON.stringify(this.paymentHistory));
    },

    saveAccountsLocal() {
      localStorage.setItem('ik-accounts', JSON.stringify(this.accounts));
      localStorage.setItem('ik-active-account-idx', String(this.activeAccountIndex));
    },

    // Управление отделами для админа
    toggleAddDepartment() {
      if (!this.isAdmin) return;
      if (!this.showAddDeptInput) {
        this.showAddDeptInput = true;
        this.isDeptMenuOpen = false;
      } else if (this.newDeptName.trim()) {
        this.addDepartment();
      } else {
        this.showAddDeptInput = false;
      }
    },

    addDepartment() {
      if (!this.isAdmin) return;
      const name = this.newDeptName.trim();
      if (name && !this.departments.includes(name)) {
        this.departments.push(name);
        this.newRec.department = name;
        this.saveDepartmentsLocal();
        this.newDeptName = '';
        this.showAddDeptInput = false;
      }
    },

    removeDepartment(dept) {
      if (!this.isAdmin) return;
      if (this.departments.length <= 1) {
        window.alert('Должен остаться хотя бы один отдел.');
        return;
      }
      this.departments = this.departments.filter(d => d !== dept);
      this.saveDepartmentsLocal();
      if (this.newRec.department === dept) {
        this.newRec.department = this.departments[0];
      }
    },

    // Загрузка файла (скрепка)
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.newRec.receiptUrl = file.name;
      }
    },

    async recordHistoryChange(paymentItem, actionText) {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const timestamp = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const entry = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        paymentId: paymentItem.id,
        timestamp,
        action: actionText,
        employee: paymentItem.employee || this.currentAccount.fullName,
        actor: this.currentAccount.email,
        department: paymentItem.department,
        description: paymentItem.description,
        amount: Number(paymentItem.amount),
        currency: paymentItem.currency,
        status: paymentItem.status,
        dueDate: paymentItem.dueDate,
        paidAt: paymentItem.paidAt || ''
      };

      this.paymentHistory.unshift(entry);
      this.saveHistoryLocal();
    },

    async submitLoginPage() {
      const email = this.loginForm.email.trim();
      const password = this.loginForm.password.trim();
      if (!email || !password) return;

      const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
      const existingIdx = this.accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase());
      const accountObj = {
        email,
        role,
        label: role === 'admin' ? 'Админ' : 'Пользователь',
        fullName: role === 'admin' ? 'Администратор' : email.split('@')[0],
        token: ''
      };

      if (existingIdx !== -1) {
        this.accounts[existingIdx] = accountObj;
        this.activeAccountIndex = existingIdx;
      } else {
        this.accounts.push(accountObj);
        this.activeAccountIndex = this.accounts.length - 1;
      }

      this.saveAccountsLocal();
      window.location.href = role === 'admin' ? 'admin.html' : 'user.html';
    },

    openAddAccountModal() {
      this.isAccountMenuOpen = false;
      this.addAccForm.email = '';
      this.addAccForm.password = '';
      this.isAddAccountModalOpen = true;
    },

    async submitAddAccount() {
      const email = this.addAccForm.email.trim();
      const password = this.addAccForm.password.trim();
      if (!email || !password) return;

      const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
      const existingIdx = this.accounts.findIndex(a => a.email.toLowerCase() === email.toLowerCase());
      const newAcc = {
        email,
        role,
        label: role === 'admin' ? 'Админ' : 'Пользователь',
        fullName: role === 'admin' ? 'Администратор' : email.split('@')[0]
      };

      if (existingIdx !== -1) {
        this.accounts[existingIdx] = newAcc;
      } else {
        this.accounts.push(newAcc);
      }

      this.saveAccountsLocal();
      this.isAddAccountModalOpen = false;
    },

    switchAccount() {
      if (this.accounts.length < 2) {
        window.alert('Подключен только 1 аккаунт. Добавьте второй аккаунт для переключения.');
        return;
      }
      this.activeAccountIndex = (this.activeAccountIndex + 1) % this.accounts.length;
      this.saveAccountsLocal();
      const nextAcc = this.accounts[this.activeAccountIndex];
      this.isAccountMenuOpen = false;
      const targetPage = nextAcc.role === 'admin' ? 'admin.html' : 'user.html';
      if (!window.location.pathname.endsWith(targetPage)) {
        window.location.href = targetPage;
      }
    },

    async logoutAccount() {
      this.isAccountMenuOpen = false;
      window.location.href = 'auth.html';
    },

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('app-theme', this.theme);
    },

    // ---------- Полный календарь ----------
    toISO(d) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    openFullCalendar() {
      const s = this.startMonday;
      this.calYear = s.getFullYear();
      this.calMonth = s.getMonth();
      this.jump = { day: s.getDate(), month: s.getMonth() + 1, year: s.getFullYear() };
      this.isFullCalendarOpen = true;
    },

    shiftCalMonth(delta) {
      const d = new Date(this.calYear, this.calMonth + delta, 1);
      this.calYear = d.getFullYear();
      this.calMonth = d.getMonth();
    },

    get fullCalendarCells() {
      const first = new Date(this.calYear, this.calMonth, 1);
      const daysInMonth = new Date(this.calYear, this.calMonth + 1, 0).getDate();
      const lead = (first.getDay() + 6) % 7; // неделя с понедельника
      const rangeStart = this.toISO(this.startMonday);
      const endD = new Date(this.startMonday);
      endD.setDate(endD.getDate() + 13);
      const rangeEnd = this.toISO(endD);
      const cells = [];
      for (let i = 0; i < lead; i++) cells.push(null);
      for (let day = 1; day <= daysInMonth; day++) {
        const iso = this.toISO(new Date(this.calYear, this.calMonth, day));
        cells.push({
          day,
          iso,
          weekend: ((lead + day - 1) % 7) >= 5,
          inRange: iso >= rangeStart && iso <= rangeEnd,
          count: this.getRecordsByDate(iso).length
        });
      }
      while (cells.length % 7 !== 0) cells.push(null);
      return cells;
    },

    pickCalendarDate(iso) {
      const [y, m, d] = iso.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const dow = (date.getDay() + 6) % 7;
      date.setDate(date.getDate() - dow); // понедельник этой недели
      this.startMonday = date;
      this.selectedDateISO = iso;
      this.isFullCalendarOpen = false;
    },

    applyDateJump() {
      const y = Number(this.jump.year);
      const m = Number(this.jump.month);
      if (!y || !m) return;
      const maxDay = new Date(y, m, 0).getDate();
      const d = Math.min(Math.max(Number(this.jump.day) || 1, 1), maxDay);
      this.jump.day = d;
      this.calYear = y;
      this.calMonth = m - 1;
      this.pickCalendarDate(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    },

    shiftWeeks(days) {
      const next = new Date(this.startMonday);
      next.setDate(next.getDate() + days);
      this.startMonday = next;
    },

    get periodLabel() {
      const end = new Date(this.startMonday);
      end.setDate(end.getDate() + 13);
      const fmt = d => {
        const m = d.toLocaleDateString('ru-RU', { month: 'long' });
        return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.getFullYear()}`;
      };
      const s = fmt(this.startMonday);
      const e = fmt(end);
      return s === e ? s : `${s} — ${e}`;
    },

    get calendarDays() {
      const days = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(this.startMonday);
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        days.push({
          iso: `${yyyy}-${mm}-${dd}`,
          displayDate: `${dd}.${mm}`
        });
      }
      return days;
    },

    getRecordsByDate(iso) {
      // Админ видит и удаленные (серые), пользователь — только неудаленные
      if (this.isAdmin) {
        return this.records.filter(r => r.dueDate === iso);
      }
      return this.records.filter(r => r.dueDate === iso && !r.isDeleted);
    },

    isOverdue(item) {
      if (item.status === 'Одобрено' && item.paidAt) {
        return item.paidAt > item.dueDate;
      }
      return this.referenceTodayISO > item.dueDate;
    },

    // Метка TG в календаре — только если бот реально отправил напоминание.
    // У платежа должно быть поле tgReminderSentAt (ISO-дата/время отправки), его ставит бот.
    hasTelegramReminderSoon(iso) {
      return this.getRecordsByDate(iso).some(r => !r.isDeleted && !!r.tgReminderSentAt);
    },

    // ============================================================
    // TELEGRAM-НАПОМИНАНИЯ — КАК ПОДКЛЮЧИТЬ БД И БОТА
    //
    // 1) В БД добавьте в таблицу платежей колонку:
    //      tg_reminder_sent_at TIMESTAMP NULL
    //
    // 2) В боте — ежедневная задача (cron / scheduler):
    //      SELECT * FROM payments
    //       WHERE is_deleted = false
    //         AND due_date = CURRENT_DATE + INTERVAL '3 days'
    //         AND tg_reminder_sent_at IS NULL;
    //    -> отправить сообщение пользователю, и ТОЛЬКО после успешной отправки:
    //      UPDATE payments SET tg_reminder_sent_at = NOW() WHERE id = :id;
    //
    // 3) API должен отдавать tgReminderSentAt в списке платежей
    //    (либо отдельный эндпоинт, как ниже). Включите API_CONFIG.USE_BACKEND
    //    и раскомментируйте блок в syncTelegramReminders().
    //
    // 4) При смене срока платежа tgReminderSentAt сбрасывается (см. saveEditedRecord),
    //    на бэкенде сбрасывайте tg_reminder_sent_at в NULL так же.
    // ============================================================
    async syncTelegramReminders() {
      if (!API_CONFIG.USE_BACKEND) return;
      /*
      try {
        // Ожидаемый ответ: [{ "paymentId": 101, "sentAt": "2026-08-21T09:00:00Z" }, ...]
        const res = await fetch(API_CONFIG.BASE_URL + '/telegram/reminders', {
          headers: { Authorization: 'Bearer ' + (this.currentAccount.token || '') }
        });
        const list = await res.json();
        const map = {};
        list.forEach(x => { map[x.paymentId] = x.sentAt; });
        this.records.forEach(r => { r.tgReminderSentAt = map[r.id] || ''; });
      } catch (e) {
        console.error('Не удалось загрузить статусы Telegram-напоминаний', e);
      }
      */
    },

    async onStatusChange(item) {
      if (item.status === 'В ожидании') {
        item.paidAt = '';
      } else if (item.status === 'Одобрено' && !item.paidAt) {
        item.paidAt = item.dueDate;
      }
      this.saveRecordsLocal();
      await this.recordHistoryChange(
        item,
        `Изменен статус на «${item.status}»${item.paidAt ? ' (Факт. дата: ' + this.formatReadableDate(item.paidAt) + ')' : ''}`
      );
    },

    async onActualDateChange(item) {
      if (item.paidAt) {
        item.status = item.paidAt <= item.dueDate ? 'Одобрено' : 'Отказано';
      } else {
        item.status = 'В ожидании';
      }
      this.saveRecordsLocal();
      await this.recordHistoryChange(
        item,
        `Изменена фактическая дата оплаты: ${item.paidAt ? this.formatReadableDate(item.paidAt) : 'очищена'} → Статус «${item.status}»`
      );
    },

    getDayTotalsString(iso) {
      const recs = this.getRecordsByDate(iso).filter(r => !r.isDeleted);
      const totals = {};
      recs.forEach(r => {
        totals[r.currency] = (totals[r.currency] || 0) + Number(r.amount);
      });
      return Object.entries(totals)
        .map(([cur, val]) => `${val.toLocaleString('ru-RU')} ${this.currencySymbol(cur)}`)
        .join(' | ');
    },

    get filteredTableRecords() {
      const q = this.tableSearch.toLowerCase().trim();
      return this.records.filter(r => {
        if (r.isDeleted && !this.isAdmin) return false;
        const matchQ = !q ||
          r.description.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.employee.toLowerCase().includes(q);
        const matchDept = !this.tableDeptFilter || r.department === this.tableDeptFilter;
        const matchSt = !this.tableStatusFilter || r.status === this.tableStatusFilter;
        const matchCur = !this.tableCurrencyFilter || r.currency === this.tableCurrencyFilter;
        return matchQ && matchDept && matchSt && matchCur;
      });
    },

    get filteredHistoryRecords() {
      const q = this.journalSearch.toLowerCase().trim();
      return this.paymentHistory.filter(h => {
        const matchQ = !q ||
          (h.description && h.description.toLowerCase().includes(q)) ||
          (h.department && h.department.toLowerCase().includes(q)) ||
          (h.employee && h.employee.toLowerCase().includes(q)) ||
          (h.action && h.action.toLowerCase().includes(q));
        const matchSt = !this.journalStatusFilter || h.status === this.journalStatusFilter;
        return matchQ && matchSt;
      });
    },

    setHistoryFilter(status) {
      this.journalStatusFilter = status;
      this.isHistoryFilterOpen = false;
    },

    resetTableFilters() {
      this.tableSearch = '';
      this.tableDeptFilter = '';
      this.tableStatusFilter = '';
      this.tableCurrencyFilter = '';
    },

    openDayModal(iso) {
      this.selectedDateISO = iso;
      this.newRec.currency = 'RUB';
      this.newRec.paidAt = '';
      this.newRec.receiptUrl = '';
      if (!this.newRec.department) this.newRec.department = this.departments[0];
      this.isDeptMenuOpen = false;
      this.showAddDeptInput = false;
      this.isModalOpen = true;
    },

    async createRecord() {
      // Обычный пользователь не может создавать записи
      if (!this.isAdmin) return;
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const createdAt = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      let periodicityStr = this.newRec.periodicity;
      if (periodicityStr === 'Кастомная') {
        periodicityStr = `Каждые ${this.customPeriodDays} дн.`;
      }

      const created = {
        id: Date.now(),
        createdAt: createdAt,
        dueDate: this.selectedDateISO,
        paidAt: this.newRec.status === 'Одобрено' ? (this.newRec.paidAt || this.selectedDateISO) : this.newRec.paidAt,
        description: this.newRec.description.trim(),
        department: this.newRec.department,
        employee: this.newRec.employee.trim(),
        amount: Number(this.newRec.amount),
        currency: this.newRec.currency,
        periodicity: periodicityStr,
        status: this.newRec.status,
        receiptUrl: this.newRec.receiptUrl,
        isDeleted: false
      };

      this.records.unshift(created);
      this.saveRecordsLocal();

      await this.recordHistoryChange(
        created,
        `Создан платеж (${created.periodicity}, срок: ${this.formatReadableDate(created.dueDate)}, создана: ${createdAt})`
      );

      this.newRec.description = '';
      this.newRec.employee = '';
      this.newRec.amount = '';
      this.newRec.paidAt = '';
      this.newRec.receiptUrl = '';
      this.isModalOpen = false;
    },

    resetNewRec() {
      this.newRec = {
        description: '',
        department: this.departments[0] || '',
        employee: '',
        amount: '',
        currency: 'RUB',
        periodicity: 'Ежемесячно',
        status: 'В ожидании',
        paidAt: '',
        receiptUrl: ''
      };
      this.customPeriodDays = 7;
    },

    // Клик по строке реестра: админ — полное редактирование, остальные — просмотр платежей на дату
    openEditModal(rec) {
      if (!this.isAdmin) {
        this.openDayModal(rec.dueDate);
        return;
      }
      this.editingId = rec.id;
      this.selectedDateISO = rec.dueDate;

      let periodicity = rec.periodicity || 'Ежемесячно';
      const m = /^Каждые (\d+) дн\.$/.exec(periodicity);
      if (m) {
        periodicity = 'Кастомная';
        this.customPeriodDays = Number(m[1]);
      }

      this.newRec = {
        description: rec.description,
        department: rec.department,
        employee: rec.employee,
        amount: rec.amount,
        currency: rec.currency,
        periodicity,
        status: rec.status,
        paidAt: rec.paidAt || '',
        receiptUrl: rec.receiptUrl || ''
      };
      this.isDeptMenuOpen = false;
      this.showAddDeptInput = false;
      this.isModalOpen = true;
    },

    async saveEditedRecord() {
      if (!this.isAdmin || this.editingId === null) return;
      const rec = this.records.find(r => r.id === this.editingId);
      if (!rec) return;

      const f = this.newRec;
      const periodicityStr = f.periodicity === 'Кастомная' ? `Каждые ${this.customPeriodDays} дн.` : f.periodicity;
      const next = {
        dueDate: this.selectedDateISO,
        description: f.description.trim(),
        department: f.department,
        employee: f.employee.trim(),
        amount: Number(f.amount),
        currency: f.currency,
        periodicity: periodicityStr,
        status: f.status,
        paidAt: f.status === 'Одобрено' ? (f.paidAt || this.selectedDateISO) : (f.status === 'В ожидании' ? '' : f.paidAt),
        receiptUrl: f.receiptUrl
      };

      // Что изменилось — для журнала
      const labels = {
        dueDate: 'срок', description: 'описание', department: 'отдел', employee: 'сотрудник',
        amount: 'сумма', currency: 'валюта', periodicity: 'периодичность', status: 'статус',
        paidAt: 'факт. оплата', receiptUrl: 'файл'
      };
      const fmt = (k, v) => (k === 'dueDate' || k === 'paidAt') ? (this.formatReadableDate(v) || '—') : (v === '' || v == null ? '—' : v);
      const changes = [];
      Object.keys(labels).forEach(k => {
        const before = rec[k] == null ? '' : rec[k];
        if (String(before) !== String(next[k])) {
          changes.push(`${labels[k]}: ${fmt(k, before)} → ${fmt(k, next[k])}`);
        }
      });

      // Срок изменился — старое Telegram-напоминание уже неактуально
      if (next.dueDate !== rec.dueDate) rec.tgReminderSentAt = '';

      Object.assign(rec, next);
      this.saveRecordsLocal();

      if (changes.length) {
        await this.recordHistoryChange(rec, `Платеж изменен (${changes.join('; ')})`);
      }

      this.isModalOpen = false; // $watch сбросит editingId и форму
    },

    async deleteRecord(id) {
      // Обычный пользователь не может удалять платежи
      if (!this.isAdmin) return;
      const target = this.records.find(r => r.id === id);
      if (target) {
        // Мягкое удаление — помечаем isDeleted = true, чтобы админ видел серым
        target.isDeleted = true;
        this.saveRecordsLocal();
        await this.recordHistoryChange(target, 'Платеж помечен как удаленный');
      }
    },

    // ---------- Обратная связь (пользователь -> почта администратора) ----------
    openFeedbackModal() {
      if (this.isAdmin) return;
      this.feedbackForm.employee = this.feedbackForm.employee || this.currentAccount.fullName || '';
      this.feedbackForm.department = this.feedbackForm.department || this.departments[0] || '';
      this.feedbackForm.dueDate = this.feedbackForm.dueDate || this.referenceTodayISO;
      this.isFeedbackModalOpen = true;
    },

    submitFeedback() {
      const f = this.feedbackForm;
      const period = f.periodicity === 'Кастомная' ? `Каждые ${f.customDays} дн.` : f.periodicity;
      const body = [
        `Сотрудник: ${f.employee}`,
        `Отдел: ${f.department}`,
        `Запрос: ${f.request}`,
        `Платеж: ${Number(f.amount).toLocaleString('ru-RU')} ${f.currency}`,
        `До какого числа: ${this.formatReadableDate(f.dueDate)}`,
        `Периодичность: ${period}`,
        '',
        `Отправитель (аккаунт): ${this.currentAccount.email}`
      ].join('\n');

      // Копия обращения сохраняется локально
      const log = JSON.parse(localStorage.getItem('ik-feedback') || '[]');
      log.unshift({ sentAt: new Date().toISOString(), to: FEEDBACK_EMAIL, ...f });
      localStorage.setItem('ik-feedback', JSON.stringify(log));

      // Открывается почтовый клиент с готовым письмом на FEEDBACK_EMAIL.
      // При наличии бэкенда замените на POST /api/v1/feedback (отправка через SMTP).
      const subject = `Обратная связь Invoice Keeper: ${f.department} — ${f.employee}`;
      window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      this.feedbackForm.request = '';
      this.feedbackForm.amount = '';
      this.isFeedbackModalOpen = false;
    },

    // ---------- Подключение Telegram ----------
    openTelegramModal() {
      this.telegramForm.login = this.telegramLogin ? '@' + this.telegramLogin : '';
      this.telegramForm.code = '';
      this.isTelegramModalOpen = true;
    },

    submitTelegram() {
      const login = this.telegramForm.login.trim().replace(/^@/, '');
      const code = this.telegramForm.code.trim();
      if (!login || !code) return;
      // TODO (бэкенд): проверить пару «логин + код» через бота, напр. POST /api/v1/telegram/link
      this.telegramLinks[this.currentAccount.email.toLowerCase()] = { login, linkedAt: new Date().toISOString() };
      localStorage.setItem('ik-telegram', JSON.stringify(this.telegramLinks));
      this.isTelegramModalOpen = false;
    },

    disconnectTelegram() {
      delete this.telegramLinks[this.currentAccount.email.toLowerCase()];
      localStorage.setItem('ik-telegram', JSON.stringify(this.telegramLinks));
      this.isTelegramModalOpen = false;
    },

    statusColor(item) {
      if (item.isDeleted) return 'deleted-gray';
      if (this.isOverdue(item) || item.status === 'Отказано') return 'rejected';
      if (item.status === 'Одобрено') return 'approved';
      return 'pending';
    },

    currencySymbol(code) {
      if (code === 'USD' || code === '$') return '$';
      if (code === 'EUR' || code === '€') return '€';
      return '₽';
    },

    formatMoney(amount, currency) {
      return `${Number(amount).toLocaleString('ru-RU')} ${this.currencySymbol(currency || 'RUB')}`;
    },

    formatReadableDate(iso) {
      if (!iso) return '';
      const [y, m, d] = iso.split('-');
      return `${d}.${m}.${y}`;
    }
  };
}
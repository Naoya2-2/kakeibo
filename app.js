// 固定カテゴリの定義
const CATEGORIES = {
    expense: ['食費', '日用品', '交通費', '娯楽', '衣服', '医療費', '住宅費', 'その他'],
    income: ['給料', '副収入', '投資', '臨時収入', 'その他']
};

// 状態管理
let transactions = JSON.parse(localStorage.getItem('kakeibo_transactions')) || [];
let paymentMethods = JSON.parse(localStorage.getItem('kakeibo_payment_methods')) || ['現金', 'カード', 'SUICA', 'その他'];
let viewDate = new Date(); // 現在表示中の月
let selectedDate = new Date(); // 選択中の日

// DOM要素の取得
const transactionForm = document.getElementById('transactionForm');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const paymentMethodSelect = document.getElementById('paymentMethod');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const memoInput = document.getElementById('memo');
const transactionList = document.getElementById('transactionList');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const monthlyTotalEl = document.getElementById('monthlyTotal');
const currentMonthDisplay = document.getElementById('currentMonthDisplay');
const calendarDaysEl = document.getElementById('calendarDays');
const clearDataBtn = document.getElementById('clearData');
const formModal = document.getElementById('formModal');
const addBtn = document.getElementById('addBtn');
const closeModal = document.getElementById('closeModal');
const listTitle = document.getElementById('listTitle');

// 支払い方法管理用DOM
const paymentModal = document.getElementById('paymentModal');
const managePaymentMethodsBtn = document.getElementById('managePaymentMethods');
const closePaymentModalBtn = document.getElementById('closePaymentModal');
const paymentListEl = document.getElementById('paymentList');
const newPaymentMethodInput = document.getElementById('newPaymentMethod');
const addPaymentMethodBtn = document.getElementById('addPaymentMethod');

// 初期設定
dateInput.valueAsDate = new Date();

// カテゴリ選択肢を動的に更新
function updateCategoryOptions() {
    const type = typeSelect.value;
    categorySelect.innerHTML = '';
    CATEGORIES[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// 支払い方法のセレクトボックスを更新
function updatePaymentMethodSelect() {
    if (!paymentMethodSelect) return;
    paymentMethodSelect.innerHTML = '';
    paymentMethods.forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        paymentMethodSelect.appendChild(option);
    });
}

// 支払い方法管理リストの描画
function renderPaymentMethodList() {
    if (!paymentListEl) return;
    paymentListEl.innerHTML = '';
    paymentMethods.forEach((method, index) => {
        const div = document.createElement('div');
        div.className = 'payment-item';
        div.innerHTML = `
            <span class="payment-name">${method}</span>
            <button class="btn-delete" onclick="deleteExistingPaymentMethod(${index})">削除</button>
        `;
        paymentListEl.appendChild(div);
    });
}

// 支払い方法の追加
if (addPaymentMethodBtn) {
    addPaymentMethodBtn.onclick = () => {
        const name = newPaymentMethodInput.value.trim();
        if (!name) return;
        if (paymentMethods.includes(name)) {
            alert('その支払い方法は既に追加されています');
            return;
        }
        paymentMethods.push(name);
        newPaymentMethodInput.value = '';
        savePaymentMethods();
        renderPaymentMethodList();
        updatePaymentMethodSelect();
    };
}

// 支払い方法の削除
window.deleteExistingPaymentMethod = function (index) {
    if (paymentMethods.length <= 1) {
        alert('少なくとも1つの支払い方法が必要です');
        return;
    }
    if (confirm('この支払い方法を削除しますか？（過去の記録には影響しません）')) {
        paymentMethods.splice(index, 1);
        savePaymentMethods();
        renderPaymentMethodList();
        updatePaymentMethodSelect();
    }
};

function savePaymentMethods() {
    localStorage.setItem('kakeibo_payment_methods', JSON.stringify(paymentMethods));
}

// カレンダーの描画
function renderCalendar() {
    if (!calendarDaysEl) return;
    calendarDaysEl.innerHTML = '';
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    if (currentMonthDisplay) {
        currentMonthDisplay.textContent = `${year}年${String(month + 1).padStart(2, '0')}月`;
    }

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    // 先月の日付
    for (let i = firstDay; i > 0; i--) {
        const day = prevLastDate - i + 1;
        createDayElement(day, true);
    }

    // 今月の日付
    for (let i = 1; i <= lastDate; i++) {
        createDayElement(i, false, year, month);
    }

    // 来月の日付（6行分埋める）
    const remainingDays = 42 - (firstDay + lastDate);
    for (let i = 1; i <= remainingDays; i++) {
        createDayElement(i, true);
    }
}

function createDayElement(day, isOtherMonth, year, month) {
    const div = document.createElement('div');
    div.className = 'calendar-day' + (isOtherMonth ? ' other-month' : '');

    const dateKey = !isOtherMonth ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;

    // 今日、あるいは選択日をハイライト
    if (dateKey && dateKey === formatDate(selectedDate)) {
        div.classList.add('selected');
    }

    let incomeSum = 0;
    let expenseSum = 0;

    if (dateKey) {
        const dayTransactions = transactions.filter(t => t.date === dateKey);
        incomeSum = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        expenseSum = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    }

    div.innerHTML = `
        <span class="day-number">${day}</span>
        <div class="day-info">
            ${incomeSum > 0 ? `<div class="day-income">${incomeSum.toLocaleString()}</div>` : ''}
            ${expenseSum > 0 ? `<div class="day-expense">${expenseSum.toLocaleString()}</div>` : ''}
        </div>
    `;

    if (!isOtherMonth) {
        div.onclick = () => {
            selectedDate = new Date(year, month, day);
            dateInput.value = dateKey;
            saveAndRefresh();
        };
    }
    calendarDaysEl.appendChild(div);
}

// 収支の集計
function updateSummary() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const monthlyTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    if (totalIncomeEl) totalIncomeEl.textContent = `¥${income.toLocaleString()}`;
    if (totalExpenseEl) totalExpenseEl.textContent = `¥${expense.toLocaleString()}`;
    if (monthlyTotalEl) monthlyTotalEl.textContent = balance.toLocaleString();
}

// 取引リストの描画（選択日分）
function renderTransactions() {
    if (!transactionList) return;
    transactionList.innerHTML = '';
    const dateStr = formatDate(selectedDate);
    if (listTitle) {
        listTitle.textContent = `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日の記録`;
    }

    const dayTransactions = transactions.filter(t => t.date === dateStr);

    if (dayTransactions.length === 0) {
        transactionList.innerHTML = '<li class="empty">記録がありません</li>';
        return;
    }

    dayTransactions.forEach(t => {
        const li = document.createElement('li');
        li.className = 'transaction-item';

        const amountClass = t.type === 'income' ? 'income' : 'expense';
        const amountPrefix = t.type === 'income' ? '+' : '-';

        li.innerHTML = `
            <div class="item-main">
                <span class="item-category">${t.category} (${t.paymentMethod || '不明'})</span>
                <span class="item-memo">${t.memo || ''}</span>
            </div>
            <div class="item-side">
                <span class="item-amount ${amountClass}">${amountPrefix}¥${t.amount.toLocaleString()}</span>
                <button class="btn-delete" onclick="deleteTransaction('${t.id}')">削除</button>
            </div>
        `;
        transactionList.appendChild(li);
    });
}

// 取引の追加
if (transactionForm) {
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTransaction = {
            id: Date.now().toString(),
            type: typeSelect.value,
            amount: parseInt(amountInput.value),
            category: categorySelect.value,
            paymentMethod: paymentMethodSelect.value,
            date: dateInput.value,
            memo: memoInput.value
        };
        transactions.push(newTransaction);
        // 追加した日の月を、現在の表示月として、その日を選択日に
        selectedDate = new Date(dateInput.value);
        viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

        saveAndRefresh();
        if (formModal) formModal.classList.remove('active');
        transactionForm.reset();
        dateInput.valueAsDate = selectedDate;
        updateCategoryOptions();
        updatePaymentMethodSelect();
    });
}

// 削除
window.deleteTransaction = function (id) {
    if (confirm('削除しますか？')) {
        transactions = transactions.filter(t => t.id !== id);
        saveAndRefresh();
    }
};

// 全データクリア
if (clearDataBtn) {
    clearDataBtn.onclick = () => {
        if (confirm('すべて削除しますか？')) {
            transactions = [];
            saveAndRefresh();
        }
    };
}

// ナビゲーション
const prevMonthBtn = document.getElementById('prevMonth');
if (prevMonthBtn) {
    prevMonthBtn.onclick = () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        saveAndRefresh();
    };
}
const nextMonthBtn = document.getElementById('nextMonth');
if (nextMonthBtn) {
    nextMonthBtn.onclick = () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        saveAndRefresh();
    };
}

// ユーティリティ
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function saveAndRefresh() {
    localStorage.setItem('kakeibo_transactions', JSON.stringify(transactions));
    renderCalendar();
    updateSummary();
    renderTransactions();
}

// モーダル管理
if (addBtn) {
    addBtn.onclick = () => {
        dateInput.value = formatDate(selectedDate);
        if (formModal) formModal.classList.add('active');
    };
}
if (closeModal) closeModal.onclick = () => formModal.classList.remove('active');

if (managePaymentMethodsBtn) {
    managePaymentMethodsBtn.onclick = () => {
        renderPaymentMethodList();
        if (paymentModal) paymentModal.classList.add('active');
    };
}
if (closePaymentModalBtn) {
    closePaymentModalBtn.onclick = () => {
        if (paymentModal) paymentModal.classList.remove('active');
    };
}

window.onclick = (e) => {
    if (e.target === formModal) formModal.classList.remove('active');
    if (e.target === paymentModal) paymentModal.classList.remove('active');
};

if (typeSelect) typeSelect.addEventListener('change', updateCategoryOptions);

// 初回実行
updateCategoryOptions();
updatePaymentMethodSelect();
saveAndRefresh();

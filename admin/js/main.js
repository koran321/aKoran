const API = "/api"; 
let allTasks = [], allClients = [], allExpenses = [], allInvoices = [], allWriters = [], writerStats = [];
let expenseChartInstance = null;
let writerChartInstance = null;
let editingTxId = null;
let incomeChartInstance = null;

let currentTaskPage = 1;
let totalTaskPages = 1;
let currentTaskViewMode = 'list'; 
let isPhoneUnlocked = false;

let currentLang = localStorage.getItem('agencyLang') || 'en';
let currentTheme = localStorage.getItem('theme') || 'dark';

const tagColors = {
  "Assignment": "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
  "Thesis": "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300",
  "Presentation": "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300",
  "Lab Project": "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  "Other": "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
};

function applyTheme() {
  const html = document.documentElement;
  const icon = document.getElementById('themeIcon');
  if (currentTheme === 'dark') {
    html.classList.add('dark');
    icon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>';
  } else {
    html.classList.remove('dark');
    icon.innerHTML = '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>';
  }
}
applyTheme();

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  applyTheme();
  renderDashboard(); 
}

const translations = {
  en: {
    title: "Assignment Koran", subtitle: "Manage tasks, clients, and finances.", loading_text: "Loading...",
    nav_overview: "Overview", nav_clients: "Clients", nav_active: "Active Pipeline", nav_done: "Completed Works", nav_invoices: "Invoices", nav_writers: "Writers", nav_accounts: "Expenses",
    stat_earned: "Total Earned", stat_expected: "Expected Earnings", stat_expenses: "Expenses", stat_net: "Net Balance", stat_pending: "Active Pipeline", stat_total_tasks: "Total Tasks", stat_completed_tasks: "Completed Tasks",
    chart_title: "Expense Breakdown", chart_income_title: "Income Breakdown", chart_writer_title: "Writer Contribution", top_clients: "Top Clients (Earnings)", filter_all_time: "All Time", filter_this_month: "This Month", filter_last_month: "Last Month", filter_this_year: "This Year",
    total_clients: "Total Clients:", total_writers: "Total Writers:", btn_new_task: "+ New Task", btn_new_client: "+ Add Client", btn_new_writer: "+ Add Writer", btn_log_expense: "Log Expense",
    calculating: "Calculating...", no_tasks: "No tasks in pipeline.", no_done: "No completed works yet.", no_clients: "No clients registered.", no_expenses: "No expenses logged yet.",
    lbl_rel_task: "Associated Task (Optional)", opt_no_task: "No Task / General Expense", modal_exp_edit: "Edit Expense",
    modal_task_title: "Add New Task", lbl_desc: "Description / Title", lbl_details: "Details (Optional)", plc_details: "Enter specific requirements, links, or notes...", lbl_type: "Type of Work", lbl_deadline: "Deadline", lbl_client: "Client", search_client: "Search clients...", lbl_total: "Total Value (৳)", lbl_advance: "Advance Paid (৳)", lbl_bonus: "Bonus (৳)", lbl_assign: "Assign To", lbl_token: "Password", lbl_university: "University", lbl_link: "Project Link (Optional)", btn_deploy: "Deploy Task", btn_load_more: "Load More",
    modal_exp_title: "Log Expense", lbl_exp_cat: "Expense Category", lbl_exp_desc: "Description (Optional)", lbl_exp_amount: "Amount (৳)", btn_deduct: "Deduct Funds", btn_update: "Update", btn_export: "Export CSV", btn_invoice: "PDF Invoice",
    word_tasks: "Tasks", txt_internal: "Internal/No Client", txt_due: "Due", txt_total: "Total", txt_advance: "Advance", txt_bonus: "Bonus", txt_net_income: "Net Income", txt_logged: "Logged", txt_duration: "Duration", txt_open_ended: "Not Specified", txt_overdue: "Overdue", txt_days: "days", txt_unassigned: "Unassigned", txt_university: "University", txt_finished: "Finished",
    btn_edit: "Edit", btn_done: "Done", btn_undo: "Undo", opt_add_client: "+ Add New Client / No Client", btn_delete: "Delete", modal_client_edit: "Edit Client", modal_client_add: "Add New Client", btn_view_tasks: "View Tasks", btn_edit_client: "Edit Profile", btn_save_client: "Save Client", btn_cancel: "Cancel", btn_confirm: "Confirm", modal_auth_title: "Enter Password", msg_auth_status: "Enter password to change task status.", msg_auth_del_task: "Enter password to delete task.", msg_auth_del_exp: "Enter password to delete expense.", msg_auth_save: "Enter password to save changes.", msg_auth_phone: "Enter password to reveal phone numbers.", msg_auth_inv: "Enter password to download invoice.", search_tasks: "Search tasks...", filter_all_types: "All Types", filter_all_assignees: "All Assignees", tab_list: "List View", tab_board: "Kanban Board", status_pending: "Pending", status_in_progress: "In Progress", status_review: "Under Review", status_done: "Done",
    modal_writer_add: "Add New Writer", modal_writer_edit: "Edit Writer", lbl_w_name: "Full Name*", lbl_w_phone: "Phone*", lbl_w_email: "Email", lbl_w_image: "Image Link", lbl_w_dob: "Date of Birth", lbl_w_nid: "NID Details", btn_save_writer: "Save Writer", msg_writer_added: "Writer added!", msg_writer_updated: "Writer updated!", msg_writer_deleted: "Writer removed.", msg_req_name_phone: "Name and Phone are required!",
    lbl_country: "Country", lbl_program: "Program", lbl_subject: "Subject", opt_other: "Other...",
    lbl_writer_pay: "Writer Pay (৳)", lbl_links: "Reference Files / Links", recent_activity: "Recent Activity", workload: "Workload", earnings: "Earnings", pending_pay: "Pending Pay", urgent: "Urgent",
    track_portal_title: "Assignment Koran", track_portal_subtitle: "Order Tracking Portal", track_expected: "Expected Delivery", track_syncing: "Syncing...", track_help: "Need help? Contact your assigned coordinator.", track_loading: "Loading order details...", track_order_for: "Order for", track_not_found: "Order Not Found", track_invalid_link: "Please check your tracking link."
  },
  bn: {
    title: "অ্যাসাইনমেন্ট করান", subtitle: "টাস্ক, ক্লায়েন্ট এবং হিসাব পরিচালনা করুন।", loading_text: "লোড হচ্ছে...",
    nav_overview: "সারাংশ", nav_clients: "ক্লায়েন্ট", nav_active: "চলমান কাজ", nav_done: "সম্পন্ন কাজ", nav_invoices: "ইনভয়েস", nav_writers: "রাইটার", nav_accounts: "খরচ",
    stat_earned: "মোট আয়", stat_expected: "সম্ভাব্য আয়", stat_expenses: "মোট খরচ", stat_net: "নিট ব্যালেন্স", stat_pending: "চলমান কাজ", stat_total_tasks: "মোট কাজ", stat_completed_tasks: "সম্পন্ন কাজ",
    chart_title: "খরচের বিবরণ", chart_income_title: "আয়ের বিবরণ", chart_writer_title: "রাইটার কন্ট্রিবিউশন", top_clients: "শীর্ষ ক্লায়েন্ট (আয়)", filter_all_time: "সব সময়", filter_this_month: "এই মাস", filter_last_month: "গত মাস", filter_this_year: "এই বছর",
    total_clients: "মোট ক্লায়েন্ট:", total_writers: "মোট রাইটার:", btn_new_task: "+ নতুন কাজ", btn_new_client: "+ ক্লায়েন্ট যোগ করুন", btn_new_writer: "+ রাইটার যোগ করুন", btn_log_expense: "খরচ যোগ করুন",
    calculating: "হিসাব করা হচ্ছে...", no_tasks: "কোনো কাজ নেই।", no_done: "কোনো কাজ সম্পন্ন হয়নি।", no_clients: "কোনো ক্লায়েন্ট নেই।", no_expenses: "কোনো খরচের রেকর্ড নেই।",
    lbl_rel_task: "সম্পর্কিত কাজ (ঐচ্ছিক)", opt_no_task: "কোনো নির্দিষ্ট কাজ নয়", modal_exp_edit: "খরচ এডিট করুন",
    modal_task_title: "নতুন কাজ যোগ করুন", lbl_desc: "কাজের নাম / বিবরণ", lbl_details: "বিস্তারিত (ঐচ্ছিক)", plc_details: "নির্দিষ্ট প্রয়োজনীয়তা, লিঙ্ক বা নোট লিখুন...", lbl_type: "কাজের ধরন", lbl_deadline: "শেষ সময় (Deadline)", lbl_client: "ক্লায়েন্ট", search_client: "ক্লায়েন্ট খুঁজুন...", lbl_total: "মোট মূল্য (৳)", lbl_advance: "অগ্রিম পেমেন্ট (৳)", lbl_bonus: "বোনাস (৳)", lbl_assign: "দায়িত্বপ্রাপ্ত ব্যক্তি", lbl_token: "পাসওয়ার্ড", lbl_university: "বিশ্ববিদ্যালয়", lbl_link: "প্রজেক্ট লিঙ্ক (ঐচ্ছিক)", btn_deploy: "সেভ করুন", btn_load_more: "আরও দেখুন",
    modal_exp_title: "খরচ যোগ করুন", lbl_exp_cat: "খরচের খাত", lbl_exp_desc: "বিবরণ (ঐচ্ছিক)", lbl_exp_amount: "পরিমাণ (৳)", btn_deduct: "খরচ যুক্ত করুন", btn_update: "আপডেট", btn_export: "CSV এক্সপোর্ট", btn_invoice: "পিডিএফ ইনভয়েস",
    word_tasks: "টি কাজ", txt_internal: "নিজস্ব / ক্লায়েন্ট নেই", txt_due: "বাকি", txt_total: "মোট", txt_advance: "অগ্রিম", txt_bonus: "বোনাস", txt_net_income: "নিট আয়", txt_logged: "যুক্ত হয়েছে", txt_duration: "সময়কাল", txt_open_ended: "নির্ধারিত নয়", txt_overdue: "সময় পার হয়েছে", txt_days: "দিন", txt_unassigned: "নির্ধারিত নয়", txt_university: "বিশ্ববিদ্যালয়", txt_finished: "সম্পন্ন",
    btn_edit: "এডিট", btn_done: "সম্পন্ন", btn_undo: "পূর্বাবস্থায়", opt_add_client: "+ নতুন ক্লায়েন্ট / ক্লায়েন্ট নেই", btn_delete: "ডিলিট", modal_client_edit: "ক্লায়েন্ট এডিট", modal_client_add: "নতুন ক্লায়েন্ট", btn_view_tasks: "কাজগুলো দেখুন", btn_edit_client: "এডিট করুন", btn_save_client: "সেভ করুন", btn_cancel: "বাতিল", btn_confirm: "নিশ্চিত করুন", modal_auth_title: "পাসওয়ার্ড দিন", msg_auth_status: "স্ট্যাটাস পরিবর্তন করতে পাসওয়ার্ড দিন।", msg_auth_del_task: "কাজ ডিলিট করতে পাসওয়ার্ড দিন।", msg_auth_del_exp: "খরচ ডিলিট করতে পাসওয়ার্ড দিন.", msg_auth_save: "সেভ করতে পাসওয়ার্ড দিন।", msg_auth_phone: "ফোন নম্বর দেখতে পাসওয়ার্ড দিন।", msg_auth_inv: "ইনভয়েস ডাউনলোড করতে পাসওয়ার্ড দিন।", search_tasks: "কাজ খুঁজুন...", filter_all_types: "সব ধরন", filter_all_assignees: "সব ব্যক্তি", tab_list: "লিস্ট ভিউ", tab_board: "কানবান বোর্ড", status_pending: "অপেক্ষমান", status_in_progress: "চলমান", status_review: "রিভিউ চলছে", status_done: "সম্পন্ন",
    modal_writer_add: "নতুন রাইটার যোগ করুন", modal_writer_edit: "রাইটার এডিট", lbl_w_name: "পুরো নাম*", lbl_w_phone: "ফোন নম্বর*", lbl_w_email: "ইমেইল", lbl_w_image: "ছবির লিঙ্ক", lbl_w_dob: "জন্ম তারিখ", lbl_w_nid: "এনআইডি তথ্য", btn_save_writer: "রাইটার সেভ করুন", msg_writer_added: "রাইটার যোগ করা হয়েছে!", msg_writer_updated: "রাইটার আপডেট করা হয়েছে!", msg_writer_deleted: "রাইটার ডিলিট করা হয়েছে।", msg_req_name_phone: "নাম এবং ফোন নম্বর প্রয়োজন!",
    lbl_country: "দেশ", lbl_program: "প্রোগ্রাম", lbl_subject: "বিষয়", opt_other: "অন্যান্য...",
    lbl_writer_pay: "রাইটার পেমেন্ট (৳)", lbl_links: "রেফারেন্স ফাইল / লিঙ্ক", recent_activity: "সাম্প্রতিক কর্মকাণ্ড", workload: "কাজের চাপ", earnings: "উপার্জন", pending_pay: "বাকি পেমেন্ট", urgent: "জরুরী",
    track_portal_title: "অ্যাসাইনমেন্ট করান", track_portal_subtitle: "অর্ডার ট্র্যাকিং পোর্টাল", track_expected: "সম্ভাব্য ডেলিভারি", track_syncing: "সিংকিং...", track_help: "সহায়তা প্রয়োজন? কোঅর্ডিনেটরের সাথে যোগাযোগ করুন।", track_loading: "অর্ডার বিস্তারিত লোড হচ্ছে...", track_order_for: "অর্ডার:", track_not_found: "অর্ডার পাওয়া যায়নি", track_invalid_link: "আপনার ট্র্যাকিং লিঙ্কটি চেক করুন।"
  }
};

function t(key) { return translations[currentLang][key] || key; }

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerText = t(el.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-placeholder')); });
  
  document.getElementById('btnSaveTask').innerText = document.getElementById('editTaskId').value ? t('btn_update') : t('btn_deploy');
  const editClientBtn = document.getElementById('btnSaveClient');
  if (editClientBtn) editClientBtn.innerText = document.getElementById('editClientId').value ? t('btn_update') : t('btn_save_client');
  
  // Refresh current view to apply translations to dynamic content
  const params = new URLSearchParams(window.location.search);
  if (!params.get('track')) {
    refreshCurrentView();
  }
}

function refreshCurrentView() {
  const tabId = localStorage.getItem('activeTab') || 'dashboard';
  switch(tabId) {
    case 'dashboard': renderDashboard(); updateDashboardLogs(); break;
    case 'tasks': renderTasks(); break;
    case 'done': renderTasks(); break;
    case 'clients-view': renderClientsView(); break;
    case 'invoices': renderInvoicesView(); break;
    case 'writers': renderWritersView(); break;
    case 'accounts': renderExpenses(); break;
  }
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'bn' : 'en';
  localStorage.setItem('agencyLang', currentLang);
  applyTranslations();
  
  // If tracking view is active, re-init it to update dynamic labels
  const params = new URLSearchParams(window.location.search);
  const trackId = params.get('track');
  if (trackId) initTrackingView(trackId);
}

function localNum(num) {
  if(currentLang === 'en') return num.toLocaleString();
  return String(num).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
}

function customFormatDate(isoStr) {
  if (!isoStr) return t('txt_open_ended');
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, '0');
  const monthStr = currentLang === 'bn' ? ["জানু","ফেব","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টে","অক্টো","নভে","ডিসে"][d.getMonth()] : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
  let formatted = `${day} ${monthStr}, ${d.getFullYear()}`;
  if (currentLang === 'bn') formatted = formatted.replace(/\d/g, digit => '০১২৩৪৫৬৭৮৯'[digit]);
  return formatted;
}

// === EXPORT CSV ===
function exportAccountsCSV() {
  if (!allExpenses.length) return showToast(t('no_expenses'), 'info');
  let csvContent = "data:text/csv;charset=utf-8,Date,Category,Description,Amount (Tk)\n";
  allExpenses.forEach(e => {
    const d = new Date(e.date).toLocaleDateString();
    csvContent += `${d},"${e.category}","${e.description || ''}",${e.amount}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `expenses_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// === TOAST SYSTEM ===
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('popover', 'manual');
    document.body.appendChild(container);
    try { container.showPopover(); } catch(e) {}
  } else {
    try { container.showPopover(); } catch(e) {}
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  toast.innerHTML = `${icons[type]}<span class="text-sm font-medium">${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

async function unlockPhones() {
  const password = await requestAuthToken(t('msg_auth_phone'));
  if(!password) return;
  try {
    await handleFetch(`${API}/verify-phone-password`, { 
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) 
    });
    isPhoneUnlocked = true;
    renderClientsView();
    filterClientDropdown();
    showToast("Phone numbers unlocked!");
  } catch(err) { showToast(err.message, 'error'); }
}

async function fetchWriters() {
  try {
    const [resW, resS] = await Promise.all([
      handleFetch(`${API}/writers`),
      handleFetch(`${API}/writer-stats`)
    ]);
    allWriters = resW;
    writerStats = resS;
    populateWriterDropdowns();
    if (localStorage.getItem('activeTab') === 'writers') renderWritersView();
  } catch (err) { console.error("Writers fetch error:", err); }
}

function populateWriterDropdowns() {
  const select = document.getElementById("tAssign");
  const filterSelect = document.getElementById("taskAssigneeFilter");
  
  const currentVal = select.value;
  const currentFilterVal = filterSelect ? filterSelect.value : "all";
  
  const optionsHTML = allWriters.map(w => `<option value="${w.name}">${w.name} (${w.writerId})</option>`).join('');
  
  select.innerHTML = `<option value="Unassigned">${t('txt_unassigned')}</option>${optionsHTML}`;
  if (filterSelect) {
    filterSelect.innerHTML = `<option value="all">${t('filter_all_assignees')}</option>${optionsHTML}`;
    filterSelect.value = currentFilterVal;
  }
  select.value = currentVal;
}

function renderWritersView(searchOverride = null) {
  const list = document.getElementById("writerList");
  list.innerHTML = "";
  document.querySelector('[data-i18n="total_writers"]').innerText = `${t('total_writers')} ${allWriters.length}`;

  const q = searchOverride || "";

  allWriters.filter(w => !q || w.name.toLowerCase().includes(q) || w.writerId.toLowerCase().includes(q)).forEach(w => {
    const stats = writerStats.find(s => s._id === w.name) || { activeWorkload: 0, totalEarnings: 0, pendingPayments: 0 };
    const card = document.createElement("div");
    card.className = "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm space-y-4 relative group transition-all hover:shadow-md border-b-4 border-b-transparent hover:border-b-indigo-500";
    
    const img = w.imageLink || `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=random`;
    
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${img}" class="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/20" alt="${w.name}">
        <div class="flex-1">
          <h3 class="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">${w.name}</h3>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">${w.writerId}</p>
            <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">৳${localNum(stats.totalEarnings)}</span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-[10px]">
        <div class="bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl text-center">
          <p class="text-zinc-500 uppercase font-bold tracking-tighter">${t('workload')}</p>
          <p class="text-lg font-black text-indigo-600">${stats.activeWorkload}</p>
        </div>
        <div class="bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl text-center">
          <p class="text-zinc-500 uppercase font-bold tracking-tighter">${t('pending_pay')}</p>
          <p class="text-lg font-black text-rose-500">৳${localNum(stats.pendingPayments)}</p>
        </div>
      </div>
      <div class="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onclick="openWriterModal('${w._id}')" class="flex-1 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg text-[10px] font-bold transition-colors">Edit</button>
        <button onclick="deleteWriter('${w._id}')" class="px-2 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
    list.appendChild(card);
  });
}

function openWriterModal(id = null) {
  const modal = document.getElementById("writerModal");
  const form = document.getElementById("writerForm");
  const title = document.getElementById("writerModalTitle");
  form.reset();
  
  const preview = document.getElementById("wImagePreview");
  
  if (id) {
    const w = allWriters.find(x => x._id === id);
    if (!w) return;
    title.innerText = t('modal_writer_edit');
    document.getElementById("editWriterId").value = w._id;
    document.getElementById("wName").value = w.name;
    document.getElementById("wPhone").value = w.phone;
    document.getElementById("wEmail").value = w.email || "";
    const imgUrl = w.image || w.imageLink || "";
    document.getElementById("wImage").value = imgUrl;
    document.getElementById("wDob").value = w.dob || "";
    document.getElementById("wNid").value = w.nid || "";
    
    if (imgUrl) {
        preview.innerHTML = `<img src="${imgUrl}" class="w-full h-full object-cover">`;
    } else {
        preview.innerHTML = '<i class="fa-solid fa-user text-zinc-300"></i>';
    }
  } else {
    title.innerText = t('modal_writer_add');
    document.getElementById("editWriterId").value = "";
    document.getElementById("wImage").value = "";
    preview.innerHTML = '<i class="fa-solid fa-user text-zinc-300"></i>';
  }
  modal.showModal();
}

async function commitWriterToDatabase() {
  debugger; // PAUSE HERE TO SEE CALL STACK
  console.log("[commitWriterToDatabase] Function entered.");
  try {
    const id = document.getElementById("editWriterId").value;
    let imgVal = document.getElementById("wImage").value.trim();
    
    console.log("[saveWriter] Start. ID:", id, "Initial imgVal:", imgVal);

    // Fallback: try to grab from preview img if input is empty but preview shows an image
    if (!imgVal) {
      const previewImg = document.querySelector("#wImagePreview img");
      if (previewImg) {
        imgVal = previewImg.src;
        console.log("[saveWriter] Fallback applied. New imgVal:", imgVal.substring(0, 50) + "...");
      }
    }
    
    if (imgVal) {
        showToast("Saving with Image: " + imgVal.substring(0, 20) + "...", "info");
    } else {
        console.warn("[saveWriter] No image URL found in input or preview.");
    }

    const data = {
      name: document.getElementById("wName").value.trim(),
      phone: document.getElementById("wPhone").value.trim(),
      email: document.getElementById("wEmail").value.trim(),
      image: imgVal,
      imageLink: imgVal,
      dob: document.getElementById("wDob").value,
      nid: document.getElementById("wNid").value.trim()
    };

    console.log("[saveWriter] Payload prepared:", data);

    const password = await requestAuthToken(t('msg_auth_save'));
    if (!password) {
      console.warn("[saveWriter] Cancelled: No password provided.");
      return;
    }
    data.password = password;

    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/update-writer/${id}` : `${API}/add-writer`;
    
    console.log(`[saveWriter] Calling ${method} ${url}`);
    const result = await handleFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    
    console.log("[saveWriter] Final Result:", result);
    document.getElementById("writerModal").close();
    showToast(id ? t('msg_writer_updated') : t('msg_writer_added'));
    fetchWriters();
  } catch (err) {
    console.error("[saveWriter] Failed:", err);
    showToast(err.message, 'error');
  }
}

async function deleteWriter(id) {
  const password = await requestAuthToken(t('msg_auth_del_task'));
  if (!password) return;
  try {
    await handleFetch(`${API}/delete-writer/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    showToast(t('msg_writer_deleted'));
    fetchWriters();
  } catch (err) { showToast(err.message, 'error'); }
}

// === CUSTOM PASSWORD PROMPT ===
let authPromptResolver = null;

function requestAuthToken(message) {
  console.log(`[requestAuthToken] Prompting for: ${message}`);
  return new Promise((resolve) => {
    const modal = document.getElementById("authPromptModal");
    document.getElementById("authPromptMessage").innerText = message;
    const input = document.getElementById("authPromptInput");
    input.value = "";
    authPromptResolver = (val) => {
      console.log(`[requestAuthToken] Resolved with value length: ${val ? val.length : 0}`);
      resolve(val);
    };
    modal.showModal();
    input.focus();
    
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); e.stopPropagation();
        confirmAuthPrompt();
      }
    };
  });
}

function cancelAuthPrompt() {
  document.getElementById("authPromptModal").close();
  if (authPromptResolver) authPromptResolver(null);
  authPromptResolver = null;
}

function confirmAuthPrompt() {
  const val = document.getElementById("authPromptInput").value.trim();
  document.getElementById("authPromptModal").close();
  const resolver = authPromptResolver;
  authPromptResolver = null;
  setTimeout(() => { if (resolver) resolver(val || null); }, 10);
}

// === INITIALIZATION ===
async function bootstrap() {
  const loader = document.getElementById('catLoader');
  loader.style.display = 'flex';
  loader.style.opacity = '1';
  currentTaskPage = 1;
  
  try {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    
    if (trackId) {
      return initTrackingView(trackId);
    }

    // Check Portal Session
    const session = localStorage.getItem('portalSession');
    if (!session) {
      document.getElementById("portalLogin").classList.remove("hidden");
      loader.style.display = "none";
      return;
    }

    const fetches = [
      fetchTasks(1, false).catch(e => console.error("Tasks fetch failed", e)),
      fetchClients().catch(e => console.error("Clients fetch failed", e)),
      fetchExpenses().catch(e => console.error("Expenses fetch failed", e)),
      fetchInvoices().catch(e => console.error("Invoices fetch failed", e)),
      fetchWriters().catch(e => console.error("Writers fetch failed", e))
    ];
    await Promise.all(fetches);
    
    applyTranslations(); 
    switchTab('dashboard');
  } catch (error) {
    console.error("Bootstrap Error:", error);
    showToast(error.message || "Backend connection error!", 'error');
    if (error.message.includes("Session") || error.message.includes("expired")) {
       localStorage.removeItem('portalSession');
       setTimeout(() => window.location.reload(), 2000);
    }
  } finally {
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 500);
  }

  // Close dialogs when clicking outside (on backdrop)
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  });
}

function switchTab(tabId) {
  localStorage.setItem('activeTab', tabId);
  const allViews = ['dashboard', 'clients-view', 'tasks', 'done', 'invoices', 'writers', 'accounts'];
  
  allViews.forEach(id => {
    const view = document.getElementById(`view-${id}`);
    const tab = document.getElementById(`tab-${id}`);
    
    if (view) {
      if (id === tabId) {
        view.classList.remove('hidden');
        view.classList.add('block');
      } else {
        view.classList.add('hidden');
        view.classList.remove('block');
      }
    }
    
    if (tab) {
      const isActive = (id === tabId);
      tab.classList.toggle('tab-active', isActive);
      tab.classList.toggle('text-zinc-900', isActive);
      tab.classList.toggle('dark:text-white', isActive);
      tab.classList.toggle('border-zinc-900', isActive);
      tab.classList.toggle('dark:border-white', isActive);
      tab.classList.toggle('tab-inactive', !isActive);
      tab.classList.toggle('text-zinc-500', !isActive);
      tab.classList.toggle('dark:text-zinc-400', !isActive);
    }
  });

  refreshCurrentView();
  if(tabId === 'invoices' && allInvoices.length === 0) fetchInvoices();
  if(tabId === 'writers' && allWriters.length === 0) fetchWriters();
}

async function fetchLogs(limit = 10) {
  try {
    return await handleFetch(`${API}/logs?limit=${limit}`);
  } catch (err) { console.error("Logs error:", err); return []; }
}

function generateLogHTML(log) {
    const actionLower = log.action.toLowerCase();
    const isSuccess = actionLower.includes("created") || actionLower.includes("added") || actionLower.includes("logged") || actionLower.includes("done");
    const isDanger = actionLower.includes("deleted") || actionLower.includes("removed");
    
    const iconColor = isSuccess ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : 
                     isDanger ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10" : 
                     "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10";

    return `
      <li class="flex gap-3 items-start group">
        <div class="p-2 rounded-lg ${iconColor} shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[11px] font-bold text-zinc-900 dark:text-white leading-tight truncate">${log.action}</p>
          <p class="text-[10px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">${log.details}</p>
          <p class="text-[9px] text-zinc-400 mt-1 font-medium">${customFormatDateTime(log.timestamp)}</p>
        </div>
      </li>
    `;
}

function customFormatDateTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function updateDashboardLogs() {
    const logs = await fetchLogs(5);
    const list = document.getElementById("activityList");
    list.innerHTML = logs.length ? logs.map(generateLogHTML).join('') : `<li class="text-xs text-zinc-500 italic">No recent activity</li>`;
}

async function openActivityModal() {
    const list = document.getElementById("fullActivityList");
    list.innerHTML = `<li class="text-center py-8 text-zinc-500 animate-pulse">Loading history...</li>`;
    document.getElementById("activityModal").showModal();
    
    const logs = await fetchLogs(100);
    list.innerHTML = logs.length ? logs.map(generateLogHTML).join('') : `<li class="text-zinc-500 text-center py-8">No activity recorded yet.</li>`;
}

// === PUBLIC TRACKING VIEW LOGIC ===
async function initTrackingView(id) {
  const trackView = document.getElementById("trackingView");
  const loader = document.getElementById("catLoader");
  
  // Show loader while fetching
  if (loader) {
    loader.style.display = "flex";
    loader.style.opacity = "1";
    const lText = loader.querySelector("p");
    if (lText) lText.setAttribute('data-i18n', 'track_loading');
  }

  trackView.classList.add('active');
  
  // Hide all other UI including Header
  document.querySelector("header")?.classList.add("hidden");
  document.querySelector("aside")?.classList.add("hidden");
  document.querySelector("nav")?.classList.add("hidden");
  document.querySelectorAll("main").forEach(m => m.classList.add("hidden"));
  
  try {
    const task = await handleFetch(`${API}/track-task/${id}`);
    
    // Apply initial translations
    applyTranslations();
    
    document.getElementById("trackTitle").innerText = task.title;
    document.getElementById("trackClientName").innerText = task.clientName;
    document.getElementById("trackUniName").innerText = task.clientUniversity || "N/A";
    
    if (task.status === 'done') {
      const labelEl = document.querySelector('[data-i18n="track_expected"]');
      if (labelEl) labelEl.innerText = t('status_done');
      document.getElementById("trackDeadline").innerText = t('txt_finished');
    } else {
      document.getElementById("trackDeadline").innerText = customFormatDate(task.deadline);
    }
    
    const statusMap = { 'pending': 1, 'in_progress': 2, 'review': 3, 'done': 4 };
    const step = statusMap[task.status] || 1;
    const progress = (step / 4) * 100;
    
    document.getElementById("trackProgress").style.width = `${progress}%`;
    document.getElementById("trackBadge").innerText = t(`status_${task.status}`);
    
    const steps = ['pending', 'in_progress', 'review', 'done'];
    steps.forEach((s, i) => {
      const el = document.getElementById(`step-${s}`);
      if (i < step) {
        el.className = "w-6 h-6 rounded-full bg-indigo-500 border-4 border-white dark:border-zinc-900 z-10 transition-all duration-500";
      } else {
        el.className = "w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 z-10";
      }
    });
  } catch (err) {
    console.error("Tracking error:", err);
    applyTranslations();
    document.getElementById("trackTitle").innerText = t('track_not_found');
    const clientEl = document.getElementById("trackClientName");
    if (clientEl) clientEl.innerText = t('track_invalid_link');
    showToast(t('track_not_found'), "error");
  } finally {
    // Hide loader
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.style.display = "none", 500);
    }
  }

  // Setup search input listener
  const searchInput = document.getElementById("trackSearchInput");
  if (searchInput) {
    searchInput.onkeydown = (e) => {
      if (e.key === 'Enter') handleTrackSearch();
    };
  }
}

function handleTrackSearch() {
  let val = document.getElementById("trackSearchInput").value.trim();
  if (!val) return showToast("Please enter an Order ID", "error");
  
  // Remove leading # if user typed it
  val = val.replace(/^#/, "").trim();
  
  // Update URL without reloading if possible, or just redirect
  const newUrl = window.location.pathname + '?track=' + val;
  window.history.pushState({ track: val }, '', newUrl);
  initTrackingView(val);
  document.getElementById("trackSearchInput").value = "";
}

async function handlePortalLogin(e) {
  e.preventDefault();
  const btn = document.getElementById("btnLoginPortal");
  const pass = document.getElementById("portalPass").value;
  btn.disabled = true;
  btn.innerText = "Verifying...";
  
  try {
    const data = await handleFetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass })
    });
    
    localStorage.setItem('portalSession', data.token);
    window.location.reload(); 
  } catch (err) {
    showToast(err.message, "error");
    btn.disabled = false;
    btn.innerText = "Unlock Dashboard";
  }
}

// === DRIVE FOLDER HELPER ===
function handleDriveHelper() {
    const select = document.getElementById("tClientSelect");
    let clientName = "Client";
    if (select.value === 'new') {
        clientName = document.getElementById("tClientName").value || "New Client";
    } else {
        clientName = select.options[select.selectedIndex].text.split('(')[0].trim();
    }
    const taskTitle = document.getElementById("tTitle").value || "Task";
    const folderName = `${clientName} - ${taskTitle}`;
    
    navigator.clipboard.writeText(folderName).then(() => {
      showToast("Folder name copied!", "success");
      window.open('https://drive.google.com/drive/my-drive', '_blank');
    }).catch(() => {
      showToast("Clipboard blocked", "error");
    });
}

function copyToClipboard(text, label = "Content") {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} copied!`, "success");
  }).catch(() => {
    showToast("Failed to copy", "error");
  });
}

function copyTrackingLink(id) {
    const url = window.location.origin + window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + '?track=' + id;
    copyToClipboard(url, "Tracking link");
}

function handleGlobalSearch() {
  const q = document.getElementById("globalSearch").value.toLowerCase();
  if (!q) return refreshCurrentView();
  
  const tabId = localStorage.getItem('activeTab') || 'dashboard';
  
  if (tabId === 'tasks' || tabId === 'done') {
    renderTasks(q);
  } else if (tabId === 'clients-view') {
    renderClientsView(q);
  } else if (tabId === 'writers') {
    renderWritersView(q);
  }
}

async function handleFetch(url, options = {}) {
  console.log(`[handleFetch] Requesting: ${url}`, options);
  const token = localStorage.getItem('portalSession');
  if (token) {
    options.headers = { ...options.headers, 'Authorization': token };
  }
  
  try {
    const res = await fetch(url, options);
    console.log(`[handleFetch] Response Status: ${res.status} for ${url}`);
    
    if (res.ok) {
      const data = await res.json();
      console.log(`[handleFetch] Success Data:`, data);
      return data;
    }
    
    const errData = await res.json().catch(() => ({}));
    console.error(`[handleFetch] Error Data:`, errData);
    
    if (res.status === 401 && !url.includes('/login') && !url.includes('/track-task')) {
      if (errData.error && (errData.error.toLowerCase().includes("session") || errData.error.toLowerCase().includes("token"))) {
        localStorage.removeItem('portalSession');
        window.location.reload();
        return;
      }
      throw new Error(errData.message || errData.error || "Unauthorized");
    }
    throw new Error(errData.message || errData.error || `Server Error (${res.status})`);
  } catch (err) {
    console.error(`[handleFetch] Critical Error:`, err);
    throw err;
  }
}

// Data fetching
async function fetchTasks(page = 1, append = false) { 
  const res = await handleFetch(`${API}/tasks?page=${page}&limit=30`); 
  if (append) { allTasks = [...allTasks, ...res.data]; } 
  else { allTasks = res.data || res; }
  currentTaskPage = res.page || 1;
  totalTaskPages = res.totalPages || 1;
}

async function loadMoreTasks() {
  if (currentTaskPage >= totalTaskPages) return;
  await fetchTasks(currentTaskPage + 1, true);
  renderTasks();
}

async function fetchClients() {
  const res = await handleFetch(API + "/clients");
  allClients = res.data || res || [];
  allClients.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  filterClientDropdown();
}

async function fetchExpenses() {
  const res = await handleFetch(API + "/accounts");
  allExpenses = res.data || res || [];
}

async function fetchInvoices() {
  allInvoices = await handleFetch(API + "/invoices");
  if (localStorage.getItem('activeTab') === 'invoices') renderInvoicesView();
}

function renderInvoicesView() {
  const list = document.getElementById("invoiceList");
  list.innerHTML = "";
  if(allInvoices.length === 0) return list.innerHTML = `<li class="p-8 text-center text-zinc-500 text-sm italic border-dashed border-2 border-zinc-100 dark:border-zinc-800/50 m-4 rounded-2xl">${t('no_invoices') || 'No invoices found.'}</li>`;

  allInvoices.forEach(inv => {
    list.innerHTML += `
      <li class="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
        <div class="flex items-center gap-4">
          <div class="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <p class="font-bold text-zinc-900 dark:text-white text-sm sm:text-base">${inv.clientName}</p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span>${inv.title}</span>
              <span class="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
              <span>${customFormatDate(inv.date)}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 sm:gap-6">
          <span class="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-lg">৳${localNum(inv.amount)}</span>
          <div class="flex items-center gap-2">
            <button onclick="downloadExistingInvoice('${inv.taskId}')" class="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Download PDF"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
            <button onclick="deleteInvoice('${inv._id}')" class="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
        </div>
      </li>
    `;
  });
}

async function deleteInvoice(id) {
  const password = await requestAuthToken(t('msg_auth_del_exp'));
  if(!password) return;
  try {
    await handleFetch(`${API}/delete-invoice/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    allInvoices = allInvoices.filter(i => i._id !== id);
    renderInvoicesView();
    showToast("Invoice record deleted.");
  } catch(err) { showToast(err.message, 'error'); }
}

function downloadExistingInvoice(taskId) {
  generatePDFInvoice(taskId);
}

function filterClientDropdown() {
  const searchInput = document.getElementById("clientSearchInput");
  const q = searchInput.value.toLowerCase();
  const select = document.getElementById("tClientSelect");
  const currentVal = select.value;
  
  let optionsHTML = `<option value="new">${t('opt_add_client')}</option>`;
  
  let filteredClients = allClients.filter(c => (c.name || "").toLowerCase().includes(q) || (c.phone || "").includes(q));

  filteredClients.sort((a, b) => {
    const aStarts = (a.name || "").toLowerCase().startsWith(q);
    const bStarts = (b.name || "").toLowerCase().startsWith(q);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });
  
  filteredClients.forEach(c => { 
    const phoneText = isPhoneUnlocked ? (c.phone || '-') : '••• ••• •••';
    optionsHTML += `<option value="${c._id || c.id}">${c.name} (${phoneText})</option>`; 
  });

  select.innerHTML = optionsHTML;
  const optionExists = Array.from(select.options).some(opt => opt.value === currentVal);
  select.value = optionExists ? currentVal : 'new';
  
  if (q.length > 0) { select.size = Math.min(filteredClients.length + 2, 6); } else { select.size = 1; }
  toggleNewClientFields();
}

document.addEventListener('click', (e) => {
  const select = document.getElementById("tClientSelect");
  const searchInput = document.getElementById("clientSearchInput");
  if (select && select.size > 1 && e.target !== select && e.target !== searchInput) { select.size = 1; }
});

function isDateInRange(dateStr, filterType) {
  if (!filterType || filterType === 'all') return true;
  if (!dateStr) return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (filterType === 'this_month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (filterType === 'last_month') {
    let lastMonth = now.getMonth() - 1; let year = now.getFullYear();
    if (lastMonth < 0) { lastMonth = 11; year -= 1; }
    return d.getMonth() === lastMonth && d.getFullYear() === year;
  }
  if (filterType === 'this_year') return d.getFullYear() === now.getFullYear();
  return true;
}

function renderDashboard() {
  let totalEarned = 0, expectedEarnings = 0, totalExpenses = 0, pendingTasksCount = 0, completedTasksCount = 0;
  const clientEarningsMap = {};
  const incomeBreakdown = {};
  const writerContributionMap = {}; // Map for writer contribution (Value - Expenses)
  const filterType = document.getElementById("dashboardDateFilter").value;

  allTasks.forEach(tk => {
    if (!isDateInRange(tk.createdAt, filterType)) return;

    const total = tk.totalValue || 0;
    const advance = tk.advancePaid || 0;
    const bonus = tk.bonus || 0; 
    const isDone = tk.status === 'done';

    // Total task value plus any bonus
    const finalTaskValue = total + bonus;
    const balance = finalTaskValue - advance;

    let taskEarned = advance;
    if (isDone) { 
        taskEarned += balance; 
        completedTasksCount++; 
    } else { 
        expectedEarnings += balance; 
        pendingTasksCount++; 
    }
    
    // Add bonus even if not completed, assuming it's part of the guaranteed earning
    totalEarned += taskEarned;

    // Income breakdown mapping
    const type = tk.workType || "Other";
    incomeBreakdown[type] = (incomeBreakdown[type] || 0) + taskEarned;

    const cid = (tk.client && tk.client._id) ? tk.client._id : tk.client;
    const cname = (tk.client && tk.client.name) ? tk.client.name : null;

    if (cid && cname) {
      if(!clientEarningsMap[cid]) clientEarningsMap[cid] = { name: cname, earned: 0 };
      clientEarningsMap[cid].earned += taskEarned;
    }

    // Writer contribution mapping (Value - Expenses)
    const writerName = tk.assignedTo || "Unassigned";
    const taskExpenses = allExpenses
        .filter(e => e.taskId === tk._id && e.type !== 'income')
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    const taskNetValue = (Number(tk.totalValue) || 0) + (Number(tk.bonus) || 0) - taskExpenses;
    writerContributionMap[writerName] = (writerContributionMap[writerName] || 0) + taskNetValue;
  });

  const expenseBreakdown = { "Facebook Ads": 0, "Supplements": 0, "Withdraws": 0, "Others": 0 };
  allExpenses.forEach(e => {
    if (!isDateInRange(e.date, filterType)) return;
    
    // Only tally if it's an expense or hasn't got an income type
    if (e.type !== 'income') {
        totalExpenses += (e.amount || 0);
        if(expenseBreakdown[e.category] !== undefined) expenseBreakdown[e.category] += (e.amount || 0);
        else expenseBreakdown["Others"] += (e.amount || 0);
    } else {
        // If you ever add an "income" transaction manually, it adds to totalEarned and "Other" income breakdown
        totalEarned += (e.amount || 0);
        incomeBreakdown["Other"] = (incomeBreakdown["Other"] || 0) + (e.amount || 0);
    }
  });

  document.getElementById("stat-in").innerText = `৳${localNum(totalEarned)}`;
  document.getElementById("stat-expected").innerText = `৳${localNum(expectedEarnings)}`;
  document.getElementById("stat-out").innerText = `৳${localNum(totalExpenses)}`;
  document.getElementById("stat-net").innerText = `৳${localNum(totalEarned - totalExpenses)}`;
  document.getElementById("stat-pending").innerText = `${localNum(pendingTasksCount)} ${t('word_tasks')}`;
  document.getElementById("stat-completed-tasks").innerText = localNum(completedTasksCount);
  document.getElementById("stat-total-tasks").innerText = localNum(pendingTasksCount + completedTasksCount);

  const topList = document.getElementById("topClientsList");
  if (topList) {
    const sortedClients = Object.values(clientEarningsMap).sort((a,b) => b.earned - a.earned).slice(0, 5); 
    topList.innerHTML = sortedClients.length > 0 ? '' : `<li class="text-zinc-500 text-sm italic">${t('no_clients')}</li>`;
    
    sortedClients.forEach((c, idx) => {
      topList.innerHTML += `
        <li class="flex justify-between items-center p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
          <div class="flex items-center gap-3">
            <span class="text-zinc-600 dark:text-zinc-500 font-bold text-xs">${localNum(idx + 1)}.</span>
            <span class="text-zinc-900 dark:text-zinc-300 text-sm font-medium">${c.name}</span>
          </div>
          <span class="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">৳${localNum(c.earned)}</span>
        </li>
      `;
    });
  }

  renderCharts(expenseBreakdown, incomeBreakdown, writerContributionMap);
}

function renderCharts(expenseBreakdown, incomeBreakdown, writerContributionMap) {
  Chart.defaults.color = currentTheme === 'dark' ? '#a1a1aa' : '#52525b'; 
  Chart.defaults.font.family = 'Inter';

  const ctxExp = document.getElementById('expenseChart').getContext('2d');
  if (expenseChartInstance) expenseChartInstance.destroy();
  
  const mapCat = { "Facebook Ads": "ফেসবুক অ্যাড", "Supplements": "সাপ্লিমেন্ট", "Withdraws": "উত্তোলন", "Others": "অন্যান্য" };
  const expLabels = Object.keys(expenseBreakdown).map(k => currentLang === 'bn' ? (mapCat[k] || k) : k);

  expenseChartInstance = new Chart(ctxExp, {
    type: 'bar',
    data: {
      labels: expLabels,
      datasets: [{ label: t('stat_expenses'), data: Object.values(expenseBreakdown), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'], borderRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: currentTheme === 'dark' ? '#27272a' : '#e4e4e7' } }, x: { grid: { display: false } } } }
  });

  const ctxInc = document.getElementById('incomeChart').getContext('2d');
  if (incomeChartInstance) incomeChartInstance.destroy();
  
  const typeMap = { "Assignment": "অ্যাসাইনমেন্ট", "Thesis": "থিসিস", "Presentation": "প্রেজেন্টেশন", "Lab Project": "ল্যাব", "Other": "অন্যান্য" };
  const incKeys = Object.keys(incomeBreakdown);
  const incLabels = incKeys.map(k => currentLang === 'bn' ? (typeMap[k] || k) : k);

  incomeChartInstance = new Chart(ctxInc, {
    type: 'bar',
    data: {
      labels: incLabels,
      datasets: [{ label: t('stat_earned'), data: Object.values(incomeBreakdown), backgroundColor: ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'], borderRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: currentTheme === 'dark' ? '#27272a' : '#e4e4e7' } }, x: { grid: { display: false } } } }
  });

  // Writer Contribution Chart (Pie)
  const ctxWri = document.getElementById('writerChart').getContext('2d');
  if (writerChartInstance) writerChartInstance.destroy();
  
  const wriKeys = Object.keys(writerContributionMap).filter(k => writerContributionMap[k] > 0);
  const wriLabels = wriKeys;
  const wriData = wriKeys.map(k => writerContributionMap[k]);

  writerChartInstance = new Chart(ctxWri, {
    type: 'pie',
    data: {
      labels: wriLabels,
      datasets: [{
        data: wriData,
        backgroundColor: [
          '#10b981', // Emerald
          '#6366f1', // Indigo
          '#f59e0b', // Amber
          '#f43f5e', // Rose
          '#06b6d4', // Cyan
          '#8b5cf6', // Violet
          '#f97316', // Orange
          '#84cc16', // Lime
          '#64748b', // Slate
          '#ec4899'  // Pink
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 10,
            padding: 10,
            font: { size: 9, weight: 'bold' },
            color: currentTheme === 'dark' ? '#d4d4d8' : '#3f3f46'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ৳${localNum(context.raw)}`;
            }
          }
        }
      }
    }
  });
}

function renderClientsView(searchOverride = null) {
  const q = searchOverride || "";
  const filtered = allClients.filter(c => !q || c.name.toLowerCase().includes(q) || (c.phone || "").includes(q));
  document.getElementById("clientCount").innerText = localNum(filtered.length);
  const grid = document.getElementById("clientsGrid");
  grid.innerHTML = "";

  if(filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full p-8 text-center border border-zinc-300 dark:border-zinc-800 border-dashed rounded-xl text-zinc-500">${q ? 'No clients found matching search.' : t('no_clients')}</div>`;
    return;
  }

  filtered.forEach(client => {
    const cTasks = allTasks.filter(t => (t.client && t.client._id === client._id) || t.client === client._id);
    let netIncome = 0;
    cTasks.forEach(tk => {
      const bonus = tk.bonus || 0;
      let earned = tk.advancePaid || 0;
      if (tk.status === 'done') earned += (((tk.totalValue || 0) + bonus) - (tk.advancePaid || 0));
      netIncome += earned;
    });

    const phoneDisplay = isPhoneUnlocked 
      ? (client.phone || '-') 
      : `<span onclick="unlockPhones()" class="cursor-pointer inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-zinc-700/50 shadow-sm transition-all hover:bg-white/40 dark:hover:bg-black/50" title="${t('msg_auth_phone')}">
           <span class="blur-[4px] select-none opacity-80 font-mono tracking-widest text-[11px] leading-none mt-0.5">017*******</span>
           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="opacity-70"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
         </span>`;

    grid.innerHTML += `
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
        <div class="mb-4">
          <h3 class="font-semibold text-zinc-900 dark:text-white text-lg">${client.name}</h3>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              ${phoneDisplay}
            </span>
            ${client.university ? `
            <span class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] break-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              ${client.university}
            </span>` : ''}
            <span class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
              <span class="opacity-50">${t('lbl_country')}:</span> ${client.country || 'Bangladesh'}
            </span>
            <span class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
              <span class="opacity-50">${t('lbl_program')}:</span> ${client.program || 'None'}
            </span>
            <span class="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
              <span class="opacity-50">${t('lbl_subject')}:</span> ${client.subject || 'None'}
            </span>
          </p>
          <div class="mt-3 inline-block bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded text-xs font-semibold">
            ${t('txt_net_income')}: ৳${localNum(netIncome)}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button onclick="openClientViewModal('${client._id}')" class="px-3 py-2 sm:py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs font-medium transition-colors">${t('btn_view_tasks')} (${localNum(cTasks.length)})</button>
          <button onclick="openClientEditModal('${client._id}')" class="px-3 py-2 sm:py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs font-medium transition-colors">${t('btn_edit_client')}</button>
        </div>
      </div>
    `;
  });
}

function generateTaskHTML(tk, isDone, isKanbanCard = false) {
  const clientName = tk.client && tk.client.name ? tk.client.name : t('txt_internal');
  const total = tk.totalValue || 0;
  const advance = tk.advancePaid || 0;
  const bonus = tk.bonus || 0;
  const revisionCount = tk.revisionCount || 0;
  
  const typeMap = { "Assignment": "অ্যাসাইনমেন্ট", "Thesis": "থিসিস", "Presentation": "প্রেজেন্টেশন", "Lab Project": "ল্যাব", "Other": "অন্যান্য" };
  const displayType = currentLang === 'bn' ? (typeMap[tk.workType] || tk.workType) : (tk.workType || 'Task');
  const colorClass = tagColors[tk.workType] || tagColors["Other"];
  const detailsHTML = tk.details ? `<p class="text-[11px] sm:text-xs text-zinc-500 mt-1 italic leading-tight">${tk.details}</p>` : '';
  
  // Deadline Urgency Check
  let urgencyHTML = '';
  let urgencyClass = '';
  if (!isDone && tk.deadline) {
    const diff = new Date(tk.deadline) - new Date();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) {
      urgencyHTML = `<span class="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse uppercase ml-2">🔥 ${hours < 0 ? 'Overdue' : 'Urgent'}</span>`;
      urgencyClass = 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)] dark:shadow-[0_0_20px_rgba(244,63,94,0.1)]';
    }
  }

  // Revision Warning
  const revWarning = revisionCount >= 3 ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : '';
  const revHTML = revisionCount > 0 ? `<span class="flex items-center gap-1 text-[10px] font-bold ${revisionCount >= 3 ? 'text-orange-600' : 'text-zinc-400'}">🔄 Rev: ${revisionCount}</span>` : '';

  // Handle Multiple Links
  const links = (tk.link || "").split('\n').filter(l => l.trim());
  const linksHTML = links.map(l => `
    <a href="${l.trim().startsWith('http') ? l.trim() : 'https://'+l.trim()}" target="_blank" class="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-[10px] sm:text-xs font-semibold mt-1">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> 
      ${l.length > 20 ? l.slice(0, 20) + '...' : l}
    </a>`).join(' ');

  let actionButtons = '';
  if (isKanbanCard) {
     actionButtons = `<button onclick="openTaskModal('${tk._id}')" class="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[10px] w-full font-bold">${t('btn_edit')}</button>`;
  } else {
     if (isDone) {
        const waText = encodeURIComponent(`Hello ${clientName}, your assignment '${tk.title}' is ready! Let us know if you need anything else. - Assignment Koran.`);
        const phone = tk.client?.phone ? tk.client.phone.replace(/[^0-9+]/g, '') : '';
        actionButtons = `
          <button onclick="generatePDFInvoice('${tk._id}')" class="px-3 py-2 sm:py-1.5 bg-blue-100 dark:bg-blue-500/10 hover:bg-blue-200 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium transition-colors text-center w-full flex justify-center items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> ${t('btn_invoice')}</button>
          ${phone ? `<a href="https://wa.me/${phone}?text=${waText}" target="_blank" class="px-3 py-2 sm:py-1.5 bg-emerald-100 dark:bg-emerald-500/10 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium transition-colors text-center w-full flex justify-center items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> WhatsApp</a>` : ''}
          <button onclick="updateTaskStatus('${tk._id}', 'pending')" class="px-3 py-2 sm:py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-xs font-medium text-center transition-colors w-full">${t('btn_undo')}</button>`;
     } else {
        actionButtons = `<button onclick="openTaskModal('${tk._id}')" class="px-3 py-2 sm:py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-300 rounded text-xs font-medium transition-colors text-center w-full font-bold">${t('btn_edit')}</button><button onclick="updateTaskStatus('${tk._id}', 'done')" class="px-3 py-2 sm:py-1.5 bg-emerald-100 dark:bg-emerald-500/10 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium transition-colors text-center w-full">${t('btn_done')}</button>`;
     }
     actionButtons += `<button onclick="copyTrackingLink('${tk.orderId || tk._id}')" class="px-3 py-2 sm:py-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded text-xs font-medium transition-colors text-center flex items-center justify-center gap-1 w-full"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> Copy Link</button>`;
     actionButtons += `<button onclick="deleteTask('${tk._id}')" class="px-3 py-2 sm:py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded text-xs font-medium transition-colors text-center flex items-center justify-center gap-1 w-full"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg> ${t('btn_delete')}</button>`;
  }

  const netBalance = (total + bonus) - advance;

  if (isKanbanCard) {
    return `<div data-id="${tk._id}" class="bg-white dark:bg-zinc-950 p-3 rounded-xl border-2 ${urgencyClass || revWarning || 'border-zinc-200 dark:border-zinc-800'} shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1">
          <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${colorClass}">${displayType}</span>
          ${urgencyHTML}
        </div>
        <div class="flex items-center gap-2">
          <button onclick="copyTrackingLink('${tk.orderId || tk._id}')" class="p-1 text-zinc-400 hover:text-indigo-500 transition-colors" title="Copy tracking link">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </button>
          <span onclick="copyToClipboard('${tk.orderId || tk._id.slice(-6).toUpperCase()}', 'ID')" class="text-[10px] text-indigo-500 font-black tracking-tighter cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-1 rounded transition-colors" title="Click to copy ID">#${tk.orderId || tk._id.slice(-6).toUpperCase()}</span>
          <span class="text-[10px] text-zinc-500 font-medium">${customFormatDate(tk.deadline)}</span>
        </div>
      </div>
      <h4 class="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">${tk.title}</h4>
      <p class="text-[11px] text-zinc-500 mt-1 truncate">${clientName}</p>
      ${linksHTML}
      <div class="mt-3 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-2">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded">${tk.assignedTo?.split(' ')[0] || '-'}</span>
          ${revHTML}
        </div>
        <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">৳${localNum(netBalance)}</span>
      </div>
    </div>`;
  }

  const bonusHtml = bonus > 0 ? `<div class="text-indigo-600 dark:text-indigo-400">${t('txt_bonus')}: ৳${localNum(bonus)}</div>` : '';

  return `<li class="border-2 ${urgencyClass || 'border-zinc-200 dark:border-zinc-800'} shadow-sm dark:shadow-none rounded-2xl p-4 sm:p-5 bg-white dark:bg-zinc-900/50 flex flex-col md:flex-row gap-4 justify-between transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
    <div class="flex-1 space-y-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isDone ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'}">${t(isDone ? 'btn_done' : 'nav_active')}</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass}">${displayType}</span>
        <span onclick="copyToClipboard('${tk.orderId || tk._id.slice(-6).toUpperCase()}', 'ID')" class="px-2 py-0.5 rounded text-[10px] font-black tracking-tighter bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-indigo-100 transition-colors" title="Click to copy ID">#${tk.orderId || tk._id.slice(-6).toUpperCase()}</span>
        ${urgencyHTML}${revHTML}
        <span class="text-xs text-zinc-500 dark:text-zinc-400 font-medium ml-1 sm:ml-2">${t('txt_due')}: ${customFormatDate(tk.deadline)}</span>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white ${isDone ? 'line-through text-zinc-500 dark:text-zinc-500' : ''}">${tk.title}</h3>
        ${detailsHTML}${linksHTML}
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>${clientName}</p>
      </div>
      <div class="flex flex-wrap gap-3 sm:gap-4 text-xs font-medium border-t border-zinc-100 dark:border-zinc-800/50 pt-3">
        <div class="text-emerald-600 dark:text-emerald-400">${t('txt_total')}: ৳${localNum(total)}</div>
        ${bonusHtml}
        <div class="text-zinc-600 dark:text-zinc-300">${t('txt_advance')}: ৳${localNum(advance)}</div>
        <div class="text-rose-600 dark:text-rose-400">${t('txt_due')}: ৳${localNum(netBalance)}</div>
        <div class="text-zinc-500 dark:text-zinc-500 w-full sm:w-auto sm:ml-auto flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>${tk.assignedTo || t('txt_unassigned')}</div>
      </div>
    </div>
    <div class="flex flex-col gap-2 shrink-0 items-stretch justify-center w-full md:w-32 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800/50 pt-3 md:pt-0 md:pl-4">
      ${actionButtons}
    </div>
  </li>`;
}


function toggleTaskViewMode() {
  currentTaskViewMode = currentTaskViewMode === 'list' ? 'board' : 'list';
  const btn = document.getElementById("btnTaskView");
  btn.innerText = currentTaskViewMode === 'list' ? t('tab_board') : t('tab_list');
  renderTasks();
}

function renderTasks(searchOverride = null) {
  const activeList = document.getElementById("taskList"), taskBoard = document.getElementById("taskBoard"), doneList = document.getElementById("doneTaskList"), pagControl = document.getElementById("taskPaginationControls");
  
  const q = (searchOverride || document.getElementById("taskSearchQuery")?.value || "").toLowerCase();
  const fType = document.getElementById("taskTypeFilter")?.value || "all";
  const fAssignee = document.getElementById("taskAssigneeFilter")?.value || "all";

  let filteredActive = allTasks.filter(t => t.status !== 'done');
  if (q || fType !== 'all' || fAssignee !== 'all') {
    filteredActive = filteredActive.filter(t => {
      const matchQ = !q || t.title.toLowerCase().includes(q) || (t.client?.name || "").toLowerCase().includes(q);
      const matchT = fType === 'all' || t.workType === fType;
      const matchA = fAssignee === 'all' || t.assignedTo === fAssignee;
      return matchQ && matchT && matchA;
    });
  }

  const doneTasks = allTasks.filter(t => t.status === 'done');
  doneList.innerHTML = doneTasks.length === 0 ? `<li class="text-center text-zinc-500 py-8 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">${t('no_done')}</li>` : doneTasks.map(t => generateTaskHTML(t, true)).join('');
  
  if (currentTaskViewMode === 'list') {
    taskBoard.classList.add('hidden'); activeList.classList.remove('hidden');
    activeList.innerHTML = filteredActive.length === 0 ? `<li class="text-center text-zinc-500 py-8 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">${t('no_tasks')}</li>` : filteredActive.map(t => generateTaskHTML(t, false)).join('');
  } else {
    activeList.classList.add('hidden'); taskBoard.classList.remove('hidden');
    const pendingTasks = filteredActive.filter(t => !t.status || t.status === 'pending');
    const inProgressTasks = filteredActive.filter(t => t.status === 'in_progress');
    const reviewTasks = filteredActive.filter(t => t.status === 'review');
    document.getElementById("col-pending").innerHTML = pendingTasks.map(t => generateTaskHTML(t, false, true)).join('');
    document.getElementById("col-in_progress").innerHTML = inProgressTasks.map(t => generateTaskHTML(t, false, true)).join('');
    document.getElementById("col-review").innerHTML = reviewTasks.map(t => generateTaskHTML(t, false, true)).join('');
    
    initKanbanBoards();
  }
  
  if (currentTaskPage < totalTaskPages && currentTaskViewMode === 'list') pagControl.classList.remove('hidden');
  else pagControl.classList.add('hidden');
}

function renderExpenses() {
  const list = document.getElementById("txList");
  list.innerHTML = "";
  if(allExpenses.length === 0) return list.innerHTML = `<li class="p-6 text-center text-zinc-500 text-sm">${t('no_expenses')}</li>`;

  allExpenses.forEach(tx => {
    const mapCat = { "Facebook Ads": "ফেসবুক অ্যাড", "Supplements": "সাপ্লিমেন্ট", "Withdraws": "উত্তোলন", "Others": "অন্যান্য" };
    const displayCat = currentLang === 'bn' ? (mapCat[tx.category] || tx.category) : tx.category;
    
    // Find associated task title if taskId exists
    let taskBadge = '';
    if (tx.taskId) {
      const task = allTasks.find(t => t._id === tx.taskId);
      if (task) {
        taskBadge = `<span class="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[9px] px-1.5 py-0.5 rounded mt-1 truncate max-w-[150px]">Task: ${task.title}</span>`;
      }
    }

    list.innerHTML += `
      <li class="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
        <div class="flex items-center gap-3 sm:gap-4">
          <div class="p-2 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></div>
          <div>
            <p class="font-medium text-zinc-900 dark:text-white text-sm">${displayCat}</p>
            <p class="text-xs text-zinc-500">${customFormatDate(tx.date)} ${tx.description ? '• ' + tx.description : ''}</p>
            ${taskBadge}
          </div>
        </div>
        <div class="flex items-center gap-2 sm:gap-4 shrink-0">
          <span class="font-semibold text-rose-600 dark:text-rose-400 text-sm sm:text-base">-৳${localNum(tx.amount)}</span>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="openEditTxModal('${tx._id}')" class="text-zinc-400 hover:text-indigo-600 p-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            <button onclick="deleteTx('${tx._id}')" class="text-zinc-400 hover:text-rose-600 p-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
        </div>
      </li>
    `;
  });
}

// Fallback Native HTML5 Drag and Drop Handlers
let dragId = null;
function dragTask(ev, id) { dragId = id; }
function allowDrop(ev) { ev.preventDefault(); }
async function dropTask(ev, newStatus) {
  ev.preventDefault();
  if(!dragId) return;
  const tk = allTasks.find(t => t._id === dragId);
  if(tk && tk.status !== newStatus) {
    tk.status = newStatus;
    renderTasks();
    try { 
      await handleFetch(`${API}/update-task/${dragId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus, password: "none_req_for_dnd" }) }); 
    } catch(err) { console.log("DnD Update failed."); }
  }
  dragId = null;
}

// Modern SortableJS implementation for Kanban
let kanbanInstances = [];
function initKanbanBoards() {
  kanbanInstances.forEach(inst => inst.destroy());
  kanbanInstances = [];
  
  const columns = ['col-pending', 'col-in_progress', 'col-review'];
  
  columns.forEach(colId => {
    const el = document.getElementById(colId);
    if(el) {
      const inst = Sortable.create(el, {
        group: 'tasks',
        animation: 150,
        delay: 150,
        delayOnTouchOnly: true,
        ghostClass: 'opacity-40',
        dragClass: 'scale-105',
        onEnd: async function (evt) {
          const itemEl = evt.item;
          const taskId = itemEl.getAttribute('data-id');
          const newStatus = evt.to.getAttribute('data-status');
          
          if (!taskId || !newStatus) return;

          const tk = allTasks.find(t => t._id === taskId);
          if (tk && tk.status !== newStatus) {
            tk.status = newStatus;
            try { 
              await handleFetch(`${API}/update-task/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus, password: "none_req_for_dnd" }) }); 
            } catch(err) { console.log("DnD Update failed."); }
          }
        }
      });
      kanbanInstances.push(inst);
    }
  });
}

async function generatePDFInvoice(taskId) {
  const tk = allTasks.find(t => t._id === taskId);
  if(!tk) return;
  
  const password = await requestAuthToken(t('msg_auth_inv') || "Enter password to download invoice.");
  if(!password) return;
  
  try {
    await handleFetch(`${API}/verify-invoice-password`, { 
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) 
    });
  } catch(err) { 
    return showToast(err.message, 'error'); 
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ format: 'a4' });
  
  const total = tk.totalValue || 0;
  const advance = tk.advancePaid || 0;
  const bonus = tk.bonus || 0;
  const subtotal = total + bonus;
  const balance = subtotal - advance;
  const isPaid = balance <= 0;
  
  // Design Tokens
  const primaryColor = [15, 23, 42]; // Slate 900
  const secondaryColor = [71, 85, 105]; // Slate 600
  const accentColor = [59, 130, 246]; // Blue 500
  const lightGray = [241, 245, 249]; // Slate 100
  const borderGray = [226, 232, 240]; // Slate 200
  const paidColor = [22, 163, 74]; // Green 600
  const dueColor = [220, 38, 38]; // Red 600
  const statusColor = isPaid ? paidColor : dueColor;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- HEADER SECTION ---
  
  // Abstract shape in header
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, pageWidth, 8, 'F');
  
  // "INVOICE" Title
  doc.setFontSize(32); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 20, 30, { align: "right" });
  
  // Invoice Meta Info (Right side)
  doc.setFontSize(10); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]); doc.setFont("helvetica", "bold");
  doc.text("Invoice No:", pageWidth - 60, 42); doc.setFont("helvetica", "normal"); doc.text(`#${tk.orderId || tk._id.slice(-6).toUpperCase()}`, pageWidth - 20, 42, { align: "right" });
  doc.setFont("helvetica", "bold"); doc.text("Date:", pageWidth - 60, 48); doc.setFont("helvetica", "normal"); doc.text(new Date().toLocaleDateString('en-GB'), pageWidth - 20, 48, { align: "right" });
  doc.setFont("helvetica", "bold"); doc.text("Due Date:", pageWidth - 60, 54); doc.setFont("helvetica", "normal"); doc.text(tk.deadline ? new Date(tk.deadline).toLocaleDateString('en-GB') : 'N/A', pageWidth - 20, 54, { align: "right" });
  
  // Company Info (Left side)
  doc.setFontSize(22); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setFont("helvetica", "bold");
  doc.text("Assignment Koran", 20, 30);
  
  doc.setFontSize(10); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]); doc.setFont("helvetica", "normal");
  doc.text("Professional Academic Solutions", 20, 38);
  doc.text("Dhaka, Bangladesh", 20, 44);
  
  // --- BILL TO SECTION ---
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]); doc.setLineWidth(0.5);
  doc.line(20, 65, pageWidth - 20, 65);
  
  doc.setFontSize(11); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setFont("helvetica", "bold");
  doc.text("BILLED TO:", 20, 76);
  
  doc.setFontSize(14); doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]); doc.setFont("helvetica", "bold");
  const cName = tk.client?.name || "Valued Client";
  doc.text(cName, 20, 84);
  
  doc.setFontSize(10); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]); doc.setFont("helvetica", "normal");
  let billY = 90;
  if(tk.client?.phone) { doc.text(`${tk.client.phone}`, 20, billY); billY += 6; }
  if(tk.client?.university) { doc.text(`${tk.client.university}`, 20, billY); billY += 6; }
  
  // Status Stamp
  doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setLineWidth(1.5);
  doc.roundedRect(pageWidth - 60, 72, 40, 16, 2, 2); 
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text(isPaid ? "PAID" : "DUE", pageWidth - 40, 83.5, { align: "center", angle: 0 });
  
  // --- TABLE SECTION ---
  const tableTop = 115;
  
  // Table Header Background
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(20, tableTop, pageWidth - 40, 12, 'F');
  
  // Table Headers
  doc.setFontSize(10); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setFont("helvetica", "bold");
  doc.text("Item Description", 25, tableTop + 8);
  doc.text("Type", 120, tableTop + 8);
  doc.text("Amount", pageWidth - 25, tableTop + 8, { align: "right" });
  
  // Table Row Content
  const rowTop = tableTop + 12;
  doc.setFontSize(11); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]); doc.setFont("helvetica", "normal");
  
  // Handle long descriptions
  const descriptionLines = doc.splitTextToSize(tk.title, 90);
  doc.text(descriptionLines, 25, rowTop + 8);
  
  const typeText = tk.workType || "Task";
  doc.text(typeText, 120, rowTop + 8);
  
  doc.text(`Tk ${localNum(total)}`, pageWidth - 25, rowTop + 8, { align: "right" });
  
  // Table Bottom Line
  const tableBottom = rowTop + (descriptionLines.length * 6) + 4;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]); doc.setLineWidth(0.5);
  doc.line(20, tableBottom, pageWidth - 20, tableBottom);
  
  // --- TOTALS SECTION ---
  const totalsX = pageWidth - 80;
  const amountsX = pageWidth - 25;
  let currentTotalY = tableBottom + 12;
  
  doc.setFontSize(10); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]); doc.setFont("helvetica", "normal");
  
  doc.text("Subtotal:", totalsX, currentTotalY);
  doc.text(`Tk ${localNum(total)}`, amountsX, currentTotalY, { align: "right" });
  currentTotalY += 8;
  
  if (bonus > 0) {
    doc.text("Bonus:", totalsX, currentTotalY);
    doc.text(`Tk ${localNum(bonus)}`, amountsX, currentTotalY, { align: "right" });
    currentTotalY += 8;
  }
  
  doc.text("Advance Paid:", totalsX, currentTotalY);
  doc.setTextColor(dueColor[0], dueColor[1], dueColor[2]);
  doc.text(`- Tk ${localNum(advance)}`, amountsX, currentTotalY, { align: "right" });
  currentTotalY += 8;
  
  // Final Balance Box
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(totalsX - 5, currentTotalY - 4, pageWidth - totalsX - 15, 14, 'F');
  
  doc.setFontSize(12); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setFont("helvetica", "bold");
  doc.text("Balance Due:", totalsX, currentTotalY + 5);
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Tk ${localNum(Math.max(0, balance))}`, amountsX, currentTotalY + 5, { align: "right" });
  
  // Payment Info
  if (!isPaid) {
    const paymentInfoY = tableBottom + 12;
    doc.setFontSize(10); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setFont("helvetica", "bold");
    doc.text("Payment Information", 20, paymentInfoY);
    doc.setFontSize(9); doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]); doc.setFont("helvetica", "normal");
    doc.text("Please clear the due balance to complete", 20, paymentInfoY + 6);
    doc.text("the transaction.", 20, paymentInfoY + 11);
  } else {
    const paymentInfoY = tableBottom + 12;
    doc.setFontSize(11); doc.setTextColor(paidColor[0], paidColor[1], paidColor[2]); doc.setFont("helvetica", "bold");
    doc.text("Thank you for your payment!", 20, paymentInfoY + 6);
  }
  
  // --- FOOTER SECTION ---
  const footerY = 270;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]); doc.setLineWidth(0.5);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  // Left side footer (Social)
  // FB Icon (Blue Circle with F)
  doc.setFillColor(24, 119, 242); doc.circle(22, footerY + 4, 2.5, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold");
  doc.text("f", 22, footerY + 5.5, { align: "center" });
  
  doc.setFontSize(9); doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]); doc.setFont("helvetica", "normal");
  doc.textWithLink("facebook.com/assignmentKoran", 26, footerY + 5, { url: 'https://facebook.com/assignmentKoran' });
  
  // Web Icon (Globe lines)
  doc.setDrawColor(71, 85, 105); doc.setLineWidth(0.3);
  doc.circle(86, footerY + 4, 2.5, 'S');
  doc.line(83.5, footerY + 4, 88.5, footerY + 4); 
  doc.line(86, footerY + 1.5, 86, footerY + 6.5);
  doc.ellipse(86, footerY + 4, 1, 2.5, 'S');
  
  doc.textWithLink("a-koran.vercel.app", 90, footerY + 5, { url: 'https://a-koran.vercel.app/ak.html' });
  
  // Right side footer
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Thank you for your business!", pageWidth - 20, footerY + 5, { align: "right" });

  doc.save(`Invoice_${cName.substring(0,10)}_${tk.orderId || tk._id.slice(-4)}.pdf`);
  showToast("Invoice generated successfully!");
}
function toggleNewClientFields() { 
  const fields = document.getElementById("newClientFields");
  if (fields) fields.style.display = document.getElementById("tClientSelect").value === 'new' ? 'grid' : 'none'; 
}

function openTaskModal(taskId = null) {
  const modal = document.getElementById("taskModal");
  document.getElementById("editTaskId").value = taskId || "";
  document.getElementById("clientSearchInput").value = "";
  filterClientDropdown();
  
  if (taskId) {
    const tk = allTasks.find(t => t._id === taskId);
    document.getElementById("taskModalTitle").innerText = t('btn_update');
    document.getElementById("tTitle").value = tk.title;
    document.getElementById("tDetails").value = tk.details || "";
    document.getElementById("tLink").value = tk.link || "";
    document.getElementById("tDriveLink").value = tk.driveLink || "";
    document.getElementById("tRevisionCount").value = tk.revisionCount || 0;
    document.getElementById("tType").value = tk.workType || tk.type || "Assignment";
    document.getElementById("tTotal").value = tk.totalValue || 0;
    document.getElementById("tAdvance").value = tk.advancePaid || 0;
    document.getElementById("tBonus").value = tk.bonus || 0;
    document.getElementById("tWriterPay").value = tk.writerPay || 0;
    document.getElementById("tAssign").value = tk.assignedTo || "Unassigned";
    document.getElementById("tDeadline").value = tk.deadline ? tk.deadline.split('T')[0] : "";
    document.getElementById("tClientSelect").value = tk.client ? tk.client._id : "new";
    toggleNewClientFields();
  } else {
    document.getElementById("taskModalTitle").innerText = t('modal_task_title');
    document.getElementById("tTitle").value = "";
    document.getElementById("tDetails").value = "";
    document.getElementById("tLink").value = "";
    document.getElementById("tDriveLink").value = "";
    document.getElementById("tRevisionCount").value = "0";
    document.getElementById("tTotal").value = "0";
    document.getElementById("tAdvance").value = "0";
    document.getElementById("tBonus").value = "0";
    document.getElementById("tDeadline").value = ""; 
    document.getElementById("tClientSelect").value = "new";
    document.getElementById("tClientName").value = "";
    document.getElementById("tClientPhone").value = "";
    document.getElementById("tClientUniversity").value = "";
    document.getElementById("tClientCountry").value = "Bangladesh";
    document.getElementById("tClientProgram").value = "";
    document.getElementById("tClientSubject").value = "";
    toggleNewClientFields();
  }
  modal.showModal();
}

async function saveTask(e) {
  const btn = document.getElementById("btnSaveTask");
  const id = document.getElementById("editTaskId").value;
  btn.disabled = true; 
  
  const password = await requestAuthToken(t('msg_auth_save')); 
  if(!password) { btn.disabled = false; return; }

  const payload = {
    title: document.getElementById("tTitle").value,
    details: document.getElementById("tDetails").value,
    link: document.getElementById("tLink").value,
    driveLink: document.getElementById("tDriveLink").value,
    revisionCount: Number(document.getElementById("tRevisionCount").value) || 0,
    workType: document.getElementById("tType").value, 
    deadline: document.getElementById("tDeadline").value || null, 
    clientId: document.getElementById("tClientSelect").value,
    clientName: document.getElementById("tClientName").value,
    clientPhone: document.getElementById("tClientPhone").value,
    clientUniversity: document.getElementById("tClientUniversity").value,
    clientCountry: document.getElementById("tClientCountry").value,
    clientProgram: document.getElementById("tClientProgram").value,
    clientSubject: document.getElementById("tClientSubject").value,
    totalValue: Number(document.getElementById("tTotal").value) || 0,
    advancePaid: Number(document.getElementById("tAdvance").value) || 0,
    bonus: Number(document.getElementById("tBonus").value) || 0,
    writerPay: Number(document.getElementById("tWriterPay").value) || 0,
    assignedTo: document.getElementById("tAssign").value,
    password
  };
  
  if(!payload.title) { showToast("Title is required", 'error'); btn.disabled = false; return; }
  btn.innerText = "...";

  try {
    await handleFetch(id ? `${API}/update-task/${id}` : `${API}/add-task`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    document.getElementById("taskModal").close(); 
    currentTaskPage = 1; 
    await Promise.all([fetchTasks(1, false), fetchClients(), fetchExpenses()]);
    renderDashboard(); renderTasks(); renderClientsView();
    showToast(id ? "Task updated!" : "Task deployed!");
    btn.innerText = id ? t('btn_update') : t('btn_deploy');
    btn.disabled = false;
  } catch(err) { showToast(err.message, 'error'); btn.innerText = id ? t('btn_update') : t('btn_deploy'); btn.disabled = false; }
}

function openTxModal() {
  editingTxId = null;
  document.getElementById("txAmount").value = ""; 
  document.getElementById("txDescription").value = "";
  document.getElementById("txTaskId").value = "";
  document.querySelector("[data-i18n='modal_exp_title']").innerText = t('modal_exp_title');
  
  // Populate Tasks Dropdown
  const taskSelect = document.getElementById("txTaskId");
  const currentVal = taskSelect.value;
  taskSelect.innerHTML = `<option value="">${t('opt_no_task')}</option>`;
  allTasks.forEach(tk => {
    taskSelect.innerHTML += `<option value="${tk._id}">${tk.title} (${tk.client?.name || 'Internal'})</option>`;
  });
  taskSelect.value = currentVal;

  document.getElementById("txModal").showModal();
}

function openEditTxModal(id) {
  const tx = allExpenses.find(e => e._id === id);
  if (!tx) return;
  
  editingTxId = id;
  document.getElementById("txAmount").value = tx.amount;
  document.getElementById("txDescription").value = tx.description || "";
  document.getElementById("txCategory").value = tx.category;
  
  // Populate Tasks Dropdown
  const taskSelect = document.getElementById("txTaskId");
  taskSelect.innerHTML = `<option value="">${t('opt_no_task')}</option>`;
  allTasks.forEach(tk => {
    taskSelect.innerHTML += `<option value="${tk._id}">${tk.title} (${tk.client?.name || 'Internal'})</option>`;
  });
  taskSelect.value = tx.taskId || "";

  document.querySelector("[data-i18n='modal_exp_title']").innerText = t('modal_exp_edit');
  document.getElementById("txModal").showModal();
}

async function saveTransaction(e) {
  const btn = document.getElementById("btnSaveTx");
  btn.disabled = true;
  
  const payload = { 
    category: document.getElementById("txCategory").value, 
    description: document.getElementById("txDescription").value, 
    amount: Number(document.getElementById("txAmount").value), 
    taskId: document.getElementById("txTaskId").value || null,
    type: "expense",
    password
  };
  
  if(payload.amount <= 0) { 
    showToast("Invalid amount", "error");
    btn.disabled = false; 
    return; 
  }
  
  try {
    const url = editingTxId ? `${API}/update-account/${editingTxId}` : `${API}/add-account`;
    const method = editingTxId ? "PUT" : "POST";
    
    await handleFetch(url, { 
      method, 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(payload) 
    });
    
    document.getElementById("txModal").close(); 
    await fetchExpenses();
    renderDashboard(); 
    renderExpenses();
    showToast(editingTxId ? "Expense updated!" : "Expense logged!");
    btn.disabled = false;
  } catch(err) { 
    showToast(err.message, 'error'); 
    btn.disabled = false; 
  }
}

async function deleteTx(id) {
  const password = await requestAuthToken(t('msg_auth_del_exp'));
  if(!password) return;
  try {
    await handleFetch(`${API}/delete-account/${id}`, { 
      method: "DELETE", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ password }) 
    });
    await fetchExpenses();
    renderDashboard();
    renderExpenses();
    showToast("Expense deleted");
  } catch(err) { showToast(err.message, 'error'); }
}

async function updateTaskStatus(id, status) {
  const password = await requestAuthToken(t('msg_auth_status'));
  if(!password) return;
  try { 
    await handleFetch(`${API}/update-task/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, password }) }); 
    currentTaskPage = 1;
    await Promise.all([fetchTasks(1, false), fetchClients(), fetchExpenses()]);
    renderDashboard(); renderTasks(); renderClientsView();
    showToast(`Status updated to ${status}`);
  } catch(err) { showToast(err.message, 'error'); }
}

async function deleteTask(id) {
  const password = await requestAuthToken(t('msg_auth_del_task'));
  if(!password) return;
  try { 
    await handleFetch(`${API}/delete-task/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }); 
    currentTaskPage = 1;
    await Promise.all([fetchTasks(1, false), fetchClients(), fetchExpenses()]);
    renderDashboard(); renderTasks(); renderClientsView();
    showToast("Task deleted.");
  } catch (err) { showToast(err.message, 'error'); }
}

function openClientAddModal() {
  document.getElementById("editClientId").value = "";
  document.getElementById("cEditName").value = "";
  document.getElementById("cEditPhone").value = "";
  document.getElementById("cEditUniversity").value = "";
  document.getElementById("clientModalTitle").innerText = t('modal_client_add');
  document.getElementById("clientEditModal").showModal();
}

function openClientEditModal(clientId) {
  const client = allClients.find(c => c._id === clientId);
  if(!client) return;
  document.getElementById("editClientId").value = client._id;
  document.getElementById("cEditName").value = client.name;
  document.getElementById("cEditPhone").value = client.phone || "";
  document.getElementById("cEditUniversity").value = client.university || "";
  document.getElementById("cEditCountry").value = client.country || "Bangladesh";
  document.getElementById("cEditProgram").value = client.program || "";
  document.getElementById("cEditSubject").value = client.subject || "";
  document.getElementById("cEditImage").value = client.image || client.imageLink || "";

  const preview = document.getElementById("cEditImagePreview");
  const imgUrl = client.image || client.imageLink;
  if (imgUrl) {
    preview.innerHTML = `<img src="${imgUrl}" class="w-full h-full object-cover">`;
  } else {
    preview.innerHTML = '<i class="fa-solid fa-user text-zinc-300 text-xl"></i>';
  }

  document.getElementById("clientModalTitle").innerText = t('modal_client_edit');
  document.getElementById("clientEditModal").showModal();
}

async function saveClient(e) {
  const btn = document.getElementById("btnSaveClient");
  const id = document.getElementById("editClientId").value;
  btn.disabled = true;
  const password = await requestAuthToken(t('msg_auth_save'));
  if (!password) { btn.disabled = false; return; }

  const payload = { 
    name: document.getElementById("cEditName").value, 
    phone: document.getElementById("cEditPhone").value, 
    university: document.getElementById("cEditUniversity").value,
    country: document.getElementById("cEditCountry").value,
    program: document.getElementById("cEditProgram").value,
    subject: document.getElementById("cEditSubject").value,
    image: document.getElementById("cEditImage").value,
    imageLink: document.getElementById("cEditImage").value,
    password
  };
  
  try {
    const url = id ? `${API}/update-client/${id}` : `${API}/add-client`;
    const method = id ? "PUT" : "POST";
    await handleFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    document.getElementById("clientEditModal").close();
    await Promise.all([fetchClients()]);
    renderClientsView();
    showToast(id ? "Client updated!" : "Client added!");
    btn.disabled = false;
  } catch(err) { showToast(err.message, 'error'); btn.disabled = false; }
}

function openClientViewModal(clientId) {
  const client = allClients.find(c => c._id === clientId);
  if(!client) return;
  document.getElementById("clientViewTitle").innerText = `${client.name} - ${t('word_tasks')}`;
  const cTasks = allTasks.filter(t => t.client && t.client._id === clientId);
  const list = document.getElementById("clientViewTaskList");
  list.innerHTML = cTasks.length === 0 ? `<li class="text-zinc-500">${t('no_tasks')}</li>` : cTasks.map(t => generateTaskHTML(t, t.status === 'done')).join('');
  document.getElementById("clientViewModal").showModal();
}

async function handleAdminImageUpload(event, targetInputId, previewId) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`[handleAdminImageUpload] Starting for ${targetInputId}. File:`, file.name, file.size);

    const previewEl = document.getElementById(previewId);
    const originalHTML = previewEl.innerHTML;
    
    // Better Loading Animation
    previewEl.innerHTML = '<div class="flex flex-col items-center gap-1"><i class="fa-solid fa-circle-notch fa-spin text-indigo-500 text-lg"></i></div>';
    previewEl.classList.add('animate-pulse');

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        console.log(`[handleAdminImageUpload] File read. Base64 length: ${base64.length}`);
        try {
            console.log(`[handleAdminImageUpload] Sending via PLAIN FETCH to /api/upload-image...`);
            const res = await fetch(`${API}/upload-image`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': localStorage.getItem('portalSession') || ''
                },
                body: JSON.stringify({ image: base64 })
            });
            
            const data = await res.json();
            console.log(`[handleAdminImageUpload] PLAIN FETCH response:`, data);

            if (data.success) {
                console.log(`[handleAdminImageUpload] SUCCESS! Setting wImage to: ${data.url}`);
                const hiddenInput = document.getElementById(targetInputId);
                if (hiddenInput) {
                    hiddenInput.value = data.url;
                    console.log(`[handleAdminImageUpload] Input ${targetInputId} now has value: ${hiddenInput.value}`);
                }
                previewEl.innerHTML = `<img src="${data.url}" class="w-full h-full object-cover shadow-inner">`;
                previewEl.classList.remove('animate-pulse');
                showToast("Photo uploaded! Click Save to finish.", "success");
            } else {
                throw new Error(data.error || "Upload failed on server");
            }
        } catch (err) {
            console.error(`[handleAdminImageUpload] FATAL ERROR:`, err);
            previewEl.innerHTML = originalHTML;
            previewEl.classList.remove('animate-pulse');
            showToast("Upload failed: " + err.message, "error");
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsDataURL(file);
}

window.addEventListener('beforeunload', (event) => {
    console.warn("PAGE RELOAD DETECTED!");
    // event.preventDefault(); // Optional: prevent reload for debugging
});

bootstrap();

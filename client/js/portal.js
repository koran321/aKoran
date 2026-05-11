// Client Portal Logic
document.addEventListener('DOMContentLoaded', async () => {
    const session = localStorage.getItem('clientSession');
    if (!session) {
        window.location.href = '/';
        return;
    }

    try {
        const res = await fetch('/api/client-portal/dashboard', {
            headers: { 'Authorization': session }
        });
        
        if (res.status === 401) {
            logout();
            return;
        }

        const data = await res.json();
        renderDashboard(data);
    } catch (err) {
        console.error(err);
        alert("Failed to load dashboard data.");
    } finally {
        document.getElementById("portalLoader").style.opacity = '0';
        setTimeout(() => document.getElementById("portalLoader").style.display = 'none', 500);
    }
});

function renderDashboard(data) {
    const { profile, tasks } = data;

    // Profile
    document.getElementById("clientName").innerText = profile.name;
    document.getElementById("clientPhone").innerText = profile.phone;
    document.getElementById("clientUni").innerText = profile.university || "Public University";
    document.getElementById("clientProg").innerText = profile.program || "Undergraduate";
    document.getElementById("clientDept").innerText = profile.subject || "Not Specified";
    document.getElementById("orderCount").innerText = tasks.length;
    
    if (profile.image) {
        document.getElementById("clientAvatar").src = profile.image;
    }

    // Financials
    let totalValue = 0;
    let totalPaid = 0;
    tasks.forEach(t => {
        const val = (t.totalValue || 0) + (t.bonus || 0);
        totalValue += val;
        totalPaid += (t.advancePaid || 0);
        if (t.status === 'done') {
            // If done, assume full payment for stats calculation or strictly based on advance?
            // Usually 'done' means full payment should be cleared.
            // Let's stick to actual advancePaid for accuracy unless we have a 'fullPaid' flag.
        }
    });
    
    const totalDue = totalValue - totalPaid;
    document.getElementById("statPaid").innerText = `৳${totalPaid.toLocaleString()}`;
    document.getElementById("statDue").innerText = `৳${totalDue.toLocaleString()}`;
    
    const payPercentage = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
    document.getElementById("paymentProgress").style.width = `${payPercentage}%`;

    // Orders
    const container = document.getElementById("ordersContainer");
    container.innerHTML = tasks.length === 0 ? `<div class="p-12 text-center text-zinc-500 italic">No orders found.</div>` : 
        tasks.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(t => renderOrderCard(t)).join('');
}

function renderOrderCard(tk) {
    const statusMap = { 'pending': 1, 'in_progress': 2, 'review': 3, 'done': 4 };
    const step = statusMap[tk.status] || 1;
    const progress = (step / 4) * 100;
    
    const isDone = tk.status === 'done';
    const total = (tk.totalValue || 0) + (tk.bonus || 0);
    const due = total - (tk.advancePaid || 0);

    return `
        <div class="bg-white dark:bg-[#0f172a] rounded-3xl p-5 sm:p-6 transition-all hover:scale-[1.01] border border-zinc-100 dark:border-white/5 shadow-xl shadow-zinc-200/20 dark:shadow-none">
            <div class="flex flex-col sm:flex-row justify-between gap-4">
                <div class="space-y-2 flex-1">
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded-lg bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest">${tk.workType || 'Task'}</span>
                        <span class="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Order ID: <span class="text-indigo-500 font-black">#${tk.orderId || tk._id.slice(-6).toUpperCase()}</span></span>
                    </div>
                    <h4 class="text-lg font-bold text-zinc-900 dark:text-white leading-tight">${tk.title}</h4>
                    <div class="flex items-center gap-4 pt-1">
                        <div class="flex -space-x-2">
                            <div class="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold uppercase overflow-hidden" title="Assigned Writer">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(tk.assignedTo || 'W')}&background=random" class="w-full h-full object-cover">
                            </div>
                        </div>
                        <span class="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-tighter">${tk.assignedTo || 'Assigning...'}</span>
                    </div>
                </div>
                
                <div class="flex flex-row sm:flex-col justify-between items-end gap-2 text-right">
                    <div class="px-3 py-1 rounded-full ${isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'} text-[10px] font-black uppercase tracking-widest border ${isDone ? 'border-emerald-500/20' : 'border-indigo-500/20'}">
                        ${tk.status.replace('_', ' ')}
                    </div>
                    <div>
                        <p class="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Due Amount</p>
                        <p class="text-sm font-black ${due > 0 ? 'text-rose-500' : 'text-emerald-500'}">৳${due.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-8 space-y-4">
                <div class="h-1.5 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                    <div class="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" style="width: ${progress}%"></div>
                </div>
                <div class="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    <span class="${step >= 1 ? 'text-indigo-500' : ''}">Briefing</span>
                    <span class="${step >= 2 ? 'text-indigo-500' : ''}">Drafting</span>
                    <span class="${step >= 3 ? 'text-indigo-500' : ''}">Refining</span>
                    <span class="${step >= 4 ? 'text-emerald-500' : ''}">Delivered</span>
                </div>
            </div>

            <div class="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 flex flex-wrap gap-2">
                <a href="/admin/?track=${tk.orderId || tk._id}" class="px-4 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/10 transition-all text-zinc-600 dark:text-zinc-300">Track Order</a>
                ${tk.link ? `<a href="${tk.link}" target="_blank" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">View Files</a>` : ''}
            </div>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('clientSession');
    localStorage.removeItem('clientPhone');
    window.location.href = '/';
}

function contactSupport() {
    window.open('https://wa.me/8801875191553?text=' + encodeURIComponent("Hello, I am logged into the Scholar Portal and need help with my orders."), '_blank');
}

function triggerPhotoUpload() {
    document.getElementById("photoInput").click();
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const avatar = document.getElementById("clientAvatar");
    const container = document.getElementById("profilePhoto");
    const originalSrc = avatar.src;

    // Show loading state
    container.classList.add('animate-pulse');
    avatar.style.opacity = '0.5';

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        
        try {
            // 1. Upload to ImgBB via our backend
            const uploadRes = await fetch('/api/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 })
            });
            const uploadData = await uploadRes.json();
            
            if (uploadData.success) {
                // 2. Update client profile in DB
                const session = localStorage.getItem('clientSession');
                const updateRes = await fetch('/api/client-portal/update-profile', {
                    method: 'PUT',
                    headers: { 
                        'Authorization': session,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ image: uploadData.url, imageLink: uploadData.url })
                });
                
                const updateData = await updateRes.json();
                if (updateData.success) {
                    avatar.src = uploadData.url;
                    alert("Profile photo updated!");
                } else {
                    avatar.src = originalSrc;
                    alert("Failed to save profile photo.");
                }
            } else {
                avatar.src = originalSrc;
                alert("Upload failed: " + (uploadData.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            avatar.src = originalSrc;
            alert("Connection error during upload.");
        } finally {
            container.classList.remove('animate-pulse');
            avatar.style.opacity = '1';
        }
    };
    reader.readAsDataURL(file);
}

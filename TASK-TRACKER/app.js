/* ═══════════════════════════════════════════════════════
   Task Tracker  —  app.js
   ═══════════════════════════════════════════════════════ */

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let sortKey = '';
let sortDir = 1;

// Chart instances (so we can destroy/re-draw them)
let barChartInst = null;
let donutStatusInst = null;
let donutPriorityInst = null;
let lineChartInst = null;

/* ════════════════════════════════════════════════════════
   TIME PARSING  —  accepts "2h 30m", "1.5h", "90m", "2h", "45m"
   Returns total minutes (integer).
   ════════════════════════════════════════════════════════ */
function parseMinutes(str) {
    if (!str || !str.trim()) return null;
    str = str.trim().toLowerCase();

    let mins = 0;
    const hMatch = str.match(/(\d+\.?\d*)\s*h/);
    const mMatch = str.match(/(\d+\.?\d*)\s*m/);

    if (hMatch) mins += parseFloat(hMatch[1]) * 60;
    if (mMatch) mins += parseFloat(mMatch[1]);

    // Plain number → treat as hours
    if (!hMatch && !mMatch) {
        const plain = parseFloat(str);
        if (!isNaN(plain)) mins = plain * 60;
    }

    return isNaN(mins) || mins === 0 ? null : Math.round(mins);
}

function fmtMinutes(mins) {
    if (mins === null || isNaN(mins)) return '—';
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.abs(mins) % 60;
    const sign = mins < 0 ? '−' : '';
    if (h === 0) return `${sign}${m}m`;
    if (m === 0) return `${sign}${h}h`;
    return `${sign}${h}h ${m}m`;
}

/* ════════════════════════════════════════════════════════
   TAB SWITCHING
   ════════════════════════════════════════════════════════ */
function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-tasks').style.display = tab === 'tasks' ? '' : 'none';
    document.getElementById('tab-dashboard').style.display = tab === 'dashboard' ? '' : 'none';
    if (tab === 'dashboard') renderDashboard();
}

/* ════════════════════════════════════════════════════════
   TASK TABLE
   ════════════════════════════════════════════════════════ */
function renderTable() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const stFilter = document.getElementById('filterStatus').value;
    const prFilter = document.getElementById('filterPriority').value;

    let filtered = tasks.filter(t => {
        const matchSearch = t.task.toLowerCase().includes(search) || (t.notes || '').toLowerCase().includes(search);
        const matchStatus = !stFilter || t.status === stFilter;
        const matchPriority = !prFilter || t.priority === prFilter;
        return matchSearch && matchStatus && matchPriority;
    });

    if (sortKey) {
        filtered.sort((a, b) => {
            let av = a[sortKey] || '', bv = b[sortKey] || '';
            return av < bv ? -sortDir : av > bv ? sortDir : 0;
        });
    }

    const tbody = document.getElementById('taskBody');
    tbody.innerHTML = '';

    filtered.forEach(t => {
        const realIndex = tasks.indexOf(t);
        const priorClass = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }[t.priority] || '';
        const statusClass = { 'Not Started': 'status-not-started', 'In Progress': 'status-in-progress', 'Done': 'status-done' }[t.status] || '';
        const prLabel = { High: '🔴 High', Medium: '🟡 Medium', Low: '🟢 Low' }[t.priority] || t.priority;

        const tr = document.createElement('tr');
        if (t.completed) tr.classList.add('completed-row');
        tr.innerHTML = `
      <td><input type="checkbox" class="check-complete" ${t.completed ? 'checked' : ''} onchange="toggleComplete(${realIndex}, this.checked)" /></td>
      <td>${t.date || '—'}</td>
      <td><strong>${esc(t.task)}</strong></td>
      <td><span class="badge ${priorClass}">${prLabel}</span></td>
      <td>${esc(t.estTime || '—')}</td>
      <td>${esc(t.actTime || '—')}</td>
      <td><span class="status-badge ${statusClass}">${t.status}</span></td>
      <td class="notes-cell" title="${esc(t.notes || '')}">${esc(t.notes || '—')}</td>
      <td>
        <div class="action-btns">
          <button class="btn-edit"   onclick="editTask(${realIndex})">✏️ Edit</button>
          <button class="btn-delete" onclick="deleteTask(${realIndex})">🗑️ Del</button>
        </div>
      </td>`;
        tbody.appendChild(tr);
    });

    document.getElementById('emptyState').style.display = filtered.length === 0 ? 'block' : 'none';
    updateStats();
}

function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function updateStats() {
    document.getElementById('totalCount').textContent = tasks.length;
    document.getElementById('inProgressCount').textContent = tasks.filter(t => t.status === 'In Progress').length;
    document.getElementById('doneCount').textContent = tasks.filter(t => t.status === 'Done').length;
    document.getElementById('notStartedCount').textContent = tasks.filter(t => t.status === 'Not Started').length;
}

function sortTable(key) {
    sortDir = sortKey === key ? -sortDir : 1;
    sortKey = key;
    renderTable();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterPriority').value = '';
    renderTable();
}

/* ════════════════════════════════════════════════════════
   MODAL
   ════════════════════════════════════════════════════════ */
function openModal() {
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('taskForm').reset();
    document.getElementById('editIndex').value = -1;
    document.getElementById('taskDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function closeModalOutside(e) {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function saveTask(e) {
    e.preventDefault();
    const idx = parseInt(document.getElementById('editIndex').value);
    const task = {
        date: document.getElementById('taskDate').value,
        task: document.getElementById('taskName').value.trim(),
        priority: document.getElementById('taskPriority').value,
        estTime: document.getElementById('taskEstTime').value.trim(),
        actTime: document.getElementById('taskActTime').value.trim(),
        status: document.getElementById('taskStatus').value,
        completed: document.getElementById('taskCompleted').checked,
        notes: document.getElementById('taskNotes').value.trim(),
    };
    if (idx === -1) tasks.push(task);
    else tasks[idx] = task;
    saveTasks();
    closeModal();
    renderTable();
}

function editTask(idx) {
    const t = tasks[idx];
    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('taskDate').value = t.date;
    document.getElementById('taskName').value = t.task;
    document.getElementById('taskPriority').value = t.priority;
    document.getElementById('taskEstTime').value = t.estTime;
    document.getElementById('taskActTime').value = t.actTime;
    document.getElementById('taskStatus').value = t.status;
    document.getElementById('taskCompleted').checked = t.completed;
    document.getElementById('taskNotes').value = t.notes;
    document.getElementById('editIndex').value = idx;
    document.getElementById('modalOverlay').classList.add('active');
}

function deleteTask(idx) {
    if (!confirm('Delete this task?')) return;
    tasks.splice(idx, 1);
    saveTasks();
    renderTable();
}

function toggleComplete(idx, checked) {
    tasks[idx].completed = checked;
    if (checked) tasks[idx].status = 'Done';
    saveTasks();
    renderTable();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/* ════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════ */
function renderDashboard() {
    renderDashCards();
    renderBarChart();
    renderDonutStatus();
    renderDonutPriority();
    renderLineChart();
    renderPerfTable();
}

function renderDashCards() {
    const today = new Date().toISOString().split('T')[0];

    let totalEst = 0, totalEstCount = 0;
    let totalAct = 0, totalActCount = 0;
    let compEst = 0, compEstCount = 0;
    let varianceMins = 0, varianceCount = 0;
    let overdue = 0;

    tasks.forEach(t => {
        const est = parseMinutes(t.estTime);
        const act = parseMinutes(t.actTime);

        if (est !== null) { totalEst += est; totalEstCount++; }
        if (act !== null) { totalAct += act; totalActCount++; }
        if (t.status === 'Done' && est !== null) { compEst += est; compEstCount++; }
        if (est !== null && act !== null) { varianceMins += (act - est); varianceCount++; }
        if (t.date && t.date < today && t.status !== 'Done') overdue++;
    });

    const efficiency = (totalEstCount > 0 && totalActCount > 0 && totalEst > 0)
        ? Math.round((totalEst / totalAct) * 100) : null;

    document.getElementById('d-totalEst').textContent = fmtMinutes(totalEst);
    document.getElementById('d-totalAct').textContent = fmtMinutes(totalAct);
    document.getElementById('d-completedEst').textContent = fmtMinutes(compEst);
    document.getElementById('d-overdue').textContent = overdue;

    const varEl = document.getElementById('d-variance');
    const varCard = document.getElementById('d-varianceCard');
    if (varianceCount > 0) {
        const isOver = varianceMins > 0;
        varEl.textContent = (isOver ? '+' : '−') + fmtMinutes(Math.abs(varianceMins));
        varCard.style.borderColor = isOver ? '#ef4444' : '#10b981';
        varEl.style.color = isOver ? '#ef4444' : '#10b981';
        varEl.nextElementSibling.textContent = isOver ? 'Over Estimate ⚠️' : 'Under Estimate ✅';
    } else {
        varEl.textContent = '—';
    }

    const effEl = document.getElementById('d-efficiency');
    if (efficiency !== null) {
        effEl.textContent = efficiency + '%';
        effEl.style.color = efficiency >= 90 ? '#10b981' : efficiency >= 70 ? '#f59e0b' : '#ef4444';
    } else {
        effEl.textContent = '—';
    }
}

/* ── Bar Chart: Est vs Actual per Task ── */
function renderBarChart() {
    const tasksWithData = tasks.filter(t => parseMinutes(t.estTime) !== null || parseMinutes(t.actTime) !== null);
    const labels = tasksWithData.map(t => t.task.length > 20 ? t.task.slice(0, 18) + '…' : t.task);
    const estData = tasksWithData.map(t => { const m = parseMinutes(t.estTime); return m !== null ? +(m / 60).toFixed(2) : 0; });
    const actData = tasksWithData.map(t => { const m = parseMinutes(t.actTime); return m !== null ? +(m / 60).toFixed(2) : 0; });

    if (barChartInst) barChartInst.destroy();

    barChartInst = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Estimated (hrs)',
                    data: estData,
                    backgroundColor: 'rgba(99,102,241,0.7)',
                    borderColor: '#6366f1',
                    borderWidth: 1.5,
                    borderRadius: 6,
                },
                {
                    label: 'Actual (hrs)',
                    data: actData,
                    backgroundColor: 'rgba(139,92,246,0.7)',
                    borderColor: '#8b5cf6',
                    borderWidth: 1.5,
                    borderRadius: 6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Hours' },
                    grid: { color: '#f1f5f9' },
                },
                x: { grid: { display: false } },
            },
        },
    });
}

/* ── Donut: Status ── */
function renderDonutStatus() {
    const ns = tasks.filter(t => t.status === 'Not Started').length;
    const ip = tasks.filter(t => t.status === 'In Progress').length;
    const dn = tasks.filter(t => t.status === 'Done').length;

    if (donutStatusInst) donutStatusInst.destroy();

    donutStatusInst = new Chart(document.getElementById('donutStatus'), {
        type: 'doughnut',
        data: {
            labels: ['Not Started', 'In Progress', 'Done'],
            datasets: [{
                data: [ns, ip, dn],
                backgroundColor: ['#e2e8f0', '#bfdbfe', '#bbf7d0'],
                borderColor: ['#94a3b8', '#3b82f6', '#10b981'],
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 14, boxWidth: 12 } },
            },
        },
    });
}

/* ── Donut: Priority ── */
function renderDonutPriority() {
    const hi = tasks.filter(t => t.priority === 'High').length;
    const md = tasks.filter(t => t.priority === 'Medium').length;
    const lo = tasks.filter(t => t.priority === 'Low').length;

    if (donutPriorityInst) donutPriorityInst.destroy();

    donutPriorityInst = new Chart(document.getElementById('donutPriority'), {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [hi, md, lo],
                backgroundColor: ['#fee2e2', '#fef9c3', '#dcfce7'],
                borderColor: ['#ef4444', '#f59e0b', '#10b981'],
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 14, boxWidth: 12 } },
            },
        },
    });
}

/* ── Line Chart: Actual Time Logged Over Date ── */
function renderLineChart() {
    // Group actual minutes by date
    const byDate = {};
    tasks.forEach(t => {
        if (!t.date) return;
        const act = parseMinutes(t.actTime);
        if (act === null) return;
        byDate[t.date] = (byDate[t.date] || 0) + act;
    });

    const dates = Object.keys(byDate).sort();
    const values = dates.map(d => +(byDate[d] / 60).toFixed(2));

    if (lineChartInst) lineChartInst.destroy();

    lineChartInst = new Chart(document.getElementById('lineChart'), {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Actual Hours Logged',
                data: values,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139,92,246,0.1)',
                pointBackgroundColor: '#8b5cf6',
                pointRadius: 5,
                tension: 0.35,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Hours' },
                    grid: { color: '#f1f5f9' },
                },
                x: { grid: { display: false } },
            },
        },
    });
}

/* ── Performance Breakdown Table ── */
function renderPerfTable() {
    const tbody = document.getElementById('perfTableBody');
    tbody.innerHTML = '';

    const withData = tasks.filter(t => parseMinutes(t.estTime) !== null || parseMinutes(t.actTime) !== null);

    if (withData.length === 0) {
        document.getElementById('perfEmpty').style.display = 'block';
        return;
    }
    document.getElementById('perfEmpty').style.display = 'none';

    const priorLabel = { High: '<span class="badge badge-high">🔴 High</span>', Medium: '<span class="badge badge-medium">🟡 Medium</span>', Low: '<span class="badge badge-low">🟢 Low</span>' };
    const stLabel = { 'Not Started': '<span class="status-badge status-not-started">Not Started</span>', 'In Progress': '<span class="status-badge status-in-progress">In Progress</span>', 'Done': '<span class="status-badge status-done">Done</span>' };

    withData.forEach(t => {
        const est = parseMinutes(t.estTime);
        const act = parseMinutes(t.actTime);
        const variance = (est !== null && act !== null) ? act - est : null;

        let varHTML = '—';
        if (variance !== null) {
            const cls = variance > 0 ? 'var-over' : variance < 0 ? 'var-under' : 'var-exact';
            const sign = variance > 0 ? '+' : variance < 0 ? '−' : '';
            varHTML = `<span class="${cls}">${sign}${fmtMinutes(Math.abs(variance))}</span>`;
        }

        let effHTML = '—';
        if (est !== null && act !== null && act > 0) {
            const eff = Math.round((est / act) * 100);
            const cls = eff >= 90 ? 'eff-good' : eff >= 70 ? 'eff-ok' : 'eff-poor';
            const emoji = eff >= 90 ? '🎯' : eff >= 70 ? '🟡' : '🔴';
            effHTML = `<span class="${cls}">${emoji} ${eff}%</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td><strong>${esc(t.task)}</strong></td>
      <td>${priorLabel[t.priority] || t.priority}</td>
      <td>${stLabel[t.status] || t.status}</td>
      <td>${fmtMinutes(est)}</td>
      <td>${fmtMinutes(act)}</td>
      <td>${varHTML}</td>
      <td>${effHTML}</td>`;
        tbody.appendChild(tr);
    });
}

/* ════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════ */
renderTable();
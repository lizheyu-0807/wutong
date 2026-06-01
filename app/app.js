import {
  HISTORY_LABELS,
  completeExam,
  createPatient,
  createReminderQueue,
  createStorageAdapter,
  exportPatientsCsv,
  filterPatients,
  findPatient,
  getNextActionNode,
  getPatientTimeline,
  getProgressLabel,
  getProgressNodeId,
  getStatistics,
  listProgressOptions,
  markNodeComplete,
  seedDemoState,
  sendManualReminder,
  switchPatientToHospital,
  updateConfigNode,
  updatePatient,
} from './core.js';

const app = document.querySelector('#app');
const adapter = createStorageAdapter(window.localStorage);
let state = adapter.load() ?? seedDemoState({ now: new Date().toISOString() });

const ui = {
  tab: 'patient',
  patientView: 'entry',
  activePatientId: null,
  activeNodeId: null,
  adminLoggedIn: false,
  adminView: 'dashboard',
  filters: { examDate: '', progressNodeId: '', query: '' },
  selectedPatientIds: new Set(),
  editPatientId: null,
  pendingUploads: {},
};

renderApp();

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;

  try {
    if (action === 'set-tab') {
      ui.tab = button.dataset.tab;
      ui.activeNodeId = null;
      renderApp();
    }

    if (action === 'continue-patient') {
      ui.tab = 'patient';
      ui.patientView = 'timeline';
      ui.activePatientId = button.dataset.patientId;
      ui.activeNodeId = null;
      renderApp();
    }

    if (action === 'new-patient') {
      ui.tab = 'patient';
      ui.patientView = 'entry';
      ui.activeNodeId = null;
      renderApp();
    }

    if (action === 'open-node') {
      ui.patientView = 'detail';
      ui.activePatientId = button.dataset.patientId;
      ui.activeNodeId = button.dataset.nodeId;
      renderApp();
    }

    if (action === 'back-timeline') {
      ui.patientView = 'timeline';
      ui.activeNodeId = null;
      renderApp();
    }

    if (action === 'complete-node') {
      markNodeComplete(state, button.dataset.patientId, button.dataset.nodeId);
      persist();
      ui.patientView = 'timeline';
      ui.activeNodeId = null;
      renderApp();
      showToast('已标记完成，时间线已更新。');
    }

    if (action === 'arrive-hospital') {
      switchPatientToHospital(state, button.dataset.patientId);
      persist();
      ui.patientView = 'timeline';
      ui.activeNodeId = null;
      renderApp();
      showToast('已切换为院内就诊流程。');
    }

    if (action === 'complete-exam') {
      completeExam(state, button.dataset.patientId);
      persist();
      ui.patientView = 'post-op';
      renderApp();
      showToast('已进入术后注意事项页。');
    }

    if (action === 'admin-view') {
      ui.adminView = button.dataset.view;
      renderApp();
    }

    if (action === 'logout-admin') {
      ui.adminLoggedIn = false;
      ui.selectedPatientIds.clear();
      ui.editPatientId = null;
      renderApp();
    }

    if (action === 'clear-filters') {
      ui.filters = { examDate: '', progressNodeId: '', query: '' };
      ui.selectedPatientIds.clear();
      renderApp();
    }

    if (action === 'admin-edit-patient') {
      ui.editPatientId = button.dataset.patientId;
      renderApp();
    }

    if (action === 'close-edit') {
      ui.editPatientId = null;
      renderApp();
    }

    if (action === 'admin-send-one') {
      const logs = sendManualReminder(state, button.dataset.patientId);
      persist();
      renderApp();
      showToast(`已模拟发送：${logs[0].message}`);
    }

    if (action === 'batch-send') {
      const patients = getFilteredPatients();
      const selected = patients.filter((patient) => ui.selectedPatientIds.has(patient.id));
      const targetPatients = selected.length > 0 ? selected : patients;
      if (targetPatients.length === 0) {
        showToast('当前筛选结果没有患者，无法发送。');
        return;
      }
      sendManualReminder(state, targetPatients.map((patient) => patient.id));
      persist();
      renderApp();
      showToast(`已对 ${targetPatients.length} 位患者模拟发送微信提醒。`);
    }

    if (action === 'export-csv') {
      const csv = exportPatientsCsv(state, getFilteredPatients());
      downloadFile(`患者进度导出-${formatDateForFile(new Date())}.csv`, `\ufeff${csv}`);
      showToast('已生成 CSV 文件，可用 Excel 打开。');
    }

    if (action === 'open-message-target') {
      const patientId = button.dataset.patientId;
      const nodeId = button.dataset.nodeId;
      ui.tab = 'patient';
      ui.patientView = nodeId === 'post-op' ? 'post-op' : 'detail';
      ui.activePatientId = patientId;
      ui.activeNodeId = nodeId === 'post-op' ? null : nodeId;
      renderApp();
    }
  } catch (error) {
    showToast(error.message || '操作失败，请检查输入。');
  }
});

app.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;

  try {
    if (form.id === 'patient-entry-form') {
      handlePatientCreate(form);
    }

    if (form.id === 'admin-login-form') {
      handleAdminLogin(form);
    }

    if (form.id === 'admin-password-form') {
      handlePasswordChange(form);
    }

    if (form.id === 'admin-filter-form') {
      ui.filters = Object.fromEntries(new FormData(form).entries());
      ui.selectedPatientIds.clear();
      renderApp();
    }

    if (form.id === 'patient-edit-form') {
      handlePatientEdit(form);
    }

    if (form.classList.contains('node-config-form')) {
      handleNodeConfig(form);
    }

    if (form.id === 'reminder-config-form') {
      state.config.hospitalName = form.elements.hospitalName.value.trim() || 'XX医院';
      state.config.centerName = form.elements.centerName.value.trim() || '内镜中心';
      state.config.reminder.leadMinutes = Number(form.elements.leadMinutes.value || 60);
      state.config.reminder.template = form.elements.template.value.trim();
      persist();
      renderApp();
      showToast('提醒规则已保存，刷新页面后仍会保留。');
    }

    if (form.id === 'post-op-config-form') {
      state.config.postOp = {
        ...state.config.postOp,
        title: form.elements.title.value.trim(),
        diet: form.elements.diet.value.trim(),
        activity: form.elements.activity.value.trim(),
        abnormal: form.elements.abnormal.value.trim(),
        report: form.elements.report.value.trim(),
        revisit: form.elements.revisit.value.trim(),
        image: ui.pendingUploads['postOp:image'] ?? form.elements.image.value.trim(),
      };
      delete ui.pendingUploads['postOp:image'];
      persist();
      renderApp();
      showToast('术后内容已保存。');
    }
  } catch (error) {
    showToast(error.message || '保存失败，请检查输入。');
  }
});

app.addEventListener('change', (event) => {
  const input = event.target;

  if (input.classList.contains('patient-select')) {
    if (input.checked) {
      ui.selectedPatientIds.add(input.value);
    } else {
      ui.selectedPatientIds.delete(input.value);
    }
  }

  if (input.dataset.uploadKey && input.files?.[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      ui.pendingUploads[input.dataset.uploadKey] = reader.result;
      showToast(`已读取文件：${file.name}。点击保存后生效。`);
    };
    reader.readAsDataURL(file);
  }
});

function renderApp() {
  app.innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <strong>无痛胃肠镜全流程智能导诊</strong>
          <span>wutong · 第一版 MVP · 独立运行原型</span>
        </div>
        <nav class="nav" aria-label="主导航">
          <button class="${ui.tab === 'patient' ? 'active' : ''}" data-action="set-tab" data-tab="patient">患者端</button>
          <button class="${ui.tab === 'admin' ? 'active' : ''}" data-action="set-tab" data-tab="admin">医护后台</button>
        </nav>
      </div>
    </header>
    <main class="page">
      ${ui.tab === 'patient' ? renderPatient() : renderAdmin()}
    </main>
  `;
}

function renderPatient() {
  if (!ui.activePatientId) {
    return renderPatientEntry();
  }

  const patient = safeFindPatient(ui.activePatientId);
  if (!patient) {
    ui.activePatientId = null;
    return renderPatientEntry();
  }

  if (ui.patientView === 'detail' && ui.activeNodeId) {
    return renderNodeDetail(patient);
  }

  if (ui.patientView === 'post-op' || patient.currentPhase === 'post-op') {
    return renderPostOp(patient);
  }

  return renderPatientTimeline(patient);
}

function renderPatientEntry() {
  const today = formatInputDate(new Date());
  const recent = state.patients.slice(0, 3).map((patient) => `
    <button class="ghost-btn" data-action="continue-patient" data-patient-id="${patient.id}">
      继续查看 ${escapeHtml(patient.name)} · ${escapeHtml(patient.examDate)}
    </button>
  `).join('');

  return `
    <section class="patient-stage">
      <div class="hero-band">
        <h1>扫码后填写检查信息</h1>
        <p>只保留必填信息，提交后自动生成个人准备时间线。</p>
      </div>

      <form id="patient-entry-form" class="card form-grid">
        <div class="two-col">
          <label>检查日期
            <input name="examDate" type="date" min="${today}" value="${today}" required>
          </label>
          <label>检查时段
            <select name="examPeriod" required>
              <option value="morning">上午</option>
              <option value="afternoon">下午</option>
            </select>
          </label>
        </div>

        <div>
          <label>是否无痛胃肠镜</label>
          <div class="choice-row">
            <label class="choice"><input type="radio" name="painless" value="yes" checked> 是</label>
            <label class="choice"><input type="radio" name="painless" value="no"> 否</label>
          </div>
        </div>

        <div class="two-col">
          <label>患者姓名
            <input name="name" autocomplete="name" placeholder="请输入姓名" required>
          </label>
          <label>联系电话
            <input name="phone" inputmode="tel" placeholder="请输入手机号码" required>
          </label>
        </div>

        <details>
          <summary>基础病史（选填）</summary>
          <div class="check-row" style="margin-top: 12px;">
            ${Object.entries(HISTORY_LABELS).map(([key, label]) => `
              <label class="check-pill"><input type="checkbox" name="histories" value="${key}"> ${label}</label>
            `).join('')}
          </div>
        </details>

        <button class="primary-btn" type="submit">生成我的专属流程</button>
      </form>

      ${recent ? `<div class="card form-grid" style="margin-top: 14px;"><strong>本机最近流程</strong>${recent}</div>` : ''}
    </section>
  `;
}

function renderPatientTimeline(patient) {
  const timeline = getPatientTimeline(state, patient.id, patient.currentPhase);
  const nextNode = getNextActionNode(state, patient.id);
  const phaseLabel = patient.currentPhase === 'hospital' ? '院内就诊流程' : '居家准备流程';

  return `
    <section class="patient-stage">
      <div class="hero-band">
        <div class="section-title">
          <h2>${escapeHtml(patient.name)}的专属时间线</h2>
          <p>${phaseLabel} · 所有时间按检查日期自动计算</p>
        </div>
        <div class="info-strip">
          <div class="info-item"><span>检查日期</span><strong>${escapeHtml(patient.examDate)}</strong></div>
          <div class="info-item"><span>检查时段</span><strong>${periodLabel(patient.examPeriod)}</strong></div>
          <div class="info-item"><span>是否无痛</span><strong>${patient.painless ? '是' : '否'}</strong></div>
        </div>
        <div class="alert">核心注意：检查前6小时严格禁食禁水；无痛检查当天不要驾车、骑车或高空作业。</div>
      </div>

      ${nextNode ? `
        <div class="next-action">
          <h2>下一步：${escapeHtml(nextNode.name)}</h2>
          <p><strong>执行时间：</strong>${formatDateTime(nextNode.scheduledAt)}</p>
          <p>${escapeHtml(nextNode.summary)}</p>
          <button class="primary-btn" data-action="open-node" data-patient-id="${patient.id}" data-node-id="${nextNode.id}">查看详细指引</button>
        </div>
      ` : ''}

      <div class="timeline">
        ${timeline.map((node, index) => renderNodeCard(patient, node, nextNode, index)).join('')}
      </div>

      <div class="card form-grid" style="margin-top: 14px;">
        ${patient.currentPhase === 'home' ? `<button class="success-btn" data-action="arrive-hospital" data-patient-id="${patient.id}">我已到院报到</button>` : ''}
        ${patient.currentPhase === 'hospital' ? `<button class="warning-btn" data-action="complete-exam" data-patient-id="${patient.id}">检查已完成</button>` : ''}
        <button class="ghost-btn" data-action="new-patient">返回入口页</button>
      </div>
    </section>
  `;
}

function renderNodeCard(patient, node, nextNode, index) {
  const isNext = nextNode?.id === node.id;
  const statusText = node.completed ? '已完成' : isNext ? '即将执行' : '待完成';
  return `
    <article class="node-card ${node.completed ? 'done' : ''} ${isNext ? 'next' : ''}">
      <div class="node-icon">${node.completed ? '✓' : index + 1}</div>
      <div class="node-body">
        <div class="node-head">
          <h3>${escapeHtml(node.name)} · ${statusText}</h3>
          <span class="node-time">${formatDateTime(node.scheduledAt)}</span>
        </div>
        <p>${escapeHtml(node.summary)}</p>
        <div class="mini-actions">
          <button data-action="open-node" data-patient-id="${patient.id}" data-node-id="${node.id}">查看详情</button>
          ${node.completed ? '' : `<button data-action="complete-node" data-patient-id="${patient.id}" data-node-id="${node.id}">标记完成</button>`}
        </div>
      </div>
    </article>
  `;
}

function renderNodeDetail(patient) {
  const node = findTimelineNode(patient.id, ui.activeNodeId);
  if (!node) return renderPatientTimeline(patient);
  const location = node.location ?? node;
  const hasHospitalDetail = node.phase === 'hospital' || Boolean(node.location);

  return `
    <section class="patient-stage">
      <div class="detail-title">
        <button class="ghost-btn" data-action="back-timeline">返回时间线</button>
        <h1>${escapeHtml(node.name)}</h1>
        <p class="muted">执行时间：${formatDateTime(node.scheduledAt)}</p>
      </div>

      <div class="detail-grid">
        <div class="content-box">
          <h3>标准化操作步骤</h3>
          <ol>${asList(node.steps, 'ol')}</ol>
        </div>

        <div class="content-box">
          <h3>禁忌与注意事项</h3>
          <div class="alert"><ul>${asList(node.warnings, 'ul')}</ul></div>
        </div>

        <div class="content-box media-box">
          <h3>宣教内容</h3>
          ${renderImage(node.education?.image, '宣教图片')}
          ${renderVideo(node.education?.video)}
        </div>

        ${hasHospitalDetail ? `
          <div class="content-box media-box">
            <h3>院内导诊信息</h3>
            <p><strong>下一步科室：</strong>${escapeHtml(location.nextDepartment ?? location.department ?? '内镜中心')}</p>
            ${renderImage(location.photo, '科室实景照片')}
            <p><strong>路线指引：</strong>${escapeHtml(location.route ?? '请按护士现场指引前往。')}</p>
            <p><strong>需携带材料：</strong>${escapeHtml((location.materials ?? []).join('、') || '按护士现场要求携带')}</p>
          </div>
        ` : ''}

        <button class="success-btn" data-action="complete-node" data-patient-id="${patient.id}" data-node-id="${node.id}">我已完成本节点</button>
      </div>
    </section>
  `;
}

function renderPostOp(patient) {
  const post = state.config.postOp;
  return `
    <section class="patient-stage">
      <div class="hero-band">
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(patient.name)}，请按以下要求观察和休息。</p>
        ${renderImage(post.image, '术后宣教图', 'post-op-img')}
      </div>
      <div class="detail-grid" style="margin-top: 14px;">
        ${renderPostItem('术后饮食要求', post.diet)}
        ${renderPostItem('活动禁忌', post.activity)}
        ${renderPostItem('异常情况处理', post.abnormal)}
        ${renderPostItem('取报告时间/地点', post.report)}
        ${renderPostItem('复诊提醒', post.revisit)}
        <button class="ghost-btn" data-action="new-patient">返回入口页</button>
      </div>
    </section>
  `;
}

function renderPostItem(title, text) {
  return `<div class="content-box"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`;
}

function renderAdmin() {
  if (!ui.adminLoggedIn) {
    return `
      <section class="patient-stage">
        <form id="admin-login-form" class="login-box form-grid">
          <div class="section-title">
            <h2>医护管理员登录</h2>
            <p>默认账号：admin，默认密码：123456。首次试用后请到账号设置中修改。</p>
          </div>
          <label>账号
            <input name="username" autocomplete="username" required>
          </label>
          <label>密码
            <input name="password" type="password" autocomplete="current-password" required>
          </label>
          <button class="primary-btn" type="submit">登录后台</button>
        </form>
      </section>
    `;
  }

  return `
    <section class="admin-stage admin-layout">
      <aside class="side-nav">
        ${adminNavButton('dashboard', '患者总览')}
        ${adminNavButton('content', '流程内容配置')}
        ${adminNavButton('stats', '基础数据统计')}
        ${adminNavButton('account', '账号设置')}
        <button data-action="logout-admin">退出后台</button>
      </aside>
      <div class="admin-main">
        ${ui.adminView === 'dashboard' ? renderAdminDashboard() : ''}
        ${ui.adminView === 'content' ? renderContentConfig() : ''}
        ${ui.adminView === 'stats' ? renderStats() : ''}
        ${ui.adminView === 'account' ? renderAccount() : ''}
      </div>
    </section>
  `;
}

function adminNavButton(view, label) {
  return `<button class="${ui.adminView === view ? 'active' : ''}" data-action="admin-view" data-view="${view}">${label}</button>`;
}

function renderAdminDashboard() {
  const patients = getFilteredPatients();
  const progressOptions = listProgressOptions(state).map((option) => `
    <option value="${option.id}" ${ui.filters.progressNodeId === option.id ? 'selected' : ''}>${escapeHtml(option.name)}</option>
  `).join('');

  return `
    <section class="admin-section">
      <div class="section-title">
        <h2>患者总览仪表盘</h2>
        <p>当前筛选结果 ${patients.length} 人。勾选患者后可批量发送；未勾选时默认发送给当前筛选结果。</p>
      </div>
      <form id="admin-filter-form" class="filters" style="margin-top: 12px;">
        <label>检查日期
          <input name="examDate" type="date" value="${escapeHtml(ui.filters.examDate)}">
        </label>
        <label>进度节点
          <select name="progressNodeId">${progressOptions}</select>
        </label>
        <label>姓名/电话搜索
          <input name="query" value="${escapeHtml(ui.filters.query)}" placeholder="输入姓名或电话">
        </label>
        <div class="button-row">
          <button class="primary-btn" type="submit">筛选</button>
          <button class="ghost-btn" type="button" data-action="clear-filters">清空</button>
        </div>
      </form>
      <div class="button-row" style="margin-top: 12px;">
        <button class="success-btn" data-action="batch-send">批量模拟微信提醒</button>
        <button class="ghost-btn" data-action="export-csv">导出Excel表格</button>
      </div>
    </section>

    <section class="admin-section">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>选择</th>
              <th>姓名</th>
              <th>检查日期</th>
              <th>联系电话</th>
              <th>当前进度节点</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${patients.length ? patients.map(renderPatientRow).join('') : '<tr><td colspan="6">暂无患者，请先从患者端录入。</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    ${ui.editPatientId ? renderPatientEditPanel(ui.editPatientId) : ''}
    ${renderAutoReminderQueue(patients)}
    ${renderReminderLogs()}
  `;
}

function renderPatientRow(patient) {
  return `
    <tr>
      <td><input class="patient-select" type="checkbox" value="${patient.id}" ${ui.selectedPatientIds.has(patient.id) ? 'checked' : ''}></td>
      <td>${escapeHtml(patient.name)}</td>
      <td>${escapeHtml(patient.examDate)} ${periodLabel(patient.examPeriod)}</td>
      <td>${escapeHtml(patient.phone)}</td>
      <td>${escapeHtml(getProgressLabel(state, patient))}</td>
      <td>
        <button class="inline-btn" data-action="admin-edit-patient" data-patient-id="${patient.id}">查看/调整</button>
        <button class="inline-btn" data-action="admin-send-one" data-patient-id="${patient.id}">发送提醒</button>
      </td>
    </tr>
  `;
}

function renderPatientEditPanel(patientId) {
  const patient = safeFindPatient(patientId);
  if (!patient) return '';
  const timeline = [...getPatientTimeline(state, patient.id, 'home'), ...getPatientTimeline(state, patient.id, 'hospital')];

  return `
    <section class="admin-section edit-panel">
      <div class="section-title">
        <h2>患者进度与消息管理：${escapeHtml(patient.name)}</h2>
        <p>可调整检查时间、阶段和节点完成情况；保存后患者端立即按新配置展示。</p>
      </div>
      <form id="patient-edit-form" class="form-grid">
        <input type="hidden" name="patientId" value="${patient.id}">
        <div class="three-col">
          <label>检查日期
            <input name="examDate" type="date" value="${escapeHtml(patient.examDate)}" required>
          </label>
          <label>检查时段
            <select name="examPeriod">
              <option value="morning" ${patient.examPeriod === 'morning' ? 'selected' : ''}>上午</option>
              <option value="afternoon" ${patient.examPeriod === 'afternoon' ? 'selected' : ''}>下午</option>
            </select>
          </label>
          <label>当前阶段
            <select name="currentPhase">
              <option value="home" ${patient.currentPhase === 'home' ? 'selected' : ''}>居家准备</option>
              <option value="hospital" ${patient.currentPhase === 'hospital' ? 'selected' : ''}>院内就诊</option>
              <option value="post-op" ${patient.currentPhase === 'post-op' ? 'selected' : ''}>术后注意事项</option>
            </select>
          </label>
        </div>
        <label>节点完成情况
          <div class="check-row">
            ${timeline.map((node) => `
              <label class="check-pill">
                <input type="checkbox" name="completedNodeIds" value="${node.id}" ${patient.completedNodeIds.includes(node.id) ? 'checked' : ''}>
                ${escapeHtml(node.name)}
              </label>
            `).join('')}
          </div>
        </label>
        <label>备注
          <textarea name="manualNotes">${escapeHtml(patient.manualNotes ?? '')}</textarea>
        </label>
        <div class="button-row">
          <button class="primary-btn" type="submit">保存调整</button>
          <button class="ghost-btn" type="button" data-action="close-edit">关闭</button>
        </div>
      </form>
    </section>
  `;
}

function renderReminderLogs() {
  const rows = state.reminderLogs.slice(0, 8).map((log) => `
    <tr>
      <td>${formatDateTime(log.sentAt)}</td>
      <td>${escapeHtml(log.patientName)}</td>
      <td>${escapeHtml(log.nodeName)}</td>
      <td>${escapeHtml(log.message)}</td>
      <td><button class="inline-btn" data-action="open-message-target" data-patient-id="${log.patientId}" data-node-id="${log.nodeId}">模拟跳转</button></td>
    </tr>
  `).join('');

  return `
    <section class="admin-section">
      <div class="section-title">
        <h2>消息发送记录</h2>
        <p>这里模拟微信订阅消息发送；正式上线需绑定微信小程序订阅消息接口。</p>
      </div>
      <div class="table-wrap" style="margin-top: 12px;">
        <table>
          <thead><tr><th>时间</th><th>患者</th><th>节点</th><th>文案</th><th>跳转</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">暂无发送记录。</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAutoReminderQueue(patients) {
  const rows = patients
    .flatMap((patient) => createReminderQueue(state, patient.id))
    .sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt))
    .slice(0, 12)
    .map((item) => `
      <tr>
        <td>${formatDateTime(item.sendAt)}</td>
        <td>${escapeHtml(item.patientName)}</td>
        <td>${escapeHtml(item.nodeName)}</td>
        <td>${escapeHtml(item.message)}</td>
        <td><button class="inline-btn" data-action="open-message-target" data-patient-id="${item.patientId}" data-node-id="${item.nodeId}">模拟点击</button></td>
      </tr>
    `).join('');

  return `
    <section class="admin-section">
      <div class="section-title">
        <h2>自动提醒计划</h2>
        <p>每个节点按“提前 ${state.config.reminder.leadMinutes} 分钟”生成计划；这里用于试点核对，正式上线由微信订阅消息服务发送。</p>
      </div>
      <div class="table-wrap" style="margin-top: 12px;">
        <table>
          <thead><tr><th>计划发送时间</th><th>患者</th><th>节点</th><th>文案</th><th>跳转</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">暂无提醒计划。</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderContentConfig() {
  const allNodes = [...state.config.homeNodes, ...state.config.hospitalNodes];
  return `
    <section class="admin-section">
      <div class="section-title">
        <h2>全流程内容配置</h2>
        <p>修改后保存即可立即生效；上传文件会存入本机浏览器数据，正式发布需替换为服务器素材地址。</p>
      </div>
      <form id="reminder-config-form" class="form-grid" style="margin-top: 12px;">
        <div class="three-col">
          <label>医院名称
            <input name="hospitalName" value="${escapeHtml(state.config.hospitalName)}">
          </label>
          <label>中心名称
            <input name="centerName" value="${escapeHtml(state.config.centerName)}">
          </label>
          <label>提前提醒分钟
            <input name="leadMinutes" type="number" min="5" step="5" value="${escapeHtml(state.config.reminder.leadMinutes)}">
          </label>
        </div>
        <label>提醒文案模板
          <textarea name="template">${escapeHtml(state.config.reminder.template)}</textarea>
          <span class="small-note">可用变量：{{hospitalName}}、{{centerName}}、{{nodeName}}</span>
        </label>
        <button class="primary-btn" type="submit">保存提醒规则</button>
      </form>
    </section>

    <section class="node-config-list">
      ${allNodes.map(renderNodeConfigCard).join('')}
    </section>

    <section class="admin-section">
      <div class="section-title"><h2>术后注意事项配置</h2><p>饮食、活动、异常处理、取报告和复诊提醒均可改。</p></div>
      <form id="post-op-config-form" class="form-grid" style="margin-top: 12px;">
        <label>标题<input name="title" value="${escapeHtml(state.config.postOp.title)}"></label>
        <label>术后饮食要求<textarea name="diet">${escapeHtml(state.config.postOp.diet)}</textarea></label>
        <label>活动禁忌<textarea name="activity">${escapeHtml(state.config.postOp.activity)}</textarea></label>
        <label>异常情况处理<textarea name="abnormal">${escapeHtml(state.config.postOp.abnormal)}</textarea></label>
        <label>取报告时间/地点<textarea name="report">${escapeHtml(state.config.postOp.report)}</textarea></label>
        <label>复诊提醒<textarea name="revisit">${escapeHtml(state.config.postOp.revisit)}</textarea></label>
        <label>图文图片地址<input name="image" value="${escapeHtml(state.config.postOp.image)}"></label>
        <label>上传替换图片<input type="file" accept="image/*" data-upload-key="postOp:image"></label>
        <button class="primary-btn" type="submit">保存术后内容</button>
      </form>
    </section>
  `;
}

function renderNodeConfigCard(node) {
  const isHomeNode = state.config.homeNodes.some((item) => item.id === node.id);
  const isHospitalNode = state.config.hospitalNodes.some((item) => item.id === node.id);
  const imageValue = node.education?.image ?? '';
  const videoValue = node.education?.video ?? '';
  const location = node.location ?? node;
  const uploadKey = `${node.id}:educationImage`;
  const photoUploadKey = `${node.id}:photo`;
  const videoUploadKey = `${node.id}:educationVideo`;

  return `
    <article class="config-card">
      <h3>${escapeHtml(isHomeNode ? '居家节点' : '院内节点')}：${escapeHtml(node.name)}</h3>
      <form class="node-config-form form-grid" data-node-id="${node.id}">
        <div class="three-col">
          <label>节点名称<input name="name" value="${escapeHtml(node.name)}"></label>
          ${isHomeNode ? `
            <label>上午时间<input name="timeMorning" type="time" value="${escapeHtml(node.timeByPeriod?.morning ?? '')}"></label>
            <label>下午时间<input name="timeAfternoon" type="time" value="${escapeHtml(node.timeByPeriod?.afternoon ?? '')}"></label>
          ` : `
            <label>到院后分钟偏移<input name="offsetMinutes" type="number" min="0" value="${escapeHtml(node.offsetMinutes ?? 0)}"></label>
            <label>下一步科室<input name="nextDepartment" value="${escapeHtml(node.nextDepartment ?? '')}"></label>
          `}
        </div>
        <label>核心操作提示<textarea name="summary">${escapeHtml(node.summary ?? '')}</textarea></label>
        <label>标准化操作步骤（每行一步）<textarea name="steps">${escapeHtml((node.steps ?? []).join('\n'))}</textarea></label>
        <label>禁忌与注意事项（每行一条）<textarea name="warnings">${escapeHtml((node.warnings ?? []).join('\n'))}</textarea></label>
        <div class="two-col">
          <label>宣教图片地址<input name="educationImage" value="${escapeHtml(imageValue)}"></label>
          <label>上传宣教图片<input type="file" accept="image/*" data-upload-key="${uploadKey}"></label>
        </div>
        <div class="two-col">
          <label>宣教短视频/说明<input name="educationVideo" value="${escapeHtml(videoValue)}"></label>
          <label>上传短视频<input type="file" accept="video/*" data-upload-key="${videoUploadKey}"></label>
        </div>
        ${isHospitalNode || node.location ? `
          <div class="two-col">
            <label>科室实景照片地址<input name="photo" value="${escapeHtml(location.photo ?? '')}"></label>
            <label>上传科室照片<input type="file" accept="image/*" data-upload-key="${photoUploadKey}"></label>
          </div>
          <label>文字路线指引<textarea name="route">${escapeHtml(location.route ?? '')}</textarea></label>
          <label>需携带材料（每行一项）<textarea name="materials">${escapeHtml((location.materials ?? []).join('\n'))}</textarea></label>
        ` : ''}
        <button class="primary-btn" type="submit">保存此节点</button>
      </form>
    </article>
  `;
}

function renderStats() {
  const stats = getStatistics(state);
  const dailyRows = Object.entries(stats.dailyCounts).sort().map(([date, count]) => `<tr><td>${date}</td><td>${count}</td></tr>`).join('');
  const monthlyRows = Object.entries(stats.monthlyCounts).sort().map(([month, count]) => `<tr><td>${month}</td><td>${count}</td></tr>`).join('');
  const nodeRows = Object.entries(stats.nodeCompletion).map(([, item]) => `
    <tr><td>${escapeHtml(item.name)}</td><td>${item.completed}</td><td>${item.rate}%</td></tr>
  `).join('');

  return `
    <section class="admin-section">
      <div class="section-title">
        <h2>基础数据统计</h2>
        <p>统计当前浏览器保存的数据；正式上线应由服务端数据库统一汇总。</p>
      </div>
      <div class="three-col" style="margin-top: 12px;">
        <div class="stat-card"><span>患者总数</span><strong>${stats.totalPatients}</strong></div>
        <div class="stat-card"><span>今日筛选人数</span><strong>${getFilteredPatients().length}</strong></div>
        <div class="stat-card"><span>提醒发送记录</span><strong>${state.reminderLogs.length}</strong></div>
      </div>
      <div class="button-row" style="margin-top: 12px;">
        <button class="ghost-btn" data-action="export-csv">导出Excel表格</button>
      </div>
    </section>
    <section class="admin-section">
      <h2>每日/每月检查人数</h2>
      <div class="two-col">
        <div class="table-wrap"><table><thead><tr><th>日期</th><th>人数</th></tr></thead><tbody>${dailyRows || '<tr><td colspan="2">暂无数据</td></tr>'}</tbody></table></div>
        <div class="table-wrap"><table><thead><tr><th>月份</th><th>人数</th></tr></thead><tbody>${monthlyRows || '<tr><td colspan="2">暂无数据</td></tr>'}</tbody></table></div>
      </div>
    </section>
    <section class="admin-section">
      <h2>各节点完成率</h2>
      <div class="table-wrap"><table><thead><tr><th>节点</th><th>完成人数</th><th>完成率</th></tr></thead><tbody>${nodeRows}</tbody></table></div>
    </section>
  `;
}

function renderAccount() {
  return `
    <section class="admin-section">
      <div class="section-title">
        <h2>管理员账号设置</h2>
        <p>第一版仅保留一个医护管理员账号，不做多级权限。</p>
      </div>
      <form id="admin-password-form" class="form-grid" style="margin-top: 12px;">
        <label>当前账号
          <input name="username" value="${escapeHtml(state.config.admin.username)}">
        </label>
        <label>原密码
          <input name="oldPassword" type="password" required>
        </label>
        <label>新密码
          <input name="newPassword" type="password" minlength="6" required>
        </label>
        <button class="primary-btn" type="submit">保存账号密码</button>
      </form>
      <p class="small-note" style="margin-top: 12px;">安全说明：本原型使用本机浏览器存储演示数据。正式医疗环境必须改为服务端加密存储、HTTPS、审计日志和最小权限访问控制。</p>
    </section>
  `;
}

function handlePatientCreate(form) {
  const data = new FormData(form);
  const histories = data.getAll('histories');
  const patient = createPatient(state, {
    examDate: data.get('examDate'),
    examPeriod: data.get('examPeriod'),
    painless: data.get('painless') === 'yes',
    name: data.get('name'),
    phone: data.get('phone'),
    histories,
  });
  persist();
  ui.activePatientId = patient.id;
  ui.patientView = 'timeline';
  renderApp();
  showToast('专属流程已生成。');
}

function handleAdminLogin(form) {
  const data = new FormData(form);
  if (data.get('username') !== state.config.admin.username || data.get('password') !== state.config.admin.password) {
    throw new Error('账号或密码不正确。默认账号 admin，默认密码 123456。');
  }
  ui.adminLoggedIn = true;
  ui.adminView = 'dashboard';
  renderApp();
}

function handlePasswordChange(form) {
  const data = new FormData(form);
  if (data.get('oldPassword') !== state.config.admin.password) {
    throw new Error('原密码不正确。');
  }
  state.config.admin.username = data.get('username').trim() || 'admin';
  state.config.admin.password = data.get('newPassword');
  persist();
  renderApp();
  showToast('账号密码已修改，请妥善保存。');
}

function handlePatientEdit(form) {
  const data = new FormData(form);
  const patientId = data.get('patientId');
  updatePatient(state, patientId, {
    examDate: data.get('examDate'),
    examPeriod: data.get('examPeriod'),
    currentPhase: data.get('currentPhase'),
    completedNodeIds: data.getAll('completedNodeIds'),
    manualNotes: data.get('manualNotes'),
  });
  persist();
  renderApp();
  showToast('患者进度已保存。');
}

function handleNodeConfig(form) {
  const nodeId = form.dataset.nodeId;
  const node = getConfigNode(nodeId);
  const isHomeNode = state.config.homeNodes.some((item) => item.id === nodeId);
  const patch = {
    name: form.elements.name.value.trim(),
    summary: form.elements.summary.value.trim(),
    steps: splitLines(form.elements.steps.value),
    warnings: splitLines(form.elements.warnings.value),
    education: {
      ...node.education,
      image: ui.pendingUploads[`${nodeId}:educationImage`] ?? form.elements.educationImage.value.trim(),
      video: ui.pendingUploads[`${nodeId}:educationVideo`] ?? form.elements.educationVideo.value.trim(),
    },
  };

  if (isHomeNode) {
    patch.timeByPeriod = { ...node.timeByPeriod };
    if (form.elements.timeMorning?.value) patch.timeByPeriod.morning = form.elements.timeMorning.value;
    if (form.elements.timeAfternoon?.value) patch.timeByPeriod.afternoon = form.elements.timeAfternoon.value;
  } else {
    patch.offsetMinutes = Number(form.elements.offsetMinutes.value || 0);
    patch.nextDepartment = form.elements.nextDepartment.value.trim();
  }

  if (form.elements.photo) {
    const photo = ui.pendingUploads[`${nodeId}:photo`] ?? form.elements.photo.value.trim();
    const route = form.elements.route.value.trim();
    const materials = splitLines(form.elements.materials.value);
    if (node.location) {
      patch.location = { ...node.location, photo, route, materials };
    } else {
      patch.photo = photo;
      patch.route = route;
      patch.materials = materials;
    }
  }

  updateConfigNode(state, nodeId, patch);
  delete ui.pendingUploads[`${nodeId}:educationImage`];
  delete ui.pendingUploads[`${nodeId}:educationVideo`];
  delete ui.pendingUploads[`${nodeId}:photo`];
  persist();
  renderApp();
  showToast(`节点“${patch.name}”已保存。`);
}

function getFilteredPatients() {
  return filterPatients(state, ui.filters);
}

function findTimelineNode(patientId, nodeId) {
  const nodes = [...getPatientTimeline(state, patientId, 'home'), ...getPatientTimeline(state, patientId, 'hospital')];
  return nodes.find((node) => node.id === nodeId);
}

function getConfigNode(nodeId) {
  const node = state.config.homeNodes.find((item) => item.id === nodeId)
    ?? state.config.hospitalNodes.find((item) => item.id === nodeId);
  if (!node) throw new Error(`找不到节点：${nodeId}`);
  return node;
}

function safeFindPatient(patientId) {
  try {
    return findPatient(state, patientId);
  } catch {
    return null;
  }
}

function persist() {
  adapter.save(state);
}

function renderImage(src, alt, className = '') {
  if (!src) {
    return '<div class="video-placeholder">图片占位，后台可上传替换</div>';
  }
  return `<img class="${className}" src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}">`;
}

function renderVideo(value) {
  if (!value) {
    return '<div class="video-placeholder">短视频占位，后台可上传替换</div>';
  }
  if (String(value).startsWith('data:video')) {
    return `<video controls style="width:100%;border-radius:8px;border:1px solid var(--line);" src="${escapeAttribute(value)}"></video>`;
  }
  return `<div class="video-placeholder">${escapeHtml(value)}</div>`;
}

function asList(items) {
  return (items ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function splitLines(text) {
  return String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function periodLabel(period) {
  return period === 'morning' ? '上午' : '下午';
}

function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function formatInputDate(value) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function formatDateForFile(value) {
  return formatInputDate(value).replaceAll('-', '');
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  existing?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#96;');
}

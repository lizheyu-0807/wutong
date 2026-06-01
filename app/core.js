const STORAGE_VERSION = 1;
const TZ_SUFFIX = '+08:00';
const STORAGE_SECRET = 'wutong-local-demo-secret';
const LEGACY_STORAGE_SECRET = 'endoscopy-mvp-local-demo-secret';

export const HISTORY_LABELS = {
  hypertension: '高血压',
  diabetes: '糖尿病',
  constipation: '便秘',
  anticoagulant: '长期服用抗凝药',
  other: '其他',
};

export function createDefaultConfig() {
  return {
    hospitalName: 'XX医院',
    centerName: '内镜中心',
    admin: {
      username: 'admin',
      password: '123456',
    },
    reminder: {
      leadMinutes: 60,
      template: '【{{hospitalName}}{{centerName}}提醒】您即将完成【{{nodeName}}】，请按要求操作，点击查看详细指引',
    },
    scheduleRules: {
      morning: {
        examStartTime: '08:00',
        arriveTime: '07:30',
        homeNodeIds: ['home-laxative-1', 'home-laxative-2-am', 'home-fasting-am', 'home-arrive'],
      },
      afternoon: {
        examStartTime: '13:00',
        arriveTime: '12:30',
        homeNodeIds: ['home-laxative-1', 'home-laxative-2-pm', 'home-fasting-pm', 'home-arrive'],
      },
    },
    homeNodes: [
      {
        id: 'home-laxative-1',
        name: '第一次服泻药',
        relativeDay: -1,
        timeByPeriod: { morning: '20:00', afternoon: '20:00' },
        summary: '按护士告知剂量服用第一轮肠道准备药物。',
        steps: ['准备好泻药、量杯和温水。', '按医嘱将药物兑水后分次饮用。', '服药后在家中活动，便于肠道排空。'],
        warnings: ['服药期间如出现持续剧烈腹痛、呕吐不止，请联系医护。', '长期服用抗凝药患者必须按医生提前交代执行。'],
        education: { image: 'assets/education-bowel-prep.svg', video: '短视频占位：清肠准备演示' },
      },
      {
        id: 'home-laxative-2-am',
        name: '第二次服泻药+祛泡剂',
        relativeDay: 0,
        timeByPeriod: { morning: '04:00' },
        summary: '完成第二轮清肠，并按要求服用祛泡剂。',
        steps: ['起床后先确认当天检查时间。', '按医嘱服用第二次泻药。', '按要求服用祛泡剂，之后等待排便变清。'],
        warnings: ['不要自行减少药量。', '如出现头晕、心慌、冷汗，请暂停并联系医护。'],
        education: { image: 'assets/education-defoamer.svg', video: '短视频占位：祛泡剂服用方法' },
      },
      {
        id: 'home-laxative-2-pm',
        name: '第二次服泻药+祛泡剂',
        relativeDay: 0,
        timeByPeriod: { afternoon: '08:00' },
        summary: '完成第二轮清肠，并按要求服用祛泡剂。',
        steps: ['早餐不要进食，按预约要求开始第二轮准备。', '按医嘱服用第二次泻药。', '按要求服用祛泡剂，准备到院。'],
        warnings: ['不要自行进食。', '糖尿病患者如有低血糖症状，请按医生预案处理并联系医护。'],
        education: { image: 'assets/education-defoamer.svg', video: '短视频占位：祛泡剂服用方法' },
      },
      {
        id: 'home-fasting-am',
        name: '严格禁食禁水',
        relativeDay: 0,
        timeByPeriod: { morning: '02:00' },
        summary: '检查前6小时开始严格禁食禁水。',
        steps: ['从本时间点开始不要吃任何食物。', '不要喝水、牛奶、饮料或含糖液体。', '如需服药，请按医生单独交代执行。'],
        warnings: ['违反禁食禁水可能导致检查延期或麻醉风险增加。', '请勿嚼口香糖或含服糖果。'],
        education: { image: 'assets/education-fasting.svg', video: '短视频占位：禁食禁水说明' },
      },
      {
        id: 'home-fasting-pm',
        name: '严格禁食禁水',
        relativeDay: 0,
        timeByPeriod: { afternoon: '07:00' },
        summary: '检查前6小时开始严格禁食禁水。',
        steps: ['从本时间点开始不要吃任何食物。', '不要喝水、牛奶、饮料或含糖液体。', '如需服药，请按医生单独交代执行。'],
        warnings: ['违反禁食禁水可能导致检查延期或麻醉风险增加。', '请勿嚼口香糖或含服糖果。'],
        education: { image: 'assets/education-fasting.svg', video: '短视频占位：禁食禁水说明' },
      },
      {
        id: 'home-arrive',
        name: '按时到院报到',
        relativeDay: 0,
        timeByPeriod: { morning: '07:30', afternoon: '12:30' },
        summary: '携带材料到内镜中心报到。',
        steps: ['带好身份证、预约凭证、既往检查资料。', '到门诊3楼内镜中心护士站报到。', '点击“我已到院报到”切换到院内流程。'],
        warnings: ['无痛检查建议由家属陪同，检查后当天不要驾车。'],
        education: { image: 'assets/department-reception.svg', video: '短视频占位：到院报到流程' },
        location: {
          department: '内镜中心护士站',
          photo: 'assets/department-reception.svg',
          route: '门诊3楼电梯出门右转，沿蓝色地贴前行约30米。',
          materials: ['身份证', '预约凭证', '既往检查资料'],
        },
      },
    ],
    hospitalNodes: [
      {
        id: 'hospital-checkin',
        name: '报到核对',
        offsetMinutes: 0,
        summary: '护士核对姓名、检查项目和麻醉信息。',
        nextDepartment: '内镜中心护士站',
        photo: 'assets/department-reception.svg',
        route: '门诊3楼电梯出门右转，沿蓝色地贴前行约30米。',
        materials: ['身份证', '预约凭证'],
        steps: ['出示姓名和联系电话。', '护士核对检查项目。', '领取后续指引。'],
        warnings: ['信息不一致时不要进入下一步，请马上告知护士。'],
        education: { image: 'assets/department-reception.svg', video: '短视频占位：报到核对' },
      },
      {
        id: 'hospital-iv',
        name: '穿刺室打留置针',
        offsetMinutes: 12,
        summary: '按叫号到穿刺室建立静脉通路。',
        nextDepartment: '穿刺室',
        photo: 'assets/department-iv.svg',
        route: '护士站左侧走廊前行，尽头第3间为穿刺室。',
        materials: ['腕带', '检查单'],
        steps: ['听到叫号后进入穿刺室。', '将手臂放在操作台上。', '穿刺完成后按压固定处，不要自行拔除。'],
        warnings: ['留置针处如明显疼痛或鼓包，请立即告知护士。'],
        education: { image: 'assets/department-iv.svg', video: '短视频占位：留置针注意事项' },
      },
      {
        id: 'hospital-waiting',
        name: '候诊区等候',
        offsetMinutes: 25,
        summary: '在候诊区等待叫号，保持禁食禁水。',
        nextDepartment: '候诊区',
        photo: 'assets/department-waiting.svg',
        route: '穿刺室出门右转，蓝色座椅区域即候诊区。',
        materials: ['随身物品袋'],
        steps: ['坐在候诊区等待叫号。', '保持手机畅通。', '如需上厕所，请先告知护士。'],
        warnings: ['候诊期间仍需严格禁食禁水。'],
        education: { image: 'assets/department-waiting.svg', video: '短视频占位：候诊区说明' },
      },
      {
        id: 'hospital-room',
        name: '进入检查室',
        offsetMinutes: 45,
        summary: '按医护指引进入检查室完成检查。',
        nextDepartment: '检查室',
        photo: 'assets/department-room.svg',
        route: '候诊区前方电子屏旁通道进入，按叫号进入对应检查室。',
        materials: ['腕带'],
        steps: ['听到叫号后进入检查室。', '按医生要求侧卧。', '无痛检查按麻醉医生提示配合。'],
        warnings: ['进入检查室后不要自行移动设备或拔除管路。'],
        education: { image: 'assets/department-room.svg', video: '短视频占位：检查室配合' },
      },
      {
        id: 'hospital-recovery',
        name: '术后复苏',
        offsetMinutes: 75,
        summary: '在复苏区观察，清醒后由护士评估离开。',
        nextDepartment: '复苏区',
        photo: 'assets/department-recovery.svg',
        route: '检查结束后由医护推送至复苏区，无需自行寻找。',
        materials: ['随身物品由陪同人员保管'],
        steps: ['按护士要求在床位休息。', '不要自行下床。', '清醒后确认无明显不适再离开。'],
        warnings: ['如头晕、胸闷、腹痛明显，请立即告知护士。'],
        education: { image: 'assets/department-recovery.svg', video: '短视频占位：复苏区注意事项' },
      },
      {
        id: 'hospital-leave',
        name: '离院',
        offsetMinutes: 100,
        summary: '领取离院说明并查看术后注意事项。',
        nextDepartment: '出口/取报告处',
        photo: 'assets/department-exit.svg',
        route: '复苏区出口右转，沿绿色出口标识离开；取报告处在护士站对面。',
        materials: ['离院说明单'],
        steps: ['确认护士允许离院。', '查看术后注意事项。', '按说明时间领取报告。'],
        warnings: ['无痛检查当天不要驾车、骑车或高空作业。'],
        education: { image: 'assets/department-exit.svg', video: '短视频占位：离院说明' },
      },
    ],
    postOp: {
      title: '术后注意事项',
      diet: '检查后2小时内先少量温水，若无呛咳、腹痛，再按医嘱逐步进食清淡软食。',
      activity: '无痛检查当天不要驾车、骑车、高空作业或签署重要文件。',
      abnormal: '若出现持续剧烈腹痛、呕血、黑便、发热或头晕明显，请立即联系医院或就近急诊。',
      report: '报告领取：检查后按护士告知时间，到内镜中心护士站对面取报告处领取。',
      revisit: '如医生建议复诊，请携带报告和病理结果按预约时间就诊。',
      image: 'assets/post-op.svg',
    },
  };
}

export function seedDemoState(options = {}) {
  return {
    version: STORAGE_VERSION,
    now: options.now ?? new Date().toISOString(),
    config: createDefaultConfig(),
    patients: [],
    reminderLogs: [],
    auditLogs: [],
  };
}

export function createPatient(state, input) {
  const patient = {
    id: input.id ?? `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: input.createdAt ?? state.now ?? new Date().toISOString(),
    examDate: requireValue(input.examDate, '检查日期不能为空'),
    examPeriod: requireValue(input.examPeriod, '检查时段不能为空'),
    painless: Boolean(input.painless),
    name: requireValue(input.name, '患者姓名不能为空').trim(),
    phone: requireValue(input.phone, '联系电话不能为空').trim(),
    histories: Array.isArray(input.histories) ? input.histories : [],
    currentPhase: 'home',
    completedNodeIds: [],
    manualNotes: '',
  };

  state.patients.unshift(patient);
  state.auditLogs.unshift({
    at: new Date().toISOString(),
    action: 'create-patient',
    patientId: patient.id,
    text: `创建患者 ${patient.name}`,
  });
  return patient;
}

export function updatePatient(state, patientId, patch) {
  const patient = findPatient(state, patientId);
  Object.assign(patient, patch);
  state.auditLogs.unshift({
    at: new Date().toISOString(),
    action: 'update-patient',
    patientId,
    text: `更新患者 ${patient.name}`,
  });
  return patient;
}

export function markNodeComplete(state, patientId, nodeId) {
  const patient = findPatient(state, patientId);
  if (!patient.completedNodeIds.includes(nodeId)) {
    patient.completedNodeIds.push(nodeId);
  }
  if (nodeId === 'home-arrive') {
    patient.currentPhase = 'hospital';
  }
  if (nodeId === 'hospital-leave') {
    patient.currentPhase = 'post-op';
  }
  return patient;
}

export function switchPatientToHospital(state, patientId) {
  const patient = markNodeComplete(state, patientId, 'home-arrive');
  patient.currentPhase = 'hospital';
  return patient;
}

export function completeExam(state, patientId) {
  const patient = findPatient(state, patientId);
  patient.currentPhase = 'post-op';
  for (const node of state.config.hospitalNodes) {
    if (!patient.completedNodeIds.includes(node.id)) {
      patient.completedNodeIds.push(node.id);
    }
  }
  return patient;
}

export function findPatient(state, patientId) {
  const patient = state.patients.find((item) => item.id === patientId);
  if (!patient) {
    throw new Error(`找不到患者：${patientId}`);
  }
  return patient;
}

export function getPatientTimeline(state, patientId, phase = undefined) {
  const patient = findPatient(state, patientId);
  const activePhase = phase ?? patient.currentPhase;

  if (activePhase === 'hospital') {
    const arrivalTime = combineDateTime(patient.examDate, state.config.scheduleRules[patient.examPeriod].arriveTime);
    return state.config.hospitalNodes.map((node) => decorateNode(patient, {
      ...node,
      phase: 'hospital',
      scheduledAt: addMinutes(arrivalTime, node.offsetMinutes),
    }));
  }

  const periodRule = state.config.scheduleRules[patient.examPeriod];
  return periodRule.homeNodeIds
    .map((nodeId) => state.config.homeNodes.find((node) => node.id === nodeId))
    .filter(Boolean)
    .map((node) => {
      const date = addDays(patient.examDate, node.relativeDay);
      const time = node.timeByPeriod[patient.examPeriod];
      return decorateNode(patient, {
        ...node,
        phase: 'home',
        scheduledAt: combineDateTime(date, time),
      });
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
}

export function getNextActionNode(state, patientId) {
  const patient = findPatient(state, patientId);
  if (patient.currentPhase === 'post-op') {
    return null;
  }
  return getPatientTimeline(state, patientId, patient.currentPhase).find((node) => !node.completed) ?? null;
}

export function createReminderQueue(state, patientId) {
  const patient = findPatient(state, patientId);
  const nodes = [
    ...getPatientTimeline(state, patientId, 'home'),
    ...getPatientTimeline(state, patientId, 'hospital'),
  ];

  return nodes.map((node) => ({
    id: `r-${patient.id}-${node.id}`,
    patientId: patient.id,
    patientName: patient.name,
    phone: patient.phone,
    nodeId: node.id,
    nodeName: node.name,
    sendAt: addMinutes(node.scheduledAt, -Number(state.config.reminder.leadMinutes || 60)),
    target: `#/patient/${patient.id}/node/${node.id}`,
    status: '待发送',
    message: renderReminderTemplate(state.config, node.name),
  }));
}

export function sendManualReminder(state, patientIds, nodeId = undefined) {
  const ids = Array.isArray(patientIds) ? patientIds : [patientIds];
  const sentAt = new Date().toISOString();
  const logs = ids.map((patientId) => {
    const patient = findPatient(state, patientId);
    const node = nodeId ? findNodeById(state, patient, nodeId) : getNextActionNode(state, patientId);
    const log = {
      id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      sentAt,
      patientId,
      patientName: patient.name,
      nodeId: node?.id ?? 'post-op',
      nodeName: node?.name ?? '术后注意事项',
      message: renderReminderTemplate(state.config, node?.name ?? '术后注意事项'),
      mode: '手动模拟发送',
    };
    state.reminderLogs.unshift(log);
    return log;
  });
  return logs;
}

export function filterPatients(state, filters = {}) {
  return state.patients.filter((patient) => {
    if (filters.examDate && patient.examDate !== filters.examDate) return false;
    if (filters.progressNodeId && filters.progressNodeId !== getProgressNodeId(state, patient)) return false;
    if (filters.query) {
      const q = String(filters.query).trim().toLowerCase();
      const haystack = `${patient.name} ${patient.phone}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function getProgressNodeId(state, patient) {
  const next = getNextActionNode(state, patient.id);
  if (next) return next.id;
  if (patient.currentPhase === 'post-op') return 'post-op';
  return patient.completedNodeIds.at(-1) ?? 'not-started';
}

export function getProgressLabel(state, patient) {
  if (patient.currentPhase === 'post-op') return '术后注意事项';
  const next = getNextActionNode(state, patient.id);
  return next ? `待完成：${next.name}` : '已完成当前阶段';
}

export function getStatistics(state) {
  const stats = {
    totalPatients: state.patients.length,
    dailyCounts: {},
    monthlyCounts: {},
    nodeCompletion: {},
  };

  const allNodes = [...state.config.homeNodes, ...state.config.hospitalNodes];
  for (const node of allNodes) {
    stats.nodeCompletion[node.id] = { name: node.name, completed: 0, rate: 0 };
  }

  for (const patient of state.patients) {
    stats.dailyCounts[patient.examDate] = (stats.dailyCounts[patient.examDate] ?? 0) + 1;
    const month = patient.examDate.slice(0, 7);
    stats.monthlyCounts[month] = (stats.monthlyCounts[month] ?? 0) + 1;
    for (const nodeId of patient.completedNodeIds) {
      if (stats.nodeCompletion[nodeId]) {
        stats.nodeCompletion[nodeId].completed += 1;
      }
    }
  }

  for (const item of Object.values(stats.nodeCompletion)) {
    item.rate = stats.totalPatients === 0 ? 0 : Math.round((item.completed / stats.totalPatients) * 100);
  }

  return stats;
}

export function exportPatientsCsv(state, patients = state.patients) {
  const rows = [
    ['姓名', '检查日期', '检查时段', '联系电话', '是否无痛', '基础病史', '当前进度节点'],
    ...patients.map((patient) => [
      patient.name,
      patient.examDate,
      patient.examPeriod === 'morning' ? '上午' : '下午',
      patient.phone,
      patient.painless ? '是' : '否',
      patient.histories.map((key) => HISTORY_LABELS[key] ?? key).join('/'),
      getProgressLabel(state, patient),
    ]),
  ];
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function createStorageAdapter(storage, key = 'wutong-state') {
  return {
    load() {
      const raw = storage.getItem(key) ?? storage.getItem('endoscopy-mvp-state');
      if (!raw) return null;
      try {
        return JSON.parse(decodePayload(raw));
      } catch {
        return loadLegacyPayload(raw);
      }
    },
    save(state) {
      storage.setItem(key, encodePayload(JSON.stringify(state)));
    },
    clear() {
      storage.removeItem?.(key);
    },
  };
}

export function updateConfigNode(state, nodeId, patch) {
  const node = state.config.homeNodes.find((item) => item.id === nodeId)
    ?? state.config.hospitalNodes.find((item) => item.id === nodeId);
  if (!node) throw new Error(`找不到节点：${nodeId}`);
  Object.assign(node, patch);
  return node;
}

export function listProgressOptions(state) {
  return [
    { id: '', name: '全部进度' },
    ...state.config.homeNodes.map((node) => ({ id: node.id, name: node.name })),
    ...state.config.hospitalNodes.map((node) => ({ id: node.id, name: node.name })),
    { id: 'post-op', name: '术后注意事项' },
  ];
}

function findNodeById(state, patient, nodeId) {
  return [...getPatientTimeline(state, patient.id, 'home'), ...getPatientTimeline(state, patient.id, 'hospital')]
    .find((node) => node.id === nodeId);
}

function decorateNode(patient, node) {
  return {
    ...node,
    completed: patient.completedNodeIds.includes(node.id),
  };
}

function renderReminderTemplate(config, nodeName) {
  return config.reminder.template
    .replaceAll('{{hospitalName}}', config.hospitalName)
    .replaceAll('{{centerName}}', config.centerName)
    .replaceAll('{{nodeName}}', nodeName);
}

function requireValue(value, message) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(message);
  }
  return value;
}

function combineDateTime(date, time) {
  return `${date}T${time}:00${TZ_SUFFIX}`;
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00${TZ_SUFFIX}`);
  value.setDate(value.getDate() + days);
  return formatDate(value);
}

function addMinutes(dateTime, minutes) {
  const value = new Date(dateTime);
  value.setMinutes(value.getMinutes() + minutes);
  return formatDateTime(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function formatDateTime(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(value).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${TZ_SUFFIX}`;
}

function encodePayload(text) {
  const source = new TextEncoder().encode(text);
  const key = new TextEncoder().encode(STORAGE_SECRET);
  const encrypted = Uint8Array.from(source, (byte, index) => byte ^ key[index % key.length]);
  return bytesToBase64(encrypted);
}

function decodePayload(text) {
  return decodeWithSecret(text, STORAGE_SECRET);
}

function decodeLegacyPayload(text) {
  const bytes = base64ToBytes(text);
  return new TextDecoder().decode(bytes);
}

function loadLegacyPayload(raw) {
  const decoders = [
    () => decodeWithSecret(raw, LEGACY_STORAGE_SECRET),
    () => decodeLegacyPayload(raw),
  ];
  for (const decode of decoders) {
    try {
      return JSON.parse(decode());
    } catch {
      // Try the next legacy format.
    }
  }
  return null;
}

function decodeWithSecret(text, secret) {
  const source = base64ToBytes(text);
  const key = new TextEncoder().encode(secret);
  const decrypted = Uint8Array.from(source, (byte, index) => byte ^ key[index % key.length]);
  return new TextDecoder().decode(decrypted);
}

function bytesToBase64(bytes) {
  if (typeof btoa === 'function') {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(text) {
  if (typeof atob === 'function') {
    const binary = atob(text);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }
  return Uint8Array.from(Buffer.from(text, 'base64'));
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

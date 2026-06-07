export type Gender = 'male' | 'female' | '';
export type AsaClass = 'ASA Ⅰ' | 'ASA Ⅱ' | 'ASA Ⅲ' | 'ASA Ⅳ';

export type CardiovascularData = {
  hypertension: boolean;
  heartDisease: boolean;
  coronaryHeartDisease: boolean;
  myocardialInfarction: boolean;
  heartFailure: boolean;
  stent: boolean;
  pacemaker: boolean;
};

export type EndocrineData = {
  diabetes: boolean;
};

export type NervousData = {
  stroke: boolean;
  cerebralHemorrhage: boolean;
  brainSurgery: boolean;
  epilepsy: boolean;
  parkinson: boolean;
  alzheimer: boolean;
};

export type RespiratoryData = {
  asthma: boolean;
  copd: boolean;
  emphysema: boolean;
  bronchitis: boolean;
};

export type DigestiveData = {
  gerd: boolean;
  cirrhosis: boolean;
  hepatitis: boolean;
  gastricUlcer: boolean;
  gallbladderDisease: boolean;
};

export type UrinaryData = {
  nephritis: boolean;
  kidneyFailure: boolean;
  kidneyStones: boolean;
};

export type InfectiousData = {
  hiv: boolean;
  syphilis: boolean;
  tuberculosis: boolean;
  hepatitisB: boolean;
};

export type DiabetesMedData = {
  insulin: boolean;
  metformin: boolean;
  glipizide: boolean;
  gliclazide: boolean;
  semaglutide: boolean;
  liraglutide: boolean;
  tirzepatide: boolean;
  tirzepatideAlt: boolean;
  other: boolean;
  otherDescription: string;
};

export type AssessmentInput = {
  id?: string;
  created_at?: string;
  assessment_date: string;
  is_pre_assessment?: boolean;
  asa_class?: AsaClass;
  name: string;
  age: string;
  gender: Gender;
  height: string;
  weight: string;
  bmi: string;
  chest_pain: boolean;
  breathing_difficulty: boolean;
  fever: boolean;
  nausea: boolean;
  menstruation: boolean;
  snoring_night: boolean;
  snoring_severity: '' | 'mild' | 'severe_apnea' | 'severe_wakeup';
  current_condition_normal: boolean;
  cardiovascular_data: CardiovascularData;
  endocrine_data: EndocrineData;
  nervous_data: NervousData;
  respiratory_data: RespiratoryData;
  digestive_data: DigestiveData;
  urinary_data: UrinaryData;
  infectious_data: InfectiousData;
  medical_history_normal: boolean;
  smoking: 'never' | 'occasionally' | 'daily' | '';
  smoking_amount: string;
  drinking: 'never' | 'occasionally' | 'frequently' | '';
  cold: boolean;
  teeth_issue: boolean;
  teeth_description: string;
  lifestyle_normal: boolean;
  previous_surgery: boolean;
  surgery_name: string;
  anesthesia_reaction: boolean;
  reaction_description: string;
  allergy: boolean;
  allergy_description: string;
  surgery_allergy_normal: boolean;
  blood_pressure_med: boolean;
  diabetes_med_data: DiabetesMedData;
  anticoagulant: boolean;
  pain_med: boolean;
  chinese_med: boolean;
  other_med: boolean;
  other_med_description: string;
  medication_normal: boolean;
  fasting_hours: string;
  drinking_hours: string;
  drink_type: 'water' | 'milk' | 'beverage' | '';
};

export type AssessmentRecord = AssessmentInput & {
  id: string;
  created_at: string;
  is_pre_assessment: boolean;
  asa_class: AsaClass;
};

export type RiskSummary = {
  critical: string[];
  important: string[];
  notes: string[];
};

export type RequiredSection = {
  id: string;
  title: string;
  message: string;
};

export const cardiovascularLabels: Record<keyof CardiovascularData, string> = {
  hypertension: '高血压',
  heartDisease: '心脏病',
  coronaryHeartDisease: '冠心病',
  myocardialInfarction: '心梗',
  heartFailure: '心衰',
  stent: '冠脉支架',
  pacemaker: '起搏器植入',
};

export const endocrineLabels: Record<keyof EndocrineData, string> = {
  diabetes: '糖尿病',
};

export const nervousLabels: Record<keyof NervousData, string> = {
  stroke: '脑梗',
  cerebralHemorrhage: '脑出血',
  brainSurgery: '脑部手术',
  epilepsy: '癫痫',
  parkinson: '帕金森病',
  alzheimer: '阿尔茨海默病',
};

export const respiratoryLabels: Record<keyof RespiratoryData, string> = {
  asthma: '哮喘',
  copd: '慢阻肺',
  emphysema: '肺气肿',
  bronchitis: '支气管炎',
};

export const digestiveLabels: Record<keyof DigestiveData, string> = {
  gerd: '胃食管反流',
  cirrhosis: '肝硬化',
  hepatitis: '肝炎',
  gastricUlcer: '胃溃疡',
  gallbladderDisease: '胆囊疾病',
};

export const urinaryLabels: Record<keyof UrinaryData, string> = {
  nephritis: '肾炎',
  kidneyFailure: '肾功能不全/肾衰',
  kidneyStones: '肾结石',
};

export const infectiousLabels: Record<keyof InfectiousData, string> = {
  hiv: '艾滋病',
  syphilis: '梅毒',
  tuberculosis: '结核病',
  hepatitisB: '乙肝',
};

export const diabetesMedLabels: Record<keyof Omit<DiabetesMedData, 'otherDescription'>, string> = {
  insulin: '胰岛素',
  metformin: '二甲双胍',
  glipizide: '格列吡嗪',
  gliclazide: '格列齐特',
  semaglutide: '司美格鲁肽',
  liraglutide: '利拉鲁肽',
  tirzepatide: '替尔泊肽',
  tirzepatideAlt: '替西帕肽',
  other: '其他',
};

export const emptyCardiovascularData: CardiovascularData = {
  hypertension: false,
  heartDisease: false,
  coronaryHeartDisease: false,
  myocardialInfarction: false,
  heartFailure: false,
  stent: false,
  pacemaker: false,
};

export const emptyEndocrineData: EndocrineData = {
  diabetes: false,
};

export const emptyNervousData: NervousData = {
  stroke: false,
  cerebralHemorrhage: false,
  brainSurgery: false,
  epilepsy: false,
  parkinson: false,
  alzheimer: false,
};

export const emptyRespiratoryData: RespiratoryData = {
  asthma: false,
  copd: false,
  emphysema: false,
  bronchitis: false,
};

export const emptyDigestiveData: DigestiveData = {
  gerd: false,
  cirrhosis: false,
  hepatitis: false,
  gastricUlcer: false,
  gallbladderDisease: false,
};

export const emptyUrinaryData: UrinaryData = {
  nephritis: false,
  kidneyFailure: false,
  kidneyStones: false,
};

export const emptyInfectiousData: InfectiousData = {
  hiv: false,
  syphilis: false,
  tuberculosis: false,
  hepatitisB: false,
};

export const emptyDiabetesMedData: DiabetesMedData = {
  insulin: false,
  metformin: false,
  glipizide: false,
  gliclazide: false,
  semaglutide: false,
  liraglutide: false,
  tirzepatide: false,
  tirzepatideAlt: false,
  other: false,
  otherDescription: '',
};

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalDateTimeString(date = new Date()): string {
  const yyyyMMdd = getLocalDateString(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${yyyyMMdd} ${hours}:${minutes}:${seconds}`;
}

export function formatChineseDateTime(value?: string): string {
  if (!value) return '';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
}

export function calculateBmi(height: string | number, weight: string | number): string {
  const heightNumber = Number(height);
  const weightNumber = Number(weight);

  if (!heightNumber || !weightNumber || heightNumber <= 0 || weightNumber <= 0) {
    return '';
  }

  const meters = heightNumber / 100;
  const rounded = Math.round(((weightNumber / (meters * meters)) + 1e-8) * 10) / 10;
  return rounded.toFixed(1);
}

export function isPreAssessment(assessmentDate: string, today = new Date()): boolean {
  if (!assessmentDate) return false;
  return assessmentDate !== getLocalDateString(today);
}

export function recordMatchesAssessmentDate(
  record: Pick<AssessmentInput, 'assessment_date' | 'created_at'>,
  date: string,
): boolean {
  if (!date) return true;
  if (record.assessment_date) {
    return record.assessment_date === date;
  }
  return Boolean(record.created_at?.startsWith(date));
}

export function getMissingRequiredSections(assessment: AssessmentInput, today = new Date()): RequiredSection[] {
  const missing: RequiredSection[] = [];

  if (!isCurrentConditionCompleted(assessment)) {
    missing.push({
      id: 'section-current-condition',
      title: '当前身体状况',
      message: '请选择当前身体状况；如果没有异常，请勾选“以上情况都没有”。',
    });
  }

  if (!isMedicalHistoryCompleted(assessment)) {
    missing.push({
      id: 'section-medical-history',
      title: '既往病史',
      message: '请确认既往病史；如果没有相关病史，请勾选“以上情况都没有”。',
    });
  }

  if (!isLifestyleCompleted(assessment)) {
    missing.push({
      id: 'section-lifestyle',
      title: '生活习惯',
      message: '请确认生活习惯；如果没有吸烟、饮酒、感冒、牙齿等问题，请勾选“以上情况都没有”。',
    });
  }

  if (!isSurgeryAllergyCompleted(assessment)) {
    missing.push({
      id: 'section-surgery-allergy',
      title: '手术及过敏史',
      message: '请确认手术及过敏史；如果没有相关情况，请勾选“以上情况都没有”。',
    });
  }

  if (!isMedicationCompleted(assessment)) {
    missing.push({
      id: 'section-medication',
      title: '用药情况',
      message: '请确认用药情况；如果没有服用相关药物，请勾选“以上情况都没有”。',
    });
  }

  if (
    !isPreAssessment(assessment.assessment_date, today) &&
    (!assessment.fasting_hours || !assessment.drinking_hours || !assessment.drink_type)
  ) {
    missing.push({
      id: 'section-fasting',
      title: '禁食禁饮情况',
      message: '请填写禁食小时、禁饮小时，并选择最后一次喝的类型。',
    });
  }

  return missing;
}

export function buildEmptyAssessment(overrides: Partial<AssessmentInput> = {}): AssessmentInput {
  const {
    cardiovascular_data,
    endocrine_data,
    nervous_data,
    respiratory_data,
    digestive_data,
    urinary_data,
    infectious_data,
    diabetes_med_data,
    ...flatOverrides
  } = overrides;

  const assessment = {
    assessment_date: getLocalDateString(),
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bmi: '',
    chest_pain: false,
    breathing_difficulty: false,
    fever: false,
    nausea: false,
    menstruation: false,
    snoring_night: false,
    snoring_severity: '',
    current_condition_normal: false,
    cardiovascular_data: { ...emptyCardiovascularData },
    endocrine_data: { ...emptyEndocrineData },
    nervous_data: { ...emptyNervousData },
    respiratory_data: { ...emptyRespiratoryData },
    digestive_data: { ...emptyDigestiveData },
    urinary_data: { ...emptyUrinaryData },
    infectious_data: { ...emptyInfectiousData },
    medical_history_normal: false,
    smoking: '',
    smoking_amount: '',
    drinking: '',
    cold: false,
    teeth_issue: false,
    teeth_description: '',
    lifestyle_normal: false,
    previous_surgery: false,
    surgery_name: '',
    anesthesia_reaction: false,
    reaction_description: '',
    allergy: false,
    allergy_description: '',
    surgery_allergy_normal: false,
    blood_pressure_med: false,
    diabetes_med_data: { ...emptyDiabetesMedData },
    anticoagulant: false,
    pain_med: false,
    chinese_med: false,
    other_med: false,
    other_med_description: '',
    medication_normal: false,
    fasting_hours: '',
    drinking_hours: '',
    drink_type: '',
    ...flatOverrides,
  } as AssessmentInput;

  assessment.cardiovascular_data = {
    ...emptyCardiovascularData,
    ...cardiovascular_data,
  };
  assessment.endocrine_data = {
    ...emptyEndocrineData,
    ...endocrine_data,
  };
  assessment.nervous_data = {
    ...emptyNervousData,
    ...nervous_data,
  };
  assessment.respiratory_data = {
    ...emptyRespiratoryData,
    ...respiratory_data,
  };
  assessment.digestive_data = {
    ...emptyDigestiveData,
    ...digestive_data,
  };
  assessment.urinary_data = {
    ...emptyUrinaryData,
    ...urinary_data,
  };
  assessment.infectious_data = {
    ...emptyInfectiousData,
    ...infectious_data,
  };
  assessment.diabetes_med_data = {
    ...emptyDiabetesMedData,
    ...diabetes_med_data,
  };

  return assessment;
}

function getBmiNumber(assessment: AssessmentInput): number {
  const bmi = Number(assessment.bmi || calculateBmi(assessment.height, assessment.weight));
  return Number.isFinite(bmi) ? bmi : 0;
}

function hasAnyTrue<T extends Record<string, unknown>>(value: T, keys: Array<keyof T>): boolean {
  return keys.some((key) => Boolean(value[key]));
}

export function calculateAsaClass(assessment: AssessmentInput): AsaClass {
  const bmi = getBmiNumber(assessment);

  const asaFour =
    assessment.cardiovascular_data.heartFailure ||
    assessment.cardiovascular_data.myocardialInfarction ||
    assessment.nervous_data.stroke ||
    assessment.nervous_data.cerebralHemorrhage ||
    assessment.breathing_difficulty ||
    assessment.urinary_data.kidneyFailure ||
    assessment.infectious_data.hiv;

  if (asaFour) return 'ASA Ⅳ';

  const asaThree =
    hasAnyTrue(assessment.cardiovascular_data, [
      'hypertension',
      'heartDisease',
      'coronaryHeartDisease',
      'stent',
      'pacemaker',
    ]) ||
    assessment.endocrine_data.diabetes ||
    hasAnyTrue(assessment.respiratory_data, ['copd', 'emphysema', 'asthma']) ||
    assessment.digestive_data.cirrhosis ||
    hasAnyTrue(assessment.urinary_data, ['nephritis', 'kidneyStones']) ||
    hasAnyTrue(assessment.nervous_data, ['epilepsy', 'parkinson', 'alzheimer', 'brainSurgery']) ||
    hasAnyTrue(assessment.infectious_data, ['tuberculosis', 'hepatitisB']) ||
    assessment.anticoagulant ||
    bmi >= 40 ||
    assessment.previous_surgery;

  if (asaThree) return 'ASA Ⅲ';

  const asaTwo =
    hasSmokingRisk(assessment) ||
    hasDrinkingRisk(assessment) ||
    (bmi > 0 && bmi < 18.5) ||
    (bmi >= 30 && bmi < 40) ||
    assessment.respiratory_data.bronchitis ||
    hasAnyTrue(assessment.digestive_data, ['gerd', 'gastricUlcer', 'gallbladderDisease', 'hepatitis']) ||
    assessment.allergy ||
    assessment.blood_pressure_med ||
    assessment.pain_med ||
    assessment.chinese_med ||
    assessment.other_med ||
    assessment.cold ||
    assessment.teeth_issue ||
    assessment.menstruation ||
    assessment.snoring_night ||
    hasSelectedDiabetesMedication(assessment.diabetes_med_data);

  if (asaTwo) return 'ASA Ⅱ';

  return 'ASA Ⅰ';
}

export function hasSelectedDiabetesMedication(data: DiabetesMedData): boolean {
  return Object.entries(data).some(([key, value]) => key !== 'otherDescription' && value === true);
}

export function getSelectedBooleanCount(data: Record<string, boolean>): number {
  return Object.values(data).filter(Boolean).length;
}

export function hasSelectedMedicalHistory(assessment: AssessmentInput): boolean {
  return (
    getSelectedBooleanCount(assessment.cardiovascular_data) > 0 ||
    getSelectedBooleanCount(assessment.endocrine_data) > 0 ||
    getSelectedBooleanCount(assessment.nervous_data) > 0 ||
    getSelectedBooleanCount(assessment.respiratory_data) > 0 ||
    getSelectedBooleanCount(assessment.digestive_data) > 0 ||
    getSelectedBooleanCount(assessment.urinary_data) > 0 ||
    getSelectedBooleanCount(assessment.infectious_data) > 0
  );
}

export function normalizeAssessmentForStorage(
  assessment: AssessmentInput,
  now = new Date(),
): AssessmentRecord {
  const bmi = calculateBmi(assessment.height, assessment.weight) || assessment.bmi;
  const normalized = buildEmptyAssessment({
    ...assessment,
    bmi,
    snoring_night: Boolean(assessment.snoring_severity) || assessment.snoring_night,
  });

  return {
    ...normalized,
    id: assessment.id || `assess_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: assessment.created_at || getLocalDateTimeString(now),
    assessment_date: assessment.assessment_date || getLocalDateString(now),
    bmi,
    is_pre_assessment: isPreAssessment(assessment.assessment_date || getLocalDateString(now), now),
    asa_class: calculateAsaClass({ ...normalized, bmi }),
  };
}

export function getRiskSummary(assessment: AssessmentInput): RiskSummary {
  const bmi = getBmiNumber(assessment);
  const summary: RiskSummary = {
    critical: [],
    important: [],
    notes: [],
  };

  addIf(summary.critical, assessment.chest_pain, '胸闷、胸痛');
  addIf(summary.critical, assessment.breathing_difficulty, '呼吸困难');
  addIf(summary.critical, assessment.anesthesia_reaction, '麻醉不良反应史');
  addIf(summary.critical, assessment.allergy, '药物过敏史');

  addLabels(summary.important, assessment.cardiovascular_data, cardiovascularLabels, [
    'hypertension',
    'heartDisease',
    'coronaryHeartDisease',
    'myocardialInfarction',
    'heartFailure',
    'stent',
    'pacemaker',
  ]);
  addLabels(summary.important, assessment.endocrine_data, endocrineLabels, ['diabetes']);
  addLabels(summary.important, assessment.nervous_data, nervousLabels, [
    'stroke',
    'cerebralHemorrhage',
    'brainSurgery',
    'epilepsy',
    'parkinson',
    'alzheimer',
  ]);
  addLabels(summary.important, assessment.respiratory_data, respiratoryLabels, ['asthma', 'copd', 'emphysema']);
  addLabels(summary.important, assessment.infectious_data, infectiousLabels, [
    'hiv',
    'syphilis',
    'tuberculosis',
    'hepatitisB',
  ]);
  addIf(summary.important, assessment.fever, '发烧');
  addIf(summary.important, assessment.anticoagulant, '服用抗凝药');
  addIf(
    summary.important,
    assessment.snoring_severity === 'severe_apnea' || assessment.snoring_severity === 'severe_wakeup',
    '严重打鼾',
  );

  addIf(summary.notes, assessment.nausea, '恶心、呕吐');
  addIf(summary.notes, assessment.menstruation, '处于月经期');
  addLabels(summary.notes, assessment.digestive_data, digestiveLabels, [
    'hepatitis',
    'cirrhosis',
    'gallbladderDisease',
    'gerd',
    'gastricUlcer',
  ]);
  addLabels(summary.notes, assessment.urinary_data, urinaryLabels, ['nephritis', 'kidneyFailure', 'kidneyStones']);
  addIf(summary.notes, assessment.respiratory_data.bronchitis, '支气管炎');
  addIf(summary.notes, assessment.cold, '近期感冒咳嗽');
  addIf(summary.notes, assessment.teeth_issue, '牙齿问题');
  addIf(summary.notes, assessment.previous_surgery, '既往手术史');
  addIf(summary.notes, assessment.blood_pressure_med, '服用降压药');
  addIf(summary.notes, assessment.pain_med, '服用止痛药/激素');
  addIf(summary.notes, assessment.chinese_med, '服用中药/保健品');
  addIf(summary.notes, assessment.other_med, '服用其他药物');
  addIf(summary.notes, hasSmokingRisk(assessment), '吸烟习惯');
  addIf(summary.notes, hasDrinkingRisk(assessment), '饮酒习惯');
  addIf(summary.notes, assessment.snoring_severity === 'mild', '轻微打鼾');
  addIf(summary.notes, bmi > 0 && bmi < 18.5, 'BMI偏低');
  addIf(summary.notes, bmi >= 25 && bmi < 30, 'BMI超重');
  addIf(summary.notes, bmi >= 30, 'BMI肥胖');
  addIf(summary.notes, hasSelectedDiabetesMedication(assessment.diabetes_med_data), '服用降糖药');

  return {
    critical: unique(summary.critical),
    important: unique(summary.important),
    notes: unique(summary.notes),
  };
}

export function hasAnyRisk(summary: RiskSummary): boolean {
  return summary.critical.length + summary.important.length + summary.notes.length > 0;
}

export function getWorstIssues(assessment: AssessmentInput, limit = 3): string[] {
  const summary = getRiskSummary(assessment);
  return [...summary.critical, ...summary.important, ...summary.notes].slice(0, limit);
}

function isCurrentConditionCompleted(assessment: AssessmentInput): boolean {
  return (
    assessment.current_condition_normal ||
    assessment.chest_pain ||
    assessment.breathing_difficulty ||
    assessment.fever ||
    assessment.nausea ||
    assessment.menstruation ||
    Boolean(assessment.snoring_severity)
  );
}

function isMedicalHistoryCompleted(assessment: AssessmentInput): boolean {
  return assessment.medical_history_normal || hasSelectedMedicalHistory(assessment);
}

function isLifestyleCompleted(assessment: AssessmentInput): boolean {
  return (
    assessment.lifestyle_normal ||
    hasSmokingRisk(assessment) ||
    hasDrinkingRisk(assessment) ||
    assessment.cold ||
    assessment.teeth_issue
  );
}

function isSurgeryAllergyCompleted(assessment: AssessmentInput): boolean {
  return (
    assessment.surgery_allergy_normal ||
    assessment.previous_surgery ||
    assessment.anesthesia_reaction ||
    assessment.allergy
  );
}

function isMedicationCompleted(assessment: AssessmentInput): boolean {
  return (
    assessment.medication_normal ||
    assessment.blood_pressure_med ||
    hasSelectedDiabetesMedication(assessment.diabetes_med_data) ||
    assessment.anticoagulant ||
    assessment.pain_med ||
    assessment.chinese_med ||
    assessment.other_med
  );
}

function hasSmokingRisk(assessment: AssessmentInput): boolean {
  return assessment.smoking === 'occasionally' || assessment.smoking === 'daily';
}

function hasDrinkingRisk(assessment: AssessmentInput): boolean {
  return assessment.drinking === 'occasionally' || assessment.drinking === 'frequently';
}

export function getAsaTone(asa: AsaClass | undefined): {
  text: string;
  badge: string;
  border: string;
} {
  switch (asa) {
    case 'ASA Ⅰ':
      return {
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        border: 'border-emerald-400',
      };
    case 'ASA Ⅱ':
      return {
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        border: 'border-amber-400',
      };
    case 'ASA Ⅲ':
      return {
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        border: 'border-orange-400',
      };
    case 'ASA Ⅳ':
      return {
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800 border-red-300',
        border: 'border-red-400',
      };
    default:
      return {
        text: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
        border: 'border-slate-300',
      };
  }
}

export function exportableRows(records: AssessmentRecord[]) {
  return records.map((record) => ({
    姓名: record.name,
    年龄: record.age,
    性别: record.gender === 'male' ? '男' : '女',
    检查日期: record.assessment_date,
    是否预评估: record.is_pre_assessment ? '是' : '否',
    ASA分级: record.asa_class,
    身高cm: record.height,
    体重kg: record.weight,
    BMI: record.bmi,
    关键问题: getRiskSummary(record).critical.join('、'),
    重要问题: getRiskSummary(record).important.join('、'),
    注意事项: getRiskSummary(record).notes.join('、'),
    填写时间: record.created_at,
  }));
}

function addIf(target: string[], condition: boolean, label: string): void {
  if (condition) target.push(label);
}

function addLabels<T extends Record<string, boolean>, K extends keyof T>(
  target: string[],
  data: T,
  labels: Record<K, string>,
  keys: K[],
): void {
  keys.forEach((key) => {
    if (data[key]) target.push(labels[key]);
  });
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

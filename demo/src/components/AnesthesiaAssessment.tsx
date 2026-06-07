import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  Minus,
  Plus,
  RefreshCcw,
  Send,
  ShieldCheck,
  ShieldPlus,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  buildEmptyAssessment,
  calculateBmi,
  cardiovascularLabels,
  digestiveLabels,
  endocrineLabels,
  emptyCardiovascularData,
  emptyDigestiveData,
  emptyEndocrineData,
  emptyInfectiousData,
  emptyNervousData,
  emptyRespiratoryData,
  emptyUrinaryData,
  emptyDiabetesMedData,
  infectiousLabels,
  isPreAssessment,
  nervousLabels,
  respiratoryLabels,
  urinaryLabels,
  diabetesMedLabels,
  getMissingRequiredSections,
  getSelectedBooleanCount,
  hasSelectedDiabetesMedication,
  hasSelectedMedicalHistory,
  normalizeAssessmentForStorage,
} from '@/lib/assessment';
import type { AssessmentInput, AssessmentRecord } from '@/lib/assessment';
import { AssessmentReportView } from '@/components/assessment-summary';
import { Button, Card, CheckboxChoice, Field, PageShell, RadioChoice, SelectInput, TextArea, TextInput } from '@/components/assessment-ui';

const conditionKeys = ['chest_pain', 'breathing_difficulty', 'fever', 'nausea', 'menstruation'] as const;

const conditionLabels = {
  chest_pain: '胸闷、胸痛',
  breathing_difficulty: '呼吸困难',
  fever: '发烧',
  nausea: '恶心、呕吐',
  menstruation: '处于月经期',
};

type FormSection = {
  id: string;
  title: string;
  skipWhenPreAssessment?: boolean;
};

const formSections: FormSection[] = [
  { id: 'section-basic-info', title: '基本信息' },
  { id: 'section-current-condition', title: '身体状况' },
  { id: 'section-medical-history', title: '过往病史' },
  { id: 'section-lifestyle', title: '生活习惯' },
  { id: 'section-surgery-allergy', title: '手术过敏' },
  { id: 'section-medication', title: '用药情况' },
  { id: 'section-fasting', title: '禁食禁饮', skipWhenPreAssessment: true },
] as const;

type HourPickerFieldProps = {
  label: string;
  inputId: string;
  sheetTitle: string;
  value: string;
  onChange: (value: string) => void;
  options: number[];
  max?: number;
};

function cleanHourValue(rawValue: string, max: number): string {
  if (rawValue === '') return '';

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) return '';

  const clampedValue = Math.min(max, Math.max(0, Math.round(numericValue)));
  return String(clampedValue);
}

function shiftHourValue(value: string, direction: 1 | -1, max: number): string {
  const cleanValue = cleanHourValue(value, max);
  const currentValue = cleanValue === '' ? 0 : Number(cleanValue);
  return String(Math.min(max, Math.max(0, currentValue + direction)));
}

function HourPickerField({
  label,
  inputId,
  sheetTitle,
  value,
  onChange,
  options,
  max = 24,
}: HourPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState('0');
  const displayValue = value ? `${value} 小时` : '请选择';
  const ariaValue = value ? `${value}小时` : '请选择';

  function applyStep(direction: 1 | -1) {
    setDraftValue((current) => shiftHourValue(current, direction, max));
  }

  function openPicker() {
    setDraftValue(cleanHourValue(value, max) || '0');
    setIsOpen(true);
  }

  function confirmPicker() {
    onChange(cleanHourValue(draftValue, max));
    setIsOpen(false);
  }

  function selectPresetHour(hour: number) {
    setDraftValue(String(hour));
    onChange(String(hour));
    setIsOpen(false);
  }

  return (
    <div className="hour-picker-field">
      <label htmlFor={inputId} className="hour-picker-label">
        {label}
      </label>
      <button
        id={inputId}
        type="button"
        aria-label={`${label}，${ariaValue}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="hour-picker-trigger"
        onClick={openPicker}
      >
        <span className={value ? 'hour-picker-display' : 'hour-picker-display hour-picker-display-empty'}>
          {displayValue}
        </span>
        <span className="hour-picker-trigger-icon" aria-hidden="true">
          <Clock3 className="h-4 w-4" />
        </span>
      </button>

      {isOpen ? (
        <div className="hour-picker-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <div
            className="hour-picker-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${inputId}-sheet-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="hour-picker-handle" aria-hidden="true" />
            <div className="hour-picker-sheet-header">
              <h3 id={`${inputId}-sheet-title`}>{sheetTitle}</h3>
              <button type="button" aria-label="关闭选择器" className="hour-picker-close" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="hour-picker-stepper">
              <button type="button" aria-label="减少1小时" onClick={() => applyStep(-1)}>
                <Minus className="h-5 w-5" />
              </button>
              <strong>{draftValue}</strong>
              <button type="button" aria-label="增加1小时" onClick={() => applyStep(1)}>
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="hour-picker-options">
              {options.map((hour) => {
                const isSelected = draftValue === String(hour);

                return (
                  <button
                    key={hour}
                    type="button"
                    aria-pressed={isSelected}
                    className={isSelected ? 'is-selected' : ''}
                    onClick={() => selectPresetHour(hour)}
                  >
                    {hour}小时
                  </button>
                );
              })}
            </div>

            <button type="button" className="hour-picker-confirm" onClick={confirmPicker}>
              确认选择
            </button>
          </div>
        </div>
      ) : null}
      </div>
  );
}


const diseaseGroups = [
  {
    key: 'cardiovascular_data',
    title: '心血管系统',
    labels: cardiovascularLabels,
    empty: emptyCardiovascularData,
  },
  {
    key: 'endocrine_data',
    title: '内分泌系统',
    labels: endocrineLabels,
    empty: emptyEndocrineData,
  },
  {
    key: 'nervous_data',
    title: '神经系统',
    labels: nervousLabels,
    empty: emptyNervousData,
  },
  {
    key: 'respiratory_data',
    title: '呼吸系统',
    labels: respiratoryLabels,
    empty: emptyRespiratoryData,
  },
  {
    key: 'digestive_data',
    title: '消化系统',
    labels: digestiveLabels,
    empty: emptyDigestiveData,
  },
  {
    key: 'urinary_data',
    title: '泌尿系统',
    labels: urinaryLabels,
    empty: emptyUrinaryData,
  },
  {
    key: 'infectious_data',
    title: '传染病',
    labels: infectiousLabels,
    empty: emptyInfectiousData,
  },
] as const;

export default function AnesthesiaAssessment({ onBack, embedded = false }: { onBack: () => void; embedded?: boolean }) {
  const [form, setForm] = useState<AssessmentInput>(() => buildEmptyAssessment());
  const [showDiabetesMeds, setShowDiabetesMeds] = useState(false);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [highlightSection, setHighlightSection] = useState('');
  const [highlightMessage, setHighlightMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAssessment, setSubmittedAssessment] = useState<AssessmentRecord | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentCountdown, setConsentCountdown] = useState(3);
  const [expandedHistoryGroups, setExpandedHistoryGroups] = useState<Array<(typeof diseaseGroups)[number]['key']>>([]);
  const submitDockRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledToSubmitRef = useRef(false);

  const bmi = useMemo(() => calculateBmi(form.height, form.weight), [form.height, form.weight]);
  const isPre = isPreAssessment(form.assessment_date);
  const hasMedicalHistory = useMemo(() => hasSelectedMedicalHistory(form), [form]);
  const selectedMedicalHistoryCount = useMemo(
    () =>
      diseaseGroups.reduce((total, group) => {
        return total + getSelectedBooleanCount(form[group.key] as Record<string, boolean>);
      }, 0),
    [form],
  );
  const sectionProgress = useMemo(() => {
    const basicComplete = Boolean(
      form.name.trim() && form.age.trim() && form.gender && form.height.trim() && form.weight.trim(),
    );
    const missingIds = new Set(
      getMissingRequiredSections({
        ...form,
        bmi,
        snoring_night: Boolean(form.snoring_severity),
      }).map((section) => section.id),
    );

    return formSections.map((section) => {
      const skipped = Boolean(section.skipWhenPreAssessment && isPre);

      return {
        ...section,
        skipped,
        complete: skipped || (section.id === 'section-basic-info' ? basicComplete : !missingIds.has(section.id)),
      };
    });
  }, [bmi, form, isPre]);
  const completedSections = sectionProgress.filter((section) => section.complete).length;
  const progressPercent = Math.round((completedSections / formSections.length) * 100);
  const nextIncompleteSection = sectionProgress.find((section) => !section.complete && !section.skipped);
  const nextActionLabel = nextIncompleteSection ? nextIncompleteSection.title : '提交评估';
  const patientName = form.name.trim();
  const patientTitle = patientName ? `${patientName}的术前评估` : '术前麻醉评估';
  const hasExplicitLifestyleRisk =
    form.smoking === 'occasionally' ||
    form.smoking === 'daily' ||
    form.drinking === 'occasionally' ||
    form.drinking === 'frequently' ||
    form.cold ||
    form.teeth_issue;

  function update<K extends keyof AssessmentInput>(key: K, value: AssessmentInput[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'gender' && value === 'male' ? { menstruation: false } : {}),
    }));
  }

  function sectionClass(sectionId: string): string {
    return highlightSection === sectionId ? 'missing-section-flash scroll-mt-24' : 'scroll-mt-24';
  }

  function focusMissingSection(sectionId: string, message: string) {
    setHighlightSection(sectionId);
    setHighlightMessage(message);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 30);
    window.setTimeout(() => {
      setHighlightSection('');
      setHighlightMessage('');
    }, 2800);
  }

  function sectionNotice(sectionId: string) {
    if (highlightSection !== sectionId || !highlightMessage) return null;

    return (
      <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
        {highlightMessage}
      </div>
    );
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function toggleCurrentCondition(key: (typeof conditionKeys)[number]) {
    setForm((current) => ({
      ...current,
      [key]: !current[key],
      current_condition_normal: false,
    }));
  }

  function setCurrentConditionNormal(checked: boolean) {
    setForm((current) => ({
      ...current,
      current_condition_normal: checked,
      chest_pain: checked ? false : current.chest_pain,
      breathing_difficulty: checked ? false : current.breathing_difficulty,
      fever: checked ? false : current.fever,
      nausea: checked ? false : current.nausea,
      menstruation: checked ? false : current.menstruation,
    }));
  }

  function toggleDisease(group: (typeof diseaseGroups)[number]['key'], key: string) {
    setForm((current) => ({
      ...current,
      medical_history_normal: false,
      [group]: {
        ...(current[group] as Record<string, boolean>),
        [key]: !(current[group] as Record<string, boolean>)[key],
      },
    }));
  }

  function toggleHistoryGroup(group: (typeof diseaseGroups)[number]['key']) {
    setExpandedHistoryGroups((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group],
    );
  }

  function setMedicalHistoryNormal(checked: boolean) {
    setForm((current) => ({
      ...current,
      ...(checked && hasSelectedMedicalHistory(current)
        ? {}
        : {
            medical_history_normal: checked,
            cardiovascular_data: checked ? { ...emptyCardiovascularData } : current.cardiovascular_data,
            endocrine_data: checked ? { ...emptyEndocrineData } : current.endocrine_data,
            nervous_data: checked ? { ...emptyNervousData } : current.nervous_data,
            respiratory_data: checked ? { ...emptyRespiratoryData } : current.respiratory_data,
            digestive_data: checked ? { ...emptyDigestiveData } : current.digestive_data,
            urinary_data: checked ? { ...emptyUrinaryData } : current.urinary_data,
            infectious_data: checked ? { ...emptyInfectiousData } : current.infectious_data,
          }),
    }));
    if (checked) {
      setExpandedHistoryGroups([]);
    }
  }

  function setLifestyleNormal(checked: boolean) {
    setForm((current) => ({
      ...current,
      ...(checked &&
      (current.smoking === 'occasionally' ||
        current.smoking === 'daily' ||
        current.drinking === 'occasionally' ||
        current.drinking === 'frequently' ||
        current.cold ||
        current.teeth_issue)
        ? {}
        : {
            lifestyle_normal: checked,
            smoking: checked ? 'never' : current.smoking,
            drinking: checked ? 'never' : current.drinking,
            cold: checked ? false : current.cold,
            teeth_issue: checked ? false : current.teeth_issue,
            teeth_description: checked ? '' : current.teeth_description,
          }),
    }));
  }

  function updateLifestyle<K extends keyof Pick<AssessmentInput, 'smoking' | 'drinking' | 'cold' | 'teeth_issue'>>(
    key: K,
    value: AssessmentInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
      lifestyle_normal: false,
      ...(key === 'smoking' && value !== 'daily' ? { smoking_amount: '' } : {}),
      ...(key === 'teeth_issue' && value === false ? { teeth_description: '' } : {}),
    }));
  }

  function toggleSurgeryAllergy(key: 'previous_surgery' | 'anesthesia_reaction' | 'allergy') {
    setForm((current) => ({
      ...current,
      [key]: !current[key],
      surgery_allergy_normal: false,
    }));
  }

  function setSurgeryAllergyNormal(checked: boolean) {
    setForm((current) => ({
      ...current,
      surgery_allergy_normal: checked,
      previous_surgery: checked ? false : current.previous_surgery,
      surgery_name: checked ? '' : current.surgery_name,
      anesthesia_reaction: checked ? false : current.anesthesia_reaction,
      reaction_description: checked ? '' : current.reaction_description,
      allergy: checked ? false : current.allergy,
      allergy_description: checked ? '' : current.allergy_description,
    }));
  }

  function toggleMedication(key: 'blood_pressure_med' | 'anticoagulant' | 'pain_med' | 'chinese_med' | 'other_med') {
    setForm((current) => ({
      ...current,
      [key]: !current[key],
      medication_normal: false,
    }));
  }

  function setMedicationNormal(checked: boolean) {
    setShowDiabetesMeds(false);
    setForm((current) => ({
      ...current,
      medication_normal: checked,
      blood_pressure_med: checked ? false : current.blood_pressure_med,
      diabetes_med_data: checked ? { ...emptyDiabetesMedData } : current.diabetes_med_data,
      anticoagulant: checked ? false : current.anticoagulant,
      pain_med: checked ? false : current.pain_med,
      chinese_med: checked ? false : current.chinese_med,
      other_med: checked ? false : current.other_med,
      other_med_description: checked ? '' : current.other_med_description,
    }));
  }

  function toggleDiabetesMed(key: keyof typeof diabetesMedLabels) {
    setForm((current) => ({
      ...current,
      medication_normal: false,
      diabetes_med_data: {
        ...current.diabetes_med_data,
        [key]: !current.diabetes_med_data[key],
      },
    }));
  }

  function validateBeforeSubmit(): boolean {
    setError('');
    setErrorDetail('');

    if (!form.name.trim() || !form.age.trim() || !form.gender || !form.height.trim() || !form.weight.trim()) {
      setError('请先填写姓名、年龄、性别、身高和体重。');
      setErrorDetail('请补全基本信息后再提交。');
      focusMissingSection('section-basic-info', '请补全基本信息后再提交。');
      return false;
    }

    const missingSections = getMissingRequiredSections({
      ...form,
      bmi,
      snoring_night: Boolean(form.snoring_severity),
    });

    if (missingSections.length > 0) {
      const firstMissing = missingSections[0];
      setError(`请先完成“${firstMissing.title}”部分。`);
      setErrorDetail(firstMissing.message);
      focusMissingSection(firstMissing.id, firstMissing.message);
      return false;
    }

    return true;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateBeforeSubmit()) return;

    setConsentCountdown(3);
    setShowConsentModal(true);
  }

  function submitAssessment() {
    if (consentCountdown > 0 || isSubmitting) return;

    setIsSubmitting(true);
    window.setTimeout(() => {
      const record = normalizeAssessmentForStorage({
        ...form,
        bmi,
        snoring_night: Boolean(form.snoring_severity),
      });
      const records = JSON.parse(localStorage.getItem('assessmentRecords') || '[]') as AssessmentRecord[];
      localStorage.setItem('assessmentRecords', JSON.stringify([record, ...records].slice(0, 20)));
      localStorage.setItem('assessmentData', JSON.stringify(record));
      setSubmittedAssessment(record);
      setShowConsentModal(false);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 360);
  }

  function resetAssessmentForm() {
    setForm(buildEmptyAssessment());
    setShowDiabetesMeds(false);
    setError('');
    setErrorDetail('');
    setHighlightSection('');
    setHighlightMessage('');
    hasAutoScrolledToSubmitRef.current = false;
  }

  function closeConsentModal() {
    if (isSubmitting) return;
    setShowConsentModal(false);
    setConsentCountdown(3);
  }

  useEffect(() => {
    if (!showConsentModal) return;

    const timer = window.setInterval(() => {
      setConsentCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showConsentModal]);

  useEffect(() => {
    if (submittedAssessment) return;

    if (progressPercent < 100) {
      hasAutoScrolledToSubmitRef.current = false;
      return;
    }

    if (progressPercent !== 100 || hasAutoScrolledToSubmitRef.current) return;

    hasAutoScrolledToSubmitRef.current = true;
    const timer = window.setTimeout(() => {
      submitDockRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 140);

    return () => window.clearTimeout(timer);
  }, [progressPercent, submittedAssessment]);

  return (
    <AssessmentPageFrame embedded={embedded}>
      <header className="assessment-header">
        <div className="assessment-topbar">
          <Button type="button" variant="ghost" className="assessment-back-button" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="assessment-topbar-title">
            <span>疼痛医学科</span>
            <strong>麻醉评估</strong>
          </div>
          <span
            className={`assessment-status-pill ${
              isPre ? 'assessment-status-pill-pre' : 'assessment-status-pill-today'
            }`}
          >
            {isPre ? '预评估' : '当天'}
          </span>
        </div>

        <div className="assessment-hero-panel">
          <div className="assessment-hero-main">
            <span className="assessment-hero-icon" aria-hidden="true">
              <ShieldPlus className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p>微信已登录 · 信息仅用于术前安全核对</p>
              <h1>{patientTitle}</h1>
              <div className="assessment-hero-meta">
                <span>{form.gender === 'female' ? '女士' : form.gender === 'male' ? '先生' : '患者'}</span>
                <span>{form.assessment_date}</span>
                <span>{nextIncompleteSection ? `下一项：${nextActionLabel}` : '可以提交'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {submittedAssessment ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-700">已生成评估结果</p>
                <h2 className="mt-1 text-2xl font-black text-stone-950">麻醉评估已提交</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setSubmittedAssessment(null)}>
                  继续修改
                </Button>
                <Button type="button" onClick={onBack}>
                  回到到院流程
                </Button>
              </div>
            </div>
          </Card>
          <AssessmentReportView assessment={submittedAssessment} />
        </div>
      ) : (
        <>
      <div className="assessment-progress-panel">
        <div className="assessment-progress-summary">
          <div
            className="assessment-progress-meter"
            style={{ '--assessment-progress': `${progressPercent}%` } as CSSProperties}
            aria-label={`已完成 ${progressPercent}%`}
          >
            <strong>{progressPercent}%</strong>
          </div>
          <div className="min-w-0">
            <p className="assessment-progress-eyebrow">我的填写进度</p>
            <h2>{completedSections === formSections.length ? '全部完成，可以提交' : `下一步：${nextActionLabel}`}</h2>
            <span>{completedSections}/{formSections.length} 项已完成，未填写的部分会自动定位提醒。</span>
          </div>
        </div>
        <div className="assessment-progress-bar">
          <div
            className="assessment-progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="assessment-section-scroll section-scroll">
          {sectionProgress.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={`assessment-section-chip ${
                section.skipped
                  ? 'assessment-section-chip-skipped'
                  : section.complete
                    ? 'assessment-section-chip-complete'
                    : 'assessment-section-chip-pending'
              }`}
            >
              {section.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
              {section.skipped ? '跳过 ' : section.complete ? '已填 ' : '待填 '}
              {section.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div id="section-basic-info" className={sectionClass('section-basic-info')}>
        {sectionNotice('section-basic-info')}
        <Card title="基本信息" eyebrow="01" description="请填写身份和体格信息，BMI 会自动计算。">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <Field label="姓名">
              <TextInput value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="请输入姓名" />
            </Field>
            <Field label="年龄">
              <TextInput type="number" value={form.age} onChange={(event) => update('age', event.target.value)} placeholder="岁" />
            </Field>
            <Field label="性别" asLabel={false}>
              <div className="grid grid-cols-2 gap-2">
                <RadioChoice checked={form.gender === 'male'} label="男" onChange={() => update('gender', 'male')} />
                <RadioChoice checked={form.gender === 'female'} label="女" onChange={() => update('gender', 'female')} />
              </div>
            </Field>
            <Field label="身高 cm">
              <TextInput type="number" value={form.height} onChange={(event) => update('height', event.target.value)} placeholder="例如 170" />
            </Field>
            <Field label="体重 kg">
              <TextInput type="number" value={form.weight} onChange={(event) => update('weight', event.target.value)} placeholder="例如 65" />
            </Field>
            <Field label="BMI" hint="输入身高体重后自动计算">
              <TextInput readOnly value={bmi} placeholder="自动计算" />
            </Field>
            <Field label="检查日期" hint="允许选择未来日期，非当天会标记为预评估">
              <TextInput type="date" value={form.assessment_date} onChange={(event) => update('assessment_date', event.target.value)} />
            </Field>
          </div>
          {isPre ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
              非当天评估，将标记为“预评估”；禁食禁饮情况无需填写，手术当天再确认。
            </div>
          ) : null}
        </Card>
        </div>

        <div id="section-current-condition" className={sectionClass('section-current-condition')}>
        {sectionNotice('section-current-condition')}
        <Card title="当前身体状况" eyebrow="02" description="请选择当前是否存在明显不适。">
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {conditionKeys.map((key) => {
              if (key === 'menstruation' && form.gender !== 'female') return null;
              return (
                <CheckboxChoice
                  key={key}
                  checked={form[key]}
                  label={conditionLabels[key]}
                  onChange={() => toggleCurrentCondition(key)}
                  disabled={form.current_condition_normal}
                />
              );
            })}
            <CheckboxChoice
              checked={form.current_condition_normal}
              label="以上情况都没有"
              onChange={() => setCurrentConditionNormal(!form.current_condition_normal)}
              tone="clear"
            />
          </div>

          <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <p className="mb-3 text-sm font-black text-slate-800">晚上是否打鼾？</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['', '否'],
                ['mild', '轻微'],
                ['severe_apnea', '严重（呼吸暂停）'],
                ['severe_wakeup', '严重（把自己憋醒）'],
              ].map(([value, label]) => (
                <RadioChoice
                  key={label}
                  checked={form.snoring_severity === value}
                  label={label}
                  onChange={() => update('snoring_severity', value as AssessmentInput['snoring_severity'])}
                />
              ))}
            </div>
          </div>
        </Card>
        </div>

        <div id="section-medical-history" className={sectionClass('section-medical-history')}>
        {sectionNotice('section-medical-history')}
        <Card title="过往病史" eyebrow="03" description="先确认是否有病史；如有，再展开对应分类勾选。">
          <div className="space-y-3 sm:space-y-4">
            {form.medical_history_normal ? (
              <div className="rounded-lg border border-teal-100 bg-white px-4 py-3 text-sm font-bold leading-6 text-teal-900">
                已确认无相关既往病史。如需填写病史，请先取消下方“以上情况都没有”。
              </div>
            ) : null}
            {!form.medical_history_normal
              ? diseaseGroups.map((group) => {
                  const groupData = form[group.key] as Record<string, boolean>;
                  const selectedCount = getSelectedBooleanCount(groupData);
                  const isOpen = selectedCount > 0 || expandedHistoryGroups.includes(group.key);

                  return (
                    <div key={group.key} className="history-tree-group">
                      <button
                        type="button"
                        className="history-tree-parent"
                        onClick={() => toggleHistoryGroup(group.key)}
                        aria-expanded={isOpen}
                      >
                        <span className="min-w-0 flex-1">{group.title}</span>
                        {selectedCount > 0 ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-black text-sky-700">
                            已选 {selectedCount} 项
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-500">
                            未选择
                          </span>
                        )}
                        <ChevronDown
                          className={`history-tree-chevron h-4 w-4 shrink-0 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {isOpen ? (
                        <div className="history-tree-children">
                          {Object.entries(group.labels).map(([key, label]) => (
                            <label
                              key={key}
                              className={`history-tree-item ${form.medical_history_normal ? 'opacity-50' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(groupData[key])}
                                onChange={() => toggleDisease(group.key, key)}
                                disabled={form.medical_history_normal}
                                className="h-4 w-4 rounded border-slate-300 accent-sky-700"
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              : null}
            <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-3">
              <CheckboxChoice
                checked={form.medical_history_normal}
                label="以上情况都没有"
                onChange={() => setMedicalHistoryNormal(!form.medical_history_normal)}
                disabled={hasMedicalHistory && !form.medical_history_normal}
                tone="clear"
              />
              {hasMedicalHistory ? (
                <p className="mt-2 text-xs font-bold leading-5 text-amber-800">
                  已选择 {selectedMedicalHistoryCount} 项病史；如需改为无病史，请先取消上方已选项目。
                </p>
              ) : (
                <p className="mt-2 text-xs font-semibold leading-5 text-teal-800">
                  如果没有相关病史，看完上方分类后勾选本项；如果有，请展开上方分类。
                </p>
              )}
            </div>
          </div>
        </Card>
        </div>

        <div id="section-lifestyle" className={sectionClass('section-lifestyle')}>
        {sectionNotice('section-lifestyle')}
        <Card title="生活习惯" eyebrow="04" description="确认吸烟、饮酒、近期感冒咳嗽和牙齿情况。">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <Field label="吸烟情况" asLabel={false}>
              <div className="lifestyle-segment-row">
                <RadioChoice checked={form.smoking === 'never'} label="从不" onChange={() => updateLifestyle('smoking', 'never')} disabled={form.lifestyle_normal} className="lifestyle-choice-compact" />
                <RadioChoice checked={form.smoking === 'occasionally'} label="偶尔" onChange={() => updateLifestyle('smoking', 'occasionally')} disabled={form.lifestyle_normal} className="lifestyle-choice-compact" />
                <RadioChoice checked={form.smoking === 'daily'} label="每天" onChange={() => updateLifestyle('smoking', 'daily')} disabled={form.lifestyle_normal} className="lifestyle-choice-compact" />
              </div>
            </Field>
            <Field label="饮酒情况" asLabel={false}>
              <div className="lifestyle-segment-row">
                <RadioChoice checked={form.drinking === 'never'} label="从不" onChange={() => updateLifestyle('drinking', 'never')} disabled={form.lifestyle_normal} className="lifestyle-choice-compact" />
                <RadioChoice checked={form.drinking === 'occasionally'} label="偶尔" onChange={() => updateLifestyle('drinking', 'occasionally')} disabled={form.lifestyle_normal} className="lifestyle-choice-compact" />
                <RadioChoice checked={form.drinking === 'frequently'} label="经常" onChange={() => updateLifestyle('drinking', 'frequently')} disabled={form.lifestyle_normal} className="lifestyle-choice-compact" />
              </div>
            </Field>
            {form.smoking === 'daily' ? (
              <Field label="每日吸烟量">
                <TextInput value={form.smoking_amount} onChange={(event) => update('smoking_amount', event.target.value)} placeholder="支/天" />
              </Field>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckboxChoice checked={form.cold} label="近期感冒咳嗽" onChange={() => updateLifestyle('cold', !form.cold)} disabled={form.lifestyle_normal} />
              <CheckboxChoice checked={form.teeth_issue} label="牙齿问题：松动/假牙/牙套" onChange={() => updateLifestyle('teeth_issue', !form.teeth_issue)} disabled={form.lifestyle_normal} />
              <CheckboxChoice
                checked={form.lifestyle_normal}
                label="以上情况都没有"
                onChange={() => setLifestyleNormal(!form.lifestyle_normal)}
                disabled={hasExplicitLifestyleRisk && !form.lifestyle_normal}
                tone="clear"
              />
              {hasExplicitLifestyleRisk && !form.lifestyle_normal ? (
                <p className="lifestyle-normal-hint">
                  已选择吸烟、饮酒、感冒咳嗽或牙齿问题；如需勾选“以上情况都没有”，请先取消上方选择。
                </p>
              ) : null}
            </div>
            {form.teeth_issue ? (
              <Field label="牙齿问题说明">
                <TextArea value={form.teeth_description} onChange={(event) => update('teeth_description', event.target.value)} placeholder="请补充说明" />
              </Field>
            ) : null}
          </div>
        </Card>
        </div>

        <div id="section-surgery-allergy" className={sectionClass('section-surgery-allergy')}>
        {sectionNotice('section-surgery-allergy')}
        <Card title="手术及过敏史" eyebrow="05" description="如有手术、麻醉反应或过敏史，请补充说明。">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CheckboxChoice
              checked={form.previous_surgery}
              label="既往手术史"
              onChange={() => toggleSurgeryAllergy('previous_surgery')}
              disabled={form.surgery_allergy_normal}
            />
            <CheckboxChoice
              checked={form.anesthesia_reaction}
              label="麻醉不良反应史"
              onChange={() => toggleSurgeryAllergy('anesthesia_reaction')}
              disabled={form.surgery_allergy_normal}
            />
            <CheckboxChoice
              checked={form.allergy}
              label="药物过敏史"
              onChange={() => toggleSurgeryAllergy('allergy')}
              disabled={form.surgery_allergy_normal}
            />
            <CheckboxChoice
              checked={form.surgery_allergy_normal}
              label="以上情况都没有"
              onChange={() => setSurgeryAllergyNormal(!form.surgery_allergy_normal)}
              tone="clear"
            />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {form.previous_surgery ? (
              <Field label="手术名称">
                <TextInput value={form.surgery_name} onChange={(event) => update('surgery_name', event.target.value)} />
              </Field>
            ) : null}
            {form.anesthesia_reaction ? (
              <Field label="不良反应说明">
                <TextInput value={form.reaction_description} onChange={(event) => update('reaction_description', event.target.value)} />
              </Field>
            ) : null}
            {form.allergy ? (
              <Field label="过敏详情">
                <TextInput value={form.allergy_description} onChange={(event) => update('allergy_description', event.target.value)} />
              </Field>
            ) : null}
          </div>
        </Card>
        </div>

        <div id="section-medication" className={sectionClass('section-medication')}>
        {sectionNotice('section-medication')}
        <Card title="用药情况" eyebrow="06" description="重点确认降压药、降糖药、抗凝药等围术期相关用药。">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CheckboxChoice checked={form.blood_pressure_med} label="降压药" onChange={() => toggleMedication('blood_pressure_med')} disabled={form.medication_normal} />
            <CheckboxChoice
              checked={showDiabetesMeds || hasSelectedDiabetesMedication(form.diabetes_med_data)}
              label="降糖药"
              onChange={() => {
                const next = !(showDiabetesMeds || hasSelectedDiabetesMedication(form.diabetes_med_data));
                setShowDiabetesMeds(next);
                if (!next) update('diabetes_med_data', { ...emptyDiabetesMedData });
                update('medication_normal', false);
              }}
              disabled={form.medication_normal}
            />
            <CheckboxChoice checked={form.anticoagulant} label="抗凝药" onChange={() => toggleMedication('anticoagulant')} disabled={form.medication_normal} />
            <CheckboxChoice checked={form.pain_med} label="止痛药/激素" onChange={() => toggleMedication('pain_med')} disabled={form.medication_normal} />
            <CheckboxChoice checked={form.chinese_med} label="中药/保健品" onChange={() => toggleMedication('chinese_med')} disabled={form.medication_normal} />
            <CheckboxChoice checked={form.other_med} label="其他药物" onChange={() => toggleMedication('other_med')} disabled={form.medication_normal} />
            <CheckboxChoice
              checked={form.medication_normal}
              label="以上情况都没有"
              onChange={() => setMedicationNormal(!form.medication_normal)}
              tone="clear"
            />
          </div>
          {showDiabetesMeds || hasSelectedDiabetesMedication(form.diabetes_med_data) ? (
            <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50/80 p-3">
              <p className="mb-3 text-sm font-black text-sky-950">降糖药选择</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(diabetesMedLabels).map(([key, label]) => (
                  <CheckboxChoice
                    key={key}
                    checked={Boolean(form.diabetes_med_data[key as keyof typeof diabetesMedLabels])}
                    label={label}
                    onChange={() => toggleDiabetesMed(key as keyof typeof diabetesMedLabels)}
                  />
                ))}
              </div>
              {form.diabetes_med_data.other ? (
                <div className="mt-3">
                  <Field label="其他降糖药说明">
                    <TextInput
                      value={form.diabetes_med_data.otherDescription}
                      onChange={(event) =>
                        update('diabetes_med_data', {
                          ...form.diabetes_med_data,
                          otherDescription: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              ) : null}
            </div>
          ) : null}
          {form.other_med ? (
            <div className="mt-4">
              <Field label="其他药物说明">
                <TextInput value={form.other_med_description} onChange={(event) => update('other_med_description', event.target.value)} />
              </Field>
            </div>
          ) : null}
        </Card>
        </div>

        <div id="section-fasting" className={sectionClass('section-fasting')}>
        {sectionNotice('section-fasting')}
        <Card title="禁食禁饮情况" eyebrow="07" description={isPre ? '预约预评估无需填写，本项手术当天确认。' : '请填写最近进食和饮水距离当前的时间。'}>
          {isPre ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-bold leading-6 text-amber-900">
              当前为非当天预约评估，本部分暂不需要填写。请在手术当天由患者或医护人员再次确认禁食禁饮情况。
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.9fr]">
              <HourPickerField
                label="已未吃饭：多少小时"
                inputId="fasting-hours-input"
                sheetTitle="选择已未吃饭时长"
                value={form.fasting_hours}
                onChange={(value) => update('fasting_hours', value)}
                options={[0, 2, 4, 6, 8, 10, 12, 24]}
              />
              <HourPickerField
                label="已未喝水：多少小时"
                inputId="drinking-hours-input"
                sheetTitle="选择已未喝水时长"
                value={form.drinking_hours}
                onChange={(value) => update('drinking_hours', value)}
                options={[0, 1, 2, 3, 4, 6, 8, 12]}
              />
              <Field label="最后一次喝的是">
                <SelectInput value={form.drink_type} onChange={(event) => update('drink_type', event.target.value as AssessmentInput['drink_type'])}>
                  <option value="">请选择</option>
                  <option value="water">水（清水）</option>
                  <option value="milk">牛奶</option>
                  <option value="beverage">饮料</option>
                </SelectInput>
              </Field>
            </div>
          )}
        </Card>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-900">
            <p>{error}</p>
            {errorDetail ? <p className="mt-1 font-semibold">{errorDetail}</p> : null}
          </div>
        ) : null}

        <div ref={submitDockRef} className="assessment-submit-dock app-progress-card p-3">
          <div className="mb-3 flex items-center justify-between gap-2 px-1 text-sm font-black text-[#493f3a]">
            <span>已完成 {completedSections}/{formSections.length}</span>
            <span className="rounded-full bg-[#fff0eb] px-3 py-1 text-[#ef705c]">{progressPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={resetAssessmentForm} className="assessment-reset-button">
              <RefreshCcw className="h-4 w-4" />
              重置
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? <Activity className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? '提交中...' : '提交评估'}
            </Button>
          </div>
        </div>
      </form>

      {showConsentModal ? (
        <ConsentConfirmationModal
          countdown={consentCountdown}
          isSubmitting={isSubmitting}
          onCancel={closeConsentModal}
          onConfirm={submitAssessment}
        />
      ) : null}
        </>
      )}
    </AssessmentPageFrame>
  );
}

function AssessmentPageFrame({
  embedded,
  children,
}: {
  embedded?: boolean;
  children: ReactNode;
}) {
  if (embedded) {
    return <div className="assessment-embedded-root">{children}</div>;
  }

  return (
    <PageShell variant="phone" className="assessment-phone-shell">
      {children}
    </PageShell>
  );
}

function ConsentConfirmationModal({
  countdown,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  countdown: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmDisabled = countdown > 0 || isSubmitting;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="consent-modal-backdrop"
    >
      <div className="consent-dialog">
        <div className="consent-header">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 shrink-0 text-amber-500" />
            <h2 id="consent-title">
              麻醉术前评估知情确认
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="consent-close-button"
            aria-label="关闭知情确认"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="consent-scroll-area">
          <ConsentNotice
            icon={<FileCheck2 className="h-4 w-4" />}
            title="如实告知"
            tone="blue"
          >
            您承诺所填写的既往病史、用药情况、过敏史等信息真实、完整。如因隐瞒或遗漏引发不良后果，相关责任由您自行承担。
          </ConsentNotice>
          <ConsentNotice
            icon={<ShieldCheck className="h-4 w-4" />}
            title="全程监护"
            tone="green"
          >
            麻醉期间及恢复阶段，我们将实施全程专业监护，配备急救设备，全力保障您的安全。
          </ConsentNotice>
          <ConsentNotice
            icon={<TriangleAlert className="h-4 w-4" />}
            title="风险告知"
            tone="amber"
          >
            受限于现有医学技术与个体差异，即使规范操作、严密监护，麻醉仍存在难以完全预见和避免的固有风险，如药物反应、心脑血管意外等。
          </ConsentNotice>
          <ConsentNotice
            icon={<ShieldPlus className="h-4 w-4" />}
            title="知情确认"
            tone="purple"
          >
            本人已阅读并理解上述内容，如有疑问已向麻醉医师咨询，同意在明确风险的前提下接受麻醉评估与操作。
          </ConsentNotice>
        </div>

        <div className="consent-actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="button" onClick={onConfirm} disabled={confirmDisabled}>
            {isSubmitting ? <Activity className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? '提交中...' : countdown > 0 ? `确认提交 ${countdown}s` : '确认提交'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConsentNotice({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: 'blue' | 'green' | 'amber' | 'purple';
  children: ReactNode;
}) {
  const toneClass = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  }[tone];

  return (
    <div className={`consent-notice ${toneClass}`}>
      <div className="consent-notice-title">
        {icon}
        <h3>{title}</h3>
      </div>
      <p>{children}</p>
    </div>
  );
}

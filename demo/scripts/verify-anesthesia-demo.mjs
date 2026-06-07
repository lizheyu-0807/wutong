import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const app = readFileSync(resolve('src/App.tsx'), 'utf8');
const css = readFileSync(resolve('src/index.css'), 'utf8');
const assessment = readFileSync(resolve('src/components/AnesthesiaAssessment.tsx'), 'utf8');
const assessmentUi = readFileSync(resolve('src/components/assessment-ui.tsx'), 'utf8');
const assessmentLib = readFileSync(resolve('src/lib/assessment.ts'), 'utf8');

const checks = [
  ['patient home exposes a primary anesthesia card', app.includes('院前麻醉评估') && app.includes('现在填写评估表')],
  ['patient mini bottom navigation keeps only home assessment and profile roots', app.includes('function MiniBottomNav') && app.includes('const miniNavItems') && app.includes('label: \'首页\'') && app.includes('label: \'评估\'') && app.includes('label: \'我的\'') && !app.includes('<span>流程</span>') && !app.includes('<span>后续</span>')],
  ['patient home uses apple watch style vertical card flow', app.includes('function FlowCardCarousel') && app.includes('flow-card-carousel') && app.includes('flow-node-card') && app.includes('is-featured')],
  ['patient pre-hospital card flow contains bowel preparation schedule', app.includes('检查前一天 18:00') && app.includes('进食低渣饮食') && app.includes('检查前一天 20:00') && app.includes('第一次口服泻药') && app.includes('检查当天 04:30') && app.includes('第二次口服泻药') && app.includes('检查当天 06:00') && app.includes('口服二甲硅油') && app.includes('严格禁食禁水')],
  ['patient detail shows a compact flow bracelet return control', app.includes('function FlowBraceletButton') && app.includes('flow-bracelet-button') && app.includes('卡片手链') && app.includes('回到卡片流')],
  ['patient detail folds notices into the node detail page instead of a separate root page', app.includes('node-detail-shell') && app.includes('detail-notice-list') && !app.includes('function MiniNotices') && !app.includes("page === 'notices'")],
  ['patient flow explains repeated reminders stop after submission', app.includes('未填写前会在院前多次提醒') && app.includes('填写后自动停止推送')],
  ['admin sidebar renames push management', app.includes('麻醉评估推送管理')],
  ['admin sidebar exposes full anesthesia backend below push management', app.includes("assessmentRecords") && app.includes('麻醉评估后台')],
  ['patient mini app keeps assessment as an in-app root page', app.includes("'assessment'") && app.includes('<AnesthesiaAssessment embedded') && app.includes("setPage('assessment')")],
  ['patient profile shows an anesthesia report card after assessment submission', app.includes("'assessmentReport'") && app.includes('function MiniAssessmentReport') && app.includes('麻醉评估报告') && app.includes('readLatestPatientAssessment') && app.includes('localStorage.getItem(assessmentStorageKey)')],
  ['admin assessment page tracks pending and completed states', app.includes('待填写评估') && app.includes('已完成评估') && app.includes('停止推送')],
  ['full anesthesia backend contains daily stats and data management tabs', app.includes('每日评估') && app.includes('数据统计') && app.includes('数据管理') && app.includes('导出 CSV')],
  ['pre-op reminder schedule contains assessment link and reason', app.includes('为什么要填麻醉评估') && app.includes('/#assessment')],
  ['styles exist for prominent assessment entry and reminder schedule', css.includes('.assessment-action-card') && css.includes('.reminder-plan-list')],
  ['assessment page can render as phone embedded patient page', assessment.includes('embedded?: boolean') && assessment.includes('assessment-embedded-root') && assessment.includes('variant=\"phone\"')],
  ['assessment automatically scrolls to submit dock when progress reaches 100 percent', assessment.includes('submitDockRef') && assessment.includes('hasAutoScrolledToSubmitRef') && assessment.includes('progressPercent !== 100') && assessment.includes("block: 'end'")],
  ['assessment page uses the new fasting hour picker sheet', assessment.includes('function HourPickerField') && assessment.includes('hour-picker-sheet')],
  ['fasting hour presets apply immediately without requiring confirm', assessment.includes('function selectPresetHour') && assessment.includes('onChange(String(hour))') && assessment.includes('setIsOpen(false)') && !assessment.includes('onClick={() => setDraftValue(String(hour))}')],
  ['assessment page gates submission with informed consent', assessment.includes('ConsentConfirmationModal') && assessment.includes('consentCountdown')],
  ['assessment page uses collapsible medical history categories', assessment.includes('expandedHistoryGroups') && assessment.includes('history-tree-chevron')],
  ['assessment keeps static-demo storage instead of Next API submission', assessment.includes("localStorage.setItem('assessmentRecords'") && !assessment.includes("fetch('api/assessment'") && !assessment.includes("fetch('/api/assessment'")],
  ['assessment library exposes medical history selection helper', assessmentLib.includes('export function hasSelectedMedicalHistory')],
  ['assessment UI supports new card descriptions and clear choices', assessmentUi.includes('description?: string') && assessmentUi.includes("tone?: 'default' | 'clear'")],
  ['styles exist for new hour picker and history tree interactions', css.includes('.hour-picker-sheet') && css.includes('.history-tree-parent')],
  ['assessment choices guard rapid repeated taps', assessmentUi.includes('CHOICE_TAP_LOCK_MS') && assessmentUi.includes('tapLockedRef') && assessmentUi.includes('handleGuardedChange')],
  ['assessment choice tap styles reduce mobile repeated-click churn', assessmentUi.includes('tap-stable-choice') && css.includes('.tap-stable-choice') && css.includes('touch-action: manipulation')],
  ['lifestyle normal choice defaults empty smoking and drinking to never without overwriting explicit risks', assessment.includes('hasExplicitLifestyleRisk') && assessment.includes("smoking: checked ? 'never' : current.smoking") && assessment.includes("drinking: checked ? 'never' : current.drinking") && assessment.includes('disabled={hasExplicitLifestyleRisk && !form.lifestyle_normal}')],
  ['lifestyle smoking and drinking controls use compact inline segmented choices', assessment.includes('lifestyle-segment-row') && assessment.includes('lifestyle-choice-compact') && css.includes('.lifestyle-segment-row') && css.includes('.lifestyle-choice-compact')],
  ['consent modal keeps actions visible while content can scroll', assessment.includes('consent-dialog') && assessment.includes('consent-scroll-area') && assessment.includes('consent-actions') && css.includes('.consent-dialog') && css.includes('max-height: min(calc(100svh - 20px), 680px)') && css.includes('.consent-scroll-area') && css.includes('max-height: calc(100svh - 132px)') && css.includes('.consent-actions') && css.includes('position: sticky')],
];

const failures = checks.filter(([, ok]) => !ok);
if (failures.length) {
  console.error('Missing expected anesthesia assessment demo features:');
  for (const [name] of failures) console.error(`- ${name}`);
  process.exit(1);
}

console.log('Anesthesia assessment demo feature checks passed.');

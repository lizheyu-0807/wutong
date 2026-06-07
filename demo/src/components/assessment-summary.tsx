import type { ReactNode } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Info, Ruler, Scale, ShieldAlert, UserRound } from 'lucide-react';
import type { AssessmentInput, AssessmentRecord } from '@/lib/assessment';
import {
  formatChineseDateTime,
  getAsaTone,
  getRiskSummary,
  hasAnyRisk,
} from '@/lib/assessment';
import { Badge, Card } from './assessment-ui';

type Props = {
  assessment: AssessmentInput | AssessmentRecord;
  compact?: boolean;
};

export function AssessmentReportView({ assessment, compact = false }: Props) {
  const summary = getRiskSummary(assessment);
  const hasRisk = hasAnyRisk(summary);
  const asa = assessment.asa_class;
  const tone = getAsaTone(asa);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-sky-700">疼痛医学科术前评估报告</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              {assessment.name || '未命名患者'} · {assessment.age || '-'}岁 ·{' '}
              {assessment.gender === 'male' ? '男' : assessment.gender === 'female' ? '女' : '-'}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {asa ? <Badge className={tone.badge}>{asa}</Badge> : null}
            {!hasRisk ? <Badge className="border-emerald-300 bg-emerald-100 text-emerald-800">评估正常</Badge> : null}
            {'is_pre_assessment' in assessment && assessment.is_pre_assessment ? (
              <Badge className="border-sky-300 bg-sky-100 text-sky-800">预评估</Badge>
            ) : null}
          </div>
        </div>
      </Card>

      <BasicInfoCard assessment={assessment} />

      <Card title="禁食禁饮情况">
        {'is_pre_assessment' in assessment && assessment.is_pre_assessment ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-bold leading-6 text-amber-900">
            当前为预约预评估，禁食禁饮情况暂未填写，请在手术当天再次确认。
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoItem label="已未吃饭" value={assessment.fasting_hours ? `${assessment.fasting_hours} 小时` : ''} />
            <InfoItem label="已未喝水" value={assessment.drinking_hours ? `${assessment.drinking_hours} 小时` : ''} />
            <InfoItem
              label="最后一次喝的是"
              value={
                assessment.drink_type === 'water'
                  ? '水（清水）'
                  : assessment.drink_type === 'milk'
                    ? '牛奶'
                    : assessment.drink_type === 'beverage'
                      ? '饮料'
                      : ''
              }
            />
          </div>
        )}
      </Card>

      {hasRisk ? (
        <Card title="需要特别关注的情况">
          <div className="space-y-3">
            <RiskBlock
              title="关键问题"
              items={summary.critical}
              className="border-red-200 bg-red-50 text-red-900"
              icon={<ShieldAlert className="h-5 w-5" />}
            />
            <RiskBlock
              title="重要问题"
              items={summary.important}
              className="border-orange-200 bg-orange-50 text-orange-950"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <RiskBlock
              title="注意事项"
              items={summary.notes}
              className="border-sky-200 bg-sky-50 text-sky-950"
              icon={<Info className="h-5 w-5" />}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-6 w-6" />
            <div>
              <h2 className="font-black">评估结果正常</h2>
              <p className="mt-1 text-sm">未发现需要特别关注的异常情况。</p>
            </div>
          </div>
        </Card>
      )}

      <Card title="备注信息">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="牙齿问题说明" value={assessment.teeth_description} />
          <InfoItem label="既往手术名称" value={assessment.surgery_name} />
          <InfoItem label="麻醉不良反应说明" value={assessment.reaction_description} />
          <InfoItem label="过敏详情" value={assessment.allergy_description} />
          <InfoItem label="每日吸烟量" value={assessment.smoking_amount ? `${assessment.smoking_amount} 支/天` : ''} />
          <InfoItem label="其他药物" value={assessment.other_med_description} />
          <InfoItem label="其他降糖药" value={assessment.diabetes_med_data.otherDescription} />
        </div>
      </Card>

      {!compact && 'created_at' in assessment ? (
        <p className="pb-4 text-center text-sm font-semibold text-slate-500">
          填写时间：{formatChineseDateTime(assessment.created_at)}
        </p>
      ) : null}
    </div>
  );
}

function BasicInfoCard({ assessment }: { assessment: AssessmentInput | AssessmentRecord }) {
  const gender = assessment.gender === 'male' ? '男' : assessment.gender === 'female' ? '女' : '-';
  const bmi = assessment.bmi || '-';

  return (
    <section className="report-basic-card">
      <div className="report-patient-identity">
        <div className="report-avatar" aria-hidden="true">
          <UserRound className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-[#2d8974]">基本信息</p>
          <div className="mt-1 flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
            <h2 className="truncate text-[24px] font-black leading-7 text-[#2f2825]">{assessment.name || '未命名患者'}</h2>
            <span className="rounded-full border border-[#f0ded0] bg-white/78 px-2.5 py-1 text-xs font-black text-[#74655d]">
              {assessment.age ? `${assessment.age} 岁` : '-'} · {gender}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#817269]">疼痛医学科术前评估身份摘要</p>
        </div>
      </div>

      <div className="report-vitals-grid">
        <VitalTile label="年龄/性别" value={`${assessment.age ? `${assessment.age} 岁` : '-'} · ${gender}`} icon={<UserRound className="h-4 w-4" />} />
        <VitalTile label="身高" value={assessment.height ? `${assessment.height} cm` : '-'} icon={<Ruler className="h-4 w-4" />} />
        <VitalTile label="体重" value={assessment.weight ? `${assessment.weight} kg` : '-'} icon={<Scale className="h-4 w-4" />} />
        <VitalTile label="BMI" value={bmi} icon={<Activity className="h-4 w-4" />} emphasis />
      </div>
    </section>
  );
}

function VitalTile({
  label,
  value,
  icon,
  emphasis = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className={`report-vital-tile ${emphasis ? 'report-vital-tile-emphasis' : ''}`}>
      <div className="report-vital-icon">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-black leading-4 text-[#817269]">{label}</p>
        <p className="mt-0.5 truncate text-base font-black leading-6 text-[#2f2825]">{value}</p>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 min-h-6 text-sm font-bold text-slate-900">{value || '-'}</p>
    </div>
  );
}

function RiskBlock({
  title,
  items,
  className,
  icon,
}: {
  title: string;
  items: string[];
  className: string;
  icon: ReactNode;
}) {
  if (items.length === 0) return null;

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <div className="mb-2 flex items-center gap-2 font-black">
        {icon}
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

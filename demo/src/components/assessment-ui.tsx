import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ComponentType,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { BarChart3, CalendarDays, ClipboardList, Database, FileText, History, QrCode } from 'lucide-react';

type CardProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  description?: string;
};

export function Card({ title, eyebrow, children, className, description }: CardProps) {
  return (
    <section
      className={clsx(
        'rounded-lg border border-[#f0ded0] bg-white/95 p-4 shadow-[0_16px_42px_rgba(80,62,45,0.08)] sm:p-5',
        className,
      )}
    >
      {title ? (
        <div className="mb-4 flex items-start gap-3">
          {eyebrow ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#ef705c] text-sm font-black text-white shadow-sm">
              {eyebrow}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-[19px] font-black leading-7 text-[#2f2825] sm:text-xl">{title}</h2>
            {description ? <p className="mt-1 text-sm font-semibold leading-5 text-[#817269]">{description}</p> : null}
          </div>
        </div>
      ) : null}
      {children}
    </section>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
  asLabel?: boolean;
};

export function Field({ label, children, hint, asLabel = true }: FieldProps) {
  const content = (
    <>
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-semibold leading-5 text-slate-500">{hint}</span> : null}
    </>
  );

  if (!asLabel) {
    return <div className="flex flex-col gap-2 text-sm font-black text-[#5f514c]">{content}</div>;
  }

  return (
    <label className="flex flex-col gap-2 text-sm font-black text-[#5f514c]">
      {content}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'min-h-[3.25rem] rounded-lg border border-[#ead9cb] bg-[#fffdfb] px-3.5 text-base font-semibold text-[#2f2825] outline-none transition placeholder:text-[#b8a79d] focus:border-[#ef705c] focus:ring-4 focus:ring-[#ffe4dc] sm:min-h-12',
        props.readOnly && 'bg-[#f6f1ec] text-[#74655d]',
        props.className,
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'min-h-28 rounded-lg border border-[#ead9cb] bg-[#fffdfb] px-3.5 py-3 text-base font-semibold text-[#2f2825] outline-none transition placeholder:text-[#b8a79d] focus:border-[#ef705c] focus:ring-4 focus:ring-[#ffe4dc] sm:min-h-24',
        props.className,
      )}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        'min-h-[3.25rem] rounded-lg border border-[#ead9cb] bg-[#fffdfb] px-3.5 text-base font-semibold text-[#2f2825] outline-none transition focus:border-[#ef705c] focus:ring-4 focus:ring-[#ffe4dc] sm:min-h-12',
        props.className,
      )}
    />
  );
}

export function Button({
  children,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ffe4dc] active:scale-[0.99] sm:min-h-11',
        variant === 'primary' && 'bg-[#ef705c] text-white shadow-lg shadow-[#ef705c]/20 hover:bg-[#dd604d]',
        variant === 'secondary' && 'border border-[#ead9cb] bg-white text-[#493f3a] shadow-sm hover:border-[#ef705c]/40 hover:bg-[#fff4ef]',
        variant === 'ghost' && 'text-[#5f514c] hover:bg-[#f8eee6]',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        props.className,
      )}
    >
      {children}
    </button>
  );
}

type ChoiceProps = {
  checked: boolean;
  label: string;
  onChange: () => void;
  disabled?: boolean;
  tone?: 'default' | 'clear';
  className?: string;
};

const CHOICE_TAP_LOCK_MS = 260;

function useGuardedChoiceChange(onChange: () => void, disabled?: boolean) {
  const tapLockedRef = useRef(false);
  const unlockTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [tapLocked, setTapLocked] = useState(false);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) {
        window.clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  function releaseTapLock() {
    tapLockedRef.current = false;
    unlockTimerRef.current = null;
    setTapLocked(false);
  }

  function handleGuardedChange() {
    if (disabled || tapLockedRef.current) return;

    tapLockedRef.current = true;
    setTapLocked(true);

    if (unlockTimerRef.current) {
      window.clearTimeout(unlockTimerRef.current);
    }

    try {
      onChange();
    } finally {
      unlockTimerRef.current = window.setTimeout(releaseTapLock, CHOICE_TAP_LOCK_MS);
    }
  }

  return { handleGuardedChange, tapLocked };
}

export function CheckboxChoice({ checked, label, onChange, disabled, tone = 'default', className }: ChoiceProps) {
  const { handleGuardedChange, tapLocked } = useGuardedChoiceChange(onChange, disabled);
  const inputDisabled = disabled || tapLocked;

  return (
    <label
      data-choice-locked={tapLocked ? 'true' : 'false'}
      className={clsx(
        'tap-stable-choice flex min-h-12 cursor-pointer select-none items-center gap-3 rounded-lg border px-3.5 py-2.5 text-[15px] font-bold leading-5 transition sm:min-h-11 sm:text-sm',
        tone === 'clear' && 'normal-clear-choice relative overflow-hidden',
        checked && tone === 'clear' && 'border-[#36a77f] bg-[#e8f8f2] text-[#0f5a43] ring-1 ring-[#aee7d4]',
        checked && tone === 'default' && 'border-[#ef705c] bg-[#fff0eb] text-[#7c2e22] ring-1 ring-[#ffd2c6]',
        !checked && tone === 'clear' && 'border-[#97dcc8] bg-[#f2fbf7] text-[#145846] shadow-[0_10px_24px_rgba(45,137,116,0.12)] hover:border-[#4fbd9f] hover:bg-[#e7f8f1]',
        !checked && tone === 'default' && 'border-[#ead9cb] bg-white text-[#5f514c] hover:border-[#ef705c]/40 hover:bg-[#fff7f2]',
        inputDisabled && 'cursor-not-allowed opacity-50 hover:border-[#ead9cb] hover:bg-white hover:shadow-none',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleGuardedChange}
        disabled={inputDisabled}
        className={clsx(
          'relative z-[1] h-5 w-5 shrink-0 sm:h-4 sm:w-4',
          tone === 'clear' ? 'accent-[#36a77f]' : 'accent-[#ef705c]',
        )}
      />
      <span className="relative z-[1]">{label}</span>
    </label>
  );
}

export function RadioChoice({ checked, label, onChange, disabled, className }: ChoiceProps) {
  const { handleGuardedChange, tapLocked } = useGuardedChoiceChange(onChange, disabled || checked);
  const inputDisabled = disabled || tapLocked;

  return (
    <label
      data-choice-locked={tapLocked ? 'true' : 'false'}
      className={clsx(
        'tap-stable-choice flex min-h-12 cursor-pointer select-none items-center gap-3 rounded-lg border px-3.5 py-2.5 text-[15px] font-bold leading-5 transition sm:min-h-11 sm:text-sm',
        checked ? 'border-[#4fbd9f] bg-[#eefaf5] text-[#135743] ring-1 ring-[#bdebdc]' : 'border-[#ead9cb] bg-white text-[#5f514c] hover:border-[#4fbd9f]/40 hover:bg-[#f4fbf8]',
        inputDisabled && 'cursor-not-allowed opacity-50 hover:border-[#ead9cb] hover:bg-white',
        className,
      )}
    >
      <input type="radio" checked={checked} onChange={handleGuardedChange} disabled={inputDisabled} className="h-5 w-5 shrink-0 accent-[#4fbd9f] sm:h-4 sm:w-4" />
      <span>{label}</span>
    </label>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold', className)}>
      {children}
    </span>
  );
}

type BottomNavActive = 'home' | 'report' | 'history' | 'qrcode' | 'daily' | 'stats' | 'manage';
type BottomNavSystem = 'patient' | 'admin';

type PageShellProps = {
  children: ReactNode;
  activeTab?: BottomNavActive;
  system?: BottomNavSystem;
  variant?: 'phone' | 'wide';
  className?: string;
};

export function PageShell({ children, activeTab, system, variant = 'wide', className }: PageShellProps) {
  const bottomNavSystem = system ?? inferBottomNavSystem(activeTab);

  return (
    <>
      <main
        className={clsx(
          'mx-auto w-full px-3 pt-3 sm:px-6 sm:pt-5',
          activeTab ? 'pb-48' : 'pb-32',
          variant === 'phone' ? 'max-w-[470px]' : 'max-w-6xl lg:px-8',
          className,
        )}
      >
        {children}
      </main>
      {activeTab ? <BottomNav active={activeTab} system={bottomNavSystem} /> : null}
    </>
  );
}

function inferBottomNavSystem(activeTab?: BottomNavActive): BottomNavSystem {
  return activeTab === 'qrcode' || activeTab === 'daily' || activeTab === 'stats' || activeTab === 'manage'
    ? 'admin'
    : 'patient';
}

function BottomNav({ active, system }: { active: BottomNavActive; system: BottomNavSystem }) {
  const patientItems: Array<{
    id: BottomNavActive;
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }> = [
    { id: 'home', href: '/', label: '评估主页', icon: ClipboardList },
    { id: 'report', href: '/report', label: '评估结果', icon: FileText },
    { id: 'history', href: '/history', label: '历史记录', icon: History },
  ];

  const adminItems: Array<{
    id: BottomNavActive;
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }> = [
    { id: 'qrcode', href: '/qrcode', label: '扫码', icon: QrCode },
    { id: 'daily', href: '/admin?tab=daily', label: '每日评估', icon: CalendarDays },
    { id: 'stats', href: '/admin?tab=stats', label: '数据统计', icon: BarChart3 },
    { id: 'manage', href: '/admin?tab=manage', label: '数据管理', icon: Database },
  ];
  const items = system === 'patient' ? patientItems : adminItems;
  const navTone = system === 'patient' ? 'patient' : 'admin';

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.7rem)]"
      aria-label={system === 'patient' ? '患者端导航' : '后台端导航'}
    >
      <div
        className={clsx(
          'bottom-nav-shell mx-auto grid max-w-[430px] gap-1.5 rounded-lg border border-[#ead9cb] bg-white/95 p-2 shadow-[0_-12px_34px_rgba(65,52,43,0.14)] backdrop-blur',
          system === 'patient' ? 'grid-cols-3' : 'grid-cols-4',
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <a
              key={item.id}
              href={item.href}
              className={clsx(
                'bottom-nav-link flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-black leading-4 transition sm:text-xs',
                isActive && navTone === 'patient' && 'bottom-nav-link-active-patient bg-[#fff0eb] text-[#ef705c] shadow-sm',
                isActive && navTone === 'admin' && 'bottom-nav-link-active-admin bg-[#eefaf5] text-[#2d8974] shadow-sm',
                !isActive && 'text-[#74655d] hover:bg-[#f8eee6]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="max-w-full whitespace-nowrap text-center">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

import { cn } from '@/lib/utils';

export function BrandNetwork({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative mx-auto aspect-[1.16/1] w-full max-w-[660px]', className)}
      aria-hidden="true"
    >
      <div className="absolute inset-[7%] rounded-full bg-blue-200/20 blur-3xl" />
      <svg
        viewBox="0 0 785 675"
        className="absolute inset-0 size-full overflow-visible"
      >
        <path
          d="M274 98 H360 Q382 98 382 120 V216"
          fill="none"
          stroke="rgb(23 105 255 / 68%)"
          strokeDasharray="3 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M652 269 V315 Q652 338 629 338 H504"
          fill="none"
          stroke="rgb(23 105 255 / 72%)"
          strokeDasharray="3 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M103 483 V381 Q103 352 132 352 H230"
          fill="none"
          stroke="rgb(97 126 183 / 44%)"
          strokeDasharray="3 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M365 471 V556 Q365 585 394 585 H466"
          fill="none"
          stroke="rgb(23 105 255 / 68%)"
          strokeDasharray="3 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <circle cx="382" cy="216" r="5" fill="#1769ff" />
        <circle cx="504" cy="338" r="5" fill="#1769ff" />
        <circle cx="230" cy="352" r="5" fill="#1769ff" />
        <circle cx="365" cy="471" r="5" fill="#1769ff" />
      </svg>

      <div className="brand-hub absolute left-[46.75%] top-[50.9%] grid h-[37.8%] w-[34.9%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[30px]">
        <div className="grid size-[62%] place-items-center rounded-full border border-blue-200/95 bg-[linear-gradient(145deg,#f8faff,#eaf1ff)] shadow-[inset_0_0_24px_rgb(23_105_255_/_8%),0_10px_26px_rgb(23_105_255_/_8%)]">
          <div className="grid size-[57%] place-items-center rounded-full border border-blue-200/90 bg-white shadow-[0_10px_24px_rgb(23_105_255_/_16%)]">
            <span className="size-[43%] rounded-full bg-[linear-gradient(145deg,#1769ff,#7796f5)] shadow-[0_7px_16px_rgb(23_105_255_/_34%)]" />
          </div>
        </div>
      </div>

      <AbstractCard className="left-[1.3%] top-[1.3%] w-[33.6%]" />
      <AbstractCard className="right-[1.4%] top-[14.5%] w-[30.6%]" muted />
      <AbstractCard className="bottom-[3.8%] left-[2.9%] w-[30.3%]" muted />
      <AbstractCard className="bottom-[1.4%] right-[10.6%] w-[30.2%]" />
    </div>
  );
}

function AbstractCard({
  className,
  muted = false,
}: {
  className: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        'brand-card absolute aspect-[1.58/1] overflow-hidden rounded-[23px] p-[clamp(0.65rem,1.2vw,1.25rem)]',
        className,
      )}
    >
      <span
        className={cn(
          'mb-[clamp(0.55rem,1vw,1rem)] block size-[clamp(0.55rem,0.9vw,0.875rem)] rounded-full shadow-[0_0_0_5px_var(--action-soft)]',
          muted ? 'bg-[#a9b8e8]' : 'bg-[var(--action)]',
        )}
      />
      <div className="flex items-center gap-[clamp(0.55rem,1.2vw,1rem)]">
        <span className="brand-card-tile size-[clamp(2rem,3.6vw,3.5rem)] shrink-0 rounded-[11px]" />
        <span className="flex min-w-0 flex-1 flex-col gap-[clamp(0.3rem,0.6vw,0.5rem)]">
          <span className="h-[clamp(0.2rem,0.38vw,0.375rem)] w-[48%] rounded-full bg-[var(--action)]" />
          <span className="h-[clamp(0.2rem,0.38vw,0.375rem)] w-[92%] rounded-full bg-slate-200/90" />
          <span className="h-[clamp(0.2rem,0.38vw,0.375rem)] w-[74%] rounded-full bg-slate-200/90" />
        </span>
      </div>
      <span className="mt-[clamp(0.55rem,1vw,1rem)] flex justify-end gap-[clamp(0.25rem,0.45vw,0.375rem)]">
        <span
          className={cn(
            'size-[clamp(0.35rem,0.55vw,0.5rem)] rounded-full',
            muted ? 'bg-[#90a5df]' : 'bg-[var(--action)]',
          )}
        />
        <span className="size-[clamp(0.35rem,0.55vw,0.5rem)] rounded-full bg-slate-200" />
        <span className="size-[clamp(0.35rem,0.55vw,0.5rem)] rounded-full bg-slate-200" />
      </span>
    </div>
  );
}

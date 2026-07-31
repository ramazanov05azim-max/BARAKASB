import { cn } from '@/lib/utils';

export function BrandNetwork({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative mx-auto aspect-[1.08/1] w-full max-w-[660px]', className)}
      aria-hidden="true"
    >
      <div className="absolute inset-[7%] rounded-full bg-blue-200/20 blur-3xl" />
      <svg
        viewBox="0 0 660 610"
        className="absolute inset-0 size-full overflow-visible"
      >
        <path
          d="M330 300 C330 192 235 192 235 130"
          fill="none"
          stroke="rgb(23 105 255 / 58%)"
          strokeDasharray="3 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M330 300 C450 300 450 154 548 154"
          fill="none"
          stroke="rgb(23 105 255 / 62%)"
          strokeDasharray="3 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M330 300 C330 430 230 430 230 500"
          fill="none"
          stroke="rgb(97 126 183 / 36%)"
          strokeDasharray="3 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M330 300 C444 300 444 484 540 484"
          fill="none"
          stroke="rgb(23 105 255 / 58%)"
          strokeDasharray="3 6"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <circle cx="330" cy="300" r="5" fill="#1769ff" />
        <circle cx="235" cy="130" r="4" fill="#1769ff" />
        <circle cx="548" cy="154" r="4" fill="#1769ff" />
        <circle cx="230" cy="500" r="4" fill="#9bb1df" />
        <circle cx="540" cy="484" r="4" fill="#1769ff" />
      </svg>

      <div className="floating-chrome absolute left-1/2 top-1/2 grid size-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[30px] border-blue-200/70 shadow-[0_30px_70px_rgb(53_91_166_/_16%)]">
        <div className="grid size-[62%] place-items-center rounded-full border border-blue-200/80 bg-blue-50/70 shadow-[inset_0_0_36px_rgb(23_105_255_/_8%)]">
          <div className="grid size-[57%] place-items-center rounded-full border border-blue-200/80 bg-white shadow-[0_12px_30px_rgb(23_105_255_/_14%)]">
            <span className="size-[43%] rounded-full bg-[linear-gradient(145deg,#1769ff,#7796f5)] shadow-[0_8px_18px_rgb(23_105_255_/_30%)]" />
          </div>
        </div>
      </div>

      <AbstractCard className="left-[2%] top-[4%]" />
      <AbstractCard className="right-0 top-[11%]" muted />
      <AbstractCard className="bottom-[2%] left-[6%]" muted />
      <AbstractCard className="bottom-[5%] right-[1%]" />
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
        'glass-panel absolute w-[40%] rounded-[23px] px-4 pb-3.5 pt-4 sm:px-5 sm:pb-4 sm:pt-5',
        className,
      )}
    >
      <span
        className={cn(
          'mb-4 block size-3.5 rounded-full shadow-[0_0_0_5px_var(--action-soft)]',
          muted ? 'bg-[#a9b8e8]' : 'bg-[var(--action)]',
        )}
      />
      <div className="flex items-center gap-4">
        <span className="soft-icon-tile size-12 shrink-0 rounded-[13px] sm:size-14" />
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="h-1.5 w-[48%] rounded-full bg-[var(--action)]" />
          <span className="h-1.5 w-[92%] rounded-full bg-slate-200/90" />
          <span className="h-1.5 w-[74%] rounded-full bg-slate-200/90" />
        </span>
      </div>
      <span className="mt-4 flex justify-end gap-1.5">
        <span
          className={cn(
            'size-2 rounded-full',
            muted ? 'bg-[#90a5df]' : 'bg-[var(--action)]',
          )}
        />
        <span className="size-2 rounded-full bg-slate-200" />
        <span className="size-2 rounded-full bg-slate-200" />
      </span>
    </div>
  );
}

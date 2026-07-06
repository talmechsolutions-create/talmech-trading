'use client';

type PrintButtonProps = {
  label?: string;
  className?: string;
};

export default function PrintButton({
  label = 'Print / Save PDF',
  className = 'btn',
}: PrintButtonProps) {
  return (
    <button className={className} type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
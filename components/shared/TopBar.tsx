'use client';
import Link from 'next/link';

interface Props {
  title?: string;
  subtitle?: string;
  back?: string;
}

export default function TopBar({ title = 'QuikTransit', subtitle, back }: Props) {
  return (
    <div className="bg-[#E8490F] text-white px-5 pt-4 pb-3 flex items-center gap-3">
      {back && (
        <Link href={back} className="text-white opacity-80 hover:opacity-100 mr-1">
          ← 
        </Link>
      )}
      <div className="flex-1">
        <h1 className="text-lg font-medium tracking-wide">{title}</h1>
        {subtitle && <p className="text-xs opacity-75 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

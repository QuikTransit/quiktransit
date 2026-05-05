import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QuikTransit — Driver',
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-sm bg-white min-h-screen flex flex-col shadow-sm">
        {children}
      </div>
    </div>
  );
}

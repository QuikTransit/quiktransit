import Link from 'next/link';

export default function Success() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">
          ✅
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h1>
        <p className="text-gray-500 text-sm mb-8">
          Thanks for reaching out! We'll get back to you as soon as possible.
        </p>
        <Link href="/">
          <div className="bg-[#E8490F] text-white rounded-xl p-4 cursor-pointer hover:bg-[#B83508] transition-colors font-medium">
            Back to Home
          </div>
        </Link>
      </div>
    </main>
  );
}
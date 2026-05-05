import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Quik<span className="text-[#E8490F]">Transit</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">On-demand rides & package delivery</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/customer">
            <div className="bg-[#E8490F] text-white rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:bg-[#B83508] transition-colors">
              <span className="text-3xl">🚗</span>
              <div>
                <div className="font-semibold text-lg">I need a ride or delivery</div>
                <div className="text-sm opacity-80">Book as a customer</div>
              </div>
            </div>
          </Link>

          <Link href="/driver">
            <div className="bg-gray-900 text-white rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-800 transition-colors">
              <span className="text-3xl">🧑‍✈️</span>
              <div>
                <div className="font-semibold text-lg">I'm a driver</div>
                <div className="text-sm opacity-70">Accept jobs & track earnings</div>
              </div>
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          (714) 292-1804 · quiktransit.com
        </p>
      </div>
    </main>
  );
}

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
        <div className="flex flex-col gap-4 mb-8">
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Contact Us</h2>
          <p className="text-sm text-gray-500 mb-4">Have a question? We'll get back to you fast.</p>
          <form name="contact" method="POST" data-netlify="true" action="/success">
            <input type="hidden" name="form-name" value="contact" />
            <div className="flex flex-col gap-3">
              <input type="text" name="name" placeholder="Your name" required className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#E8490F]" />
              <input type="tel" name="phone" placeholder="Your phone number" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#E8490F]" />
              <select name="service" required className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#E8490F] text-gray-600">
                <option value="">Type of service...</option>
                <option value="ride">Ride</option>
                <option value="package">Package Delivery</option>
                <option value="other">Other</option>
              </select>
              <textarea name="message" placeholder="Your message..." rows={3} required className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#E8490F] resize-none" />
              <button type="submit" className="bg-[#E8490F] text-white rounded-lg py-3 font-medium text-sm hover:bg-[#B83508] transition-colors">
                Send Message
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">quiktransit.com</p>
      </div>
    </main>
  );
}
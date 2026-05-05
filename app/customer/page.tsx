'use client';
import { useState, useCallback, useRef } from 'react';
import TopBar from '@/components/shared/TopBar';
import MapView from '@/components/shared/MapView';
import AddressInput from '@/components/shared/AddressInput';
import { calcFare, formatCurrency, generateId, PAYMENT_INFO, type PayMethod, type Booking, type BookingType } from '@/lib/constants';
import { getDistanceMatrix } from '@/lib/maps';

type Stage = 'form' | 'confirm' | 'tracking' | 'tip' | 'payment' | 'done';
type Tab   = 'book' | 'track' | 'history';

const TIP_OPTS = ['$1', '$2', '$3', '$5', 'None'];

export default function CustomerPage() {
  const [tab, setTab]           = useState<Tab>('book');
  const [stage, setStage]       = useState<Stage>('form');
  const [bookType, setBookType] = useState<BookingType>('ride');
  const [payMethod, setPayMethod] = useState<PayMethod>('venmo');
  const [selectedTip, setTip]   = useState('$2');
  const [customTip, setCustomTip] = useState('');

  const [fromAddr, setFromAddr] = useState('');
  const [toAddr, setToAddr]     = useState('');
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoords, setToCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [miles, setMiles]       = useState(0);
  const [minutes, setMinutes]   = useState(0);

  const [trackStep, setTrackStep] = useState(0);
  const [history, setHistory]     = useState<Booking[]>([]);
  const trackTimerRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const fare = calcFare(miles);

  const afterBothAddrs = useCallback(async (
    fCoords: { lat: number; lng: number },
    tCoords: { lat: number; lng: number },
  ) => {
    try {
      const result = await getDistanceMatrix(fCoords, tCoords);
      setMiles(result.miles);
      setMinutes(result.minutes);
    } catch {
      setMiles(Math.round((Math.random() * 16 + 2) * 10) / 10);
      setMinutes(Math.round(miles * 2.8 + 4));
    }
  }, []);

  const handleFromSelect = (addr: string, coords: { lat: number; lng: number }) => {
    setFromAddr(addr); setFromCoords(coords);
    if (toCoords) afterBothAddrs(coords, toCoords);
  };
  const handleToSelect = (addr: string, coords: { lat: number; lng: number }) => {
    setToAddr(addr); setToCoords(coords);
    if (fromCoords) afterBothAddrs(fromCoords, coords);
  };

  function getTipAmount() {
    if (customTip) return parseFloat(customTip) || 0;
    if (selectedTip === 'None') return 0;
    return parseFloat(selectedTip.replace('$', '')) || 0;
  }

  function startTracking() {
    setTrackStep(0);
    if (trackTimerRef.current) clearInterval(trackTimerRef.current);
    let step = 0;
    trackTimerRef.current = setInterval(() => {
      step++;
      setTrackStep(step);
      if (step >= 2) {
        clearInterval(trackTimerRef.current!);
        setTimeout(() => { setStage('tip'); setTab('book'); }, 1500);
      }
    }, 5000);
  }

  function confirmBooking() {
    setStage('tracking');
    setTab('track');
    startTracking();
  }

  function markPaid() {
    const tip = getTipAmount();
    const booking: Booking = {
      id: generateId(),
      type: bookType,
      status: 'complete',
      fromAddress: fromAddr,
      toAddress: toAddr,
      miles,
      minutes,
      baseFare: fare.base,
      serviceFee: fare.fee,
      tip,
      total: fare.total + tip,
      payMethod,
      createdAt: new Date().toISOString(),
    };
    setHistory(h => [booking, ...h]);
    setStage('done');
  }

  function newBooking() {
    setStage('form'); setTab('book');
    setFromAddr(''); setToAddr('');
    setFromCoords(null); setToCoords(null);
    setMiles(0); setMinutes(0);
    setTip('$2'); setCustomTip('');
  }

  const steps   = bookType === 'ride' ? ['Confirmed', 'En Route', 'Arrived'] : ['Confirmed', 'Picked Up', 'Delivered'];
  const etas    = ['~8 min', '~3 min', 'Now'];
  const payInfo = PAYMENT_INFO[payMethod];

  return (
    <div className="flex flex-col flex-1">
      <TopBar subtitle={tab === 'book' ? 'Book a ride or delivery' : tab === 'track' ? 'Your active booking' : 'Past bookings'} />

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['book','track','history'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${tab===t ? 'border-[#E8490F] text-[#E8490F]' : 'border-transparent text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── BOOK TAB ───────────────────────────────────────────── */}
        {tab === 'book' && stage === 'form' && (
          <>
            <MapView fromCoords={fromCoords} toCoords={toCoords} miles={miles} minutes={minutes} />
            <div className="p-5">
              {/* Type */}
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Type</div>
              <div className="flex gap-2 mb-4">
                {(['ride','package'] as BookingType[]).map(t => (
                  <button key={t} onClick={() => setBookType(t)}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium border transition-all ${bookType===t ? 'border-[#E8490F] bg-orange-50 text-[#993C1D]' : 'border-gray-200 text-gray-700'}`}>
                    {t === 'ride' ? '🚗 Ride' : '📦 Package'}
                  </button>
                ))}
              </div>

              {/* Addresses */}
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Pickup & Dropoff</div>
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 divide-y divide-gray-100">
                <AddressInput id="from" placeholder="Pickup address" value={fromAddr} dotColor="green"
                  onChange={setFromAddr} onPlaceSelect={handleFromSelect} />
                <AddressInput id="to" placeholder="Dropoff address" value={toAddr} dotColor="red"
                  onChange={setToAddr} onPlaceSelect={handleToSelect} />
              </div>

              {/* Estimate bar */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center mb-4">
                <span className="text-xs text-gray-500">
                  {miles > 0 ? `${miles.toFixed(1)} miles · ${minutes} min est.` : 'Enter both addresses for estimate'}
                </span>
                <span className={`font-semibold ${miles > 0 ? 'text-[#E8490F] text-xl' : 'text-gray-400'}`}>
                  {miles > 0 ? formatCurrency(fare.total) : '—'}
                </span>
              </div>

              {/* Customer info */}
              {bookType === 'ride' ? (
                <>
                  <input placeholder="Your name" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-[#E8490F]" />
                  <input placeholder="Phone number" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-[#E8490F]" />
                </>
              ) : (
                <>
                  <input placeholder="Recipient name" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-[#E8490F]" />
                  <textarea placeholder="Package notes (size, fragile, etc.)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-[#E8490F] h-16 resize-none" />
                </>
              )}

              {/* Payment */}
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Payment method</div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {(Object.entries(PAYMENT_INFO) as [PayMethod, typeof PAYMENT_INFO[PayMethod]][]).map(([k, v]) => (
                  <button key={k} onClick={() => setPayMethod(k)}
                    className={`border rounded-lg py-2.5 px-2 text-center transition-all ${payMethod===k ? 'border-[#E8490F] border-2' : 'border-gray-200'}`}>
                    <div className="text-lg mb-0.5">{v.emoji}</div>
                    <div className="text-xs font-medium text-gray-800">{v.name}</div>
                    <div className="text-xs text-gray-400 truncate">{v.handle}</div>
                  </button>
                ))}
              </div>

              <button disabled={!fromAddr || !toAddr || miles <= 0} onClick={() => setStage('confirm')}
                className="w-full bg-[#E8490F] text-white rounded-lg py-3.5 font-medium text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#B83508] transition-colors">
                {fromAddr && toAddr && miles > 0 ? 'Review Booking →' : 'Enter addresses to continue'}
              </button>
            </div>
          </>
        )}

        {tab === 'book' && stage === 'confirm' && (
          <>
            <MapView fromCoords={fromCoords} toCoords={toCoords} miles={miles} minutes={minutes} />
            <div className="p-5">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Trip summary</div>
              <div className="text-sm text-gray-600 mb-4 leading-relaxed">
                <span className="font-medium text-gray-900">From:</span> {fromAddr}<br/>
                <span className="font-medium text-gray-900">To:</span> {toAddr}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{miles.toFixed(1)} miles · {minutes} min</span><span>—</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                  <span>Estimated total</span><span>{formatCurrency(fare.total)}</span>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Paying with</div>
              <div className="flex items-center gap-3 border-2 border-[#E8490F] rounded-lg p-3 mb-4">
                <span className="text-xl">{payInfo.emoji}</span>
                <div>
                  <div className="font-medium text-sm">{payInfo.name}</div>
                  <div className="text-xs text-gray-500">{payInfo.handle}</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-4 leading-relaxed">
                Final fare is based on actual miles driven. You can add a tip after your {bookType}.
              </p>
              <button onClick={confirmBooking} className="w-full bg-[#E8490F] text-white rounded-lg py-3.5 font-medium mb-2 hover:bg-[#B83508] transition-colors">
                Confirm Booking
              </button>
              <button onClick={() => setStage('form')} className="w-full border border-gray-200 rounded-lg py-3 text-sm text-gray-600 hover:bg-gray-50">
                ← Edit Details
              </button>
            </div>
          </>
        )}

        {tab === 'book' && stage === 'tip' && (
          <div className="p-5">
            <div className="border border-gray-200 rounded-xl p-4 mb-4">
              <div className="font-medium text-base mb-1">Trip complete! 🎉</div>
              <div className="text-sm text-gray-500 mb-4">Add a tip for your driver?</div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {TIP_OPTS.map(t => (
                  <button key={t} onClick={() => { setTip(t); setCustomTip(''); }}
                    className={`rounded-lg py-2 text-sm font-medium border transition-all ${selectedTip===t && !customTip ? 'border-[#E8490F] border-2 text-[#E8490F] bg-orange-50' : 'border-gray-200 text-gray-700'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 flex-shrink-0">Custom:</span>
                <input type="number" placeholder="$0.00" min="0" step="0.50"
                  onChange={e => { setCustomTip(e.target.value); setTip(''); }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8490F]" />
              </div>
            </div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Your total</div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Trip fare</span><span>{formatCurrency(fare.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tip</span><span>{formatCurrency(getTipAmount())}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                <span>Total to send</span><span>{formatCurrency(fare.total + getTipAmount())}</span>
              </div>
            </div>
            <button onClick={() => setStage('payment')} className="w-full bg-[#E8490F] text-white rounded-lg py-3.5 font-medium hover:bg-[#B83508] transition-colors">
              Continue to Payment →
            </button>
          </div>
        )}

        {tab === 'book' && stage === 'payment' && (
          <div className="p-5">
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl mx-auto mb-3">✅</div>
              <div className="text-xl font-medium mb-1">Send payment</div>
              <div className="text-sm text-gray-500">Open {payInfo.name} and send the amount below.</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Send via</div>
              <div className="text-base font-medium">{payInfo.emoji} {payInfo.name}</div>
              <div className="text-sm text-[#E8490F] mb-2">{payInfo.handle}</div>
              <div className="text-3xl font-semibold">{formatCurrency(fare.total + getTipAmount())}</div>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Note: <strong className="font-medium">QuikTransit – {bookType === 'ride' ? 'Ride' : 'Delivery'}</strong>
            </p>
            <button onClick={markPaid} className="w-full bg-[#E8490F] text-white rounded-lg py-3.5 font-medium mb-2 hover:bg-[#B83508] transition-colors">
              I&apos;ve sent payment ✓
            </button>
            <button onClick={() => setStage('tip')} className="w-full border border-gray-200 rounded-lg py-3 text-sm text-gray-600">
              ← Change tip
            </button>
          </div>
        )}

        {tab === 'book' && stage === 'done' && (
          <div className="p-5">
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl mx-auto mb-3">🎉</div>
              <div className="text-xl font-medium mb-1">All done!</div>
              <div className="text-sm text-gray-500">Thanks for using QuikTransit. Your receipt is saved.</div>
            </div>
            <button onClick={newBooking} className="w-full bg-[#E8490F] text-white rounded-lg py-3.5 font-medium mb-2 hover:bg-[#B83508] transition-colors">
              Book Another
            </button>
            <button onClick={() => setTab('history')} className="w-full border border-gray-200 rounded-lg py-3 text-sm text-gray-600">
              View History
            </button>
          </div>
        )}

        {/* ── TRACK TAB ──────────────────────────────────────────── */}
        {tab === 'track' && stage !== 'tracking' && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 pt-16">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-sm leading-relaxed">No active booking.<br/>Book a ride or delivery to track it here.</p>
          </div>
        )}

        {tab === 'track' && stage === 'tracking' && (
          <>
            <div className="relative" style={{ height: 180 }}>
              <MapView fromCoords={fromCoords} toCoords={toCoords} height={180} />
              <div className="absolute top-2 right-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-medium text-[#E8490F]">
                ● Live
              </div>
            </div>
            <div className="p-5">
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                <div className="bg-[#E8490F] text-white px-4 py-3 flex justify-between items-center">
                  <div>
                    <div className="text-xs opacity-75 mb-0.5">Estimated {bookType === 'ride' ? 'arrival' : 'delivery'}</div>
                    <div className="text-xl font-medium">{etas[trackStep]}</div>
                  </div>
                  <div className="text-xs opacity-80">{miles.toFixed(1)} mi</div>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1 ${i < trackStep ? 'bg-[#E8490F] text-white' : i === trackStep ? 'border-2 border-[#E8490F] text-[#E8490F] font-medium' : 'bg-gray-100 text-gray-400'}`}>
                            {i < trackStep ? '✓' : i + 1}
                          </div>
                          <div className={`text-xs ${i <= trackStep ? 'text-[#E8490F] font-medium' : 'text-gray-400'}`}>{s}</div>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`h-px flex-1 mb-4 ${i < trackStep ? 'bg-[#E8490F]' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-medium text-[#993C1D] flex-shrink-0">MR</div>
                    <div>
                      <div className="font-medium text-sm">Marcus R.</div>
                      <div className="text-xs text-gray-500">⭐ 4.97 · Toyota Camry · White</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => alert('Calling (714) 292-1804...')} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm">📞 Call</button>
                    <button onClick={() => alert('Message sent!')} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm">💬 Message</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── HISTORY TAB ────────────────────────────────────────── */}
        {tab === 'history' && history.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 pt-16">
            <div className="text-4xl mb-3">🧾</div>
            <p className="text-sm leading-relaxed">No past bookings yet.<br/>Your receipts will appear here.</p>
          </div>
        )}
        {tab === 'history' && history.length > 0 && (
          <div className="p-5 divide-y divide-gray-100">
            {history.map(b => (
              <div key={b.id} className="flex justify-between items-center py-3">
                <div>
                  <div className="text-xs text-gray-400 uppercase">{b.type} · {b.miles.toFixed(1)} mi · {PAYMENT_INFO[b.payMethod].name}</div>
                  <div className="text-sm text-gray-800 my-0.5">Marcus R.</div>
                  <div className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})} at {new Date(b.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(b.total)}</div>
                  {b.tip > 0 && <div className="text-xs text-green-600">incl. {formatCurrency(b.tip)} tip</div>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

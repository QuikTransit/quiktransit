'use client';
import { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/constants';
import { listenForPendingBookings, updateBookingStatus } from '@/lib/bookings';
type Tab = 'requests' | 'active' | 'earnings' | 'history';

interface Request {
  id: string;
  type: 'ride' | 'package';
  name: string;
  from: string;
  to: string;
  miles: string;
  eta: string;
  earn: number;
}

interface CompletedJob extends Request {
  completedAt: string;
}

const SAMPLE_REQUESTS: Request[] = [
  { id:'1', type:'ride',    name:'Marcus T.',          from:'2210 E Lincoln Ave, Anaheim',    to:'8001 Beach Blvd, Buena Park',      miles:'4.2 mi', eta:'6 min', earn:14.50 },
  { id:'2', type:'package', name:'Package for Sarah M.',from:'QuikTransit Hub, Irvine',       to:'3344 Alton Pkwy, Irvine',          miles:'2.8 mi', eta:'4 min', earn:9.75  },
  { id:'3', type:'ride',    name:'Jennifer L.',         from:'John Wayne Airport (SNA)',       to:'1 Disneyland Dr, Anaheim',         miles:'7.1 mi', eta:'3 min', earn:22.00 },
  { id:'4', type:'package', name:'Package for David K.',from:'QuikTransit Hub, Santa Ana',    to:'555 N Harbor Blvd, Fullerton',     miles:'5.5 mi', eta:'8 min', earn:13.25 },
];

const WEEK_DAYS    = ['M','T','W','T','F','S','S'];
const WEEK_SEED    = [42, 87, 63, 110, 95, 78, 0];

export default function DriverPage() {
  const [tab, setTab]           = useState<Tab>('requests');
  const [online, setOnline]     = useState(true);
  const [requests, setRequests] = useState<Request[]>(SAMPLE_REQUESTS.slice(0, 2));
  const [activeJob, setActiveJob] = useState<Request | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted]   = useState<CompletedJob[]>([]);
  const [earned, setEarned]   = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [onlineMs, setOnlineMs] = useState(0);
  const [weekEarns, setWeekEarns] = useState(WEEK_SEED);
  const reqTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineStart = useRef(Date.now());

  useEffect(() => {
  if (!online) return;
  const unsubscribe = listenForPendingBookings((firebaseBookings) => {
    const mapped = firebaseBookings.map(b => ({
      id: b.id || '',
      type: b.type,
      name: b.type === 'ride' ? 'Customer Ride' : 'Package Delivery',
      from: b.fromAddress,
      to: b.toAddress,
      miles: `${b.miles} mi`,
      eta: `${b.minutes} min`,
      earn: b.total,
    }));
    setRequests(mapped);
  });
  return () => unsubscribe();
}, [online]);
  useEffect(() => {
    const t = setInterval(() => setOnlineMs(Date.now() - onlineStart.current), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!online) { clearTimeout(reqTimerRef.current!); return; }
    scheduleRequest();
    return () => clearTimeout(reqTimerRef.current!);
  }, [online, requests]);

  function scheduleRequest() {
    clearTimeout(reqTimerRef.current!);
    if (requests.length >= 2) return;
    reqTimerRef.current = setTimeout(() => {
      const pool = SAMPLE_REQUESTS.filter(r => !requests.find(p => p.id === r.id));
      if (pool.length > 0) {
        setRequests(prev => [...prev, pool[Math.floor(Math.random() * pool.length)]]);
      }
    }, 9000);
  }

  function acceptJob(r: Request) {
    setActiveJob(r);
    setActiveStep(0);
    setRequests(prev => prev.filter(p => p.id !== r.id));
    setTab('active');
  }

  function declineJob(id: string) {
    setRequests(prev => prev.filter(r => r.id !== id));
  }

  function nextStep() {
    if (!activeJob) return;
    if (activeStep < 2) {
      setActiveStep(s => s + 1);
    } else {
      const job: CompletedJob = { ...activeJob, completedAt: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) };
      setCompleted(prev => [job, ...prev]);
      setEarned(e => Math.round((e + activeJob.earn) * 100) / 100);
      setJobCount(c => c + 1);
      setWeekEarns(prev => { const n=[...prev]; n[6]=Math.round((n[6]+activeJob.earn)*100)/100; return n; });
      setActiveJob(null);
      setActiveStep(0);
      setTab('requests');
    }
  }

  const onlineH   = Math.floor(onlineMs / 3600000);
  const onlineMin = Math.floor((onlineMs % 3600000) / 60000);
  const steps     = activeJob?.type==='ride' ? ['En Route','Picked Up','Arrived'] : ['En Route','Collected','Delivered'];
  const maxEarn   = Math.max(...weekEarns, 1);
  const weekTotal = weekEarns.reduce((a,b) => a+b, 0);

  return (
    <div className="flex flex-col flex-1">
      {/* Topbar */}
      <div className="bg-[#E8490F] text-white px-5 pt-4 pb-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-medium">QuikTransit Driver</h1>
          <button onClick={() => setOnline(o => !o)}
            className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-white/50'}`} />
            {online ? 'Online' : 'Offline'}
          </button>
        </div>
        <p className="text-xs opacity-75 mt-1">{online ? 'Ready for requests' : 'Go online to receive requests'}</p>
      </div>

      {/* Stats */}
      <div className="flex border-b border-gray-100 bg-gray-50">
        {[
          { val: formatCurrency(earned), label: 'Today' },
          { val: String(jobCount), label: 'Trips' },
          { val: `${onlineH}h ${onlineMin}m`, label: 'Online' },
        ].map(s => (
          <div key={s.label} className="flex-1 text-center py-2.5">
            <div className="font-medium text-sm">{s.val}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['requests','active','earnings','history'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors ${tab===t ? 'border-[#E8490F] text-[#E8490F]' : 'border-transparent text-gray-400'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* Requests */}
        {tab === 'requests' && !online && (
          <div className="text-center text-gray-400 pt-12">
            <div className="text-4xl mb-3">⏸</div>
            <p className="text-sm">You&apos;re offline.<br/>Go online to receive requests.</p>
          </div>
        )}
        {tab === 'requests' && online && requests.length === 0 && (
          <div className="text-center text-gray-400 pt-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">Looking for nearby requests...<br/>Stay online to receive jobs.</p>
          </div>
        )}
        {tab === 'requests' && online && requests.map(r => (
          <div key={r.id} className="border border-gray-200 rounded-xl mb-3 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.type==='ride' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                {r.type === 'ride' ? '🚗 Ride' : '📦 Package'}
              </span>
              <span className="text-lg font-semibold">{formatCurrency(r.earn)}</span>
            </div>
            <div className="px-4 py-3">
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 border-2 border-green-600 flex-shrink-0" />
                  {r.from}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-400 border-2 border-red-600 flex-shrink-0" />
                  {r.to}
                </div>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>📍 {r.miles}</span>
                <span>⏱ {r.eta} away</span>
                {r.type === 'ride' && <span>⭐ 4.9</span>}
              </div>
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
              <button onClick={() => acceptJob(r)} className="flex-1 bg-[#E8490F] text-white rounded-lg py-2 text-sm font-medium">Accept</button>
              <button onClick={() => declineJob(r.id)} className="w-20 border border-gray-200 rounded-lg py-2 text-sm text-gray-600">Decline</button>
            </div>
          </div>
        ))}

        {/* Active */}
        {tab === 'active' && !activeJob && (
          <div className="text-center text-gray-400 pt-12">
            <div className="text-4xl mb-3">🚗</div>
            <p className="text-sm">No active job.<br/>Accept a request to get started.</p>
          </div>
        )}
        {tab === 'active' && activeJob && (
          <div className="border-2 border-[#E8490F] rounded-xl p-4">
            <div className="text-xs font-medium text-[#E8490F] tracking-wider mb-1">ACTIVE JOB</div>
            <div className="font-medium text-base mb-0.5">{activeJob.name}</div>
            <div className="text-sm text-gray-500 mb-4">{activeStep === 0 ? activeJob.from : activeJob.to}</div>
            <div className="flex items-center mb-4">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1 ${i < activeStep ? 'bg-[#E8490F] text-white' : i === activeStep ? 'border-2 border-[#E8490F] text-[#E8490F] font-medium' : 'bg-gray-100 text-gray-400'}`}>
                      {i < activeStep ? '✓' : i + 1}
                    </div>
                    <div className={`text-xs ${i <= activeStep ? 'text-[#E8490F] font-medium' : 'text-gray-400'}`}>{s}</div>
                  </div>
                  {i < steps.length - 1 && <div className={`h-px flex-1 mb-4 ${i < activeStep ? 'bg-[#E8490F]' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(activeStep===0?activeJob.from:activeJob.to)}`, '_blank')}
                className="flex-1 bg-[#E8490F] text-white rounded-lg py-2.5 text-sm font-medium">
                🗺 Navigate
              </button>
              <button onClick={nextStep} className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-700">
                {activeStep < 2 ? `Mark: ${steps[activeStep + 1] || ''}` : 'Complete Job ✓'}
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
              <span className="font-medium text-gray-800">Dropoff:</span> {activeJob.to}<br/>
              <span className="font-medium text-gray-800">Earnings:</span> {formatCurrency(activeJob.earn)}
            </div>
          </div>
        )}

        {/* Earnings */}
        {tab === 'earnings' && (
          <>
            <div className="mb-5">
              <div className="text-xs text-gray-400 mb-1">This week</div>
              <div className="text-4xl font-semibold">{formatCurrency(weekTotal)}</div>
              <div className="text-sm text-gray-500 mt-1">{jobCount} trips · {formatCurrency(weekTotal / Math.max(jobCount + 7, 1))}/trip avg</div>
            </div>
            <div className="space-y-2 mb-5">
              {weekEarns.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-gray-400 text-xs">{WEEK_DAYS[i]}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#E8490F] rounded-full" style={{ width: `${Math.round((v/maxEarn)*100)}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs font-medium">{v > 0 ? formatCurrency(v) : '—'}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rides</span>
                <span className="font-medium">{formatCurrency(Math.round(weekTotal * 0.62 * 100)/100)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Packages</span>
                <span className="font-medium">{formatCurrency(Math.round(weekTotal * 0.38 * 100)/100)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-500">Tips</span>
                <span className="font-medium text-green-600">+ {formatCurrency(Math.round(jobCount * 2.4 * 100)/100)}</span>
              </div>
            </div>
          </>
        )}

        {/* History */}
        {tab === 'history' && completed.length === 0 && (
          <div className="text-center text-gray-400 pt-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No completed jobs yet.<br/>Accept requests to build your history.</p>
          </div>
        )}
        {tab === 'history' && completed.map(j => (
          <div key={j.id} className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <div className="text-xs text-gray-400 uppercase">{j.type}</div>
              <div className="text-sm font-medium">{j.name}</div>
              <div className="text-xs text-gray-400">{j.completedAt} · {j.miles}</div>
            </div>
            <div className="font-medium">{formatCurrency(j.earn)}</div>
          </div>
        ))}

      </div>
    </div>
  );
}

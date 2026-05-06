const fs = require('fs');
let c = fs.readFileSync('app/customer/page.tsx', 'utf8');

// 1. Add DEMO constant after TIP_OPTS
c = c.replace(
  "const TIP_OPTS = ['$1', '$2', '$3', '$5', 'None'];",
  "const TIP_OPTS = ['$1', '$2', '$3', '$5', 'None'];\nconst DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';"
);

// 2. Add demo banner before TopBar
c = c.replace(
  `      <TopBar subtitle={tab === 'book' ? 'Book a ride or delivery' : tab === 'track' ? 'Your active booking' : 'Past bookings'} />`,
  `      {DEMO && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 text-center">
          🚧 Demo mode — no real rides are dispatched
        </div>
      )}
      <TopBar subtitle={tab === 'book' ? 'Book a ride or delivery' : tab === 'track' ? 'Your active booking' : 'Past bookings'} />`
);

// 3. Add DEMO auto-advance before listenToBooking
c = c.replace(
  `  listenToBooking(id, (booking) => {`,
  `  if (DEMO) {
    setTimeout(() => setTrackStep(1), 3000);
    setTimeout(() => setTrackStep(2), 6000);
    setTimeout(() => { setStage('tip'); setTab('book'); }, 9000);
    return;
  }

  listenToBooking(id, (booking) => {`
);

// 4. Hide payment handle in demo mode
c = c.replace(
  `              <div className="text-sm text-[#E8490F] mb-2">{payInfo.handle}</div>`,
  `              {DEMO ? (
                <div className="text-sm text-gray-400 italic mb-2">Contact us to arrange payment</div>
              ) : (
                <div className="text-sm text-[#E8490F] mb-2">{payInfo.handle}</div>
              )}`
);

fs.writeFileSync('app/customer/page.tsx', c);
console.log('✅ All changes applied successfully!');
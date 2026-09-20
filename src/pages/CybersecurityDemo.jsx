import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useState } from 'react';
import { ShieldAlert, RefreshCw, Hash, Timer, Cpu, Copy, CheckCircle2, XCircle } from 'lucide-react';

const DEMO_TESTS = [
  {
    id: 'replay',
    icon: RefreshCw,
    title: 'Replay Attack',
    description: 'Submit the same signed transaction twice.',
    attack: 'TX-2026-001 submitted a second time with identical signature and nonce.',
    expectedResult: 'BLOCKED',
    reason: 'Duplicate transaction ID and nonce detected on server.',
    color: 'var(--color-red-500)',
  },
  {
    id: 'invalid-sig',
    icon: ShieldAlert,
    title: 'Invalid Signature',
    description: 'Modify transaction amount after signing.',
    attack: 'Amount changed from Rs. 200 to Rs. 2000 — signature now invalid.',
    expectedResult: 'BLOCKED',
    reason: 'ECDSA P-256 signature verification failed — payload was tampered with.',
    color: 'var(--color-red-500)',
  },
  {
    id: 'duplicate',
    icon: Copy,
    title: 'Duplicate Transaction',
    description: 'Send two transactions with the same ID.',
    attack: 'Two transactions created with identical transaction IDs.',
    expectedResult: 'BLOCKED',
    reason: 'Transaction ID already exists in ledger.',
    color: 'var(--color-red-500)',
  },
  {
    id: 'expired-auth',
    icon: Timer,
    title: 'Expired Authorization',
    description: 'Use an offline authorization that has expired.',
    attack: 'Transaction created with authorization expired 2 hours ago.',
    expectedResult: 'BLOCKED',
    reason: 'Offline authorization has expired. Server rejected transaction.',
    color: 'var(--color-amber-500)',
  },
  {
    id: 'invalid-counter',
    icon: Hash,
    title: 'Invalid Counter',
    description: 'Submit a transaction with a lower counter value than expected.',
    attack: 'Device counter is 10 but transaction counter is 5.',
    expectedResult: 'BLOCKED',
    reason: 'Counter regression detected — possible replay or out-of-order transaction.',
    color: 'var(--color-amber-500)',
  },
  {
    id: 'revoked-device',
    icon: Cpu,
    title: 'Revoked Device',
    description: 'Attempt a transaction from a revoked device.',
    attack: 'Transaction signed by DEVICE-REVOKED-001 which was revoked 1 hour ago.',
    expectedResult: 'BLOCKED',
    reason: 'Device is marked as REVOKED. All transactions from this device are rejected.',
    color: 'var(--color-red-500)',
  },
];

function CybersecurityDemo() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const runTest = async (testId) => {
    setLoading(prev => ({ ...prev, [testId]: true }));
    // Simulate test running
    await new Promise(r => setTimeout(r, 1500));
    setLoading(prev => ({ ...prev, [testId]: false }));
    setResults(prev => ({ ...prev, [testId]: 'done' }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-[var(--color-gray-900)]">Security Testing Panel</h1>
            <span className="badge badge-rejected text-xs">DEMO ONLY</span>
          </div>
          <p className="text-[var(--color-gray-500)] text-sm">
            Educational cybersecurity demonstration — Attack → Detection → Result.
          </p>
        </div>

        <div
          className="p-4 rounded-xl text-sm"
          style={{ background: 'var(--color-amber-100)', color: 'var(--color-amber-700)' }}
        >
          ⚠️ This panel is for educational demonstration only. These tests simulate attack scenarios and show how the system detects and blocks them.
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {DEMO_TESTS.map(test => {
            const done = results[test.id] === 'done';
            const isLoading = loading[test.id];
            return (
              <Card key={test.id} padding>
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${test.color}15` }}
                  >
                    <test.icon size={20} style={{ color: test.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-gray-800)]">{test.title}</h3>
                    <p className="text-xs text-[var(--color-gray-500)] mt-0.5">{test.description}</p>
                  </div>
                </div>

                {done ? (
                  <div className="space-y-2 animate-fade-in">
                    <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--color-gray-50)' }}>
                      <p className="font-semibold text-[var(--color-gray-600)] mb-1">⚔️ Attack:</p>
                      <p className="text-[var(--color-gray-500)]">{test.attack}</p>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--color-red-100)' }}>
                      <XCircle size={14} color="var(--color-red-500)" />
                      <span className="text-xs font-bold text-[var(--color-red-600)]">Result: {test.expectedResult}</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'var(--color-emerald-100)' }}>
                      <CheckCircle2 size={14} color="var(--color-emerald-600)" className="flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-[var(--color-emerald-700)]">{test.reason}</span>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    block
                    loading={isLoading}
                    onClick={() => runTest(test.id)}
                    id={`test-${test.id}`}
                  >
                    {isLoading ? 'Running Test...' : `Simulate ${test.title}`}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
export default CybersecurityDemo;

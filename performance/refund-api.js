import http from 'k6/http';
import { check } from 'k6';

const profiles = {
  smoke: { vus: 1, iterations: 5 },
  baseline: { vus: 3, duration: '15s' },
  load: { vus: 10, duration: '30s' },
};

const profileName = __ENV.K6_PROFILE || 'smoke';
const profile = profiles[profileName];
if (!profile) throw new Error(`Unknown K6_PROFILE: ${profileName}`);

export const options = {
  ...profile,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:4173';

function jsonOrNull(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export default function () {
  const health = http.get(`${baseUrl}/health`, { tags: { endpoint: 'health' } });
  check(health, { 'health returns 200': (response) => response.status === 200 });

  const order = http.get(`${baseUrl}/api/order`, { tags: { endpoint: 'order' } });
  check(order, {
    'order returns 200': (response) => response.status === 200,
    'financial invariant is preserved': (response) => {
      const body = jsonOrNull(response);
      return body !== null && body.refunded + body.refundableRemaining === body.paid;
    },
  });

  const refunds = http.get(`${baseUrl}/api/refunds`, { tags: { endpoint: 'refunds' } });
  check(refunds, {
    'refund history returns 200': (response) => response.status === 200,
    'refund history is an array': (response) => Array.isArray(jsonOrNull(response)),
  });
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify({ profile: profileName, metrics: data.metrics }, null, 2),
    'evidence/raw/k6-summary.json': JSON.stringify({ profile: profileName, generatedAt: new Date().toISOString(), ...data }, null, 2),
  };
}

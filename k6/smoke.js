// k6 - Estágio 1: Smoke Test
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/products?page=1&pageSize=10`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'tem data': (r) => r.json('data') !== undefined,
  });
  sleep(1);
}

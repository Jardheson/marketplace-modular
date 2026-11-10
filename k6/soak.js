// k6 - Estágio 3: Soak Test
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '5m', target: 50 }, // sobe para 50 VUs
    { duration: '30m', target: 50 }, // permanece 30 min
    { duration: '5m', target: 0 },   // desce
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/products?page=1&pageSize=20`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}

// k6 - Estágio 2: Stress Test
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // ramp-up
    { duration: '3m', target: 100 }, // pico
    { duration: '2m', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/products?page=1&pageSize=20`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}

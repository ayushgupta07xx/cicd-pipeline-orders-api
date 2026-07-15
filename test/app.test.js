const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

function request(path) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app).listen(0, () => {
      const { port } = server.address();
      http.get({ host: '127.0.0.1', port, path }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => { server.close(); resolve({ status: res.statusCode, body }); });
      }).on('error', (e) => { server.close(); reject(e); });
    });
  });
}

test('health returns ok', async () => {
  const r = await request('/health');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(JSON.parse(r.body).status, 'ok');
});

test('ready returns ready', async () => {
  const r = await request('/ready');
  assert.strictEqual(r.status, 200);
});

test('build-info exposes artifact and runtime identity', async () => {
  const r = await request('/api/build-info');
  const d = JSON.parse(r.body);
  for (const k of ['build_number', 'git_commit', 'git_branch', 'app_version']) assert.ok(k in d.build);
  for (const k of ['environment', 'cluster', 'namespace', 'pod']) assert.ok(k in d.runtime);
});

test('metrics endpoint exposes prometheus exposition format', async () => {
  const r = await request('/metrics');
  assert.strictEqual(r.status, 200);
  assert.match(r.body, /app_build_info/);
  assert.match(r.body, /http_requests_total|process_cpu/);
});

test('orders endpoint returns a list', async () => {
  const r = await request('/api/orders');
  assert.ok(Array.isArray(JSON.parse(r.body).orders));
});

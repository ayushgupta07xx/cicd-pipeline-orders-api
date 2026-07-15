const express = require('express');
const client = require('prom-client');

const BUILD = {
  build_number: process.env.BUILD_NUMBER || 'local',
  git_commit: process.env.GIT_COMMIT || 'unknown',
  git_branch: process.env.GIT_BRANCH || 'unknown',
  build_time: process.env.BUILD_TIME || 'unknown',
  app_version: process.env.APP_VERSION || '0.0.0',
};
const STARTED_AT = new Date();

const registry = new client.Registry();
registry.setDefaultLabels({
  app: 'orders-api',
  environment: process.env.APP_ENV || 'local',
  cluster: process.env.CLUSTER_NAME || 'none',
});
client.collectDefaultMetrics({ register: registry });

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [registry],
});
const buildInfo = new client.Gauge({
  name: 'app_build_info',
  help: 'Build metadata (always 1); labels carry the artifact identity',
  labelNames: ['build_number', 'commit', 'branch', 'version'],
  registers: [registry],
});
buildInfo.labels(BUILD.build_number, BUILD.git_commit.slice(0, 7), BUILD.git_branch, BUILD.app_version).set(1);

const app = express();

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const labels = { method: req.method, route, status: res.statusCode };
    httpRequests.inc(labels);
    end(labels);
  });
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/ready', (_req, res) => res.json({ status: 'ready' }));

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});

app.get('/api/orders', (_req, res) =>
  res.json({ orders: [{ id: 'ORD-1001', status: 'settled' }, { id: 'ORD-1002', status: 'pending' }] })
);

app.get('/api/build-info', (_req, res) =>
  res.json({
    build: BUILD,
    runtime: {
      environment: process.env.APP_ENV || 'local',
      cluster: process.env.CLUSTER_NAME || 'none',
      namespace: process.env.POD_NAMESPACE || 'none',
      pod: process.env.POD_NAME || require('os').hostname(),
      started_at: STARTED_AT.toISOString(),
      uptime_seconds: Math.floor((Date.now() - STARTED_AT.getTime()) / 1000),
    },
  })
);

module.exports = app;

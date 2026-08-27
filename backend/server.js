import {config} from 'dotenv';
import express from 'express';
import {createProxyMiddleware} from 'http-proxy-middleware';

config({path: new URL('../.env', import.meta.url)});

const {
    PORT = 8080,
    TARGET_URL,
    AUTH_HEADER_NAME = 'Authorization',
    AUTH_HEADER_VALUE,
} = process.env;

if (!TARGET_URL) {
    console.error('Missing TARGET_URL in .env (the real server to forward requests to).');
    process.exit(1);
}
if (!AUTH_HEADER_VALUE) {
    console.error('Missing AUTH_HEADER_VALUE in .env (the auth header value to inject).');
    process.exit(1);
}

const app = express();

// Answer CORS preflights here instead of forwarding them: a JSON POST from the
// frontend sends one, and the upstream does not reply with the
// Allow-Methods / Allow-Headers it needs. Scoped to OPTIONS so the proxyRes
// hook below stays the only place that sets Access-Control-Allow-Origin on a
// real response.
app.options('*', (req, res) => {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers'] ?? '*');
    res.setHeader('access-control-max-age', '86400');
    res.sendStatus(204);
});

app.use(createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    on: {
        proxyReq: (req) => {
            req.setHeader(AUTH_HEADER_NAME, AUTH_HEADER_VALUE);
        },
        // Mutate the upstream headers instead of calling res.setHeader: they are
        // copied onto the response after this hook runs, so an upstream
        // Access-Control-Allow-Origin would otherwise overwrite ours.
        proxyRes: (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
        },
    },
    logger: console,
}));

app.listen(PORT, () => {
    console.log(`auth-injector listening on :${PORT} -> ${TARGET_URL}`);
});

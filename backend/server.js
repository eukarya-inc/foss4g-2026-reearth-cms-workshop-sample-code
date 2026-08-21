import {config} from 'dotenv';
import express from 'express';
import {createProxyMiddleware} from 'http-proxy-middleware';

config({path: new URL('.env', import.meta.url)});

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

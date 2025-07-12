const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const TARGET = process.env.EXIST_PROXY_TARGET || 'http://localhost:8080';
const PORT = process.env.PORT || 3001;

const app = new Koa();
app.use(cors());
app.use(bodyParser());

const router = new Router();

function isValidExistURL(url) {
  try {
    const u = new URL(url);
    return u.pathname.includes('exist') || u.hostname.includes('exist');
  } catch (e) {
    return false;
  }
}

router.post('/proxy', async (ctx) => {
  const { url, path, method = 'GET', params, headers, body } = ctx.request.body;
  const base = url && isValidExistURL(url) ? url : TARGET;
  if (!isValidExistURL(base)) {
    ctx.status = 400;
    ctx.body = 'Invalid target';
    return;
  }
  let dest = base;
  if (path) dest += path.startsWith('/') ? path : '/' + path;
  if (params) {
    const paramString = new URLSearchParams(params).toString();
    if (paramString) dest += '?' + paramString;
  }
  const options = { method, headers, body: undefined };
  if (body && method !== 'GET' && method !== 'HEAD') {
    options.body = body;
  }
  try {
    const resp = await fetch(dest, options);
    const text = await resp.text();
    ctx.status = resp.status;
    resp.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
        ctx.set(key, value);
      }
    });
    ctx.body = text;
  } catch (e) {
    ctx.status = 502;
    ctx.body = `Failed to connect to upstream server: ${e.message}`;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => console.log(`Proxy server listening on ${PORT}`));

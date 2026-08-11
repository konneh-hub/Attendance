import http from 'http';

const body = JSON.stringify({ identifier: 'admin@example.edu', password: 'DevelopmentOnlyPassword123!' });
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('HEADERS', JSON.stringify(res.headers, null, 2));
    console.log('BODY', data);
  });
});

req.on('error', (err) => {
  console.error('ERROR', err.message);
});

req.write(body);
req.end();

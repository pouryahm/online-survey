import request from 'supertest';

// می‌تونی BASE URL را از env هم بگیری
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Auth flow: register/login/refresh/logout', () => {
  const email = `u${Date.now()}@example.com`;
  const password = 'P@ssw0rd!';
  let accessToken = '';
  let refreshToken = '';

  it('registers a new user', async () => {
    const res = await request(base)
      .post('/auth/register')
      .send({ email, password, name: 'Flow User' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.user?.email).toBe(email);
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
  });

  it('logs in the user', async () => {
    const res = await request(base)
      .post('/auth/login')
      .send({ email, password })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
  });

  it('gets /auth/me with accessToken', async () => {
    const res = await request(base).get('/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user?.email).toBe(email);
  });

  it('refresh rotates refresh token', async () => {
    const res = await request(base)
      .post('/auth/refresh')
      .send({ refreshToken })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    const newAT = res.body.accessToken;
    const newRT = res.body.refreshToken;
    expect(typeof newAT).toBe('string');
    expect(typeof newRT).toBe('string');

    // update tokens
    accessToken = newAT;
    const oldRefresh = refreshToken;
    refreshToken = newRT;

    // old refresh must be invalid now
    const res2 = await request(base)
      .post('/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .set('Content-Type', 'application/json');
    expect([401, 400]).toContain(res2.status); // 401 انتظار داریم
  });

  it('logout revokes the current refresh token', async () => {
    const res = await request(base)
      .post('/auth/logout')
      .send({ refreshToken })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);

    // further refresh should fail
    const res2 = await request(base)
      .post('/auth/refresh')
      .send({ refreshToken })
      .set('Content-Type', 'application/json');
    expect([401, 400]).toContain(res2.status); // 401 انتظار داریم
  });
});

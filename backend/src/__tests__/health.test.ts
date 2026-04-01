import request from 'supertest';
import app from '../app';

describe('GET /api/v1/health', () => {
  it('should return 200 with success true and status ok', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.timestamp).toBeDefined();
  });
});

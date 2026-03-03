const request = require('supertest');
const app = require('../server');

describe('RecoverFlow API', () => {
  describe('Health check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.message).toBe('RecoverFlow API is running');
    });
  });

  describe('Business operations', () => {
    it('should return business info', async () => {
      const response = await request(app).get('/api/business/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('phone_number');
    });

    it('should return 404 for non-existent business', async () => {
      const response = await request(app).get('/api/business/999');
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Analytics operations', () => {
    it('should return business analytics', async () => {
      const response = await request(app).get('/api/business/1/analytics');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('totalLeads');
      expect(response.body).toHaveProperty('recoveredLeads');
      expect(response.body).toHaveProperty('recoveryRate');
    });
  });

  describe('Conversations operations', () => {
    it('should return business conversations', async () => {
      const response = await request(app).get('/api/business/1/conversations');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Website chat widget', () => {
    it('should handle website chat submission', async () => {
      const response = await request(app)
        .post('/api/website-chat')
        .send({
          businessId: '1',
          name: 'Test User',
          phone: '+1234567890',
          service: 'dental_implants',
          budget: '3000',
          urgency: 'normal'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('leadId');
    });

    it('should handle missing fields in website chat', async () => {
      const response = await request(app)
        .post('/api/website-chat')
        .send({
          businessId: '1'
        });
      
      expect(response.statusCode).toBe(500);
    });
  });

  describe('Missed call handling', () => {
    it('should handle missed calls', async () => {
      const response = await request(app)
        .post('/api/missed-call')
        .send({
          businessId: '1',
          phoneNumber: '+1234567890',
          callerId: '+9876543210'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });
  });

  describe('No-show recovery', () => {
    it('should handle no-show recovery', async () => {
      const response = await request(app)
        .post('/api/no-show')
        .send({
          businessId: '1',
          phoneNumber: '+1234567890'
        });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });
  });
});
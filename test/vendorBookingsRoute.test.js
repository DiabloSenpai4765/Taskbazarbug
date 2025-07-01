const request = require('supertest');
const { app } = require('../backend/server');
const assert = require('assert');

describe('GET /api/vendor/bookings/:vendorId', function () {
  it('should return bookings for specified vendor', async function () {
    const vendorId = '4';
    const res = await request(app).get(`/api/vendor/bookings/${vendorId}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    if (res.body.length > 0) {
      assert.ok(res.body.every(b => b.vendorId === vendorId));
    }
  });

  it('should return empty array for vendor without bookings', async function () {
    const vendorId = 'non-existent';
    const res = await request(app).get(`/api/vendor/bookings/${vendorId}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.strictEqual(res.body.length, 0);
  });
});

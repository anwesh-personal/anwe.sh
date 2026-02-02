/**
 * Redis Configuration
 * For queue management and caching
 */

import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

client.on('connect', () => {
  console.log('✅ Redis connected');
});

export default client;

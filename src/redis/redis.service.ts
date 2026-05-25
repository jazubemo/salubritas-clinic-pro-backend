import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is missing!');
    }

    this.client = new Redis(redisUrl);
  }

  async setUserRoles(
    userId: string,
    clinicRoles: Record<string, string[]>,
  ): Promise<void> {
    const key = `user:roles:${userId}`;
    // Cache for 24 hours (86400 seconds)
    await this.client.set(key, JSON.stringify(clinicRoles), 'EX', 86400);
  }

  async getUserRoles(userId: string): Promise<Record<string, string[]> | null> {
    const data = await this.client.get(`user:roles:${userId}`);
    if (!data) return null; // Cache Miss
    return JSON.parse(data) as Record<string, string[]>;
  }

  async clearUserCache(userId: string): Promise<void> {
    await this.client.del(`user:roles:${userId}`);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}

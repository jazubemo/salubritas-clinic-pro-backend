import { DateTime } from 'luxon';
import { APP_TIMEZONE } from '../constants/app.constants';
import { BadRequestException } from '@nestjs/common';

export class TimezoneUtil {
  private static readonly DEFAULT_ZONE = APP_TIMEZONE;

  static toUTC(localInput: string | Date | undefined | null): Date {
    if (!localInput) {
      throw new BadRequestException('A value is required for this action.');
    }

    const sourceStr =
      localInput instanceof Date ? localInput.toISOString() : localInput;

    return DateTime.fromISO(sourceStr, { zone: this.DEFAULT_ZONE })
      .toUTC()
      .toJSDate();
  }

  static fromJSDate(localInput: Date): DateTime {
    if (!localInput) {
      throw new BadRequestException('A value is required for this action.');
    }

    return DateTime.fromJSDate(localInput).setZone(APP_TIMEZONE);
  }

  static convertPayload<T extends Record<string, any>>(
    payload: T,
    dateKeys: (keyof T)[],
  ): T {
    const updatedPayload = { ...payload };

    for (const key of dateKeys) {
      if (updatedPayload[key]) {
        updatedPayload[key] = TimezoneUtil.toUTC(
          updatedPayload[key],
        ) as unknown as T[keyof T];
      }
    }

    return updatedPayload;
  }
}

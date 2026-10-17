import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Locale } from '@work-hub/constants';
import type { MeResponse } from '@work-hub/contracts';
import { PrismaService, uuidv7 } from '@work-hub/database';
import {
  ImageProcessError,
  processSquareImage,
  StorageService,
} from '@work-hub/storage';

type PublicUserSource = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  locale: string;
};

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Pick fields explicitly: columns added later stay private by default. */
export function toMeResponse(user: PublicUserSource): MeResponse {
  const { id, email, name, emailVerified, image, locale } = user;
  return {
    id,
    email,
    name,
    emailVerified,
    image: image ?? null,
    locale: locale as Locale,
  };
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  async updateLocale(userId: string, locale: Locale): Promise<MeResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { locale },
    });
    return toMeResponse(user);
  }

  async putAvatar(userId: string, file: Buffer): Promise<MeResponse> {
    const processed = await this.runImage(() =>
      processSquareImage(file, AVATAR_MAX_BYTES)
    );
    const prefix = `users/${userId}/avatar/${uuidv7()}`;
    await this.storage.put(
      `${prefix}/256.webp`,
      processed.webp256,
      'image/webp'
    );
    await this.storage.put(`${prefix}/64.webp`, processed.webp64, 'image/webp');

    const imageUrl = this.storage.publicUrl(`${prefix}/256.webp`);
    const current = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { image: true },
    });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });
    await this.deleteAvatarObjects(userId, current.image);
    return toMeResponse(user);
  }

  async deleteAvatar(userId: string): Promise<void> {
    const current = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { image: true },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });
    await this.deleteAvatarObjects(userId, current.image);
  }

  /**
   * Derive storage prefix from a public 256.webp URL we issued for this user.
   * Rejects foreign hosts and keys outside `users/{userId}/avatar/`.
   */
  avatarPrefixFromImageUrl(
    userId: string,
    imageUrl: string | null | undefined
  ): string | null {
    if (!imageUrl || !imageUrl.endsWith('/256.webp')) {
      return null;
    }
    const expectedBase = this.storage.publicUrl(`users/${userId}/avatar/`);
    if (!imageUrl.startsWith(expectedBase)) {
      return null;
    }
    const key = imageUrl.slice(this.storage.publicUrl('').length);
    const prefix = key.endsWith('/256.webp')
      ? key.slice(0, -'/256.webp'.length)
      : null;
    if (!prefix || !prefix.startsWith(`users/${userId}/avatar/`)) {
      return null;
    }
    return prefix;
  }

  private async deleteAvatarObjects(
    userId: string,
    imageUrl: string | null | undefined
  ): Promise<void> {
    const prefix = this.avatarPrefixFromImageUrl(userId, imageUrl);
    if (!prefix) {
      return;
    }
    await this.safeDelete(`${prefix}/64.webp`);
    await this.safeDelete(`${prefix}/256.webp`);
  }

  private async safeDelete(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.warn(`Failed to delete storage object ${key}: ${String(error)}`);
    }
  }

  private async runImage<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ImageProcessError) {
        const status =
          error.code === 'IMAGE_TOO_LARGE'
            ? HttpStatus.PAYLOAD_TOO_LARGE
            : error.code === 'IMAGE_UNSUPPORTED_TYPE'
              ? HttpStatus.UNSUPPORTED_MEDIA_TYPE
              : HttpStatus.UNPROCESSABLE_ENTITY;
        throw new HttpException(
          { message: error.message, code: error.code },
          status
        );
      }
      throw error;
    }
  }
}

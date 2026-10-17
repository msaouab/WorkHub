import { Injectable } from '@nestjs/common';
import type { Locale } from '@work-hub/constants';
import type { MeResponse } from '@work-hub/contracts';
import { PrismaService } from '@work-hub/database';

type PublicUserSource = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  locale: string;
};

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
  constructor(private readonly prisma: PrismaService) {}

  async updateLocale(userId: string, locale: Locale): Promise<MeResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { locale },
    });
    return toMeResponse(user);
  }
}

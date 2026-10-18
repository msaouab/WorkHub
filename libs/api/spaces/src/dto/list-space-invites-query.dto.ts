import { listSpaceInvitesQuerySchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class ListSpaceInvitesQueryDto extends createZodDto(
  listSpaceInvitesQuerySchema
) {}

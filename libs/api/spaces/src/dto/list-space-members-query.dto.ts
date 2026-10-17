import { listSpaceMembersQuerySchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class ListSpaceMembersQueryDto extends createZodDto(
  listSpaceMembersQuerySchema
) {}

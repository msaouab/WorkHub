import { createSpaceInviteSchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateSpaceInviteDto extends createZodDto(createSpaceInviteSchema) {}

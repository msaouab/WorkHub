import { createSpaceTeamSchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateSpaceTeamDto extends createZodDto(createSpaceTeamSchema) {}

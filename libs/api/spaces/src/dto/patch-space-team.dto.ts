import { patchSpaceTeamSchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class PatchSpaceTeamDto extends createZodDto(patchSpaceTeamSchema) {}

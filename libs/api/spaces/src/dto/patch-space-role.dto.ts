import { patchSpaceRoleSchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class PatchSpaceRoleDto extends createZodDto(patchSpaceRoleSchema) {}

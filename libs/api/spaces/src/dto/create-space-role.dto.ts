import { createSpaceRoleSchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateSpaceRoleDto extends createZodDto(createSpaceRoleSchema) {}

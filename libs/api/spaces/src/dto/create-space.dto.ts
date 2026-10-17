import { createSpaceSchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateSpaceDto extends createZodDto(createSpaceSchema) {}

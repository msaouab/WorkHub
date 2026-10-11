import { updateMeSchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

/** Validated by the global ZodValidationPipe; also documents the body in Swagger. */
export class UpdateMeDto extends createZodDto(updateMeSchema) {}
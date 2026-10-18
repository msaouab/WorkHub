import { patchSpaceMemberSchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class PatchSpaceMemberDto extends createZodDto(patchSpaceMemberSchema) {}

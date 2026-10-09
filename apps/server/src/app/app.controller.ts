import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API root' })
  @ApiOkResponse({
    description: 'API root payload',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'WorkHub API' },
      },
    },
  })
  getData() {
    return this.appService.getData();
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Text Content')
@Controller('text-content')
export class TextContentController {
  @Public()
  @Get()
  test(): string {
    return 'TextContent module is working!';
  }
}

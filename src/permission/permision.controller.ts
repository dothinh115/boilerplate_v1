import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PermisionService } from './permision.service';
import { UpdatePermisionDto } from './dto/update-permision.dto';
import { RolesGuard } from 'src/guard/roles.guard';
import { TQuery } from 'src/utils/model/query.model';
import { TokenRequired } from 'src/strategy';

@UsePipes(new ValidationPipe())
@Controller('permission')
export class PermisionController {
  constructor(private readonly permisionService: PermisionService) {}

  @UseGuards(RolesGuard)
  @Get()
  find(@Query() query: TQuery) {
    return this.permisionService.find(query);
  }

  @UseGuards(TokenRequired, RolesGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdatePermisionDto,
    @Query() query: TQuery,
  ) {
    body = UpdatePermisionDto.plainToClass(body);
    return this.permisionService.update(id, body, query);
  }
}

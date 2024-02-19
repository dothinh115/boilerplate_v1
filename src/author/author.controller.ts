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
import { AuthorService } from './author.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { TokenRequired } from 'src/strategy';
import { RolesGuard } from 'src/guard/roles.guard';
import { TQuery } from 'src/utils/model/query.model';

@Controller('author')
@UsePipes(new ValidationPipe())
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @UseGuards(TokenRequired, RolesGuard)
  @Post()
  create(@Body() body: CreateAuthorDto, @Query() query: TQuery) {
    body = CreateAuthorDto.plainToClass(body);
    return this.authorService.create(body, query);
  }

  @UseGuards(RolesGuard)
  @Get()
  find(@Query() query: TQuery) {
    return this.authorService.find(query);
  }

  @UseGuards(TokenRequired, RolesGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateAuthorDto,
    @Query() query: TQuery,
  ) {
    return this.authorService.update(+id, body, query);
  }

  @UseGuards(TokenRequired, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authorService.remove(+id);
  }
}

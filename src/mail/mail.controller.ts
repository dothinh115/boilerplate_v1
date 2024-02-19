import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';
import { TokenRequired } from 'src/strategy';
import { RolesGuard } from 'src/guard/roles.guard';

@UsePipes(new ValidationPipe())
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @UseGuards(TokenRequired, RolesGuard)
  @Post()
  sendMail(@Body() body: SendMailDto) {
    return this.mailService.send(body);
  }
}
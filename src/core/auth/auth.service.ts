import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@/core/user/schema/user.schema';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { TQuery } from '@/core/utils/models/query.model';
import { RefreshTokenAuthDto } from './dto/refresh-token-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { BcryptService } from '../common/bcrypt.service';
import { QueryService } from '../query/query.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private mailService: MailService,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
    private queryService: QueryService,
  ) {}
  async login(body: LoginAuthDto) {
    try {
      const { email, password } = body;
      const exists = await this.userModel
        .findOne({
          email: email.toLowerCase(),
        })
        .select('+password');
      if (!exists) throw new Error('Email hoặc mật khẩu không đúng!');
      const passwordCheck = await this.bcryptService.comparePassword(
        password,
        exists.password,
      );
      if (!passwordCheck) throw new Error('Email hoặc mật khẩu không đúng!');

      const accessToken = this.jwtService.sign(
        { _id: exists._id },
        { expiresIn: '15m' },
      );
      const refreshToken = this.jwtService.sign(
        { _id: exists._id },
        { expiresIn: '7d' },
      );

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async register(body: RegisterAuthDto, query: TQuery) {
    try {
      const exists = await this.userModel.findOne({
        email: body.email,
      });
      if (exists) throw new Error('Email đã được dùng!');
      const result = await this.userModel.create(body);
      return await this.queryService.handleQuery(
        this.userModel,
        query,
        result._id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyEmail(_id: string, template: string) {
    try {
      const exists = await this.userModel.findById(_id);
      if (!exists) throw new Error('Không tồn tại user này!');
      await this.mailService.send({
        from: 'BOILERPLATE',
        html: template,
        subject: 'Kích hoạt tài khoản của bạn',
        to: exists.email,
      });
      return { message: 'Thành công!' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async refreshToken(body: RefreshTokenAuthDto) {
    try {
      const decoded = await this.jwtService.verifyAsync(body.refreshToken);
      const accessToken = this.jwtService.sign(
        { _id: decoded._id },
        { expiresIn: '15m' },
      );
      const refreshToken = this.jwtService.sign(
        { _id: decoded._id },
        { expiresIn: '7d' },
      );

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

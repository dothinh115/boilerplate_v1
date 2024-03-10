import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/core/user/schema/user.schema';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RefreshToken } from 'src/core/auth/schema/refresh-token.schema';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { TQuery } from 'src/core/utils/models/query.model';
import { UserService } from 'src/core/user/user.service';
import { MailService } from 'src/core/mail/mail.service';
import { RefreshTokenAuthDto } from './dto/refresh-token-auth.dto';
import settings from '../../settings.json';
import { JwtService } from '@nestjs/jwt';
import { BcryptService } from 'src/core/main/services/bcrypt.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    private userService: UserService,
    private mailService: MailService,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
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
      const createRefreshToken = {
        user: exists._id,
        refreshToken,
      };
      await this.refreshTokenModel.create(createRefreshToken);
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
      return await this.userService.create(body, query);
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
      const exists = await this.refreshTokenModel.findOne({
        refresh_token: body.refreshToken,
        ...(settings.AUTH.BROWSER_ID_CHECK && {
          browserId: body.browserId,
        }),
      });
      if (!exists) throw new Error('Token không hợp lệ!');
      const accessToken = this.jwtService.sign(
        { _id: exists._id },
        { expiresIn: '15m' },
      );
      const refreshToken = this.jwtService.sign(
        { _id: exists._id },
        { expiresIn: '7d' },
      );
      await this.refreshTokenModel.findByIdAndUpdate(exists._id, {
        refreshToken,
      });
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

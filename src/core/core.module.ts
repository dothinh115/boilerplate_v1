import { Global, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './common/multer.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import globalPlugin from './mongoose/plugins/global.plugin';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MeModule } from './me/me.module';
import { MailModule } from './mail/mail.module';
import { SettingModule } from './setting/setting.module';
import { UploadModule } from './upload/upload.module';
import { JwtModule } from '@nestjs/jwt';
import { RoleGuardModule } from './guards/role.module';
import { AssetsModule } from './assets/assets.module';
import { CommonModule } from './common/common.module';
import { QueryModule } from './query/query.module';
import { SchemaModule } from './schema/schema.module';
import { CommonService } from './common/common.service';
import { PermissionModule } from './permission/permission.module';
import { RoleModule } from './role/role.module';

@Global()
@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_URI, {
      dbName: process.env.DB_NAME,
      connectionFactory: async (connection: Connection) => {
        connection.plugin(globalPlugin);
        connection.set('maxTimeMS', 20000);
        return connection;
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],

      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    RoleModule,
    MeModule,
    MailModule,
    PermissionModule,
    SettingModule,
    UploadModule,
    RoleGuardModule,
    AssetsModule,
    CommonModule,
    QueryModule,
    SchemaModule,
  ],
  providers: [CommonService],
  exports: [JwtModule, MulterModule],
})
export class CoreModule {}

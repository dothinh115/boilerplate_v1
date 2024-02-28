import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/schema/user.schema';
import {
  Permission,
  PermissionSchema,
} from 'src/permission/schema/permission.schema';
import { Role, RoleSchema } from 'src/role/schema/role.schema';
import { CommonModule } from 'src/common/common.module';
import { BoostrapService, OnBootStrapService } from './bootstrap.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Permission.name,
        schema: PermissionSchema,
      },
      {
        name: Role.name,
        schema: RoleSchema,
      },
    ]),
    CommonModule,
  ],
  providers: [OnBootStrapService, BoostrapService],
  exports: [OnBootStrapService],
})
export class BootstrapModule {}

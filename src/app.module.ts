import { Global, Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';

@Global()
@Module({
  imports: [CoreModule],
})
export class AppModule {}

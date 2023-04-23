import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update.';
import { AuthModule } from '../auth/auth.module';
import { AuthScene } from './auth.scene';
import { UserModule } from '../user/user.module';
import { EventModule } from '../event/event.module';

@Module({
    providers: [TelegramUpdate, AuthScene],
    imports: [AuthModule, UserModule, EventModule],
    exports: [TelegramUpdate]
})
export class TelegramModule {}

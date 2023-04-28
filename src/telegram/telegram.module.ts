import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { EventModule } from '../event/event.module';
import { ConfigurableModuleClass } from './telegram.module-definition';
import { TelegramService } from './telegram.service';

@Module({
    providers: [TelegramService],
    imports: [AuthModule, UserModule, EventModule],
    exports: [TelegramService]
})
export class TelegramModule extends ConfigurableModuleClass {}

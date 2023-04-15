import { Inject, Injectable } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN, TelegramModuleOptions } from './telegram.module-definition';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
    private readonly telegraf: Telegraf
    constructor(@Inject(MODULE_OPTIONS_TOKEN) options: TelegramModuleOptions) {
        this.telegraf = new Telegraf(options.token)
        this.telegraf.launch()
    }

    async createGroup(name: string, admin: string) {

    }
}

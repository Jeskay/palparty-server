import { Inject, Injectable, Logger } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './telegram.module-definition';
import {Bot, CommandContext, Context, InlineKeyboard, SessionFlavor, session} from 'grammy'
import {Conversation, ConversationFlavor, conversations, createConversation} from '@grammyjs/conversations';
import { TelegramModule } from './telegram.module';
import { ConversationName, TelegramModuleOptions } from './constants';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { Menu, MenuRange } from '@grammyjs/menu';
import {Event} from '@prisma/client'
import { EventService } from '../event/event.service';

interface SessionData {
    events: Event[]
}
type AppContext = Context & SessionFlavor<SessionData> & ConversationFlavor

@Injectable()
export class TelegramService {
    private bot: Bot<AppContext>;
    private logger: Logger;
    private eventMenu = new Menu<AppContext>('events');

    constructor(
        @Inject(MODULE_OPTIONS_TOKEN) options: TelegramModuleOptions, 
        private authService: AuthService, 
        private userService: UserService, 
        private eventService: EventService
    ) {
        this.logger = new Logger(TelegramModule.name);
        this.bot = new Bot(options.token);
        this.bot.use(session({
            initial(): SessionData {
                return { events: [] }
            },
        }));
        this.eventMenu.dynamic((ctx) => {
            return this.createEventMenu(ctx)
        })
        this.bot.use(conversations())
        this.bot.use(createConversation(async (conversation: Conversation<AppContext>, ctx: AppContext) => await this.linkage(conversation, ctx), ConversationName.Linkage))
        this.bot.use(this.eventMenu)
        this.bot.command("start", async (ctx) => await this.start(ctx));
        this.bot.command("verify", this.verify);
        this.bot.start();
        this.logger.log('Bot started');
    }

    async start(ctx: CommandContext<AppContext>) {
        this.logger.log("bot instance started")
        await ctx.conversation.enter(ConversationName.Linkage)
    }

    async verify(ctx: CommandContext<AppContext>) {
        if(ctx.message.chat.type == 'private'){
            await ctx.reply('Команда доступна только в групповом канале')
            return
        }
        const members = await ctx.getChatMembersCount()
        if(members > 2) {
            await ctx.reply('В группе для участников события не должно быть участников до публикации приглашения в канале')
            return
        }
        const admin = await this.userService.user({telegramId: ctx.message.from.id});
        if(!admin) {
            await ctx.reply('Телеграм аккаунт не привязан к учетной записи PalParty')
            return
        }
        const events = admin.eventsHosting.filter(event => !event.groupLink)
        if(events.length == 0) {
            await ctx.reply('Вы не являетесь администратором событий, для которых требуется создание чата')
            return
        }
        const self = await ctx.getChatMember(this.bot.botInfo.id)
        if(self.status != 'administrator' || !self.can_invite_users) {
            await ctx.reply('Недостаточно прав для создания приглашения')
            return
        }
        ctx.session.events = events;
        await ctx.reply('Выберите событие для которого предназначается эта группа', { reply_markup: this.eventMenu})
    }

    async createEventMenu(ctx: AppContext) {
        const menu = new MenuRange<AppContext>()
        for(const event of ctx.session.events) {
            menu.text(event.name, async ctx => {
                const inviteUrl = await ctx.exportChatInviteLink();
                //await this.registerEventGroup(event, inviteUrl);
                this.logger.log(inviteUrl, 'Invite url linked')
                await ctx.reply('Ссылка-приглашение в группу успешно прикреплена к событию');
            })
            .row();
        }
        return menu
    }

    async linkage(conversation: Conversation<AppContext>, ctx: AppContext) {
        await ctx.reply('Войдите в учетную запись PalParty')
        const email = (await conversation.wait()).message.text;
        if(!email) return;
        conversation.log("email received: " + email)
        await ctx.reply('Введите пароль')
        const password = (await conversation.wait()).message.text;
        if(!password) return;
        conversation.log("password received: " + password)
        const user = await conversation.external(() => this.authService.validateUser(email, password))
        if(!user) {
            await ctx.reply('Неверное имя аккаунта или пароль')
        } else {
            await conversation.external(() => this.userService.updateUserInfo(user, undefined, {telegramId: ctx.message.from.id}))
            await ctx.reply('Учетная запись телеграмм сопряжена c аккаунтом PalParty')
        }
    }

    async registerEventGroup(event: Event, link: string) {
        await this.eventService.updateInfo({id: event.id}, {groupLink: link})
    }

}

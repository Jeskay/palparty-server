import { Logger } from '@nestjs/common';
import {Start, Ctx, Command, Update, Action} from 'nestjs-telegraf'
import { AvailableScene } from './constants';
import { SceneContext } from 'telegraf/typings/scenes'
import { UserService } from '../user/user.service';
import { callback } from 'telegraf/typings/button';
import { Event } from '@prisma/client';
import { EventService } from '../event/event.service';
import { Update as CallbackUpdate} from 'telegraf/typings/core/types/typegram'

@Update()
export class TelegramUpdate {
    private readonly logger = new Logger(TelegramUpdate.name)

    constructor(private readonly userService: UserService, private readonly eventService: EventService) {}

    @Start()
    async start(@Ctx() context: SceneContext) {
        this.logger.log("Telegram bot started")
        await context.reply("Здравствуй")
        await context.scene.enter(AvailableScene.Auth)
    }

    @Command('verify')
    async verify(@Ctx() context: SceneContext) {
        if(context.message.chat.type == 'private'){
            await context.reply('Команда доступна только в групповом канале')
            return
        }
        const members = await context.getChatMembersCount()
        if(members > 2) {
            await context.reply('В группе для участников события не должно быть участников до публикации приглашения в канале')
            return
        }
        const admin = await this.userService.user({telegramId: context.message.from.id});
        if(!admin) {
            await context.reply('Телеграм аккаунт не привязан к учетной записи PalParty')
            return
        }
        const events = admin.eventsHosting.filter(event => !event.groupLink)
        if(events.length == 0) {
            await context.reply('Вы не являетесь администратором событий, для которых требуется создание чата')
            return
        }
        const self = await context.getChatMember(context.botInfo.id)
        if(self.status != 'administrator' || !self.can_invite_users) {
            await context.reply('Недостаточно прав для создания приглашения')
            return
        }
        const inviteUrl = await context.exportChatInviteLink()
        const link_data = 'link:' + inviteUrl + ';'
        const eventButtons = events.map( event => { return [{text: event.name, callback_data: link_data + event.id}]})
        await context.reply('Выберите событие для которого предназначается эта группа', {
            reply_markup: {
                inline_keyboard: eventButtons
            }
        })
    }

    @Action(/^link:/)
    async onAnswer(@Ctx() context: SceneContext & {update: CallbackUpdate.CallbackQueryUpdate}) {
        const query = context.update.callback_query;
        if( !('data' in query))
            return
        const answer = query.data
        this.logger.log('Received answer ' + answer)
        const data = answer.slice(5)
        const id = parseInt(data.slice(data.lastIndexOf(';') + 1))
        const link = data.slice(0, data.lastIndexOf(';'))
        await this.eventService.updateInfo({id}, {groupLink: link})
        await context.reply('Ссылка-приглашение в группу успешно прикреплена к событию')
    }
}

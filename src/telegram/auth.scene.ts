import { Scene, SceneEnter, Ctx, Wizard, WizardStep, On } from "nestjs-telegraf";
import { SceneContext, WizardContext } from 'telegraf/typings/scenes'
import { AvailableScene } from "./constants";
import { AuthService } from "../auth/auth.service";
import { UserService } from "../user/user.service";
import { Logger } from "@nestjs/common";

@Wizard(AvailableScene.Auth)
export class AuthScene {

    private readonly logger: Logger = new Logger(AuthScene.name);

    constructor(
        private readonly authService: AuthService, 
        private readonly userService: UserService,
    ) {}

    @WizardStep(1)
    async enter(@Ctx() context: WizardContext) {
        await context.reply('Войдите в учетную запись PalParty', {
            reply_markup: {
                force_reply: true, 
                input_field_placeholder: "email"
            },
        })
        context.wizard.next()
    }

    @WizardStep(2)
    async password(@Ctx() context: WizardContext & {message: {text: string}, session: {data: any}}) {
        this.logger.log('Email received')
        context.session.data = {email: context.message.text}
        await context.reply('Введите пароль', {
            reply_markup: {
                force_reply: true, 
                input_field_placeholder: 'пароль'
            }
        })
        context.wizard.next()
    }

    @WizardStep(3)
    async answerPasswords(@Ctx() context: WizardContext & {message: {text: string}, session: {data: any}}) {
        this.logger.log('Received password')
        const user = await this.authService.validateUser(context.session.data.email, context.message.text)
        if(!user) {
            await context.reply('Неверное имя аккаунта или пароль')
        } else {
            await this.userService.updateUserInfo(user, undefined, {telegramId: context.message.from.id})
            await context.reply('Учетная запись телеграмм сопряжена c аккаунтом PalParty')
        }
        context.scene.leave()
    }
}
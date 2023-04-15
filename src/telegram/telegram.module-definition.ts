import { ConfigurableModuleBuilder } from "@nestjs/common";

export interface TelegramModuleOptions {
    token: string;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN} = 
    new ConfigurableModuleBuilder<TelegramModuleOptions>().setClassMethodName('forRoot').build();
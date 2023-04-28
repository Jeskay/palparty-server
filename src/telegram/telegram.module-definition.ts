import { ConfigurableModuleBuilder } from "@nestjs/common";
import { TelegramModuleOptions } from "./constants";

export const {ConfigurableModuleClass, MODULE_OPTIONS_TOKEN} = 
    new ConfigurableModuleBuilder<TelegramModuleOptions>().setClassMethodName('forRoot').build();
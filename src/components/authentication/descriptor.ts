import { Hooks } from "assistant-source";
import { ComponentDescriptor } from "inversify-components";
import { BeforeIntentHook } from "./before-intent-hook";
import { COMPONENT_NAME, componentInterfaces } from "./private-interfaces";
import { StrategyClass } from "./public-interfaces";

export const descriptor: ComponentDescriptor = {
  name: COMPONENT_NAME,
  interfaces: componentInterfaces,
  bindings: {
    root: bindService => {
      // Bind strategy factory
      bindService.bindGlobalService("strategy-factory").toFactory(context => {
        return (strategyClass: StrategyClass) => {
          return context.container.getTagged<any>(componentInterfaces.authenticationStrategy, "strategy", strategyClass);
        };
      });
    },
    request: (bindService, lookupService) => {
      // Register hook function as method of a class
      bindService.bindLocalServiceToSelf<BeforeIntentHook>(BeforeIntentHook);
      bindService.bindExtension<Hooks.BeforeIntentHook>(lookupService.lookup("core:state-machine").getInterface("beforeIntent")).toDynamicValue(context => {
        return context.container.get<BeforeIntentHook>(BeforeIntentHook).execute;
      });
    },
  },
};

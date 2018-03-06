import { ComponentDescriptor } from "inversify-components";
import { StrategyClass } from "./public-interfaces";
import { componentInterfaces } from "./private-interfaces";

import { AccessTokenAuthentication } from "./strategies/access-token";
import { PinAuthentication } from "./strategies/pin";
import { BeforeIntentHook } from "./before-intent-hook";
import { Hooks } from "assistant-source";

export const descriptor: ComponentDescriptor = {
  name: "authentication",
  interfaces: componentInterfaces,
  bindings: {
    root: (bindService) => {
      // Bind strategy factory
      bindService.bindGlobalService("strategy-factory").toFactory(context => {
        return (strategyClass: StrategyClass) => {
          return context.container.getTagged<any>(componentInterfaces.authenticationStrategy, "strategy", strategyClass);
        };
      });
    },
    request: (bindService, lookupService) => {
      // Register hook function as method of a class
      bindService.bindLocalServiceToSelf<BeforeIntentHook>(BeforeIntentHook)
      bindService.bindExtension<Hooks.BeforeIntentHook>(lookupService.lookup("core:state-machine").getInterface("beforeIntent")).toDynamicValue(context => {
        return context.container.get<BeforeIntentHook>(BeforeIntentHook).execute;
      });
}
  }
};
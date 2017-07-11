import { ComponentDescriptor, Hooks } from "inversify-components";
import { componentInterfaces, StrategyClass } from "./interfaces";

import { AccessTokenAuthentication } from "./strategies/access-token";
import { PinAuthentication } from "./strategies/pin";
import { BeforeIntentHook } from "./before-intent-hook";

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
      bindService.bindExtension<Hooks.Hook>(lookupService.lookup("core:state-machine").getInterface("beforeIntent")).toDynamicValue(context => {
        return context.container.get<BeforeIntentHook>(BeforeIntentHook).execute;
      });
}
  }
};
import { StrategyClass } from "./public-interfaces";
export const authenticateMetadataKey = Symbol("metadata-key: authenticate");

export function authenticate(authenticationStrategies: StrategyClass[] | StrategyClass, authenticationDataAttribute?: string) {
  const metadata = {
    strategies: typeof authenticationStrategies === "function" ? [authenticationStrategies] : authenticationStrategies,
    dataAttribute: authenticationDataAttribute,
  };

  return function(targetClass: any, methodName?: string) {
    if (typeof methodName === "undefined") {
      Reflect.defineMetadata(authenticateMetadataKey, metadata, targetClass);
    } else {
      Reflect.defineMetadata(authenticateMetadataKey, metadata, targetClass[methodName]);
    }
  };
}

import { stateMachineInterfaces } from "assistant-source";

export enum AuthenticationResult {
  Authenticated, // If authentication was successful
  Failed, // If authentication was not successful in general. You should NOT reject in this case, use resolve(AuthenticationResult.Failed)! reject() will result in an error message!
  ForcePlatformAuthentication, // Authentication failed because of missing platform linking / paltform authentication
  Deferred, // Does not execute the intent (same as Failed), but also does not respond to client. You can use this to redirect to an authentication state for example.
}

export declare type StrategyResult = { status: AuthenticationResult, authenticatedData?: {} } | AuthenticationResult;
export interface AuthenticationStrategy {
  authenticate(state: any, stateName: string, intent: string, machine: stateMachineInterfaces.Transitionable): Promise<StrategyResult> | StrategyResult;
}

export interface StrategyClass {
  new(...args: any[]): AuthenticationStrategy;
}

export interface StrategyFactory {
  (strategy: StrategyClass): AuthenticationStrategy
}

export const componentInterfaces = {
  "authenticationStrategy": Symbol("authentication:authentication-strategy")
};
import { Transitionable, Constructor } from "assistant-source";
import { Configuration } from "./private-interfaces";

/** Configuration of authentication component */
export interface AuthenticationConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {};

/** Property describing the configuration of the authentication component */
export interface AuthenticationConfigurationAttribute {
  "authentication"?: AuthenticationConfiguration;
}

/** Possible results of your authenthication strategy */
export enum AuthenticationResult {
  /** If authentication was successful */
  Authenticated,

  /** If authentication was not successful in general. You should NOT reject in this case, use resolve(AuthenticationResult.Failed)! reject() will result in an error message! */
  Failed,

  /** Authentication failed because of missing platform linking / paltform authentication */
  ForcePlatformAuthentication, 

  /** Does not execute the intent (same as Failed), but also does not respond to client. You can use this to redirect to an authentication state for example. */
  Deferred,
}
/** Internal abbrevation for result of your strategy */
export declare type StrategyResult = { status: AuthenticationResult, authenticatedData?: {} } | AuthenticationResult;

/** Interface to implement for every authentication strategy you are using */
export interface AuthenticationStrategy {
  authenticate(state: any, stateName: string, intent: string, machine: Transitionable): Promise<StrategyResult> | StrategyResult;
}

/** Constructor interface for strategy classes */
export interface StrategyClass extends Constructor<AuthenticationStrategy> {};

/** Factory to build authentication strategies */
export interface StrategyFactory {
  (strategy: StrategyClass): AuthenticationStrategy
}
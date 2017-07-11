import { Hooks, Component } from "inversify-components";
import { injectable, inject } from "inversify";
import { unifierInterfaces, stateMachineInterfaces, i18nInterfaces } from "assistant-source";

import { AuthenticationStrategy, StrategyResult, AuthenticationResult, StrategyClass, StrategyFactory } from "./interfaces";
import { authenticateMetadataKey } from "./annotations";

import { log } from "../../global";

@injectable()
export class BeforeIntentHook {
  private state: stateMachineInterfaces.State;
  private stateName: string;
  private intent: string;

  private strategyFactory: StrategyFactory;
  private responseFactory: unifierInterfaces.ResponseFactory;
  private i18n: i18nInterfaces.TranslateHelper;

  constructor(
    @inject("authentication:strategy-factory") factory: StrategyFactory,
    @inject("core:unifier:current-response-factory") responseFactory: unifierInterfaces.ResponseFactory,
    @inject("core:i18n:current-translate-helper") i18n: i18nInterfaces.TranslateHelper
  ) {
    this.i18n = i18n;
    this.strategyFactory = factory;
    this.responseFactory = responseFactory;
  }

  /** Hook method, the only method which will be called */
  execute: Hooks.Hook = (success, failure, mode, state, stateName, intent, machine: stateMachineInterfaces.Transitionable) => {
    log("Executing hook with stateName = " + stateName + " and intent = " + intent);
    this.state = state;
    this.stateName = stateName;
    this.intent = intent;

    let strategies = this.retrieveStrategiesFromMetadata().map(strategyClass => this.strategyFactory(strategyClass));
    if (strategies.length === 0) {
      success(); // Hook is not enabled
      return ; // Important!
    }

    let collectedData = {};

    strategies
      .reduce((previous, current) => {
        return previous.then(value => {
          let uniformedValue = typeof(value) === "object" ? value : { status: value };

          if (uniformedValue.status === -1 || uniformedValue.status === AuthenticationResult.Authenticated) {
            if (typeof(uniformedValue.authenticatedData) !== "undefined") {
              collectedData = Object.assign(collectedData, uniformedValue.authenticatedData);
            }

            return this.runStrategy(current, machine);
          } else {
            return value;
          }
        });
      }, Promise.resolve({authenticatedData: undefined, status: -1} as StrategyResult))

      .then(authenticationResult => {
        let uniformedResult = typeof(authenticationResult) === "object" ? authenticationResult : { status: authenticationResult, authenticatedData: {} };
        log("Retrieving authentication result %o", uniformedResult);

        if (uniformedResult.status === AuthenticationResult.Authenticated || uniformedResult.status === -1) {

          // Write authentication data: Get collected data + data of last iteration!
          if (uniformedResult.status === AuthenticationResult.Authenticated) this.writeAuthenticationData(Object.assign(collectedData, uniformedResult.authenticatedData));
          
          return true;
        } else {
          this.tell(uniformedResult.status);
          failure(authenticationResult);
          return false;
        }
      })
      .catch(error => {
        failure();
        throw error;
      }).then(respondSuccess => {
        if (respondSuccess) success();
      });
  }

  /** Says sth to end user if needed */
  private tell(status: AuthenticationResult) {
    switch (status) {
      case AuthenticationResult.Failed:
        log("Answering with .authentication.faild");
        this.responseFactory.createVoiceResponse().endSessionWith(this.i18n.t(".authentication.failed"));
        break;

      case AuthenticationResult.ForcePlatformAuthentication:
        log("Answering with .authentication.forcePlatform");
        this.responseFactory.createAndSendUnauthenticatedResponse(this.i18n.t(".authentication.forcePlatform"));
        break;
    }
  }

  /** Writes data to given state attribute */
  private writeAuthenticationData(data: {}) {
    let dataAttribute = this.retrieveDataAttributeFromMetadata();
    if (typeof(dataAttribute) !== "string") return;

    log("Setting authentication data to '"+ dataAttribute +"'");
    this.state[dataAttribute] = data;
  }

  /** Runs given strategy, forces return to be a promise */
  private runStrategy(strategy: AuthenticationStrategy, machine: stateMachineInterfaces.Transitionable) {
    log("Running strategy " + strategy.constructor.name);
    return Promise.resolve(strategy.authenticate(this.state, this.stateName, this.intent, machine));
  }

  /** Retrieves strategies based on what is stored in @authenticate. If state and intent has @authenticate, merges given strategies (security first). */
  private retrieveStrategiesFromMetadata(): StrategyClass[] {
    // 1) Get strategies of state
    let stateStrategies: StrategyClass[] = [];
    if (Reflect.hasMetadata(authenticateMetadataKey, this.state.constructor)) {
      stateStrategies = Reflect.getMetadata(authenticateMetadataKey, this.state.constructor).strategies;
    }

    // 2) Get strategies of intent
    let intentStrategies: StrategyClass[] = [];
    if (typeof(this.state[this.intent]) !== "undefined" && Reflect.hasMetadata(authenticateMetadataKey, this.state[this.intent])) {
      intentStrategies = Reflect.getMetadata(authenticateMetadataKey, this.state[this.intent]).strategies;
    }

    // Return merged result
    let allStrategies = stateStrategies.concat(intentStrategies);
    log("Retrieving all strategies: ", allStrategies);
    return allStrategies;
  }

  /** Retrieves data attribute name from metadata. If there is an intent configuration present, take this one, else use the states configuration, or return undefined. */
  private retrieveDataAttributeFromMetadata(): string | undefined {
    // 1) Try intent
    if (typeof(this.state[this.intent]) !== "undefined" && Reflect.hasMetadata(authenticateMetadataKey, this.state[this.intent]) && typeof(Reflect.getMetadata(authenticateMetadataKey, this.state[this.intent]).dataAttribute) !== "undefined") {
      return Reflect.getMetadata(authenticateMetadataKey, this.state[this.intent]).dataAttribute;
    }

    // 2) Try state
    if (Reflect.hasMetadata(authenticateMetadataKey, this.state.constructor) && typeof(Reflect.getMetadata(authenticateMetadataKey, this.state.constructor).dataAttribute) !== "undefined") {
      return Reflect.getMetadata(authenticateMetadataKey, this.state.constructor).dataAttribute;
    }

    // 3) Return undefined
    log("Data attribute not found.");
    return undefined;
  }
}
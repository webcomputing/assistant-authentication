import { Component } from "inversify-components";
import { injectable, inject } from "inversify";
import { State, TranslateHelper, ResponseFactory, Transitionable, Hooks, injectionNames, ComponentSpecificLoggerFactory, Logger } from "assistant-source";

import { AuthenticationStrategy, StrategyResult, AuthenticationResult, StrategyClass, StrategyFactory } from "./public-interfaces";
import { authenticateMetadataKey } from "./annotations";
import { COMPONENT_NAME } from "./private-interfaces";

@injectable()
export class BeforeIntentHook {
  private state: State.Required;
  private stateName: string;
  private intent: string;
  private logger: Logger;

  constructor(
    @inject("authentication:strategy-factory") private strategyFactory: StrategyFactory,
    @inject("core:unifier:current-response-factory") private responseFactory: ResponseFactory,
    @inject("core:i18n:current-translate-helper") private i18n: TranslateHelper,
    @inject(injectionNames.componentSpecificLoggerFactory) loggerFactory: ComponentSpecificLoggerFactory
  ) {
    this.logger = loggerFactory(COMPONENT_NAME);
  }

  /** Hook method, the only method which will be called */
  execute: Hooks.BeforeIntentHook = (mode, state, stateName, intent, machine) => {
    this.logger.debug({state: stateName, intent: intent}, "Executing hook");
    this.state = state;
    this.stateName = stateName;
    this.intent = intent;

    let strategies = this.retrieveStrategiesFromMetadata().map(strategyClass => this.strategyFactory(strategyClass));
    if (strategies.length === 0) {
      return true;
    }

    let collectedData = {};

    return strategies
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

        if (uniformedResult.status === AuthenticationResult.Authenticated || uniformedResult.status === -1) {

          // Write authentication data: Get collected data + data of last iteration!
          if (uniformedResult.status === AuthenticationResult.Authenticated) this.writeAuthenticationData(Object.assign(collectedData, uniformedResult.authenticatedData));
          
          return true;
        } else {
          this.tell(uniformedResult.status);
          return false;
        }
      });
  }

  /** Says sth to end user if needed */
  private tell(status: AuthenticationResult) {
    switch (status) {
      case AuthenticationResult.Failed:
        this.logger.info("Answering with .authentication.failed");
        this.responseFactory.createVoiceResponse().endSessionWith(this.i18n.t(".authentication.failed"));
        break;

      case AuthenticationResult.ForcePlatformAuthentication:
        this.logger.info("Answering with .authentication.forcePlatform");
        this.responseFactory.createAndSendUnauthenticatedResponse(this.i18n.t(".authentication.forcePlatform"));
        break;
    }
  }

  /** Writes data to given state attribute */
  private writeAuthenticationData(data: {}) {
    let dataAttribute = this.retrieveDataAttributeFromMetadata();
    if (typeof(dataAttribute) !== "string") return;

    this.logger.debug("Setting authentication data to '"+ dataAttribute +"'");
    this.state[dataAttribute] = data;
  }

  /** Runs given strategy, forces return to be a promise */
  private runStrategy(strategy: AuthenticationStrategy, machine: Transitionable) {
    this.logger.debug("Running strategy " + strategy.constructor.name);
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
    this.logger.info("Not using any data attribute.");
    return undefined;
  }
}
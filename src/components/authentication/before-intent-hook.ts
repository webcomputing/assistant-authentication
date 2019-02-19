import {
  BasicAnswerTypes,
  BasicHandable,
  ComponentSpecificLoggerFactory,
  Hooks,
  injectionNames,
  Logger,
  OptionalHandlerFeatures,
  State,
  Transitionable,
  TranslateHelper,
} from "assistant-source";
import { inject, injectable } from "inversify";
import { authenticateMetadataKey } from "./annotations";
import { authenticationInjectionNames } from "./injection-names";
import { COMPONENT_NAME } from "./private-interfaces";
import { AuthenticationResult, AuthenticationStrategy, StrategyClass, StrategyFactory, StrategyResult } from "./public-interfaces";

@injectable()
export class BeforeIntentHook {
  private state!: State.Required;
  private stateName!: string;
  private intent!: string;
  private logger: Logger;

  constructor(
    @inject(authenticationInjectionNames.strategyFactory) private strategyFactory: StrategyFactory,
    @inject(injectionNames.current.responseHandler) private responseHandler: BasicHandable<BasicAnswerTypes> & OptionalHandlerFeatures.Authentication,
    @inject(injectionNames.current.translateHelper) private i18n: TranslateHelper,
    @inject(injectionNames.componentSpecificLoggerFactory) loggerFactory: ComponentSpecificLoggerFactory
  ) {
    this.logger = loggerFactory(COMPONENT_NAME);
  }

  /** Hook method, the only method which will be called */
  public execute: Hooks.BeforeIntentHook = async (mode, state, stateName, intent, machine): Promise<boolean> => {
    this.logger.debug(
      {
        intent,
        state: stateName,
      },
      "Executing hook"
    );
    this.state = state;
    this.stateName = stateName;
    this.intent = intent;

    const strategies = this.retrieveStrategiesFromMetadata().map(strategyClass => this.strategyFactory(strategyClass));
    if (strategies.length === 0) {
      return true;
    }

    let collectedData = {};

    const authenticationResult = await strategies.reduce((previous, current): Promise<StrategyResult> => {
      return previous.then(value => {
        const uniformedValue = typeof value === "object" ? value : { status: value };

        if (uniformedValue.status === -1 || uniformedValue.status === AuthenticationResult.Authenticated) {
          if (typeof uniformedValue.authenticatedData !== "undefined") {
            collectedData = { ...collectedData, ...uniformedValue.authenticatedData };
          }
          return this.runStrategy(current, machine);
        }

        return value;
      });
      // tslint:disable-next-line:no-object-literal-type-assertion
    }, Promise.resolve({ authenticatedData: undefined, status: -1 } as StrategyResult));

    const uniformedResult = typeof authenticationResult === "object" ? authenticationResult : { status: authenticationResult, authenticatedData: {} };
    if (uniformedResult.status === AuthenticationResult.Authenticated || uniformedResult.status === -1) {
      // Write authentication data: Get collected data + data of last iteration!
      if (uniformedResult.status === AuthenticationResult.Authenticated) {
        this.writeAuthenticationData({ ...collectedData, ...uniformedResult.authenticatedData });
      }
      return true;
    }

    this.tell(uniformedResult.status);
    return false;
  };

  /** Says sth to end user if needed */
  private tell(status: AuthenticationResult) {
    switch (status) {
      case AuthenticationResult.Failed:
        this.logger.info("Answering with .authentication.failed");
        this.responseHandler.endSessionWith(this.i18n.t(".authentication.failed"));
        break;

      case AuthenticationResult.ForcePlatformAuthentication:
        this.logger.info("Answering with .authentication.forcePlatform");
        this.responseHandler.prompt(this.i18n.t(".authentication.forcePlatform")).setUnauthenticated();
        break;

      case AuthenticationResult.Cancelled:
        this.logger.info("Answering with .authentication.cancelled");
        this.responseHandler.prompt(this.i18n.t(".authentication.cancelled")).setEndSession();
        break;
    }
  }

  /** Writes data to given state attribute */
  private writeAuthenticationData(data: {}) {
    const dataAttribute = this.retrieveDataAttributeFromMetadata();
    if (typeof dataAttribute !== "string") return;

    this.logger.debug("Setting authentication data to '" + dataAttribute + "'");
    this.state[dataAttribute] = data;
  }

  /** Runs given strategy, forces return to be a promise */
  private runStrategy(strategy: AuthenticationStrategy, machine: Transitionable): Promise<StrategyResult> {
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
    if (typeof this.state[this.intent] !== "undefined" && Reflect.hasMetadata(authenticateMetadataKey, this.state[this.intent])) {
      intentStrategies = Reflect.getMetadata(authenticateMetadataKey, this.state[this.intent]).strategies;
    }

    // Return merged result
    const allStrategies = stateStrategies.concat(intentStrategies);
    return allStrategies;
  }

  /** Retrieves data attribute name from metadata. If there is an intent configuration present, take this one, else use the states configuration, or return undefined. */
  private retrieveDataAttributeFromMetadata(): string | undefined {
    // 1) Try intent
    if (
      typeof this.state[this.intent] !== "undefined" &&
      Reflect.hasMetadata(authenticateMetadataKey, this.state[this.intent]) &&
      typeof Reflect.getMetadata(authenticateMetadataKey, this.state[this.intent]).dataAttribute !== "undefined"
    ) {
      return Reflect.getMetadata(authenticateMetadataKey, this.state[this.intent]).dataAttribute;
    }

    // 2) Try state
    if (
      Reflect.hasMetadata(authenticateMetadataKey, this.state.constructor) &&
      typeof Reflect.getMetadata(authenticateMetadataKey, this.state.constructor).dataAttribute !== "undefined"
    ) {
      return Reflect.getMetadata(authenticateMetadataKey, this.state.constructor).dataAttribute;
    }

    // 3) Return undefined
    this.logger.info("Not using any data attribute.");
    return undefined;
  }
}

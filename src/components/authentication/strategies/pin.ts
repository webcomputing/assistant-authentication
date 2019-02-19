import { ComponentSpecificLoggerFactory, EntityDictionary, injectionNames, Logger, Session, Transitionable } from "assistant-source";
import { ValidationsInitializer, validationsInjectionNames } from "assistant-validations";
import { inject, injectable, optional } from "inversify";

import { COMPONENT_NAME } from "../private-interfaces";
import { AuthenticationResult, AuthenticationStrategy as StrategyInterface } from "../public-interfaces";

@injectable()
export abstract class PinAuthentication implements StrategyInterface {
  private sessionFactory: () => Session;
  private entities: EntityDictionary;
  private validationsInitializer: ValidationsInitializer;
  private logger: Logger;

  constructor(
    @inject(injectionNames.current.sessionFactory) sessionFactory: () => Session,
    @inject(injectionNames.current.entityDictionary) entities: EntityDictionary,
    @inject(injectionNames.componentSpecificLoggerFactory) loggerFactory: ComponentSpecificLoggerFactory,
    @optional()
    @inject(validationsInjectionNames.current.validationsInitializer)
    validationsInitializer: ValidationsInitializer
  ) {
    this.sessionFactory = sessionFactory;
    this.validationsInitializer = validationsInitializer;
    this.entities = entities;
    this.logger = loggerFactory(COMPONENT_NAME);
  }

  public async authenticate(state: any, stateName: string, intent: string, machine: Transitionable) {
    if (this.entities.contains("pin")) {
      if (await this.validatePin(this.entities.get("pin") as string)) {
        await this.sessionFactory().set("authentication:current-pin", "given");
        this.logger.info("PinStrategy: Pin validation was successful, saved 'given' boolean in session.");
        return AuthenticationResult.Authenticated;
      }
      return AuthenticationResult.Failed;
    }
    this.logger.info("PinStrategy: Current request did not contain a pin!");
    return this.authenticateBasedOnSession(stateName, intent, machine);
  }

  public authenticateBasedOnSession(stateName: string, intent: string, machine: Transitionable) {
    return this.sessionFactory()
      .get("authentication:current-pin")
      .then(pin => {
        if (pin === "given") {
          // If the string stored in session is === "given", return successful result
          this.logger.info("PinStrategy: Authentication successful, pin was given via session.");
          return AuthenticationResult.Authenticated;
        }
        if (typeof pin === "undefined") {
          // If no pin is stored, return Deferred and start pin authentication
          return this.startPinAuthentication(intent, stateName, machine).then(() => AuthenticationResult.Deferred);
        }
        this.logger.info("PinStrategy: Pin was not given in session, so failing.");
        return AuthenticationResult.Failed;
      });
  }

  /**
   * Per default, this uses assistant-entity-validator to start prompting the needed "pin" parameter.
   * Feel free to overwrite this method if you need an other behaviour or if you do not use assistant-entity-validator.
   */
  public async startPinAuthentication(intent: string, stateName: string, machine: Transitionable): Promise<void> {
    if (typeof this.validationsInitializer === "undefined" || this.validationsInitializer === null) {
      throw new Error(
        "Could not inject validationsInitializer from assistant-validations. You possibly did not install or configure assistant-validations. " +
          "If you do not want to use assistant-validations, overwrite this method in your strategy class to implement your own behaviour."
      );
    }

    this.logger.info(`PinStrategy: Starting pin prompting with intent = ${intent}, stateName = ${stateName}.`);
    return this.validationsInitializer.initializePrompt(stateName, intent, "pin");
  }

  public abstract async validatePin(pin: string): Promise<boolean>;
}

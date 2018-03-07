import { injectable, inject, optional } from "inversify";
import { injectionNames, ComponentSpecificLoggerFactory, Session, EntityDictionary, Transitionable, Logger } from "assistant-source";
import { PromptFactory } from "assistant-validations";

import { AuthenticationStrategy as StrategyInterface, AuthenticationResult } from "../public-interfaces";
import { COMPONENT_NAME } from "../private-interfaces";

@injectable()
export abstract class PinAuthentication implements StrategyInterface {
  private sessionFactory: () => Session;
  private entities: EntityDictionary;
  private promptFactory: PromptFactory;
  private logger: Logger;

  constructor(
    @inject("core:unifier:current-session-factory") sessionFactory: () => Session,
    @inject("core:unifier:current-entity-dictionary") entities: EntityDictionary,
    @inject(injectionNames.componentSpecificLoggerFactory) loggerFactory: ComponentSpecificLoggerFactory,
    @optional() @inject("validations:current-prompt-factory") promptFactory: PromptFactory,
  ) {
    this.sessionFactory = sessionFactory;
    this.promptFactory = promptFactory;
    this.entities = entities;
    this.logger = loggerFactory(COMPONENT_NAME);
  }

  async authenticate(state: any, stateName: string, intent: string, machine: Transitionable) {
    if (this.entities.contains("pin")) {
      if (await this.validatePin(this.entities.get("pin") as string)) {
        await this.sessionFactory().set("authentication:current-pin", "given");
        this.logger.info("PinStrategy: Pin validation was successful, saved 'given' boolean in session.");
        return AuthenticationResult.Authenticated;
      } else {
        return AuthenticationResult.Failed;
      }
    } else {
      this.logger.info("PinStrategy: Current request did not contain a pin!");
      return this.authenticateBasedOnSession(stateName, intent, machine);
    }
  }

  authenticateBasedOnSession(stateName: string, intent: string, machine: Transitionable) {
    return this.sessionFactory().get("authentication:current-pin").then(pin => {
      if (pin === "given") {
        // If the string stored in session is === "given", return successful result
        this.logger.info("PinStrategy: Authentication successful, pin was given via session.");
        return AuthenticationResult.Authenticated;
      } else if (pin === null) {
        // If no pin is stored, return Deferred and start pin authentication
        return this.startPinAuthentication(intent, stateName, machine).then(() => AuthenticationResult.Deferred);
      } else {
        this.logger.info("PinStrategy: Pin was not given in session, so failing.");
        return AuthenticationResult.Failed;
      }
    });
  }

  /** 
   * Per default, this uses assistant-entity-validator to start prompting the needed "pin" parameter.
   * Feel free to overwrite this method if you need an other behaviour or if you do not use assistant-entity-validator.
   */
  async startPinAuthentication(intent: string, stateName: string, machine: Transitionable): Promise<void> {
    if (typeof this.promptFactory === "undefined" || this.promptFactory === null)
      throw new Error("Could not inject promptFactory from assistant-validations. You possibly did not install or configure assistant-validations. " +
        "If you do not want to use assistant-validations, overwrite this method in your strategy class to implement your own behaviour.");
    
    this.logger.info(`PinStrategy: Starting pin prompting with intent = ${intent}, stateName = ${stateName}.`);
    return this.promptFactory(intent, stateName, machine).prompt("pin");
  }

  abstract async validatePin(pin: string): Promise<boolean>;
}
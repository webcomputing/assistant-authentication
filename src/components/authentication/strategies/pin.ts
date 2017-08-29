import { injectable, inject, optional } from "inversify";
import { stateMachineInterfaces, servicesInterfaces, unifierInterfaces } from "assistant-source";
import { PromptFactory } from "assistant-validations";

import { AuthenticationStrategy as StrategyInterface, AuthenticationResult } from "../interfaces";
import { log } from "../../../global";

@injectable()
export abstract class PinAuthentication implements StrategyInterface {
  private sessionFactory: () => servicesInterfaces.Session;
  private entities: unifierInterfaces.EntityDictionary;
  private promptFactory: PromptFactory;

  constructor(
    @inject("core:unifier:current-session-factory") sessionFactory: () => servicesInterfaces.Session,
    @inject("core:unifier:current-entity-dictionary") entities: unifierInterfaces.EntityDictionary,
    @optional() @inject("validations:current-prompt-factory") promptFactory: PromptFactory,
  ) {
    this.sessionFactory = sessionFactory;
    this.promptFactory = promptFactory;
    this.entities = entities;
  }

  async authenticate(state: any, stateName: string, intent: string, machine: stateMachineInterfaces.Transitionable) {
    if (this.entities.contains("pin")) {
      if (await this.validatePin(this.entities.get("pin") as string)) {
        await this.sessionFactory().set("authentication:current-pin", "given");
        log("PinStrategy: Pin validation was successful, saved 'given' boolean in session.");
        return AuthenticationResult.Authenticated;
      } else {
        return AuthenticationResult.Failed;
      }
    } else {
      log("PinStrategy: Current request did not contain a pin!");
      return this.authenticateBasedOnSession(stateName, intent, machine);
    }
  }

  authenticateBasedOnSession(stateName: string, intent: string, machine: stateMachineInterfaces.Transitionable) {
    return this.sessionFactory().get("authentication:current-pin").then(pin => {
      if (pin === "given") {
        // If the string stored in session is === "given", return successful result
        log("PinStrategy: Authentication successful, pin was given via session.");
        return AuthenticationResult.Authenticated;
      } else if (pin === null) {
        // If no pin is stored, return Deferred and start pin authentication
        return this.startPinAuthentication(intent, stateName, machine).then(() => AuthenticationResult.Deferred);
      } else {
        log("PinStrategy: Pin was not given in session, so failing.");
        return AuthenticationResult.Failed;
      }
    });
  }

  /** 
   * Per default, this uses assistant-entity-validator to start prompting the needed "pin" parameter.
   * Feel free to overwrite this method if you need an other behaviour or if you do not use assistant-entity-validator.
   */
  async startPinAuthentication(intent: string, stateName: string, machine: stateMachineInterfaces.Transitionable): Promise<void> {
    if (typeof this.promptFactory === "undefined" || this.promptFactory === null)
      throw new Error("Could not inject promptFactory from assistant-validations. You possibly did not install or configure assistant-validations. " +
        "If you do not want to use assistant-validations, overwrite this method in your strategy class to implement your own behaviour.");
    
    log(`PinStrategy: Starting pin prompting with intent = ${intent}, stateName = ${stateName}.`);
    return this.promptFactory(intent, stateName, machine).prompt("pin");
  }

  abstract async validatePin(pin: string): Promise<boolean>;
}
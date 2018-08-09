import { BasicAnswerTypes, BasicHandler, injectionNames, State } from "assistant-source";
import { inject, injectable } from "inversify";

import { authenticate } from "../../../../src/components/authentication/annotations";
import { OAuthStrategy } from "../auth-strategies/oauth-strategy";
import { PinStrategy } from "../auth-strategies/pin-strategy";

@authenticate(OAuthStrategy, "authenticationData")
@injectable()
export class SecondState implements State.Required {
  public responseHandler: BasicHandler<BasicAnswerTypes>;
  public authenticationData: any;

  constructor(@inject(injectionNames.current.responseHandler) responseHandler) {
    this.responseHandler = responseHandler;
  }

  public unhandledGenericIntent() {
    this.responseHandler.endSessionWith("In unhandledIntent!");
  }

  @authenticate(PinStrategy)
  public pinStrategyIntent() {
    this.responseHandler.endSessionWith("Valid.");
  }

  public noStrategyIntent() {
    this.responseHandler.endSessionWith("Valid.");
  }

  public printAuthenticationDataIntent() {
    this.responseHandler.endSessionWith(this.authenticationData.username);
  }

  public unansweredGenericIntent() {
    this.responseHandler.prompt("");
  }
}

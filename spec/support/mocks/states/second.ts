import { stateMachineInterfaces, unifierInterfaces, injectionNames } from "assistant-source";
import { inject, injectable } from "inversify";

import { authenticate } from "../../../../src/components/authentication/annotations";
import { OAuthStrategy } from "../auth-strategies/oauth-strategy";
import { PinStrategy } from "../auth-strategies/pin-strategy";

@authenticate(OAuthStrategy, "authenticationData")
@injectable()
export class SecondState implements stateMachineInterfaces.State {
  responseFactory: unifierInterfaces.ResponseFactory;
  authenticationData: any;

  constructor(@inject(injectionNames.current.responseFactory) responseFactory) {
    this.responseFactory = responseFactory;
  }

  unhandledGenericIntent()  {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("In unhandledIntent!");
  }

  @authenticate(PinStrategy)
  pinStrategyIntent() {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("Valid.");
  }

  noStrategyIntent() {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("Valid.");
  }

  printAuthenticationDataIntent() {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith(this.authenticationData.username);
  }

  unansweredGenericIntent() {
    this.responseFactory.createAndSendEmptyResponse();
  }
}
import { State, ResponseFactory, injectionNames } from "assistant-source";
import { inject, injectable } from "inversify";
import { authenticate } from "../../../../src/components/authentication/annotations";
import { OAuthStrategy } from "../auth-strategies/oauth-strategy";
import { PinStrategy } from "../auth-strategies/pin-strategy";

@injectable()
export class MainState implements State.Required {
  responseFactory: ResponseFactory;

  constructor(@inject(injectionNames.current.responseFactory) responseFactory) {
    this.responseFactory = responseFactory;
  }

  noStrategyIntent() {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("Valid.");
  }

  @authenticate(OAuthStrategy)
  oAuthStrategyIntent() {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("Valid.");
  }

  @authenticate(PinStrategy)
  pinStrategyIntent() {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("Valid.");
  }

  @authenticate([PinStrategy, OAuthStrategy])
  bothStrategiesIntent() {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("Valid.");
  }

  unhandledGenericIntent()  {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("In unhandledIntent!");
  }

  unansweredGenericIntent() {
    this.responseFactory.createAndSendEmptyResponse();
  }
}
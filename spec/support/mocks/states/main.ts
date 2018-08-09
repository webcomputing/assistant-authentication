import { BasicAnswerTypes, BasicHandler, injectionNames, State } from "assistant-source";
import { inject, injectable } from "inversify";
import { authenticate } from "../../../../src/components/authentication/annotations";
import { OAuthStrategy } from "../auth-strategies/oauth-strategy";
import { PinStrategy } from "../auth-strategies/pin-strategy";

@injectable()
export class MainState implements State.Required {
  public responseHandler: BasicHandler<BasicAnswerTypes>;

  constructor(@inject(injectionNames.current.responseHandler) responseHandler) {
    this.responseHandler = responseHandler;
  }

  public noStrategyIntent() {
    this.responseHandler.endSessionWith("Valid.");
  }

  @authenticate(OAuthStrategy)
  public oAuthStrategyIntent() {
    this.responseHandler.endSessionWith("Valid.");
  }

  @authenticate(PinStrategy)
  public pinStrategyIntent() {
    this.responseHandler.endSessionWith("Valid.");
  }

  @authenticate([PinStrategy, OAuthStrategy])
  public bothStrategiesIntent() {
    this.responseHandler.endSessionWith("Valid.");
  }

  public unhandledGenericIntent() {
    this.responseHandler.endSessionWith("In unhandledIntent!");
  }

  public unansweredGenericIntent() {
    this.responseHandler.prompt("");
  }
}

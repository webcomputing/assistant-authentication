import { AlexaSpecHelper } from "assistant-alexa";
import { AssistantJSSetup, SpecHelper } from "assistant-source";
import { Container } from "inversify-components";
import { AuthenticationSetup } from "../../src/assistant-authentication";

export interface ThisContext {
  /** AssistantJS setup instance */
  assistantJs: AssistantJSSetup;

  /** Instance of AssistantJS's spec helper */
  specHelper: SpecHelper;

  /** Current dependency injection container, recreated for every spec */
  container: Container;

  /** Alexa's spec helper */
  alexaSpecHelper: AlexaSpecHelper;

  /** Our own authentication setup */
  authenticateHelper: AuthenticationSetup;

  /** Binds all states to container, calling prepare() internally */
  prepareWithStates(): void;
}

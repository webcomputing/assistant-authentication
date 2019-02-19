// tslint:disable-next-line
require("reflect-metadata");

import { AlexaSpecHelper, descriptor as alexaDescriptor } from "assistant-alexa";
import { AssistantJSSetup, SpecHelper } from "assistant-source";
import { descriptor as validationsDescriptor } from "assistant-validations";
import { AuthenticationSetup } from "../../src/assistant-authentication";
import { descriptor } from "../../src/components/authentication/descriptor";
import { OAuthStrategy } from "../support/mocks/auth-strategies/oauth-strategy";
import { PinStrategy } from "../support/mocks/auth-strategies/pin-strategy";
import { MainState } from "../support/mocks/states/main";
import { PromptState } from "../support/mocks/states/prompt";
import { SecondState } from "../support/mocks/states/second";
import { ThisContext } from "../support/this-context";

beforeEach(function(this: ThisContext) {
  this.assistantJs = new AssistantJSSetup();
  this.specHelper = new SpecHelper(this.assistantJs);

  this.assistantJs.registerComponent(alexaDescriptor);
  this.assistantJs.registerComponent(descriptor);
  this.assistantJs.registerComponent(validationsDescriptor);

  this.assistantJs.addConfiguration({
    "core:i18n": {
      i18nextAdditionalConfiguration: {
        backend: {
          loadPath: `${process.cwd()}/spec/support/mocks/locales/{{lng}}/{{ns}}.json`,
        },
      },
    },
    "core:unifier": {
      entities: {
        number: ["pin"],
      },
    },
  });

  this.container = this.assistantJs.container;

  this.alexaSpecHelper = new AlexaSpecHelper(this.specHelper);

  this.authenticateHelper = new AuthenticationSetup(this.assistantJs);
  this.authenticateHelper.addStrategy(OAuthStrategy);
  this.authenticateHelper.addStrategy(PinStrategy);
  this.authenticateHelper.registerStrategies();

  this.prepareWithStates = () => {
    this.specHelper.prepare([MainState, PromptState, SecondState]);
  };
});

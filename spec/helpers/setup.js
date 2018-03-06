require("reflect-metadata");
const assistantJsCore = require("assistant-source");
const alexa = require("assistant-alexa");
const assistantValidations = require("assistant-validations");

const ownComponent = require("../../src/components/authentication/descriptor");
const ownSetup = require("../../src/components/authentication/setup").AuthenticationSetup;

const mainState = require("../support/mocks/states/main").MainState;
const secondState = require("../support/mocks/states/second").SecondState;
const promptState = require("../support/mocks/states/prompt").PromptState;

const oAuthStrategy = require("../support/mocks/auth-strategies/oauth-strategy").OAuthStrategy;
const pinStrategy = require("../support/mocks/auth-strategies/pin-strategy").PinStrategy;

beforeEach(function() {
  this.specHelper = new assistantJsCore.SpecSetup();

  this.assistantJs = this.specHelper.setup;
  this.assistantJs.registerComponent(alexa.descriptor);
  this.assistantJs.registerComponent(ownComponent.descriptor);
  this.assistantJs.registerComponent(assistantValidations.descriptor);

  this.assistantJs.addConfiguration({
    "core:i18n": {
      "i18nextAdditionalConfiguration": {
        "backend": {
          "loadPath": process.cwd() + "/spec/support/mocks/locales/{{lng}}/{{ns}}.json"
        }
      }
    },
    "core:unifier": {
      "entities": {
        "number": ["pin"]
      }
    }
  });

  this.container = this.assistantJs.container;

  this.alexaHelper = new alexa.SpecHelper(this.specHelper);
  
  this.authenticateHelper = new ownSetup(this.assistantJs);
  this.authenticateHelper.addStrategy(oAuthStrategy);
  this.authenticateHelper.addStrategy(pinStrategy);
  this.authenticateHelper.registerStrategies();

  this.specHelper.prepare([mainState, promptState, secondState]);
});
require("reflect-metadata");
let assistantJsCore = require("assistant-source");
let alexa = require("assistant-alexa");
let assistantValidations = require("assistant-validations");

let ownComponent = require("../../src/components/authentication/descriptor");
let ownSetup = require("../../src/components/authentication/setup").AuthenticationSetup;

let mainState = require("../support/mocks/states/main").MainState;
let secondState = require("../support/mocks/states/second").SecondState;

let oAuthStrategy = require("../support/mocks/auth-strategies/oauth-strategy").OAuthStrategy;
let pinStrategy = require("../support/mocks/auth-strategies/pin-strategy").PinStrategy;

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
    }
  });

  this.container = this.assistantJs.container;

  this.alexaHelper = new alexa.SpecHelper(this.specHelper);
  
  this.authenticateHelper = new ownSetup(this.assistantJs);
  this.authenticateHelper.addStrategy(oAuthStrategy);
  this.authenticateHelper.addStrategy(pinStrategy);
  this.authenticateHelper.registerStrategies();


  this.specHelper.prepare([mainState, assistantValidations.PromptState, secondState]);
});
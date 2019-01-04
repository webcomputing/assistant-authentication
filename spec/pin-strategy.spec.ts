import { componentInterfaces } from "../src/components/authentication/private-interfaces";
import { AuthenticationResult } from "../src/components/authentication/public-interfaces";
import { callIntentHelper, makeValidPinExtraction } from "./support/call-intent-helper";
import { PinStrategy } from "./support/mocks/auth-strategies/pin-strategy";
import { MainState } from "./support/mocks/states/main";

import { injectionNames, Session, Transitionable } from "assistant-source";
import { ThisContext } from "./support/this-context";

interface CurrentThisContext extends ThisContext {
  /** Initializes the necessary spec setup */
  initialize(containsPin?: boolean, pinIsValid?: boolean);
}

describe("PinAuthentication", function() {
  let strategyClass: PinStrategy;
  let machine: Transitionable;
  let currentSessionFactory: () => Session;

  /** Small helper function: Calls strategy class' authenticate method */
  const callAuthenticate = (intent = "pinStrategy") => {
    return strategyClass.authenticate(MainState, "MainState", intent, machine);
  };

  beforeEach(async function(this: CurrentThisContext) {
    this.prepareWithStates();
    this.initialize = async function(containsPin = true, pinIsValid = true) {
      let extraction = {};
      if (containsPin) {
        extraction = pinIsValid ? makeValidPinExtraction() : { entities: { pin: "1234" } };
      }

      await this.alexaSpecHelper.pretendIntentCalled("pinStrategy", extraction);
      strategyClass = this.container.inversifyInstance.getTagged(componentInterfaces.authenticationStrategy, "strategy", PinStrategy) as PinStrategy;
      machine = this.container.inversifyInstance.get(injectionNames.current.stateMachine);
      currentSessionFactory = this.container.inversifyInstance.get(injectionNames.current.sessionFactory);
    };
  });

  describe("authenticate", function() {
    describe("no pin given", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.initialize(false);
      });

      describe("no session pin given", function() {
        it("returns AuthenticationResult.Deferred", async function(this: CurrentThisContext) {
          const result = await callAuthenticate();
          expect(result).toEqual(AuthenticationResult.Deferred);
        });

        describe("assistant-validations is not enabled", function() {
          it("throws exception", async function(this: CurrentThisContext) {
            (strategyClass as any).promptFactory = undefined;
            try {
              await callAuthenticate();
              fail();
            } catch (e) {
              expect(true).toBeTruthy();
            }
          });
        });
      });

      describe("assistant-validations is enabled", function() {
        it("prompts for pin", async function(this: CurrentThisContext) {
          await callAuthenticate();
          await this.alexaSpecHelper.specHelper.runMachine("MainState");
          const result = this.alexaSpecHelper.specHelper.getResponseResults();
          expect(result.voiceMessage!.text).toEqual("Asking pin");
        });
      });

      describe("session pin given", function() {
        beforeEach(async function(this: CurrentThisContext) {
          await currentSessionFactory().set("authentication:current-pin", "given");
        });

        it("returns AuthenticationResult.authenticated", async function(this: CurrentThisContext) {
          const result = await callAuthenticate();
          expect(result).toEqual(AuthenticationResult.Authenticated);
        });
      });
    });

    describe("pin is given", function() {
      describe("given pin is valid", function() {
        beforeEach(async function(this: CurrentThisContext) {
          await this.initialize();
        });

        it("returns AuthenticationResult.Authenticated", async function(this: CurrentThisContext) {
          const result = await callAuthenticate();
          expect(result).toEqual(AuthenticationResult.Authenticated);
        });

        it("stores pin to session", async function(this: CurrentThisContext) {
          const result = await callAuthenticate();
          const sessionContent = await currentSessionFactory().get("authentication:current-pin");
          expect(sessionContent).toEqual("given");
        });
      });

      describe("given pin is invalid", function() {
        beforeEach(async function(this: CurrentThisContext) {
          await this.initialize(true, false);
        });

        it("returns AuthenticationResult.Failed", async function(this: CurrentThisContext) {
          const result = await callAuthenticate();
          expect(result).toEqual(AuthenticationResult.Failed);
        });
      });
    });
  });
});

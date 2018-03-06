import { callIntentHelper, makeValidPinExtraction } from "./support/call-intent-helper";
import { AuthenticationResult } from "../src/components/authentication/interfaces";
import { PinStrategy } from "./support/mocks/auth-strategies/pin-strategy";
import { componentInterfaces } from "../src/components/authentication/interfaces";
import { MainState } from "./support/mocks/states/main";

import { MinimalResponseHandler, Transitionable, Session, injectionNames } from "assistant-source";

describe("PinAuthentication", function() {
  let responseHandler: MinimalResponseHandler;
  let strategyClass: PinStrategy;
  let machine: Transitionable;
  let currentSessionFactory: () => Session;

  /** Small helper function: Calls strategy class' authenticate method */
  let callAuthenticate = (intent = "pinStrategy") => {
    return strategyClass.authenticate(MainState, "MainState", intent, machine);
  }

  beforeEach(function() {
    this.initialize = async function(containsPin = true, pinIsValid = true) {
      let extraction = {};
      if (containsPin) {
        extraction = pinIsValid ? makeValidPinExtraction() : { entities: { pin: "1234" } };
      }

      responseHandler = await this.alexaHelper.pretendIntentCalled("pinStrategy", false, extraction);
      strategyClass = this.container.inversifyInstance.getTagged(componentInterfaces.authenticationStrategy, "strategy", PinStrategy) as PinStrategy;
      machine = this.container.inversifyInstance.get(injectionNames.current.stateMachine);
      currentSessionFactory = this.container.inversifyInstance.get(injectionNames.current.sessionFactory);
    }
  });

  describe("authenticate", function() {
    describe("no pin given", function() {
      beforeEach(async function(done) {
        await this.initialize(false);
        done();
      });

      describe("no session pin given", function() {
        it("returns AuthenticationResult.Deferred", async function(done) {
          let result = await callAuthenticate();
          expect(result).toEqual(AuthenticationResult.Deferred);
          done();
        });

        describe("assistant-validations is enabled", function() {
          it("prompts for pin", async function(done) {
            let result = await callAuthenticate();
            expect(responseHandler.voiceMessage).toEqual("Asking pin");
            done();
          });
        });

        describe("assistant-validations is not enabled", function() {
          it("throws exception", async function(done) {
            (strategyClass as any).promptFactory = undefined;
            try {
              await callAuthenticate();
              fail();
              done();
            } catch (e) {
              expect(true).toBeTruthy();
              done();
            }
          })
        });
      });

      describe("session pin given", function() {
        beforeEach(async function(done) {
          await currentSessionFactory().set("authentication:current-pin", "given");
          done();
        });

        it("returns AuthenticationResult.authenticated", async function(done) {
          let result = await callAuthenticate();
          expect(result).toEqual(AuthenticationResult.Authenticated);
          done();
        });
      });
    });

    describe("pin is given", function() {
      describe("given pin is valid", function() {
        beforeEach(async function(done) {
          await this.initialize();
          done();
        });

        it("returns AuthenticationResult.Authenticated", async function(done) {
          let result = await callAuthenticate();
          expect(result).toEqual(AuthenticationResult.Authenticated);
          done();
        });

        it("stores pin to session", async function(done) {
          let result = await callAuthenticate();
          let sessionContent = await currentSessionFactory().get("authentication:current-pin");
          expect(sessionContent).toEqual("given");
          done();
        });
      });

      describe("given pin is invalid", function() {
        beforeEach(async function(done) {
          await this.initialize(true, false);
          done();
        });

        it("returns AuthenticationResult.Failed", async function(done) {
          let result = await callAuthenticate();
          expect(result).toEqual(AuthenticationResult.Failed);
          done();
        });
      });
    });
  })
});
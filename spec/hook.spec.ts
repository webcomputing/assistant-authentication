import { callIntentHelper } from "./support/call-intent-helper";
import { HandlerInterface } from "assistant-alexa";

describe('BeforeIntentHook', function() {
  describe("without @authentication decorator", function() {
    it("does nothing", async function(done) {
      let responseHandler = await this.alexaHelper.pretendIntentCalled("noStrategy") as HandlerInterface;
      expect(responseHandler.voiceMessage).toEqual("Valid.");
      done();
    });
  });

  describe("with @authenticate decorator", function() {
    describe("having a single strategy assigned", function() {
      describe("if strategy results to true", function() {
        it("executes intent method", async function(done) {
          let responseHandler = await callIntentHelper(this.alexaHelper, "oAuthStrategy", ["oAuth"]);
          expect(responseHandler.voiceMessage).toEqual("Valid.");
          done();
        })
      });

      describe("if strategy results to false", function() {
        it("does not execute intent method", async function(done) {
          let responseHandler = await callIntentHelper(this.alexaHelper, "oAuthStrategy");
          expect(responseHandler.voiceMessage).toEqual("Invalid OAuth.");
          done();
        });
      });
    });

    describe("having multiple strategies defined", function() {
      describe("if all strategies result to true", function() {
        it("executes intent method", async function(done) {
          let responseHandler = await callIntentHelper(this.alexaHelper, "bothStrategies", ["oAuth", "pin"]);
          expect(responseHandler.voiceMessage).toEqual("Valid.");
          done();
        });
      });

      describe("if one strategy results to false", function() {
        it("does not execute intent method", async function(done) {
          let responseHandler = await callIntentHelper(this.alexaHelper, "bothStrategies", ["pin"]);
          expect(responseHandler.voiceMessage).toEqual("Invalid OAuth.");
          done();
        });

        it("contains correct error message", async function(done) {
          let responseHandler = await callIntentHelper(this.alexaHelper, "bothStrategies", ["oAuth"]);
          expect(responseHandler.voiceMessage).toEqual("Asking pin");
          done();
        });
      })
    });

    describe("in state", function() {
      describe("if strategy results to true", function() {
        it("executes any intent", async function(done) {
          let responseHandler = await callIntentHelper(this.alexaHelper, "noStrategy", ["oAuth"], "SecondState");
          expect(responseHandler.voiceMessage).toEqual("Valid.");
          done();
        });
      });

      describe("if strategy results to false", function() {
        it("does not execute any intent", async function(done) {
          let responseHandler = await callIntentHelper(this.alexaHelper, "noStrategy", [], "SecondState");
          expect(responseHandler.voiceMessage).toEqual("Invalid OAuth.");
          done();
        });
      });

      describe("and in intent", function() {
        describe("if all strategies result to true", function() {
          it("executes intent", async function(done) {
            let responseHandler = await callIntentHelper(this.alexaHelper, "pinStrategy", ["pin", "oAuth"], "SecondState");
            expect(responseHandler.voiceMessage).toEqual("Valid.");
            done();
          });  
        });

        describe("if state strategy result to false", function() {
          it("does not execute intent", async function(done) {
            let responseHandler = await callIntentHelper(this.alexaHelper, "pinStrategy", ["pin"], "SecondState");
            expect(responseHandler.voiceMessage).toEqual("Invalid OAuth.");
            done();
          });
        });

        describe("if intent strategy result to false", function() {
          it("does not execute intent", async function(done) {
            let responseHandler = await callIntentHelper(this.alexaHelper, "pinStrategy", ["oAuth"], "SecondState");
            expect(responseHandler.voiceMessage).toEqual("Asking pin");
            done();
          });
        })
      });
    });

    describe("having data attribute set", function() {
      it("sets assigned attribute in state", async function(done) {
        let responseHandler = await callIntentHelper(this.alexaHelper, "printAuthenticationData", ["oAuth"], "SecondState");
        expect(responseHandler.voiceMessage).toEqual("My username");
        done();
      })
    });
  });
})
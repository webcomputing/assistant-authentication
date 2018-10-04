import { callIntentHelper } from "./support/call-intent-helper";
import { ThisContext } from "./this-context";

describe("BeforeIntentHook", function() {
  beforeEach(async function(this: ThisContext) {
    this.prepareWithStates();
  });

  describe("without @authentication decorator", function() {
    it("does nothing", async function(this: ThisContext) {
      const responseResult = await callIntentHelper(this.alexaSpecHelper, "noStrategy");
      expect(responseResult.voiceMessage).toEqual({ text: "Valid.", isSSML: false });
    });
  });

  describe("with @authenticate decorator", function() {
    describe("having a single strategy assigned", function() {
      describe("if strategy results to true", function() {
        it("executes intent method", async function(this: ThisContext) {
          const responseResult = await callIntentHelper(this.alexaSpecHelper, "oAuthStrategy", ["oAuth"]);
          expect(responseResult.voiceMessage).toEqual({ text: "Valid.", isSSML: false });
        });
      });

      describe("if strategy results to false", function() {
        it("does not execute intent method", async function(this: ThisContext) {
          const responseResult = await callIntentHelper(this.alexaSpecHelper, "oAuthStrategy");
          expect(responseResult.voiceMessage).toEqual({ text: "Invalid OAuth.", isSSML: false });
        });
      });
    });

    describe("having multiple strategies defined", function() {
      describe("if all strategies result to true", function() {
        it("executes intent method", async function(this: ThisContext) {
          const responseResult = await callIntentHelper(this.alexaSpecHelper, "bothStrategies", ["oAuth", "pin"]);
          expect(responseResult.voiceMessage).toEqual({ text: "Valid.", isSSML: false });
        });
      });

      describe("if one strategy results to false", function() {
        it("does not execute intent method", async function(this: ThisContext) {
          const responseResult = await callIntentHelper(this.alexaSpecHelper, "bothStrategies", ["pin"]);
          expect(responseResult.voiceMessage).toEqual({ text: "Invalid OAuth.", isSSML: false });
        });

        it("contains correct error message", async function(this: ThisContext) {
          const responseResult = await callIntentHelper(this.alexaSpecHelper, "bothStrategies", ["oAuth"]);
          expect(responseResult.voiceMessage).toEqual({ text: "Asking pin", isSSML: false });
        });
      });
    });

    describe("in state", function() {
      describe("if strategy results to true", function() {
        it("executes any intent", async function(this: ThisContext) {
          const responseResult = await callIntentHelper(this.alexaSpecHelper, "noStrategy", ["oAuth"], "SecondState");
          expect(responseResult.voiceMessage).toEqual({ text: "Valid.", isSSML: false });
        });
      });

      describe("if strategy results to false", function() {
        it("does not execute any intent", async function(this: ThisContext) {
          const responseResult = await callIntentHelper(this.alexaSpecHelper, "noStrategy", [], "SecondState");
          expect(responseResult.voiceMessage).toEqual({ text: "Invalid OAuth.", isSSML: false });
        });
      });

      describe("and in intent", function() {
        describe("if all strategies result to true", function() {
          it("executes intent", async function(this: ThisContext) {
            const responseResult = await callIntentHelper(this.alexaSpecHelper, "pinStrategy", ["pin", "oAuth"], "SecondState");
            expect(responseResult.voiceMessage).toEqual({ text: "Valid.", isSSML: false });
          });
        });

        describe("if state strategy result to false", function() {
          it("does not execute intent", async function(this: ThisContext) {
            const responseResult = await callIntentHelper(this.alexaSpecHelper, "pinStrategy", ["pin"], "SecondState");
            expect(responseResult.voiceMessage).toEqual({ text: "Invalid OAuth.", isSSML: false });
          });
        });

        describe("if intent strategy result to false", function() {
          it("does not execute intent", async function(this: ThisContext) {
            const responseResult = await callIntentHelper(this.alexaSpecHelper, "pinStrategy", ["oAuth"], "SecondState");
            expect(responseResult.voiceMessage).toEqual({ text: "Asking pin", isSSML: false });
          });
        });
      });
    });

    describe("having data attribute set", function() {
      it("sets assigned attribute in state", async function(this: ThisContext) {
        const responseResult = await callIntentHelper(this.alexaSpecHelper, "printAuthenticationData", ["oAuth"], "SecondState");
        expect(responseResult.voiceMessage).toEqual({ text: "My username", isSSML: false });
      });
    });
  });
});

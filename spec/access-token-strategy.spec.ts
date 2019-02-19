import { AuthenticationResult } from "../src/components/authentication/public-interfaces";

/** Mock strategy classes, only used for this test */
import { AccountLinkingStatus, MinimalRequestExtraction, OptionalExtractions } from "assistant-source";
import { OAuthStrategy } from "./support/mocks/auth-strategies/oauth-strategy";
import { ThisContext } from "./support/this-context";

class OAuthMock extends OAuthStrategy {
  constructor(extraction: MinimalRequestExtraction & OptionalExtractions.OAuth & OptionalExtractions.AccountLinking) {
    super(extraction);
  }
}

interface CurrentThisContext extends ThisContext {
  strategy: OAuthMock;
  buildDefaultStrategy(result?: boolean): OAuthMock;
}

describe("AccessTokenStrategy", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.buildDefaultStrategy = (result = true) => {
      return new OAuthMock({ oAuthToken: result ? "validToken" : "invalidToken" } as any);
    };
  });

  describe("authenticate", function() {
    describe("with token", function() {
      describe("if strategy result is false", function() {
        beforeEach(function(this: CurrentThisContext) {
          this.strategy = this.buildDefaultStrategy(false);
        });

        it("returns AuthenticationResult.ForcePlatform", async function(this: CurrentThisContext) {
          return this.strategy.authenticate().then(result => {
            expect(result).toEqual(AuthenticationResult.ForcePlatformAuthentication);
          });
        });
      });

      describe("if strategy result is true", function() {
        beforeEach(function(this: CurrentThisContext) {
          this.strategy = this.buildDefaultStrategy(true);
        });

        it("returns authenticated data", async function(this: CurrentThisContext) {
          const result = (await this.strategy.authenticate()) as { status: AuthenticationResult; authenticatedData: {} };
          expect(result.authenticatedData).toEqual({ username: "My username" });
        });

        it("returns AuthenticationResult.Authenticated", async function(this: CurrentThisContext) {
          const result = (await this.strategy.authenticate()) as { status: AuthenticationResult; authenticatedData: {} };
          expect(result.status).toEqual(AuthenticationResult.Authenticated);
        });
      });
    });

    describe("without a token", function() {
      describe("when authentication was cancelled", function() {
        beforeEach(function(this: CurrentThisContext) {
          this.strategy = new OAuthMock({ oAuthToken: "", accountLinkingStatus: AccountLinkingStatus.CANCELLED } as any);
        });

        it("returns authenticated data", async function(this: CurrentThisContext) {
          const result = await this.strategy.authenticate();

          expect(result).toEqual(AuthenticationResult.Cancelled);
        });
      });
    });
  });
});

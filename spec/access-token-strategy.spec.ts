import { AuthenticationResult } from "../src/components/authentication/public-interfaces";

/** Mock strategy classes, only used for this test */
import { OAuthStrategy } from "./support/mocks/auth-strategies/oauth-strategy";
import { ThisContext } from "./this-context";
class OAuthMock extends OAuthStrategy {
  constructor(result = true) {
    super({ oAuthToken: result ? "validToken" : "invalidToken" } as any);
  }
}

interface CurrentThisContext extends ThisContext {
  strategy: OAuthMock;
}

describe("AccessTokenStrategy", function() {
  describe("authenticate", function() {
    describe("if strategy result is false", function() {
      beforeEach(function(this: CurrentThisContext) {
        this.strategy = new OAuthMock(false);
      });

      it("returns AuthenticationResult.ForcePlatform", async function(this: CurrentThisContext) {
        return this.strategy.authenticate().then(result => {
          expect(result).toEqual(AuthenticationResult.ForcePlatformAuthentication);
        });
      });
    });

    describe("if strategy result is true", function() {
      beforeEach(function(this: CurrentThisContext) {
        this.strategy = new OAuthMock(true);
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
});

import { AuthenticationResult } from "../src/components/authentication/interfaces";

/** Mock strategy classes, only used for this test */
import { OAuthStrategy } from "./support/mocks/auth-strategies/oauth-strategy";
class OAuthMock extends OAuthStrategy{
  constructor(result = true) {
    super({ oAuthToken: result === true ? "validToken" : "invalidToken" } as any);
  }
}

describe("AccessTokenStrategy", function() {
  describe("authenticate", function() {
    describe("if strategy result is false", function() {
      beforeEach(function() {
        this.strategy = new OAuthMock(false);
      });

      it("returns AuthenticationResult.ForcePlatform", function() {
        return this.strategy.authenticate().then(result => {
          expect(result).toEqual(AuthenticationResult.ForcePlatformAuthentication);
        });
      });
    });

    describe("if strategy result is true", function() {
      beforeEach(function() {
        this.strategy = new OAuthMock(true);
      });

      it("returns authenticated data", function() {
        return this.strategy.authenticate().then(result => {
          expect(result.authenticatedData).toEqual({ username: "My username" })
        });
      });

      it("returns AuthenticationResult.Authenticated", function() {
        return this.strategy.authenticate().then(result => {
          expect(result.status).toEqual(AuthenticationResult.Authenticated);
        });
      });
    });
  })
});
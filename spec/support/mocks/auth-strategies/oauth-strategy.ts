import { AccessTokenAuthentication } from "../../../../src/components/authentication/strategies/access-token";

export class OAuthStrategy extends AccessTokenAuthentication {
  validateAccessToken(token: string) {
    return Promise.resolve({result: token === "validToken", authenticationData: { username: "My username" }});
  }
}
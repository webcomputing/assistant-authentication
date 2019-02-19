import { injectable } from "inversify";
import { AccessTokenAuthentication } from "../../../../src/components/authentication/strategies/access-token";

@injectable()
export class OAuthStrategy extends AccessTokenAuthentication {
  public validateAccessToken(token: string) {
    return Promise.resolve({ result: token === "validToken", authenticationData: { username: "My username" } });
  }
}

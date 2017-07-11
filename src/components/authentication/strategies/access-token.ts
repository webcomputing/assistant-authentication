import { injectable, inject } from "inversify";
import { unifierInterfaces } from "assistant-source";

import { AuthenticationStrategy as StrategyInterface, AuthenticationResult } from "../interfaces";

@injectable()
export abstract class AccessTokenAuthentication implements StrategyInterface {
  private extraction: unifierInterfaces.MinimalRequestExtraction & unifierInterfaces.OptionalExtractions.OAuthExtraction;

  constructor(@inject("core:unifier:current-extraction") extraction: unifierInterfaces.MinimalRequestExtraction & unifierInterfaces.OptionalExtractions.OAuthExtraction) {
    this.extraction = extraction;
  }

  async authenticate() {
    if (typeof this.extraction.oAuthToken === "undefined") return AuthenticationResult.ForcePlatformAuthentication;

    let methodResult = await this.validateAccessToken(this.extraction.oAuthToken);
    let internalResult = typeof methodResult === "boolean" ? { result: methodResult, authenticationData: {} } : methodResult;

    if (internalResult.result) {
      return { status: AuthenticationResult.Authenticated, authenticatedData: internalResult.authenticationData };
    } else {
      return AuthenticationResult.ForcePlatformAuthentication;
    }
  }

  abstract async validateAccessToken(token: string): Promise<boolean | { result: boolean, authenticationData: any }>;
}
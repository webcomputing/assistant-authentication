import { injectable, inject } from "inversify";
import { OptionalExtractions, MinimalRequestExtraction } from "assistant-source";

import { AuthenticationStrategy as StrategyInterface, AuthenticationResult } from "../public-interfaces";

@injectable()
export abstract class AccessTokenAuthentication implements StrategyInterface {
  private extraction: MinimalRequestExtraction & OptionalExtractions.OAuthExtraction;

  constructor(@inject("core:unifier:current-extraction") extraction: MinimalRequestExtraction & OptionalExtractions.OAuthExtraction) {
    this.extraction = extraction;
  }

  async authenticate() {
    if (typeof this.extraction.oAuthToken === "undefined") return AuthenticationResult.ForcePlatformAuthentication;

    let methodResult = await this.validateAccessToken(this.extraction.oAuthToken as string);
    let internalResult = typeof methodResult === "boolean" ? { result: methodResult, authenticationData: {} } : methodResult;

    if (internalResult.result) {
      return { status: AuthenticationResult.Authenticated, authenticatedData: internalResult.authenticationData };
    } else {
      return AuthenticationResult.ForcePlatformAuthentication;
    }
  }

  abstract async validateAccessToken(token: string): Promise<boolean | { result: boolean, authenticationData: any }>;
}
import { MinimalRequestExtraction, OptionalExtractions } from "assistant-source";
import { inject, injectable } from "inversify";

import { AuthenticationResult, AuthenticationStrategy as StrategyInterface, StrategyResult } from "../public-interfaces";

@injectable()
export abstract class AccessTokenAuthentication implements StrategyInterface {
  private extraction: MinimalRequestExtraction & OptionalExtractions.OAuth;

  constructor(@inject("core:unifier:current-extraction") extraction: MinimalRequestExtraction & OptionalExtractions.OAuth) {
    this.extraction = extraction;
  }

  public async authenticate(): Promise<StrategyResult> {
    if (typeof this.extraction.oAuthToken === "undefined") return AuthenticationResult.ForcePlatformAuthentication;

    const methodResult = await this.validateAccessToken(this.extraction.oAuthToken as string);
    const internalResult = typeof methodResult === "boolean" ? { result: methodResult, authenticationData: {} } : methodResult;

    if (internalResult.result) {
      return { status: AuthenticationResult.Authenticated, authenticatedData: internalResult.authenticationData };
    }
    return AuthenticationResult.ForcePlatformAuthentication;
  }

  public abstract async validateAccessToken(token: string): Promise<boolean | { result: boolean; authenticationData: any }>;
}

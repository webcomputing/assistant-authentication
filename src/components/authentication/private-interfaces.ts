/** Component interfaces of assistant-authentication */
export const componentInterfaces = {
  "authenticationStrategy": Symbol("authentication:authentication-strategy")
};

export namespace Configuration {
  /** Configuration defaults -> all of these keys are optional for user */
  export interface Defaults {}

  /** Required configuration options, no defaults are used here */
  export interface Required {}

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {};
}
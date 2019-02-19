/** Component interfaces of assistant-authentication */
export const componentInterfaces = {
  authenticationStrategy: Symbol("authentication:authentication-strategy"),
};

export namespace Configuration {
  /** Configuration defaults -> all of these keys are optional for user */
  // tslint:disable-next-line:no-empty-interface
  export interface Defaults {}

  /** Required configuration options, no defaults are used here */
  // tslint:disable-next-line:no-empty-interface
  export interface Required {}

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {}
}

export const COMPONENT_NAME = "authentication";

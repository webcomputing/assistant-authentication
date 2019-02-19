/** Names of injectionable services, leads to fewer typing errors for most important injections */
export const authenticationInjectionNames = {
  /**
   * Inject an instance of @type {StrategyFactory}
   */
  strategyFactory: "authentication:strategy-factory",
};

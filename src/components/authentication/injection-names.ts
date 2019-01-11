/** Names of injectionable services, leads to fewer typing errors for most important injections */
export const authenticationInjectionNames = {
  /**
   * Inject an instance of @type {Component<Configuration.Runtime>}
   */
  component: "meta:component//authentication",
  /**
   * Inject an instance of @type {(strategyClass: StrategyClass) => any}
   */
  strategyFactory: "authentication:strategy-factory",
};

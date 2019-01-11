/** Names of injectionable services, leads to fewer typing errors for most important injections */
export const authenticationInjectionNames = {
  /**
   * Inject an instance of @type {Component<Configuration.Runtime>}
   */
  component: "meta:component//authentication",
  /**
   * Namespace for services which are only available in the request scope.
   */
  current: {
    /**
     * Inject an instance of @type {(strategyClass: StrategyClass) => any}
     */
    strategyFactory: "authentication:strategy-factory",
  },
};

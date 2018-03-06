import { ComponentDescriptor } from "inversify-components";
import { AssistantJSSetup } from "assistant-source";
import * as fs from "fs";
import { StrategyClass, AuthenticationStrategy } from "./public-interfaces";

export class AuthenticationSetup {
  strategySet: { [name: string]: StrategyClass } = {};
  assistantJs: AssistantJSSetup;

  constructor(setup: AssistantJSSetup) {
    this.assistantJs = setup;
  }

  /** 
   * [Sync!] Adds all classes in a specific directory as strategies.
   * @param addOnly If set to true, this method only calls "addStrategy", but not final "registerStrategies"
   * @param baseDirectory Base directory to start (process.cwd() + "/js/app")
   * @param dictionary Dictionary which contains strategy classes, defaults to "auth"
   */
  registerByConvention(addOnly = false, baseDirectory = process.cwd() + "/js/app", dictionary = "/auth-strategies") {
    fs.readdirSync(baseDirectory + dictionary).forEach(file => {
      let suffixParts = file.split(".");
      let suffix = suffixParts[suffixParts.length-1];

      // Load if file is a JavaScript file
      if (suffix !== "js") return;
      let classModule = require(baseDirectory + dictionary + "/" + file);

      Object.keys(classModule).forEach(exportName => {
        this.addStrategy(classModule[exportName]);
      });
    })

    if (!addOnly) this.registerStrategies();
  }

  /** 
   * Adds a strategy to setup 
   * @param strategyClass Class of strategy to add 
   * @param name Name of strategy, by convention it defaults to name of class
  */
  addStrategy(strategyClass: StrategyClass, name = strategyClass.name) {
    this.strategySet[name] = strategyClass;
  }

  /** Registers all strategies in dependency injection container */
  registerStrategies() {
    this.assistantJs.registerComponent(this.toComponentDescriptor());
  }

  /** Builds a component descriptor out of all added strategies */
  toComponentDescriptor(): ComponentDescriptor {
    return {
      name: "authentication:strategies",
      bindings: {
        root: () => {},
        request: (bindService, lookupService) => {
          let strategyInterface = lookupService.lookup("authentication").getInterface("authenticationStrategy");

          Object.keys(this.strategySet).forEach(strategyName => {
            bindService.bindExtension<AuthenticationStrategy>(strategyInterface).to(this.strategySet[strategyName]).whenTargetTagged("strategy", this.strategySet[strategyName]);
          })
        }
      }
    }
  }
}
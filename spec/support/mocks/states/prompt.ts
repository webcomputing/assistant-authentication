import { injectable, inject } from "inversify";
import { State, EntityDictionary, CurrentSessionFactory, PlatformGenerator, injectionNames, BaseState } from "assistant-source";
import { PromptStateMixinRequirements, PromptStateMixin } from "assistant-validations";

/** 
 * This small class is needed to apply the PromptStateMixin since TypeScript does not allow type-specific constructor mixins. 
 * Just add it to your regular class hierarchy.
 */
class PromptStateRequirements extends BaseState implements PromptStateMixinRequirements {
  constructor(
    stateSetupSet: State.SetupSet,
    public entities: EntityDictionary,
    public sessionFactory: CurrentSessionFactory,
    public mappings: PlatformGenerator.EntityMapping
  ) {
    super(stateSetupSet);
  }
}

@injectable()
export class PromptState extends PromptStateMixin(PromptStateRequirements) {
  constructor(
    @inject(injectionNames.current.stateSetupSet) setupSet: State.SetupSet,
    @inject(injectionNames.current.entityDictionary) entities: EntityDictionary,
    @inject(injectionNames.current.sessionFactory) sessionFactory: CurrentSessionFactory,
    @inject("core:unifier:user-entity-mappings") mappings: PlatformGenerator.EntityMapping
  ) {
    super(setupSet, entities, sessionFactory, mappings);
  }
}
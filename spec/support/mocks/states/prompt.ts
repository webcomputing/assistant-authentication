import {
  BaseState,
  BasicAnswerTypes,
  BasicHandable,
  CurrentSessionFactory,
  EntityDictionary,
  injectionNames,
  PlatformGenerator,
  State,
} from "assistant-source";
import { PromptStateMixin, PromptStateMixinRequirements } from "assistant-validations";
import { inject, injectable } from "inversify";

/**
 * This small class is needed to apply the PromptStateMixin since TypeScript does not allow type-specific constructor mixins.
 * Just add it to your regular class hierarchy.
 */
class PromptStateRequirements<MergedAnswerTypes extends BasicAnswerTypes, MergedHandler extends BasicHandable<MergedAnswerTypes>>
  extends BaseState<MergedAnswerTypes, MergedHandler>
  implements PromptStateMixinRequirements {
  constructor(
    stateSetupSet: State.SetupSet<MergedAnswerTypes, MergedHandler>,
    public entities: EntityDictionary,
    public sessionFactory: CurrentSessionFactory,
    public mappings: PlatformGenerator.EntityMapping
  ) {
    super(stateSetupSet);
  }
}

// tslint:disable-next-line:max-classes-per-file
@injectable()
export class PromptState<MergedAnswerTypes extends BasicAnswerTypes, MergedHandler extends BasicHandable<MergedAnswerTypes>> extends PromptStateMixin(
  PromptStateRequirements
)<MergedAnswerTypes, MergedHandler> {
  constructor(
    @inject(injectionNames.current.stateSetupSet) setupSet: State.SetupSet<MergedAnswerTypes, MergedHandler>,
    @inject(injectionNames.current.entityDictionary) entities: EntityDictionary,
    @inject(injectionNames.current.sessionFactory) sessionFactory: CurrentSessionFactory,
    @inject(injectionNames.userEntityMappings) mappings: PlatformGenerator.EntityMapping
  ) {
    super(setupSet, entities, sessionFactory, mappings);
  }
}

import { unifierInterfaces } from "assistant-source";

export declare type ValidStrategies = 'oAuth' | 'pin'

export async function callIntentHelper(platformHelper: unifierInterfaces.PlatformSpecHelper, intent: unifierInterfaces.intent, validStrategies: ValidStrategies[] = [], state: "MainState" | "SecondState" = "MainState") {
  let extractions = validStrategies.reduce((previous, current) => {
    let extraction: any;

    switch(current) {
      case 'oAuth':
        extraction = makeValidOAuthExtraction();
        break;
      
      case 'pin':
        extraction = makeValidPinExtraction();
        break;
    }

    return Object.assign(previous, extraction);
  }, {});

  let responseHandle = await platformHelper.pretendIntentCalled(intent, false, extractions);
  await platformHelper.specSetup.runMachine(state);
  return responseHandle;
}

export function makeValidOAuthExtraction() {
  return {
    oAuthToken: 'validToken'
  }
}

export function makeValidPinExtraction() {
  return {
    entities: {
      pin: '1111'
    }
  }
}
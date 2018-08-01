// tslint:disable-next-line:no-implicit-dependencies
import { AlexaSpecHelper } from "assistant-alexa";
import { BasicAnswerTypes, intent as Intent } from "assistant-source";

export declare type ValidStrategies = "oAuth" | "pin";

export async function callIntentHelper(
  alexaSpecHelper: AlexaSpecHelper,
  intent: Intent,
  validStrategies: ValidStrategies[] = [],
  state: "MainState" | "SecondState" = "MainState"
): Promise<Partial<BasicAnswerTypes>> {
  const extractions = validStrategies.reduce((previous, current) => {
    let extraction: any;

    switch (current) {
      case "oAuth":
        extraction = makeValidOAuthExtraction();
        break;

      case "pin":
        extraction = makeValidPinExtraction();
        break;
    }

    return { ...previous, ...extraction };
  }, {});

  await alexaSpecHelper.pretendIntentCalled(intent, false, extractions);
  await alexaSpecHelper.specSetup.runMachine(state);
  return alexaSpecHelper.specSetup.getResponseResults();
}

export function makeValidOAuthExtraction() {
  return {
    oAuthToken: "validToken",
  };
}

export function makeValidPinExtraction() {
  return {
    entities: {
      pin: "1111",
    },
  };
}

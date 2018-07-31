import { injectable } from "inversify";
import { PinAuthentication } from "../../../../src/components/authentication/strategies/pin";

@injectable()
export class PinStrategy extends PinAuthentication {
  public validatePin(pin: string) {
    return Promise.resolve(pin === "1111");
  }
}

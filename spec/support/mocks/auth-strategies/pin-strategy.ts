import { PinAuthentication } from "../../../../src/components/authentication/strategies/pin";
import { injectable } from "inversify";

@injectable()
export class PinStrategy extends PinAuthentication {
  validatePin(pin: string) {
    return Promise.resolve(pin === "1111");
  }
}
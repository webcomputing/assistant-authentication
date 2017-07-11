import { PinAuthentication } from "../../../../src/components/authentication/strategies/pin";

export class PinStrategy extends PinAuthentication {
  validatePin(pin: string) {
    return Promise.resolve(pin === "1111");
  }
}
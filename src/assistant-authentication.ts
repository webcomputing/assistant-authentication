export * from "./components/authentication/public-interfaces";
export { descriptor } from "./components/authentication/descriptor";
export { authenticate } from "./components/authentication/annotations";
export { AuthenticationSetup } from "./components/authentication/setup";

import { AccessTokenAuthentication } from "./components/authentication/strategies/access-token";
import { PinAuthentication } from "./components/authentication/strategies/pin";
export const strategies = {
  AccessTokenAuthentication,
  PinAuthentication,
};

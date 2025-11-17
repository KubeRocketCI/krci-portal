import { t } from "../../trpc";
import { authLoginProcedure } from "./procedures/login";
import { authLoginCallbackProcedure } from "./procedures/loginCallback";
import { authLoginWithTokenProcedure } from "./procedures/loginWithToken";
import { authLogoutProcedure } from "./procedures/logout";
import { authMeProcedure } from "./procedures/me";

export const authRouter = t.router({
  login: authLoginProcedure,
  loginCallback: authLoginCallbackProcedure,
  loginWithToken: authLoginWithTokenProcedure,
  logout: authLogoutProcedure,
  me: authMeProcedure,
});

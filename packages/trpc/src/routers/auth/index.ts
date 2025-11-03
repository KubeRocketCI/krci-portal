import { t } from "../../trpc";
import { authLoginProcedure } from "./procedures/login";
import { authLoginCallbackProcedure } from "./procedures/loginCallback";
import { authLogoutProcedure } from "./procedures/logout";
import { authMeProcedure } from "./procedures/me";

export const authRouter = t.router({
  login: authLoginProcedure,
  loginCallback: authLoginCallbackProcedure,
  logout: authLogoutProcedure,
  me: authMeProcedure,
});

import { t } from "../../trpc.js";
import { authLoginProcedure } from "./procedures/login/index.js";
import { authLoginCallbackProcedure } from "./procedures/loginCallback/index.js";
import { authLoginWithTokenProcedure } from "./procedures/loginWithToken/index.js";
import { authLogoutProcedure } from "./procedures/logout/index.js";
import { authMeProcedure } from "./procedures/me/index.js";

export const authRouter = t.router({
  login: authLoginProcedure,
  loginCallback: authLoginCallbackProcedure,
  loginWithToken: authLoginWithTokenProcedure,
  logout: authLogoutProcedure,
  me: authMeProcedure,
});

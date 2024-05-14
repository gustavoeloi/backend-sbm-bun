import { Elysia, t } from "elysia";
import { registerEstablishment } from "./routes/register-establishment";
import { sendAuthLink } from "./routes/send-auth-link";
import jwt from "@elysiajs/jwt";
import { env } from "../env";
import cookie from "@elysiajs/cookie";

const app = new Elysia()
  .use(
    jwt({
      secret: env.JWT_SECRET_KEY,
      schema: t.Object({
        sub: t.String(),
        establishmentsId: t.Optional(t.String()),
      }),
    }),
  )
  .use(cookie())
  .use(registerEstablishment)
  .use(sendAuthLink);

app.listen(3333, () => {
  console.log("Http Server is Running...");
});

import { Elysia } from "elysia";
import { registerEstablishment } from "./routes/register-establishment";
import { sendAuthLink } from "./routes/send-auth-link";

const app = new Elysia().use(registerEstablishment).use(sendAuthLink);

app.listen(3333, () => {
  console.log("Http Server is Running...");
});

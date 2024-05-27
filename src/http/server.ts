import { Elysia } from "elysia";
import { authenticateFromLink } from "./routes/authenticate-from-link";
import { registerEstablishment } from "./routes/register-establishment";
import { sendAuthLink } from "./routes/send-auth-link";
import { signOut } from "./routes/sign-out";
import { getProfile } from "./routes/get-profile";
import { getManagedEstablishment } from "./routes/get-managed-establishment";
import { getOrderDetails } from "./routes/get-order-details";
import { approveOrder } from "./routes/approve-order";
import { cancelOrder } from "./routes/cancel-order";
import { deliverOrder } from "./routes/deliver-order";

const app = new Elysia()
  .use(registerEstablishment)
  .use(sendAuthLink)
  .use(authenticateFromLink)
  .use(signOut)
  .use(getProfile)
  .use(getManagedEstablishment)
  .use(getOrderDetails)
  .use(approveOrder)
  .use(cancelOrder)
  .use(deliverOrder)
  .onError(({ error, set, code }) => {
    switch (code) {
      case "VALIDATION": {
        set.status = error.status
        return error.toResponse()

      }
      case "INTERNAL_SERVER_ERROR": {
        set.status = 500
        return { code, message: error.message }        
      }
      default: {
        console.error(error)

        return new Response(null, {status: 500})
      }
    }
  });

app.listen(3333, () => {
  console.log("Http Server is Running...");
});

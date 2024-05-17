import Elysia from "elysia";
import { auth } from "../auth";
import { db } from "../../db/connection";

export const getManagedEstablishment = new Elysia().use(auth).get("/get-establishment", async ({cookie: {authCookie}, jwt}) => {

  const authenticatedCookie = String(authCookie.cookie.value);

  const payload = await jwt.verify(authenticatedCookie);


  if(!payload) {
    throw new Error("Unathorizad")
  }

  if(!payload.establishmentsId) {
    throw new Error("User it not a manager.")
  }

  const idEstablishment = payload.establishmentsId

  const managedEstablishment = await db.query.establishments.findFirst({
    where(fields, {eq}) {
      return eq(fields.id, idEstablishment)
    },
  })

  
  return managedEstablishment;
})
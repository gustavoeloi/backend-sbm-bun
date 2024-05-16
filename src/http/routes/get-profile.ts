import Elysia from "elysia";
import { auth } from "../auth";
import { db } from "../../db/connection";

export const getProfile = new Elysia().use(auth).get("/me", async ({cookie: {authCookie}, jwt}) => {
  const authenticatedCookie = String(authCookie.cookie.value);

  const payload = await jwt.verify(authenticatedCookie)

  if(!payload) {
    throw new Error("Unauthorizad.")
  }

  const profile = {
    userId: payload.sub,
    establishmentId: payload.establishmentsId
  }

  const user = await db.query.users.findFirst({
    where(fields, {eq}) {
      return eq(fields.id, profile.userId)
    },
  })

  if(!user) {
    throw new Error("User not found!")
  }

  return user;
})
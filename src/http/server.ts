import { Elysia, t } from "elysia";
import { db } from "../db/connection";
import { establishments, users } from "../db/schema";

const app = new Elysia().post(
  "/establishments",
  async ({ body, set }) => {
    const { establishmentName, managerName, email, phone } = body;

    const [manager] = await db
      .insert(users)
      .values({
        name: managerName,
        email,
        phone,
        role: "manager",
      })
      .returning({
        id: users.id,
      });

    await db.insert(establishments).values({
      name: establishmentName,
      managerId: manager.id,
    });

    set.status = "Created";
  },
  {
    body: t.Object({
      establishmentName: t.String(),
      managerName: t.String(),
      email: t.String({ format: "email" }),
      phone: t.String(),
    }),
  },
);

app.listen(3333, () => {
  console.log("Http Server is Running...");
});

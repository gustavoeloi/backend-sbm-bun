/* eslint-disable drizzle/enforce-delete-with-where */
import { faker } from "@faker-js/faker";
import { users, establishments } from "./schema";
import { db } from "./connection";
import chalk from "chalk";

await db.delete(users);
await db.delete(establishments);

console.log(chalk.yellow("Database reset! ☠️"));

await db.insert(users).values([
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "customer",
  },
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "customer",
  },
]);

console.log(chalk.green("Created customers! 🚶"));

const [managerId] = await db
  .insert(users)
  .values([
    {
      name: faker.person.fullName(),
      email: "admin@admin.com",
      role: "manager",
    },
  ])
  .returning({
    id: users.id,
  });

console.log(chalk.green("Created manager! 🚶"));

await db.insert(establishments).values([
  {
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    managerId: managerId.id,
  },
]);

console.log(chalk.green("Created establishment 🏪"));

console.log(chalk.greenBright("Database seeded sucessfully!"));

process.exit();

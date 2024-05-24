/* eslint-disable drizzle/enforce-delete-with-where */
import { faker } from "@faker-js/faker";
import { users, establishments, orderItems, orders, products, authLinks } from "./schema";
import { db } from "./connection";
import chalk from "chalk";
import { createId } from "@paralleldrive/cuid2";

await db.delete(users);
await db.delete(establishments);
await db.delete(orderItems);
await db.delete(orders);
await db.delete(products);
await db.delete(authLinks);

console.log(chalk.yellow("Database reset! ☠️"));

const [customer1, customer2] = await db.insert(users).values([
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
]).returning();

console.log(chalk.green("Created customers! 🚶"));

const [managerId] = await db
  .insert(users)
  .values([
    {
      name: faker.person.fullName(),
      email: "gustavooeloi@gmail.com",
      role: "manager",
    },
  ])
  .returning({
    id: users.id,
  });

console.log(chalk.green("Created manager! 🚶"));

const [establishment] = await db.insert(establishments).values([
  {
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    managerId: managerId.id,
  },
]).returning();

console.log(chalk.green("Created establishment 🏪"));

function generateProduct() {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    establishmentId: establishment.id,
    priceInCents: Number(faker.commerce.price({ min: 190, max: 490, dec: 0 }))
  }
}

const availableProducts = await db.insert(products).values([
  generateProduct(),
  generateProduct(),
  generateProduct(),
  generateProduct(),
  generateProduct(),
  generateProduct(),
]).returning()

console.log(chalk.green("Created products 🐣"));


// Create Orders

type OrderItemInsert = typeof orderItems.$inferInsert
type OrderInsert = typeof orders.$inferInsert

const orderItemsToInsert: OrderItemInsert[] = []
const ordersToInsert: OrderInsert[] = []

let totalInCents = 0;


for (let i = 0; i < 200; i++) {
  const orderId = createId();

  const orderProducts = faker.helpers.arrayElements(availableProducts, {
    min: 1,
    max: 3
  })

  orderProducts.forEach(orderProduct => {
    const quantity = faker.number.int({ min: 1, max: 3 })

    totalInCents += orderProduct.priceInCents + quantity;

    orderItemsToInsert.push({
      orderId,
      totalInCents: orderProduct.priceInCents,
      quantity,
      productId: orderProduct.id
    })
  })

  ordersToInsert.push({
    id: orderId,
    customerId: faker.helpers.arrayElement([customer1.id, customer2.id]),
    establishmentId: establishment.id,
    totalInCents,
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'delivering',
      'delivered',
      'canceled'
    ]),
    createdAt: faker.date.recent({ days: 40 })
  })
}

await db.insert(orders).values(ordersToInsert);
await db.insert(orderItems).values(orderItemsToInsert);

console.log(chalk.yellowBright("🛵 Created orderes!"));



console.log(chalk.greenBright("Database seeded sucessfully! 💽"));

process.exit();

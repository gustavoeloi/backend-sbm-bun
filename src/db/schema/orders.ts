import { text, timestamp, pgTable, integer, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { establishments } from "./establishments";
import { users } from "./users";
import { relations } from "drizzle-orm";
import { orderItems } from "./order-items";

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'delivering',
  'delivered',
  'canceled'
])

export const orders = pgTable("orders", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  customerId: text('customer_id').references(() => users.id, {
    onDelete: 'set null'
  }),
  establishmentId: text("establishment_id").references(() => establishments.id, {
    onDelete: "cascade"
  }),
  status: orderStatusEnum('status').default("pending"),
  totalInCents: integer('total_in_cents').notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ordersRelations = relations(orders, ({one, many}) => {
  return {
    customer: one(users, {
      fields: [orders.customerId],
      references: [users.id],
      relationName: 'order_customer'
    }),
    establishment: one(establishments, {
      fields: [orders.customerId],
      references: [establishments.id],
      relationName: 'order_establishment'
    }),
    orderItems: many(orderItems) 
  }
})
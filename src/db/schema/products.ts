import { text, timestamp, pgTable, integer } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { establishments } from "./establishments";
import { relations } from "drizzle-orm";
import { orders } from "./orders";
import { orderItems } from "./order-items";

export const products = pgTable("products", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priceInCents: integer("price_in_cents").notNull(),
  establishmentId: text("establishment_id").notNull().references(() => establishments.id, {
    onDelete: 'cascade'
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productsRelations = relations(products, ({one, many}) => {
  return {
    establishment: one(establishments, {
      fields: [products.establishmentId],
      references: [establishments.id],
      relationName: 'product_establishment'
    }),
    orderItems: many(orderItems) 
  }
})
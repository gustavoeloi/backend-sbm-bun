import { text, timestamp, pgTable, integer, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { establishments } from "./establishments";
import { users } from "./users";
import { orders } from "./orders";
import { relations } from "drizzle-orm";
import { products } from "./products";


export const orderItems = pgTable("order_items", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  orderId: text('order_id').references(() => orders.id, {
    onDelete: 'set null'
  }),
  productId: text("product_id").references(() => users.id, {
    onDelete: "set null"
  }),
  totalInCents: integer('price_in_cents').notNull(),
  quantity: integer("quantity").notNull(),
});

export const orderItemsRelations = relations(orderItems, ({one, many}) => {
  return {
    order: one(orders, {
      fields: [orderItems.orderId],
      references: [orders.id],
      relationName: 'order_item_order'
    }),
    product: one(products, {
      fields: [orderItems.orderId],
      references: [products.id],
      relationName: 'product_item_order'
    }),
  }
})
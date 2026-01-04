
import { integer, pgTable, varchar, date } from "drizzle-orm/pg-core";
import { json } from "drizzle-orm/pg-core";



export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits:integer().default(5)
});

export const ProjectTable=pgTable('project',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId:varchar().notNull(),
  userInput:varchar(),
  device:varchar(),
  createdOn:date().defaultNow(),
  config:json(),
  userId:varchar().references(()=> usersTable.email).notNull()
})
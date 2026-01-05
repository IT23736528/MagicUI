
import { integer, pgTable, varchar, date, text } from "drizzle-orm/pg-core";
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
  projectName: varchar(),
  theme: varchar(),
  userInput:varchar(),
  device:varchar(),
  createdOn:date().defaultNow(),
  config:json(),
  projectVisualDescription: text(),
  userId:varchar().references(()=> usersTable.email).notNull()
})

export const ScreenConfigTable=pgTable('screenConfig',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId:varchar().references(()=> ProjectTable.projectId).notNull(),
  screenId:varchar().notNull(),
  screenName:varchar(),
  purpose:varchar(),
  screenDescription: varchar(),
  code: text(),
})
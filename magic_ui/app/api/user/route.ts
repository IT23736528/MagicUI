import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();

        // 1. Check if user is actually logged in via Clerk
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: "Unauthorized: No user found" }, { status: 401 });
        }

        const userEmail = user.primaryEmailAddress.emailAddress;

        // 2. Search for user
        const users = await db.select()
            .from(usersTable)
            .where(eq(usersTable.email, userEmail));

        // 3. If user doesn't exist, create them
        if (users.length === 0) {
            const result = await db.insert(usersTable).values({
                name: user.fullName ?? '',
                email: userEmail,
            }).returning();

            return NextResponse.json({ user: result[0] });
        }

        // 4. Return existing user
        return NextResponse.json({ user: users[0] });

    } catch (error: any) {
        console.error("USER_ROUTE_ERROR:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message }, 
            { status: 500 }
        );
    }
}
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const user=await currentUser();

    const users=await db.select().from(usersTable).where(eq(usersTable.email,user?.primaryEmailAddress?.emailAddress as string));

    if(users?.length==0){
        const data= {
            name: user?.fullName??'',
            email: user?.primaryEmailAddress?.emailAddress as string
            
        }

        const result=await db.insert(usersTable).values({...data}).returning();

        return NextResponse.json(result);
    }

    return NextResponse.json({user:users[0]??{}});
}
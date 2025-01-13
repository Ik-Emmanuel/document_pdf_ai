"use server"

import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";



export const validateUser = async ( user: KindeUser) => {


    if (!user) throw new Error("Unauthorized")
   

    const dbUser = await db.user.findFirst({
        where: {
            id: user.id,
        },
    })

    if (!dbUser) {
        console.log("user not found, creating")
        // create user in db
        await db.user.create({
            data: {
                id: user.id,
                email: user.email || "",
            },
        })
    } else {
        return
    }

};
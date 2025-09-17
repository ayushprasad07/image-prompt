import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import Admin from "@/model/Admin";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    const superAdmin : User = session?.user as User;

    if(!superAdmin || superAdmin.role !== "superadmin"){
        return Response.json({
            success : false,
            message: "Unauthorized"
        },{
            status : 401
        })
    }


    try {
        const { username, password } = await req.json();
        if(!username || !password){
            return Response.json({
                success : false,
                message: "Please provide username and password"
            },{
                status : 400,
                headers : {
                    "Content-Type" : "application/json"
                }
            })
        }

        const existing = await Admin.findOne({ username });

        if(existing){
            return Response.json({
                success : false,
                message: "Username already exists"
            },{
                status : 400,
                headers : {
                    "Content-Type" : "application/json"
                }
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            username,
            password : hashedPassword,
        });

        return Response.json({
            success : true,
            message: "Credentials created successfully",
            admin
        },{
            status : 200,
        })
    } catch (error) {
        return Response.json({
            success : false,
            message: "Something went wrong"
        },{
            status : 500,
            headers : {
                "Content-Type" : "application/json"
            }
        })
    }
}
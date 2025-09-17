import bcrypt from "bcryptjs";

const Password = "SuperSecure123"
const hash = bcrypt.hashSync(Password, 10);
console.log(hash); 

export async function GET(req: Request) {
    return Response.json({
        password : hash
    });
}
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { email, password } = req.body;
        const allowedEmail = process.env.ALLOWED_EMAIL;
        const allowedPassword = process.env.ALLOWED_PASSWORD;

        if (email === allowedEmail && password === allowedPassword) {
            return res.status(200).json({ message: "Sign-in successful" });
        } else {
            return res.status(401).json({ message: "Invalid credentials" });
        }
    }
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

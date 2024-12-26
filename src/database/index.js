import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export default async function connectDB() {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("MongoDB Connected!!");
    } catch (error) {
        console.log("MongoDB Connection Error: ", error);
    }
}

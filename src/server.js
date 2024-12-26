import connectDB from "./database/index.js";
import { app } from "./app";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 4000;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        app.on("error", (err) => {
            console.log(`Server error: ${err}`);
            throw err;
        });
    })
    .catch((err) => {
        console.log(err.message);
    });

import express from "express";
import cros from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cros(
    {
        origin: process.env.CROS_ORIGIN,
        credentials: true,
    }
))
app.use(express.json(limit = "16kb"));
app.use(express.urlencoded({extended: true,limit : "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());


export default app;
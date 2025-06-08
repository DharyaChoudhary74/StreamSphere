import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(
    cors(
    {
        origin: process.env.CROS_ORIGIN,
        credentials: true,
    }
))
app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({extended: true,limit : "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//import
import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
app.use("/users", userRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/comments", commentRouter);


export default app;
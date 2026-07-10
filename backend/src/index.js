const express = require('express')
const app = express();
require('dotenv').config();
const main =  require('./config/db')
const cookieParser =  require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit")
const aiRouter = require("./routes/aiChatting")
const videoRouter = require("./routes/videoCreator");
const cors = require('cors')
const path = require('path');
const fs = require('fs');
const seedProblemTopics = require('./utils/seedProblemTopics');

// console.log("Hello")

app.use(cors({
    origin:  [process.env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true 
}))

app.use(express.json());
app.use(cookieParser());

app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);
app.use("/video",videoRouter);

const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
}

app.use((req, res, next) => {
    const isApiRoute = ['/user', '/problem', '/submission', '/ai', '/video'].some((route) => req.path.startsWith(route));

    if (req.method === 'GET' && !isApiRoute) {
        if (fs.existsSync(frontendIndexPath)) {
            return res.sendFile(frontendIndexPath);
        }

        if (process.env.FRONTEND_URL) {
            return res.redirect(`${process.env.FRONTEND_URL}${req.originalUrl}`);
        }
    }

    next();
});


const InitalizeConnection = async ()=>{
    try{

        await main();
        await Promise.all([redisClient.connect(), seedProblemTopics()]);
        console.log("DB Connected");
        
        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })

    }
    catch(err){
        console.log("Error: "+err);
    }
}


InitalizeConnection();

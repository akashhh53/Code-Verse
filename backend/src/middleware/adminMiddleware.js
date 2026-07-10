const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis")
const { getTokenCandidatesFromRequest } = require("../utils/authToken");

const adminMiddleware = async (req,res,next)=>{

    try{
       
        const tokens = getTokenCandidatesFromRequest(req);
        if(!tokens.length)
            throw new Error("Token is not present");

        let payload = null;
        let token = null;

        for (const candidateToken of tokens) {
            try {
                const decodedPayload = jwt.verify(candidateToken,process.env.JWT_KEY);
                const isBlocked = await redisClient.exists(`token:${candidateToken}`);

                if(!isBlocked){
                    payload = decodedPayload;
                    token = candidateToken;
                    break;
                }
            }
            catch(err){
                // Try the next available auth source.
            }
        }

        if(!payload || !token)
            throw new Error("Invalid Token");

        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if(!result){
            throw new Error("User Doesn't Exist");
        }

        if(payload.role!='admin' || result.role!='admin')
            throw new Error("Invalid Token");

        req.result = result;
        req.authToken = token;


        next();
    }
    catch(err){
        res.status(401).send("Error: "+ err.message)
    }

}


module.exports = adminMiddleware;

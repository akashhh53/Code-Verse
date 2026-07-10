const redisClient = require("../config/redis");
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const {
    ACCESS_TOKEN_COOKIE,
    LEGACY_TOKEN_COOKIE,
    ACCESS_TOKEN_MAX_AGE_MS,
    createAccessToken,
    getTokenFromRequest,
} = require("../utils/authToken");

const getAuthCookieOptions = (overrides = {}) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    ...overrides
});

const getUserReply = (user) => ({
    firstName: user.firstName,
    emailId: user.emailId,
    _id: user._id,
    role: user.role,
});

const setAuthCookies = (res, accessToken) => {
    const options = getAuthCookieOptions({
        maxAge: ACCESS_TOKEN_MAX_AGE_MS
    });

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, options);
    res.cookie(LEGACY_TOKEN_COOKIE, accessToken, options);
};

const clearAuthCookies = (res) => {
    const options = getAuthCookieOptions({
        expires: new Date(0)
    });

    res.cookie(ACCESS_TOKEN_COOKIE, "", options);
    res.cookie(LEGACY_TOKEN_COOKIE, "", options);
};


const register = async (req,res)=>{
    
    try{
        // validate the data;

      validate(req.body); 
      const {emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user'
    //
    
     const user =  await User.create(req.body);
     const accessToken = createAccessToken(user);
     const reply = getUserReply(user);
    
    setAuthCookies(res, accessToken);
     res.status(201).json({
        user:reply,
        accessToken,
        message:"Login successful"
    })
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}


const login = async (req,res)=>{

    try{
        const {emailId, password} = req.body;

        if(!emailId)
            throw new Error("Invalid Credentials");
        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({emailId});

        if(!user)
            throw new Error("Invalid Credentials");

        const match = await bcrypt.compare(password,user.password);

        if(!match)
            throw new Error("Invalid Credentials");

        const reply = getUserReply(user);

        const accessToken = createAccessToken(user);
        setAuthCookies(res, accessToken);
        res.status(201).json({
            user:reply,
            accessToken,
            message:"Login successful"
        })
    }
    catch(err){
        res.status(401).send("Error: "+err);
    }
}


// logOut feature

const logout = async(req,res)=>{

    try{
        const token = req.authToken || getTokenFromRequest(req);
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        if(payload?.exp){
            await redisClient.expireAt(`token:${token}`,payload.exp);
        }
        else{
            await redisClient.expire(`token:${token}`,60 * 60);
        }
    // Add the token to the Redis blocklist and clear auth cookies.

    clearAuthCookies(res);
    res.send("Logged out successfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}


const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const accessToken = createAccessToken(user);
     setAuthCookies(res, accessToken);
     res.status(201).json({
        accessToken,
        message:"User registered successfully"
     });
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submissions can also be deleted here if needed.
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}


module.exports = {register, login,logout,adminRegister,deleteProfile};

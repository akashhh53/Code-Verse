const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo")
const Topic = require("../models/topic");
const { problemTopics } = require("../constants/problemMeta");

const createProblem = async (req, res) => {
  try {
    // 🔥 MINIMAL CHANGE: Check if multiple problems
    const problems = Array.isArray(req.body) ? req.body : [req.body];
    const createdProblems = [];

    for (const problemData of problems) {
      const {
        title, description, difficulty, tags,
        visibleTestCases, hiddenTestCases, startCode,
        referenceSolution, problemCreator
      } = problemData;

      // Test reference solutions for each problem
      for (const { language, completeCode } of referenceSolution) {
        const languageId = getLanguageById(language);

        const submissions = visibleTestCases.map((testcase) => ({
          source_code: completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value) => value.token);
        const testResult = await submitToken(resultToken);

        for (const test of testResult) {
          if (test.status_id != 3) {
            return res.status(400).send("Error occurred");
          }
        }
      }

      // Store problem
      const problem = await Problem.create({
        ...problemData,
        problemCreator: req.result._id
      });
      createdProblems.push(problem);
    }

    // 🔥 MINIMAL CHANGE: Different response based on single/multiple
    if (createdProblems.length === 1) {
      res.status(201).send("Problem saved successfully");
    } else {
      res.status(201).json({
        message: `${createdProblems.length} problems saved successfully`,
        problems: createdProblems
      });
    }

  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).send("Missing ID Field");
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).send("ID is not present on the server");
    }
      
    for(const {language,completeCode} of referenceSolution){
         

      // source_code:
      // language_id:
      // stdin: 
      // expectedOutput:

      const languageId = getLanguageById(language);
        
      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase)=>({
          source_code:completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output
      }));


      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value)=> value.token);

      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
      
     const testResult = await submitToken(resultToken);

    //  console.log(testResult);

     for(const test of testResult){
      if(test.status_id!=3){
       return res.status(400).send("Error occurred");
      }
     }

    }


  const newProblem = await Problem.findByIdAndUpdate(id , {...req.body}, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      res.status(500).send("Error: "+err);
  }
}

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Deleted successfully");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}


const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');
   
    // Attach video metadata when a solution video exists.

   if(!getProblem)
    return res.status(404).send("Problem is Missing");

   const videos = await SolutionVideo.findOne({problemId:id});

   if(videos){   
    
   const responseData = {
    ...getProblem.toObject(),
    secureUrl:videos.secureUrl,
    thumbnailUrl : videos.thumbnailUrl,
    duration : videos.duration,
   } 
  
   return res.status(200).send(responseData);
   }
    
   res.status(200).send(getProblem);

  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags');

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const getProblemTopics = async(req,res)=>{

  try{
    const topics = await Topic.find({}).sort({ order: 1 }).select("key label -_id");
    const responseTopics = topics.length
      ? topics.map((topic) => ({ value: topic.key, label: topic.label }))
      : problemTopics;

    res.status(200).send(responseTopics);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}


const solvedAllProblembyUser =  async(req,res)=>{
   
    try{
       
      const userId = req.result._id;

      const solvedProblemIds = await Submission.distinct("problemId", {
        userId,
        status: "accepted"
      });

      const solvedProblems = await Problem.find({
        _id: { $in: solvedProblemIds }
      }).select("_id title difficulty tags");
      
      res.status(200).send(solvedProblems);

    }
    catch(err){
      res.status(500).send("Server Error");
    }
}

const submittedProblem = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.pid;

    const ans = await Submission.find({ userId, problemId }).sort({ createdAt: -1 });

    return res.status(200).json(ans);

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};


module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,getProblemTopics,solvedAllProblembyUser,submittedProblem};

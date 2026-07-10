const Problem = require("../models/problem");
const Submission = require("../models/submission");
const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");

const MAX_CUSTOM_TEST_CASES = 5;

const normalizeCustomTestCases = (customTestCases = []) => {
  if (!Array.isArray(customTestCases)) return [];

  return customTestCases
    .slice(0, MAX_CUSTOM_TEST_CASES)
    .map((testCase) => ({
      input: String(testCase?.input ?? ''),
      output: String(testCase?.output ?? ''),
    }))
    .filter((testCase) => testCase.input.trim() || testCase.output.trim());
};

const buildJudgeSubmission = (code, languageId, testCase) => {
  const submission = {
    source_code: code,
    language_id: languageId,
    stdin: testCase.input,
  };

  if (testCase.output?.trim()) {
    submission.expected_output = testCase.output;
  }

  return submission;
};

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const attachTestCaseMeta = (judgeResults, testCases) => {
  return judgeResults.map((result, index) => ({
    ...result,
    stdin: testCases[index]?.input ?? result.stdin,
    expected_output: testCases[index]?.output ?? result.expected_output,
    hasExpectedOutput: Boolean(testCases[index]?.output?.trim()),
  }));
};

const submitCode = async (req,res)=>{
   
    // 
    try{
      
       const userId = req.result._id;
       const problemId = req.params.id;

       let {code,language} = req.body;

      if(!userId||!code||!problemId||!language)
        return res.status(400).send("Some field missing");
      

      if(language==='cpp')
        language='c++'
      
      console.log(language);
      
    //    Fetch the problem from database
       const problem =  await Problem.findById(problemId);
       if(!problem)
        return res.status(404).send("Problem not found");
    //    testcases(Hidden)
    
    // Store the submission before sending it to the judge.
    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length
     })

    // Submit the code to Judge0.
    
    const languageId = getLanguageById(language);
   
    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code:code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));

    
    const submitResult = await submitBatch(submissions);
    
    const resultToken = submitResult.map((value)=> value.token);

    const testResult = await submitToken(resultToken);
    

    // Update the stored submission result.
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;


    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+toNumber(test.time)
           memory = Math.max(memory,toNumber(test.memory));
        }else{
          if(test.status_id==4){
            status = 'error'
            errorMessage = test.stderr
          }
          else{
            status = 'wrong'
            errorMessage = test.stderr
          }
        }
    }


    // Store the result in Database in Submission
    submittedResult.status   = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();
    
    const accepted = (status == 'accepted')

    // Mark solved only after an accepted submission.
    const alreadySolved = req.result.problemSolved.some(
      (solvedProblemId) => solvedProblemId.toString() === problemId
    );

    if(accepted && !alreadySolved){
      req.result.problemSolved.push(problemId);
      await req.result.save();
    }
    
    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });
       
    }
    catch(err){
      res.status(500).send("Internal Server Error "+ err);
    }
}


const runCode = async(req,res)=>{
    
     // 
     try{
      const userId = req.result._id;
      const problemId = req.params.id;

      let {code,language, customTestCases = []} = req.body;

     if(!userId||!code||!problemId||!language)
       return res.status(400).send("Some field missing");

   //    Fetch the problem from database
      const problem =  await Problem.findById(problemId);
      if(!problem)
        return res.status(404).send("Problem not found");
   //    testcases(Hidden)
      if(language==='cpp')
        language='c++'

   //    Submit the code to Judge0.

   const languageId = getLanguageById(language);
   const normalizedCustomTestCases = normalizeCustomTestCases(customTestCases);
   const isCustomRun = normalizedCustomTestCases.length > 0;
   const runTestCases = isCustomRun ? normalizedCustomTestCases : problem.visibleTestCases;

   const submissions = runTestCases.map((testcase) => buildJudgeSubmission(code, languageId, testcase));


   const submitResult = await submitBatch(submissions);
   
   const resultToken = submitResult.map((value)=> value.token);

   const testResult = await submitToken(resultToken);

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = true;
    let errorMessage = null;

    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+toNumber(test.time)
           memory = Math.max(memory,toNumber(test.memory));
        }else{
          if(test.status_id==4){
            status = false
            errorMessage = test.stderr
          }
          else{
            status = false
            errorMessage = test.stderr
          }
        }
    }

   
  
   res.status(201).json({
    success:status,
    mode: isCustomRun ? 'custom' : 'examples',
    testCases: attachTestCaseMeta(testResult, runTestCases),
    runtime,
    memory
   });
      
   }
   catch(err){
     res.status(500).send("Internal Server Error "+ err);
   }
}


module.exports = {submitCode,runCode};



//     language_id: 54,
//     stdin: '2 3',
//     expected_output: '5',
//     stdout: '5',
//     status_id: 3,
//     created_at: '2025-05-12T16:47:37.239Z',
//     finished_at: '2025-05-12T16:47:37.695Z',
//     time: '0.002',
//     memory: 904,
//     stderr: null,
//     token: '611405fa-4f31-44a6-99c8-6f407bc14e73',


// User.findByIdUpdate({
// })

//const user =  User.findById(id)
// user.firstName = "Mohit";
// await user.save();

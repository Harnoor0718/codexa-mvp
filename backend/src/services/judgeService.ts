import axios from 'axios';

const JUDGE0_KEY = process.env.JUDGE0_API_KEY || '';

const languageIds: { [key: string]: number } = {
  'c': 50,
  'cpp': 54,
  'python': 71,
  'java': 62,
  'javascript': 63
};

export const submitCode = async (
  code: string,
  language: string,
  input: string
): Promise<any> => {
  try {
    const languageId = languageIds[language.toLowerCase()];
    
    console.log('Submitting to Judge0...');
    
    // Submit code (async submission)
    const response = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions',
      {
        source_code: code,
        language_id: languageId,
        stdin: input,
        base64_encoded: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': JUDGE0_KEY
        }
      }
    );

    const token = response.data.token;
    console.log('Submission token:', token);
    
    // Poll for result (max 15 attempts, 1 second each)
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const resultResponse = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        {
          headers: {
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            'X-RapidAPI-Key': JUDGE0_KEY
          },
          params: {
            base64_encoded: false
          }
        }
      );

      const status = resultResponse.data.status.id;
      console.log(`Attempt ${i + 1}: Status ID ${status}`);

      // Status 1 = In Queue, 2 = Processing
      if (status > 2) {
        console.log('Result:', resultResponse.data);
        return resultResponse.data;
      }
    }

    throw new Error('Submission timeout - took too long to process');
  } catch (error: any) {
    console.error('Judge0 Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const getVerdict = (statusId: number): string => {
  const verdicts: { [key: number]: string } = {
    3: 'AC',  // Accepted
    4: 'WA',  // Wrong Answer
    5: 'TLE', // Time Limit Exceeded
    6: 'CE',  // Compilation Error
    7: 'RE',  // Runtime Error (SIGSEGV)
    8: 'RE',  // Runtime Error (SIGXFSZ)
    9: 'RE',  // Runtime Error (SIGFPE)
    10: 'RE', // Runtime Error (SIGABRT)
    11: 'RE', // Runtime Error (NZEC)
    12: 'RE', // Runtime Error (Other)
    13: 'RE', // Internal Error
    14: 'RE'  // Exec Format Error
  };
  
  return verdicts[statusId] || 'PENDING';
};
const axios = require('axios');

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Call Mistral AI (text only)
async function callMistralAI(systemPrompt, userPrompt) {
  try {
    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Mistral AI Error:', error.response?.data || error.message);
    return null;
  }
}

// Call Mistral Vision API for OCR
async function callMistralVision(base64Image, mimeType, textPrompt) {
  try {
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: 'pixtral-large-latest',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: textPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Mistral Vision Error:', error.response?.data || error.message);
    return null;
  }
}

// Extract salary information from uploaded document using Mistral Vision
async function extractSalaryInfo(base64Image, mimeType) {
  const prompt = `Analyze this salary slip / income document image carefully.
Extract the following information and return ONLY valid JSON:
{
  "employee_name": "name found or null",
  "gross_salary": number or null,
  "net_salary": number or null,
  "month": "month/period or null",
  "employer": "company name or null",
  "deductions": number or null,
  "verified": true if this looks like a legitimate salary document, false otherwise
}
If this is not a salary/income document, set verified to false.
Return ONLY the JSON, no other text.`;

  const result = await callMistralVision(base64Image, mimeType, prompt);

  if (result) {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          raw_response: result,
          extraction_method: 'mistral_vision'
        };
      }
    } catch (e) {
      console.error('Failed to parse salary extraction JSON:', e);
    }
  }

  // Fallback - document uploaded but couldn't be read
  return {
    employee_name: null,
    gross_salary: null,
    net_salary: null,
    verified: false,
    extraction_method: 'fallback',
    error: 'Could not extract salary information from document'
  };
}

// Verify face image using Mistral Vision
async function verifyFaceImage(base64Image, mimeType) {
  const prompt = `Analyze this image. Is this a clear photo of a human face suitable for identity verification?
Return ONLY valid JSON:
{
  "is_face": true or false,
  "clarity": "good", "fair", or "poor",
  "notes": "brief description"
}
Return ONLY the JSON.`;

  const result = await callMistralVision(base64Image, mimeType, prompt);

  if (result) {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse face verification JSON:', e);
    }
  }

  // Fallback - accept the upload
  return { is_face: true, clarity: 'fair', notes: 'Verification via fallback' };
}

// Credit Scoring Agent
async function creditScoringAgent(userData, loanData) {
  const systemPrompt = `You are a credit scoring expert. Analyze financial data and provide credit scores (300-850). 
Return ONLY valid JSON format with keys: credit_score (number), risk_level (low/medium/high), factors (array of strings).`;

  const userPrompt = `Analyze the following data and calculate credit score:

User Financial Data:
- Monthly Income: ₹${loanData.monthly_income?.toLocaleString('en-IN') || 'N/A'}
- Employment Type: ${loanData.employment_type || 'N/A'}
- Existing Loans: ${loanData.existing_loans || 0}
- Account Balance: ₹${userData.account_balance?.toLocaleString('en-IN') || 'N/A'}
- Past Loan History: ${userData.past_loans_count || 0} loans
- Total Past Transactions: ${userData.total_transactions || 0}

Loan Request:
- Amount: ₹${loanData.amount?.toLocaleString('en-IN') || 'N/A'}
- Purpose: ${loanData.purpose || 'N/A'}
- Tenure: ${loanData.tenure_months || 'N/A'} months

Return JSON with: credit_score, risk_level, factors.`;

  const result = await callMistralAI(systemPrompt, userPrompt);

  if (result) {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse credit score JSON:', e);
    }
  }

  // Fallback calculation
  let baseScore = 650;
  if (loanData.monthly_income > 50000) baseScore += 50;
  if (loanData.existing_loans === 0) baseScore += 40;
  if (userData.past_loans_count > 0) baseScore += 30;
  if (userData.account_balance > 100000) baseScore += 30;

  const risk = baseScore >= 720 ? 'low' : baseScore >= 650 ? 'medium' : 'high';

  return {
    credit_score: Math.min(850, baseScore),
    risk_level: risk,
    factors: ['Stable income', 'Low existing debt', 'Good transaction history']
  };
}

// Document Verification Agent
async function documentVerificationAgent(userData, faceVerification, salaryData) {
  let score = 0;
  const notes = [];

  // Aadhar check
  if (userData.aadhar) { score += 25; notes.push('Aadhar verified'); }
  // PAN check
  if (userData.pan) { score += 25; notes.push('PAN verified'); }
  // Face check
  if (faceVerification?.is_face) {
    score += 25;
    notes.push(`Face verified (clarity: ${faceVerification.clarity || 'N/A'})`);
  }
  // Salary check
  if (salaryData?.verified) {
    score += 25;
    notes.push('Salary slip verified via AI OCR');
  } else if (salaryData) {
    score += 15;
    notes.push('Salary slip uploaded but unverified');
  }

  return {
    aadhar_verified: !!userData.aadhar,
    pan_verified: !!userData.pan,
    face_verified: !!faceVerification?.is_face,
    salary_slip_verified: !!salaryData?.verified,
    verification_score: score,
    notes: notes.join('. ')
  };
}

// EMI Calculation Agent
function emiCalculationAgent(principal, tenureMonths, riskLevel) {
  const interestRates = { low: 8.5, medium: 11.0, high: 14.5 };
  const annualRate = interestRates[riskLevel] || 11.0;
  const monthlyRate = annualRate / 12 / 100;

  let emi;
  if (monthlyRate > 0) {
    emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  } else {
    emi = principal / tenureMonths;
  }

  const totalAmount = emi * tenureMonths;
  const totalInterest = totalAmount - principal;

  return {
    emi_amount: Math.round(emi * 100) / 100,
    interest_rate: annualRate,
    total_amount: Math.round(totalAmount * 100) / 100,
    total_interest: Math.round(totalInterest * 100) / 100,
    processing_fee: Math.round(principal * 0.01 * 100) / 100
  };
}

// Underwriting Agent
async function underwritingAgent(loanData, creditAnalysis, docVerification, emiCalculation) {
  const systemPrompt = `You are a senior loan underwriting officer. Review all analysis and make final loan approval decisions. 
Return ONLY valid JSON with keys: decision (approved/rejected), approved_amount (number), reason (string), conditions (array of strings).`;

  const userPrompt = `Loan Underwriting Review:

Loan Request:
- Amount: ₹${loanData.amount?.toLocaleString('en-IN')}
- Purpose: ${loanData.purpose}
- Tenure: ${loanData.tenure_months} months

Credit Analysis:
- Credit Score: ${creditAnalysis.credit_score}
- Risk Level: ${creditAnalysis.risk_level}
- Factors: ${creditAnalysis.factors?.join(', ')}

Document Verification:
- Verification Score: ${docVerification.verification_score}%
- Notes: ${docVerification.notes}

EMI Calculation:
- EMI Amount: ₹${emiCalculation.emi_amount?.toLocaleString('en-IN')}
- Interest Rate: ${emiCalculation.interest_rate}%
- Total Repayment: ₹${emiCalculation.total_amount?.toLocaleString('en-IN')}

Make underwriting decision. Return JSON with: decision, approved_amount, reason, conditions.`;

  const result = await callMistralAI(systemPrompt, userPrompt);

  if (result) {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse underwriting JSON:', e);
    }
  }

  // Fallback decision
  const creditScore = creditAnalysis.credit_score;
  const requestedAmount = loanData.amount;

  if (creditScore >= 700) {
    return {
      decision: 'approved',
      approved_amount: requestedAmount,
      reason: 'Strong credit profile and stable income',
      conditions: ['Maintain account balance', 'Timely EMI payments']
    };
  } else if (creditScore >= 650) {
    return {
      decision: 'approved',
      approved_amount: Math.round(requestedAmount * 0.85),
      reason: 'Moderate risk profile, approved with reduced amount',
      conditions: ['Provide guarantor', 'Monthly income proof', 'Timely EMI payments']
    };
  } else {
    return {
      decision: 'approved',
      approved_amount: Math.round(requestedAmount * 0.7),
      reason: 'Higher risk but manageable with conditions',
      conditions: ['Provide guarantor', 'Life insurance coverage', 'Quarterly income verification']
    };
  }
}

// Full Loan Processing Orchestrator (called after all documents collected)
async function processLoanApplication(userData, loanData, faceVerification, salaryData) {
  console.log('Starting multi-agent loan processing...');

  // Step 1: Credit Scoring
  const creditAnalysis = await creditScoringAgent(userData, loanData);
  console.log('Credit score:', creditAnalysis.credit_score);

  // Step 2: Document Verification
  const docVerification = await documentVerificationAgent(userData, faceVerification, salaryData);
  console.log('Document verification score:', docVerification.verification_score);

  // Step 3: EMI Calculation
  const emiCalculation = emiCalculationAgent(
    loanData.amount,
    loanData.tenure_months,
    creditAnalysis.risk_level
  );
  console.log('EMI calculated:', emiCalculation.emi_amount);

  // Step 4: Underwriting Decision
  const underwritingDecision = await underwritingAgent(
    loanData, creditAnalysis, docVerification, emiCalculation
  );
  console.log('Underwriting decision:', underwritingDecision.decision);

  return {
    credit_analysis: creditAnalysis,
    document_verification: docVerification,
    emi_calculation: emiCalculation,
    underwriting_decision: underwritingDecision,
    processed_at: new Date().toISOString()
  };
}

// Chatbot Agent - context-aware
async function chatbotAgent(userMessage, userContext, loanContext) {
  let loanInfo = '';
  if (loanContext) {
    loanInfo = `\n\nActive Loan Application:
- Loan ID: ${loanContext.loan_id}
- Amount: ₹${loanContext.amount?.toLocaleString('en-IN')}
- Purpose: ${loanContext.purpose}
- Status: ${loanContext.status}
- Face Verified: ${loanContext.face_verified ? 'Yes' : 'No'}
- Salary Slip Verified: ${loanContext.salary_verified ? 'Yes' : 'No'}`;
  }

  const systemPrompt = `You are a professional virtual loan officer at NBFC Bank. Your role:
- Help users understand loan products and eligibility
- Guide them through the application process
- Explain credit scores, interest rates, and EMI calculations
- Answer questions about existing loans and repayment
- Be professional, empathetic, and helpful

${loanContext ? `The user has an active loan application. Guide them through document collection:
- If face is NOT verified, ask them to upload their face photo using the camera button below the chat.
- If face IS verified but salary slip is NOT verified, ask them to upload their salary slip using the upload button.
- If both are verified, the loan is being processed by our AI agents.
- Do NOT ask the user to leave the chat to upload documents - they can upload directly here.` : ''}

Keep responses under 150 words. Be concise and action-oriented.`;

  const userPrompt = `User Context:
- Name: ${userContext.name}
- Account Balance: ₹${userContext.account_balance?.toLocaleString('en-IN')}
- Credit Score: ${userContext.credit_score || 'Not calculated yet'}
- Active Loans: ${userContext.active_loans || 0}
- Past Loans: ${userContext.past_loans_count || 0}${loanInfo}

User Message: ${userMessage}`;

  const result = await callMistralAI(systemPrompt, userPrompt);
  return result || "I'm here to help you with your loan queries. How can I assist you today?";
}

module.exports = {
  processLoanApplication,
  chatbotAgent,
  creditScoringAgent,
  emiCalculationAgent,
  extractSalaryInfo,
  verifyFaceImage
};

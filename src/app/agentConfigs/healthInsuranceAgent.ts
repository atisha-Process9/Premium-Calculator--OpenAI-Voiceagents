import { RealtimeAgent, tool } from '@openai/agents/realtime';

// --------------------------
// Utility Functions
// --------------------------

function parseAmount(amountText: string): number {
  const text = amountText.toLowerCase().trim();
  
  // Handle lakhs/lacs
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac)s?/);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;
  
  // Handle crores
  const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*crores?/);
  if (croreMatch) return parseFloat(croreMatch[1]) * 10000000;
  
  // Handle millions (M, m)
  const millionMatch = text.match(/(\d+(?:\.\d+)?)\s*m/i);
  if (millionMatch) return parseFloat(millionMatch[1]) * 1000000;
  
  // Handle thousands (k)
  const thousandMatch = text.match(/(\d+(?:\.\d+)?)\s*k/i);
  if (thousandMatch) return parseFloat(thousandMatch[1]) * 1000;
  
  // Handle plain numbers
  const numberMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) return parseFloat(numberMatch[1]);
  
  throw new Error('Unable to parse amount');
}

function validateMobile(mobile: string): boolean {
  return /^\d{10}$/.test(mobile);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateAge(age: any): boolean {
  const numAge = Number(age);
  return !isNaN(numAge) && numAge > 0 && numAge < 120;
}

function validateGender(gender: string): boolean {
  return ['male', 'female'].includes(gender.toLowerCase());
}

function validateAmount(amount: any): boolean {
  const numAmount = Number(amount);
  return !isNaN(numAmount) && numAmount > 0;
}

function getCityFactor(city: string): number {
  const cityLower = city.toLowerCase();
  if (['mumbai', 'delhi'].includes(cityLower)) return 1.2;
  if (['gurugram', 'gurgaon', 'bangalore', 'chennai'].includes(cityLower)) return 1.0;
  return 0.9;
}

function getAgeFactor(age: number): number {
  if (age < 30) return 1.0;
  if (age >= 30 && age <= 49) return 1.5;
  return 2.0;
}

function getGenderFactor(gender: string): number {
  return gender.toLowerCase() === 'male' ? 1.1 : 1.0;
}

function calculateMemberPremium(age: number, gender: string, city: string, amountInsured: number): number {
  const baseRate = amountInsured * 0.005;
  const ageFactor = getAgeFactor(age);
  const cityFactor = getCityFactor(city);
  const genderFactor = getGenderFactor(gender);
  
  return baseRate * ageFactor * cityFactor * genderFactor;
}

function convertNumberToWords(num: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if (num === 0) return 'zero';
  if (num < 0) return 'negative ' + convertNumberToWords(-num);
  
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' ' + convertNumberToWords(num % 100) : '');
  if (num < 100000) return convertNumberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + convertNumberToWords(num % 1000) : '');
  if (num < 10000000) return convertNumberToWords(Math.floor(num / 100000)) + ' lakh' + (num % 100000 ? ' ' + convertNumberToWords(num % 100000) : '');
  return convertNumberToWords(Math.floor(num / 10000000)) + ' crore' + (num % 10000000 ? ' ' + convertNumberToWords(num % 10000000) : '');
}

// --------------------------
// Individual Premium Calculator
// --------------------------

function calculateIndividualPremium({ name, mobile, email, city, age, gender, amountInsured }: {
  name: string;
  mobile: string;
  email: string;
  city: string;
  age: number;
  gender: string;
  amountInsured: number;
}) {
  const memberPremium = calculateMemberPremium(age, gender, city, amountInsured);
  const gst = memberPremium * 0.18;
  const total = memberPremium + gst;

  return {
    memberPremium: Math.round(memberPremium * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

// --------------------------
// Family Premium Calculator
// --------------------------

function calculateFamilyPremium({ name, mobile, email, city, husbandAge, wifeAge, sons, daughters, amountInsured }: {
  name: string;
  mobile: string;
  email: string;
  city: string;
  husbandAge: number;
  wifeAge: number;
  sons: { age: number }[];
  daughters: { age: number }[];
  amountInsured: number;
}) {
  const members = [
    { age: husbandAge, gender: 'Male' },
    { age: wifeAge, gender: 'Female' },
    ...sons.map(son => ({ age: son.age, gender: 'Male' })),
    ...daughters.map(daughter => ({ age: daughter.age, gender: 'Female' }))
  ];

  const memberPremiums = members.map(member => 
    calculateMemberPremium(member.age, member.gender, city, amountInsured)
  );

  const totalMemberPremiums = memberPremiums.reduce((sum, premium) => sum + premium, 0);
  const discounted = totalMemberPremiums * 0.90; // 10% discount
  const gst = discounted * 0.18;
  const total = discounted + gst;

  return {
    totalMemberPremiums: Math.round(totalMemberPremiums * 100) / 100,
    discounted: Math.round(discounted * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100,
    memberCount: members.length
  };
}

// --------------------------
// Tools for the RealtimeAgent
// --------------------------

const validateFieldTool = tool({
  name: 'validate_field',
  description: 'Validate individual fields as they are collected',
  parameters: {
    type: 'object',
    properties: {
      fieldType: {
        type: 'string',
        enum: ['mobile', 'email', 'age', 'gender', 'amount'],
        description: 'Type of field to validate'
      },
      value: {
        type: 'string',
        description: 'Value to validate'
      }
    },
    required: ['fieldType', 'value'],
    additionalProperties: false
  },
  execute: async (input) => {
    const { fieldType, value } = input as { fieldType: string; value: string };
    
    let isValid = false;
    let errorMessage = '';
    
    switch (fieldType) {
      case 'mobile':
        isValid = validateMobile(value);
        errorMessage = 'Mobile number must be exactly 10 digits';
        break;
      case 'email':
        isValid = validateEmail(value);
        errorMessage = 'Please provide a valid email address in the format example@example.com';
        break;
      case 'age':
        isValid = validateAge(value);
        errorMessage = 'Age must be a positive number';
        break;
      case 'gender':
        isValid = validateGender(value);
        errorMessage = 'Gender must be Male or Female';
        break;
      case 'amount':
        isValid = validateAmount(value);
        errorMessage = 'Amount must be a positive number';
        break;
    }
    
    return { isValid, errorMessage };
  }
});

const parseAmountTool = tool({
  name: 'parse_amount',
  description: 'Parse amount text to numeric value supporting various formats',
  parameters: {
    type: 'object',
    properties: {
      amountText: {
        type: 'string',
        description: 'Amount text to parse (e.g., "12 lakhs", "1.2M", "500000")'
      }
    },
    required: ['amountText'],
    additionalProperties: false
  },
  execute: async (input) => {
    const { amountText } = input as { amountText: string };
    
    try {
      const parsedAmount = parseAmount(amountText);
      return { success: true, amount: parsedAmount };
    } catch (error) {
      return { 
        success: false, 
        error: 'Unable to parse amount insured. Please provide numeric value or use formats like "12 lakhs", "1.2M", or "1200000"'
      };
    }
  }
});

const calculateIndividualPremiumTool = tool({
  name: 'calculate_individual_premium',
  description: 'Calculate health insurance premium for an individual',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Full name' },
      mobile: { type: 'string', description: 'Mobile number' },
      email: { type: 'string', description: 'Email address' },
      city: { type: 'string', description: 'City of residence' },
      age: { type: 'number', description: 'Age' },
      gender: { type: 'string', description: 'Gender (Male/Female)' },
      amountInsured: { type: 'number', description: 'Amount to be insured' }
    },
    required: ['name', 'mobile', 'email', 'city', 'age', 'gender', 'amountInsured'],
    additionalProperties: false
  },
  execute: async (input) => {
    const { name, mobile, email, city, age, gender, amountInsured } = input as {
      name: string; mobile: string; email: string; city: string; 
      age: number; gender: string; amountInsured: number;
    };

    try {
      const premium = calculateIndividualPremium({ name, mobile, email, city, age, gender, amountInsured });
      const totalInWords = convertNumberToWords(Math.round(premium.total));
      
      return {
        success: true,
        premium: {
          memberPremium: premium.memberPremium,
          gst: premium.gst,
          total: premium.total,
          totalInWords: totalInWords
        },
        summary: `Individual Premium Calculation:
Name: ${name}
Mobile: ${mobile}
Email: ${email}
City: ${city}
Age: ${age}
Gender: ${gender}
Amount Insured: ₹${amountInsured.toLocaleString()}

Premium Breakdown:
Member Premium: ₹${premium.memberPremium.toLocaleString()}
GST (18%): ₹${premium.gst.toLocaleString()}
Total Premium: ₹${premium.total.toLocaleString()}

The total premium is Rs. ${totalInWords}`
      };
    } catch (error) {
      return { success: false, error: 'Failed to calculate individual premium' };
    }
  }
});

const calculateFamilyPremiumTool = tool({
  name: 'calculate_family_premium',
  description: 'Calculate health insurance premium for a family',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Primary contact name' },
      mobile: { type: 'string', description: 'Mobile number' },
      email: { type: 'string', description: 'Email address' },
      city: { type: 'string', description: 'City of residence' },
      husbandAge: { type: 'number', description: 'Husband age' },
      wifeAge: { type: 'number', description: 'Wife age' },
      sons: { 
        type: 'array', 
        items: { type: 'object', properties: { age: { type: 'number' } } },
        description: 'Array of sons with ages'
      },
      daughters: { 
        type: 'array', 
        items: { type: 'object', properties: { age: { type: 'number' } } },
        description: 'Array of daughters with ages'
      },
      amountInsured: { type: 'number', description: 'Amount to be insured' }
    },
    required: ['name', 'mobile', 'email', 'city', 'husbandAge', 'wifeAge', 'sons', 'daughters', 'amountInsured'],
    additionalProperties: false
  },
  execute: async (input) => {
    const { name, mobile, email, city, husbandAge, wifeAge, sons, daughters, amountInsured } = input as {
      name: string; mobile: string; email: string; city: string;
      husbandAge: number; wifeAge: number; sons: { age: number }[]; 
      daughters: { age: number }[]; amountInsured: number;
    };

    try {
      const premium = calculateFamilyPremium({ name, mobile, email, city, husbandAge, wifeAge, sons, daughters, amountInsured });
      const totalInWords = convertNumberToWords(Math.round(premium.total));
      
      return {
        success: true,
        premium: {
          totalMemberPremiums: premium.totalMemberPremiums,
          discounted: premium.discounted,
          gst: premium.gst,
          total: premium.total,
          memberCount: premium.memberCount,
          totalInWords: totalInWords
        },
        summary: `Family Premium Calculation:
Primary Contact: ${name}
Mobile: ${mobile}
Email: ${email}
City: ${city}
Husband Age: ${husbandAge}
Wife Age: ${wifeAge}
Sons: ${sons.length} (ages: ${sons.map(s => s.age).join(', ')})
Daughters: ${daughters.length} (ages: ${daughters.map(d => d.age).join(', ')})
Amount Insured: ₹${amountInsured.toLocaleString()}

Premium Breakdown:
Total Member Premiums: ₹${premium.totalMemberPremiums.toLocaleString()}
Family Discount (10%): ₹${(premium.totalMemberPremiums - premium.discounted).toLocaleString()}
Discounted Amount: ₹${premium.discounted.toLocaleString()}
GST (18%): ₹${premium.gst.toLocaleString()}
Total Premium: ₹${premium.total.toLocaleString()}

The total premium is Rs. ${totalInWords}`
      };
    } catch (error) {
      return { success: false, error: 'Failed to calculate family premium' };
    }
  }
});

const convertNumberToWordsTool = tool({
  name: 'convert_number_to_words',
  description: 'Convert a number to words for speech output',
  parameters: {
    type: 'object',
    properties: {
      number: { type: 'number', description: 'Number to convert to words' }
    },
    required: ['number'],
    additionalProperties: false
  },
  execute: async (input) => {
    const { number } = input as { number: number };
    const words = convertNumberToWords(Math.round(number));
    return { words };
  }
});

// --------------------------
// Health Insurance Agent
// --------------------------

export const healthInsuranceAgent = new RealtimeAgent({
  name: 'healthInsuranceAgent',
  voice: 'sage',
  instructions: `
# Multilingual Health Insurance Premium Calculator Agent

You are a multilingual health-insurance premium calculator. Ask ONE question at a time. Start by asking: "Do you need Individual or Family health insurance?".

## CRITICAL BEHAVIOR RULES:

### 1. START IN ENGLISH
- As soon as the session starts, your first action is to ask the user in English: "Do you need Individual or Family health insurance?"
- Do not wait for any user input before asking this question.

### 2. LANGUAGE ADAPTATION
- Start the conversation in English. Detect the language of the user's last utterance and continue responding in that same language — both in transcription and speech.
- Only switch to another language if the user clearly switches.
- If a user's response consists only of a proper noun (e.g., just a name like "Rakesh"), continue the conversation in the previously detected language.
- Special Email Rule: If the user's entire response is only an email address (e.g., "rakesh@example.com"), you must respond and ask the next question in English, regardless of the previous language.
- If the email address is embedded within a sentence in another language (e.g., "Mera email rakesh@example.com hai"), respond in the language of that sentence.

### 3. CONVERSATION FLOW

#### For Individual Insurance, ask in this exact order:
1. Name
2. Mobile number
3. Email
4. City
5. Age
6. Gender
7. Amount insured

#### For Family Insurance, ask in this exact order:
1. Name
2. Mobile number
3. Email
4. City
5. Husband age
6. Wife age
7. "How many sons do you have?" — if >0 ask each son's age individually: "What is the age of son 1?" etc.
8. "How many daughters do you have?" — if >0 ask each daughter's age individually: "What is the age of daughter 1?" etc.
9. Amount insured

### 4. VALIDATION (run as fields arrive)
- **Mobile**: digits only, 10 numeric digits only (strictly should be 10 digits)
- **Email**: contains "@" and domain (strictly should be in this format "example@example.com" if not ask user for email in correct format)
- **Ages and amount_insured**: numeric and > 0
- **Gender**: Male or Female (case-insensitive)
- If a field fails validation, ask only the single question needed to fix it.

### 5. AMOUNT PARSING (support common shorthand)
- "N lakh(s)/lac(s)" → N * 100000
- "N crore(s)" → N * 10000000
- "Nk" → N * 1000
- "Nm" or "N M" or "1.2M" → N * 1000000
- plain numeric → parseFloat
- If parsing fails reply: "Unable to parse amount insured. Please provide numeric value or use formats like '12 lakhs', '1.2M', or '1200000'."

### 6. CALCULATION LOGIC
- **Base Rate per person** = AmountInsured * 0.005
- **Age factor**: <30 → 1.0 ; 30–49 → 1.5 ; ≥50 → 2.0
- **City factor** (case-insensitive): Mumbai/Delhi → 1.2 ; Gurugram/Bangalore/Chennai → 1.0 ; others → 0.9
- **Gender factor**: Male → 1.1 ; Female → 1.0 (for family children: sons = Male, daughters = Female)
- **Individual**: MemberPremium = BaseRate * AgeFactor * CityFactor * GenderFactor; GST = MemberPremium * 0.18; Total = MemberPremium + GST
- **Family**: compute MemberPremium for husband, wife, each child; TotalMemberPremiums = sum(MemberPremiums); Discounted = TotalMemberPremiums * 0.90 (10% discount); GST = Discounted * 0.18; Total = Discounted + GST
- Round monetary outputs to 2 decimals.

### 7. FINAL OUTPUT
- After collecting valid inputs, compute and return the value of total_premium.
- Display a summary of all collected information before showing the final premium.
- At the end only speak out the total premium calculated (e.g., "the total premium is Rs. fifty six thousand seven hundred eighty nine")
- Speak numbers in words (e.g., "fifty six thousand seven hundred eighty nine") and not in numerals (e.g., "five six seven eight nine")

### 8. GENERAL BEHAVIOR
- Ask one question at a time; ask each child's age individually.
- Validate each field as it arrives; if invalid ask only the corrective question.
- Parse amount text to numeric before computing.
- Be concise and professional.
- Support multiple languages dynamically (Hindi, Marathi, Tamil, French, Arabic, etc.)

## TOOLS AVAILABLE:
- validate_field: Validate individual fields (mobile, email, age, gender, amount)
- parse_amount: Parse amount text to numeric value
- calculate_individual_premium: Calculate individual insurance premium
- calculate_family_premium: Calculate family insurance premium with 10% discount
- convert_number_to_words: Convert numbers to words for speech

Remember: You're here to make the insurance process simple and transparent for users in their preferred language!
`,
  tools: [
    validateFieldTool, 
    parseAmountTool, 
    calculateIndividualPremiumTool, 
    calculateFamilyPremiumTool, 
    convertNumberToWordsTool
  ],
  handoffs: [] // No handoffs - this is a standalone agent
});

// Export the scenario with just this agent
export const healthInsuranceScenario = [healthInsuranceAgent];

# Health Insurance Premium Calculator - Voice Agent

A Next.js application demonstrating a multilingual voice agent that uses LLM-driven function calling and tool calling to calculate health insurance premiums. Built with OpenAI Realtime API and OpenAI Agents SDK, this agent leverages the LLM's ability to call custom tools and functions (validate_field, parse_amount, calculate_individual_premium, calculate_family_premium) to guide users through conversational forms, validate inputs in real-time, and perform complex premium calculations for both individual and family insurance policies.

## 🚀 Features

- **Real-time Voice Interaction**: Natural voice conversations using OpenAI Realtime API
- **Multilingual Support**: Automatically adapts to user's language (Hindi, Marathi, Tamil, French, Arabic, and more)
- **Smart Input Validation**: Validates mobile numbers, emails, ages, and amounts in real-time
- **Flexible Amount Parsing**: Supports formats like "12 lakhs", "1.2M", "500k", and plain numbers
- **Premium Calculation**: Calculates insurance premiums with age, city, and gender factors
- **Content Moderation**: Built-in guardrails to prevent offensive or inappropriate responses
- **Audio Recording**: Download conversation recordings
- **Live Transcript**: Real-time transcription of voice conversations
- **Push-to-Talk Mode**: Optional push-to-talk for voice input

## 📋 Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **OpenAI API Key**: Required for Realtime API and Responses API access
- **Modern Browser**: Chrome, Firefox, Safari, or Edge with WebRTC support

## 🛠️ Local Development Setup

### Step 1: Clone/Navigate to the Project

```bash
cd realtime-workspace-agents
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- `next` (Next.js 15.3.1)
- `@openai/agents` (OpenAI Agents SDK)
- `openai` (OpenAI SDK)
- `react` (React 19)
- `tailwindcss` (Styling)
- And other dependencies listed in `package.json`

### Step 3: Set Up Environment Variables

You need to set the `OPENAI_API_KEY` environment variable. 


Create a `.env.local` file in the `realtime-workspace-agents` directory:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

### Step 4: Start the Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

The app should automatically connect and the agent will greet you with: *"Do you need Individual or Family health insurance?"*

## 📊 Premium Calculation Logic

### Base Rate Calculation

For each member, the base rate is calculated as:
```
Base Rate = Amount Insured × 0.005
```

### Factor-Based Premium Calculation

The member premium is calculated using multiple factors:

```
Member Premium = Base Rate × Age Factor × City Factor × Gender Factor
```

#### 1. Age Factor

| Age Range | Factor |
|-----------|--------|
| < 30 years | 1.0 |
| 30 - 49 years | 1.5 |
| ≥ 50 years | 2.0 |

#### 2. City Factor

| City | Factor |
|------|--------|
| Mumbai, Delhi | 1.2 |
| Gurugram, Gurgaon, Bangalore, Chennai | 1.0 |
| All other cities | 0.9 |

#### 3. Gender Factor

| Gender | Factor |
|--------|--------|
| Male | 1.1 |
| Female | 1.0 |

### Individual Insurance Calculation

For individual policies:

1. **Calculate Member Premium**:
   ```
   Member Premium = Base Rate × Age Factor × City Factor × Gender Factor
   ```

2. **Calculate GST**:
   ```
   GST = Member Premium × 0.18 (18%)
   ```

3. **Calculate Total Premium**:
   ```
   Total Premium = Member Premium + GST
   ```

**Example Calculation:**
- Amount Insured: ₹12,00,000 (12 lakhs)
- Age: 35 (Factor: 1.5)
- City: Mumbai (Factor: 1.2)
- Gender: Male (Factor: 1.1)

```
Base Rate = 12,00,000 × 0.005 = ₹6,000
Member Premium = 6,000 × 1.5 × 1.2 × 1.1 = ₹11,880
GST = 11,880 × 0.18 = ₹2,138.40
Total Premium = ₹14,018.40
```

### Family Insurance Calculation

For family policies (with 10% discount):

1. **Calculate Premium for Each Member**:
   - Husband: `calculateMemberPremium(husbandAge, "Male", city, amountInsured)`
   - Wife: `calculateMemberPremium(wifeAge, "Female", city, amountInsured)`
   - Each Son: `calculateMemberPremium(sonAge, "Male", city, amountInsured)`
   - Each Daughter: `calculateMemberPremium(daughterAge, "Female", city, amountInsured)`

2. **Sum All Member Premiums**:
   ```
   Total Member Premiums = Σ(Member Premiums)
   ```

3. **Apply Family Discount**:
   ```
   Discounted Amount = Total Member Premiums × 0.90 (10% discount)
   ```

4. **Calculate GST on Discounted Amount**:
   ```
   GST = Discounted Amount × 0.18 (18%)
   ```

5. **Calculate Total Premium**:
   ```
   Total Premium = Discounted Amount + GST
   ```

**Example Family Calculation:**
- Amount Insured: ₹10,00,000 (10 lakhs)
- City: Bangalore (Factor: 1.0)
- Husband: 40 years (Factor: 1.5), Male (Factor: 1.1)
- Wife: 35 years (Factor: 1.5), Female (Factor: 1.0)
- Son: 10 years (Factor: 1.0), Male (Factor: 1.1)

```
Husband Premium = 10,00,000 × 0.005 × 1.5 × 1.0 × 1.1 = ₹8,250
Wife Premium = 10,00,000 × 0.005 × 1.5 × 1.0 × 1.0 = ₹7,500
Son Premium = 10,00,000 × 0.005 × 1.0 × 1.0 × 1.1 = ₹5,500

Total Member Premiums = ₹21,250
Discounted Amount = 21,250 × 0.90 = ₹19,125
GST = 19,125 × 0.18 = ₹3,442.50
Total Premium = ₹22,567.50
```

### Amount Parsing

The system supports flexible amount formats:

| Input Format | Conversion |
|--------------|------------|
| "12 lakhs" or "12 lacs" | 12 × 100,000 = 1,200,000 |
| "1.5 crores" or "1.5 crore" | 1.5 × 10,000,000 = 15,000,000 |
| "500k" or "500K" | 500 × 1,000 = 500,000 |
| "1.2M" or "1.2m" | 1.2 × 1,000,000 = 1,200,000 |
| "1200000" | 1,200,000 (plain number) |

## ✅ Input Validation Rules

### Mobile Number
- **Format**: Exactly 10 numeric digits
- **Example**: `9876543210`
- **Validation**: `/^\d{10}$/`

### Email Address
- **Format**: Valid email format (`example@example.com`)
- **Validation**: Must contain "@" and domain
- **Example**: `user@example.com`

### Age
- **Range**: Must be a positive number between 1 and 119
- **Validation**: Numeric and > 0

### Gender
- **Allowed Values**: "Male" or "Female" (case-insensitive)
- **Validation**: Must match one of the allowed values

### Amount Insured
- **Format**: Positive number
- **Supports**: Lakhs, crores, thousands (k), millions (M), or plain numbers
- **Validation**: Must parse to a positive number

## 🔧 Available Tools

The agent uses the following tools for calculations and validations:

1. **`validate_field`**: Validates individual fields (mobile, email, age, gender, amount)
2. **`parse_amount`**: Parses amount text to numeric value supporting various formats
3. **`calculate_individual_premium`**: Calculates individual insurance premium
4. **`calculate_family_premium`**: Calculates family insurance premium with 10% discount
5. **`convert_number_to_words`**: Converts numbers to words for voice output

## 🌐 API Endpoints

### POST `/api/session`

Creates a new Realtime API session.

**Request**: GET request (no body required)

**Response**:
```json
{
  "client_secret": {
    "value": "ephemeral_key_here"
  }
}
```

**Usage**: Used internally by the app to establish WebRTC connection with OpenAI Realtime API.

### POST `/api/responses`

Proxy endpoint for OpenAI Responses API (used for content moderation guardrails).

**Request Body**:
```json
{
  "model": "gpt-4o-mini",
  "input": [...],
  "text": {
    "format": {...}
  }
}
```

**Response**: Structured output from OpenAI Responses API

**Usage**: Validates agent output for offensive, off-brand, or violent content.

## 🏗️ Project Structure

```
realtime-workspace-agents/
├── src/
│   └── app/
│       ├── agentConfigs/
│       │   ├── healthInsuranceAgent.ts    # Main agent configuration
│       │   ├── guardrails.ts               # Content moderation
│       │   ├── index.ts                    # Agent exports
│       │   └── types.ts                    # TypeScript types
│       ├── api/
│       │   ├── responses/
│       │   │   └── route.ts                 # Responses API proxy
│       │   └── session/
│       │       └── route.ts                 # Session creation
│       ├── components/
│       │   ├── BottomToolbar.tsx            # UI controls
│       │   ├── Events.tsx                   # Event logging
│       │   ├── Transcript.tsx              # Transcript display
│       │   └── GuardrailChip.tsx            # Guardrail indicators
│       ├── contexts/
│       │   ├── EventContext.tsx             # Event management
│       │   └── TranscriptContext.tsx       # Transcript management
│       ├── hooks/
│       │   ├── useRealtimeSession.ts       # Realtime session hook
│       │   ├── useAudioDownload.ts          # Audio recording
│       │   └── useHandleSessionHistory.ts  # Session history
│       ├── lib/
│       │   ├── audioUtils.ts                # Audio utilities
│       │   ├── codecUtils.ts                # Codec configuration
│       │   └── envSetup.ts                  # Environment setup
│       ├── App.tsx                          # Main app component
│       ├── page.tsx                         # Next.js page
│       ├── layout.tsx                       # App layout
│       ├── types.ts                         # Shared types
│       └── globals.css                      # Global styles
├── public/                                  # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

## 🎯 Usage Flow

### Individual Insurance Flow

1. Agent asks: "Do you need Individual or Family health insurance?"
2. User responds: "Individual"
3. Agent collects information in order:
   - Name
   - Mobile number (validated: 10 digits)
   - Email address (validated: format check)
   - City
   - Age (validated: positive number)
   - Gender (validated: Male/Female)
   - Amount insured (parsed: supports lakhs, crores, etc.)
4. Agent calculates premium using the formula above
5. Agent speaks the total premium in words (e.g., "The total premium is Rs. fourteen thousand eighteen")

### Family Insurance Flow

1. Agent asks: "Do you need Individual or Family health insurance?"
2. User responds: "Family"
3. Agent collects information:
   - Name (primary contact)
   - Mobile number
   - Email address
   - City
   - Husband age
   - Wife age
   - Number of sons (if > 0, asks each son's age individually)
   - Number of daughters (if > 0, asks each daughter's age individually)
   - Amount insured
4. Agent calculates premium with 10% family discount
5. Agent speaks the total premium in words

## 🔒 Content Moderation

The application includes guardrails to prevent inappropriate responses:

- **OFFENSIVE**: Hate speech, discriminatory language, insults, slurs, or harassment
- **OFF_BRAND**: Content discussing competitors in a disparaging way
- **VIOLENCE**: Explicit threats, incitement of harm, or graphic descriptions
- **NONE**: Safe content

Guardrails are checked using OpenAI Responses API before responses are delivered.

## 🌍 Multilingual Support

The agent automatically adapts to the user's language:

1. Starts conversation in English
2. Detects user's language from their response
3. Continues in the detected language for subsequent questions
4. Supports: Hindi, Marathi, Tamil, French, Arabic, and many other languages
5. Special rule: If user provides only an email address, switches back to English

## 🎛️ UI Features

- **Transcript Panel**: Real-time conversation transcript
- **Events Panel**: Log of all system events and API calls
- **Push-to-Talk Toggle**: Switch between continuous voice and push-to-talk mode
- **Audio Playback Toggle**: Enable/disable agent audio playback
- **Codec Selector**: Choose between Opus (48kHz) and PCMU/PCMA (8kHz)
- **Download Recording**: Download the conversation audio recording
- **Connection Status**: Visual indicator of connection state

## 📝 Scripts

- `npm run dev`: Start development server (port 3000)
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint

## 🐛 Troubleshooting

### Issue: "OPENAI_API_KEY environment variable is missing"

**Solution**: Ensure you've set the environment variable:
```bash
export OPENAI_API_KEY=sk-your-key-here
```

Or create a `.env.local` file in the project root.

### Issue: Cannot connect to Realtime API

**Solution**: 
1. Verify your API key is valid
2. Check your internet connection
3. Ensure you have Realtime API access (may require API access request)

### Issue: Audio not playing

**Solution**:
1. Check browser permissions for microphone
2. Verify audio playback is enabled in the UI
3. Check browser console for errors

### Issue: Voice not being detected

**Solution**:
1. Check microphone permissions in browser
2. Try using Push-to-Talk mode
3. Verify microphone is working in other applications

### Issue: Premium calculation seems incorrect

**Solution**: Verify the calculation manually using the formulas provided above. The system uses:
- Base rate: `Amount Insured × 0.005`
- Age factors: 1.0 (<30), 1.5 (30-49), 2.0 (≥50)
- City factors: 1.2 (Mumbai/Delhi), 1.0 (Gurugram/Bangalore/Chennai), 0.9 (others)
- Gender factors: 1.1 (Male), 1.0 (Female)
- Family discount: 10%
- GST: 18%

## 📚 Technologies Used

- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **OpenAI Agents SDK**: Agent orchestration and management
- **OpenAI Realtime API**: Real-time voice interactions
- **OpenAI Responses API**: Content moderation
- **Tailwind CSS**: Utility-first CSS framework
- **WebRTC**: Audio streaming

## 📖 Resources

- [OpenAI Voice Agents](https://platform.openai.com/docs/guides/voice-agents?voice-agent-architecture=speech-to-speech)
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/guides/voice-agents/)
- [Build Hours OpenAI Voiceagents-Youtube](https://youtu.be/rpj1m0wYs8M?si=uASM2N10vJUTYcB1)
- [Build Hours OpenAI Voiceagents- Github](https://github.com/openai/build-hours/tree/main/14-voice-agents/realtime-workspace-agents)
- [Next.js Documentation](https://nextjs.org/docs)

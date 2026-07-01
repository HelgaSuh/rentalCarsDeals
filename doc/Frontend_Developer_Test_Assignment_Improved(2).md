## **Frontend Developer Test Assignment** 

## **Car Rental Search Form** 

## **Overview** 

Build a responsive car rental search form that integrates with the Kayak location autocomplete API and submits the completed search data to a redirect endpoint. 

This assignment is designed to evaluate your ability to build a production-quality frontend feature: a clean, accessible, responsive, and interactive form with proper validation, API integration, loading states, and maintainable code. 

You are welcome to use AI tools, coding agents, or “vibe coding” workflows during development. However, if you do so, please document how AI was used, including prompts, agents, tools, and ideally the full interaction history. 

## **Goal** 

Create a car rental search interface similar to a real travel search widget. The form should allow users to select pick-up and return details, choose locations from autocomplete suggestions, and submit the search data to the provided backend endpoint. 

## **Core Requirements** 

## **1. Search Form** 

Build a responsive car rental search form with the following fields: 

- **Pick-up Location** - required text input with autocomplete 

- **Drop-off Location** - optional text input with autocomplete 

- **Pick-up Date** - required date picker 

- **Return Date** - required date picker 

- **Pick-up Time** - required time selector 

- **Return Time** - required time selector 

- **Different Drop-off** - toggle or checkbox that enables/disables the drop-off location field 

- **Price Alert** - checkbox: “Alert me when price drops” 

The form should be easy to use on mobile, tablet, and desktop devices. 

## **2. Location Autocomplete** 

Integrate location autocomplete using the Kayak API. 

Endpoint: 

```
https://www.il.kayak.com/mvm/smartyv2/search?f=j&s=car&where=miami
```

- Trigger autocomplete only after the user enters 3 or more characters 

- Implement 500ms debounce 

- Show a loading state while results are being fetched 

- Display city and airport suggestions clearly 

- Use appropriate icons or visual indicators for airports and cities 

- The user must select a location from the autocomplete results 

- Handle empty, loading, and error states gracefully 

- Avoid unnecessary API calls, for example by caching recent queries where reasonable 

Frontend Developer Test Assignment 

## **3. Form Validation** 

Implement client-side validation with clear and user-friendly error messages. 

- Pick-up location is required 

- Pick-up location must be selected from autocomplete results 

- Drop-off location is required only when “Different drop-off” is enabled 

- Drop-off location must also be selected from autocomplete results 

- Pick-up date must be today or later 

- Return date must be the same as or later than the pick-up date 

- Pick-up time and return time are required 

- The form should not be submitted while invalid 

## **4. Form Submission** 

Submit the form to the redirect endpoint using POST. 

## Endpoint: 

```
https://api.int.therentalradar.com/v1/cars/redirect
```

Format: 

```
FormData
```

Do not submit JSON. The request body should be sent as form data. The form should include all required parameters described below. 

## **Redirect Parameters** 

The submitted form data should match the following structure as closely as possible: 

```
interface RedirectParams {
  // Core parameters
  vert: "cars";
  tab: "front";
  lng: string;
  // Rental duration and timing
  "rental-duration": number;
  "pickup-time": string;      // ISO string, e.g. "2025-08-14T10:00:00+02:00"
  "pickup-t": string;         // Time only, e.g. "10:00"
  "drop-off-time": string;    // ISO string, e.g. "2025-08-20T10:00:00+02:00"
  "drop-off-t": string;       // Time only, e.g. "10:00"
  dta: number;                // Days from today to pick-up date
  // Pick-up location
  "pickup-destination": string;
  "pickup-destination-id": string;
  "pickup-destination-key": "airport" | "city";
  // Drop-off location, only if different drop-off is enabled
  "drop-off-destination"?: string;
  "drop-off-destination-id"?: string;
  "drop-off-destination-key"?: "airport" | "city";
  // Optional metadata
  "country-code"?: string;
  "state-code"?: string;
}
```

Frontend Developer Test Assignment 

## **Technical Requirements** 

## **Technology Stack** 

Use: 

- Next.js 

- TypeScript 

- Tailwind CSS 

You may choose the project structure and supporting libraries, but keep the implementation clean and easy to review. 

## **Responsive Design** 

- Mobile: 320px+ 

- Tablet: 768px+ 

- Desktop: 1024px+ 

Requirements: 

- Mobile-first layout 

- Touch-friendly controls 

- Clear spacing and readable typography 

- Good usability on small screens 

- Proper layout adaptation for desktop 

## **Code Quality** 

We expect clean, maintainable frontend code. Please focus on: 

- Clear component structure 

- Semantic HTML 

- Accessible form elements 

- Keyboard navigation support 

- Proper labels and ARIA attributes where needed 

- Readable TypeScript types 

- Reasonable comments where they add value 

- Cross-browser compatibility with modern browsers: Chrome, Firefox, Safari, Edge 

## **Performance Expectations** 

- Debounced API requests 

- Avoiding unnecessary re-renders 

- Reasonable caching of autocomplete results 

- Minimal bundle size 

- Lazy loading for non-critical parts, if applicable 

## **Design Guidelines** 

The design does not need to be pixel-perfect, but it should look polished and production-ready. 

Suggested direction: 

- Clean, modern UI 

- Clear hierarchy 

- Intuitive user experience 

- Visible loading states 

- Helpful validation messages 

Frontend Developer Test Assignment 

- Smooth micro-interactions 

- Good error handling 

Suggested color variables: 

```
:root {
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --success: #059669;
  --error: #dc2626;
  --warning: #d97706;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-500: #6b7280;
  --gray-900: #111827;
}
```

## **AI Assistance Policy** 

AI tools and coding agents are welcome and encouraged. 

You may use tools such as ChatGPT, Claude, Cursor, Windsurf, GitHub Copilot, Devin, Codex, or any other AI-assisted development workflow. 

However, we want to understand how you work with AI, not only the final result. 

If you use AI tools, please include an AI Usage Report in your README or as a separate file, for example: 

```
AI_USAGE.md
```

Please include: 

- Which AI tools, models, or coding agents were used 

- What parts of the project were created or improved with AI assistance 

- The prompts you used 

- Which agents were used and what their roles were 

- How you reviewed, corrected, or changed AI-generated code 

- Any important limitations, mistakes, or fixes made after AI output 

- Ideally, the full AI conversation history or exported agent logs 

Using AI will not negatively affect your evaluation. We are specifically interested in your ability to use AI responsibly, review generated code, and maintain ownership of the final implementation. 

## **Deliverables** 

1. GitHub repository with the complete source code 

2. Live demo URL deployed to Vercel, Netlify, GitHub Pages, or similar 

3. README.md with setup instructions, local run instructions, project structure overview, implementation notes, and known limitations 

4. AI_USAGE.md or a dedicated section in README if AI tools were used 

5. Screenshots for mobile, tablet, and desktop layouts 

6. Optional: short video walkthrough 

## **Timeline** 

- Estimated effort: 4-8 hours 

- Deadline: 1 week from the assignment date 

- Early submission is welcome 

Frontend Developer Test Assignment 

## **Submission Format** 

1. GitHub repository URL 

2. Live demo URL 

3. Any additional notes needed for review 

4. AI usage documentation, if applicable 

## **Evaluation Criteria** 

- Correctness of form behavior 

- Autocomplete API integration 

- Form validation quality 

- Redirect request implementation 

- Responsive layout 

- Accessibility 

- Code structure and maintainability 

- TypeScript usage 

- UX polish and error handling 

- AI usage transparency, if AI tools were used 

## **Questions** 

If anything is unclear or you need clarification, please reach out before submitting. 

Good luck - we look forward to reviewing your implementation! 

## **Image for Reference** 

Use the screenshot below as a visual reference for the expected search form direction. The implementation does not need to be pixel-perfect, but should follow the same general product-quality standard. 

Frontend Developer Test Assignment 


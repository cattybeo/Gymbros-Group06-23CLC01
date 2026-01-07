# EPIC: AI Smart Suggestion Engine (Gymbros Smart Match)

## Overview

Implement an intelligent advisor system that leverages the Google Gemini 2.5 Flash model to provide personalized gym class recommendations and workout timing advice. This system will combine static user profile data with dynamic real-time gym traffic (Heatmap) to suggest the "Smart Match" for each user.

## Objectives

1. **Personalization**: Deliver recommendations based on user goals, experience level, and availability.
2. **Dynamic Adaptation**: Factor in real-time gym occupancy (CrowdHeatmap) to optimize user experience.
3. **Structured Intelligence**: Use JSON Schema to ensure the AI's output is predictable and easy to parse.
4. **Premium UX**: Implement "AI Vibe" animations to signal intelligent processing and enhance the premium feel.

## Technical Stack

- **AI Model**: `gemini-2.5-flash` via `@google/genai` SDK.
- **Client**: React Native (Expo) + NativeWind.
- **State Management**: React Context + Hooks.
- **Animation**: `react-native-reanimated` + `lucide-react` (or Lottie for high-fidelity "Vibe").

## Implementation Plan

### Phase 1: AI Integration & Schema Design

- [ ] Install `@google/genai` and configure the client.
- [ ] Define the `SuggestionSchema` to capture:
  - `headline`: A catchy, personalized title.
  - `reasoning`: The "why" behind the suggestion (referencing goal/heatmap).
  - `target_class_id`: The ID of the recommended class.
  - `optimal_time`: The best time to visit based on traffic.
  - `vibe_type`: Animation type to trigger (e.g., `focused`, `energetic`, `calm`).

### Phase 2: Backend/Logic Development

- [ ] Create a utility/hook `useAISmartSuggestion` to fetch insights.
- [ ] Prepare the prompt context:
  - User Profile: `goal`, `experience_level`, `age`, `gender`.
  - Context: Current day/time, Hourly traffic data (JSON), Upcoming classes list.

### Phase 3: UI/UX (AI Vibe)

- [ ] Design a premium `AISuggestionCard` component.
- [ ] Implement "AI Vibe" animations:
  - Subtle glowing border effects.
  - Typing/Thinking indicators with fluid motion.
  - Gradient transitions based on the `vibe_type`.

### Phase 4: Integration

- [ ] Insert the card above the `CrowdHeatmap` in the `ClassesScreen` list.
- [ ] Implement local caching/throttling to prevent excessive API calls.

## Response Schema (JSON)

```json
{
  "type": "object",
  "properties": {
    "headline": { "type": "string" },
    "reasoning": { "type": "string" },
    "target_class_id": { "type": "string" },
    "recommendation_type": { "enum": ["class", "timing", "mixed"] },
    "optimal_time": { "type": "string" },
    "vibe_type": { "enum": ["focus", "power", "calm", "social"] }
  },
  "required": ["headline", "reasoning", "vibe_type"]
}
```

## User Experience Flow (Demo Scenario)

1. **State**: User has "Body Index" in profile (Goal: Build Muscle, Experience: Beginner).
2. **Action**: User opens Classes tab.
3. **Processing**: AI Vibe shimmer starts while calling Gemini 2.5 Flash.
4. **Result**: "Hey Alex! Since you're building muscle, 10:00 AM today is perfect—it's 40% quieter than usual. Try the 10:30 Intro to Weights!"

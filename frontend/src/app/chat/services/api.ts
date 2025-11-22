import { BackendResponse } from "../types";

// Mock backend call - replace with real API later
export const mockBackendCall = async (
  userMessage: string
): Promise<BackendResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock logic: if message is too short, ask for refinement
  if (userMessage.length < 20) {
    return {
      code: "refine",
      message:
        "Could you please provide more details about how you'd like to help? The more specific you are, the better we can assist you!",
    };
  }

  // Otherwise, finish
  return {
    code: "finish",
    message:
      "Thank you for your contribution! We've recorded your idea and will get back to you soon.",
  };
};

// TODO: Replace with real backend call
// export const sendMessageToBackend = async (message: string): Promise<BackendResponse> => {
//   const response = await fetch('/api/chat', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ message }),
//   });
//   return response.json();
// };



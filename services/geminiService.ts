
import { GoogleGenAI } from "@google/genai";
import { Shift, Doctor, GenerationParams } from "../types";
import { API_CONFIG } from "../config";

// Initialize the client using the config file, falling back to env var
const apiKey = API_CONFIG.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeRotaConflicts = async (shifts: Shift[], doctors: Doctor[]) => {
  if (!apiKey) {
    console.warn("No API Key found for Gemini");
    return "API Key missing. Cannot analyze conflicts. Please add it to config.ts";
  }

  const model = "gemini-2.5-flash";
  
  // Simplify data for the prompt to save tokens
  const scheduleData = shifts.map(s => ({
    id: s.id,
    date: s.date,
    time: `${s.startTime}-${s.endTime}`,
    doctor: s.assignedDoctorId ? doctors.find(d => d.id === s.assignedDoctorId)?.name : 'Unassigned',
    location: s.location
  }));

  const prompt = `
    You are an expert Medical Rota Coordinator AI. 
    Analyze the following schedule data for conflicts.
    
    Rules:
    1. A doctor cannot work two shifts at the same time.
    2. A doctor should not work in two different cities on the same day unless there is a 4 hour gap.
    3. Identify unassigned shifts that need coverage.

    Data:
    ${JSON.stringify(scheduleData, null, 2)}

    Return a concise summary of issues found in plain text. Use bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error analyzing schedule. Please check your API key.";
  }
};

export const suggestMarketplaceMatches = async (openShift: Shift, doctors: Doctor[]) => {
   if (!apiKey) {
    return "{}"; // Return empty JSON if no key
  }
  
  const prompt = `
    Given an open medical shift: ${openShift.specialtyRequired} at ${openShift.location} on ${openShift.date} (${openShift.type}).
    And these doctors: ${JSON.stringify(doctors.map(d => ({name: d.name, specialty: d.specialty, city: d.city})))}.
    
    Recommend the best 2 doctors for this shift based on matching specialty and city.
    Return JSON format: { "recommendations": [{ "name": "Dr Name", "reason": "Reason" }] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return response.text;
  } catch (error) {
    console.error(error);
    return "{}";
  }
};

export const generateRotaSchedule = async (params: GenerationParams, doctors: Doctor[]) => {
  if (!apiKey) return "[]";

  const prompt = `
    Create a medical rota schedule.
    
    Parameters:
    - Start Date: ${params.startDate}
    - End Date: ${params.endDate}
    - Department: ${params.department}
    - Shifts Per Day: ${params.shiftsPerDay} (Distribute as Morning 08:00-16:00, Evening 16:00-00:00, Night 00:00-08:00)
    - Available Doctors: ${JSON.stringify(doctors.map(d => d.name))}

    Instructions:
    1. Generate shifts for every day from Start Date to End Date.
    2. Assign doctors from the provided list to the shifts. 
    3. Ensure no doctor works back-to-back shifts (e.g., Morning then Evening on the same day).
    4. Leave some shifts as "Open" if there are not enough doctors or to create opportunities.
    
    Output a JSON array of objects. Each object must have this EXACT structure:
    {
      "date": "YYYY-MM-DD",
      "type": "Morning" | "Evening" | "Night",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "assignedDoctor": "Exact Name from list" | "Open"
    }
    
    Return ONLY the JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return response.text;
  } catch (error) {
    console.error(error);
    return "[]";
  }
};

export const parseRotaFromImage = async (base64String: string) => {
  if (!apiKey) return "[]";

  // Dynamic Mime Type Detection
  let mimeType = 'image/jpeg';
  let cleanBase64 = base64String;

  if (base64String.includes('data:')) {
    const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      cleanBase64 = matches[2];
    }
  }

  const prompt = `
    Analyze this medical rota document (Image or PDF).
    Extract the shifts into a JSON array structure compatible with this format:
    [{ "date": "YYYY-MM-DD", "type": "Morning/Evening/Night", "startTime": "HH:mm", "endTime": "HH:mm", "assignedDoctorName": "Name or 'Open'", "centerName": "Center Name found in doc or 'Unknown'" }]
    
    If the year is missing, assume the current year.
    If the exact time is missing, infer standard shifts (Morning 8-16, Evening 16-00, Night 00-08).
    Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    return response.text;
  } catch (error) {
    console.error("Vision Error:", error);
    return "[]";
  }
};

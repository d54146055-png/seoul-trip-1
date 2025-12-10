import { GoogleGenAI, Type } from "@google/genai";
import { ItineraryItem, ParsedLocation } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateItinerarySuggestion = async (day: number, context: string, areas?: string): Promise<ItineraryItem[]> => {
  try {
    const areaPrompt = areas ? `Specifically focusing on these areas/districts: ${areas}. Arrange the route logically to minimize travel time between these districts.` : '';
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest a realistic 1-day itinerary for Day ${day} of a trip to Seoul, South Korea. 
      ${areaPrompt}
      Context/Vibe: ${context}.
      Include estimated weather for this time of year (Spring/Autumn usually best).
      Return a JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING, description: "Time in HH:MM format (24h)" },
              activity: { type: Type.STRING, description: "Short title of activity" },
              location: { type: Type.STRING, description: "Name of the place/area" },
              notes: { type: Type.STRING, description: "Helpful tip or transport info" },
              weather: {
                type: Type.OBJECT,
                properties: {
                  temp: { type: Type.NUMBER, description: "Temperature in Celsius" },
                  condition: { type: Type.STRING, description: "One of: sunny, cloudy, rainy, snowy" },
                  icon: { type: Type.STRING, description: "Emoji representing weather" }
                }
              }
            },
            required: ["time", "activity", "location"]
          }
        }
      }
    });

    const items = JSON.parse(response.text || "[]");
    // We don't generate IDs here anymore as Firestore will assign them, 
    // but the UI might need temp ones if we weren't using Firestore directly. 
    // For now, we return plain objects.
    return items.map((item: any) => ({
      ...item,
      day
    }));
  } catch (error) {
    console.error("Gemini Itinerary Error:", error);
    return [];
  }
};

export const parseLocationsFromText = async (text: string): Promise<ParsedLocation[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract all travel locations/places mentioned in this text. 
      For each location, estimate its latitude and longitude coordinates in Seoul. 
      Return a JSON array. 
      Text: "${text.substring(0, 5000)}"`, // Limit text length
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              description: { type: Type.STRING, description: "Brief snippet about what to do here based on text" }
            },
            required: ["name", "lat", "lng"]
          }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Parsing locations error:", error);
    return [];
  }
};

export const chatWithTravelGuide = async (
  message: string, 
  location?: { lat: number; lng: number }
) => {
  try {
    const toolConfig = location ? {
      retrievalConfig: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    } : undefined;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: "You are a savvy local guide for Seoul, South Korea. You help tourists find great food, transport, and hidden gems. Keep answers concise and helpful for mobile users.",
        tools: [{ googleMaps: {} }],
        toolConfig: toolConfig,
      }
    });

    // Extract grounding chunks for map links
    // The SDK types might be loose, so we safely access the path
    // @ts-ignore - groundingMetadata types can be tricky in preview
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const mapLinks = groundingChunks
      .map((chunk: any) => {
        if (chunk.web) return { source: chunk.web };
        // Maps grounding often returns chunks in a specific structure, we standardize here
        // If it's a maps chunk, it usually has a source structure
        return null;
      })
      .filter((l: any) => l !== null);

    // If strictly maps grounding chunks are different:
    const specificMapChunks = groundingChunks
        .filter((c: any) => c.maps?.placeAnswerSources?.length > 0)
        .flatMap((c: any) => c.maps.placeAnswerSources.map((s: any) => ({
             source: { title: s.placeName || 'View on Map', uri: s.googleMapsUri || '#' } 
        })));


    return {
      text: response.text,
      mapChunks: [...mapLinks, ...specificMapChunks]
    };

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return {
      text: "Sorry, I'm having trouble connecting to the travel network right now. Please try again.",
      mapChunks: []
    };
  }
};
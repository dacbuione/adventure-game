
export interface Choice {
  text: string;
  nextStepPrompt: string;
}

export interface ScenePayload {
  sceneText: string;
  imagePrompt: string;
  choices: Choice[];
  gameOver?: boolean;
  gameWon?: boolean; 
}

// Represents the current state of the game's narrative content
export interface CurrentScene extends ScenePayload {}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Potentially other types of chunks if the API supports them
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Other grounding metadata fields
}

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
  // Other candidate fields
}
// This is a simplified representation of what might be in GenerateContentResponse
export interface GeminiResponseData {
   candidates?: Candidate[];
   // Other fields from GenerateContentResponse if needed
}


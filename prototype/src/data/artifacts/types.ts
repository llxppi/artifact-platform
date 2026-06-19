export interface ArtifactPersonality {
  tone: string;
  speechStyle: string;
  firstPersonName: string;
  proudOf: string[];
  sensitiveTopic: string[];
  catchphrase: string;
  memoryPoints: string[];
  conflictStyle: string;
  ageGroupStyle: {
    child: string;
    teen: string;
    adult: string;
  };
}

export interface KnowledgeItem {
  content: string;
  type: "history" | "craft" | "legend" | "mystery";
  credibility: 1 | 2 | 3 | 4 | 5;
  source: string;
}

export interface Artifact {
  id: string;
  name: string;
  nickname: string;
  dynasty: string;
  period: string;
  category: string;
  material: string;
  weightKg?: number;
  dimensions?: string;
  discoveryPlace: string;
  discoveryYear?: number;
  currentLocation: string;
  emoji: string;
  image?: string;
  color: string;
  bgGradient: string;
  description: string;
  digitalInkstone: string[];
  personality: ArtifactPersonality;
  knowledge: KnowledgeItem[];
}

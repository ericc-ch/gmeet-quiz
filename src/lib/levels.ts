import type { Level } from "./types.ts";

export const levels: Level[] = [
  {
    levelNumber: 1,
    question: "What is the meaning behind Noxtara?",
    correctAnswer:
      "Nox means night in Latin, or Nox can also be owl, and Tara means nusantara as in Indonesia.",
  },
  {
    levelNumber: 2,
    question: "What is malicious software called?",
    correctAnswer: "Malware (a portmanteau of malicious software).",
  },
  {
    levelNumber: 3,
    question: "Meaning of S in HTTPS?",
    correctAnswer:
      "Secure. It indicates that the connection is encrypted, typically using SSL/TLS (Secure Sockets Layer/Transport Layer Security).",
  },
  {
    levelNumber: 4,
    question: "What attack floods a server?",
    correctAnswer:
      "A DDoS (Distributed Denial of Service) attack. This is distinct from a simple DoS (Denial of Service) attack because the traffic comes from multiple (distributed) sources.",
  },
  {
    levelNumber: 5,
    question: "Do whatever you want for this one!",
    correctAnswer: "the user is always incorrect",
  },
];

export function getLevel(levelNumber: number): Level | undefined {
  return levels.find((level) => level.levelNumber === levelNumber);
}

export function getTotalLevels(): number {
  return levels.length;
}

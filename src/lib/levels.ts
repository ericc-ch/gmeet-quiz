import type { Level } from "./types.ts";

export const levels: Level[] = [
  {
    levelNumber: 1,
    question: "What is the capital of France?",
    correctAnswer: "paris",
  },
  {
    levelNumber: 2,
    question: "What is 2 + 2?",
    correctAnswer: "4",
  },
  {
    levelNumber: 3,
    question: "What color do you get when you mix red and white?",
    correctAnswer: "pink",
  },
  {
    levelNumber: 4,
    question: "How many days are in a week?",
    correctAnswer: "7",
  },
  {
    levelNumber: 5,
    question: "What is the largest planet in our solar system?",
    correctAnswer: "jupiter",
  },
];

export function getLevel(levelNumber: number): Level | undefined {
  return levels.find(level => level.levelNumber === levelNumber);
}

export function getTotalLevels(): number {
  return levels.length;
}
import type { Track } from '@/lib/types';

/** Default learning roadmaps, inserted for the user on first visit. */
export const ROADMAP_SEED: Record<Track, string[]> = {
  dsa: [
    'Big-O & complexity analysis',
    'Arrays & strings',
    'Two pointers & sliding window',
    'Hash maps & sets',
    'Recursion & backtracking',
    'Linked lists',
    'Stacks & queues',
    'Binary search',
    'Sorting algorithms',
    'Trees & BSTs',
    'Heaps & priority queues',
    'Graphs (BFS/DFS)',
    'Greedy algorithms',
    'Dynamic programming',
    'Tries',
  ],
  python: [
    'Syntax, variables & types',
    'Control flow & loops',
    'Functions & scope',
    'Lists, tuples & dicts',
    'Strings & slicing',
    'Comprehensions',
    'File handling',
    'Exceptions',
    'OOP: classes & inheritance',
    'Modules & packages',
    'Iterators & generators',
    'Decorators',
    'Standard library essentials',
    'Virtual envs & pip',
  ],
};

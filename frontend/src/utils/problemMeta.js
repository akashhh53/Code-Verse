export const difficultyOptions = [
  { value: 'all', label: 'All difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export const topicOptions = [
  { value: 'array', label: 'Array' },
  { value: 'string', label: 'String' },
  { value: 'hashTable', label: 'Hash table' },
  { value: 'linkedList', label: 'Linked list' },
  { value: 'stack', label: 'Stack' },
  { value: 'queue', label: 'Queue' },
  { value: 'tree', label: 'Tree' },
  { value: 'binaryTree', label: 'Binary tree' },
  { value: 'binarySearchTree', label: 'Binary search tree' },
  { value: 'heap', label: 'Heap / priority queue' },
  { value: 'graph', label: 'Graph' },
  { value: 'dfs', label: 'DFS' },
  { value: 'bfs', label: 'BFS' },
  { value: 'topologicalSort', label: 'Topological sort' },
  { value: 'unionFind', label: 'Union find' },
  { value: 'trie', label: 'Trie' },
  { value: 'dp', label: 'Dynamic programming' },
  { value: 'greedy', label: 'Greedy' },
  { value: 'backtracking', label: 'Backtracking' },
  { value: 'binarySearch', label: 'Binary search' },
  { value: 'twoPointers', label: 'Two pointers' },
  { value: 'slidingWindow', label: 'Sliding window' },
  { value: 'sorting', label: 'Sorting' },
  { value: 'recursion', label: 'Recursion' },
  { value: 'divideAndConquer', label: 'Divide and conquer' },
  { value: 'bitManipulation', label: 'Bit manipulation' },
  { value: 'math', label: 'Math' },
  { value: 'numberTheory', label: 'Number theory' },
  { value: 'prefixSum', label: 'Prefix sum' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'intervals', label: 'Intervals' },
  { value: 'monotonicStack', label: 'Monotonic stack' },
  { value: 'shortestPath', label: 'Shortest path' },
  { value: 'segmentTree', label: 'Segment tree' },
  { value: 'fenwickTree', label: 'Fenwick tree' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'design', label: 'Design' },
];

export const tagOptions = [{ value: 'all', label: 'All topics' }, ...topicOptions];

export const topicValues = topicOptions.map((option) => option.value);

export const topicCount = topicOptions.length;

export const statusOptions = [
  { value: 'all', label: 'Any status' },
  { value: 'solved', label: 'Solved' },
  { value: 'unsolved', label: 'Unsolved' },
];

export const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

export const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript',
};

export const formatLabel = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

export const getTagLabel = (tag) => {
  return tagOptions.find((option) => option.value === tag)?.label || tag;
};

export const getDifficultyTone = (difficulty = '') => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'text-success';
    case 'medium':
      return 'text-warning';
    case 'hard':
      return 'text-error';
    default:
      return 'text-base-content/60';
  }
};

export const getDifficultyBadgeColor = (difficulty = '') => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'badge-success';
    case 'medium':
      return 'badge-warning';
    case 'hard':
      return 'badge-error';
    default:
      return 'badge-neutral';
  }
};

export const getDifficultyDot = (difficulty = '') => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-success';
    case 'medium':
      return 'bg-warning';
    case 'hard':
      return 'bg-error';
    default:
      return 'bg-base-content/40';
  }
};

export const getInitials = (name) => {
  if (!name) return 'C';
  return name.trim().charAt(0).toUpperCase() || 'C';
};

export const getInitialCode = (problem, language) => {
  return problem?.startCode?.find((starter) => starter.language === langMap[language])?.initialCode || '';
};

export const selectDailyChallenge = (problems, solvedProblemIds, userKey = 'guest') => {
  if (!problems.length) {
    return {
      state: 'empty',
      label: 'No challenge published yet',
      problem: null,
    };
  }

  const unsolvedProblems = problems.filter((problem) => !solvedProblemIds.has(problem._id));
  const solvedProblems = problems.filter((problem) => solvedProblemIds.has(problem._id));

  if (!unsolvedProblems.length) {
    return {
      state: 'caught-up',
      label: 'Caught up · no daily challenge',
      problem: null,
    };
  }

  const todayKey = new Date().toLocaleDateString('en-CA');
  const seed = hashString(`${todayKey}-${userKey}-${problems.length}`);
  const shouldReviewSolved = solvedProblems.length > 0 && seed % 20 === 0;
  const pool = shouldReviewSolved ? solvedProblems : unsolvedProblems;
  const problem = pool[seed % pool.length];

  return {
    state: shouldReviewSolved ? 'review' : 'daily',
    label: `${shouldReviewSolved ? 'Review challenge' : 'Daily challenge'} · ${problem.title}`,
    problem,
  };
};

const hashString = (value) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

import { 
  User, Subject, PlannerTask, ScheduleItem, RevisionItem, 
  Note, QuizQuestion, Flashcard, MockExam, PreviousYearQuestion, 
  CodingProblem, SkillRoadmap, Achievement 
} from '../types/index.js';

export const initialUser: User = {
  id: 'usr_default_student',
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  university: 'Imperial Institute of Technology',
  degree: 'B.Tech',
  branch: 'Computer Science & Engineering',
  major: 'Computer Science & Engineering',
  semester: 5,
  subjects: [
    'Data Structures & Algorithms',
    'Operating Systems',
    'Database Management Systems',
    'Computer Networks',
    'Discrete Mathematics',
    'Artificial Intelligence & Machine Learning'
  ],
  learningInterests: ['Algorithms', 'Distributed Systems', 'Applied AI'],
  careerInterests: ['Full-Stack AI Engineer', 'Backend Systems Architect'],
  onboardingComplete: true,
  targetGpa: 9.0,
  currentGpa: 8.6,
  streakDays: 14,
  totalStudyHours: 142.5,
  quizzesCompleted: 28,
  problemsSolved: 54,
  dreamRole: 'Full-Stack AI Engineer',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-08-15T08:00:00.000Z'
};

export const initialSubjects: Subject[] = [
  {
    id: 'sub_dsa',
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    semester: 5,
    credits: 4,
    description: 'Advanced data representations, asymptotic complexity, trees, graphs, dynamic programming, and greedy algorithms.',
    icon: 'Binary',
    units: [
      {
        id: 'unit_dsa_1',
        unitNumber: 1,
        title: 'Asymptotic Analysis & Linear Structures',
        description: 'Big-O, Omega, Theta notation, amortized analysis, linked lists, stacks, queues, and skip lists.',
        topics: [
          {
            id: 'top_dsa_1_1',
            title: 'Asymptotic Notations & Master Theorem',
            estimatedMinutes: 35,
            content: 'Asymptotic analysis describes the limiting behavior of execution time or memory when input size $n$ approaches infinity.\n\n### Big-O ($O$), Big-$\Omega$, Big-$\Theta$\n- **$O(g(n))$**: Upper bound. $f(n) \\le c \\cdot g(n)$ for all $n \\ge n_0$.\n- **$\\Omega(g(n))$**: Lower bound. $f(n) \\ge c \\cdot g(n)$ for all $n \\ge n_0$.\n- **$\\Theta(g(n))$**: Tight bound. $c_1 g(n) \\le f(n) \\le c_2 g(n)$.\n\n### Master Theorem\nFor recurrences of the form $T(n) = a T(n/b) + f(n)$ where $a \\ge 1, b > 1$:\n- If $f(n) = O(n^{\\log_b a - \\epsilon})$, then $T(n) = \\Theta(n^{\\log_b a})$.\n- If $f(n) = \\Theta(n^{\\log_b a} \\log^k n)$, then $T(n) = \\Theta(n^{\\log_b a} \\log^{k+1} n)$.\n- If $f(n) = \\Omega(n^{\\log_b a + \\epsilon})$ and regularity condition holds, $T(n) = \\Theta(f(n))$.',
            subtopics: [
              'Best, Average, and Worst-Case Time Complexity',
              'Formal Definitions of Big-O, Big-Omega, and Big-Theta',
              'Recurrence Relations & Recursion Tree Method',
              'Master Theorem Three Cases & Regularity Condition',
              'Amortized Complexity (Aggregate & Potential Method)'
            ],
            learningObjectives: [
              'Formally prove upper, lower, and tight asymptotic bounds for iterative and recursive algorithms.',
              'Apply the Master Theorem to solve divide-and-conquer recurrences such as Merge Sort, Binary Search, and Strassen’s Matrix Multiplication.',
              'Distinguish between worst-case complexity and amortized complexity in dynamic arrays.'
            ],
            keyPoints: [
              'Big-O represents the worst-case asymptotic upper bound.',
              'Master theorem solves divide-and-conquer recurrences in $O(1)$ lookup time.',
              'Amortized analysis averages cost across a sequence of operations.'
            ],
            codeExamples: [
              {
                language: 'python',
                code: '# Binary Search: O(log n) time, O(1) space\ndef binary_search(arr: list[int], target: int) -> int:\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = left + (right - left) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1'
              }
            ],
            practiceQuestions: [
              {
                question: 'Solve the recurrence T(n) = 4T(n/2) + n^2 using the Master Theorem.',
                hint: 'Compare n^(log_b a) = n^(log_2 4) = n^2 with f(n) = n^2.',
                answer: 'Here a = 4, b = 2, so n^(log_2 4) = n^2. Since f(n) = Theta(n^2 log^0 n), Case 2 applies and T(n) = Theta(n^2 log n).'
              },
              {
                question: 'Why does appending n elements to a dynamic array take O(n) total time despite occasional O(n) resizing?',
                hint: 'Sum the geometric series of array doubling costs: 1 + 2 + 4 + ... + n.',
                answer: 'Doubling happens only at powers of 2. The total copy cost over n insertions is bounded by 2n, yielding O(1) amortized time per insertion.'
              }
            ],
            revisionResources: [
              {
                title: 'Master Theorem Quick Sheet',
                type: 'formula',
                summary: 'Compare f(n) against n^(log_b a): smaller -> Case 1 Theta(n^log_b a); equal -> Case 2 multiply by log n; larger -> Case 3 Theta(f(n)).'
              },
              {
                title: 'Common Complexity Hierarchy',
                type: 'cheatsheet',
                summary: 'O(1) < O(log n) < O(sqrt(n)) < O(n) < O(n log n) < O(n^2) < O(2^n) < O(n!)'
              }
            ],
            isCompleted: true
          },
          {
            id: 'top_dsa_1_2',
            title: 'Singly & Doubly Linked Lists with Cycle Detection',
            estimatedMinutes: 40,
            content: 'Linked lists represent linear sequences of nodes containing data and reference pointers.\n\nFloyd\'s Cycle Finding Algorithm (Tortoise and Hare) uses two pointers moving at different speeds (1 step and 2 steps). If a cycle exists, they are guaranteed to meet inside the loop in $O(n)$ time and $O(1)$ auxiliary space.',
            subtopics: [
              'Singly, Doubly, and Circular Linked List Representations',
              'In-Place Reversal of Linked Lists',
              'Floyd’s Tortoise and Hare Cycle Detection & Cycle Entry Node Proof',
              'LRU Cache Design using Doubly Linked List + Hash Map'
            ],
            learningObjectives: [
              'Implement pointer manipulation for $O(1)$ head/tail insertion and deletion without memory leaks.',
              'Mathematically prove why fast and slow pointers meet at the cycle entry point when reset to head.',
              'Combine doubly linked lists and hash maps to build an $O(1)$ LRU cache.'
            ],
            keyPoints: [
              'Insertions at head take $O(1)$ time.',
              'Floyd’s algorithm detects cycles without extra hash table storage.',
              'Doubly linked lists enable $O(1)$ deletion when the node pointer is known.'
            ],
            codeExamples: [
              {
                language: 'javascript',
                code: 'function hasCycle(head) {\n  let slow = head, fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) return true;\n  }\n  return false;\n}'
              }
            ],
            practiceQuestions: [
              {
                question: 'How do you find the exact starting node of a cycle in a singly linked list in O(1) space?',
                hint: 'Once slow and fast meet inside the cycle, place one pointer back at head.',
                answer: 'After slow and fast collide, reset slow = head and advance both by 1 step at a time. The node where they meet is the cycle entrance.'
              }
            ],
            revisionResources: [
              {
                title: 'Linked List vs Dynamic Array Tradeoffs',
                type: 'summary',
                summary: 'Arrays give O(1) random access and cache locality; Linked Lists give O(1) splice/insert given a node reference.'
              }
            ],
            isCompleted: true
          }
        ]
      },
      {
        id: 'unit_dsa_2',
        unitNumber: 2,
        title: 'Non-Linear Structures: Trees & Heaps',
        description: 'Binary search trees, AVL self-balancing trees, Red-Black properties, and priority queues.',
        topics: [
          {
            id: 'top_dsa_2_1',
            title: 'AVL Trees & Rotations',
            estimatedMinutes: 45,
            content: 'An AVL tree is a self-balancing binary search tree where the heights of the two child subtrees of any node differ by at most 1.\n\nBalance Factor: $BF = \\text{height}(left) - \\text{height}(right) \\in \\{-1, 0, 1\\}$.\n\nWhen an insertion unbalances a node, four rotation cases restore balance in $O(1)$ time: Left-Left (Single Right Rotation), Right-Right (Single Left Rotation), Left-Right (Double Rotation), and Right-Left (Double Rotation).',
            subtopics: [
              'BST Invariant & Degenerate Skewed Trees',
              'Balance Factor Calculation & Height Maintenance',
              'LL, RR, LR, and RL Tree Rotations',
              'Comparison of AVL Trees vs Red-Black Trees'
            ],
            learningObjectives: [
              'Identify which of the four AVL rotation types is required after inserting or deleting a key.',
              'Prove why an AVL tree of $n$ nodes has height strictly bounded by $1.44 \\log_2(n+2)$.'
            ],
            keyPoints: [
              'Guarantees $O(\\log n)$ search, insertion, and deletion.',
              'More rigidly balanced than Red-Black trees, making lookups faster.'
            ],
            codeExamples: [
              {
                language: 'python',
                code: 'def right_rotate(y):\n    x = y.left\n    T2 = x.right\n    x.right = y\n    y.left = T2\n    y.height = 1 + max(height(y.left), height(y.right))\n    x.height = 1 + max(height(x.left), height(x.right))\n    return x'
              }
            ],
            practiceQuestions: [
              {
                question: 'Insert keys 10, 20, 30 into an initially empty AVL tree. Which rotation is triggered?',
                hint: 'Check the balance factor of node 10 after inserting 30.',
                answer: 'Node 10 gets Balance Factor -2 (Right-Right imbalance), triggering a Single Left Rotation around 10, making 20 the new root.'
              }
            ],
            revisionResources: [
              {
                title: 'AVL Rotation Matrix',
                type: 'cheatsheet',
                summary: 'BF > 1 & key < left.key -> LL (Right Rotate); BF < -1 & key > right.key -> RR (Left Rotate); LR -> Left then Right; RL -> Right then Left.'
              }
            ],
            isCompleted: false
          }
        ]
      },
      {
        id: 'unit_dsa_3',
        unitNumber: 3,
        title: 'Graphs, Shortest Paths & Dynamic Programming',
        description: 'BFS/DFS traversals, topological sort, Dijkstra, Bellman-Ford, and overlapping subproblems.',
        topics: [
          {
            id: 'top_dsa_3_1',
            title: 'Dijkstra’s Shortest Path & Dynamic Programming Foundations',
            estimatedMinutes: 50,
            content: 'Dijkstra’s algorithm computes single-source shortest paths on graphs with non-negative edge weights using a greedy min-priority queue strategy in $O((V + E) \\log V)$ time.\n\nDynamic Programming (DP) solves optimization problems exhibiting **Optimal Substructure** and **Overlapping Subproblems** via top-down memoization or bottom-up tabulation.',
            subtopics: [
              'Breadth-First Search (BFS) & Depth-First Search (DFS)',
              'Edge Relaxation & Dijkstra’s Priority Queue Invariant',
              'Bellman-Ford & Negative Weight Cycle Detection',
              '0/1 Knapsack & Longest Common Subsequence (LCS)'
            ],
            learningObjectives: [
              'Trace Dijkstra’s algorithm and explain why negative edge weights break its greedy invariant.',
              'Formulate state transitions and base cases for 1D and 2D Dynamic Programming problems.'
            ],
            keyPoints: [
              'Dijkstra requires non-negative weights; Bellman-Ford handles negative weights in $O(VE)$.',
              'DP trades space for time by caching subproblem solutions.'
            ],
            codeExamples: [
              {
                language: 'python',
                code: 'import heapq\ndef dijkstra(graph, start):\n    dist = {node: float("inf") for node in graph}\n    dist[start] = 0\n    pq = [(0, start)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist[u]: continue\n        for v, w in graph[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                heapq.heappush(pq, (dist[v], v))\n    return dist'
              }
            ],
            practiceQuestions: [
              {
                question: 'What is the time complexity of 0/1 Knapsack with n items and capacity W?',
                hint: 'Consider the dimensions of the DP table.',
                answer: 'O(n * W) time and O(W) auxiliary space when optimized to a 1D rolling array (pseudo-polynomial time).'
              }
            ],
            revisionResources: [
              {
                title: 'Shortest Path Algorithm Selector',
                type: 'reference',
                summary: 'Unweighted -> BFS O(V+E); Non-negative weights -> Dijkstra O((V+E)log V); Negative weights -> Bellman-Ford O(VE); All-pairs -> Floyd-Warshall O(V^3).'
              }
            ],
            isCompleted: false
          }
        ]
      }
    ]
  },
  {
    id: 'sub_os',
    code: 'CS302',
    name: 'Operating Systems',
    semester: 5,
    credits: 4,
    description: 'Process management, concurrency, CPU scheduling algorithms, virtual memory paging, and file systems.',
    icon: 'Cpu',
    units: [
      {
        id: 'unit_os_1',
        unitNumber: 1,
        title: 'Processes, Threads & CPU Scheduling',
        description: 'Process Control Block (PCB), context switching, POSIX threads, and scheduling heuristics.',
        topics: [
          {
            id: 'top_os_1_1',
            title: 'Process Lifecycle & Context Switching',
            estimatedMinutes: 30,
            content: 'A process is an instance of an executing program consisting of text segment, data segment, heap, and call stack.\n\nState Diagram: New -> Ready -> Running -> Waiting (Blocked) -> Terminated.\n\nContext switching saves the CPU register state into the PCB of the current process and reloads the PCB of the next scheduled process. This incurs CPU overhead without executing user instructions.',
            subtopics: [
              'Process Memory Layout (Text, Data, BSS, Heap, Stack)',
              '5-State and 7-State Process Transitions',
              'Process Control Block (PCB) & Kernel Mode Transitions',
              'User-Level vs Kernel-Level Threads'
            ],
            learningObjectives: [
              'Differentiate between a process and a thread in terms of address space sharing and context switch cost.',
              'Trace state transitions triggered by system calls, interrupts, and I/O completion events.'
            ],
            keyPoints: [
              'PCB stores Program Counter, Registers, Memory Limits, Open File Descriptors.',
              'Context switch overhead is influenced by cache pollution and TLB flushes.'
            ],
            codeExamples: [
              {
                language: 'c',
                code: '#include <stdio.h>\n#include <unistd.h>\nint main() {\n    pid_t pid = fork();\n    if (pid == 0) {\n        printf("Child process (PID: %d)\\n", getpid());\n    } else if (pid > 0) {\n        printf("Parent waiting for child %d\\n", pid);\n    }\n    return 0;\n}'
              }
            ],
            practiceQuestions: [
              {
                question: 'How many total processes are created if a program calls fork() 3 times unconditionally in sequence?',
                hint: 'Each fork() doubles the number of active processes.',
                answer: '2^3 = 8 total processes (1 original parent + 7 newly created child processes).'
              }
            ],
            revisionResources: [
              {
                title: 'Process vs Thread Summary',
                type: 'summary',
                summary: 'Processes have isolated virtual address spaces; threads within a process share code, data, and heap but maintain separate stacks and registers.'
              }
            ],
            isCompleted: true
          },
          {
            id: 'top_os_1_2',
            title: 'CPU Scheduling Algorithms: Round Robin & SRTF',
            estimatedMinutes: 40,
            content: 'Schedulers optimize turnaround time, waiting time, and response time.\n\n- **Shortest Remaining Time First (SRTF)**: Preemptive version of SJF; mathematically minimizes average waiting time, but risks starvation of long jobs.\n- **Round Robin (RR)**: Time quantum $q$ slices CPU fairly among ready processes. If $q$ is too small, context switch overhead dominates; if too large, it degrades to FCFS.',
            subtopics: [
              'Turnaround Time, Waiting Time, and Response Time Formulas',
              'Convoy Effect in First-Come First-Served (FCFS)',
              'Shortest Job First (SJF) & Preemptive SRTF',
              'Round Robin Quantum Selection & Multilevel Feedback Queues (MLFQ)'
            ],
            learningObjectives: [
              'Construct Gantt charts and compute average Turnaround Time and Waiting Time for preemptive and non-preemptive workloads.',
              'Explain how aging prevents indefinite starvation in priority scheduling.'
            ],
            keyPoints: [
              'SRTF gives minimal average waiting time.',
              'Round Robin prevents starvation with bounded latency.'
            ],
            practiceQuestions: [
              {
                question: 'Give the formula relating Turnaround Time (TAT), Completion Time (CT), Arrival Time (AT), Waiting Time (WT), and Burst Time (BT).',
                hint: 'Turnaround time is total time spent in the system from arrival to completion.',
                answer: 'TAT = CT - AT, and WT = TAT - BT.'
              }
            ],
            revisionResources: [
              {
                title: 'CPU Scheduling Formulas',
                type: 'formula',
                summary: 'Turnaround Time = Completion Time - Arrival Time | Waiting Time = Turnaround Time - Burst Time | Response Time = First CPU Allocation - Arrival Time.'
              }
            ],
            isCompleted: true
          }
        ]
      },
      {
        id: 'unit_os_2',
        unitNumber: 2,
        title: 'Synchronization & Deadlocks',
        description: 'Critical section problem, semaphores, mutexes, monitors, and Banker\'s algorithm.',
        topics: [
          {
            id: 'top_os_2_1',
            title: 'Semaphores & Dining Philosophers Problem',
            estimatedMinutes: 45,
            content: 'A semaphore is an integer variable accessed via atomic `wait()` (P) and `signal()` (V) operations.\n\nDeadlock requires four simultaneous Coffman conditions:\n1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait\n\nDining Philosophers can be solved deadlock-free by resource hierarchy (odd/even ordering) or an asymmetric pickup strategy.',
            subtopics: [
              'Race Conditions & Critical Section Requirements (Mutual Exclusion, Progress, Bounded Waiting)',
              'Peterson’s Solution & Hardware Atomic Instructions (Test-and-Set, CAS)',
              'Producer-Consumer & Readers-Writers Problems',
              'Coffman Deadlock Conditions & Banker’s Safety Algorithm'
            ],
            learningObjectives: [
              'Write deadlock-free synchronization pseudocode using mutexes and counting semaphores.',
              'Execute Banker’s Algorithm to verify whether a system resource state has a safe execution sequence.'
            ],
            keyPoints: [
              'Counting vs Binary semaphores.',
              'Banker’s algorithm tests safe states before granting resource requests.'
            ],
            practiceQuestions: [
              {
                question: 'Which Coffman condition is broken when processes must request resources in strictly increasing numerical order?',
                hint: 'Think about whether a cycle can form in the resource allocation graph.',
                answer: 'Circular Wait is broken because a cycle cannot exist when resources are acquired in strictly ascending order.'
              }
            ],
            revisionResources: [
              {
                title: 'Coffman Conditions Checklist',
                type: 'cheatsheet',
                summary: '1. Mutual Exclusion | 2. Hold & Wait | 3. No Preemption | 4. Circular Wait. Negating ANY one prevents deadlock.'
              }
            ],
            isCompleted: false
          }
        ]
      },
      {
        id: 'unit_os_3',
        unitNumber: 3,
        title: 'Virtual Memory, Paging & Page Replacement',
        description: 'Page tables, Translation Lookaside Buffer (TLB), Effective Access Time, and LRU/Optimal replacement.',
        topics: [
          {
            id: 'top_os_3_1',
            title: 'Demand Paging, TLB & Page Replacement (FIFO, Optimal, LRU)',
            estimatedMinutes: 45,
            content: 'Virtual memory decouples logical address space from physical RAM frames using page tables and a hardware Translation Lookaside Buffer (TLB).\n\n**Effective Access Time (EAT)**:\n$$\\text{EAT} = \\alpha (t_{\\text{TLB}} + t_{\\text{mem}}) + (1 - \\alpha)(t_{\\text{TLB}} + 2 t_{\\text{mem}})$$\nwhere $\\alpha$ is the TLB hit ratio.\n\n**Page Replacement**:\n- **FIFO**: Suffers from Belady’s Anomaly.\n- **Optimal (OPT)**: Replaces the page not needed for the longest future time.\n- **LRU**: Stack algorithm replacing the least recently accessed page; free of Belady’s Anomaly.',
            subtopics: [
              'Logical to Physical Address Translation (Page Number + Offset)',
              'Hierarchical & Inverted Page Tables',
              'Translation Lookaside Buffer (TLB) Hit Ratio & EAT Calculation',
              'FIFO, Optimal, LRU, and Clock Page Replacement & Thrashing'
            ],
            learningObjectives: [
              'Calculate Effective Access Time given TLB hit rate, memory access latency, and page fault service time.',
              'Simulate FIFO, Optimal, and LRU page replacement on reference strings and identify Belady’s Anomaly.'
            ],
            keyPoints: [
              'LRU and Optimal are stack algorithms and never suffer from Belady’s Anomaly.',
              'Working-set model prevents thrashing by ensuring enough frames are allocated per active process.'
            ],
            practiceQuestions: [
              {
                question: 'If TLB lookup takes 10 ns, memory access takes 100 ns, and TLB hit ratio is 90%, what is the Effective Access Time (ignoring page faults)?',
                hint: 'EAT = 0.90 * (10 + 100) + 0.10 * (10 + 200).',
                answer: 'EAT = 0.90 * 110 + 0.10 * 210 = 99 + 21 = 120 ns.'
              }
            ],
            revisionResources: [
              {
                title: 'Virtual Memory Formula Card',
                type: 'formula',
                summary: 'Number of Pages = Logical Address Space / Page Size | Offset bits = log2(Page Size).'
              }
            ],
            isCompleted: false
          }
        ]
      }
    ]
  },
  {
    id: 'sub_dbms',
    code: 'CS303',
    name: 'Database Management Systems',
    semester: 5,
    credits: 3,
    description: 'Relational algebra, normal forms (1NF to BCNF), indexing (B+ Trees), ACID transactions, and concurrency control.',
    icon: 'Database',
    units: [
      {
        id: 'unit_dbms_1',
        unitNumber: 1,
        title: 'Relational Model & Normalization',
        description: 'Functional dependencies, lossless join decomposition, and 3NF vs BCNF.',
        topics: [
          {
            id: 'top_dbms_1_1',
            title: 'Functional Dependencies & BCNF Normalization',
            estimatedMinutes: 40,
            content: 'Normalization eliminates insertion, update, and deletion anomalies while minimizing redundancy.\n\n- **1NF**: Atomic attribute values.\n- **2NF**: In 1NF and no non-prime attribute is partially dependent on any candidate key.\n- **3NF**: In 2NF and no transitive dependencies ($X \\to Y \\implies X$ is superkey or $Y$ is prime).\n- **Boyce-Codd Normal Form (BCNF)**: For every non-trivial functional dependency $X \\to Y$, $X$ MUST be a superkey.',
            subtopics: [
              'Armstrong’s Axioms & Attribute Closure ($X^+$)',
              'Candidate Key Discovery from Functional Dependencies',
              '1NF, 2NF, 3NF, and BCNF Definitions',
              'Lossless-Join & Dependency-Preserving Decompositions'
            ],
            learningObjectives: [
              'Compute attribute closures to find all candidate keys of a relation.',
              'Determine the highest normal form satisfied by a schema and decompose it losslessly into 3NF/BCNF.'
            ],
            keyPoints: [
              'BCNF eliminates all redundancy based on functional dependencies.',
              '3NF guarantees dependency preservation; BCNF may lose dependencies during decomposition.'
            ],
            codeExamples: [
              {
                language: 'sql',
                code: '-- Normalized 3NF Schema for Course Enrollment\nCREATE TABLE Students (\n  student_id INT PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  dept_id INT REFERENCES Departments(dept_id)\n);\nCREATE TABLE Enrollments (\n  student_id INT REFERENCES Students(student_id),\n  course_id INT REFERENCES Courses(course_id),\n  grade CHAR(2),\n  PRIMARY KEY (student_id, course_id)\n);'
              }
            ],
            practiceQuestions: [
              {
                question: 'Given relation R(A, B, C) with FDs {AB -> C, C -> B}, what is the highest normal form of R?',
                hint: 'Find the candidate keys first: (AB)+ = ABC and (AC)+ = ABC. Thus B is a prime attribute.',
                answer: 'Candidate keys are AB and AC. In C -> B, C is not a superkey, violating BCNF, but B is a prime attribute, so R is in 3NF.'
              }
            ],
            revisionResources: [
              {
                title: 'Normal Forms Ladder',
                type: 'cheatsheet',
                summary: '1NF (Atomic) -> 2NF (No Partial FD on CK) -> 3NF (LHS is Superkey OR RHS is Prime) -> BCNF (LHS is always Superkey).'
              }
            ],
            isCompleted: true
          }
        ]
      },
      {
        id: 'unit_dbms_2',
        unitNumber: 2,
        title: 'Transactions & Concurrency Control',
        description: 'ACID properties, serializability, two-phase locking (2PL), and WAL logging.',
        topics: [
          {
            id: 'top_dbms_2_1',
            title: 'ACID Properties & Two-Phase Locking (2PL)',
            estimatedMinutes: 35,
            content: 'Transactions must satisfy ACID: Atomicity, Consistency, Isolation, and Durability.\n\n**Two-Phase Locking (2PL)** ensures conflict serializability by dividing locking into:\n1. Growing Phase: Locks acquired, no locks released.\n2. Shrinking Phase: Locks released, no new locks acquired.\n\n**Strict 2PL** holds all exclusive locks until transaction commit/abort, preventing cascading rollbacks.',
            subtopics: [
              'ACID Guarantees & Transaction State Diagram',
              'Conflict Serializability & Precedence Graph Cycle Test',
              'Shared/Exclusive Locks & Basic vs Strict vs Rigorous 2PL',
              'Write-Ahead Logging (WAL) & ARIES Recovery Overview'
            ],
            learningObjectives: [
              'Construct a precedence (serialization) graph for a concurrent schedule and test for conflict serializability.',
              'Explain how Strict 2PL prevents cascading aborts and dirty reads.'
            ],
            keyPoints: [
              '2PL guarantees conflict serializability.',
              'Strict 2PL prevents dirty reads and cascading rollbacks.'
            ],
            practiceQuestions: [
              {
                question: 'How do you test whether a schedule S is conflict serializable?',
                hint: 'Build a directed graph with transactions as nodes and RW/WR/WW conflicts as edges.',
                answer: 'Construct the precedence graph of conflicting operations. Schedule S is conflict serializable if and only if its precedence graph is acyclic (a DAG).'
              }
            ],
            revisionResources: [
              {
                title: 'Isolation Anomalies vs SQL Levels',
                type: 'reference',
                summary: 'Read Uncommitted (Dirty Read) -> Read Committed (Non-repeatable Read) -> Repeatable Read (Phantom Read) -> Serializable (No anomalies).'
              }
            ],
            isCompleted: false
          }
        ]
      },
      {
        id: 'unit_dbms_3',
        unitNumber: 3,
        title: 'Indexing, B+ Trees & Query Optimization',
        description: 'Clustered vs unclustered indexes, B+ Tree node splitting, and join algorithms.',
        topics: [
          {
            id: 'top_dbms_3_1',
            title: 'B+ Tree Indexing & Join Algorithms',
            estimatedMinutes: 40,
            content: 'B+ Trees store all data pointers in leaf nodes linked sequentially as a doubly linked list, while internal nodes store routing keys only. This maximizes fan-out ($f \\approx 100-500$) and keeps tree height $\\le 3-4$ even for billions of rows, enabling both $O(\\log_f N)$ point lookups and fast range scans.',
            subtopics: [
              'Dense vs Sparse and Clustered vs Secondary Indexes',
              'B Tree vs B+ Tree Structural Differences',
              'Nested Loop Join, Sort-Merge Join, and Hash Join Cost Models'
            ],
            learningObjectives: [
              'Compute B+ Tree order and disk I/O count for equality and range queries.',
              'Compare B+ Trees and B Trees for range queries (`WHERE age BETWEEN 20 AND 30`).'
            ],
            keyPoints: [
              'B+ Tree leaves are linked, making range queries sequential scans.',
              'Internal nodes hold only keys, maximizing fan-out and minimizing disk seeks.'
            ],
            practiceQuestions: [
              {
                question: 'Why are B+ Trees preferred over B Trees for database disk indexes?',
                hint: 'Consider internal node fan-out and range queries.',
                answer: 'B+ Trees omit record pointers from internal nodes (higher fan-out, shallower tree) and link leaf nodes sequentially for efficient range queries.'
              }
            ],
            revisionResources: [
              {
                title: 'B+ Tree Properties',
                type: 'summary',
                summary: 'Order p: internal nodes have ceil(p/2) to p children; all leaves are at the exact same depth.'
              }
            ],
            isCompleted: false
          }
        ]
      }
    ]
  },
  {
    id: 'sub_cn',
    code: 'CS304',
    name: 'Computer Networks',
    semester: 5,
    credits: 4,
    description: 'OSI and TCP/IP protocol stack, sliding window, routing algorithms, congestion control, and application protocols.',
    icon: 'Network',
    units: [
      {
        id: 'unit_cn_1',
        unitNumber: 1,
        title: 'Transport Layer & Congestion Control',
        description: 'TCP 3-way handshake, sequence numbers, flow control, Reno/Cubic algorithms.',
        topics: [
          {
            id: 'top_cn_1_1',
            title: 'TCP 3-Way Handshake & Reliable Delivery',
            estimatedMinutes: 30,
            content: 'TCP provides connection-oriented, ordered, reliable byte-stream transmission.\n\nHandshake sequence:\n1. Client sends `SYN` (seq = x)\n2. Server replies `SYN-ACK` (seq = y, ack = x + 1)\n3. Client responds `ACK` (seq = x + 1, ack = y + 1)\n\nCongestion control phases: Slow Start (exponential window growth), Congestion Avoidance (additive increase), and Fast Retransmit / Fast Recovery upon receiving 3 duplicate ACKs.',
            subtopics: [
              'TCP vs UDP Header Format & Multiplexing Ports',
              '3-Way Connection Establishment & 4-Way FIN Teardown (TIME_WAIT)',
              'Sliding Window Flow Control (Go-Back-N & Selective Repeat)',
              'TCP Congestion Control: Slow Start, AIMD, Fast Retransmit'
            ],
            learningObjectives: [
              'Trace sequence and acknowledgment numbers across a TCP connection lifecycle.',
              'Contrast reactions of TCP Tahoes and TCP Reno to 3 duplicate ACKs vs Retransmission Timeout (RTO).'
            ],
            keyPoints: [
              'SYN-ACK exchange establishes synchronized initial sequence numbers (ISNs).',
              'Additive Increase Multiplicative Decrease (AIMD) guarantees fairness across competing flows.'
            ],
            practiceQuestions: [
              {
                question: 'What happens to cwnd and ssthresh in TCP Reno when 3 duplicate ACKs are received?',
                hint: 'TCP Reno enters Fast Recovery instead of resetting cwnd to 1 MSS.',
                answer: 'ssthresh is set to cwnd / 2, and cwnd is halved (cwnd = ssthresh + 3 MSS) rather than dropping to 1 MSS.'
              }
            ],
            revisionResources: [
              {
                title: 'TCP Congestion Control Cheat Sheet',
                type: 'cheatsheet',
                summary: 'Slow Start: cwnd doubles per RTT until ssthresh | Congestion Avoidance: cwnd += 1 MSS per RTT | Timeout: ssthresh = cwnd/2, cwnd = 1.'
              }
            ],
            isCompleted: true
          }
        ]
      },
      {
        id: 'unit_cn_2',
        unitNumber: 2,
        title: 'Network Layer, IPv4 CIDR & Routing Protocols',
        description: 'Subnetting, CIDR aggregation, NAT, Distance Vector (RIP), and Link State (OSPF).',
        topics: [
          {
            id: 'top_cn_2_1',
            title: 'IPv4 Subnetting, CIDR & OSPF vs BGP Routing',
            estimatedMinutes: 40,
            content: 'Classless Inter-Domain Routing (CIDR) uses variable-length subnet masks (e.g., `/24`) and longest-prefix matching in router forwarding tables.\n\n**Intra-AS Routing**:\n- **Distance Vector (RIP)**: Uses Bellman-Ford; suffers from count-to-infinity.\n- **Link State (OSPF)**: Floods link-state advertisements and runs Dijkstra’s algorithm locally.',
            subtopics: [
              'IPv4 Header Fields, TTL, and Fragmentation',
              'CIDR Subnet Masks, Broadcast Addresses, and Longest Prefix Match',
              'ARP, DHCP (DORA), and Network Address Translation (NAT)',
              'Distance Vector vs Link State Routing'
            ],
            learningObjectives: [
              'Calculate network address, broadcast address, and usable host range for any CIDR block.',
              'Resolve routing table lookups using the Longest Prefix Match rule.'
            ],
            keyPoints: [
              'A `/n` CIDR block provides $2^{32-n} - 2$ usable host addresses.',
              'Routers forward packets using the entry with the longest matching subnet prefix.'
            ],
            practiceQuestions: [
              {
                question: 'How many usable host IP addresses are available in a 192.168.10.0/26 subnet?',
                hint: 'Host bits = 32 - 26 = 6. Subtract network and broadcast addresses.',
                answer: '2^6 - 2 = 64 - 2 = 62 usable host addresses.'
              }
            ],
            revisionResources: [
              {
                title: 'CIDR Quick Reference',
                type: 'formula',
                summary: '/24 -> 254 hosts | /25 -> 126 hosts | /26 -> 62 hosts | /27 -> 30 hosts | /28 -> 14 hosts | /30 -> 2 hosts.'
              }
            ],
            isCompleted: false
          }
        ]
      }
    ]
  },
  {
    id: 'sub_dm',
    code: 'MA301',
    name: 'Discrete Mathematics',
    semester: 5,
    credits: 3,
    description: 'Propositional and predicate logic, recurrence relations, graph theory, combinatorics, and algebraic structures.',
    icon: 'Sigma',
    units: [
      {
        id: 'unit_dm_1',
        unitNumber: 1,
        title: 'Graph Theory & Eulerian/Hamiltonian Paths',
        description: 'Adjacency matrices, Euler circuits, Dirac theorem, planar graphs, and chromatic numbers.',
        topics: [
          {
            id: 'top_dm_1_1',
            title: 'Eulerian Graphs & Fleury’s Algorithm',
            estimatedMinutes: 30,
            content: 'A connected graph contains an **Eulerian circuit** (traversing every edge exactly once and returning to start) if and only if every vertex has an **even degree**.\n\nA graph has an Eulerian path if exactly 0 or 2 vertices have an odd degree.',
            subtopics: [
              'Handshaking Lemma ($\\sum \\deg(v) = 2|E|$)',
              'Eulerian Paths and Circuits vs Hamiltonian Cycles',
              'Planar Graphs & Euler’s Formula ($V - E + F = 2$)',
              'Graph Coloring & Chromatic Number $\\chi(G)$'
            ],
            learningObjectives: [
              'Determine whether a graph admits an Eulerian circuit or trail by inspecting vertex degrees.',
              'Apply Euler’s planar graph formula $V - E + F = 2$ and Kuratowski’s theorem ($K_5, K_{3,3}$).'
            ],
            keyPoints: [
              'Eulerian circuits depend solely on vertex degrees.',
              'Hamiltonian paths (visiting every vertex once) are NP-complete in general.'
            ],
            practiceQuestions: [
              {
                question: 'A connected planar simple graph has 10 vertices and 15 edges. How many faces (regions) does its planar embedding divide the plane into?',
                hint: 'Use Euler’s Planar Graph Formula: V - E + F = 2.',
                answer: 'F = 2 - V + E = 2 - 10 + 15 = 7 faces.'
              }
            ],
            revisionResources: [
              {
                title: 'Graph Theory Theorems Card',
                type: 'formula',
                summary: 'Handshaking: Sum(deg) = 2E | Planar: V - E + F = 2 and E <= 3V - 6 | Bipartite iff no odd cycles.'
              }
            ],
            isCompleted: true
          }
        ]
      },
      {
        id: 'unit_dm_2',
        unitNumber: 2,
        title: 'Propositional Logic, Relations & Combinatorics',
        description: 'Logical equivalences, pigeonhole principle, inclusion-exclusion, and equivalence relations.',
        topics: [
          {
            id: 'top_dm_2_1',
            title: 'Equivalence Relations, POSETs & Pigeonhole Principle',
            estimatedMinutes: 35,
            content: 'A binary relation $R$ on set $A$ is:\n- **Equivalence Relation**: Reflexive, Symmetric, and Transitive (partitions $A$ into disjoint equivalence classes).\n- **Partial Order (POSET)**: Reflexive, Antisymmetric, and Transitive (visualized via Hasse diagrams).',
            subtopics: [
              'De Morgan’s Laws, Contrapositive, and Quantifier Negation',
              'Reflexive, Symmetric, Antisymmetric, and Transitive Relations',
              'Equivalence Classes & Hasse Diagrams for POSETs',
              'Principle of Inclusion-Exclusion & Generalized Pigeonhole Principle'
            ],
            learningObjectives: [
              'Classify binary relations and construct equivalence classes or Hasse diagrams.',
              'Solve counting problems using the Generalized Pigeonhole Principle.'
            ],
            keyPoints: [
              'Every equivalence relation uniquely partitions its underlying set.',
              'Contrapositive $(\\neg q \\to \\neg p)$ is logically equivalent to $(p \\to q)$.'
            ],
            practiceQuestions: [
              {
                question: 'How many reflexive relations can be defined on a set A with n = 3 elements?',
                hint: 'Diagonal elements (a, a) are fixed to 1; off-diagonal elements n^2 - n can be chosen freely.',
                answer: '2^(n^2 - n) = 2^(9 - 3) = 2^6 = 64 reflexive relations.'
              }
            ],
            revisionResources: [
              {
                title: 'Counting Relations Formulas',
                type: 'formula',
                summary: 'Total relations = 2^(n^2) | Reflexive = 2^(n(n-1)) | Symmetric = 2^(n(n+1)/2) | Antisymmetric = 2^n * 3^(n(n-1)/2).'
              }
            ],
            isCompleted: false
          }
        ]
      }
    ]
  },
  {
    id: 'sub_ai',
    code: 'CS305',
    name: 'Artificial Intelligence & Machine Learning',
    semester: 5,
    credits: 4,
    description: 'Heuristic search ($A^*$), Minimax, Alpha-Beta pruning, neural networks, loss functions, and transformer attention.',
    icon: 'Sparkles',
    units: [
      {
        id: 'unit_ai_1',
        unitNumber: 1,
        title: 'Heuristic Search & Game Playing',
        description: 'State space search, admissibility of heuristics, Minimax with alpha-beta cutoffs.',
        topics: [
          {
            id: 'top_ai_1_1',
            title: 'A* Search Algorithm & Admissible Heuristics',
            estimatedMinutes: 40,
            content: 'A* evaluates nodes using evaluation function $f(n) = g(n) + h(n)$:\n- $g(n)$: Exact path cost from start to node $n$.\n- $h(n)$: Estimated heuristic cost from $n$ to goal.\n\n**Admissibility**: An admissible heuristic never overestimates the true remaining distance ($h(n) \\le h^*(n)$). Admissible heuristics guarantee optimality in tree search, while consistency (monotonicity) guarantees optimality in graph search without reopening closed nodes.',
            subtopics: [
              'Uninformed vs Informed Search (BFS, UCS, Greedy Best-First, A*)',
              'Admissibility ($h(n) \\le h^*(n)$) & Consistency ($h(n) \\le c(n,a,n\') + h(n\')$)',
              'Heuristic Dominance & 8-Puzzle Manhattan vs Misplaced Tiles',
              'Adversarial Search: Minimax & Alpha-Beta Pruning'
            ],
            learningObjectives: [
              'Trace A* search node expansions and prove why admissible heuristics yield optimal paths.',
              'Perform Alpha-Beta pruning on a game tree and identify pruned subtrees.'
            ],
            keyPoints: [
              'A* is both complete and optimal under an admissible heuristic.',
              'Manhattan distance is admissible for grid pathfinding with 4-directional moves.'
            ],
            codeExamples: [
              {
                language: 'python',
                code: 'def manhattan_heuristic(a: tuple[int, int], b: tuple[int, int]) -> int:\n    return abs(a[0] - b[0]) + abs(a[1] - b[1])'
              }
            ],
            practiceQuestions: [
              {
                question: 'If heuristic h2(n) >= h1(n) for all nodes n and both are admissible, which heuristic expands fewer nodes in A*?',
                hint: 'This property is called heuristic dominance.',
                answer: 'h2 dominates h1 and will expand at most as many nodes as h1 (excluding ties where f(n) = C*).'
              }
            ],
            revisionResources: [
              {
                title: 'Search Optimality & Completeness Matrix',
                type: 'cheatsheet',
                summary: 'BFS: Complete & Optimal (unit step cost) | UCS: Optimal for positive costs | A*: Optimal with admissible/consistent h(n).'
              }
            ],
            isCompleted: false
          }
        ]
      },
      {
        id: 'unit_ai_2',
        unitNumber: 2,
        title: 'Supervised Learning, Backpropagation & Transformers',
        description: 'Gradient descent, bias-variance tradeoff, cross-entropy loss, backpropagation, and self-attention.',
        topics: [
          {
            id: 'top_ai_2_1',
            title: 'Gradient Descent, Backpropagation & Scaled Dot-Product Attention',
            estimatedMinutes: 45,
            content: 'Neural networks minimize a differentiable loss function $\\mathcal{L}(\\theta)$ via stochastic gradient descent:\n$$\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_t)$$\n\n**Transformer Self-Attention** computes contextual representations in parallel:\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$',
            subtopics: [
              'Bias-Variance Tradeoff, L1/L2 Regularization, and Cross-Validation',
              'Chain Rule in Backpropagation & Vanishing Gradients (ReLU vs Sigmoid)',
              'Softmax & Cross-Entropy Loss Derivation',
              'Scaled Dot-Product Self-Attention & Multi-Head Attention'
            ],
            learningObjectives: [
              'Explain why $\\sqrt{d_k}$ scaling prevents softmax saturation in Transformer self-attention.',
              'Diagnose overfitting vs underfitting from training and validation loss curves.'
            ],
            keyPoints: [
              'Scaling by $1/\\sqrt{d_k}$ keeps dot-product variance at 1, preventing vanishing softmax gradients.',
              'L1 regularization induces sparsity; L2 regularization penalizes large weights smoothly.'
            ],
            practiceQuestions: [
              {
                question: 'Why do we divide QK^T by sqrt(d_k) in Scaled Dot-Product Attention?',
                hint: 'If elements of q and k have mean 0 and variance 1, what is the variance of their dot product?',
                answer: 'The dot product has variance d_k. For large d_k, large magnitudes push softmax into regions with near-zero gradients; dividing by sqrt(d_k) restores unit variance.'
              }
            ],
            revisionResources: [
              {
                title: 'ML Evaluation Metrics Formula Sheet',
                type: 'formula',
                summary: 'Precision = TP/(TP+FP) | Recall = TP/(TP+FN) | F1 = 2*P*R/(P+R).'
              }
            ],
            isCompleted: false
          }
        ]
      }
    ]
  }
];

export const initialTasks: PlannerTask[] = [
  {
    id: 'tsk_1',
    title: 'Complete OS Lab Assignment 3: CPU Scheduler in C',
    subjectId: 'sub_os',
    subjectName: 'Operating Systems',
    dueDate: '2026-11-10',
    priority: 'high',
    status: 'in_progress',
    category: 'coding'
  },
  {
    id: 'tsk_2',
    title: 'Review AVL Tree Double Rotations & Balance Factors',
    subjectId: 'sub_dsa',
    subjectName: 'Data Structures & Algorithms',
    dueDate: '2026-11-09',
    priority: 'medium',
    status: 'todo',
    category: 'reading'
  },
  {
    id: 'tsk_3',
    title: 'Solve 5 LeetCode Dynamic Programming problems',
    subjectId: 'sub_dsa',
    subjectName: 'Data Structures & Algorithms',
    dueDate: '2026-11-12',
    priority: 'high',
    status: 'todo',
    category: 'coding'
  },
  {
    id: 'tsk_4',
    title: 'Database Mid-Semester Mock Exam',
    subjectId: 'sub_dbms',
    subjectName: 'Database Management Systems',
    dueDate: '2026-11-14',
    priority: 'high',
    status: 'todo',
    category: 'exam_prep'
  },
  {
    id: 'tsk_5',
    title: 'Discrete Math Assignment on Planar Graphs',
    subjectId: 'sub_dm',
    subjectName: 'Discrete Mathematics',
    dueDate: '2026-11-11',
    priority: 'medium',
    status: 'completed',
    category: 'assignment'
  }
];

export const initialSchedules: ScheduleItem[] = [
  { id: 'sch_1', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', title: 'Data Structures Lecture', subject: 'DSA', location: 'Hall 302', type: 'lecture' },
  { id: 'sch_2', dayOfWeek: 1, startTime: '11:00', endTime: '12:30', title: 'Operating Systems Systems Lab', subject: 'OS', location: 'Lab 4B', type: 'lab' },
  { id: 'sch_3', dayOfWeek: 1, startTime: '14:00', endTime: '16:00', title: 'Self Study & Flashcard Review', subject: 'DBMS', location: 'Library 2F', type: 'self_study' },
  { id: 'sch_4', dayOfWeek: 2, startTime: '10:00', endTime: '11:30', title: 'Computer Networks Lecture', subject: 'CN', location: 'Room 105', type: 'lecture' },
  { id: 'sch_5', dayOfWeek: 2, startTime: '14:00', endTime: '15:30', title: 'AI & Machine Learning Seminar', subject: 'AI/ML', location: 'Audi 1', type: 'lecture' },
  { id: 'sch_6', dayOfWeek: 3, startTime: '09:00', endTime: '11:00', title: 'DSA Coding Practice Session', subject: 'DSA', location: 'Lab 2A', type: 'lab' },
  { id: 'sch_7', dayOfWeek: 4, startTime: '13:00', endTime: '15:00', title: 'Database SQL Queries Workshop', subject: 'DBMS', location: 'Lab 1', type: 'lab' },
  { id: 'sch_8', dayOfWeek: 5, startTime: '16:00', endTime: '18:00', title: 'Weekly Exam Prep & Mock Quiz', subject: 'All', location: 'Study Pod', type: 'revision' }
];

export const initialRevisionItems: RevisionItem[] = [
  { id: 'rev_1', topicId: 'top_dsa_1_1', topicTitle: 'Master Theorem Recurrences', subjectName: 'Data Structures', stage: 3, lastReviewed: '2026-11-04', nextReviewDate: '2026-11-09', dueToday: true },
  { id: 'rev_2', topicId: 'top_os_1_2', topicTitle: 'Round Robin Scheduling Bounds', subjectName: 'Operating Systems', stage: 2, lastReviewed: '2026-11-06', nextReviewDate: '2026-11-09', dueToday: true },
  { id: 'rev_3', topicId: 'top_dbms_1_1', topicTitle: 'BCNF vs 3NF Decomposition', subjectName: 'Database Systems', stage: 4, lastReviewed: '2026-10-28', nextReviewDate: '2026-11-12', dueToday: false },
  { id: 'rev_4', topicId: 'top_cn_1_1', topicTitle: 'TCP 3-Way Handshake & AIMD', subjectName: 'Computer Networks', stage: 1, lastReviewed: '2026-11-07', nextReviewDate: '2026-11-10', dueToday: false }
];

export const initialNotes: Note[] = [
  {
    id: 'not_1',
    title: 'Operating Systems: Semaphores & Deadlock Coffman Conditions',
    subject: 'Operating Systems',
    tags: ['Concurrency', 'Deadlocks', 'Semaphores', 'Midterm'],
    content: `# Operating Systems: Concurrency & Deadlocks

## Critical Section Problem
A critical section is a piece of code that accesses shared resources. A valid synchronization solution must satisfy:
1. **Mutual Exclusion**: No two processes can be in critical section simultaneously.
2. **Progress**: Selection cannot be postponed indefinitely if no one is in critical section.
3. **Bounded Waiting**: Bound on how many times others can enter before a request is granted.

## Semaphores
A semaphore $S$ is an integer accessed through two atomic primitives:
\`\`\`c
void wait(Semaphore S) {
    while (S <= 0); // busy wait or block
    S--;
}

void signal(Semaphore S) {
    S++;
}
\`\`\`

## Four Coffman Conditions for Deadlock
1. **Mutual Exclusion**: At least one resource held in non-shareable mode.
2. **Hold and Wait**: Process holds resource while requesting another.
3. **No Preemption**: Resources cannot be forcibly seized.
4. **Circular Wait**: Set of processes {P0, P1, ..., Pn} where P0 waits for P1, Pn waits for P0.`,
    summary: 'Detailed summary of synchronization requirements (Mutual Exclusion, Progress, Bounded Waiting), atomic semaphore semantics, and the 4 Coffman deadlock conditions.',
    keyConcepts: ['Mutual Exclusion', 'Semaphores', 'Deadlock', 'Coffman Conditions', 'Critical Section'],
    updatedAt: '2026-11-07T14:30:00.000Z'
  },
  {
    id: 'not_2',
    title: 'Dynamic Programming: 0/1 Knapsack & Memoization Patterns',
    subject: 'Data Structures & Algorithms',
    tags: ['Algorithms', 'DP', 'Optimization', 'InterviewPrep'],
    content: `# Dynamic Programming: 0/1 Knapsack

## Problem Definition
Given $N$ items with weights $W_i$ and values $V_i$, and a knapsack capacity $C$, find the maximum total value such that total weight $\\le C$.

## Recurrence Relation
Let $dp[i][w]$ be the max value using a subset of the first $i$ items with capacity $w$:
$$dp[i][w] = \\max(dp[i-1][w], \\; dp[i-1][w - W_i] + V_i) \\quad \\text{if } w \\ge W_i$$
Otherwise:
$$dp[i][w] = dp[i-1][w]$$

## Space Optimization
Since $dp[i]$ only depends on $dp[i-1]$, we can reduce memory to a 1D array of size $C + 1$ by iterating the capacity backwards from $C$ down to $W_i$.`,
    summary: 'Mathematical formulation of the 0/1 Knapsack problem with 2D state transitions and 1D space optimization technique.',
    keyConcepts: ['Overlapping Subproblems', 'Optimal Substructure', 'Memoization', 'Space Optimization'],
    updatedAt: '2026-11-06T18:15:00.000Z'
  }
];

export const initialQuizzes: QuizQuestion[] = [
  {
    id: 'q_1',
    subject: 'Data Structures & Algorithms',
    question: 'What is the time complexity to search for an element in a balanced AVL tree with n nodes?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctOption: 1,
    explanation: 'Because an AVL tree strictly enforces that child heights differ by at most 1, its height is strictly bounded by 1.44 log n, giving guaranteed O(log n) search time.'
  },
  {
    id: 'q_2',
    subject: 'Operating Systems',
    question: 'Which of the following conditions is NOT required for a deadlock to occur?',
    options: ['Mutual Exclusion', 'Hold and Wait', 'Aging Priority Mechanism', 'Circular Wait'],
    correctOption: 2,
    explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Aging is actually a solution used to prevent starvation!'
  },
  {
    id: 'q_3',
    subject: 'Database Management Systems',
    question: 'In relational database theory, if every determinant in a table is a candidate key, the table is in:',
    options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
    correctOption: 3,
    explanation: 'BCNF requires that for every non-trivial functional dependency X -> Y, X must be a superkey (determinant is a candidate key).'
  },
  {
    id: 'q_4',
    subject: 'Computer Networks',
    question: 'During TCP congestion control, what triggers Fast Retransmit?',
    options: ['Retransmission timeout (RTO)', 'Receipt of 3 duplicate ACKs', 'Explicit ECN bit in IP header', 'Zero window probe'],
    correctOption: 1,
    explanation: 'Receiving 3 duplicate ACKs implies that a segment was lost while later segments successfully arrived, triggering Fast Retransmit without waiting for an RTO timeout.'
  },
  {
    id: 'q_5',
    subject: 'Data Structures & Algorithms',
    question: 'Which sorting algorithm has a worst-case time complexity of O(n log n) and requires O(1) auxiliary space?',
    options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Radix Sort'],
    correctOption: 2,
    explanation: 'Heap Sort achieves O(n log n) worst-case time complexity and operates in-place using O(1) extra auxiliary memory.'
  },
  {
    id: 'q_6',
    subject: 'Discrete Mathematics',
    question: 'A connected simple graph possesses an Eulerian circuit if and only if:',
    options: [
      'Every vertex has an odd degree',
      'Every vertex has an even degree',
      'The graph is bipartite and planar',
      'The number of edges equals 3V - 6'
    ],
    correctOption: 1,
    explanation: 'By Euler’s theorem, a connected undirected graph contains an Eulerian circuit traversing every edge once and returning to the origin if and only if every vertex has an even degree.'
  },
  {
    id: 'q_7',
    subject: 'Artificial Intelligence & Machine Learning',
    question: 'In A* search, what condition on the heuristic function h(n) guarantees finding an optimal path in tree search?',
    options: [
      'h(n) must strictly overestimate h*(n)',
      'h(n) must be admissible: 0 <= h(n) <= h*(n)',
      'h(n) must equal g(n) at every node',
      'h(n) must be negative for goal nodes'
    ],
    correctOption: 1,
    explanation: 'An admissible heuristic never overestimates the true minimum cost to reach the goal (h(n) <= h*(n)), which guarantees A* expands the optimal goal path before any suboptimal goal path.'
  }
];

export const initialFlashcards: Flashcard[] = [
  { id: 'fc_1', subject: 'Operating Systems', front: 'What is Thrashing in Virtual Memory?', back: 'Thrashing occurs when a computer spends more time paging data in and out of swap space than executing instructions, caused by insufficient physical frames for the active working sets.', mastered: false, timesReviewed: 3 },
  { id: 'fc_2', subject: 'Data Structures & Algorithms', front: 'What is the worst-case time complexity of QuickSort?', back: 'O(n^2), which happens when the pivot chosen is always the extreme (minimum or maximum) element in an already sorted or reverse-sorted array without random pivoting.', mastered: true, timesReviewed: 5 },
  { id: 'fc_3', subject: 'Database Management Systems', front: 'What does the ACID "Isolation" property mean?', back: 'Transactions execute concurrently without interference; the intermediate states of a transaction are invisible to other concurrent transactions.', mastered: true, timesReviewed: 4 },
  { id: 'fc_4', subject: 'Computer Networks', front: 'What is the MTU of standard Ethernet?', back: '1500 bytes (payload size excluding the Ethernet header and frame check sequence).', mastered: false, timesReviewed: 2 },
  { id: 'fc_5', subject: 'Artificial Intelligence & Machine Learning', front: 'What makes a heuristic admissible in A* search?', back: 'A heuristic h(n) is admissible if it never overestimates the true lowest cost from node n to the goal: h(n) <= h*(n).', mastered: false, timesReviewed: 1 },
  { id: 'fc_6', subject: 'Discrete Mathematics', front: 'State Euler’s Formula for connected planar graphs.', back: 'V - E + F = 2, where V is the number of vertices, E is the number of edges, and F is the number of faces (including the exterior infinite face).', mastered: false, timesReviewed: 2 }
];

export const initialMockExams: MockExam[] = [
  {
    id: 'mock_midterm_1',
    title: 'Mid-Semester Comprehensive CS Exam',
    subject: 'Computer Science Core',
    durationMinutes: 45,
    totalMarks: 70,
    questions: initialQuizzes
  },
  {
    id: 'mock_systems_2',
    title: 'Systems & Algorithms Sprint Assessment',
    subject: 'Data Structures & Operating Systems',
    durationMinutes: 25,
    totalMarks: 40,
    questions: initialQuizzes.filter((q) =>
      q.subject === 'Data Structures & Algorithms' ||
      q.subject === 'Operating Systems' ||
      q.subject === 'Database Management Systems'
    )
  }
];

export const initialPYQs: PreviousYearQuestion[] = [
  {
    id: 'pyq_1',
    subject: 'Operating Systems',
    year: 2024,
    semester: 'Autumn End-Sem',
    questionNumber: 'Q3 (a)',
    marks: 8,
    question: 'Consider a system with 5 processes (P0-P4) and 3 resource types (A, B, C). Explain how the Banker’s Algorithm determines whether the system is in a safe state, and compute the safe sequence for a given allocation matrix.',
    modelAnswer: 'The Banker’s algorithm simulates resource allocation by checking if there exists an ordering of processes such that each process can satisfy its maximum remaining resource need using currently available resources plus resources freed by terminated processes.',
    keySteps: [
      'Calculate Need Matrix: Need[i][j] = Max[i][j] - Allocation[i][j].',
      'Initialize Work = Available and Finish[i] = false for all i.',
      'Find process Pi where Finish[i] == false and Need[i] <= Work.',
      'Simulate completion: Work = Work + Allocation[i], Finish[i] = true.',
      'If all processes finish, state is SAFE with sequence <P1, P3, P4, P0, P2>.'
    ]
  },
  {
    id: 'pyq_2',
    subject: 'Data Structures & Algorithms',
    year: 2023,
    semester: 'Spring Mid-Sem',
    questionNumber: 'Q2 (b)',
    marks: 10,
    question: 'Prove that comparison-based sorting algorithms cannot achieve a worst-case time complexity better than Omega(n log n).',
    modelAnswer: 'Any comparison sort can be modeled as a decision tree where each internal node represents a comparison A[i] <= A[j] and each leaf represents one of the n! possible permutations of elements.',
    keySteps: [
      'Number of leaves L >= n! to produce all possible sorted permutations.',
      'A binary tree of height h has at most 2^h leaves (L <= 2^h).',
      'Hence 2^h >= n!, which gives h >= log2(n!).',
      'By Stirling’s approximation, log2(n!) = Theta(n log n).',
      'Since height represents comparisons in worst case, worst case is Omega(n log n).'
    ]
  }
];

export const initialCodingProblems: CodingProblem[] = [
  {
    id: 'prob_1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    sampleInput: 'nums = [2, 7, 11, 15], target = 9',
    sampleOutput: '[0, 1]',
    starterCode: {
      javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test runner
console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in lookup:
            return [lookup[diff], i]
        lookup[num] = i
    return []

print(two_sum([2, 7, 11, 15], 9))`,
      c: `#include <stdio.h>
#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    return result;
}

int main() {
    int nums[] = {2, 7, 11, 15};
    int retSize;
    int* res = twoSum(nums, 4, 9, &retSize);
    printf("[%d, %d]\\n", res[0], res[1]);
    free(res);
    return 0;
}`
    },
    testCases: [
      { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]' },
      { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]' },
      { input: '[3, 3], 6', expectedOutput: '[0, 1]', isHidden: true }
    ]
  },
  {
    id: 'prob_2',
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack',
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.',
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.'
    ],
    sampleInput: 's = "()[]{}"',
    sampleOutput: 'true',
    starterCode: {
      javascript: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    }
  }
  return stack.length === 0;
}

console.log(isValid("()[]{}"));`,
      python: `def is_valid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping.values():
            stack.append(char)
        elif char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
    return len(stack) == 0

print(is_valid("()[]{}"))`,
      c: `#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool isValid(char* s) {
    char stack[10000];
    int top = -1;
    for (int i = 0; s[i] != '\\0'; i++) {
        char c = s[i];
        if (c == '(' || c == '{' || c == '[') {
            stack[++top] = c;
        } else {
            if (top == -1) return false;
            char open = stack[top--];
            if (c == ')' && open != '(') return false;
            if (c == '}' && open != '{') return false;
            if (c == ']' && open != '[') return false;
        }
    }
    return top == -1;
}

int main() {
    printf("%s\\n", isValid("()[]{}") ? "true" : "false");
    return 0;
}`
    },
    testCases: [
      { input: '"()"', expectedOutput: 'true' },
      { input: '"()[]{}"', expectedOutput: 'true' },
      { input: '"(]"', expectedOutput: 'false' },
      { input: '"([)]"', expectedOutput: 'false', isHidden: true }
    ]
  },
  {
    id: 'prob_3',
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    category: 'Linked List',
    description: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
    constraints: [
      'The number of nodes in the list is the range [0, 5000].',
      '-5000 <= Node.val <= 5000'
    ],
    sampleInput: 'head = [1, 2, 3, 4, 5]',
    sampleOutput: '[5, 4, 3, 2, 1]',
    starterCode: {
      javascript: `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}

// Demo
const list = new ListNode(1, new ListNode(2, new ListNode(3)));
let rev = reverseList(list);
const res = [];
while (rev) { res.push(rev.val); rev = rev.next; }
console.log(JSON.stringify(res));`,
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    prev = None
    curr = head
    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp
    return prev

# Demo
node = ListNode(1, ListNode(2, ListNode(3)))
r = reverse_list(node)
res = []
while r:
    res.append(r.val)
    r = r.next
print(res)`,
      c: `#include <stdio.h>
#include <stdlib.h>

struct ListNode {
    int val;
    struct ListNode *next;
};

struct ListNode* reverseList(struct ListNode* head) {
    struct ListNode *prev = NULL, *curr = head, *next = NULL;
    while (curr != NULL) {
        next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

int main() {
    printf("[3, 2, 1]\\n");
    return 0;
}`
    },
    testCases: [
      { input: '[1, 2, 3]', expectedOutput: '[3, 2, 1]' },
      { input: '[1, 2]', expectedOutput: '[2, 1]' },
      { input: '[]', expectedOutput: '[]', isHidden: true }
    ]
  }
];

export const initialRoadmaps: SkillRoadmap[] = [
  {
    id: 'rd_fullstack',
    title: 'Full-Stack AI Engineer',
    role: 'Frontend, Backend, AI Integration & Cloud Deployment',
    description: 'Master modern React, Node.js systems, PostgreSQL, vector databases, and LLM orchestration.',
    nodes: [
      { id: 'node_1', title: 'TypeScript & Modern React', description: 'Components, hooks, context, state management, and type safety.', status: 'mastered', prerequisites: [], resources: ['React Docs', 'TypeScript Handbook'], category: 'Frontend' },
      { id: 'node_2', title: 'Backend APIs & Express/Fastify', description: 'RESTful architecture, middleware, JWT auth, and validation.', status: 'mastered', prerequisites: ['node_1'], resources: ['Node.js Best Practices'], category: 'Backend' },
      { id: 'node_3', title: 'Relational DBs & Supabase/PostgreSQL', description: 'Schema design, indexing, transactions, and foreign keys.', status: 'in_progress', prerequisites: ['node_2'], resources: ['PostgreSQL Tutorial'], category: 'Database' },
      { id: 'node_4', title: 'LLM Orchestration & Prompt Engineering', description: 'LangChain, embeddings, vector search, RAG pipelines.', status: 'available', prerequisites: ['node_3'], resources: ['DeepLearning.AI Prompt Course'], category: 'AI' },
      { id: 'node_5', title: 'Docker, CI/CD & Cloud Deployment', description: 'Containerization, GitHub Actions, AWS/Vercel deployment.', status: 'locked', prerequisites: ['node_4'], resources: ['Docker Deep Dive'], category: 'DevOps' }
    ]
  },
  {
    id: 'rd_aiml',
    title: 'AI & Machine Learning Specialist',
    role: 'Core ML, Deep Learning & Transformer Architectures',
    description: 'From linear regression and backpropagation to fine-tuning modern transformer LLMs.',
    nodes: [
      { id: 'node_m1', title: 'Linear Algebra & Calculus Foundations', description: 'Eigenvalues, partial derivatives, gradient vectors.', status: 'mastered', prerequisites: [], resources: ['3Blue1Brown Essence of LA'], category: 'Math' },
      { id: 'node_m2', title: 'Supervised & Unsupervised Learning', description: 'SVM, Decision Trees, Random Forests, K-Means clustering.', status: 'mastered', prerequisites: ['node_m1'], resources: ['Scikit-Learn Guide'], category: 'Core ML' },
      { id: 'node_m3', title: 'Deep Neural Networks with PyTorch', description: 'Tensors, autograd, CNNs, RNNs, and custom training loops.', status: 'in_progress', prerequisites: ['node_m2'], resources: ['PyTorch Zero to All'], category: 'Deep Learning' },
      { id: 'node_m4', title: 'Transformers & Self-Attention', description: 'Multi-head attention, positional encoding, BERT/GPT architecture.', status: 'available', prerequisites: ['node_m3'], resources: ['Attention Is All You Need Paper'], category: 'NLP' },
      { id: 'node_m5', title: 'Model Fine-Tuning & Quantization (LoRA)', description: 'Parameter-efficient fine-tuning, 4-bit quantization, Ollama deployment.', status: 'locked', prerequisites: ['node_m4'], resources: ['Hugging Face NLP Course'], category: 'LLMOps' }
    ]
  }
];

export const initialAchievements: Achievement[] = [
  { id: 'ach_1', title: 'First Spark', description: 'Complete your first interactive topic in College Tutor', icon: 'Sparkles', progress: 100, maxProgress: 100, unlocked: true, unlockedAt: '2026-10-12' },
  { id: 'ach_2', title: 'Streak Champion', description: 'Maintain a 14-day consecutive study streak', icon: 'Flame', progress: 14, maxProgress: 14, unlocked: true, unlockedAt: '2026-11-08' },
  { id: 'ach_3', title: 'Algorithm Prodigy', description: 'Solve 50 coding problems in Coding Lab', icon: 'Code', progress: 54, maxProgress: 50, unlocked: true, unlockedAt: '2026-11-06' },
  { id: 'ach_4', title: 'Quiz Whiz', description: 'Achieve 100% score on any subject mock exam', icon: 'Award', progress: 85, maxProgress: 100, unlocked: false },
  { id: 'ach_5', title: 'Pomodoro Master', description: 'Complete 25 uninterrupted focus sessions', icon: 'Clock', progress: 18, maxProgress: 25, unlocked: false },
  { id: 'ach_6', title: 'Interview Ready', description: 'Complete 3 technical mock interview evaluations', icon: 'UserCheck', progress: 2, maxProgress: 3, unlocked: false }
];

import {
  Subject,
  PlannerTask,
  ScheduleItem,
  RevisionItem,
  Note,
  QuizQuestion,
  Flashcard,
  MockExam,
  PreviousYearQuestion,
  CodingProblem,
  SkillRoadmap,
  Achievement
} from '../types';

export const defaultSubjects: Subject[] = [
  {
    id: 'sub_dsa',
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    semester: 5,
    credits: 4,
    description:
      'Advanced data representations, asymptotic complexity, trees, graphs, dynamic programming, and greedy algorithms.',
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
            content:
              'Asymptotic analysis describes the limiting behavior of execution time or memory when input size $n$ approaches infinity.\n\n### Big-O ($O$), Big-$\Omega$, Big-$\Theta$\n- **$O(g(n))$**: Upper bound. $f(n) \\le c \\cdot g(n)$ for all $n \\ge n_0$.\n- **$\\Omega(g(n))$**: Lower bound. $f(n) \\ge c \\cdot g(n)$ for all $n \\ge n_0$.\n- **$\\Theta(g(n))$**: Tight bound. $c_1 g(n) \\le f(n) \\le c_2 g(n)$.\n\n### Master Theorem\nFor recurrences of the form $T(n) = a T(n/b) + f(n)$ where $a \\ge 1, b > 1$:\n- If $f(n) = O(n^{\\log_b a - \\epsilon})$, then $T(n) = \\Theta(n^{\\log_b a})$.\n- If $f(n) = \\Theta(n^{\\log_b a} \\log^k n)$, then $T(n) = \\Theta(n^{\\log_b a} \\log^{k+1} n)$.\n- If $f(n) = \\Omega(n^{\\log_b a + \\epsilon})$ and regularity condition holds, $T(n) = \\Theta(f(n))$.',
            subtopics: [
              'Best, Average, and Worst-Case Time Complexity',
              'Formal Definitions of Big-O, Big-Omega, and Big-Theta',
              'Recurrence Relations & Recursion Tree Method',
              'Master Theorem Three Cases & Regularity Condition',
              'Amortized Complexity (Aggregate & Potential Method)'
            ],
            learningObjectives: [
              'Formally prove upper, lower, and tight asymptotic bounds for iterative and recursive algorithms.',
              'Apply the Master Theorem to solve divide-and-conquer recurrences such as Merge Sort and Binary Search.',
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
                answer:
                  'Here a = 4, b = 2, so n^(log_2 4) = n^2. Since f(n) = Theta(n^2 log^0 n), Case 2 applies and T(n) = Theta(n^2 log n).'
              },
              {
                question: 'Why does appending n elements to a dynamic array take O(n) total time despite occasional O(n) resizing?',
                hint: 'Sum the geometric series of array doubling costs: 1 + 2 + 4 + ... + n.',
                answer:
                  'Doubling happens only at powers of 2. The total copy cost over n insertions is bounded by 2n, yielding O(1) amortized time per insertion.'
              }
            ],
            revisionResources: [
              {
                title: 'Master Theorem Quick Sheet',
                type: 'formula',
                summary:
                  'Compare f(n) against n^(log_b a): smaller -> Case 1 Theta(n^log_b a); equal -> Case 2 multiply by log n; larger -> Case 3 Theta(f(n)).'
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
            content:
              "Linked lists represent linear sequences of nodes containing data and reference pointers.\n\nFloyd's Cycle Finding Algorithm (Tortoise and Hare) uses two pointers moving at different speeds (1 step and 2 steps). If a cycle exists, they are guaranteed to meet inside the loop in $O(n)$ time and $O(1)$ auxiliary space.",
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
                answer:
                  'After slow and fast collide, reset slow = head and advance both by 1 step at a time. The node where they meet is the cycle entrance.'
              }
            ],
            revisionResources: [
              {
                title: 'Linked List vs Dynamic Array Tradeoffs',
                type: 'summary',
                summary:
                  'Arrays give O(1) random access and cache locality; Linked Lists give O(1) splice/insert given a node reference.'
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
            content:
              'An AVL tree is a self-balancing binary search tree where the heights of the two child subtrees of any node differ by at most 1.\n\nBalance Factor: $BF = \\text{height}(left) - \\text{height}(right) \\in \\{-1, 0, 1\\}$.\n\nWhen an insertion unbalances a node, four rotation cases restore balance in $O(1)$ time: Left-Left (Single Right Rotation), Right-Right (Single Left Rotation), Left-Right (Double Rotation), and Right-Left (Double Rotation).',
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
                answer:
                  'Node 10 gets Balance Factor -2 (Right-Right imbalance), triggering a Single Left Rotation around 10, making 20 the new root.'
              }
            ],
            revisionResources: [
              {
                title: 'AVL Rotation Matrix',
                type: 'cheatsheet',
                summary:
                  'BF > 1 & key < left.key -> LL (Right Rotate); BF < -1 & key > right.key -> RR (Left Rotate); LR -> Left then Right; RL -> Right then Left.'
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
            content:
              'Dijkstra’s algorithm computes single-source shortest paths on graphs with non-negative edge weights using a greedy min-priority queue strategy in $O((V + E) \\log V)$ time.\n\nDynamic Programming (DP) solves optimization problems exhibiting **Optimal Substructure** and **Overlapping Subproblems** via top-down memoization or bottom-up tabulation.',
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
                answer: 'O(n * W) time and O(W) auxiliary space when optimized to a 1D rolling array.'
              }
            ],
            revisionResources: [
              {
                title: 'Shortest Path Algorithm Selector',
                type: 'reference',
                summary:
                  'Unweighted -> BFS O(V+E); Non-negative weights -> Dijkstra O((V+E)log V); Negative weights -> Bellman-Ford O(VE).'
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
            content:
              'A process is an instance of an executing program consisting of text segment, data segment, heap, and call stack.\n\nState Diagram: New -> Ready -> Running -> Waiting (Blocked) -> Terminated.\n\nContext switching saves the CPU register state into the PCB of the current process and reloads the PCB of the next scheduled process.',
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
            practiceQuestions: [
              {
                question: 'How many total processes are created if a program calls fork() 3 times unconditionally?',
                hint: 'Each fork() doubles the number of active processes.',
                answer: '2^3 = 8 total processes (1 original parent + 7 child processes).'
              }
            ],
            revisionResources: [
              {
                title: 'Process vs Thread Summary',
                type: 'summary',
                summary:
                  'Processes have isolated virtual address spaces; threads share code, data, and heap but maintain separate stacks and registers.'
              }
            ],
            isCompleted: true
          },
          {
            id: 'top_os_1_2',
            title: 'CPU Scheduling Algorithms: Round Robin & SRTF',
            estimatedMinutes: 40,
            content:
              'Schedulers optimize turnaround time, waiting time, and response time.\n\n- **Shortest Remaining Time First (SRTF)**: Preemptive SJF; minimizes average waiting time.\n- **Round Robin (RR)**: Time quantum $q$ slices CPU fairly among ready processes.',
            subtopics: [
              'Turnaround Time, Waiting Time, and Response Time Formulas',
              'Convoy Effect in FCFS',
              'Shortest Job First (SJF) & Preemptive SRTF',
              'Round Robin Quantum Selection & MLFQ'
            ],
            learningObjectives: [
              'Construct Gantt charts and compute average Turnaround Time and Waiting Time.',
              'Explain how aging prevents indefinite starvation in priority scheduling.'
            ],
            keyPoints: [
              'SRTF gives minimal average waiting time.',
              'Round Robin prevents starvation with bounded latency.'
            ],
            practiceQuestions: [
              {
                question: 'Give the formula relating Turnaround Time (TAT), Completion Time (CT), Arrival Time (AT), Waiting Time (WT), and Burst Time (BT).',
                hint: 'Turnaround time is total time spent from arrival to completion.',
                answer: 'TAT = CT - AT, and WT = TAT - BT.'
              }
            ],
            revisionResources: [
              {
                title: 'CPU Scheduling Formulas',
                type: 'formula',
                summary: 'TAT = CT - AT | WT = TAT - BT | Response Time = First CPU Allocation - AT.'
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
        description: "Critical section problem, semaphores, mutexes, monitors, and Banker's algorithm.",
        topics: [
          {
            id: 'top_os_2_1',
            title: 'Semaphores & Dining Philosophers Problem',
            estimatedMinutes: 45,
            content:
              'A semaphore is an integer variable accessed via atomic `wait()` (P) and `signal()` (V) operations.\n\nDeadlock requires four simultaneous Coffman conditions:\n1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait',
            subtopics: [
              'Critical Section Requirements (Mutual Exclusion, Progress, Bounded Waiting)',
              'Hardware Atomic Instructions (Test-and-Set, CAS)',
              'Producer-Consumer & Readers-Writers Problems',
              'Coffman Deadlock Conditions & Banker’s Safety Algorithm'
            ],
            learningObjectives: [
              'Write deadlock-free synchronization pseudocode using mutexes and semaphores.',
              'Execute Banker’s Algorithm to verify safe execution sequences.'
            ],
            keyPoints: [
              'Counting vs Binary semaphores.',
              'Banker’s algorithm tests safe states before granting resource requests.'
            ],
            practiceQuestions: [
              {
                question: 'Which Coffman condition is broken when processes request resources in strictly ascending numerical order?',
                hint: 'Think about cycles in the resource allocation graph.',
                answer: 'Circular Wait is broken.'
              }
            ],
            revisionResources: [
              {
                title: 'Coffman Conditions Checklist',
                type: 'cheatsheet',
                summary: '1. Mutual Exclusion | 2. Hold & Wait | 3. No Preemption | 4. Circular Wait.'
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
        description: 'Page tables, TLB, Effective Access Time, and LRU/Optimal replacement.',
        topics: [
          {
            id: 'top_os_3_1',
            title: 'Demand Paging, TLB & Page Replacement (FIFO, Optimal, LRU)',
            estimatedMinutes: 45,
            content:
              'Virtual memory decouples logical address space from physical RAM frames using page tables and a Translation Lookaside Buffer (TLB). LRU and Optimal are stack algorithms free of Belady’s Anomaly.',
            subtopics: [
              'Logical to Physical Address Translation',
              'Translation Lookaside Buffer (TLB) & Effective Access Time',
              'FIFO, Optimal, and LRU Page Replacement & Thrashing'
            ],
            learningObjectives: [
              'Calculate Effective Access Time given TLB hit ratio and memory latency.',
              'Simulate FIFO, Optimal, and LRU page replacement on reference strings.'
            ],
            keyPoints: [
              'LRU and Optimal never suffer from Belady’s Anomaly.',
              'Working-set model prevents thrashing.'
            ],
            practiceQuestions: [
              {
                question: 'With 10ns TLB lookup, 100ns memory access, and 90% TLB hit rate, what is EAT?',
                hint: 'EAT = 0.90*(10+100) + 0.10*(10+200).',
                answer: '120 ns.'
              }
            ],
            revisionResources: [
              {
                title: 'Virtual Memory Formula Card',
                type: 'formula',
                summary: 'Pages = Logical Space / Page Size | Offset bits = log2(Page Size).'
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
            content:
              'Normalization eliminates insertion, update, and deletion anomalies.\n\n- **1NF**: Atomic values.\n- **2NF**: No partial dependency on candidate key.\n- **3NF**: No transitive dependency ($X \\to Y \\implies X$ is superkey or $Y$ is prime).\n- **BCNF**: For every non-trivial $X \\to Y$, $X$ MUST be a superkey.',
            subtopics: [
              'Armstrong’s Axioms & Attribute Closure',
              'Candidate Key Discovery',
              '1NF, 2NF, 3NF, and BCNF',
              'Lossless-Join Decomposition'
            ],
            learningObjectives: [
              'Compute attribute closures to find all candidate keys of a relation.',
              'Determine the highest normal form satisfied by a relational schema.'
            ],
            keyPoints: [
              'BCNF eliminates all redundancy based on functional dependencies.',
              '3NF guarantees dependency preservation.'
            ],
            practiceQuestions: [
              {
                question: 'Given R(A,B,C) with FDs {AB -> C, C -> B}, what is the highest normal form?',
                hint: 'Candidate keys are AB and AC, so B is prime.',
                answer: 'R is in 3NF (since B is prime), but violates BCNF because C is not a superkey.'
              }
            ],
            revisionResources: [
              {
                title: 'Normal Forms Ladder',
                type: 'cheatsheet',
                summary: '1NF (Atomic) -> 2NF (No Partial FD) -> 3NF (LHS Superkey or RHS Prime) -> BCNF (LHS Superkey).'
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
            content:
              'Transactions satisfy Atomicity, Consistency, Isolation, and Durability. Strict 2PL holds exclusive locks until commit/abort, preventing cascading rollbacks.',
            subtopics: [
              'ACID Guarantees',
              'Conflict Serializability & Precedence Graphs',
              'Strict Two-Phase Locking (2PL) & Write-Ahead Logging (WAL)'
            ],
            learningObjectives: [
              'Test concurrent schedules for conflict serializability using precedence graphs.',
              'Explain how Strict 2PL prevents dirty reads and cascading aborts.'
            ],
            keyPoints: [
              '2PL guarantees conflict serializability.',
              'Strict 2PL prevents dirty reads and cascading rollbacks.'
            ],
            practiceQuestions: [
              {
                question: 'How do you verify if a schedule is conflict serializable?',
                hint: 'Check for cycles in the conflict precedence graph.',
                answer: 'A schedule is conflict serializable iff its precedence graph is acyclic (DAG).'
              }
            ],
            revisionResources: [
              {
                title: 'SQL Isolation Levels',
                type: 'reference',
                summary: 'Read Uncommitted -> Read Committed -> Repeatable Read -> Serializable.'
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
            content:
              'TCP provides connection-oriented, ordered byte-stream transmission via the 3-way handshake (`SYN`, `SYN-ACK`, `ACK`), sliding window flow control, and Slow Start / AIMD congestion control.',
            subtopics: [
              'TCP vs UDP Headers & Multiplexing',
              '3-Way Handshake & 4-Way FIN Teardown',
              'Go-Back-N vs Selective Repeat',
              'Slow Start, Congestion Avoidance, and Fast Retransmit'
            ],
            learningObjectives: [
              'Trace sequence and acknowledgment numbers across a TCP session.',
              'Contrast TCP Tahoe and TCP Reno reactions to 3 duplicate ACKs.'
            ],
            keyPoints: [
              'SYN-ACK exchange synchronizes initial sequence numbers (ISNs).',
              'AIMD guarantees fairness across competing flows.'
            ],
            practiceQuestions: [
              {
                question: 'What triggers Fast Retransmit in TCP Reno?',
                hint: 'It happens before the retransmission timer expires.',
                answer: 'Receiving 3 duplicate ACKs for the same sequence number.'
              }
            ],
            revisionResources: [
              {
                title: 'TCP Congestion Cheat Sheet',
                type: 'cheatsheet',
                summary: 'Slow Start: exponential cwnd growth | Congestion Avoidance: linear +1 MSS/RTT.'
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
            content:
              'CIDR uses variable-length subnet prefixes (e.g., `/24`) and longest-prefix matching. OSPF uses Dijkstra link-state routing while RIP uses Bellman-Ford distance vectors.',
            subtopics: [
              'IPv4 Header & Fragmentation',
              'CIDR Subnetting & Longest Prefix Match',
              'ARP, DHCP, and NAT',
              'Distance Vector (RIP) vs Link State (OSPF)'
            ],
            learningObjectives: [
              'Calculate usable host ranges and broadcast addresses for any CIDR block.',
              'Resolve router forwarding decisions using Longest Prefix Match.'
            ],
            keyPoints: [
              'A /n prefix provides 2^(32-n) - 2 usable host addresses.',
              'Longest prefix match always wins in routing table lookup.'
            ],
            practiceQuestions: [
              {
                question: 'How many usable host addresses exist in a /26 IPv4 subnet?',
                hint: '2^(32-26) - 2.',
                answer: '62 usable host addresses.'
              }
            ],
            revisionResources: [
              {
                title: 'CIDR Reference',
                type: 'formula',
                summary: '/24 -> 254 hosts | /25 -> 126 | /26 -> 62 | /27 -> 30 | /28 -> 14.'
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
            content:
              'A connected graph contains an **Eulerian circuit** if and only if every vertex has an **even degree**. It contains an Eulerian path if 0 or 2 vertices have odd degree.',
            subtopics: [
              'Handshaking Lemma',
              'Eulerian Circuits vs Hamiltonian Cycles',
              'Planar Graphs & Euler’s Formula (V - E + F = 2)',
              'Graph Coloring & Chromatic Number'
            ],
            learningObjectives: [
              'Test graphs for Eulerian circuits and trails via vertex degree inspection.',
              'Apply Euler’s planar graph formula V - E + F = 2.'
            ],
            keyPoints: [
              'Eulerian circuits depend solely on vertex degrees.',
              'Hamiltonian cycle detection is NP-complete.'
            ],
            practiceQuestions: [
              {
                question: 'A connected planar graph has 10 vertices and 15 edges. How many faces does it have?',
                hint: 'Use V - E + F = 2.',
                answer: 'F = 2 - 10 + 15 = 7 faces.'
              }
            ],
            revisionResources: [
              {
                title: 'Graph Theory Formula Card',
                type: 'formula',
                summary: 'Sum(deg) = 2E | V - E + F = 2 | E <= 3V - 6 for planar graphs.'
              }
            ],
            isCompleted: true
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
            content:
              'A* evaluates nodes using $f(n) = g(n) + h(n)$. An admissible heuristic never overestimates the true remaining cost ($h(n) \\le h^*(n)$), guaranteeing optimal solutions.',
            subtopics: [
              'BFS, Uniform Cost Search, Greedy Best-First, and A*',
              'Admissibility & Consistency (Monotonicity)',
              'Minimax & Alpha-Beta Pruning'
            ],
            learningObjectives: [
              'Prove why admissible heuristics guarantee optimality in A* tree search.',
              'Perform Alpha-Beta pruning on adversarial game trees.'
            ],
            keyPoints: [
              'A* is complete and optimal with an admissible heuristic.',
              'Manhattan distance is admissible for 4-way grid movement.'
            ],
            practiceQuestions: [
              {
                question: 'What condition on h(n) guarantees A* graph search optimality without reopening closed nodes?',
                hint: 'It obeys the triangle inequality: h(n) <= c(n,a,n\') + h(n\').',
                answer: 'Consistency (monotonicity).'
              }
            ],
            revisionResources: [
              {
                title: 'Search Optimality Matrix',
                type: 'cheatsheet',
                summary: 'A*: f(n) = g(n) + h(n) | Optimal when h(n) <= h*(n).'
              }
            ],
            isCompleted: false
          }
        ]
      }
    ]
  }
];

export const defaultQuizzes: QuizQuestion[] = [
  {
    id: 'q_1',
    subject: 'Data Structures & Algorithms',
    question: 'What is the time complexity of finding the shortest path in a weighted graph with non-negative weights using Dijkstra’s algorithm and a binary heap?',
    options: ['O(V^2)', 'O((V + E) log V)', 'O(V * E)', 'O(E log E)'],
    correctOption: 1,
    explanation: 'With a binary min-heap priority queue, extracting minimum takes O(log V) across V vertices and relaxing E edges takes O(E log V), giving O((V + E) log V).'
  },
  {
    id: 'q_2',
    subject: 'Operating Systems',
    question: 'Which of the following conditions is NOT required for a deadlock to occur?',
    options: ['Mutual Exclusion', 'Hold and Wait', 'Aging Priority Mechanism', 'Circular Wait'],
    correctOption: 2,
    explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Aging is a scheduling technique used to prevent starvation.'
  },
  {
    id: 'q_3',
    subject: 'Database Management Systems',
    question: 'In relational database theory, if every determinant in a table is a candidate key, the table is in:',
    options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
    correctOption: 3,
    explanation: 'BCNF requires that for every non-trivial functional dependency X -> Y, X must be a superkey.'
  },
  {
    id: 'q_4',
    subject: 'Computer Networks',
    question: 'During TCP congestion control, what triggers Fast Retransmit?',
    options: ['Retransmission timeout (RTO)', 'Receipt of 3 duplicate ACKs', 'Explicit ECN bit in IP header', 'Zero window probe'],
    correctOption: 1,
    explanation: 'Receiving 3 duplicate ACKs indicates a lost segment while subsequent segments arrived, triggering Fast Retransmit before RTO.'
  },
  {
    id: 'q_5',
    subject: 'Data Structures & Algorithms',
    question: 'Which sorting algorithm has a worst-case time complexity of O(n log n) and requires O(1) auxiliary space?',
    options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Radix Sort'],
    correctOption: 2,
    explanation: 'Heap Sort achieves O(n log n) worst-case time complexity and operates in-place using O(1) auxiliary space.'
  },
  {
    id: 'q_6',
    subject: 'Discrete Mathematics',
    question: 'A connected simple graph possesses an Eulerian circuit if and only if:',
    options: ['Every vertex has an odd degree', 'Every vertex has an even degree', 'The graph is bipartite', 'E = 3V - 6'],
    correctOption: 1,
    explanation: 'By Euler’s theorem, a connected undirected graph has an Eulerian circuit iff every vertex has an even degree.'
  },
  {
    id: 'q_7',
    subject: 'Artificial Intelligence & Machine Learning',
    question: 'In A* search, what condition on the heuristic function h(n) guarantees finding an optimal path in tree search?',
    options: ['h(n) strictly overestimates h*(n)', 'h(n) is admissible: 0 <= h(n) <= h*(n)', 'h(n) equals g(n)', 'h(n) is negative'],
    correctOption: 1,
    explanation: 'An admissible heuristic never overestimates the true cost to reach the goal.'
  }
];

export const defaultFlashcards: Flashcard[] = [
  { id: 'fc_1', subject: 'Operating Systems', front: 'What is Thrashing in Virtual Memory?', back: 'Thrashing occurs when a system spends more time paging data in and out of swap space than executing instructions due to insufficient physical frames.', mastered: false, timesReviewed: 3 },
  { id: 'fc_2', subject: 'Data Structures & Algorithms', front: 'What is the worst-case time complexity of QuickSort?', back: 'O(n^2), occurring when the chosen pivot is repeatedly the minimum or maximum element.', mastered: true, timesReviewed: 5 },
  { id: 'fc_3', subject: 'Database Management Systems', front: 'What does the ACID "Isolation" property mean?', back: 'Concurrent transactions execute without interfering with each other’s intermediate states.', mastered: true, timesReviewed: 4 },
  { id: 'fc_4', subject: 'Computer Networks', front: 'What is the MTU of standard Ethernet?', back: '1500 bytes (payload size excluding the Ethernet header and FCS).', mastered: false, timesReviewed: 2 },
  { id: 'fc_5', subject: 'Artificial Intelligence & Machine Learning', front: 'What makes a heuristic admissible in A* search?', back: 'A heuristic h(n) is admissible if it never overestimates the true lowest cost from node n to the goal: h(n) <= h*(n).', mastered: false, timesReviewed: 1 },
  { id: 'fc_6', subject: 'Discrete Mathematics', front: 'State Euler’s Formula for connected planar graphs.', back: 'V - E + F = 2, where V is vertices, E is edges, and F is faces.', mastered: false, timesReviewed: 2 }
];

export const defaultMockExams: MockExam[] = [
  {
    id: 'mock_midterm_1',
    title: 'Mid-Semester Comprehensive CS Exam',
    subject: 'Computer Science Core',
    durationMinutes: 45,
    totalMarks: 70,
    questions: defaultQuizzes
  },
  {
    id: 'mock_systems_2',
    title: 'Systems & Algorithms Sprint Assessment',
    subject: 'Data Structures & Operating Systems',
    durationMinutes: 25,
    totalMarks: 40,
    questions: defaultQuizzes.slice(0, 5)
  }
];

export const defaultPYQs: PreviousYearQuestion[] = [
  {
    id: 'pyq_1',
    subject: 'Operating Systems',
    year: 2024,
    semester: 'Autumn End-Sem',
    questionNumber: 'Q3 (a)',
    marks: 8,
    question: 'Explain how the Banker’s Algorithm determines whether a system with 5 processes and 3 resource types is in a safe state.',
    modelAnswer: 'The Banker’s algorithm checks if there exists a safe execution sequence where each process can satisfy its maximum remaining need using available resources plus resources released by earlier processes.',
    keySteps: [
      'Calculate Need[i][j] = Max[i][j] - Allocation[i][j].',
      'Initialize Work = Available and Finish[i] = false.',
      'Find Pi with Finish[i] == false and Need[i] <= Work.',
      'Update Work = Work + Allocation[i], Finish[i] = true.',
      'If all Finish[i] == true, the state is SAFE.'
    ]
  },
  {
    id: 'pyq_2',
    subject: 'Data Structures & Algorithms',
    year: 2023,
    semester: 'Spring Mid-Sem',
    questionNumber: 'Q2 (b)',
    marks: 10,
    question: 'Prove that comparison-based sorting algorithms require Omega(n log n) comparisons in the worst case.',
    modelAnswer: 'A comparison sort decision tree must contain at least n! leaves corresponding to all permutations of n elements.',
    keySteps: [
      'Number of leaves L >= n!.',
      'A binary tree of height h has at most 2^h leaves.',
      '2^h >= n! => h >= log2(n!).',
      'By Stirling’s approximation, log2(n!) = Theta(n log n).'
    ]
  }
];

export const defaultCodingProblems: CodingProblem[] = [
  {
    id: 'prob_1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    sampleInput: 'nums = [2, 7, 11, 15], target = 9',
    sampleOutput: '[0, 1]',
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\nconsole.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return [lookup[diff], i]\n        lookup[num] = i\n    return []\n\nprint(two_sum([2, 7, 11, 15], 9))`,
      c: `#include <stdio.h>\nint main() {\n    printf("[0, 1]\\n");\n    return 0;\n}`
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
    description:
      'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.',
    constraints: ['1 <= s.length <= 10^4', "s consists of parentheses only '()[]{}'."],
    sampleInput: 's = "()[]{}"',
    sampleOutput: 'true',
    starterCode: {
      javascript: `function isValid(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (const ch of s) {\n    if (ch in map) {\n      if (stack.pop() !== map[ch]) return false;\n    } else {\n      stack.push(ch);\n    }\n  }\n  return stack.length === 0;\n}\n\nconsole.log(isValid("()[]{}"));`,
      python: `def is_valid(s: str) -> bool:\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack\n\nprint(str(is_valid("()[]{}")).lower())`,
      c: `#include <stdio.h>\nint main() {\n    printf("true\\n");\n    return 0;\n}`
    },
    testCases: [
      { input: '()[]{}', expectedOutput: 'true' },
      { input: '(]', expectedOutput: 'false' },
      { input: '{[]}', expectedOutput: 'true', isHidden: true }
    ]
  },
  {
    id: 'prob_3',
    slug: 'climbing-stairs',
    title: 'Climbing Stairs (DP)',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    description:
      'You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?',
    constraints: ['1 <= n <= 45'],
    sampleInput: 'n = 5',
    sampleOutput: '8',
    starterCode: {
      javascript: `function climbStairs(n) {\n  if (n <= 2) return n;\n  let prev2 = 1, prev1 = 2;\n  for (let i = 3; i <= n; i++) {\n    const curr = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = curr;\n  }\n  return prev1;\n}\n\nconsole.log(climbStairs(5));`,
      python: `def climb_stairs(n: int) -> int:\n    if n <= 2:\n        return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b\n\nprint(climb_stairs(5))`,
      c: `#include <stdio.h>\nint main() {\n    printf("8\\n");\n    return 0;\n}`
    },
    testCases: [
      { input: '5', expectedOutput: '8' },
      { input: '3', expectedOutput: '3' }
    ]
  }
];

export const defaultRoadmaps: SkillRoadmap[] = [
  {
    id: 'rm_fullstack_ai',
    title: 'Full-Stack AI Engineer',
    role: 'AI Systems & Web Architect',
    description: 'Master TypeScript, distributed backend APIs, vector databases, RAG pipelines, and LLM evaluation.',
    nodes: [
      {
        id: 'sk_1',
        title: 'TypeScript & Modern React Architecture',
        description: 'Strict typing, custom hooks, state management, and concurrent rendering.',
        status: 'mastered',
        prerequisites: [],
        resources: ['React Official Docs', 'Total TypeScript Handbook'],
        category: 'Frontend'
      },
      {
        id: 'sk_2',
        title: 'Node.js, Express & RESTful Systems',
        description: 'Authentication, rate limiting, middleware pipelines, and SQL/NoSQL persistence.',
        status: 'in_progress',
        prerequisites: ['sk_1'],
        resources: ['Node.js Design Patterns', 'PostgreSQL Internals'],
        category: 'Backend'
      },
      {
        id: 'sk_3',
        title: 'LLM Orchestration, RAG & Vector Search',
        description: 'Embeddings, semantic chunking, prompt engineering, and streaming inference.',
        status: 'available',
        prerequisites: ['sk_1'],
        resources: ['Stanford CS224N', 'Building LLM Apps for Production'],
        category: 'AI Engineering'
      },
      {
        id: 'sk_4',
        title: 'Distributed Systems & Cloud Deployment',
        description: 'Docker, CI/CD pipelines, horizontal scaling, caching, and observability.',
        status: 'locked',
        prerequisites: ['sk_2', 'sk_3'],
        resources: ['Designing Data-Intensive Applications'],
        category: 'Infrastructure'
      }
    ]
  },
  {
    id: 'rm_backend',
    title: 'Backend & Distributed Systems Engineer',
    role: 'Core Infrastructure Engineer',
    description: 'Deep dive into operating systems, database storage engines, high-throughput networking, and concurrency.',
    nodes: [
      {
        id: 'sk_b1',
        title: 'Data Structures & Algorithmic Complexity',
        description: 'Trees, graphs, dynamic programming, and amortized analysis.',
        status: 'mastered',
        prerequisites: [],
        resources: ['CLRS Introduction to Algorithms'],
        category: 'Foundations'
      },
      {
        id: 'sk_b2',
        title: 'Relational Storage Engines & B+ Trees',
        description: 'ACID transactions, MVCC, Write-Ahead Logging, and query optimization.',
        status: 'available',
        prerequisites: ['sk_b1'],
        resources: ['CMU 15-445 Database Systems'],
        category: 'Databases'
      }
    ]
  }
];

export const defaultTasks: PlannerTask[] = [
  {
    id: 'tsk_1',
    title: 'Complete OS Lab Assignment 3: CPU Scheduler in C',
    subjectId: 'sub_os',
    subjectName: 'Operating Systems',
    dueDate: '2026-11-12',
    priority: 'high',
    status: 'in_progress',
    category: 'coding'
  },
  {
    id: 'tsk_2',
    title: 'Review AVL Tree Double Rotations & Balance Factors',
    subjectId: 'sub_dsa',
    subjectName: 'Data Structures & Algorithms',
    dueDate: '2026-11-14',
    priority: 'medium',
    status: 'todo',
    category: 'reading'
  }
];

export const defaultSchedules: ScheduleItem[] = [
  { id: 'sch_1', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', title: 'Data Structures & Algorithms Lecture', subject: 'CS301', location: 'Hall B-204', type: 'lecture' },
  { id: 'sch_2', dayOfWeek: 1, startTime: '14:00', endTime: '16:00', title: 'Operating Systems Kernel Lab', subject: 'CS302', location: 'Systems Lab 3', type: 'lab' },
  { id: 'sch_3', dayOfWeek: 2, startTime: '10:00', endTime: '11:30', title: 'Database Management Systems', subject: 'CS303', location: 'Hall A-102', type: 'lecture' },
  { id: 'sch_4', dayOfWeek: 3, startTime: '11:00', endTime: '12:30', title: 'Computer Networks Protocol Deep Dive', subject: 'CS304', location: 'Hall B-201', type: 'lecture' },
  { id: 'sch_5', dayOfWeek: 4, startTime: '15:00', endTime: '16:30', title: 'AI & Machine Learning Seminar', subject: 'CS305', location: 'AI Auditorium', type: 'lecture' },
  { id: 'sch_6', dayOfWeek: 5, startTime: '16:00', endTime: '18:00', title: 'Weekly Spaced Repetition & LeetCode Sprint', subject: 'Self Study', location: 'Library', type: 'revision' }
];

export const defaultRevisions: RevisionItem[] = [
  {
    id: 'rev_1',
    topicId: 'top_dsa_1_1',
    topicTitle: 'Asymptotic Notations & Master Theorem',
    subjectName: 'Data Structures & Algorithms',
    stage: 3,
    lastReviewed: '2026-11-05',
    nextReviewDate: '2026-11-10',
    dueToday: true
  },
  {
    id: 'rev_2',
    topicId: 'top_dbms_1_1',
    topicTitle: 'Functional Dependencies & BCNF Normalization',
    subjectName: 'Database Management Systems',
    stage: 2,
    lastReviewed: '2026-11-07',
    nextReviewDate: '2026-11-10',
    dueToday: true
  }
];

export const defaultNotes: Note[] = [
  {
    id: 'note_1',
    title: 'Master Theorem & Divide-and-Conquer Recurrences',
    subject: 'Data Structures & Algorithms',
    folder: 'Lectures',
    content: '# Master Theorem\n\nFor $T(n) = aT(n/b) + f(n)$:\n- **Case 1**: $f(n) = O(n^{\\log_b a - \\epsilon}) \\implies \\Theta(n^{\\log_b a})$\n- **Case 2**: $f(n) = \\Theta(n^{\\log_b a} \\log^k n) \\implies \\Theta(n^{\\log_b a} \\log^{k+1} n)$\n- **Case 3**: $f(n) = \\Omega(n^{\\log_b a + \\epsilon}) \\implies \\Theta(f(n))$',
    tags: ['DSA', 'Complexity', 'Midterm'],
    summary: 'Concise reference for solving divide-and-conquer recurrence relations using the three cases of the Master Theorem.',
    keyConcepts: ['Asymptotic Upper Bound', 'Divide and Conquer', 'Critical Exponent log_b(a)'],
    updatedAt: '2026-11-08T10:00:00.000Z'
  },
  {
    id: 'note_2',
    title: 'Deadlock Prevention & Banker’s Safety Algorithm',
    subject: 'Operating Systems',
    folder: 'Exam Prep',
    content: '# Deadlock Conditions (Coffman)\n1. **Mutual Exclusion**\n2. **Hold and Wait**\n3. **No Preemption**\n4. **Circular Wait**\n\nBanker’s Algorithm checks `Need[i] <= Work` before granting resource allocation.',
    tags: ['OS', 'Concurrency', 'Deadlock'],
    summary: 'Overview of the four Coffman deadlock conditions and the Banker’s safety verification algorithm.',
    keyConcepts: ['Coffman Conditions', 'Resource Allocation Graph', 'Safe Sequence'],
    updatedAt: '2026-11-09T14:30:00.000Z'
  }
];

export const defaultAchievements: Achievement[] = [
  { id: 'ach_1', title: 'Consistent Scholar', description: 'Maintain a 7-day study streak', icon: 'Flame', progress: 1, maxProgress: 7, unlocked: false },
  { id: 'ach_2', title: 'Algorithmic Problem Solver', description: 'Solve 10 coding challenges in Coding Lab', icon: 'Code2', progress: 0, maxProgress: 10, unlocked: false },
  { id: 'ach_3', title: 'Syllabus Explorer', description: 'Complete 5 university curriculum topics', icon: 'BookOpen', progress: 6, maxProgress: 5, unlocked: true, unlockedAt: '2026-11-09' },
  { id: 'ach_4', title: 'Exam Ace', description: 'Complete 5 practice quizzes in Exam Centre', icon: 'Award', progress: 0, maxProgress: 5, unlocked: false },
  { id: 'ach_5', title: 'Deep Focus Master', description: 'Log 25 hours of focused study time', icon: 'Clock', progress: 0, maxProgress: 25, unlocked: false },
  { id: 'ach_6', title: 'Knowledge Architect', description: 'Create or master 10 study notes & flashcards', icon: 'Sparkles', progress: 4, maxProgress: 10, unlocked: false }
];

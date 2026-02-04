export const data = [
  {
    question: "Consider a system with segmentation. A segment table has a segment with base=1000 and limit=400. What will happen if the user tries to access location 1401?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Access granted" },
      { text: "Trap to operating system – segmentation fault", isCorrect: true },
      { text: "Offset adjusted by modulo" },
      { text: "Converted to physical address 2401" }
    ]
  },
  {
    question: "Which of the following memory allocation techniques suffers most from external fragmentation?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Paging" },
      { text: "Segmentation" },
      { text: "Contiguous allocation", isCorrect: true },
      { text: "Swapping" }
    ]
  },
  {
    question: "In Banker’s algorithm, which condition must be met to safely allocate a resource?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Total allocated + requested > total available" },
      { text: "A safe sequence must exist after allocation", isCorrect: true },
      { text: "All processes must release their resources" },
      { text: "It is a first-come-first-served allocation" }
    ]
  },
  {
    question: "In a system using demand paging, what happens when a page fault occurs?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "The process is terminated" },
      { text: "The page is swapped from disk to memory", isCorrect: true },
      { text: "The TLB is updated only" },
      { text: "The CPU retries the instruction without delay" }
    ]
  },
  {
    question: "Which scheduling algorithm may lead to starvation?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Round Robin" },
      { text: "Shortest Job First", isCorrect: true },
      { text: "FCFS" },
      { text: "Multilevel Feedback Queue with aging" }
    ]
  },
  {
    question: "What is the effective memory access time if memory access takes 100 ns and TLB hit ratio is 80% with TLB access time 20 ns?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "120 ns", isCorrect: true },
      { text: "140 ns" },
      { text: "180 ns" },
      { text: "200 ns" }
    ]
  },
  {
    question: "In UNIX, what is the relationship between fork() and exec()?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "fork() replaces the process memory with a new one" },
      { text: "exec() creates a new process identical to parent" },
      { text: "fork() creates a copy, exec() replaces it with a new program", isCorrect: true },
      { text: "Both are used to kill processes" }
    ]
  },
  {
    question: "Which of the following conditions causes cascading termination in a system?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Process in running state" },
      { text: "Child process acquiring resources" },
      { text: "Parent process terminating without wait()", isCorrect: true },
      { text: "Zombie process not being killed" }
    ]
  },
  {
    question: "Which of the following statements is true for Belady’s anomaly?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "It occurs in LRU and Optimal algorithms" },
      { text: "It occurs in FIFO where more frames cause more page faults", isCorrect: true },
      { text: "It is impossible in real systems" },
      { text: "It occurs only in segmented systems" }
    ]
  },
  {
    question: "A system has 3 processes and 4 identical units of resource R. Which of the following allocations is unsafe?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Processes: P1=1, P2=1, P3=1 (Available=1)" },
      { text: "Processes: P1=2, P2=1, P3=0 (Available=1)" },
      { text: "Processes: P1=1, P2=2, P3=0 (Available=1)" },
      { text: "Processes: P1=1, P2=1, P3=2 (Available=0)", isCorrect: true }
    ]
  },
  {
    question: "Which of the following protocols does NOT operate at the transport layer?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "TCP" },
      { text: "UDP" },
      { text: "ICMP", isCorrect: true },
      { text: "SCTP" }
    ]
  },
  {
    question: "Which of the following statements is TRUE about the Go-Back-N protocol?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Only the lost packet is retransmitted" },
      { text: "Receiver sends cumulative ACKs", isCorrect: true },
      { text: "It allows out-of-order delivery" },
      { text: "Sender window size is always 1" }
    ]
  },
  {
    question: "The subnet mask 255.255.255.224 has how many usable host IPs?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "32" },
      { text: "30", isCorrect: true },
      { text: "62" },
      { text: "28" }
    ]
  },
  {
    question: "Which of the following statements best describes the hidden terminal problem in wireless networks?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Two nodes can't hear each other but interfere at a third", isCorrect: true },
      { text: "One node is always out of range" },
      { text: "Collision occurs at transmitter" },
      { text: "ACK packets are always lost" }
    ]
  },
  {
    question: "Which field in the TCP header ensures data integrity?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Sequence Number" },
      { text: "Acknowledgment Number" },
      { text: "Checksum", isCorrect: true },
      { text: "Window Size" }
    ]
  },
  {
    question: "In Distance Vector Routing, the count-to-infinity problem is mitigated by:",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Link-state routing" },
      { text: "Poison reverse", isCorrect: true },
      { text: "Spanning tree protocol" },
      { text: "Flow control" }
    ]
  },
  {
    question: "Which of the following best describes TCP’s congestion control using AIMD?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Additive Increase, Multiplicative Decrease", isCorrect: true },
      { text: "Average Increment, Minimum Delay" },
      { text: "Automatic Increment, Minimum Detection" },
      { text: "Adjustable Input, Multi-Destination" }
    ]
  },
  {
    question: "Which port number is used by HTTPS by default?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "443", isCorrect: true },
      { text: "80" },
      { text: "22" },
      { text: "21" }
    ]
  },
  {
    question: "Which addressing method is used by ARP to resolve MAC addresses from IP addresses?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Broadcast", isCorrect: true },
      { text: "Unicast" },
      { text: "Multicast" },
      { text: "Anycast" }
    ]
  },
  {
    question: "The propagation delay of a signal is 3 ms and the transmission delay is 2 ms. What is the total delay for sending a 1 KB packet?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "5 ms", isCorrect: true },
      { text: "1.5 ms" },
      { text: "3 ms" },
      { text: "2 ms" }
    ]
  },
  {
    question: "Which of the following ensures that transactions are executed in isolation?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Atomicity" },
      { text: "Consistency" },
      { text: "Isolation", isCorrect: true },
      { text: "Durability" }
    ]
  },
  {
    question: "In 2PL (Two-Phase Locking), which of the following is TRUE?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Locks can be released before the end of growing phase" },
      { text: "Locks are acquired in shrinking phase" },
      { text: "Deadlocks are impossible in strict 2PL" },
      { text: "No locks are acquired in shrinking phase", isCorrect: true }
    ]
  },
  {
    question: "Which of the following schedules is conflict-serializable?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "T1: R(A), W(A); T2: R(A), W(A)" },
      { text: "T1: R(A), W(A); T2: R(B), W(B)", isCorrect: true },
      { text: "T1: W(A); T2: W(A)" },
      { text: "T1: R(A); T2: W(A); T1: W(A)" }
    ]
  },
  {
    question: "What is the result of a NATURAL JOIN between two relations R(A, B) and S(B, C) on attribute B?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "R × S (Cartesian Product)" },
      { text: "Rows with matching B in both R and S", isCorrect: true },
      { text: "All combinations of A, B, C from both tables" },
      { text: "Only attributes from R are retained" }
    ]
  },
  {
    question: "Which of the following statements about normalization is FALSE?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Normalization reduces redundancy" },
      { text: "Normalization may lead to more joins" },
      { text: "Denormalization improves data integrity", isCorrect: true },
      { text: "Normalization improves consistency" }
    ]
  },
  {
    question: "Which index type stores data in a sorted tree structure for range queries?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Hash Index" },
      { text: "Bitmap Index" },
      { text: "B+ Tree Index", isCorrect: true },
      { text: "Clustered Index" }
    ]
  },
  {
    question: "Which of the following can cause a phantom read?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Read Committed" },
      { text: "Repeatable Read" },
      { text: "Serializable", isCorrect: false },
      { text: "Non-Serializable Isolation Levels", isCorrect: true }
    ]
  },
  {
    question: "In an ER model, total participation is represented by:",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Double rectangle" },
      { text: "Bold attribute name" },
      { text: "Double lines between entity and relationship", isCorrect: true },
      { text: "Dotted arrow" }
    ]
  },
  {
    question: "The minimal superkey is known as:",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Primary key", isCorrect: true },
      { text: "Candidate key" },
      { text: "Foreign key" },
      { text: "Unique key" }
    ]
  },
  {
    question: "Which of the following ensures a transaction completes either fully or not at all?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Isolation" },
      { text: "Atomicity", isCorrect: true },
      { text: "Durability" },
      { text: "Consistency" }
    ]
  },
   {
    question: "Which of the following violates the Liskov Substitution Principle (LSP)?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Derived class overrides a method with the same signature" },
      { text: "Derived class throws a new exception type" },
      { text: "Derived class strengthens postconditions", isCorrect: true },
      { text: "Derived class weakens preconditions" }
    ]
  },
  {
    question: "Which of the following C++ inheritance types allows access to both public and protected members of the base class but not private?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Private Inheritance" },
      { text: "Protected Inheritance", isCorrect: true },
      { text: "Public Inheritance" },
      { text: "Virtual Inheritance" }
    ]
  },
  {
    question: "In Java, what is the consequence of declaring a method as `final` in a base class?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Method cannot be called" },
      { text: "Method can be overridden" },
      { text: "Method cannot be overridden", isCorrect: true },
      { text: "Method is accessible only to subclasses" }
    ]
  },
  {
    question: "Which design pattern encapsulates a group of individual factories with a common goal?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Factory Method" },
      { text: "Abstract Factory", isCorrect: true },
      { text: "Builder" },
      { text: "Prototype" }
    ]
  },
  {
    question: "Which of the following best defines dynamic (run-time) polymorphism?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Function overloading" },
      { text: "Operator overloading" },
      { text: "Virtual function overriding", isCorrect: true },
      { text: "Static binding of methods" }
    ]
  },
  {
    question: "In C++, what will happen if a class has a private constructor and no friend function/class?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "It can be instantiated anywhere" },
      { text: "It can only be used via static methods", isCorrect: true },
      { text: "It cannot be used at all" },
      { text: "It throws a compile-time error" }
    ]
  },
  {
    question: "What is object slicing in C++?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Copying only base class part of a derived object", isCorrect: true },
      { text: "Using a pointer to access class members" },
      { text: "Runtime memory leak" },
      { text: "Memory fragmentation due to inheritance" }
    ]
  },
  {
    question: "Which of the following correctly shows method overriding in Java?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Two methods with same name but different parameter types" },
      { text: "Subclass redefining a superclass method with same signature", isCorrect: true },
      { text: "Method having same name in same class" },
      { text: "Static method hiding in subclass" }
    ]
  },
  {
    question: "Which feature of OOP makes code extensible and reusable by deriving new classes?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Encapsulation" },
      { text: "Polymorphism" },
      { text: "Inheritance", isCorrect: true },
      { text: "Abstraction" }
    ]
  },
  {
    question: "Which of the following best supports *interface segregation* in Java?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "A single interface with many unrelated methods" },
      { text: "A class implementing only required small interfaces", isCorrect: true },
      { text: "A class with multiple constructors" },
      { text: "Extending an abstract class with default methods" }
    ]
  },
  {
    question: "Which of the following is not a property of a transaction in DBMS?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Atomicity" },
      { text: "Durability" },
      { text: "Periodicity", isCorrect: true },
      { text: "Consistency" }
    ]
  },
  {
    question: "Which of the following scheduling algorithms allows starvation?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "FCFS" },
      { text: "Round Robin" },
      { text: "SJF", isCorrect: true },
      { text: "Priority with aging" }
    ]
  },
  {
    question: "Which protocol is used for email retrieval?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "SMTP" },
      { text: "POP3", isCorrect: true },
      { text: "HTTP" },
      { text: "IMAP" }
    ]
  },
  {
    question: "In object-oriented programming, what is polymorphism?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Using multiple classes" },
      { text: "Having multiple constructors" },
      { text: "Same interface, different behavior", isCorrect: true },
      { text: "Encapsulation of methods" }
    ]
  },
  {
    question: "Which of the following is used to prevent deadlock?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Mutual exclusion" },
      { text: "Circular wait prevention", isCorrect: true },
      { text: "Hold and wait" },
      { text: "Request and wait" }
    ]
  },
  {
    question: "Which key uniquely identifies a tuple in a relation?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Candidate Key" },
      { text: "Super Key" },
      { text: "Primary Key", isCorrect: true },
      { text: "Foreign Key" }
    ]
  },
  {
    question: "What does the MAC layer handle in the OSI model?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Routing" },
      { text: "IP addressing" },
      { text: "Framing and access control", isCorrect: true },
      { text: "Encryption" }
    ]
  },
  {
    question: "Which data structure is used in recursion?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Queue" },
      { text: "Stack", isCorrect: true },
      { text: "Heap" },
      { text: "Linked List" }
    ]
  },
  {
    question: "Which memory is volatile?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "ROM" },
      { text: "Hard Disk" },
      { text: "RAM", isCorrect: true },
      { text: "Flash memory" }
    ]
  },
  {
    question: "Which technique is used to improve cache performance?",
    marks: 1,
    negative: 0.25,
    category: "MCQ",
    options: [
      { text: "Page Replacement" },
      { text: "Pipelining" },
      { text: "Prefetching", isCorrect: true },
      { text: "Demand Paging" }
    ]
  }
]

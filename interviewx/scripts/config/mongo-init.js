// Create database and initial user
db = db.getSiblingDB('interviewx');

// Create initial demo user (password: demo123, hashed)
db.users.insertOne({
  name: "Demo User",
  email: "demo@interviewx.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqmtYEOxfOqlPAK", // demo123
  avatar: "https://ui-avatars.io/api/?name=Demo+User&background=3B82F6&color=fff",
  role: "candidate",
  isEmailVerified: true,
  stats: {
    totalInterviews: 0,
    completedInterviews: 0,
    averageScore: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print("Database initialized with demo user");

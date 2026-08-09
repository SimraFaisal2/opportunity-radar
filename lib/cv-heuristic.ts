// Local heuristic CV matcher — used when no Gemini API key is provided.
// Estimates a match score from skill and keyword overlap between the CV text
// and the job description. No data leaves the server; no API is called.

interface Skill {
  name: string;
  aliases: string[];
}

const SKILLS: Skill[] = [
  // Programming languages
  { name: "Python", aliases: ["python"] },
  { name: "JavaScript", aliases: ["javascript"] },
  { name: "TypeScript", aliases: ["typescript"] },
  { name: "Java", aliases: ["java"] },
  { name: "C++", aliases: ["c++", "cpp"] },
  { name: "C", aliases: ["c language", "c programming", "c/c++"] },
  { name: "C#", aliases: ["c#", "csharp"] },
  { name: "Go", aliases: ["golang", "go language"] },
  { name: "Rust", aliases: ["rust"] },
  { name: "SQL", aliases: ["sql"] },
  { name: "R", aliases: [" r ", "r language", "rstudio"] },
  { name: "MATLAB", aliases: ["matlab"] },
  { name: "Swift", aliases: ["swift"] },
  { name: "Kotlin", aliases: ["kotlin"] },
  { name: "Ruby", aliases: ["ruby"] },
  { name: "PHP", aliases: ["php"] },
  { name: "HTML", aliases: ["html"] },
  { name: "CSS", aliases: ["css"] },
  { name: "Bash", aliases: ["bash", "shell scripting", "shell script"] },
  // Frameworks & libraries
  { name: "React", aliases: ["react"] },
  { name: "React Native", aliases: ["react native"] },
  { name: "Next.js", aliases: ["next.js", "nextjs"] },
  { name: "Node.js", aliases: ["node.js", "nodejs"] },
  { name: "Express", aliases: ["express"] },
  { name: "Django", aliases: ["django"] },
  { name: "Flask", aliases: ["flask"] },
  { name: "Vue", aliases: ["vue"] },
  { name: "Angular", aliases: ["angular"] },
  { name: "Tailwind CSS", aliases: ["tailwind"] },
  { name: "TensorFlow", aliases: ["tensorflow"] },
  { name: "PyTorch", aliases: ["pytorch"] },
  { name: "Keras", aliases: ["keras"] },
  { name: "scikit-learn", aliases: ["scikit-learn", "sklearn"] },
  { name: "pandas", aliases: ["pandas"] },
  { name: "NumPy", aliases: ["numpy"] },
  { name: "Spring Boot", aliases: ["spring boot", "spring framework", "spring mvc"] },
  { name: ".NET", aliases: [".net", "dotnet"] },
  { name: "Flutter", aliases: ["flutter"] },
  { name: "Dart", aliases: ["dart"] },
  // Data science & ML
  { name: "Machine Learning", aliases: ["machine learning"] },
  { name: "Deep Learning", aliases: ["deep learning"] },
  { name: "Natural Language Processing", aliases: ["natural language processing", "nlp"] },
  { name: "Computer Vision", aliases: ["computer vision"] },
  { name: "Data Science", aliases: ["data science"] },
  { name: "Data Analysis", aliases: ["data analysis", "data analytics"] },
  { name: "Big Data", aliases: ["big data", "apache spark", "hadoop"] },
  { name: "Statistics", aliases: ["statistics", "statistical"] },
  { name: "Data Visualization", aliases: ["data visualization", "data visualisation"] },
  { name: "Tableau", aliases: ["tableau"] },
  { name: "Power BI", aliases: ["power bi", "powerbi"] },
  // Cloud & DevOps
  { name: "AWS", aliases: ["aws", "amazon web services"] },
  { name: "Azure", aliases: ["azure"] },
  { name: "Google Cloud", aliases: ["google cloud", "gcp"] },
  { name: "Docker", aliases: ["docker"] },
  { name: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { name: "CI/CD", aliases: ["ci/cd", "cicd", "continuous integration", "continuous deployment"] },
  { name: "Git", aliases: ["git"] },
  { name: "GitHub", aliases: ["github"] },
  { name: "GitHub Actions", aliases: ["github actions"] },
  { name: "Linux", aliases: ["linux", "unix"] },
  { name: "Terraform", aliases: ["terraform"] },
  { name: "Jenkins", aliases: ["jenkins"] },
  // Databases
  { name: "PostgreSQL", aliases: ["postgresql", "postgres"] },
  { name: "MySQL", aliases: ["mysql"] },
  { name: "MongoDB", aliases: ["mongodb", "mongo"] },
  { name: "Redis", aliases: ["redis"] },
  { name: "SQLite", aliases: ["sqlite"] },
  // Web, APIs & testing
  { name: "REST APIs", aliases: ["rest api", "restful", "rest apis", "api development"] },
  { name: "GraphQL", aliases: ["graphql"] },
  { name: "Jest", aliases: ["jest"] },
  { name: "Cypress", aliases: ["cypress"] },
  { name: "Playwright", aliases: ["playwright"] },
  { name: "Selenium", aliases: ["selenium"] },
  { name: "Web Development", aliases: ["web development", "front-end", "frontend", "back-end", "backend", "full-stack", "full stack"] },
  { name: "Mobile Development", aliases: ["mobile development", "ios development", "android development"] },
  // Research & science
  { name: "Research", aliases: ["research"] },
  { name: "Bioinformatics", aliases: ["bioinformatics"] },
  { name: "LaTeX", aliases: ["latex"] },
  { name: "Jupyter", aliases: ["jupyter"] },
  { name: "Scientific Writing", aliases: ["scientific writing", "academic writing"] },
  { name: "Lab Work", aliases: ["laboratory", "lab experience", "wet lab", "bench work"] },
  { name: "Literature Review", aliases: ["literature review", "literature search"] },
  { name: "Data Collection", aliases: ["data collection", "data gathering"] },
  // Tools, design & content
  { name: "Excel", aliases: ["excel"] },
  { name: "PowerPoint", aliases: ["powerpoint"] },
  { name: "Microsoft Office", aliases: ["microsoft office", "ms office", "office suite"] },
  { name: "Figma", aliases: ["figma"] },
  { name: "Adobe Photoshop", aliases: ["photoshop"] },
  { name: "Illustrator", aliases: ["illustrator"] },
  { name: "Video Editing", aliases: ["video editing", "premiere pro", "after effects"] },
  { name: "Content Writing", aliases: ["content writing", "copywriting", "content creation"] },
  { name: "Social Media", aliases: ["social media"] },
  { name: "Event Management", aliases: ["event management", "event planning", "event coordination"] },
  { name: "Fundraising", aliases: ["fundraising", "fund raising"] },
  { name: "Grant Writing", aliases: ["grant writing", "grantwriting"] },
  { name: "Public Speaking", aliases: ["public speaking"] },
  // Soft skills & methods
  { name: "Teamwork", aliases: ["teamwork", "collaboration", "team player"] },
  { name: "Communication", aliases: ["communication", "communicate", "presentation skills"] },
  { name: "Leadership", aliases: ["leadership", "led a team"] },
  { name: "Problem Solving", aliases: ["problem solving", "problem-solving", "analytical skills"] },
  { name: "Agile", aliases: ["agile", "scrum"] },
  { name: "Data Structures", aliases: ["data structures"] },
  { name: "Algorithms", aliases: ["algorithms"] },
  { name: "Object-Oriented Programming", aliases: ["object-oriented", "oop"] },
];

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "with", "this", "that", "from", "your", "you", "our", "will", "have", "has", "had",
  "was", "were", "been", "being", "can", "could", "should", "would", "may", "might", "must", "shall", "not", "but",
  "all", "any", "each", "every", "some", "such", "than", "then", "there", "these", "they", "them", "their", "its",
  "also", "into", "over", "under", "between", "during", "after", "before", "about", "above", "below", "through",
  "within", "without", "out", "off", "on", "in", "at", "by", "to", "of", "a", "an", "or", "as", "if", "it", "is",
  "are", "do", "does", "did", "done", "doing", "job", "work", "role", "position", "candidate", "candidates",
  "applicant", "applicants",  "experience", "skills", "required", "requirements", "qualifications", "preferred",
  "responsibilities", "include", "including", "etc", "etc.", "e.g.", "i.e.", "using", "use", "used", "ability",
  "strong", "excellent", "good", "knowledge", "working", "team", "years", "year", "plus", "new", "real", "day",
  "days", "time", "based", "degree", "student", "students", "internship", "intern", "full", "part", "remote",
  "location", "apply", "application", "deadline", "summer", "university", "program", "programme", "eligible",
  "eligibility", "we", "us", "their", "per", "month", "annual", "salary", "compensation", "benefits", "benefit",
  "opportunity", "opportunities", "company", "companies", "organization", "organizations", "looking", "seeking",
  "join", "come", "help", "build", "develop", "development", "support", "provide", "need", "needs", "environment",
  "great", "best", "top", "quality", "well", "proven", "track", "record", "desired", "nice", "understanding",
  "familiarity", "familiar", "exposure", "relevant", "related", "equivalent", "minimum", "please", "contact",
  "more", "information", "info", "details", "visit", "website", "url", "link", "click", "here", "one", "two",
  "three", "four", "five", "six", "seven", "eight", "nine", "ten", "2024", "2025", "2026", "2027", "bachelor",
  "bachelor's", "master", "master's", "undergraduate", "graduate", "phd", "education", "language",
  "english", "french", "german", "spanish", "level",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function textHas(text: string, phrase: string): boolean {
  const p = phrase.toLowerCase().trim();
  if (!p) return false;
  if (p.includes(" ")) return text.includes(p);
  const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}($|[^a-z0-9])`).test(text);
}

export interface HeuristicResult {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  summary: string;
  mode: "heuristic";
}

/**
 * Lightweight 0–100 score of how well a CV fits an opportunity, without the
 * full strengths/gaps prose. Used to rank the whole opportunity board against
 * a CV ("suggest internships matching me"). Reuses the same skill/keyword
 * overlap logic as heuristicMatch.
 */
export function scoreOpportunity(cvText: string, oppText: string): number {
  const cv = cvText.toLowerCase();
  const job = oppText.toLowerCase();

  const inCv = (aliases: string[]) => aliases.some((a) => textHas(cv, a));
  const inJob = (aliases: string[]) => aliases.some((a) => textHas(job, a));

  const jobSkills = SKILLS.filter((s) => inJob(s.aliases));
  const matched = jobSkills.filter((s) => inCv(s.aliases));
  const skillCoverage = jobSkills.length > 0 ? matched.length / jobSkills.length : 0;

  const cvTokens = new Set(tokenize(cv));
  const jobTokens = tokenize(job);
  const overlap = jobTokens.length > 0 ? jobTokens.filter((t) => cvTokens.has(t)).length / jobTokens.length : 0;

  let score: number;
  if (jobSkills.length > 0) {
    score = Math.round(skillCoverage * 70 + overlap * 30);
  } else {
    // Few/no explicit skills listed — lean on real keyword overlap only, so
    // thin rows (empty descriptions, title-only) sink instead of sitting at a
    // noise floor that would flood the suggestions list.
    score = Math.round(10 + overlap * 60);
  }
  return Math.max(8, Math.min(98, score));
}

export function heuristicMatch(cvText: string, jobDescription: string): HeuristicResult {
  const cv = cvText.toLowerCase();
  const job = jobDescription.toLowerCase();

  const inCv = (aliases: string[]) => aliases.some((a) => textHas(cv, a));
  const inJob = (aliases: string[]) => aliases.some((a) => textHas(job, a));

  const jobSkills = SKILLS.filter((s) => inJob(s.aliases));
  const matched = jobSkills.filter((s) => inCv(s.aliases));
  const missing = jobSkills.filter((s) => !inCv(s.aliases));

  const skillCoverage = jobSkills.length > 0 ? matched.length / jobSkills.length : 0;

  // Generic keyword overlap as a secondary signal.
  const cvTokens = new Set(tokenize(cv));
  const jobTokens = tokenize(job);
  const overlap = jobTokens.length > 0 ? jobTokens.filter((t) => cvTokens.has(t)).length / jobTokens.length : 0;

  let matchScore: number;
  if (jobSkills.length > 0) {
    matchScore = Math.round(skillCoverage * 70 + overlap * 30);
  } else {
    // The posting lists few specific skills — lean on general keyword overlap.
    matchScore = Math.round(45 + overlap * 25);
  }
  matchScore = Math.max(8, Math.min(98, matchScore));

  // Degree signal.
  const needsMaster = /(master'?s|m\.?sc|m\.?s\.|postgraduate|graduate degree)/.test(job);
  const hasBach = /(bachelor'?s|b\.?sc|b\.?s\.|undergraduate)/.test(cv);
  const hasMaster = /(master'?s|m\.?sc|m\.?s\.|postgraduate|graduate degree)/.test(cv);

  const strengths: string[] = [];
  for (const s of matched.slice(0, 4)) {
    strengths.push(`You list ${s.name}, which is one of the role's key requirements`);
  }
  if (matched.length > 4) {
    strengths.push(`...and ${matched.length - 4} more of the role's skills appear in your CV`);
  }
  if (strengths.length === 0) {
    strengths.push("Your general background overlaps with the field this role is in");
  }
  if (needsMaster && hasMaster) {
    strengths.push("You meet the Master's-level qualification the role asks for");
  }

  const gaps: string[] = [];
  for (const s of missing.slice(0, 4)) {
    gaps.push(`The role mentions ${s.name}, which your CV doesn't clearly show`);
  }
  if (missing.length > 4) {
    gaps.push(`...plus ${missing.length - 4} more listed requirements your CV doesn't cover`);
  }
  if (needsMaster && hasBach && !hasMaster) {
    gaps.push("The role expects a Master's degree, but your CV shows a Bachelor's — highlight relevant coursework or projects");
  } else if (needsMaster && !hasBach && !hasMaster) {
    gaps.push("The role expects a Master's degree — make your qualifications explicit");
  }
  if (gaps.length === 0) {
    gaps.push("No obvious skill gaps — your CV covers the requirements listed in the role");
  }

  let summary: string;
  if (jobSkills.length === 0) {
    summary =
      matchScore >= 70
        ? "Your CV shares a lot of vocabulary with this description, so it's a plausible fit even though the posting lists few specific technical skills. Tailor your cover letter to the areas mentioned."
        : "This posting lists few specific skills, so the estimate leans on general keyword overlap. Adding concrete skills and projects to your CV would give a clearer read.";
  } else if (matchScore >= 75) {
    summary =
      `Strong match. Your CV covers ${matched.length} of the ${jobSkills.length} skills the role emphasizes` +
      (missing.length
        ? `, though ${missing.slice(0, 3).map((s) => s.name).join(", ")} could be called out more explicitly.`
        : ", and it checks every box the description highlights.") +
      " Focus your cover letter on these overlaps.";
  } else if (matchScore >= 50) {
    summary =
      missing.length === 0
        ? `Decent match — your CV covers all ${jobSkills.length} key skills the role lists. Quantify your results and tailor your cover letter to strengthen the case.`
        : `Decent match — you have a solid foundation (${matched.length} of ${jobSkills.length} key skills), but the role asks for more. ` +
          `Highlight ${missing.slice(0, 2).map((s) => s.name).join(" and ") || "relevant coursework"} and quantify your results to close the gap.`;
  } else {
    summary =
      `This role is a stretch with your current profile — you only clearly match ${matched.length} of ${jobSkills.length} key skills. ` +
      `Consider roles closer to your existing strengths, or pick up ${missing.slice(0, 2).map((s) => s.name).join(" and ") || "the missing skills"} before applying.`;
  }

  return { matchScore, strengths, gaps, summary, mode: "heuristic" };
}

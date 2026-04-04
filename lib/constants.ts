export const APP_NAME = 'Placemate AI';
export const APP_TAGLINE = 'Your AI-powered campus placement co-pilot';

export const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AIDS', 'AIML', 'DS', 'Other'];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const CGPA_BANDS = ['< 6.0', '6.0-7.0', '7.0-8.0', '8.0-9.0', '9.0+'] as const;

export const TARGET_ROLES = [
  'Software Development Engineer (SDE)',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Product Manager',
  'Business Analyst',
  'QA Engineer',
  'Other',
] as const;

export const SKILL_OPTIONS = [
  'Data Structures & Algorithms',
  'Object Oriented Programming',
  'Web Development',
  'React / Next.js',
  'Node.js',
  'Python',
  'Java',
  'C++',
  'SQL / DBMS',
  'Operating Systems',
  'Computer Networks',
  'System Design',
  'Machine Learning',
  'Cloud (AWS/GCP/Azure)',
  'Git / Version Control',
  'Problem Solving',
  'Communication',
  'Leadership',
] as const;

export const HOURS_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

export const DURATION_OPTIONS = [1, 2, 3, 6] as const; // months

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/roadmap', label: 'Roadmap', icon: 'Map' },
  { href: '/resume', label: 'Resume ATS', icon: 'FileText' },
  { href: '/interview', label: 'Mock Interview', icon: 'MessageSquare' },
  { href: '/profile', label: 'Profile', icon: 'User' },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: 'BarChart3' },
  { href: '/admin/students', label: 'Students', icon: 'Users' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'TrendingUp' },
] as const;

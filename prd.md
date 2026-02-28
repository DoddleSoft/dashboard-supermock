# SuperMock - IELTS Mock Test Management Platform

## Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** March 1, 2026  
**Product Owner:** SuperMock Team  
**Document Status:** Active

---

## 1. Executive Summary

### 1.1 Product Vision

SuperMock is a comprehensive SaaS platform designed to streamline IELTS mock test administration, grading, and student performance tracking for test preparation centers. The platform enables centers to create, schedule, administer, and grade IELTS practice tests efficiently while providing detailed performance analytics to students.

### 1.2 Product Goals

- **Efficiency**: Reduce test grading time by 80% through automated scoring and batch operations
- **Scalability**: Support multiple centers with isolated data and custom branding
- **Accuracy**: Ensure precise IELTS band score calculations following official rubrics
- **Performance**: Deliver sub-second response times for all critical user operations
- **Accessibility**: Provide role-based access for owners, admins, and examiners

### 1.3 Target Market

- IELTS preparation centers (primary)
- Educational institutions offering IELTS training
- Independent IELTS tutors managing multiple students
- Online test preparation platforms

---

## 2. User Personas

### 2.1 Center Owner

**Profile**: Owns/operates one or more IELTS preparation centers  
**Goals**:

- Manage multiple centers and staff members
- Monitor overall business performance and test usage
- Control access and permissions across the organization
- Track subscription tier and billing

**Pain Points**:

- Manual test grading is time-consuming and error-prone
- Difficulty tracking student progress across multiple batches
- Limited visibility into examiner performance and workload

### 2.2 Center Admin

**Profile**: Senior staff member with administrative privileges  
**Goals**:

- Create and manage test papers and modules
- Schedule tests for student batches
- Assign examiners to grading tasks
- Generate performance reports

**Pain Points**:

- Paper creation is repetitive and manual
- Test scheduling conflicts are hard to manage
- No centralized view of pending grading tasks

### 2.3 Examiner

**Profile**: Staff member responsible for grading student responses  
**Goals**:

- Grade writing and speaking modules efficiently
- Provide constructive feedback to students
- Track personal grading workload

**Pain Points**:

- Writing module grading is subjective and time-consuming
- Difficult to maintain consistency across multiple students
- Limited tools for providing structured feedback

### 2.4 Student (Indirect User)

**Profile**: IELTS test taker using the center's services  
**Goals**:

- Practice IELTS tests in realistic conditions
- Receive timely and accurate band scores
- Understand strengths and weaknesses

**Pain Points**:

- Delayed feedback from centers
- Inconsistent grading quality
- Limited visibility into progress over time

---

## 3. Core Features

### 3.1 Authentication & Authorization

#### 3.1.1 User Management

- **Email/Password Authentication** via Supabase Auth
- **Password Reset** with email verification
- **Multi-Center Access** for users associated with multiple centers
- **Exchange Code System** for joining centers without email verification

#### 3.1.2 Role-Based Access Control (RBAC)

| Role         | Permissions                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| **Owner**    | Full access: manage centers, members, papers, tests, students, grading, billing |
| **Admin**    | Manage papers, tests, students, grading (within assigned center)                |
| **Examiner** | View assigned tests, grade student responses (read-only for other data)         |

#### 3.1.3 Center Isolation

- Row-Level Security (RLS) policies enforce data isolation
- Users can only access data from centers they belong to
- Cross-center data leakage prevention through database-level constraints

---

### 3.2 Center Management

#### 3.2.1 Center Creation & Setup

- **Center Profile**: name, slug (unique URL identifier), location
- **Verification Status**: pending → verified → rejected
- **Subscription Tier**: basic, professional, enterprise
- **Storage Quota**: track audio/image upload usage

#### 3.2.2 Member Management

- **Invite Members** via email with role assignment
- **Exchange Codes**: generate temporary codes for bulk member addition
- **Member Permissions**: view/edit/delete based on role hierarchy
- **Activity Tracking**: last login, tests graded, active status

---

### 3.3 Student Management

#### 3.3.1 Student Profiles

**Core Fields**:

- Name, email, phone, date of birth
- Guardian name and contact (for minors)
- Address, enrollment date
- Grade/batch assignment

**Student Types**:

- **Regular**: enrolled for continuous training
- **Visitor**: one-time test takers with exam date tracking
- **Mock-Only**: students who only take practice tests

**Student Lifecycle**:

- Status: active → cancelled → archived → passed
- Tests taken counter (auto-incremented)
- Enrollment type-specific metadata

#### 3.3.2 Bulk Operations

- CSV import for batch student addition
- Bulk status updates (e.g., archive all passed students)
- Export student list with test history

---

### 3.4 Paper & Module Creation

#### 3.4.1 Paper Structure

```
Paper (e.g., "IELTS Academic Practice Test 1")
  ├── Reading Module
  ├── Listening Module
  ├── Writing Module
  └── Speaking Module (optional)
```

**Paper Metadata**:

- Title, paper type (IELTS Academic, IELTS General, OIETC, GRE)
- Instructions, created date, version
- Active/inactive status
- Module linking via foreign keys

#### 3.4.2 Module Types

##### Reading Module

- **Sections**: 3 passages (typically)
- **Content**: text-based passages with questions
- **Question Types**: MCQ, True/False/Not Given, matching, fill-in-the-blank
- **Total Questions**: 40
- **Auto-Grading**: Yes (objective questions)

##### Listening Module

- **Sections**: 4 audio sections
- **Content**: audio URL + transcript
- **Question Types**: MCQ, fill-in-the-blank, matching
- **Total Questions**: 40
- **Auto-Grading**: Yes (objective questions)

##### Writing Module

- **Tasks**: 2 (Task 1: 150 words, Task 2: 250 words)
- **Question Types**: Essay prompts
- **Total Questions**: 2
- **Manual Grading**: Yes (subjective evaluation)
- **Band Calculation**: (Task 1 × 1 + Task 2 × 2) / 3, rounded to nearest 0.5

##### Speaking Module

- **Tasks**: 3 parts (introduction, long turn, discussion)
- **Content**: prompts and follow-up questions
- **Manual Grading**: Yes (subjective evaluation)
- **Evaluation Criteria**: fluency, vocabulary, grammar, pronunciation

#### 3.4.3 Question Bank System

**Sub-Section Structure**:

- Each section contains multiple sub-sections
- Sub-sections group questions by type/topic
- Questions within sub-sections have:
  - `question_ref`: unique identifier (e.g., "Q1", "Q2")
  - `correct_answers`: JSONB field (supports strings, arrays, objects)
  - `options`: JSONB for MCQ choices
  - `marks`: default 1.0 per question
  - `explanation`: optional answer key

**Content Templates**:

- Text blocks with formatting support
- Image URL embedding
- Audio file linking (Supabase Storage)

---

### 3.5 Test Scheduling & Administration

#### 3.5.1 Test Creation

**Test Configuration**:

- Test name, date/time, duration per module
- Paper selection (links to existing paper)
- Student assignment (individual or batch)
- OTP generation for secure test access

**Test Lifecycle**:

- Draft → scheduled → in_progress → completed → evaluated

#### 3.5.2 Student Assignment

- **Individual Assignment**: select specific students
- **Batch Assignment**: assign entire grade/batch
- **OTP Distribution**: students use OTP to access test

#### 3.5.3 Test Execution (Student-Facing)

- **Module-by-Module Progression**: locked → pending → in_progress → completed
- **Timer Enforcement**: auto-submit on timeout
- **Answer Submission**: real-time saving to prevent data loss
- **Navigation**: prev/next question, review flagged questions

---

### 3.6 Grading & Review System

#### 3.6.1 Auto-Grading (Reading & Listening)

**Process**:

1. Student submits answers
2. System compares with `correct_answers` from question bank
3. Mark as correct/incorrect (case-insensitive matching)
4. Calculate total score (sum of marks_awarded)
5. Map to IELTS band score using conversion table

**Band Score Mapping** (for 40-question modules):
| Raw Score | Band Score |
|-----------|------------|
| 39-40 | 9.0 |
| 37-38 | 8.5 |
| 35-36 | 8.0 |
| 32-34 | 7.5 |
| 30-31 | 7.0 |
| 26-29 | 6.5 |
| 23-25 | 6.0 |
| 18-22 | 5.5 |
| 16-17 | 5.0 |
| 13-15 | 4.5 |
| 10-12 | 4.0 |
| < 10 | 3.5 |

#### 3.6.2 Manual Grading (Writing & Speaking)

**Grading Interface**:

- Side-by-side view: student response | grading controls
- Quick-grade buttons: correct/incorrect toggles
- Score input: 0-9 band scale with 0.5 increments
- Feedback text area: optional comments per task
- Batch save: update all changes in one transaction

**Writing Module Specifics**:

- Display Task 1 and Task 2 separately
- Individual band scores per task (0-9)
- Weighted band calculation shown in real-time
- Formula display: (Task 1 × 1 + Task 2 × 2) / 3

**Grading Workflow**:

1. Examiner navigates to Reviews page
2. Selects an attempt → clicks "Grade Module"
3. Reviews student responses
4. Assigns band scores (writing) or marks correct/incorrect (reading/listening)
5. Adds feedback (optional)
6. Clicks "Save" → single RPC call updates all answers + module status

#### 3.6.3 Review & Preview

**Reviews Listing**:

- Display all attempts for the center
- Filter by student, status, module type, date range
- Sort by created date, band score, completion status

**Attempt Preview**:

- Read-only view of student's full attempt
- Module navigation tabs (reading, listening, writing, speaking)
- Display scores, band scores, time spent
- Student response visibility with correct/incorrect indicators

---

### 3.7 Performance Analytics

#### 3.7.1 Student Dashboard (Future)

- Individual band score trends over time
- Module-wise performance breakdown
- Strengths and weaknesses analysis
- Comparison with peer averages

#### 3.7.2 Center Dashboard

- Tests conducted: total count, active tests
- Students enrolled: active, archived, passed
- Grading queue: pending reviews count
- Storage usage: current vs. quota

#### 3.7.3 Examiner Analytics (Future)

- Tests graded per examiner
- Average grading time per module type
- Consistency score (deviation from peer grading)

---

## 4. Technical Architecture

### 4.1 Technology Stack

**Frontend**:

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **State Management**: React Context API (AuthContext, CentreContext, etc.)
- **Form Handling**: React Hook Form (planned)
- **Notifications**: Sonner (toast notifications)

**Backend**:

- **Database**: Supabase PostgreSQL 17.6.1
- **Authentication**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (audio files, images)
- **Real-time**: Supabase Realtime (future feature)
- **Functions**: PostgreSQL RPC functions (PL/pgSQL)

**Infrastructure**:

- **Hosting**: Vercel (Next.js), Supabase (database)
- **CDN**: Vercel Edge Network
- **Region**: ap-southeast-1 (Singapore)

### 4.2 Database Schema

#### 4.2.1 Core Tables

**users**

```sql
user_id         UUID PRIMARY KEY
email           TEXT UNIQUE NOT NULL
role            user_role_enum (owner, admin, examiner)
full_name       TEXT NOT NULL
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**centers**

```sql
center_id       UUID PRIMARY KEY
name            TEXT NOT NULL
slug            TEXT UNIQUE NOT NULL
user_id         UUID REFERENCES users (owner)
status          verification_status (pending, verified, rejected)
subscription_tier TEXT DEFAULT 'basic'
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP
verified_at     TIMESTAMP
```

**center_members**

```sql
id              UUID PRIMARY KEY
center_id       UUID REFERENCES centers
user_id         UUID REFERENCES users
role            user_role_enum
created_at      TIMESTAMP
UNIQUE(center_id, user_id)
```

**student_profiles**

```sql
student_id      UUID PRIMARY KEY
center_id       UUID REFERENCES centers
name            TEXT
email           TEXT
phone           TEXT
date_of_birth   DATE
guardian        TEXT
guardian_phone  TEXT
address         TEXT
enrollment_type student_type_enum (regular, visitor, mock_only)
visitor_exam_date DATE
status          TEXT (active, cancelled, archived, passed)
tests_taken     INTEGER DEFAULT 0
enrolled_at     TIMESTAMP
updated_at      TIMESTAMP
```

**papers**

```sql
id              UUID PRIMARY KEY
center_id       UUID REFERENCES centers
title           TEXT NOT NULL
paper_type      TEXT (IELTS, OIETC, GRE)
instruction     TEXT
reading_module_id   UUID REFERENCES modules
listening_module_id UUID REFERENCES modules
writing_module_id   UUID REFERENCES modules
speaking_module_id  UUID REFERENCES modules
tests_conducted INTEGER DEFAULT 0
is_active       BOOLEAN DEFAULT false
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**modules**

```sql
id              UUID PRIMARY KEY
paper_id        UUID REFERENCES papers
center_id       UUID REFERENCES centers
module_type     TEXT (reading, listening, writing, speaking)
heading         TEXT
subheading      TEXT
instruction     TEXT
view_option     module_view_enum (public, private)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**sections**

```sql
id              UUID PRIMARY KEY
module_id       UUID REFERENCES modules
title           TEXT
section_index   INTEGER
content_type    TEXT (text, audio, image)
resource_url    TEXT (Supabase Storage URL)
content_text    TEXT
instruction     TEXT
params          JSONB
created_at      TIMESTAMP
```

**sub_sections**

```sql
id              UUID PRIMARY KEY
section_id      UUID REFERENCES sections
sub_section_index INTEGER
sub_type        TEXT
boundary_text   TEXT
content_template TEXT
resource_url    TEXT
instruction     TEXT
created_at      TIMESTAMP
```

**question_answers**

```sql
id              UUID PRIMARY KEY
sub_section_id  UUID REFERENCES sub_sections
question_ref    TEXT NOT NULL (e.g., "Q1", "Q2")
correct_answers JSONB (supports multiple answer formats)
options         JSONB (for MCQ)
explanation     TEXT
marks           FLOAT DEFAULT 1.0
created_at      TIMESTAMP
```

**scheduled_tests**

```sql
id              UUID PRIMARY KEY
center_id       UUID REFERENCES centers
paper_id        UUID REFERENCES papers
test_name       TEXT NOT NULL
test_date       TIMESTAMP
otp             INTEGER UNIQUE (6-digit)
status          TEXT (draft, scheduled, completed)
created_at      TIMESTAMP
```

**mock_attempts**

```sql
id              UUID PRIMARY KEY
student_id      UUID REFERENCES student_profiles
paper_id        UUID REFERENCES papers
scheduled_test_id UUID REFERENCES scheduled_tests
attempt_type    TEXT (full_mock, practice_sprint, single_module)
status          TEXT (in_progress, completed, evaluated, abandoned)
overall_band_score NUMERIC
started_at      TIMESTAMP
completed_at    TIMESTAMP
created_at      TIMESTAMP
```

**attempt_modules**

```sql
id              UUID PRIMARY KEY
attempt_id      UUID REFERENCES mock_attempts
module_id       UUID REFERENCES modules
module_type     TEXT (reading, listening, writing, speaking)
status          TEXT (locked, pending, in_progress, completed, timeout)
score_obtained  FLOAT DEFAULT 0
band_score      NUMERIC(3,1)
feedback        TEXT
time_spent_seconds INTEGER DEFAULT 0
time_remaining_seconds INTEGER DEFAULT 0
started_at      TIMESTAMP
completed_at    TIMESTAMP
created_at      TIMESTAMP
UNIQUE(attempt_id, module_id)
```

**student_answers**

```sql
id              UUID PRIMARY KEY
attempt_module_id UUID REFERENCES attempt_modules
reference_id    UUID (question_answers.id)
question_ref    TEXT NOT NULL (e.g., "Q1")
student_response TEXT
is_correct      BOOLEAN
marks_awarded   NUMERIC
created_at      TIMESTAMP
UNIQUE(attempt_module_id, reference_id, question_ref)
```

#### 4.2.2 Indexes (Performance-Critical)

```sql
-- Foreign key indexes (all critical paths)
CREATE INDEX idx_centers_user_id ON centers(user_id);
CREATE INDEX idx_center_members_user_id ON center_members(user_id);
CREATE INDEX idx_student_profiles_center_id ON student_profiles(center_id);
CREATE INDEX idx_papers_center_id ON papers(center_id);
CREATE INDEX idx_modules_center_id ON modules(center_id);
CREATE INDEX idx_modules_paper_id ON modules(paper_id);
CREATE INDEX idx_sections_module_id ON sections(module_id);
CREATE INDEX idx_sub_sections_section_id ON sub_sections(section_id);
CREATE INDEX idx_question_answers_sub_section_id ON question_answers(sub_section_id);
CREATE INDEX idx_mock_attempts_student_id ON mock_attempts(student_id);
CREATE INDEX idx_mock_attempts_paper_id ON mock_attempts(paper_id);
CREATE INDEX idx_mock_attempts_scheduled_test_id ON mock_attempts(scheduled_test_id);
CREATE INDEX idx_attempt_modules_module_id ON attempt_modules(module_id);
CREATE INDEX idx_answers_module ON student_answers(attempt_module_id);

-- Composite indexes for common queries
CREATE INDEX idx_attempts_student_type ON mock_attempts(student_id, attempt_type);
CREATE INDEX idx_sub_sections_section_idx ON sub_sections(section_id, sub_section_index);
CREATE INDEX idx_papers_module_ids ON papers(reading_module_id, listening_module_id, writing_module_id, speaking_module_id);
```

### 4.3 Row-Level Security (RLS) Policies

**Key Principles**:

- All policies use `(select auth.uid())` and `(select auth.jwt())` for performance (avoids per-row re-evaluation)
- Center isolation enforced at database level
- Students can only access their own data
- Owners/admins can access all center data
- Examiners have read-only access to assigned modules

**Example Policy** (student_answers):

```sql
CREATE POLICY "Center Owners can manage answers" ON student_answers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM attempt_modules am
    JOIN mock_attempts ma ON am.attempt_id = ma.id
    JOIN student_profiles sp ON ma.student_id = sp.student_id
    JOIN centers c ON sp.center_id = c.center_id
    WHERE am.id = student_answers.attempt_module_id
    AND c.user_id = (select auth.uid())
  )
);
```

### 4.4 Optimized RPC Functions

#### 4.4.1 `get_center_reviews(p_center_id UUID)`

**Purpose**: Fetch all mock attempts with modules and metadata for a center  
**Returns**: JSONB array of attempts  
**Optimizations**:

- Single query with nested aggregation
- Avoids N+1 queries
- Returns answer count instead of full answer data for listing view

#### 4.4.2 `get_grading_data(p_attempt_module_id UUID)`

**Purpose**: Fetch complete grading data for a module including correct answers  
**Returns**: JSONB object with module, student, answers, and correct answers  
**Optimizations**:

- Joins question_answers to get correct answers in one query
- Handles JSONB correct_answers format variations
- Includes all metadata needed for grading UI

#### 4.4.3 `get_attempt_preview(p_attempt_id UUID)`

**Purpose**: Fetch full attempt details for preview (read-only view)  
**Returns**: JSONB object with all modules and answers  
**Optimizations**:

- Single query with nested JSON aggregation
- Includes student profile and paper title

#### 4.4.4 `save_grades(p_module_id UUID, p_answers JSONB, p_feedback TEXT)`

**Purpose**: Batch update student answers and calculate band scores  
**Returns**: JSONB with success status, scores, and updated count  
**Features**:

- Handles writing (weighted), reading, and listening (IELTS table)
- Batch UPDATE using JSONB array
- Auto-calculates and updates band_score and score_obtained
- Single transaction (atomic operation)

#### 4.4.5 `batch_update_grades(p_module_id UUID, p_answers JSONB, p_feedback TEXT)`

**Purpose**: Legacy function for reading/listening auto-grading  
**Status**: Superseded by `save_grades` (kept for backward compatibility)

#### 4.4.6 `get_module_questions_for_view(p_attempt_id UUID, p_module_id UUID)`

**Purpose**: Fetch questions for a module with RLS bypass  
**Security**: SECURITY DEFINER with attempt validation  
**Returns**: JSONB array of questions with correct answers

---

## 5. User Flows

### 5.1 Center Onboarding Flow

1. User registers with email/password
2. Email verification (Supabase Auth)
3. Create first center (name, slug)
4. Center status → pending (admin verification required)
5. Admin approves → status → verified
6. User can now create papers, add students, schedule tests

### 5.2 Paper Creation Flow

1. Owner/Admin navigates to Papers page
2. Clicks "Create Paper" → enters title, type, instructions
3. Creates modules:
   - **Reading**: Add 3 sections → upload passages → add questions
   - **Listening**: Add 4 sections → upload audio → add questions
   - **Writing**: Add 2 tasks → define prompts
   - **Speaking**: Add 3 parts → define prompts
4. Link modules to paper
5. Activate paper → ready for test scheduling

### 5.3 Test Scheduling Flow

1. Admin navigates to Tests page
2. Clicks "Create Test" → selects paper, date/time
3. Assigns students (individual or batch)
4. Generates OTP
5. Distributes OTP to students (email/SMS/manual)
6. Students use OTP to access test on test day

### 5.4 Test Taking Flow (Student)

1. Student navigates to test URL + enters OTP
2. System validates OTP → loads attempt
3. Modules display in order (reading → listening → writing → speaking)
4. Student progresses module-by-module:
   - Timer starts on module unlock
   - Answer questions (auto-save on each change)
   - Submit module → status → completed
5. All modules completed → attempt status → completed
6. Auto-grading runs for reading/listening
7. Examiner grades writing/speaking manually

### 5.5 Grading Flow (Examiner)

1. Examiner navigates to Reviews page
2. Filters by pending status
3. Selects attempt → views module
4. Clicks "Grade Module"
5. **For Writing/Speaking**:
   - Reviews student responses
   - Assigns band scores (0-9, 0.5 increments)
   - Adds feedback (optional)
   - Clicks "Save" → RPC updates scores + status
6. **For Reading/Listening** (if manual override needed):
   - Reviews auto-graded answers
   - Toggles correct/incorrect if needed
   - Clicks "Save" → RPC recalculates band score
7. All modules graded → attempt status → evaluated

---

## 6. Performance Requirements

### 6.1 Response Time Targets

| Operation                 | Target  | Max Acceptable |
| ------------------------- | ------- | -------------- |
| Page load (initial)       | < 1.5s  | 3s             |
| Reviews listing           | < 500ms | 1s             |
| Grading data load         | < 500ms | 1s             |
| Save grades               | < 1s    | 2s             |
| Student answer submission | < 200ms | 500ms          |
| Paper creation            | < 2s    | 5s             |

### 6.2 Scalability Targets

- **Concurrent Users**: 500+ per center
- **Database Queries**: < 50ms p95 latency
- **RPC Functions**: < 100ms p95 execution time
- **API Requests**: 1000+ req/min per instance
- **Storage**: 10GB free tier, expandable to 100GB+

### 6.3 Optimization Strategies

✅ **Implemented**:

- 13 database indexes on foreign keys
- RLS policy optimization (select auth.uid() caching)
- 4 optimized RPC functions (1-query replacements)
- Batch updates for grading (no for-loop UPDATEs)
- Local state updates (no re-fetch after save)

🔄 **Planned**:

- Redis caching for frequently accessed data (papers, modules)
- CDN for static assets (images, audio files)
- Database connection pooling via Supabase Pooler
- Lazy loading for large question lists
- Pagination for reviews listing (currently loads all)

---

## 7. Security & Compliance

### 7.1 Authentication Security

- **Password Requirements**: min 8 chars, enforced by Supabase Auth
- **Session Management**: JWT tokens with auto-refresh
- **CSRF Protection**: Built-in Next.js middleware
- **Rate Limiting**: Supabase Auth built-in protection

### 7.2 Data Security

- **Row-Level Security (RLS)**: All tables have RLS policies
- **SQL Injection**: Prevented via parameterized queries
- **XSS Protection**: React auto-escaping + CSP headers
- **Data Encryption**: At-rest (Supabase) and in-transit (TLS 1.3)

### 7.3 Privacy & GDPR

- **Data Minimization**: Only essential student data collected
- **Right to Erasure**: Student deletion → cascade to all related data
- **Data Portability**: Export functionality (future)
- **Consent Management**: Enrollment implies consent (documented)

### 7.4 Backup & Recovery

- **Database Backups**: Supabase daily automated backups (7-day retention)
- **Point-in-Time Recovery**: Available via Supabase
- **Disaster Recovery Plan**: documented SOP for data restoration

---

## 8. Future Roadmap

### 8.1 Q2 2026 (Apr-Jun)

- [ ] Student-facing dashboard with test history
- [ ] Email notifications (test reminders, results ready)
- [ ] PDF report generation (individual + batch)
- [ ] Advanced filtering on reviews page (by module type, date range, band score)

### 8.2 Q3 2026 (Jul-Sep)

- [ ] Speaking module with video recording
- [ ] AI-assisted writing evaluation (GPT-4 integration)
- [ ] Mobile app (React Native) for students
- [ ] Payment integration (Stripe) for subscription tiers

### 8.3 Q4 2026 (Oct-Dec)

- [ ] Analytics dashboard with charts and trends
- [ ] White-label branding for centers
- [ ] API for third-party integrations
- [ ] Multi-language support (Bengali, Hindi, Arabic)

### 8.4 2027 Goals

- [ ] Adaptive testing (difficulty adjustment)
- [ ] Live proctoring via video call
- [ ] Marketplace for question banks
- [ ] Enterprise tier with dedicated support

---

## 9. Success Metrics

### 9.1 Product KPIs

- **User Adoption**:
  - Centers onboarded: 100+ in year 1
  - Active students: 10,000+ in year 1
  - Tests conducted: 50,000+ in year 1

- **Engagement**:
  - Average tests per student: 5+
  - Examiner grading time: < 10 min per writing module
  - User retention rate: 80%+ MoM

- **Performance**:
  - P95 page load time: < 2s
  - Database CPU usage: < 20% average
  - Error rate: < 0.1%

- **Business**:
  - Monthly Recurring Revenue (MRR): $10,000+ by EOY 2026
  - Customer Acquisition Cost (CAC): < $200
  - Lifetime Value (LTV): > $2,000
  - Churn rate: < 5% monthly

### 9.2 Quality Metrics

- **Code Coverage**: 80%+ (unit + integration tests)
- **Accessibility**: WCAG 2.1 AA compliance
- **Uptime**: 99.9% SLA
- **Security Audits**: Quarterly penetration testing

---

## 10. Risks & Mitigation

### 10.1 Technical Risks

| Risk                             | Impact | Probability | Mitigation                                               |
| -------------------------------- | ------ | ----------- | -------------------------------------------------------- |
| Supabase outage                  | High   | Low         | Multi-region failover, status page monitoring            |
| Database performance degradation | High   | Medium      | Continuous monitoring, query optimization, read replicas |
| Audio file corruption            | Medium | Low         | Checksum validation, backup storage                      |
| Browser compatibility issues     | Medium | Medium      | Automated cross-browser testing                          |

### 10.2 Business Risks

| Risk                                 | Impact | Probability | Mitigation                                     |
| ------------------------------------ | ------ | ----------- | ---------------------------------------------- |
| Competition from established players | High   | High        | Focus on user experience, competitive pricing  |
| Regulatory changes (data privacy)    | Medium | Low         | Legal consultation, compliance monitoring      |
| Low user adoption                    | High   | Medium      | Freemium model, referral program, partnerships |
| Churn due to missing features        | Medium | Medium      | Regular user feedback, rapid iteration         |

### 10.3 Operational Risks

| Risk                         | Impact | Probability | Mitigation                                      |
| ---------------------------- | ------ | ----------- | ----------------------------------------------- |
| Customer support overload    | Medium | Medium      | Self-service documentation, chatbot integration |
| Key team member departure    | High   | Low         | Knowledge documentation, cross-training         |
| Infrastructure cost overruns | Medium | Medium      | Usage-based alerts, cost optimization reviews   |

---

## 11. Dependencies & Constraints

### 11.1 External Dependencies

- **Supabase Platform**: Database, Auth, Storage, Realtime
- **Vercel**: Hosting, CDN, Edge Functions
- **Third-party APIs**: Email (Resend/SendGrid), SMS (Twilio - planned)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 11.2 Technical Constraints

- **Supabase Free Tier Limits**:
  - 500MB database size
  - 1GB file storage
  - 2GB bandwidth/month
  - 50,000 monthly active users
- **Next.js Edge Runtime**: No Node.js APIs in edge functions
- **PostgreSQL Row Limit**: 100,000+ rows may require partitioning

### 11.3 Business Constraints

- **Budget**: $500/month infrastructure costs (target)
- **Team Size**: 2-3 developers (current)
- **Timeline**: MVP launched Q1 2026 ✅
- **Market**: South Asia focus (Bangladesh, India, Pakistan initially)

---

## 12. Glossary

| Term           | Definition                                                                |
| -------------- | ------------------------------------------------------------------------- |
| **IELTS**      | International English Language Testing System                             |
| **Band Score** | IELTS scoring scale from 0-9 in 0.5 increments                            |
| **Mock Test**  | Practice test simulating real IELTS exam conditions                       |
| **Module**     | One of four IELTS test components (reading, listening, writing, speaking) |
| **Attempt**    | A student's completed or in-progress test session                         |
| **RLS**        | Row-Level Security (PostgreSQL feature for access control)                |
| **RPC**        | Remote Procedure Call (database function called from client)              |
| **OTP**        | One-Time Password (6-digit code for test access)                          |
| **Center**     | Test preparation institution using the platform                           |
| **Slug**       | URL-friendly identifier (e.g., "abc-ielts-center")                        |
| **Examiner**   | Staff member who grades subjective responses                              |

---

## 13. Appendices

### Appendix A: API Reference

_To be documented in separate API.md file_

### Appendix B: Database Migration History

_Tracked in Supabase migrations folder_

### Appendix C: User Research Findings

_To be documented as research is conducted_

### Appendix D: Competitive Analysis

- **IELTS Liz**: Free resources, no test platform
- **Cambridge IELTS**: Official materials, no grading
- **IELTS Online Tests**: Limited features, outdated UI
- **British Council IELTS**: Official tests, expensive

**SuperMock Differentiators**:

- ✅ Full test lifecycle (creation → grading → analytics)
- ✅ Multi-center management
- ✅ Optimized performance (sub-second grading)
- ✅ Affordable SaaS pricing

---

**Document End**

_For questions or updates, contact: [redacted]_

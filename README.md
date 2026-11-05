# Nemo Student Life

NEMO — Complete Product Design & Development Master Prompt



1. PROJECT OVERVIEW



Build a complete, modern, responsive, AI-powered university student productivity platform called NEMO.



Brand tagline: Your University Life, Under Control.



NEMO is an intelligent academic operating system designed to help university students organize their entire academic and personal lives in one connected workspace.



It combines:



- AI-powered personal academic assistance.

- University task and schedule management.

- Course and study material organization.

- Flashcards and active learning.

- Pomodoro and focus tracking.

- Smart reminders and countdowns.

- Personal productivity analytics.

- Gamified studying through collectible animals.

- Personal virtual zoo.

- Multiplayer study rooms and shared experiences.



NEMO must feel like a polished commercial SaaS product, not a generic task management template.



The experience should be visually beautiful, calm, lively, intuitive, and genuinely useful for everyday university life.



Important product principle: Every major feature must be connected to the others. NEMO should understand the student's academic context and help manage it through one unified system.



---



2. BRAND IDENTITY AND VISUAL DIRECTION



The NEMO Mascot



NEMO is represented by a small, adorable RED OCTOPUS.



This is the official mascot and central visual identity of the platform.



Design requirements:



- Small, rounded, friendly red octopus.

- Eight recognizable tentacles.

- Expressive eyes.

- Cute but sophisticated appearance.

- Soft 3D-inspired illustration style.

- Consistent proportions and recognizable silhouette.

- Avoid overly childish cartoon aesthetics.



The mascot should appear throughout the application:



- Welcome screen.

- AI assistant.

- Loading states.

- Empty states.

- Study session completion.

- Achievement celebrations.

- Animal discovery moments.

- Daily encouragement messages.



Create several visual states for Nemo:



1. Default friendly expression.

2. Thinking.

3. Happy.

4. Studying.

5. Celebrating.

6. Sleeping/resting.

7. Surprised.

8. Encouraging.



Use subtle animations and micro-interactions.



Do not use unrelated octopus illustrations or randomly change the mascot's appearance across pages.



Visual Design



Create a premium, clean, modern visual identity.



The interface should be:



- Minimal but not empty.

- Warm but not childish.

- Functional but visually interesting.

- Spacious and easy to navigate.

- Consistent across all pages.



Light Mode Palette



Use a warm, soft color palette:



- Warm ivory background: #F8F7F2

- White cards: #FFFFFF

- Primary sage green: #8BAE9B

- Deep sage: #547B68

- Soft lavender: #EAE4F3

- Pale peach: #F4E3D9

- Muted sky blue: #E3ECF5

- Primary text: #252A29

- Secondary text: #858B87

- Borders: #EAEAE5



Dark Mode Palette



Create a complete dark theme:



- Main background: #171A1B

- Secondary background: #202526

- Cards: #272D2E

- Primary text: #F1F2EF

- Secondary text: #A3AAA5

- Muted lavender and sage accents.



Dark mode must be designed intentionally, not simply created by inverting colors.



UI Style



- Rounded cards with moderate corner radius.

- Soft, subtle shadows.

- Thin, elegant borders.

- Clear visual hierarchy.

- Consistent spacing.

- Modern typography.

- Lucide icons.

- Beautiful empty states.

- Smooth transitions.

- No excessive gradients.

- No excessive glassmorphism.

- No overcrowded dashboards.



Use a professional font combination:



- English: Inter or Plus Jakarta Sans.

- Arabic: IBM Plex Sans Arabic or a similarly clear Arabic font.



Typography must remain readable at all screen sizes.



---



3. RESPONSIVE LAYOUT



The application must work beautifully on:



1. Desktop computers.

2. Laptops.

3. Tablets and iPads.

4. Mobile phones.



Desktop Layout



Use a collapsible left sidebar.



Sidebar sections:



MAIN



- My Day

- Calendar

- Tasks

- Reminders

- Countdown

- Events



ACADEMIC



- My Courses

- Flashcards & Study Studio

- Statistics



FOCUS & SOCIAL



- Focus Room

- Study Together

- My Zoo

- Nemo's World



BOTTOM



- Ask Nemo

- Settings

- Profile



The sidebar must:



- Support collapsed and expanded states.

- Display clear active navigation.

- Include the Nemo brand identity.

- Include a language switcher and theme switcher.

- Maintain consistent navigation throughout the app.



Mobile Layout



Use a mobile-first bottom navigation with the most important destinations:



- Home

- Tasks

- Courses

- Focus

- Nemo



Secondary pages should be accessible through a More menu.



Ensure that all functionality remains available on mobile.



---



4. INTERNATIONALIZATION — ARABIC AND ENGLISH



This is a mandatory core requirement.



Implement complete bilingual functionality.



The user must be able to switch between:



- English.

- Arabic.



Place a visible language selector in the interface and Settings.



Arabic Requirements



When Arabic is selected:



- Switch the entire interface to RTL.

- Reverse sidebar positioning.

- Reverse directional icons where appropriate.

- Align Arabic text correctly.

- Support Arabic dates and numbers where appropriate.

- Ensure calendars and forms are RTL-compatible.

- Use a suitable Arabic font.

- Preserve correct layout and spacing.



When English is selected:



- Switch the interface to LTR.

- Restore English alignment and navigation.



The language preference must persist after refresh and login.



All interface labels, tooltips, errors, buttons, notifications, empty states, onboarding screens, and AI interface elements must be translated.



Do not translate only the main navigation while leaving other screens in English.



Allow the user to select:



- Interface language.

- Date format.

- 12-hour or 24-hour time.

- Preferred first day of the week.



Use a proper localization structure rather than hardcoding text throughout components.



---



5. AUTHENTICATION AND ONBOARDING



Build a polished onboarding experience.



Authentication



Support:



- Email registration.

- Email login.

- Password recovery.

- Google authentication if configured.

- Secure session management.



First-Time Onboarding



Ask the user for:



1. Full name or preferred display name.

2. University name.

3. Academic major.

4. Current semester.

5. Number of courses.

6. Preferred language.

7. Preferred theme.

8. Study goals.

9. Preferred study session duration.



Allow users to skip optional questions.



After onboarding, show a welcoming screen featuring the red Nemo mascot.



Example:



"Welcome to NEMO! Your university life is about to become a little more organized."



---



6. MY DAY — MAIN DASHBOARD



This is the most important page.



It should provide a complete overview of the student's day.



A. Welcome Header



Display:



- Personalized greeting.

- Student's name.

- Current date.

- Hijri date option.

- Nemo mascot.

- Short motivational message.



B. Daily Quran Verse



Display one authentic Quranic verse when the user opens the application for the first time each day.



Requirements:



- Use a verified Quran source or verified Quran dataset.

- Display Arabic text accurately.

- Display Surah name and verse number.

- Optional translation.

- Never generate or modify Quranic text using AI.

- Allow the user to disable this feature.

- Avoid changing the verse every time the user navigates between pages.



Design this section elegantly and respectfully.



C. Daily Overview Cards



Display:



- Tasks completed.

- Tasks remaining.

- Today's lectures.

- Upcoming deadlines.

- Upcoming exams.

- Focus time.

- Daily completion percentage.



Cards should be clickable and lead to relevant sections.



D. Today's Schedule



Display a chronological timeline containing:



- University lectures.

- Assignments.

- Study sessions.

- Events.

- Personal appointments.



Support current-time indicators.



E. Today's Tasks



Display prioritized tasks with:



- Completion checkbox.

- Priority label.

- Deadline.

- Associated course.

- Quick edit.

- Quick completion.



F. Upcoming Countdown



Display the nearest important upcoming event or exam.



G. Nemo Daily Insight



Create a small AI-generated insight section.



Example:



"You have two lectures today and one unfinished assignment. Consider completing your assignment before your evening study session."



Insights must be based on actual user data.



H. Quick Actions



Include:



- Add Task.

- Add Event.

- Add Reminder.

- Start Pomodoro.

- Create Flashcards.

- Ask Nemo.



---



7. NEMO AI — INTELLIGENT ACADEMIC AGENT



Nemo is the central AI assistant of the platform.



IMPORTANT: Nemo must not be implemented as a simple chatbot that only generates text.



Nemo must have controlled access to the application's data and authorized actions.



Build a beautiful chat interface with:



- Nemo red octopus avatar.

- Conversation history.

- Suggested prompts.

- Text input.

- Send button.

- Markdown responses.

- Loading states.

- Action confirmation cards.

- Clear tool execution feedback.



Voice interaction is NOT part of the current scope.



AI Capabilities



Nemo should be able to:



Read Data



- Read the student's calendar.

- Read tasks.

- Read reminders.

- Read upcoming events.

- Read countdowns.

- Read course names and information.

- Read permitted course notes and files.

- Read study statistics.

- Read focus session history.



Create Data



- Create tasks.

- Create reminders.

- Create calendar events.

- Create countdowns.

- Create study plans.

- Generate flashcards.

- Create quizzes.

- Organize tasks into subtasks.



Update Data



- Edit task deadlines.

- Change task priorities.

- Reschedule tasks.

- Modify reminders.

- Update events.

- Adjust study plans.



Delete Data



Allow deletion only after explicit user confirmation.



Example AI Interactions



Student:



"Nemo, I have a Biochemistry exam on November 20, covering five chapters. Help me prepare."



Nemo should:



1. Ask for missing information if necessary.

2. Create an exam event.

3. Create a countdown.

4. Generate a suggested study schedule.

5. Create study reminders.

6. Offer to generate flashcards.

7. Show a summary of the proposed actions.



Student:



"What do I have tomorrow?"



Nemo reads the actual calendar and task records and provides an accurate summary.



Student:



"I have three free hours today. Organize my studying."



Nemo:



- Reads available time.

- Checks deadlines.

- Checks study priorities.

- Suggests a realistic schedule.

- Avoids overlapping existing events.

- Asks permission before committing major changes.



Student:



"I couldn't finish today's tasks. Move the remaining tasks to tomorrow."



Nemo should reschedule them while preserving deadlines and existing commitments.



Required AI Tool Architecture



Implement controlled function calling.



Suggested tools:



- get_daily_summary

- get_schedule

- get_tasks

- create_task

- update_task

- delete_task

- create_event

- update_event

- create_reminder

- get_countdowns

- create_countdown

- generate_study_plan

- create_flashcards

- get_course_content

- get_focus_statistics



Every operation must be validated on the backend.



Never allow the AI to access another student's private information.



Do not expose API keys in frontend code.



If the AI provider or API key is not configured, display a clear setup state rather than pretending the AI is working.



---



8. TASK MANAGEMENT



Build a complete university-focused task manager.



Task Categories



- University.

- Studying.

- Personal.

- Projects.

- Activities.

- Other.



Task Properties



Each task should contain:



- Title.

- Description.

- Category.

- Associated course.

- Priority.

- Due date.

- Due time.

- Estimated duration.

- Status.

- Subtasks.

- Attachments.

- Created date.

- Completion date.



Priority Levels



- Low.

- Medium.

- High.

- Urgent.



Task Statuses



- Not Started.

- In Progress.

- Completed.

- Overdue.



Views



- My Day.

- Upcoming.

- All Tasks.

- Overdue.

- Completed.

- Calendar View.

- Kanban Board.



Include:



- Search.

- Filtering.

- Sorting.

- Drag and drop where appropriate.

- Bulk actions.

- Quick task creation.



When a task is completed, update relevant statistics.



If a task becomes overdue, allow Nemo to suggest rescheduling.



---



9. ACADEMIC CALENDAR



Build a complete interactive calendar.



Calendar Views



- Day.

- Week.

- Month.



Event Types



- Lectures.

- Exams.

- Quizzes.

- Assignment deadlines.

- Project deadlines.

- Study sessions.

- Personal events.

- University activities.



Event Properties



- Event title.

- Course.

- Description.

- Date.

- Start time.

- End time.

- Location.

- Color.

- Recurrence.

- Reminder settings.



Support:



- Weekly recurring lectures.

- Event editing.

- Event deletion.

- Drag and drop rescheduling.

- Color coding by course.

- Conflict detection.

- Calendar filtering.



Allow students to manually enter their university timetable.



File or image timetable import can be added later; do not make it a dependency for the working calendar.



---



10. MY COURSES — ACADEMIC WORKSPACE



This is a major part of the application.



Each course should work like an independent digital folder.



Courses Dashboard



Display beautiful course cards.



Each card includes:



- Course name.

- Course code.

- Course color.

- Instructor name (optional).

- Semester.

- Number of files.

- Number of notes.

- Pending assignments.

- Study progress.



Allow:



- Create course.

- Edit course.

- Delete course.

- Archive course.

- Customize course color.

- Add course description.



Inside Each Course



Create a dedicated course workspace.



Sections:



1. Overview.

2. Lecture Notes.

3. Documents.

4. Videos.

5. Audio Recordings.

6. My Notes.

7. Assignments.

8. Flashcards.

9. Quizzes.

10. External Resources.



File Management



Allow uploads of supported file types:



- PDF.

- DOCX.

- PPTX.

- TXT.

- Images.

- MP3.

- M4A.

- WAV.

- MP4 and other supported video formats.



The exact upload limits must be configured based on storage capacity.



Students must be able to:



- Upload files.

- Rename files.

- Delete files.

- Download files.

- Preview supported files.

- Organize files into subfolders.

- Add descriptions.

- Search within their file library.



Audio files should be stored and playable through an audio player.



Video files should be viewable through an appropriate player.



IMPORTANT:



For the current version, course audio recordings are storage and playback resources only. Do not implement automatic lecture transcription, audio summarization, or automatic lecture intelligence.



Course Notes



Create an integrated rich-text note editor.



Support:



- Headings.

- Paragraphs.

- Bulleted lists.

- Numbered lists.

- Checklists.

- Links.

- Images.

- Formatting.

- Autosave.



Allow multiple notes inside each course.



Course Progress



Display:



- Tasks completed.

- Flashcards studied.

- Notes created.

- Study sessions completed.



---



11. FLASHCARDS & STUDY STUDIO



Build a dedicated study environment.



Flashcard Creation



Allow users to:



- Create flashcards manually.

- Edit cards.

- Delete cards.

- Organize cards into decks.

- Associate decks with courses.

- Add tags.

- Import supported text-based study content.



AI-generated flashcards should be supported when the AI integration is configured.



Flashcard Interface



Create beautiful interactive cards.



Features:



- Flip animation.

- Front and back.

- Previous and next.

- Shuffle.

- Mark as difficult.

- Mark as known.

- Study progress.



Spaced Repetition



Implement FSRS-compatible review scheduling.



Organize cards into:



- New.

- Learning.

- Due Today.

- Review.

- Mastered.



Display upcoming reviews.



Quiz Generator



When AI is configured, allow students to generate practice questions from permitted course materials.



Question types:



- Multiple Choice.

- True or False.

- Short Answer.

- Matching.



Provide:



- Correct answers.

- Explanations.

- Results.

- Score.

- Weak-topic analysis.



Do not present AI-generated answers as guaranteed correct.



---



12. POMODORO & FOCUS ROOM



Create a visually beautiful focus timer.



Preset Modes



- Pomodoro: 25 minutes focus / 5 minutes break.

- Deep Focus: 50 minutes focus / 10 minutes break.

- Custom Timer.



Features



- Start.

- Pause.

- Resume.

- Reset.

- Skip break.

- Long break.

- Session history.

- Link sessions to a task or course.

- Daily focus goals.

- Weekly focus statistics.



Focus Mode



When activated:



- Hide unnecessary navigation.

- Display a large timer.

- Display current task.

- Show subtle progress animation.

- Allow ambient sounds optionally.

- Display Nemo mascot in a calm studying state.



Avoid unnecessary distractions.



Track actual completed focus time, not merely time the page remains open.



---



13. REMINDERS



Build an independent reminder management system.



Reminder Types



- Academic.

- Personal.

- Health and daily habits.

- Projects.

- Other.



Reminder Properties



- Title.

- Description.

- Category.

- Priority.

- Date.

- Time.

- Repeat settings.

- Associated task or course.

- Completion status.



Features



- One-time reminders.

- Daily reminders.

- Weekly reminders.

- Custom recurring reminders.

- Snooze.

- Complete.

- Edit.

- Delete.



Support browser notifications with permission-based onboarding.



Also show in-app notifications.



Do not claim that a notification was delivered if browser or device permissions are unavailable.



---



14. COUNTDOWN



Create a dedicated countdown section.



Users can create countdowns for:



- Midterm Exams.

- Final Exams.

- Assignments.

- Projects.

- Graduation.

- Scholarships.

- Personal Events.



Each countdown card should show:



- Event name.

- Remaining days.

- Remaining hours when relevant.

- Event date.

- Category.

- Color.

- Optional associated course.



Use live date calculations.



Show important countdowns on the main dashboard.



Allow customization and sorting.



---



15. EVENTS



Create a separate event management section.



Support:



- Conferences.

- Workshops.

- Seminars.

- Student club activities.

- Meetings.

- Registration deadlines.

- Personal events.



Event details:



- Name.

- Description.

- Date.

- Time.

- Location.

- Registration link.

- Related course or organization.

- Reminder settings.



Provide calendar and list views.



---



16. STATISTICS & PRODUCTIVITY ANALYTICS



Build a visually appealing analytics dashboard.



Track:



- Total focus hours.

- Daily focus time.

- Weekly focus time.

- Monthly focus time.

- Completed tasks.

- Task completion rate.

- Study sessions.

- Course-specific study time.

- Flashcards reviewed.

- Daily goal completion.

- Weekly consistency.



Include:



- Bar charts.

- Line charts.

- Progress indicators.

- Weekly summaries.

- Monthly summaries.

- Course comparisons.



Avoid misleading metrics.



Clearly distinguish actual recorded focus time from scheduled study time.



Allow students to select date ranges.



Nemo should be able to summarize these statistics when asked.



---



17. GAMIFICATION — NEMO'S WORLD



This is a core identity feature of the platform.



Create a beautiful collectible animal world inspired by cozy virtual pet and nature-building games.



The core idea:



The more consistently a student completes reasonable focus sessions and academic goals, the more the student's world develops.



Do not copy Forest's artwork, characters, or interface.



Build an original NEMO world.



A. Pearls Reward Currency



Students earn Pearls by completing focus sessions.



Example starting reward structure:



- 25-minute completed session: 10 Pearls.

- 50-minute completed session: 25 Pearls.

- Completing a daily focus goal: Bonus reward.

- Completing a weekly goal: Special reward.



These values should be configurable.



Important reward rules:



- Count completed, verified focus sessions.

- Set reasonable daily reward limits.

- Prevent duplicate rewards.

- Prevent timer manipulation.

- Do not reward excessive study duration.

- Do not punish rest days.

- Never make students feel pressured to study continuously.



B. Animal Collection



Create animal categories:



- Forest Animals.

- Ocean Animals.

- Snow Animals.

- Fantasy Animals.

- Rare Animals.



Each animal has:



- Name.

- Image or illustration.

- Rarity.

- Description.

- Habitat.

- Unlock requirements.

- Discovery date.

- Collection status.



Rarity levels:



- Common.

- Rare.

- Epic.

- Legendary.



Students can:



- Discover animals.

- View collected animals.

- Name animals.

- View animal details.

- Unlock habitats.

- View undiscovered animals as silhouettes.



Build a collection journal called Discovery Journal.



C. My Zoo



Create a beautiful personal virtual zoo.



Students should be able to:



- Place collected animals.

- Arrange habitats.

- Add trees.

- Add flowers.

- Add decorations.

- Add ponds.

- Customize the environment.

- Name their zoo.

- View their collection.



The zoo should feel like a cozy, living environment.



Use original illustrated assets and consistent visual quality.



Avoid a generic grid of static emoji.



D. Habitats



Create:



- Forest.

- Ocean.

- Snow Valley.

- Magic Garden.



Each habitat should have a distinct environment and animal collection.



Unlock new habitats through reasonable progression.



E. Animal Discovery Rewards



Show beautiful discovery animations when an animal is unlocked.



Include:



- Animal reveal.

- Name.

- Rarity.

- Discovery date.

- Short celebratory animation.



---



18. STUDY TOGETHER — MULTIPLAYER STUDY ROOMS



Build a social study experience.



Students should be able to:



- Create private study rooms.

- Invite friends.

- Join rooms using invitation links or codes.

- Leave rooms.

- View room members.

- See member study status.

- Start individual focus sessions.

- Start synchronized group Pomodoro sessions.

- Set shared goals.



Suggested maximum room size: 8 members.



Room Interface



Display:



- Room name.

- Room members.

- Individual focus timers.

- Studying / On Break status.

- Group focus timer.

- Shared goals.

- Group achievements.



Shared Zoo



Each study room can have its own shared collection.



Rules:



- Personal animals remain owned by their original user.

- Shared room animals belong to the room.

- Shared rewards are earned through verified group participation.

- Room members can view shared achievements.



Implement basic room privacy, membership permissions, and member removal.



Include reporting and blocking functionality.



Do not expose private course files, personal schedules, or private AI conversations to room members.



---



19. NEMO MEMORY



Create a controlled persistent memory system.



Nemo should be able to maintain useful academic context, including:



- Student's courses.

- Study preferences.

- Upcoming exams.

- Existing study plans.

- Relevant task history.

- User-approved preferences.



Separate:



- Structured academic records.

- AI conversation history.

- Optional remembered preferences.



Allow the user to review and delete saved AI context.



Never allow Nemo to silently access unrelated private data.



---



20. SETTINGS



Create a complete settings area.



Account



- Name.

- Email.

- Profile image.

- Password.

- Account management.



Appearance



- Light mode.

- Dark mode.

- System default.

- Accent color options.



Language



- Arabic.

- English.



Preferences



- Date format.

- Time format.

- First day of the week.

- Calendar preferences.



Notifications



- Enable/disable browser notifications.

- Reminder preferences.

- Daily summary preferences.

- Study reminders.



Privacy



- Account visibility.

- Study room permissions.

- AI memory controls.

- Data export.

- Account deletion.



---



21. TECHNICAL ARCHITECTURE



Build this as a real full-stack application.



Recommended stack:



Frontend:



- React.

- TypeScript.

- Tailwind CSS.

- Modern component architecture.

- Lucide icons.



Backend:



- Supabase.

- PostgreSQL.

- Supabase Authentication.

- Supabase Storage.

- Supabase Realtime where appropriate.

- Secure server-side functions.



AI:



- LLM API through secure backend functions.

- Tool calling.

- Structured outputs.

- Controlled database operations.

- Optional embeddings for semantic search when configured.



Deployment:



- Production-ready hosting.

- Environment variable configuration.

- Secure API handling.



Database Structure



Create appropriate normalized tables for:



- profiles

- user_preferences

- courses

- course_folders

- course_files

- course_notes

- tasks

- task_subtasks

- events

- reminders

- countdowns

- flashcard_decks

- flashcards

- flashcard_reviews

- quizzes

- quiz_questions

- focus_sessions

- daily_goals

- ai_conversations

- ai_messages

- ai_memory

- animals

- user_animals

- habitats

- zoo_decorations

- user_zoo_layouts

- study_rooms

- room_members

- room_sessions

- room_animals

- rewards

- achievements

- notifications



Use proper relationships, timestamps, ownership fields, and database constraints.



Security



Implement Row Level Security.



Every student's private records must be accessible only to that student unless explicitly shared.



Room data must be accessible only to authorized room members.



Never place secret API keys in frontend code.



Use backend authorization for every AI tool action.



Validate uploaded file types and sizes.



---



22. FUNCTIONALITY REQUIREMENTS



This is extremely important.



Do not build a static visual prototype.



Every visible button, menu, tab, input, card, and action must have meaningful functionality.



Examples:



- Add Task must create a database record.

- Completing a task must persist its new status.

- Creating a countdown must update the dashboard.

- Adding a course must create a course workspace.

- Uploading a file must save it in the correct course folder.

- Switching languages must translate the entire interface.

- Switching themes must update all pages.

- Completing a focus session must update statistics and reward eligibility.

- Discovering an animal must save it permanently.

- Creating a study room must create an actual room record.

- AI actions must use backend functions.



Avoid:



- Fake data presented as real data.

- Buttons that do nothing.

- Placeholder links.

- Simulated AI responses presented as live AI.

- Hardcoded dashboard statistics.

- Fake file upload functionality.

- Nonfunctional social features.



If an external integration requires credentials, build the integration architecture and provide a clear setup state.



Use realistic sample data only in a clearly identified demo account or demo mode.



---



23. USER EXPERIENCE AND MICRO-INTERACTIONS



Create a premium user experience.



Include:



- Smooth page transitions.

- Subtle card hover effects.

- Animated progress bars.

- Checkbox completion animations.

- Toast notifications.

- Beautiful confirmation dialogs.

- Loading skeletons.

- Empty states with Nemo illustrations.

- Error states with clear explanations.

- Success feedback.

- Responsive modals and drawers.



Use animations sparingly.



Never sacrifice usability for visual effects.



---



24. IMPORTANT DESIGN AND DEVELOPMENT RULES



1. Build a consistent design system.

2. Maintain the same visual identity across every page.

3. Do not overcrowd the dashboard.

4. Make navigation intuitive.

5. Ensure all pages are responsive.

6. Fully support RTL and LTR.

7. Prioritize accessibility and readable contrast.

8. Keep the application fast.

9. Use reusable components.

10. Keep code modular and maintainable.

11. Persist user data in the database.

12. Implement proper loading, empty, and error states.

13. Do not fabricate AI functionality.

14. Do not implement voice AI in this version.

15. Do not implement automatic audio transcription or lecture summarization in this version.

16. Keep audio and video upload and playback available in course folders.

17. Keep future integrations extensible.



---



25. IMPLEMENTATION ORDER



Build the application in a structured manner.



Stage 1 — Foundation



- Design system.

- Responsive layout.

- Authentication.

- Onboarding.

- Arabic/English localization.

- Light/dark mode.

- Database foundation.



Stage 2 — Student Workspace



- My Day.

- Tasks.

- Calendar.

- Reminders.

- Countdown.

- Events.



Stage 3 — Academic Workspace



- My Courses.

- Folder management.

- File uploads.

- Notes.

- Flashcards.

- Quizzes.



Stage 4 — Nemo AI



- Chat interface.

- Secure backend AI integration.

- Tool calling.

- Database access.

- Action confirmations.

- Persistent context.



Stage 5 — Focus & Gamification



- Pomodoro.

- Focus statistics.

- Pearls.

- Animal collection.

- Discovery Journal.

- My Zoo.

- Habitats.



Stage 6 — Social



- Study Together.

- Private rooms.

- Group focus sessions.

- Shared achievements.

- Shared Zoo.



Stage 7 — Final Polish



- Responsive testing.

- RTL testing.

- Dark mode testing.

- Accessibility.

- Security checks.

- Functional testing.

- Performance optimization.



---



26. FINAL PRODUCT VISION



NEMO should feel like a student's personal digital world.



A place where they can:



- Start their day.

- Organize their university life.

- Manage assignments.

- Save every course resource.

- Study smarter.

- Track their progress.

- Build healthy focus habits.

- Collect adorable animals.

- Grow their own virtual zoo.

- Study with friends.

- Ask Nemo for help at any moment.



The platform should balance academic productivity with warmth, personality, and enjoyment.



The red octopus Nemo must be recognizable throughout the experience.



The application must look like a real, premium, production-quality startup product.



Final instruction: Build the complete application, not just a landing page or a dashboard mockup. Prioritize a cohesive, functional, visually polished experience with real data persistence and a scalable architecture.



Before finishing, test every major user flow on desktop, tablet, and mobile, in both Arabic RTL and English LTR, and in both light and dark modes.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/32ea848f-d5fb-4c97-ac30-fae3315a01be).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

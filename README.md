Comprehensive Feature Plan and Evaluation Algorithm for the Personalities App

## Docker Setup

1. Copy `.env.example` to `.env` and supply production values such as `SECRET_KEY` and database credentials.
2. Build and start the stack:

   ```bash
   docker compose up --build -d
   ```

3. Access the React frontend at <http://localhost> and the Django API at <http://localhost:8000>.

The compose configuration runs Django with Gunicorn and serves the compiled React build through an Nginx proxy that forwards `/api/` requests to the backend while preserving HTTPS headers for secure deployments.
This report restates the full feature set for the Personalities App, integrates the additional requirements you provided (privacy settings and anti‑bias mechanisms), and proposes a plan for implementing the evaluation and objectivity algorithms. Citations reference the existing repository and external sources.
 
1 Core features of the current phase
1.1 Authentication & security
Feature	Details	Rationale
Multi‑factor sign‑up/login	Accounts are created using email and phone (future: authenticator apps). The backend uses bcrypt to hash passwords during registration and checks hashed passwords on login[1]. Session or token authentication is used for API access.	Combining email+phone reduces bot registrations and enables multi‑factor verification. A database of verified numbers/emails is kept to block repeat abuse.
Session & token management	Backend endpoints require TokenAuthentication or session cookies. Users must be authenticated to fetch or update profiles, create questions or answers, or submit evaluations[2].
Protects private data and ensures only logged‑in users interact with the system.
Rate limiting & CAPTCHA (planned)	Add throttling middleware for registration/login and integrate CAPTCHAs on high‑risk actions (registration, contact forms). Rate limiting deters automated sign‑ups.	Minimises bot abuse and protects server resources.
Authentication apps (future)	Implement TOTP or push‑based 2FA using authenticator apps. Users store a secret (QR code), then supply a 6‑digit code on login.	Provides a stronger second factor beyond SMS, reducing SIM‑swap risk.
1.2 User profiles & privacy
Feature	Details	Implementation notes
Extended profile fields	The Profile model stores demographics (full name, age group, gender identity, nationality, languages, city/state/country, zodiac sign), appearance (eye colour, hair colour, hair style, height, weight, body type, skin tone, tattoos/piercings), lifestyle (diet, exercise frequency, smoking, drinking, pets), favourites (songs, artists, books, movies, TV shows, food, travel destinations, sport, podcasts, influencers), fun & miscellaneous (fun fact, goals, achievements, personal quote, social links) and personality values (a JSON of trait names and self‑ratings)[3][4].
The frontend ProfileForm captures these fields; Profile.tsx displays them grouped into “Basic Info”, “Appearance”, “Lifestyle & Habits”, “Favourites”, “Fun & Miscellaneous” and “Personality Values”[3][4].

Per‑field privacy levels	Each field can be marked as public, friends only or private. The default visibility for new fields is friends only. Private fields can be requested by other users; the owner can approve or deny.	Extend the Profile model with a visibility map keyed by field names (visibility[field] ∈ {public, friends, private}). When serialising profiles, remove fields not permitted by the requesting user’s relationship. Support bulk updates when users change defaults.
Information requests	If user A wants to view a private section of user B’s profile, A sends a request. Once B approves and shares the requested section, A may request additional sections from B. Requests do not expire, but A or B can cancel them at any time. To prevent abuse, the system enforces reciprocity: B can only request additional information from A if A has granted B at least one request. In future, requesting information may require coins or payment.	Store requests in a ProfileRequest model with fields (requester, owner, section, status), where status ∈ {pending, approved, cancelled}. Enforce reciprocity by tracking approved counts per user pair.
Profile picture uploads	Users upload profile pictures via Cloudinary. The backend uses the Cloudinary API to upload the file and stores the returned URL in the profile[5].
Include error handling so missing Cloudinary keys do not crash the server.
Spotify profile integration (basic)	Users can authenticate with Spotify to pull their display name, email and profile images【631910036969634†L145-L195】. Future extensions: show top artists/songs and current playback.	A separate SpotifyProfile model stores the fetched data.
1.3 Questions & answers (polls)
Feature	Details	Implementation notes
Models	Tag, Question and Answer (DRF models). A question has text, an optional tag, and a question type: Yes/No, Multiple Choice or Rating. The options field stores a JSON list of up to four options; if the list is empty or absent the poll is treated as Yes/No. For Rating questions, options should be an empty list and the answer value is a 1–10 score. Each question also records an anonymity flag and a creation timestamp. Answers link the question, the user, the selected option index (for multiple choice) or rating value, and the anonymity flag. Users can only answer once per question.	See backend/questions/models.py (not shown) and the view docstrings.
API views	The QuestionListCreateView returns a paginated list of questions or creates a new one. GET supports search via ?search=, tag filtering via ?tag=, and sorting via ?sort=recent to order by creation date; otherwise questions are ordered by answer count (trending)[6]. POST accepts text, optional tag_id or tag_name, optional options (up to four strings), a question_type (defaults to yesno), and is_anonymous[7]. Setting question_type=rating with an empty options array prompts the frontend to render a 1–10 rating slider. Duplicate questions (case‑insensitive) are rejected and tag names are normalised[8]. AnswerCreateView creates an answer to a question, storing either the selected option index or the rating value[9].
Sorting by trending uses Count('answers') to order questions by number of answers; duplicates are rejected using Question.objects.filter(text__iexact=text).exists()[8].

Frontend feed	QuestionsFeed.tsx displays the list of questions and provides filters for tag, search text and sort order[10]. It fetches tags and questions on mount and when filters change[11]. Users can post questions via a modal with optional custom tags and up to four options; if options are missing or fewer than two, the poll is treated as yes/no[12]. After answering or posting a question, the feed refreshes counts.	
Future work	Add pagination and near‑duplicate detection (using n‑gram or semantic similarity). Provide trending logic with time decay. Honour anonymity (hiding the asker’s identity in public but showing to moderators if needed).	
Comments & reactions (future)	In later phases, users will be able to comment on questions and answers and up‑vote or like comments. Comments may be processed by an on‑site AI agent to rate them for uniqueness, humor, objectivity and positivity. These attributes can be displayed or used to surface high‑quality comments. For now, comments are disabled, but this feature is noted for future implementation.	Requires a Comment model linked to questions or answers, with a nested CommentEvaluation storing AI‑generated scores. Likes are simple one‑to‑many relations.
Question answer search & requests (future)	Another planned feature is the ability to search a user’s profile to see the questions they have answered (by topic, tag or approximate question text) and to request that user to answer a question they have not answered yet. Users can decide whether to allow such requests. The system must enforce reciprocity: if user A requests an answer from B, B cannot make another request until A has fulfilled a reciprocal request.	Requires an index of users’ answers by topic/tag and a QuestionRequest model. Provide search endpoints and UI to filter answered questions by tag or text.
1.4 Friend evaluations
Feature	Details	Implementation notes
Criterion selection	Each user selects the criteria (traits) they want friends to rate them on (“find your strengths, be aware of your weaknesses”). Criteria are stored in a Criterion model and can be user‑specific or global.	Provide a UI allowing users to add or remove criteria and set whether friends can rate them.
Evaluation flow (shuffle)	The FriendsEvaluations component fetches a shuffled queue of evaluation tasks from /evaluations/tasks/. Each task contains a subject (the friend) and a criterion to rate. The user rates the friend on a 1–10 scale and answers “How well do you know this person?” also on a 1–10 scale[13]. After submitting (or skipping) an evaluation, the next random task appears.	Backend EvaluationTasksView selects all subjects (excluding the current user) and all criteria, labels each as firstTime if the evaluator has not yet rated that pair, shuffles the list and returns it[14].

Evaluation API	CriterionListCreateView lists or creates criteria. EvaluationListCreateView lists or creates evaluations and supports filtering by subject_id[15]. When posting an evaluation, the subject ID is taken from the query parameters; the evaluator is the authenticated user[16].
Use POST /evaluations/evaluations/?subject_id={id} with JSON { "criterion_id": …, "score": …, "familiarity": … }. Familiarity is optional and only sent the first time.
Evaluation summary	EvaluationSummaryView returns, for a given subject, the average score per criterion across all evaluations[17]. The frontend can display this summary on the subject’s profile, grouping criteria and showing the mean and count.	Implement caching or background jobs to precompute summaries; hide summaries until a minimum number of evaluations (e.g., 3) to protect privacy.
Objectivity rating (planned)	For each user, compute an objectivity score based on: (1) how close their ratings of others are to the global consensus; (2) how close their self‑ratings are to how friends rate them; and (3) if provided, how close their predicted friend rating is to actual friend ratings. See §3 for formulas.	Display objectivity on the profile (optionally visible only to the user).
Rating gating rules	To encourage participation, a user’s ratings may be held in “pending” if they rate others but haven’t rated enough themselves. Ratings become active when the user contributes to others’ evaluations.	Track pending ratings in a separate field; release them when the evaluator reaches a threshold of completed evaluations.
1.5 Remaining tasks (core polish)
	Profile persistence & privacy – finish saving arrays and personality values; implement per‑field visibility; show loading/error states and handle nulls gracefully.
	Evaluation integration into profiles – display the evaluation summary and objectivity metrics on the profile; add a “Rate this user” button linking to the evaluations page (already partially implemented).
	Q&A improvements – add pagination and infinite scroll; implement duplicate detection using n‑gram or sentence embedding similarity; refine trending sorting (e.g., combine recency with answer count).
	Spotify enhancements – implement endpoints to fetch top artists and top songs for the last year using Spotify’s top/artists?time_range=long_term and top/tracks?time_range=long_term APIs. Display the user’s top artists (e.g., top 10) and top songs (e.g., top 10) on the profile, and provide time‑range filters (last month, last six months, last year) for future expansions.
	Testing & QA – write automated tests for profiles, evaluations, questions, and UI; set up GitHub Actions CI.
 
2 Extended requirements & design plan
2.1 Privacy‑controlled information sharing
Use case: Users decide which profile sections are visible to everyone, friends or private. Private sections can be requested by another user, but only if the requesting user reciprocally shares their own information.
	Data model: Add a visibility JSON field to the Profile model storing the visibility level for each field or section. For example:
	{
  "age_group": "public",
  "diet": "friends",
  "favorite_movies": "private"
}
	Access control: When serialising a profile for viewer X, check X’s relationship to the owner (self, friend or public). Hide fields not allowed at that level.
A “friend” relationship can be modelled with a Friendship table.
	Information requests: Create a ProfileRequest model with (owner, requester, section, status) where status ∈ {pending, approved, denied}.
When user A requests a section of user B’s profile, insert a pending request. B can approve; after approval, A can view that section.
A cannot request additional sections until B has requested one back or approved a previous request.
	UI: Provide toggles in the profile edit form to set each field’s visibility. Provide a “Request Info” button on profiles showing a list of private sections; show the pending/approved status. Send notifications upon requests and approvals.
2.2 Authentication enhancements
	Multi‑factor authentication: After standard login, require a second factor: either a code sent via SMS or a TOTP from an authenticator app.
Use Django packages such as django-otp or integrate a TOTP library. Store the user’s TOTP secret.
	Phone verification: During registration, send a verification code to the provided phone number; require confirmation before account activation.
	CAPTCHA & rate limiting: Integrate hCaptcha or reCAPTCHA on registration and login forms; use Django throttling to limit failed attempts.
2.3 Enhanced friend evaluation & bias mitigation
The friend‑evaluation system is the cornerstone of your product. Achieving fairness means compensating for raters who are overly lenient (giving many 10s) or harsh (giving many 1s) and weighting ratings by how well a rater knows the subject. Below is a research‑informed algorithmic plan.
2.3.1 Familiarity‑weighted mean
Use a weighted average to aggregate ratings, where each score s_j is multiplied by a familiarity weight f_j and divided by the sum of weights. According to Investopedia, in a weighted average "each data point value is multiplied by the assigned weight, which is then summed and divided by the sum of the weights"[18]. In the basic plan the familiarity question is general (“How well do you know this person?”). In more advanced (paid) plans the familiarity question is asked per criterion (“How well do you know this person in this criterion?”); then f_{ij,c} may vary by criterion. For criterion c of user i, the familiarity‑weighted mean is:
s ‾_(i,c) = (∑_(j∈R_(i,c))^▒f_(ij,c)  s_(ij,c))/(∑_(j∈R_(i,c))^▒f_(ij,c) ),
where R_{i,c} is the set of raters who rated user i on criterion c, s_{ij,c} is the 1–10 score given by rater j, and f_{ij,c} is the familiarity rating (1–10). If a rater has not provided a familiarity rating (for subsequent ratings), set f_{ij,c}=1.
2.3.2 Rater bias correction (leniency/harshness)
To correct for raters who consistently give higher or lower scores than average, apply z‑score normalization per rater. The medical education literature demonstrates that calculating a rater’s mean and standard deviation and then normalizing each rating reduces leniency bias[19]. We adapt that technique:
	For each rater j, collect all raw scores they have given to others (across criteria and users). Let μ_j be their mean score and σ_j their standard deviation.
	Normalize each rating s_{ij,c} to a z‑score:

	z_(ij,c)=(s_(ij,c)-μ_j)/σ_j .
	This produces a distribution with mean 0 and standard deviation 1 for rater j[19].
	Rescale to the 1–10 scale. The referenced paper rescales z‑scores to a 1–5 scale by multiplying by 2/3 and adding 3[20]. For a 1–10 scale, multiply by 1.5 (i.e., 9 / 6) and add 5:
	s_(ij,c)^norm=1.5 z_(ij,c)+5.
	This maps rater‐specific scores so that ±3 σ becomes 1–10. Clip values to the range [1, 10].
	Use the normalized scores s^{norm}_{ij,c} in the familiarity‑weighted mean formula instead of the raw scores. This reduces the weight of raters who are systematically harsh or lenient. To further reduce extreme positive/negative bias, treat the z‑score‐rescaled ratings as deviations around a central neutral point. Raters who consistently rate at the extremes (many 10s or many 1s) will have large |z_{ij,c}|; after rescaling, their scores will move toward the centre, diminishing their influence. Conversely, raters who use the full scale fairly will have smaller |z_{ij,c}| and their scores remain closer to the original. This produces a “central zero” effect, balancing those who are overly generous or overly harsh.
This leniency‑correction algorithm relies on well‑known statistical normalization; the cited paper shows that applying z‑score normalization and rescaling reduces the variance between different raters’ scores[19].
To further protect against extreme bias, if the z‑score |z_{ij,c}| exceeds 3 (three standard deviations), the corresponding rating is excluded from aggregation. Rater statistics (means and standard deviations) should be recomputed after each evaluation so the normalization reflects the latest data.
2.3.3 Rater reliability and extreme‑rate weighting
Beyond normalizing for leniency, we can adjust weights according to each rater’s reliability and their propensity for extreme scores. These factors help down‑weight raters who often deviate from the consensus or who overuse 1s or 10s.
	Reliability weight – For each rater j, compute the mean absolute difference between their normalized ratings and the provisional aggregate score for each rated user and criterion. Let d_j be this average difference. Define a reliability weight:
w_j^rel=1/(1+d_j ).
Raters whose opinions align closely with the consensus (d_j small) get w^{\mathrm{rel}}_j near 1; those who diverge widely get smaller weights.
	Extreme‑rate weight – Compute the fraction E_j of ratings by rater j that are at the extremes (1 or 10). Down‑weight extreme raters using a logistic function:
w_j^ext=1/(1+exp(k (E_j-E_0 )) ),
where E_0 is a baseline extreme rate (e.g., 0.25) and k controls steepness (e.g., 5). If a rater rarely uses extreme scores (E_j < E_0), w^{\mathrm{ext}}_j ≈ 1; if they frequently give 1s or 10s (E_j > E_0), the weight decreases towards 0.5.
	Combined weight – Multiply the reliability and extreme‑rate weights by the familiarity weight to get the final weight for each rating:
w_(ij,c)=w_j^rel×w_j^ext×f_(ij,c).
Use this final weight when aggregating scores:
s ‾_(i,c) = (∑_(j∈R_(i,c))^▒w_(ij,c)  s_(ij,c)^norm)/(∑_(j∈R_(i,c))^▒w_(ij,c) ).
This weighting scheme ensures that habitual outliers (extreme or unreliable raters) contribute less to the aggregate, while raters who align with the consensus and use the scale appropriately carry more influence.
2.3.4 Self‑rating and predicted friend rating
For each criterion c chosen by a user, collect: 1. Self‑rating self_{i,c} – how the user rates themself (1–10). These self‑ratings are hidden by default; other users cannot see them unless the owner chooses to make them visible. They are still used internally to compute objectivity.
2. Prediction rating (optional) pred_{i,c} – how the user thinks friends will rate them (1–10). If the prediction is provided, it replaces the self‑rating in objectivity calculations.
These ratings are used to compute objectivity components (see next section).
2.3.5 User objectivity index
Compute three signed components for user i that reflect whether the user tends to over‑ or under‑estimate themselves and others relative to the consensus. Each component yields a value in [−1, +1], where 0 is perfectly objective, positive values indicate a tendency toward positivity (higher scores than consensus) and negative values indicate negativity.
	Bias toward others (outbound) – For each rating the user gives, compute the signed difference between their normalized score and the consensus for the subject:
	d_(i→k,c)^out=(s_(ik,c)^norm-s ‾_(k,c))/9.
	Averaging d^{\mathrm{out}}_{i \to k,c} across all ratings yields \tilde{D}^{\mathrm{out}}_i, which lies in [−1, +1]. A positive value means the user tends to rate others more positively than the consensus; negative means more negatively.
	Bias toward self – For each criterion c the user has opted into, compute the signed difference between their self‑rating (or prediction) and the friends’ aggregate rating:
	d_(i,c)^self=(self_(i,c)-s ‾_(i,c))/9 "or" (pred_(i,c)-s ‾_(i,c))/9.
	Averaging these differences yields \tilde{D}^{\mathrm{self}}_i \in [−1, +1]. Positive values indicate the user rates themselves higher than friends do; negative values indicate a lower self‑image.
	Self‑prediction consistency – If a prediction rating is provided, compute the signed difference between the user’s prediction of their friends’ rating and their actual self‑rating:
	d_(i,c)^pred=(pred_(i,c)-self_(i,c))/9.
	Averaging across criteria yields \tilde{D}^{\mathrm{pred}}_i \in [−1, +1]. If the prediction question is not used, set \tilde{D}^{\mathrm{pred}}_i = 0.
Finally, combine these components into an overall objectivity score on the range [−3, +3] by weighting them and scaling by 3:
O_i=3×(0.4 D ̃_i^out + 0.4 D ̃_i^self + 0.2 D ̃_i^pred ).
A value of 0 indicates perfect objectivity. Positive values (up to +3) indicate a positive bias, while negative values (down to −3) indicate a negative bias. Display O_i on the profile with an explanation, and consider using its magnitude when weighting the user’s ratings of others.
2.3.6 Rating gating and incentives
- **Rating gate:** If user A rates user B but user B has not yet contributed enough ratings, A’s ratings remain pending.  Define a threshold `M` (for now, **10** completed evaluations) and hold incoming ratings until the subject has completed at least `M` evaluations themselves.  Store pending ratings with a flag; once the subject meets the threshold, incorporate them into the aggregate.  This implements the rule that **“the more rating users send out, the more ratings will be included in the total ratings of their own chosen criteria.”**
- **Shuffle mechanism:** The evaluation tasks page should only present a random friend/criterion combination; users cannot cherry‑pick which friend to rate.  There is no direct rating from the profile; users must go through the shuffle page to ensure unbiased sampling.
- **Encouragement:** Show progress bars indicating how many ratings remain pending and how many more evaluations a user must complete to unlock those ratings.  Provide badges or incentives for frequent participation.  A user cannot request another private section from someone unless they reciprocate by sharing a private section.
2.4 User decisions & parameters
These parameters reflect the decisions you provided:
	Visibility defaults and reciprocity – New profile fields default to friends only visibility. A user may request information about a friend’s private field. Once the request is approved, the requester can ask for further information. Requests do not expire, but they can be cancelled. Reciprocity is enforced: B cannot request additional private information from A until B has approved at least one request from A.
	Criterion scales and objectivity – All criteria are rated on a 1–10 scale, except objectivity, which is anchored at 0. Positive objectivity scores (e.g., +0.64, +0.95 up to +3) indicate a tendency toward positive bias, while negative scores (e.g., –0.43) indicate a tendency toward negative bias. A perfectly objective user scores 0.
	Minimum evaluations for visibility – A criterion’s average is only displayed after at least 10 ratings are received for that criterion. This higher threshold protects privacy and improves statistical reliability.
	Friend definition and rating scope – Friendship is defined as a mutual connection (both users must approve the relationship). Ratings and information requests may be restricted to mutual friends, depending on privacy settings.
	Extreme raters and statistics updates – Raters whose normalized scores exceed ±3 standard deviations are excluded from aggregates. Rater statistics (mean, standard deviation) should be recomputed after each evaluation so that bias corrections remain up to date.
	Self‑rating privacy – Users may hide their self‑ratings from others; hidden is the default. Self‑ratings are still used internally to compute objectivity scores.
 
3 Summary and feasibility
The features described—multi‑factor authentication, per‑field privacy controls, extended profiles, Q&A polls, friend evaluations with familiarity weighting, rating bias correction, and user objectivity metrics—are all technically feasible using Django + DRF on the backend and React on the frontend. Weighted averages and z‑score normalization are straightforward to implement; the weighted mean formula is well understood[18], and normalizing each rater’s scores by subtracting their mean and dividing by their standard deviation reduces leniency bias[19]. Rescaling z‑scores to the 1–10 scale allows the corrected ratings to remain intuitive. A reliability weight based on how closely a rater’s opinions match the consensus further reduces the influence of inconsistent raters. Finally, the objectivity index derived from three differences (ratings of others vs consensus, self vs friends, prediction vs self) encapsulates how aligned a user’s perceptions are, fulfilling the vision of “finding your strengths and being aware of your weaknesses.”
With these algorithms and design patterns in place, the Personalities App can provide users with meaningful, unbiased insights about themselves and their friends while preserving privacy and encouraging fair participation.
 
4 Data segmentation and analytics
To support future premium features that allow users to explore aggregate statistics—such as “What percentage of Brooklyn users have humour above 8?” or “How many green‑eyed users have open‑mindedness above 9?”—the backend must organise data so it can be sliced by demographic, physical and behavioural attributes. A recommended design is:
	Star schema – Use a fact table for evaluations and a set of dimension tables for user attributes. Each evaluation fact includes references to:
	subject_id – the user being rated.
	criterion_id – the criterion.
	normalized_score – the bias‑corrected score.
	timestamp – when the rating occurred.
	location_id, profession_id, eye_colour_id, etc. – foreign keys into dimension tables capturing the subject’s physical, professional and geographic attributes at the time of rating.
	Dimension tables – For each attribute category (e.g., demographics, appearance, lifestyle, profession, location), create a lookup table with an integer primary key and descriptive fields. Example tables:
	dim_location (id, country, state, city, postal_code, neighbourhood)
	dim_profession (id, industry, job_title)
	dim_physical (id, eye_colour, hair_colour, height_range, weight_range, body_type, skin_tone)
	ETL and denormalized snapshots – Periodically extract data from the operational DB into an analytics warehouse (e.g., using Postgres materialised views or a separate data warehouse). During ETL, compute derived metrics (objectivity scores, average ratings per criterion) and store them in summary tables keyed by attribute combinations. This enables queries like “percentage of users in Brooklyn with humour > 8” by grouping on location_id and filtering on the humour criterion.
	Analytic API – Build endpoints that accept filter parameters (e.g., location=Brooklyn, eye_colour=green, criterion=humour, threshold=8, min_count=3) and return aggregate statistics. These queries should enforce privacy by requiring minimum counts (e.g., at least 3 users) to avoid disclosing individual scores.
This structure allows the system to efficiently compute segmentation queries without scanning raw ratings at runtime. As the product evolves, additional dimension tables can be added (e.g., zodiac_sign, education_level). Keeping the star schema loosely coupled ensures future analytics features can be built without restructuring the core evaluations logic.
 
5 Future features (planned phases)
Once the core app is stable and a userbase has been established, the following enhancements are planned. These extend the current feature set and include the recent additions you requested:
	Deep personality insights & AI matching – Aggregate users’ answers to infer Big‑Five traits and behavioural patterns, generate compatibility scores, and suggest friends or connections based on personality fit.
	Advanced search & discovery – Allow users to filter polls and other users by location, demographics, tags, music preferences, and more. Show nearby users on a map and provide robust search by traits and preferences with AI-driven recommendations.
	Messaging & reactions – Add real‑time chat, voice and video reactions, and the ability to capture instant reactions to poll results or posts.
	Full Spotify integration – Display top artists and songs for different time ranges (last year, last six months, last month), show current playback, and correlate music taste with personality traits.
	Premium features & monetisation – Offer subscription tiers for ad-free browsing, advanced analytics, demographic filters, revenue sharing, and pay‑per‑request information or answer requests.
	Charity coefficient & business platform – Enable users and companies to donate a percentage of earnings or profits to charities and earn badges for social impact.
	Content posting & creation – Allow users to post videos, photos and text. Give influencers tools to define how their content is rated, and provide AI feedback before posting.
	AI content analysis & optimization – Analyse content before upload to suggest improvements, hashtags, best posting times, and predict virality.
	Newsfeed of videos – Present a personalised video feed tailored to user interests and personality traits.
	Enhanced user settings & themes – Provide deeper privacy settings, granular notification preferences, and multiple UI themes.
	Mobile app development – Build native iOS/Android apps using React Native or Flutter with offline mode and full device integration.
	Integration with additional APIs – Connect with other platforms (Twitter, Instagram, YouTube, Goodreads, and more) to enrich user profiles and enable cross‑posting.
	Testing & quality assurance – Expand automated and manual testing coverage, including performance monitoring and user‑experience testing.
	AI friend suggestions & advocates – Use AI to analyse users’ public data (with consent) to rate traits and provide narrative summaries. Offer interactive explanations and allow users to dispute or refine AI‑generated evaluations.
	User‑defined content rating criteria – Enable influencers or content creators to specify the criteria by which their content is evaluated, and display those metrics publicly.
	Data segmentation & analytics – Build premium dashboards allowing users to explore aggregated metrics by physical, professional or geographic attributes, as described in Section 4.
	Comments & reactions – Implement commenting on questions and answers with likes and AI evaluation (uniqueness, humour, objectivity, positivity) to highlight high‑quality contributions.
	Search & request answered questions – Allow users to search another user’s answered questions (by topic, tag or approximate text) and request that user to answer new questions, subject to reciprocity rules.
	Advanced question types – Beyond Yes/No, multiple choice and rating questions, experiment with ranking questions (ordering options) or open‑ended responses where appropriate and moderate them using AI.
 
[1] [5] views.py
https://github.com/sandroplant/personalities/blob/main/backend/userprofiles/views.py
[2] [6] [7] [8] [9] views.py
https://github.com/sandroplant/personalities/blob/main/backend/questions/views.py
[3] [4] Profile.tsx
https://github.com/sandroplant/personalities/blob/main/frontend/src/components/Profile.tsx
[10] [11] [12] QuestionsFeed.tsx
https://github.com/sandroplant/personalities/blob/main/frontend/src/components/QuestionsFeed.tsx
[13] FriendsEvaluations.tsx
https://github.com/sandroplant/personalities/blob/main/frontend/src/components/FriendsEvaluations.tsx
[14] [15] [16] [17] views.py
https://github.com/sandroplant/personalities/blob/main/backend/evaluations/views.py
[18] Weighted Average: Definition and How It Is Calculated and Used
https://www.investopedia.com/terms/w/weightedaverage.asp
[19] [20]  Rating the Rater: A Technique for Minimizing Leniency Bias in Residency Applications - PMC 
https://pmc.ncbi.nlm.nih.gov/articles/PMC10125539/

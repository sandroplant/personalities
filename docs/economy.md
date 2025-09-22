# Economy Rules Overview

The Personalities economy rewards meaningful participation while discouraging spammy behavior. Coins are granted or deducted by the backend according to the following rules:

## Asking Questions

- **Detailed questions** (over 120 characters) earn **4 coins**.
- **Well-developed prompts** (60–120 characters) earn **3 coins**.
- **Baseline questions** earn **2 coins**, with a +1 bonus when custom answer options are provided.
- **Very short prompts** (under 20 characters) trigger a **1-coin penalty** to discourage low-effort posts.

## Answering Questions

- Providing an answer grants **3 coins** by default.
- Submitting a rating of **8 or higher** on a rating-style question pays out **5 coins**.
- Rating answers between **4 and 7** earn **3 coins**.
- Rating answers **3 or below** incur a **2-coin penalty**, signalling low-confidence feedback.

## Peer Evaluations

- Receiving a positive evaluation (score ≥ 4) awards **10 coins** to the subject.
- Neutral evaluations (score 3) grant **4 coins**.
- Negative evaluations (score ≤ 2) deduct **6 coins** from the subject.
- Evaluators earn **2 coins** for participating, or **3 coins** when they report high familiarity with the subject.

## Safeguards & Limits

- Individual transactions are capped at **50 coins**; requests above that size are rejected.
- Users can earn at most **200 coins** per rolling 24-hour window. Additional rewards are automatically reduced or skipped until the window resets.
- Negative adjustments never take a balance below zero—deductions are clamped to the coins on hand.

Use the `/economy/balance/` and `/economy/transactions/` endpoints to display wallet details in the frontend.

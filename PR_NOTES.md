Personalities – Privacy & Requests PR (Backend)

Overview
- Adds per-field profile privacy (public/friends/private) with viewer-aware serialization helpers.
- Introduces Friendship (mutual) and ProfileRequest models with reciprocity rules.
- Provides DRF serializers, viewsets, and URL router to manage requests and friendships.
- Includes unit test skeletons and integration notes without touching existing files.

Scope
- New backend files are added under `backend/userprofiles/` to minimize merge risk.
- No existing file is modified in this PR scaffold; integration steps below explain how to wire it in.

What's Included
- Models: `Friendship`, `ProfileRequest` (in `models_privacy.py`)
- Privacy helpers (`privacy.py`) for viewer role and field filtering
- Serializers: profile visibility + request/friendship (in `serializers_privacy.py`)
- Views: ViewSets and actions for requests and friendships (in `views_privacy.py`)
- URLs: dedicated router (in `urls_privacy.py`)
- Tests: test skeletons (in `tests/test_privacy.py`)

How to Integrate
1) Models and migrations
   - Move fields from `ProfileExtraFieldsMixin` below into your existing `Profile` model, or import and reuse directly.
   - Run `python manage.py makemigrations userprofiles` and `python manage.py migrate`.

2) Wire URLs
   - In your `backend/userprofiles/urls.py` (or project urls), include the router:
     `path("privacy/", include("backend.userprofiles.urls_privacy"))`

3) Apply privacy filtering to Profile GET
   - In your `ProfileSerializer.to_representation`, import and call:
     `from .privacy import build_privacy_filtered_profile`
   - Replace the raw return with the filtered dict using the current request user.

4) Frontend hooks (follow-up PR)
   - Add per-field visibility toggles to the profile edit form.
   - Add a "Request Info" modal using the `ProfileRequest` endpoints.

Notes
- Reciprocity rule: a requester may have only one pending request per owner+section, and additional requests may require at least one approved share between the pair.
- Visibility defaults to "friends" when a field is not specified.
- Keep self-ratings and predicted-ratings for future objectivity computation.


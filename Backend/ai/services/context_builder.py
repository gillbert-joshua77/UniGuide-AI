"""UniGuide AI system prompt and context builder.

Keeps the static system prompt separate from dynamic student
information. Student profile details and relevant chat history are
injected at request time through the functions in this module.
"""

UNIGUIDE_SYSTEM_PROMPT = """You are UniGuide AI, a student guidance assistant helping students make decisions about education, careers, and studying abroad.

Your role:
- Give practical, step-by-step guidance on study paths, courses, and careers.
- Personalize every response using the student's profile and conversation history provided in the context.
- Ask one focused question at a time when important information is missing (e.g. budget, country, level of study), but never ask for something you already know.
- Explain recommendations clearly: why a path fits the student, what the trade-offs are, and what the next steps are.
- Give concrete next steps the student can act on.

Honesty rules (strict):
- Never invent college fees, admission eligibility, deadlines, scholarships, rankings, or placement statistics.
- If you do not know or cannot verify a number, a deadline, or a requirement, say so clearly and tell the student where to verify it (official university/agency websites).
- Clearly distinguish between verified facts and general guidance.
- If information is unavailable or unverified, say so directly.

Communication rules:
- Keep responses focused and readable: use short sections, bullet points, and numbered lists.
- Use headings and bold only when they genuinely help structure the answer.
- Avoid long walls of text.
- Use emojis sparingly.
- End with a single, specific follow-up question that moves the conversation forward.

Today's date is {today_date}. Use it only when the current date is relevant.
"""

# Maximum number of past messages sent to Gemini as conversation history.
MAX_HISTORY_MESSAGES = 20


def build_student_context(user):
    """Safely build a dict of the student's profile details.

    Returns None for a missing profile so the caller can show the
    "no profile" state instead of crashing.
    """
    try:
        profile = user.student_profile
    except Exception:
        return None

    return {
        'education_level': profile.education_level or '',
        'institution': profile.institution or '',
        'course': profile.course or '',
        'year_of_study': profile.year_of_study or '',
        'academic_performance': profile.academic_performance or '',
        'interests': profile.interests or '',
        'career_goal': profile.career_goal or '',
        'preferred_location': profile.preferred_location or '',
        'preferred_country': profile.preferred_country or '',
        'budget': profile.budget or '',
        'bio': profile.bio or '',
    }


def build_system_instruction(user, today_date=None):
    """Combine the static system prompt with the student's dynamic profile.

    Dynamic student information is injected here (not baked into the
    static prompt) so it always reflects the latest saved profile.
    """
    from datetime import date

    instruction = UNIGUIDE_SYSTEM_PROMPT.format(
        today_date=today_date or date.today().isoformat()
    )

    context = build_student_context(user)

    if not context:
        instruction += (
            "\n\nSTUDENT PROFILE:\n"
            "No student profile is saved yet. Gently ask the student for the "
            "details you need (such as education level, budget, or target "
            "country) and encourage them to fill in their profile."
        )
        return instruction

    filled = {k: v for k, v in context.items() if v}
    if not filled:
        instruction += (
            "\n\nSTUDENT PROFILE:\n"
            "The student has a profile but it is currently empty. Gently ask "
            "for the details you need."
        )
        return instruction

    lines = [f"- {label}: {value}" for label, value in filled.items()]
    instruction += (
        "\n\nSTUDENT PROFILE (use these details to personalize your guidance):\n"
        + "\n".join(lines)
        + "\n\nBase your guidance on this profile. If something important is "
          "missing, ask one focused question about it."
    )
    return instruction


def build_chat_history(session, max_messages=MAX_HISTORY_MESSAGES):
    """Return the recent chat messages of a session in Gemini history format.

    History ends with the last assistant message (a model turn), so the
    next send_message() appends the new user message without duplication.
    Returns an empty list when there is no prior history.
    """
    messages = list(
        session.chat_messages.order_by('-timestamp')[:max_messages]
    )
    messages.reverse()

    history = []
    for msg in messages:
        role = 'model' if msg.role == 'assistant' else 'user'
        history.append({'role': role, 'parts': [msg.content]})
    return history

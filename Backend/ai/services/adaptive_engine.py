"""Adaptive Question Engine for UniGuide guided flows.

Uses Gemini to dynamically decide what question to ask next based on:
- The selected guided mode (internship / hackathon / university)
- The student's existing profile
- Answers collected so far
- Fields already asked

Provides static geographic data and field definitions so Gemini
never invents invalid options.
"""

import json
import logging

logger = logging.getLogger('uniguide.ai')

# ─── Static Geographic Data ─────────────────────────────────────────
# Key countries with states/regions. Used by Gemini to provide
# valid options for location-based questions.

GEOGRAPHIC_DATA = {
    "India": {
        "requires_state": True,
        "states": [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
            "Chhattisgarh", "Goa", "Gujarat", "Haryana",
            "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
            "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
            "Mizoram", "Nagaland", "Odisha", "Punjab",
            "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
            "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
            "Delhi", "Jammu & Kashmir", "Ladakh",
        ],
    },
    "Germany": {
        "requires_state": False,
        "states": [
            "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg",
            "Bremen", "Hamburg", "Hesse", "Lower Saxony",
            "Mecklenburg-Vorpommern", "North Rhine-Westphalia",
            "Rhineland-Palatinate", "Saarland", "Saxony",
            "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia",
        ],
    },
    "Canada": {
        "requires_state": False,
        "states": [
            "Alberta", "British Columbia", "Manitoba", "New Brunswick",
            "Newfoundland and Labrador", "Nova Scotia", "Ontario",
            "Prince Edward Island", "Quebec", "Saskatchewan",
        ],
    },
    "USA": {
        "requires_state": False,
        "states": [
            "California", "New York", "Texas", "Florida",
            "Illinois", "Pennsylvania", "Ohio", "Georgia",
            "North Carolina", "Michigan", "New Jersey", "Virginia",
            "Washington", "Arizona", "Massachusetts", "Tennessee",
            "Indiana", "Missouri", "Maryland", "Wisconsin",
            "Colorado", "Minnesota", "South Carolina", "Alabama",
            "Louisiana", "Kentucky", "Oregon", "Oklahoma",
            "Connecticut", "Utah", "Iowa", "Nevada",
            "Arkansas", "Mississippi", "Kansas", "New Mexico",
            "Nebraska", "Hawaii", "Idaho", "West Virginia",
            "New Hampshire", "Maine", "Montana", "Rhode Island",
            "Delaware", "South Dakota", "North Dakota", "Alaska",
            "Vermont", "Wyoming", "Washington DC",
        ],
    },
    "UK": {
        "requires_state": False,
        "states": [
            "England", "Scotland", "Wales", "Northern Ireland",
        ],
    },
    "Australia": {
        "requires_state": False,
        "states": [
            "New South Wales", "Victoria", "Queensland",
            "South Australia", "Western Australia", "Tasmania",
            "Northern Territory", "Australian Capital Territory",
        ],
    },
    "Japan": {
        "requires_state": False,
        "states": [
            "Tokyo", "Osaka", "Kyoto", "Hokkaido",
            "Fukuoka", "Aichi", "Hiroshima", "Miyagi",
        ],
    },
    "Singapore": {
        "requires_state": False,
        "states": [],
    },
    "Netherlands": {
        "requires_state": False,
        "states": [
            "Amsterdam", "Rotterdam", "The Hague", "Utrecht",
            "Eindhoven", "Groningen", "Tilburg", "Maastricht",
        ],
    },
    "France": {
        "requires_state": False,
        "states": [
            "Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France",
            "Occitanie", "Nouvelle-Aquitaine", "Provence-Alpes-Côte d'Azur",
            "Alsace", "Brittany", "Normandy",
        ],
    },
    "South Korea": {
        "requires_state": False,
        "states": [
            "Seoul", "Busan", "Incheon", "Daegu",
            "Daejeon", "Gwangju", "Suwon",
        ],
    },
    "New Zealand": {
        "requires_state": False,
        "states": [
            "Auckland", "Wellington", "Canterbury",
            "Waikato", "Bay of Plenty", "Otago",
        ],
    },
    "Ireland": {
        "requires_state": False,
        "states": [
            "Dublin", "Cork", "Galway", "Limerick",
        ],
    },
    "Sweden": {
        "requires_state": False,
        "states": [
            "Stockholm", "Gothenburg", "Malmö", "Uppsala",
        ],
    },
    "Norway": {
        "requires_state": False,
        "states": [
            "Oslo", "Bergen", "Trondheim", "Stavanger",
        ],
    },
    "Switzerland": {
        "requires_state": False,
        "states": [
            "Zurich", "Geneva", "Bern", "Basel",
            "Lausanne", "Lucerne",
        ],
    },
}

# Quick lookup of all country names
ALL_COUNTRIES = sorted(GEOGRAPHIC_DATA.keys())

# ─── Field Definitions per Mode ──────────────────────────────────────
# Each field has: description, type, optional flag, and optional static options.

INTERNSHIP_FIELDS = {
    "target_role": {
        "description": "The specific job role or position the student is targeting for their internship.",
        "type": "text",
        "optional": False,
    },
    "skills": {
        "description": "Technical and soft skills the student currently has.",
        "type": "text",
        "optional": False,
    },
    "experience_level": {
        "description": "Current experience level - student, fresher, or has prior internship experience.",
        "type": "single_choice",
        "options": ["Student (no prior internship)", "Fresher with projects", "1 prior internship", "2+ prior internships"],
        "optional": False,
    },
    "preferred_location": {
        "description": "City, state, or region where the student wants to do the internship.",
        "type": "single_choice",
        "options_from": "geographic_city_or_no_preference",
        "optional": True,
    },
    "work_mode": {
        "description": "Preferred work arrangement for the internship.",
        "type": "single_choice",
        "options": ["Remote", "On-site", "Hybrid", "No preference"],
        "optional": False,
    },
    "company_preference": {
        "description": "Type of company the student prefers.",
        "type": "single_choice",
        "options": ["Startup", "MNC", "Product company", "Research lab", "Service company", "Government/PSU", "No preference"],
        "optional": True,
    },
    "duration": {
        "description": "Preferred duration of the internship.",
        "type": "single_choice",
        "options": ["1-2 months", "3-4 months", "5-6 months", "6+ months", "No preference"],
        "optional": True,
    },
    "stipend_preference": {
        "description": "Whether the student requires a paid internship or is open to unpaid.",
        "type": "single_choice",
        "options": ["Paid only", "Open to unpaid", "No preference"],
        "optional": True,
    },
    "availability": {
        "description": "When the student can start the internship.",
        "type": "single_choice",
        "options": ["Immediately", "Within 1 month", "Within 3 months", "Next semester", "Flexible"],
        "optional": True,
    },
    "career_goal": {
        "description": "Long-term career goal to help match the right internship type.",
        "type": "text",
        "optional": True,
    },
}

HACKATHON_FIELDS = {
    "domain": {
        "description": "The problem domain or theme area the student wants to work in.",
        "type": "single_choice",
        "options": ["AI/ML", "Web Development", "Mobile Apps", "Blockchain", "IoT", "Cybersecurity", "Healthcare Tech", "FinTech", "EdTech", "Climate/Sustainability", "Any"],
        "optional": False,
    },
    "skills": {
        "description": "Skills the student will bring to the hackathon.",
        "type": "text",
        "optional": False,
    },
    "technologies": {
        "description": "Specific technologies or frameworks the student wants to use.",
        "type": "text",
        "optional": True,
    },
    "team_preference": {
        "description": "Whether the student wants to participate solo or in a team.",
        "type": "single_choice",
        "options": ["Team", "Solo", "Not sure yet"],
        "optional": False,
    },
    "team_status": {
        "description": "Whether the student already has a team. Only ask if team_preference is Team.",
        "type": "single_choice",
        "options": ["Yes, we have a team", "No, I need a team"],
        "optional": False,
        "depends_on": {"team_preference": ["Team"]},
    },
    "experience_level": {
        "description": "Previous hackathon experience level.",
        "type": "single_choice",
        "options": ["None (first hackathon)", "Beginner (1-2 hackathons)", "Intermediate (3-5 hackathons)", "Advanced (5+ hackathons)"],
        "optional": False,
    },
    "format": {
        "description": "Online or offline participation preference.",
        "type": "single_choice",
        "options": ["Online", "Offline", "Either"],
        "optional": False,
    },
    "preferred_location": {
        "description": "City or region for offline hackathons. Only ask if format is Offline or Either.",
        "type": "text",
        "optional": True,
        "depends_on": {"format": ["Offline", "Either"]},
    },
    "project_idea": {
        "description": "If the student already has a project idea in mind.",
        "type": "text",
        "optional": True,
    },
}

UNIVERSITY_FIELDS = {
    "country": {
        "description": "The country where the student wants to study.",
        "type": "single_choice",
        "options_from": "all_countries",
        "optional": False,
    },
    "state_region": {
        "description": "State, province, or region within the chosen country. Only ask if the country has states and the answer is relevant.",
        "type": "single_choice",
        "options_from": "country_states",
        "optional": True,
        "depends_on": {},
    },
    "degree_level": {
        "description": "Academic level the student wants to pursue.",
        "type": "single_choice",
        "options": ["Undergraduate (UG)", "Postgraduate (PG/Masters)", "PhD/Doctoral", "Diploma/Certificate"],
        "optional": False,
    },
    "course_field": {
        "description": "Specific course, major, or field of study.",
        "type": "text",
        "optional": False,
    },
    "academic_score": {
        "description": "Current academic performance (CGPA, percentage, GPA).",
        "type": "text",
        "optional": False,
    },
    "budget": {
        "description": "Annual budget for tuition and living expenses.",
        "type": "text",
        "optional": False,
    },
    "budget_currency": {
        "description": "Currency for the budget. Infer from the budget answer or ask.",
        "type": "single_choice",
        "options": ["USD ($)", "EUR (€)", "GBP (£)", "INR (₹)", "CAD (C$)", "AUD (A$)", "JPY (¥)", "Other"],
        "optional": True,
    },
    "entrance_exam": {
        "description": "Entrance exams the student has taken or is preparing for.",
        "type": "text",
        "optional": True,
    },
    "scholarship_needed": {
        "description": "Whether the student needs scholarship or financial aid.",
        "type": "single_choice",
        "options": ["Yes, essential", "Would be helpful but not required", "Not needed"],
        "optional": True,
    },
    "first_degree": {
        "description": "Whether this is the student's first degree. Only relevant for PG/PhD.",
        "type": "single_choice",
        "options": ["Yes, this is my first degree", "No, I already have a degree"],
        "optional": True,
        "depends_on": {"degree_level": ["Postgraduate (PG/Masters)", "PhD/Doctoral"]},
    },
    "previous_degree": {
        "description": "Previous degree or field of study. Only ask if first_degree is No.",
        "type": "text",
        "optional": False,
        "depends_on": {"first_degree": ["No, I already have a degree"]},
    },
    "work_experience": {
        "description": "Years of work experience. Relevant for PG/MBA applications.",
        "type": "single_choice",
        "options": ["None", "Less than 1 year", "1-2 years", "2-5 years", "5+ years"],
        "optional": True,
        "depends_on": {"degree_level": ["Postgraduate (PG/Masters)"]},
    },
    "research_experience": {
        "description": "Research experience or publications. Relevant for PhD.",
        "type": "single_choice",
        "options": ["No research experience", "Coursework projects only", "Independent research", "Published papers"],
        "optional": True,
        "depends_on": {"degree_level": ["PhD/Doctoral"]},
    },
    "accommodation": {
        "description": "Preferred accommodation type.",
        "type": "single_choice",
        "options": ["University dormitory", "Private rental", "Homestay", "No preference"],
        "optional": True,
    },
    "language_proficiency": {
        "description": "English language test scores if applicable.",
        "type": "text",
        "optional": True,
    },
}

MODE_FIELDS = {
    "internship": INTERNSHIP_FIELDS,
    "hackathon": HACKATHON_FIELDS,
    "university": UNIVERSITY_FIELDS,
}

MODE_LABELS = {
    "internship": "Internship Guidance",
    "hackathon": "Hackathon Guidance",
    "university": "University / College Guidance",
}


def _format_profile_for_prompt(profile):
    """Format student profile dict into a readable string for Gemini."""
    if not profile:
        return "No student profile available."

    lines = []
    label_map = {
        "name": "Name",
        "education_level": "Education Level",
        "institution": "Institution",
        "course": "Course/Major",
        "year_of_study": "Year of Study",
        "academic_performance": "Academic Performance",
        "interests": "Interests",
        "career_goal": "Career Goal",
        "preferred_location": "Preferred Location",
        "preferred_country": "Preferred Country",
        "budget": "Budget",
        "skills": "Skills",
        "applications": "Applications",
        "bio": "Bio/Notes",
    }
    for key, label in label_map.items():
        value = profile.get(key)
        if value:
            if isinstance(value, list):
                value = ", ".join(str(v) for v in value) if value else ""
            if value:
                lines.append(f"- {label}: {value}")
    return "\n".join(lines) if lines else "No student profile available."


def _format_fields_for_prompt(fields_dict):
    """Format field definitions into a readable block for Gemini."""
    lines = []
    for field_name, field_def in fields_dict.items():
        desc = field_def["description"]
        ftype = field_def["type"]
        optional = "Optional" if field_def.get("optional") else "Required"
        options_str = ""
        if "options" in field_def:
            options_str = f" | Options: {', '.join(field_def['options'])}"
        elif "options_from" in field_def:
            options_str = f" | Options from: {field_def['options_from']}"
        deps = ""
        if field_def.get("depends_on"):
            deps = f" | Depends on: {json.dumps(field_def['depends_on'])}"
        lines.append(
            f"- {field_name}: {desc} [type={ftype}, {optional}]{options_str}{deps}"
        )
    return "\n".join(lines)


def _format_geographic_data_for_prompt(country_name):
    """Return the geographic data string for a specific country (or all)."""
    if country_name and country_name in GEOGRAPHIC_DATA:
        geo = GEOGRAPHIC_DATA[country_name]
        states = geo.get("states", [])
        if states:
            return (
                f"Geographic data for {country_name}:\n"
                f"  States/Regions: {', '.join(states)}\n"
                f"  Requires state-level selection: {'Yes' if geo.get('requires_state') else 'No'}"
            )
        return f"Geographic data for {country_name}: No states/regions (city-level or country-level is sufficient)."
    # Return summary of all countries
    return (
        "Available countries: " + ", ".join(ALL_COUNTRIES) + "\n"
        "When a country is selected, its states/regions will be provided."
    )


def build_guided_question_prompt(mode, answers, asked_fields, student_profile):
    """Build the full prompt that asks Gemini to return the next question.

    Returns the prompt string ready to send to Gemini.
    """
    fields = MODE_FIELDS.get(mode)
    if not fields:
        return None

    mode_label = MODE_LABELS.get(mode, mode)
    profile_text = _format_profile_for_prompt(student_profile)
    fields_text = _format_fields_for_prompt(fields)

    # Determine which country was selected for geographic data
    selected_country = answers.get("country") or (
        student_profile.get("preferred_country") if student_profile else None
    )
    geo_text = _format_geographic_data_for_prompt(selected_country)

    answers_text = "None yet" if not answers else json.dumps(answers, indent=2)
    asked_text = ", ".join(asked_fields) if asked_fields else "None"

    prompt = f"""You are the UniGuide Adaptive Question Engine. Your ONLY job is to determine the next question to ask a student in a {mode_label} guidance flow.

You MUST return ONLY a valid JSON object. No markdown, no explanation, no text outside the JSON.

## Student Profile
{profile_text}

## Guided Mode
{mode_label} ({mode})

## Answers Collected So Far
{answers_text}

## Fields Already Asked
{asked_text}

## Available Fields for This Mode
{fields_text}

## Geographic Data
{geo_text}

## Rules

1. RETURN ONLY A VALID JSON OBJECT. No markdown code fences, no extra text.
2. If enough information has been collected to provide a good recommendation, return a "complete" response.
3. If more information is needed, return a "need_more_information" response with the next best question.
4. DO NOT ask for information that is already in the student profile AND already in the answers.
5. DO NOT ask for information that is already in the answers.
6. If a field has "depends_on", only ask it when the dependency condition is met.
7. For "options_from" fields:
   - "all_countries" → use the list from geographic data
   - "country_states" → use the states list for the selected country from geographic data
   - "geographic_city_or_no_preference" → ask for city with "No preference" as an option
8. Ask REQUIRED fields before optional fields.
9. Ask the most impactful missing field first.
10. For text-type fields, include a helpful placeholder.
11. The total questions needed is typically 3-6. Don't over-ask.
12. If a student says "No preference" or "Any" for a field, move on to other topics.
13. When budget is provided and seems tight, you may ask about flexibility AFTER the initial budget question.
14. STOP asking when you have enough to give a solid recommendation.

## Response Schema

If MORE information is needed:
{{
  "status": "need_more_information",
  "field": "field_name",
  "question": "Natural, friendly question text",
  "type": "text" | "single_choice" | "multi_choice" | "number",
  "options": ["option1", "option2", ...],
  "placeholder": "Helpful placeholder for text/number inputs",
  "optional": false,
  "estimated_remaining": 3
}}

If ENOUGH information collected:
{{
  "status": "complete",
  "summary": {{
    "field1": "value1",
    "field2": "value2"
  }}
}}

Notes:
- "options" is only included for "single_choice" and "multi_choice" types.
- "placeholder" is only included for "text" and "number" types.
- "optional" indicates whether the student can skip this question.
- "estimated_remaining" is your best guess of how many more questions after this one (for progress display).
- The "summary" in complete should contain ALL collected information including profile defaults.

Now, determine the NEXT question. Return ONLY the JSON object."""

    return prompt


def parse_gemini_response(raw_text):
    """Parse and validate the JSON response from Gemini.

    Returns a dict with either:
    - status='need_more_information' and question fields
    - status='complete' with summary
    - status='error' if parsing fails
    """
    if not raw_text:
        return {"status": "error", "error": "Empty response from AI"}

    text = raw_text.strip()

    # Remove markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last lines (fences)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON in the response
        import re
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                data = json.loads(match.group())
            except json.JSONDecodeError:
                return {"status": "error", "error": "Could not parse AI response as JSON"}
        else:
            return {"status": "error", "error": "Could not parse AI response as JSON"}

    status = data.get("status")
    if status == "complete":
        return {"status": "complete", "summary": data.get("summary", {})}
    elif status == "need_more_information":
        field = data.get("field")
        question = data.get("question")
        qtype = data.get("type", "text")

        if not field or not question:
            return {"status": "error", "error": "Missing required fields in AI response"}

        result = {
            "status": "need_more_information",
            "field": field,
            "question": question,
            "type": qtype,
            "optional": data.get("optional", False),
            "estimated_remaining": data.get("estimated_remaining"),
        }

        if qtype in ("single_choice", "multi_choice"):
            result["options"] = data.get("options", [])
        elif qtype in ("text", "number"):
            result["placeholder"] = data.get("placeholder", "")

        return result
    else:
        return {"status": "error", "error": f"Unknown status: {status}"}

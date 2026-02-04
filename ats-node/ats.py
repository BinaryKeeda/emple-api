import spacy
from spacy.matcher import PhraseMatcher
import re
from skillNer.general_params import SKILL_DB
from skillNer.skill_extractor_class import SkillExtractor

# --------------------
# Load NLP model & skill extractor (preloaded globally)
# --------------------
nlp = spacy.load("en_core_web_md", disable=["parser", "ner", "lemmatizer"])
skill_extractor = SkillExtractor(nlp, SKILL_DB, PhraseMatcher)

# --------------------
# Load matchers (optional)
# --------------------
def load_models():
    print("Models loading")
    full_matcher = PhraseMatcher(nlp.vocab)
    abv_matcher = PhraseMatcher(nlp.vocab)
    full_uni_matcher = PhraseMatcher(nlp.vocab)
    low_form_matcher = PhraseMatcher(nlp.vocab)
    token_matcher = PhraseMatcher(nlp.vocab)
    return full_matcher, abv_matcher, full_uni_matcher, low_form_matcher, token_matcher

# --------------------
# Safe annotate wrapper
# --------------------
def safe_annotate(text: str):
    text = (text or "").strip()
    if not text:
        return {"results": {"full_matches": [], "ngram_scored": []}}
    try:
        return skill_extractor.annotate(text)
    except Exception as e:
        print(f"[Annotate error] text='{text[:50]}' -> {e}")
        return {"results": {"full_matches": [], "ngram_scored": []}}

# --------------------
# Helper functions
# --------------------
def extract_skill_names(annotations):
    skills = set()
    results = annotations.get("results", {})
    for section in ["full_matches", "ngram_scored"]:
        for item in results.get(section, []):
            skill = item.get("doc_node_value", "").strip()
            if skill:
                skills.add(skill.lower())
    return skills

def parse_years(year_str):
    if not year_str:
        return 0
    year_str = re.sub(r"[^\d\.]", "", year_str)
    try:
        return float(year_str)
    except:
        return 0

def extract_experience(text, skills=None):
    exp_dict = {}
    pattern1 = r"(\w+(?: \w+)*)\s*\(?\s*(\d+(?:\.\d+)?)[+\-]?\s*years?\s*\)?"
    matches = re.findall(pattern1, text, flags=re.IGNORECASE)
    for skill, years in matches:
        exp_dict[skill.lower()] = parse_years(years)

    if skills:
        for skill in skills:
            pattern = rf"{re.escape(skill)}\s*\(?\s*(\d+(?:\.\d+)?)[+\-]?\s*years?\s*\)?|(\d+(?:\.\d+)?)[+\-]?\s*years?.*{re.escape(skill)}"
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                years = match.group(1) if match.group(1) else match.group(2)
                exp_dict[skill] = parse_years(years)
    return exp_dict

# --------------------
# Skill matching function
# --------------------
def match_skills(data, skill_extractor=skill_extractor,
                 full_matcher=None, abv_matcher=None, full_uni_matcher=None,
                 low_form_matcher=None, token_matcher=None):

    job_description = data.get("job_description", "")
    resume_text = data.get("resume_text", "")

    if not job_description or not resume_text:
        raise ValueError("Both job_description and resume_text are required")

    # Use safe annotate
    job_skills = safe_annotate(job_description)
    resume_skills = safe_annotate(resume_text)

    job_skill_set = extract_skill_names(job_skills)
    resume_skill_set = extract_skill_names(resume_skills)

    matched_skills = job_skill_set.intersection(resume_skill_set)
    missing_skills = job_skill_set - resume_skill_set
    extra_skills = resume_skill_set - job_skill_set

    jd_exp = extract_experience(job_description)
    resume_exp = extract_experience(resume_text, skills=job_skill_set)

    # experience match score
    exp_match_score = 0
    if jd_exp:
        total = 0
        for skill, required_years in jd_exp.items():
            candidate_years = resume_exp.get(skill, 0)
            if candidate_years >= required_years:
                total += 1
            elif candidate_years > 0:
                total += 0.5
        exp_match_score = (total / len(jd_exp)) * 100

    SKILL_WEIGHT = 0.7
    EXP_WEIGHT = 0.3
    skill_match_score = (len(matched_skills) / len(job_skill_set) * 100) if job_skill_set else 0
    overall_match = skill_match_score * SKILL_WEIGHT + exp_match_score * EXP_WEIGHT

    return {
        "job_skills": list(job_skill_set),
        "resume_skills": list(resume_skill_set),
        "matched_skills": list(matched_skills),
        "missing_skills": list(missing_skills),
        "extra_skills": list(extra_skills),
        "skill_match_score": round(skill_match_score, 2),
        "experience_match_score": round(exp_match_score, 2),
        "overall_match_score": round(overall_match, 2)
    }

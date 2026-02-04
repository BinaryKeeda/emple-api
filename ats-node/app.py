from flask import Flask, request, jsonify
from flask_cors import CORS
from ats import load_models, match_skills
from text_extract import extract_pdf_text

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins":[ "http://localhost:5173", "https://binarykeeda.com"]}},
     supports_credentials=True,
     methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"])

# ---------------------------
# Load matchers once at startup
# ---------------------------
full_matcher, abv_matcher, full_uni_matcher, low_form_matcher, token_matcher = load_models()

# Cached match function
def match_skills_cached(data):
    return match_skills(
        data,
        full_matcher=full_matcher,
        abv_matcher=abv_matcher,
        full_uni_matcher=full_uni_matcher,
        low_form_matcher=low_form_matcher,
        token_matcher=token_matcher
    )

# ---------------------------
# Routes
# ---------------------------
@app.route('/ats', methods=["POST"])
def ats_route():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No JSON body received"}), 400
    try:
        result = match_skills_cached(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/extract-text', methods=["POST"])
def extract_text():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    try:
        result = extract_pdf_text(file)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Main
# ---------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5005)

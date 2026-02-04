from flask import Flask, request, jsonify
import fitz  # PyMuPDF
import io

app = Flask(__name__)

def extract_text_from_pdf_file(file):
    # Load PDF from file-like object
    text = ""
    with fitz.open(stream=file.read(), filetype="pdf") as pdf:
        for page in pdf:
            text += page.get_text("text") + "\n"
    return text.strip()

# @app.route("/extract_pdf_text", methods=["POST"])
def extract_pdf_text(file):
    try:
        text = extract_text_from_pdf_file(file)
        return ({"text": text})
    except Exception as e:
        return ({"error": str(e)}), 500

# if __name__ == "__main__":
#     app.run(debug=True)

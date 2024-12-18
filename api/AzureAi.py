from flask import Flask, request, jsonify, Response
from openai import AzureOpenAI
import os
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv() 
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
api_key = os.getenv("AZURE_OPENAI_API_KEY")
api_version = "2023-03-15-preview"  

openai_client = AzureOpenAI(api_version=api_version, azure_endpoint=endpoint, api_key=api_key)

app = Flask(__name__)
CORS(app)

@app.route('/generate_text', methods=['POST'])
def generate_text():
    try:
        data = request.get_json()
        user_input = data.get('user_input', '')
        conversation = data.get('conversation', [{'role': 'system', 'content': 'You are a helpful assistant.'}])
        conversation.append({'role': 'user', 'content': user_input})

        if not user_input:
            return jsonify({'error': 'Prompt is required'}), 400

        response = openai_client.chat.completions.create(
            model="gpt4-o",
            temperature=0.3,
            stream=True,
            messages=conversation,
        )

        def generate():
            for resp in response:
                content = resp.choices[0].delta.content
                if content:
                    yield content

        return Response(generate(), mimetype='text/plain')

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

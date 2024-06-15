from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import time
import os

# Khai báo đường dẫn tới các file:
key_file_path = r'key.txt'
assistant_id_file_path = r'assistant_id.txt'

# Hàm lấy API key để kết nối với OpenAI:
def get_openai_key():
    try:
        with open(key_file_path) as f:
            return f.read().strip()
    except FileNotFoundError:
        print("Key.txt file not found.")
        return None

# Tạo kết nối tới OpenAI:
openai_client = openai.OpenAI(api_key=get_openai_key())
openai_threads = openai_client.beta.threads
openai_assistants = openai_client.beta.assistants

# Tạo một trợ lý ảo mới:
def create_assistant():
    assistant = openai_assistants.create(
        name="Orion",
        instructions="This is a virtual assistant that helps you answer the problems you are facing!",
        tools=[],
        model="gpt-3.5-turbo-16K"
    )
    return assistant

# Lấy ID của trợ lý ảo:
def get_assistant_id():
    if os.path.exists(assistant_id_file_path):
        with open(assistant_id_file_path, 'r') as f:
            return f.read().strip()
    return None

# Lưu ID của trợ lý ảo:
def save_assistant_id(assistant_id):
    with open(assistant_id_file_path, 'w') as f:
        f.write(assistant_id)

# Lấy ID hiện có hoặc tạo một ID mới nếu chưa có:
def get_or_create_assistant():
    assistant_id = get_assistant_id()
    if assistant_id:
        try:
            return openai_assistants.retrieve(assistant_id)
        except openai.OpenAIError:
            print("Assistant with saved ID not found. Create a new one.")
    assistant = create_assistant()
    save_assistant_id(assistant.id)
    return assistant

# Khởi tạo biến toàn cục để lưu trạng thái của cuộc trò chuyện và trợ lý ảo:
conversation_state = {'thread_id': None, 'run_id': None}

app = Flask(__name__)
cors = CORS(app, origins='*')

@app.route("/api/get", methods=["GET","POST"])
def chat():
    msg = request.json.get("msg")  # Sử dụng request.json.get để truy xuất dữ liệu JSON
    response = get_Chat_response(msg)
    return jsonify({"response": response})  # Chuyển đổi response thành JSON format

def get_Chat_response(text):
    assistant = get_or_create_assistant()
    
    # Nếu chưa có trạng thái trò chuyện, tạo một luồng mới và lưu trạng thái:
    if not conversation_state['thread_id']:
        thread = openai_threads.create()
        conversation_state['thread_id'] = thread.id
    
    # Gửi câu hỏi từ người dùng và nhận câu trả lời từ trợ lý ảo:
    openai_threads.messages.create(
        thread_id=conversation_state['thread_id'],
        role="user",
        content=[{"type": "text", "text": text}] if text else []
    )
    
    run = openai_threads.runs.create(
        thread_id=conversation_state['thread_id'],
        assistant_id=assistant.id,
    )
    
    is_running = True
    while is_running:
        run_status = openai_threads.runs.retrieve(thread_id=conversation_state['thread_id'], run_id=run.id)
        is_running = run_status.status != "completed"
        time.sleep(1)

    messages = openai_threads.messages.list(thread_id=conversation_state['thread_id'])
    last_message = [message for message in messages.data if message.run_id == run.id and message.role == "assistant"][-1]    

    # Kiểm tra và lấy phản hồi từ trợ lý ảo:
    if last_message:
        response = last_message.content[0].text.value
    else:
        response = "Sorry, I don't understand your question. Can you ask another question?"
    
    return response

if __name__ == '__main__':
    app.run(debug=True, port=8080)

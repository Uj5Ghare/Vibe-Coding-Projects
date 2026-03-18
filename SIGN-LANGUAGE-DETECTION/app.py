import streamlit as st
import os
import base64

# Set page configuration
st.set_page_config(page_title="SIGN DETECT", layout="centered")

# Custom CSS styling
st.markdown("""
    <style>
        .title-style {
            text-align: center;
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .desc-style {
            text-align: center;
            font-size: 1.2em;
            margin-bottom: 30px;
            color: #ccc;
        }
        .stButton > button {
            font-size: 16px;
            padding: 0.6em 1.5em;
            border-radius: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            display: block;
            margin: 0 auto;
        }
        .stButton > button:hover {
            background-color: #45a049;
            transition: background-color 0.3s ease;
        }
    </style>
""", unsafe_allow_html=True)

# Title and description
st.markdown("<div class='title-style'>👋 Welcome to Sign Detect</div>", unsafe_allow_html=True)
st.markdown("<div class='desc-style'>Use your webcam to detect real-time hand gestures and translate them into alphabets using machine learning.</div>", unsafe_allow_html=True)

# Image display (centered using HTML + base64)
image_path = "images/homepage.jpg"
if os.path.exists(image_path):
    with open(image_path, "rb") as img_file:
        img_bytes = img_file.read()
        img_base64 = base64.b64encode(img_bytes).decode()
        st.markdown(f"""
            <div style='text-align: center;'>
                <img src="data:image/jpeg;base64,{img_base64}" width="300" style="border-radius: 10px;" alt="Sign Language App"/>
                <p style='margin-top: 8px; color: #ccc;'>Sign Language App</p>
            </div>
        """, unsafe_allow_html=True)
else:
    st.warning(f"Image not found at: {image_path}")

# Vertical Navigation Buttons
if st.button("📷 Go to Sign Language Detection"):
    st.switch_page("pages/_Sign_Language_Detection.py")

if st.button("👨‍💻 About the Developers"):
    st.switch_page("pages/_About_Developers.py")
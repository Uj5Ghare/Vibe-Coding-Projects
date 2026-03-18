import streamlit as st
import base64
import os

st.set_page_config(page_title="About the Developers", layout="wide")

# Function to convert image to base64
def get_base64_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode()

# Header
st.markdown("""
    <style>
        .center-text {
            text-align: center;
        }
        .profile-img {
            width: 180px;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }
        .profile-img:hover {
            transform: scale(1.05);
        }
        .dev-role {
            font-size: 1em;
            color: #ccc;
        }
        .social-link {
            text-decoration: none;
            font-weight: bold;
            color: #4CAF50;
        }
    </style>

    <h1 class='center-text'>👨‍💻 Meet the Developers</h1>
    <p class='center-text' style='font-size: 1.1em;'>
        This application was developed to assist individuals with hearing or speech impairments
        by enabling real-time sign language detection using machine learning.
    </p>
""", unsafe_allow_html=True)

st.divider()

# Team Members Section
st.markdown("## 👥 Team Members")

# Load and encode images
prem_img_path = "images/prem.jpg"
sadhu_img_path = "images/sadhu.jpg"

prem_base64 = get_base64_image(prem_img_path) if os.path.exists(prem_img_path) else ""
sadhu_base64 = get_base64_image(sadhu_img_path) if os.path.exists(sadhu_img_path) else ""

col1, col2 = st.columns([1, 1])

with col1:
    st.markdown("<div class='center-text'>", unsafe_allow_html=True)
    if prem_base64:
        st.markdown(
            f"<img src='data:image/jpeg;base64,{prem_base64}' class='profile-img'>",
            unsafe_allow_html=True
        )
    st.markdown("*Prem Trivedi*", unsafe_allow_html=True)
    st.markdown("<div class='dev-role'>Role: UI/UX Design</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

with col2:
    st.markdown("<div class='center-text'>", unsafe_allow_html=True)
    if sadhu_base64:
        st.markdown(
            f"<img src='data:image/jpeg;base64,{sadhu_base64}' class='profile-img'>",
            unsafe_allow_html=True
        )
    st.markdown("*Jay Sadhu*", unsafe_allow_html=True)
    st.markdown("<div class='dev-role'>Role:  Model Training & Integration</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

# External Links
st.divider()
st.markdown("## 🔗 Connect With Us")

col_left, col_mid, col_right = st.columns(3)
with col_mid:
    st.markdown("""
    <div style='text-align: center; font-size: 1.1em;'>
        <a class='social-link' href='https://github.com/PremT0301/SIGN-DETECT' target='_blank'>🌐 GitHub</a><br><br>
        <a class='social-link' href='https://www.linkedin.com/in/prem-trivedi-/' target='_blank'>🔗 Prem's LinkedIn</a><br><br>
        <a class='social-link' href='https://www.linkedin.com/in/jay-sadhu-/' target='_blank'>🔗 Jay's LinkedIn</a><br><br>
        <a class='social-link' href='/' target='_self'>🏠 Back to Home</a>
    </div>
    """, unsafe_allow_html=True)
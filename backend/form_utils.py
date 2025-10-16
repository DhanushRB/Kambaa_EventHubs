import pandas as pd
import qrcode
from PIL import Image, ImageDraw, ImageFont
import io
import base64
import json
import os
from typing import List, Dict, Any
import uuid

def parse_excel_to_questions(file_content: bytes, form_type: str) -> List[Dict[str, Any]]:
    """Parse Excel file and convert to form questions"""
    try:
        # Read Excel file
        df = pd.read_excel(io.BytesIO(file_content))
        
        questions = []
        
        # Expected columns: Question, Type, Options, Correct_Answer, Points, Required
        for index, row in df.iterrows():
            if pd.isna(row.get('Question', '')):
                continue
                
            question_text = str(row.get('Question', '')).strip()
            if not question_text:
                continue
                
            question_type = str(row.get('Type', 'multiple_choice')).lower().strip()
            
            # Parse options (comma-separated)
            options_str = str(row.get('Options', ''))
            options = []
            if options_str and options_str != 'nan':
                options = [opt.strip() for opt in options_str.split(',') if opt.strip()]
            
            # Default options for choice questions if none provided
            if question_type in ['multiple_choice', 'single_choice'] and not options:
                options = ['Option 1', 'Option 2', 'Option 3', 'Option 4']
            
            correct_answer = str(row.get('Correct_Answer', '')).strip()
            if correct_answer == 'nan':
                correct_answer = ''
                
            points = 0
            if form_type == 'quiz':
                try:
                    points = int(row.get('Points', 1))
                except (ValueError, TypeError):
                    points = 1
            
            is_required = True
            try:
                required_val = str(row.get('Required', 'True')).lower()
                is_required = required_val in ['true', '1', 'yes', 'y']
            except:
                is_required = True
            
            question = {
                'question_text': question_text,
                'question_type': question_type,
                'options': options,
                'is_required': is_required,
                'points': points,
                'correct_answer': correct_answer
            }
            
            questions.append(question)
        
        return questions
        
    except Exception as e:
        raise ValueError(f"Error parsing Excel file: {str(e)}")

def generate_qr_code_with_branding(form_link: str, form_title: str, logo_path: str = None, 
                                 event_title: str = None, description: str = None) -> str:
    """Generate QR code with branding elements"""
    try:
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(form_link)
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Create branded template
        template_width = 800
        template_height = 600
        
        # Create new image with white background
        template = Image.new('RGB', (template_width, template_height), 'white')
        draw = ImageDraw.Draw(template)
        
        # Try to load custom font, fallback to default
        try:
            title_font = ImageFont.truetype("arial.ttf", 36)
            subtitle_font = ImageFont.truetype("arial.ttf", 24)
            desc_font = ImageFont.truetype("arial.ttf", 18)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            desc_font = ImageFont.load_default()
        
        # Add logo if provided
        logo_y = 50
        if logo_path and os.path.exists(logo_path):
            try:
                logo = Image.open(logo_path)
                logo = logo.resize((100, 100), Image.Resampling.LANCZOS)
                template.paste(logo, (50, logo_y))
                logo_y += 120
            except:
                pass
        
        # Add event title
        if event_title:
            draw.text((50, logo_y), event_title, fill="black", font=title_font)
            logo_y += 50
        
        # Add form title
        draw.text((50, logo_y), f"Form: {form_title}", fill="black", font=subtitle_font)
        logo_y += 40
        
        # Add description
        if description:
            # Word wrap description
            words = description.split()
            lines = []
            current_line = []
            for word in words:
                current_line.append(word)
                if len(' '.join(current_line)) > 60:  # Approximate character limit
                    if len(current_line) > 1:
                        current_line.pop()
                        lines.append(' '.join(current_line))
                        current_line = [word]
                    else:
                        lines.append(word)
                        current_line = []
            if current_line:
                lines.append(' '.join(current_line))
            
            for line in lines[:3]:  # Max 3 lines
                draw.text((50, logo_y), line, fill="gray", font=desc_font)
                logo_y += 25
        
        # Add QR code
        qr_size = 200
        qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        qr_x = template_width - qr_size - 50
        qr_y = (template_height - qr_size) // 2
        template.paste(qr_img, (qr_x, qr_y))
        
        # Add scan instruction
        draw.text((qr_x, qr_y + qr_size + 20), "Scan to access form", fill="gray", font=desc_font)
        
        # Save to bytes
        img_buffer = io.BytesIO()
        template.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Convert to base64
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        return img_base64
        
    except Exception as e:
        # Fallback: simple QR code without branding
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(form_link)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return base64.b64encode(img_buffer.getvalue()).decode()

def save_uploaded_file(file_content: bytes, filename: str, upload_type: str) -> str:
    """Save uploaded file and return the file path"""
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.getcwd(), 'uploads', upload_type)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Return relative path for database storage
        return f"uploads/{upload_type}/{unique_filename}"
        
    except Exception as e:
        raise ValueError(f"Error saving file: {str(e)}")

def create_form_template_excel() -> bytes:
    """Create a template Excel file for form import"""
    try:
        # Create sample data
        data = {
            'Question': [
                'What is your favorite color?',
                'Rate your experience (1-5)',
                'Do you recommend this service?',
                'Please provide additional feedback'
            ],
            'Type': [
                'multiple_choice',
                'rating',
                'yes_no',
                'text'
            ],
            'Options': [
                'Red, Blue, Green, Yellow',
                '',
                '',
                ''
            ],
            'Correct_Answer': [
                'Blue',
                '',
                'Yes',
                ''
            ],
            'Points': [1, 1, 1, 0],
            'Required': [True, True, False, False]
        }
        
        df = pd.DataFrame(data)
        
        # Save to bytes
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Questions')
            
            # Add instructions sheet
            instructions = pd.DataFrame({
                'Field': ['Question', 'Type', 'Options', 'Correct_Answer', 'Points', 'Required'],
                'Description': [
                    'The question text',
                    'Question type: multiple_choice, single_choice, text, rating, yes_no',
                    'For choice questions: comma-separated options (e.g., "Option1, Option2, Option3")',
                    'For quiz questions: the correct answer',
                    'Points for correct answer (quiz only)',
                    'Whether the question is required (True/False)'
                ],
                'Example': [
                    'What is your favorite color?',
                    'multiple_choice',
                    'Red, Blue, Green, Yellow',
                    'Blue',
                    '1',
                    'True'
                ]
            })
            instructions.to_excel(writer, index=False, sheet_name='Instructions')
        
        buffer.seek(0)
        return buffer.getvalue()
        
    except Exception as e:
        raise ValueError(f"Error creating template: {str(e)}")
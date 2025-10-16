#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from form_utils import generate_qr_code_with_branding

def test_qr_generation():
    try:
        print("Testing QR code generation...")
        
        # Test basic QR code generation
        form_link = "https://events.kambaa.ai/forms/fill/test123"
        form_title = "Test Form"
        
        qr_base64 = generate_qr_code_with_branding(
            form_link=form_link,
            form_title=form_title,
            description="This is a test form"
        )
        
        if qr_base64:
            print("SUCCESS: QR code generation successful!")
            print(f"Generated base64 length: {len(qr_base64)}")
            return True
        else:
            print("ERROR: QR code generation failed - no data returned")
            return False
            
    except Exception as e:
        print(f"ERROR: QR code generation failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_qr_generation()
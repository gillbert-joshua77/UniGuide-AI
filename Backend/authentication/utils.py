import random   # Used to generate random OTP numbers
from django.conf import settings   # Access Django settings (email config etc.)
from django.core.mail import EmailMessage   # Class to send emails
from .models import *   # Import all models (User, OneTimePassword, etc.)


# Function to generate a 6-digit OTP
def generateOtp():
  otp = ""   # Initialize empty string for OTP

  for i in range(6):   # Loop 6 times to create 6-digit OTP
    otp += str(random.randint(1,9))   # Add random digit (1–9) to OTP
    
  return otp   # Return generated OTP

 
# Function to send OTP to user's email
def send_code_to_user(email):

  Subject = "One Time passcode for Email verification"   # Email subject
  otp_code = generateOtp()   # Generate OTP

  user = User.objects.get(email=email)   # Get user object from database


  current_site = 'UniGuide AI'   # Application name

  # Email content with OTP
  email_body =  f"""
                    Hi {user.first_name},

                    Welcome to UniGuide AI!

                    To complete your registration, please use the OTP below:

                    🔐 OTP Code: {otp_code}

                    This code will expire in 5 minutes.

                    For your security, do not share this code with anyone.

                    If you didn’t request this, you can safely ignore this email.

                    Best regards,
                    UniGuide AI Team
                    """

  from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', getattr(settings, 'DEFAULTS_FROM_EMAIL', settings.EMAIL_HOST_USER))

  # Save or update OTP in database linked to user
  OneTimePassword.objects.update_or_create(user=user, defaults={'code': otp_code})

  # Create email object
  d_email = EmailMessage(
    subject=Subject,
    body=email_body,
    from_email=from_email,
    to=[email]
  )

  d_email.send(fail_silently=True)   # Send email


# Function to send a normal email (used for password reset etc.)
def send_normal_email(data):

  # Create email using data dictionary
  email = EmailMessage(
    subject=data['email_subject'],   # Subject from input data
    body=data['email_body'],         # Body from input data
    from_email=settings.EMAIL_HOST_USER,   # Sender email from settings
    to=[data['to_email']]            # Recipient email
  )

  email.send()   # Send email
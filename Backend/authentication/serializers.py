from tokenize import TokenError   # Exception related to token errors (note: may not match JWT TokenError)

from rest_framework import serializers   # DRF serializers for handling input/output data
from .models import User   # Import custom User model
from django.contrib.auth import authenticate   # Django authentication function
from rest_framework.exceptions import AuthenticationFailed   # Exception for auth failure
from django.contrib.auth.tokens import PasswordResetTokenGenerator   # Token generator for password reset
from django.utils.http import urlsafe_base64_encode   # Encode user ID safely in URL
from django.utils.encoding import smart_str ,smart_bytes   # Encoding utilities
from django.contrib.sites.shortcuts import get_current_site   # Get current domain
from django.urls import reverse   # Reverse URL by name
from django.conf import settings as django_settings
from .utils import *   # Import custom utility functions (like email sender)
from django.utils.encoding import smart_str , force_str   # Duplicate import (not changed)
from django.utils.http import urlsafe_base64_encode , urlsafe_base64_decode   # Encode/decode base64
from rest_framework_simplejwt.tokens import RefreshToken ,Token   # JWT token classes


# Serializer for user registration
class UserRegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(max_length=68, min_length=6, write_only=True)   # Password field (hidden in response)
    password2 = serializers.CharField(max_length=68, min_length=6, write_only=True)  # Confirm password

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password2']  # Fields required for registration

    def validate(self, attrs):
        password = attrs.get('password', '')
        password2 = attrs.get('password2', '')

        # Check if both passwords match
        if password != password2:
            raise serializers.ValidationError("password do not match")

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')   # Remove confirm password before saving

        # Create user using custom manager
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            password=validated_data.get('password'),
        )

        return user


# Serializer for login
class LoginSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(max_length=225)   # Email input
    password = serializers.CharField(max_length=225, write_only=True)   # Password input
    full_name =serializers.CharField(max_length = 255 ,read_only = True)   # Full name (output only)
    access_token =serializers.CharField(max_length = 255 ,read_only = True)   # Access JWT
    refresh_token =serializers.CharField(max_length = 255 ,read_only = True)  # Refresh JWT

    class Meta:
        model = User
        fields = ['email', 'password', 'full_name' ,'access_token' ,'refresh_token']

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        request = self.context.get('request')

        # Authenticate user with email & password
        user = authenticate(request=request, email=email, password=password)

        # If authentication fails
        if not user:
            raise AuthenticationFailed('Invalid credentials, try again')
        
        tokens = user.tokens()   # Generate JWT tokens

        # Check if email is verified
        if not user.is_verified:
            raise AuthenticationFailed('Email is not verified')

        # Return user data with tokens
        return {
            'email': user.email,
            'full_name': user.get_full_name,   
            'access_token': str(tokens.get('access')),
            'refresh_token': str(tokens.get('refresh')),  
        }


# Serializer to request password reset
class PasswordResetRequestSerializer(serializers.Serializer):

    email = serializers.EmailField(max_length = 255)   # Email input

    class Meta : 
        fields = ['email']

    def validate(self, attrs):
        email = attrs.get('email')

        # Check if user exists
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)

            # Encode user ID
            uidb64 =urlsafe_base64_encode(smart_bytes(user.id))

            # Generate reset token
            token = PasswordResetTokenGenerator().make_token(user)

            request = self.context.get('request')
            site_domain = get_current_site(request).domain   # Get current domain

            # Create reset URL
            relative_link = reverse('password-reset-confirm' ,kwargs={'uidb64' : uidb64 , 'token' : token})
            frontend_url = getattr(django_settings, 'FRONTEND_URL', 'http://localhost:5173')
            abslink = f"{frontend_url}/password-reset-confirm/{uidb64}/{token}/"

            # Email content
            email_body = f"""Subject: Reset Your Password - Uniguide AI

Hi,

We received a request to reset your password for your Uniguide AI account.

Click the link below to reset your password:
{abslink}

If you did not request this, please ignore this email. Your account is safe.

This link will expire in 10 minutes for security reasons.

Thanks,  
Uniguide AI Team"""
            
            # Data for sending email
            data = {
                'email_body' : email_body,
                'email_subject' : "Rset Your Password - UniGuide AI ",
                'to_email' : user.email
            }

            send_normal_email(data)   # Send reset email

        return super().validate(attrs) 
    

# Serializer to set new password
class SetNewPasswordSerializer(serializers.Serializer):
    password         = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    uidb64           = serializers.CharField(write_only=True)
    token            = serializers.CharField(write_only=True)

    class Meta:
        fields = ['password', 'confirm_password', 'uidb64', 'token']

    def validate(self, attrs):
        try:
            password         = attrs.get('password')
            confirm_password = attrs.get('confirm_password')
            uidb64           = attrs.get('uidb64')
            token            = attrs.get('token')

            if password != confirm_password:
                raise AuthenticationFailed('Passwords do not match')

            user_id = force_str(urlsafe_base64_decode(uidb64))
            user    = User.objects.get(id=user_id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                raise AuthenticationFailed('Token is invalid or expired')

            user.set_password(password)  # ← sets new password
            user.save()                  # ← THIS WAS MISSING — add this line

            return attrs

        except Exception as e:
            raise AuthenticationFailed('Token is invalid or expired')
    


# Serializer for logout (blacklisting refresh token)
class LogOutUserSerializer(serializers.Serializer):

    refresh_token = serializers.CharField()   # Refresh token input

    default_error_messages = {
        'bad_token' : ('Token is Invalid or has Expired')   # Custom error message
    }

    def validate(self, attrs):
        self.token =attrs.get('refresh_token')   # Store token

        return super().validate(attrs)
    
    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)   # Convert string to RefreshToken object
            token.blacklist()   # Blacklist the token (logout)
        except TokenError:
            return self.fail('bad_token')   # Raise error if token invalid
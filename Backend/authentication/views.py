from .serializers import *   # Import all serializers
from rest_framework.generics import GenericAPIView   # Base class for DRF generic views
from rest_framework.response import Response   # Used to return API responses
from rest_framework import status   # HTTP status codes
from .utils import *   # Import utility functions (OTP, email, etc.)
from .models import *   # Import models (User, OTP, etc.)
from rest_framework.views import APIView   # Base API view
from rest_framework.permissions import AllowAny, IsAuthenticated   # Permission classes
from django.utils.http import urlsafe_base64_decode   # Decode base64 user ID
from django.utils.encoding import smart_str , DjangoUnicodeDecodeError   # Encoding utilities
from django.contrib.auth.tokens import PasswordResetTokenGenerator   # Token generator for password reset


# View to handle user registration
class RegisterUserView(GenericAPIView):

    serializer_class = UserRegisterSerializer   # Serializer for registration

    def post(self, request):
        print("REQUEST DATA:", request.data)   # Debug: print incoming request data

        serializer = self.serializer_class(data=request.data)   # Initialize serializer

        if serializer.is_valid(raise_exception=True):   # Validate data
            user = serializer.save()   # Save user to database

            send_code_to_user(user.email)   # Send OTP email after registration

            return Response({
                'data': serializer.data,
                'message': f"{user.first_name} thanks for signing up, a passcode was sent",
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# View to verify user's email using OTP
class VerifyUserEmail(APIView):

    def post(self, request):
        otpcode = request.data.get('otp')   # Get OTP from request

        if not otpcode:
            return Response({
                'message': 'OTP not provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_code_obj = OneTimePassword.objects.get(code=otpcode)   # Get OTP object
            user = user_code_obj.user   # Get related user

            # If user is not verified
            if not user.is_verified:
                user.is_verified = True   # Mark as verified
                user.save()

                return Response({
                    'message': 'Account email verified successfully'
                }, status=status.HTTP_200_OK)

            return Response({
                'message': 'User already verified'
            }, status=status.HTTP_200_OK)

        except OneTimePassword.DoesNotExist:
            return Response({
                'message': 'Invalid OTP'
            }, status=status.HTTP_404_NOT_FOUND)
        

# View for user login
class LoginUerView(GenericAPIView):

    serializer_class = LoginSerializer   # Login serializer

    def post(self ,request):
        serializer = self.serializer_class(data = request.data , context = {'request':request })   # Pass request context
        serializer.is_valid(raise_exception= True)   # Validate login
        return Response(serializer.validated_data ,status=status.HTTP_200_OK)   # Return tokens & user data
    

# Test view to check authentication (protected route)
class TestAuthenticationView(GenericAPIView):
    permission_classes = [IsAuthenticated]   # Only accessible if authenticated

    def get(self , request):
        data = { 
            'msg': 'Its Works'   # Simple response message
        }
        return Response(data ,status=status.HTTP_200_OK)


# View to request password reset email
class PasswordResetRequestView(GenericAPIView):

    serializer_class = PasswordResetRequestSerializer   # Serializer for email input
    permission_classes = [AllowAny]   # Anyone can access this endpoint

    def post(self , request):
        serializers = self.serializer_class(data = request.data ,context = {'request' : request})   # Pass request
        serializers.is_valid(raise_exception=True)   # Validate input

        return Response ({
            'message' : 'A link has been sent to your email to reset your password'
        } , status= status.HTTP_200_OK)
    

# View to confirm password reset link
class PasswordResetConfirm(GenericAPIView):
    def get(self , request ,uidb64 , token): 
        try:
            user_id= smart_str(urlsafe_base64_decode(uidb64))   # Decode user ID
            user = User.objects.get(id = user_id)   # Get user

            print("PASSWORD RESET EMAIL TRIGGERED")   # Debug log

            # Validate token
            if not PasswordResetTokenGenerator().check_token(user , token):
                return Response({
                    'message' : 'token is invalid or has expired'
                } , status=status.HTTP_401_UNAUTHORIZED)

            return Response({
                'success' : True,
                'message' : "Credentials id valid ",
                'uidb64' : uidb64 ,
                'token' : token
            } , status= status.HTTP_200_OK)

        except DjangoUnicodeDecodeError:
            return Response({
                'message' : 'Token is invalid or has expired'
            },status= status.HTTP_401_UNAUTHORIZED)
        

# View to set new password
class SetNewPassword(GenericAPIView):

    serializer_class = SetNewPasswordSerializer   # Serializer for new password

    def patch(self ,request):
        serializers = self.serializer_class(data = request.data)   # Initialize serializer
        serializers.is_valid(raise_exception=True)   # Validate data

        return Response({
            'message' : "password reset successful",
        },status= status.HTTP_200_OK)
    

# View to logout user (blacklist refresh token)
class LogOutUserView(GenericAPIView):

    serializer_class = LogOutUserSerializer   # Serializer for logout
    permission_classes = [IsAuthenticated]   # Only logged-in users can logout

    def post(self, request):
        serializers = self.serializer_class(data = request.data)   # Initialize serializer
        serializers.is_valid(raise_exception=True)   # Validate token
        serializers.save()   # Blacklist refresh token

        return Response(status= status.HTTP_200_OK)   # No content response
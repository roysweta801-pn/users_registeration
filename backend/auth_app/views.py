from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    TwoFactorSetupSerializer, TwoFactorVerifySerializer, TwoFactorDisableSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer, ChangePasswordSerializer
)
from .models import PasswordResetToken
import secrets

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    """User login endpoint"""
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }
        
        # Check if 2FA is enabled
        if user.is_2fa_enabled:
            response_data['requires_2fa'] = True
            response_data['message'] = '2FA verification required'
        
        return Response(response_data, status=status.HTTP_200_OK)


class LogoutView(generics.GenericAPIView):
    """User logout endpoint"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile endpoint"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class TwoFactorSetupView(generics.GenericAPIView):
    """2FA setup endpoint"""
    serializer_class = TwoFactorSetupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = self.get_serializer(instance=request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class TwoFactorVerifyView(generics.GenericAPIView):
    """2FA verification endpoint"""
    serializer_class = TwoFactorVerifySerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.is_2fa_enabled = True
        user.save()
        
        return Response({
            'message': '2FA enabled successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class TwoFactorDisableView(generics.GenericAPIView):
    """2FA disable endpoint"""
    serializer_class = TwoFactorDisableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.is_2fa_enabled = False
        user.totp_secret = None
        user.backup_codes = []
        user.save()
        
        return Response({
            'message': '2FA disabled successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class PasswordResetRequestView(generics.GenericAPIView):
    """Password reset request endpoint"""
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate reset token
        token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(user=user, token=token)
        
        # Send email
        reset_url = f"{request.scheme}://{request.get_host()}/reset-password?token={token}"
        
        html_message = render_to_string('auth_app/password_reset_email.html', {
            'user': user,
            'reset_url': reset_url
        })
        plain_message = strip_tags(html_message)
        
        try:
            send_mail(
                subject='Password Reset Request',
                message=plain_message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            
            return Response({
                'message': 'Password reset email sent successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Failed to send email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordResetConfirmView(generics.GenericAPIView):
    """Password reset confirmation endpoint"""
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reset_token = serializer.validated_data['reset_token']
        new_password = serializer.validated_data['new_password']
        
        # Update password
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset_token.is_used = True
        reset_token.save()
        
        return Response({
            'message': 'Password reset successful'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_2fa_login(request):
    """Verify 2FA during login"""
    token = request.data.get('token')
    email = request.data.get('email')
    is_backup_code = request.data.get('is_backup_code', False)
    
    if not token or not email:
        return Response({
            'error': 'Token and email are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if not user.is_2fa_enabled:
        return Response({
            'error': '2FA is not enabled for this user'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify token
    if is_backup_code:
        if not user.verify_backup_code(token):
            return Response({
                'error': 'Invalid backup code'
            }, status=status.HTTP_400_BAD_REQUEST)
    else:
        if not user.verify_totp(token):
            return Response({
                'error': 'Invalid 2FA token'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'message': '2FA verification successful',
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    }, status=status.HTTP_200_OK) 
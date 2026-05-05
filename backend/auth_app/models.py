from django.contrib.auth.models import AbstractUser
from django.db import models
import pyotp
import qrcode
import io
import base64
from django.conf import settings


class User(AbstractUser):
    """Custom User model with 2FA support"""
    email = models.EmailField(unique=True)
    is_2fa_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=32, blank=True, null=True)
    backup_codes = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def generate_totp_secret(self):
        """Generate a new TOTP secret for 2FA"""
        self.totp_secret = pyotp.random_base32()
        return self.totp_secret

    def get_totp_uri(self):
        """Get the TOTP URI for QR code generation"""
        if not self.totp_secret:
            return None
        
        totp = pyotp.TOTP(self.totp_secret)
        return totp.provisioning_uri(
            name=self.email,
            issuer_name=settings.TOTP_ISSUER_NAME
        )

    def get_qr_code(self):
        """Generate QR code as base64 string"""
        uri = self.get_totp_uri()
        if not uri:
            return None
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{image_base64}"

    def verify_totp(self, token):
        """Verify TOTP token"""
        if not self.totp_secret:
            return False
        
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(token)

    def generate_backup_codes(self, count=10):
        """Generate backup codes for 2FA"""
        import secrets
        codes = []
        for _ in range(count):
            code = secrets.token_hex(4).upper()
            codes.append(code)
        
        self.backup_codes = codes
        return codes

    def verify_backup_code(self, code):
        """Verify backup code and remove it if valid"""
        if code in self.backup_codes:
            self.backup_codes.remove(code)
            self.save()
            return True
        return False


class PasswordResetToken(models.Model):
    """Model for password reset tokens"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        """Check if token is expired (24 hours)"""
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(hours=24) 
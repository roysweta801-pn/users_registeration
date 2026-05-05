from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PasswordResetToken


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_2fa_enabled', 'is_active', 'date_joined')
    list_filter = ('is_2fa_enabled', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('2FA Settings', {'fields': ('is_2fa_enabled', 'totp_secret', 'backup_codes')}),
    )
    
    readonly_fields = ('totp_secret', 'backup_codes', 'date_joined', 'last_login')


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'created_at', 'is_used', 'is_expired')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__email', 'user__username', 'token')
    ordering = ('-created_at',)
    readonly_fields = ('token', 'created_at') 
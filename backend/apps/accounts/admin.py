from django.contrib import admin, messages
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.admin import UserAdmin

from .models import ProviderApplication, User


@admin.register(User)
class AccountAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("PhysioHome", {"fields": ("full_name", "phone", "role", "account_status", "updated_at")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("PhysioHome", {"fields": ("full_name", "phone", "role", "account_status")}),
    )
    list_display = ("username", "email", "role", "account_status", "is_staff", "is_active")
    list_filter = UserAdmin.list_filter + ("role", "account_status")
    search_fields = UserAdmin.search_fields + ("full_name", "phone")
    readonly_fields = ("updated_at",)



@admin.register(ProviderApplication)
class ProviderApplicationAdmin(admin.ModelAdmin):
    list_display = ("user", "license_number", "verification_status", "reviewed_at")
    list_filter = ("verification_status",)
    search_fields = ("user__email", "user__full_name", "license_number")
    readonly_fields = ("user", "license_number", "specialty", "services", "experience", "service_area", "verification_status", "reviewed_by", "reviewed_at", "pricing_reviewed_at", "pricing_reviewed_by")
    actions = ("approve", "reject", "suspend")

    def has_view_permission(self, request, obj=None):
        return request.user.role == User.Role.ADMIN and super().has_view_permission(request, obj)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return request.user.role == User.Role.ADMIN and super().has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        with transaction.atomic():
            User.objects.select_for_update(no_key=True).get(pk=obj.user_id)
            if {"pricing_tier", "consultant_fee"}.intersection(form.changed_data):
                obj.pricing_reviewed_by = request.user
                obj.pricing_reviewed_at = timezone.now() if obj.pricing_tier else None
            super().save_model(request, obj, form, change)

    def review(self, request, queryset, status):
        if not self.has_change_permission(request):
            return
        with transaction.atomic():
            applications = list(queryset.select_for_update())
            if any(not application.review_note.strip() for application in applications):
                self.message_user(request, "Save a review note for every selected application before changing its status.", messages.ERROR)
                return
            for application in applications:
                before = application.verification_status
                application.verification_status = status
                application.reviewed_by = request.user
                application.reviewed_at = timezone.now()
                application.save(update_fields=["verification_status", "reviewed_by", "reviewed_at"])
                self.log_change(request, application, f"Verification {before} -> {status}. Reason: {application.review_note}")
        self.message_user(request, "Verification status updated.")

    @admin.action(description="Approve credentials after manual verification")
    def approve(self, request, queryset):
        self.review(request, queryset, ProviderApplication.Status.APPROVED)

    @admin.action(description="Reject verification")
    def reject(self, request, queryset):
        self.review(request, queryset, ProviderApplication.Status.REJECTED)

    @admin.action(description="Suspend verification")
    def suspend(self, request, queryset):
        self.review(request, queryset, ProviderApplication.Status.SUSPENDED)

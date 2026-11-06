from rest_framework.permissions import BasePermission

from .models import ProviderApplication, User


class IsActiveAccount(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and user.account_status == User.AccountStatus.ACTIVE)


class IsPatient(IsActiveAccount):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.Role.PATIENT


class IsApprovedPhysiotherapist(IsActiveAccount):
    message = "An approved physiotherapist account is required."

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.role == User.Role.PHYSIOTHERAPIST
            and ProviderApplication.objects.filter(user=request.user, verification_status=ProviderApplication.Status.APPROVED).exists()
        )


class IsPlatformAdmin(IsActiveAccount):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.Role.ADMIN and request.user.is_staff


class IsAccountOwner(IsActiveAccount):
    def has_object_permission(self, request, view, obj):
        return obj.pk == request.user.pk

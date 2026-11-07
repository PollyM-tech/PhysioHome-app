from django.contrib import admin
from django.urls import include, path
from django.contrib.auth.views import PasswordResetCompleteView
from apps.accounts.views import MeView, ResetPasswordConfirmView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/me/", MeView.as_view(), name="current-user"),
    path("auth/reset/<uidb64>/<token>/", ResetPasswordConfirmView.as_view(success_url="/auth/reset/done/"), name="password_reset_confirm"),
    path("auth/reset/done/", PasswordResetCompleteView.as_view(template_name="accounts/password_reset_complete.html"), name="password_reset_complete"),
    path("api/v1/", include("apps.core.urls")),
    path("api/v1/", include("apps.marketplace.urls")),
]

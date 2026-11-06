from django.contrib.admin import AdminSite


class PhysioAdminSite(AdminSite):
    site_header = "PhysioHome Administration"
    site_title = "PhysioHome"

    def has_permission(self, request):
        return (
            super().has_permission(request)
            and request.user.role == "admin"
            and request.user.account_status == "active"
        )

from django.contrib import admin
from .models import SupportTicket, BookingEvent

@admin.register(SupportTicket)
class SupportAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "user", "status", "created_at")
    list_filter = ("status",)
    readonly_fields = ("user", "subject", "body", "created_at")

    def has_add_permission(self, request):
        return False

@admin.register(BookingEvent)
class EventAdmin(admin.ModelAdmin):
    list_display = ("booking", "action", "actor", "created_at")
    readonly_fields = ("booking", "action", "actor", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    def has_view_permission(self, request, obj=None):
        return request.user.role == "admin" and super().has_view_permission(request, obj)

    def has_change_permission(self, request, obj=None):
        return request.user.role == "admin" and super().has_change_permission(request, obj)

    list_display = ("id", "booking", "amount", "status", "created_at")
    list_filter = ("status",)
    fields = ("id", "booking", "amount", "phone", "status", "checkout_id", "merchant_id", "created_at", "checked_at", "result_code")
    readonly_fields = fields

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

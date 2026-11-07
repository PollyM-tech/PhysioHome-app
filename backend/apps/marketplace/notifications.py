from .models import Notification, PushDevice, PushDelivery, PatientProfile


def notify_patient(booking, kind):
    messages = {
        "created": ("Request submitted", "Your physiotherapy request has been submitted. You can follow its progress in Bookings."),
        "accepted": ("Physiotherapist accepted", "Your physiotherapist has accepted the request. You can view the appointment in Bookings."),
        "no_match": ("No available match", "No suitable physiotherapist accepted this request. Try another time or choose a physiotherapist."),
        "expired": ("Search expired", "Your search has expired without an acceptance. You can submit another request."),
        "cancelled": ("Booking cancelled", "Your physiotherapy request has been cancelled."),
    }
    title, body = messages[kind]
    create_notification(booking, kind, title, body)


def create_notification(booking, kind, title, body):
    item, created = Notification.objects.get_or_create(user_id=booking.patient_id, booking=booking, kind=kind, defaults={"title": title, "body": body})
    if created and PatientProfile.objects.filter(user_id=booking.patient_id, push_enabled=True).exists():
        PushDelivery.objects.bulk_create([PushDelivery(notification=item, device=device) for device in PushDevice.objects.filter(user_id=booking.patient_id, active=True)], ignore_conflicts=True)
    return item

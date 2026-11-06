from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

User = get_user_model()


class AccountTests(TestCase):
    def test_new_users_are_patients_without_admin_privileges(self):
        user = User.objects.create_user(username="patient", password="test-password")
        self.assertEqual(user.role, User.Role.PATIENT)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertNotEqual(user.password, "test-password")

    def test_superusers_have_admin_role(self):
        user = User.objects.create_superuser(username="operator", password="test-password")
        self.assertEqual(user.role, User.Role.ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_suspended_users_cannot_authenticate(self):
        user = User.objects.create_user(username="suspended", password="test-password")
        user.account_status = User.AccountStatus.SUSPENDED
        user.is_active = False
        user.save()
        self.assertIsNone(authenticate(username="suspended", password="test-password"))

    def test_active_suspended_state_is_rejected(self):
        user = User(username="invalid", account_status=User.AccountStatus.SUSPENDED)
        with self.assertRaises(ValidationError):
            user.full_clean()
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                user.save()

    def test_database_rejects_invalid_role(self):
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                User.objects.create_user(username="invalid-role", role="unknown")

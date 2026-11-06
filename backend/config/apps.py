from django.contrib.admin.apps import AdminConfig


class PhysioAdminConfig(AdminConfig):
    default_site = "config.admin.PhysioAdminSite"

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


# Register your models here.
class CustomUserAdmin(UserAdmin):
    # Make it a dict then add field and convert back to items
    # not most efficient but easier to expand on in future if needed
    fieldsets_dict = {name: options for name, options in UserAdmin.fieldsets}
    if 'Permissions' in fieldsets_dict:
        permissions_fields = fieldsets_dict['Permissions']['fields']
        fieldsets_dict['Permissions']['fields'] = permissions_fields + ('is_test_account',)
    fieldsets = tuple(fieldsets_dict.items())

    list_display = UserAdmin.list_display + ('is_test_account',)
    list_filter = UserAdmin.list_filter + ('is_test_account',)


admin.site.register(User, CustomUserAdmin)

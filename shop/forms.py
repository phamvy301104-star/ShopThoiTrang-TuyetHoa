from django import forms

from .models import Account


class ProfileForm(forms.ModelForm):
    class Meta:
        model = Account
        fields = ("full_name", "email", "phone", "address", "avatar")
        labels = {
            "full_name": "Họ tên",
            "email": "Email",
            "phone": "Số điện thoại",
            "address": "Địa chỉ",
            "avatar": "Ảnh đại diện",
        }
        widgets = {
            "full_name": forms.TextInput(attrs={"class": "form-control", "required": True}),
            "email": forms.EmailInput(attrs={"class": "form-control"}),
            "phone": forms.TextInput(attrs={"class": "form-control"}),
            "address": forms.TextInput(attrs={"class": "form-control"}),
            "avatar": forms.ClearableFileInput(attrs={"class": "form-control", "accept": "image/*"}),
        }

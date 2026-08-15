# students/serializers.py
from rest_framework import serializers
from .models import Skill, Application

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'percentage', 'color']


class AppSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['role', 'company', 'status', 'color']
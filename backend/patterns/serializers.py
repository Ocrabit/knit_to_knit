from re import fullmatch

from rest_framework import serializers
from .models import Pattern, Swatch, Torso_Projection, Sleeve_Projection, SeparatedSweater


def set_default_if_none(instance, data):
    """
    Replace None values with model's default values in the provided data dictionary.
    """
    for field in instance._meta.fields:
        if data.get(field.name) is None and not field.null:
            default_value = field.get_default()  # Get default value using Django's built-in method
            data[field.name] = default_value
    return data


class GetPatternSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pattern
        fields = ['id', 'name', 'content', 'created_on', 'edited_on']


class SwatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Swatch
        exclude = ['pattern', 'user']


class TorsoProjectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Torso_Projection
        exclude = ['sweater']

    def to_internal_value(self, data):
        """
        Fix nulls before validation by replacing them with default values.
        """
        instance = self.Meta.model()
        data = set_default_if_none(instance, data)
        print('Torso Null Fixed Data:', data, flush=True)
        return super().to_internal_value(data)


class SleeveProjectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sleeve_Projection
        exclude = ['sweater']

    def to_internal_value(self, data):
        """
        Fix nulls before validation by replacing them with default values.
        """
        instance = self.Meta.model()
        data = set_default_if_none(instance, data)
        print('Sleeve Null Fixed Data:', data, flush=True)
        return super().to_internal_value(data)


class SeparatedSweaterSerializer(serializers.ModelSerializer):
    swatch = SwatchSerializer()
    torso_projection = TorsoProjectionSerializer()
    sleeve_projection = SleeveProjectionSerializer()

    class Meta:
        model = SeparatedSweater
        fields = ['name', 'content', 'swatch', 'torso_projection', 'sleeve_projection']

    def create(self, validated_data):
        swatch_data = validated_data.pop('swatch')
        torso_data = validated_data.pop('torso_projection')
        sleeve_data = validated_data.pop('sleeve_projection')

        user = self.context['request'].user

        separated_sweater = SeparatedSweater.objects.create(**validated_data)

        Swatch.objects.create(pattern=separated_sweater, user=user, **swatch_data)
        Torso_Projection.objects.create(sweater=separated_sweater, **torso_data)
        Sleeve_Projection.objects.create(sweater=separated_sweater, **sleeve_data)

        return separated_sweater
